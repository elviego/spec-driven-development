# Spec: Real-Time Payment Fraud Detection Service

**Status:** Complete  
**Created:** 2026-01-15  
**Last Updated:** 2026-03-05  
**Author:** Platform Engineering Team  
**Project Context:** [AGENTS.md](../templates/AGENTS.md) · [architecture.md](#) · [tech.md](#)  
**Compliance Reference:** PCI-DSS v4.0 · AML Policy FIN-007 · Internal Risk Framework v3

> 📝 *This is an annotated example spec demonstrating SDD applied to a financial services project.*  
> *Annotations appear in blockquotes like this one, explaining the rationale behind each section.*

---

## 1. Overview

This spec covers the implementation of a real-time fraud detection service for the retail payments platform. The service consumes transaction events from the payments Kafka topic, evaluates each transaction against a set of risk rules, and dispatches alerts to the case management system for transactions that exceed defined risk thresholds.

**Scope:** Kafka consumer, rule evaluation engine, alert dispatch, audit logging, and regulatory reporting export.  
**Out of Scope:** ML model training or retraining, dashboard UI, case management system internals, historical backfill.

> 📝 *The out-of-scope section is as important as the scope. It prevents the AI agent from making well-intentioned additions (e.g. building a dashboard) that are not part of this sprint.*

---

## 2. Background & Research

**Key documentation:**
- [Internal Payments Kafka Topic Schema](https://internal-docs/payments/kafka-schema-v3) — `transaction.v3` Avro schema; field definitions for `amount`, `merchant_category_code`, `card_present`, `customer_id`
- [Case Management API](https://internal-docs/case-mgmt/api-v2) — Alert creation endpoint, severity levels, required fields
- [AML Policy FIN-007](https://internal-docs/compliance/fin-007) — Transaction monitoring obligations; SAR filing thresholds ($5,000 USD / £3,500 GBP); 5-year retention
- [PCI-DSS v4.0 Requirement 10](https://pcisecuritystandards.org) — Audit log requirements for cardholder data environments

**Known constraints:**
- The `transaction.v3` Kafka topic uses Avro with Schema Registry — consumers must use the Confluent Avro deserialiser, not a generic JSON parser
- Case Management API rate limit: 50 alerts/second per service account; implement a token-bucket limiter
- SAR export must use FinCEN XML format version 2.0 — third-party library `fincen-xml-py` is approved; any alternative requires InfoSec sign-off

> 📝 *Constraints are specific and actionable. Generic statements like "the API may have rate limits" are not useful. The AI agent needs the actual number (50/s) to implement a correct rate limiter.*

---

## 3. Architecture

```
[Payments Kafka Topic: transaction.v3]
              │ (Avro / Schema Registry)
              ▼
[Fraud Detection Consumer Service]
       │               │
       ▼               ▼
[Rule Engine]    [Audit Log (append-only)]
       │
       ▼
[Alert Dispatcher] ──► [Case Management API]
       │
       ▼
[SAR Export Job] ──► [FinCEN Reporting Store]
```

**Sub-projects and phases:**

| Phase | Sub-project | Description |
|---|---|---|
| 1 | Consumer | Kafka consumer: ingest, validate, and deserialise `transaction.v3` events |
| 2 | Rule Engine | Evaluate velocity rules, amount thresholds, and MCC risk scoring |
| 3 | Alert Dispatch | Send high-risk transactions to Case Management API with deduplication |
| 4 | Audit Logging | Immutable audit log for all evaluations; PCI-DSS Req 10 compliant |
| 5 | SAR Export | Scheduled job to generate FinCEN-format SAR exports for compliance team |

**Service dependencies:**
- Phase 2 requires Phase 1 (working consumer with validated schema)
- Phase 3 requires Phase 2 (rule engine producing risk scores)
- Phase 4 runs in parallel with Phase 2 onward (logs all evaluations)
- Phase 5 is independent of Phases 3–4 but reads from the same audit log store

---

## 4. Phase Specifications

---

### Phase 1 — Kafka Consumer

**Goal:** Build a reliable consumer that ingests `transaction.v3` events, validates schema, and passes parsed transactions to downstream processors.

**Components to create:**
- `TransactionConsumer` — Kafka consumer using Confluent Python client + Avro deserialiser
- `TransactionValidator` — validates required fields; routes malformed events to DLQ
- Dead Letter Queue: `transaction.v3.dlq` topic (existing — do not create)
- Config: consumer group `fraud-detection-v1`

**Tools:** Python 3.12, `confluent-kafka==2.3.0`, `confluent-avro==1.8.0`.  
Reference: [Confluent Python client docs](https://docs.confluent.io/platform/current/clients/confluent-kafka-python)

**Configuration:**
- `auto.offset.reset`: `earliest` (do not miss events on first deploy)
- `enable.auto.commit`: `false` (manual commit after successful processing)
- `max.poll.interval.ms`: `300000`
- Schema Registry: `SCHEMA_REGISTRY_URL` env var (injected at deploy time)

**Local test:**
```bash
pytest tests/unit/test_transaction_consumer.py -v
pytest tests/unit/test_transaction_validator.py -v
```

**Integration test (staging):**
```bash
# Publish 100 synthetic test events to staging topic, verify consumption and DLQ routing
python tests/integration/seed_kafka.py --env=staging --fixture=tests/fixtures/transactions_mixed.json
pytest tests/integration/test_consumer_integration.py --env=staging -v
```

**Expected output:**
- Valid events: consumed, parsed, passed to rule engine stub (returns `{"status": "accepted"}`)
- Malformed events: routed to DLQ, logged with `event_id` and error reason
- No real transaction data in fixtures — use `tests/fixtures/transactions_mixed.json` (synthetic)

**Known constraints:**
- Avro schema v3 is backward-compatible with v2 — consumer must handle both during rollout window
- PAN field (`card_number`) must never appear in logs — mask to last 4 digits at point of ingestion

---

### Phase 2 — Rule Engine

**Goal:** Evaluate each parsed transaction against velocity, amount threshold, and MCC risk rules; produce a risk score and decision for each event.

**Components to create:**
- `RuleEngine` — orchestrates rule evaluation; returns `RiskDecision(score: int, triggered_rules: list, action: ALLOW | REVIEW | BLOCK)`
- `VelocityRule` — flags > 5 transactions in 10 minutes from the same `customer_id`
- `AmountThresholdRule` — flags transactions > $10,000 (AML) or > $5,000 in a 24h rolling window
- `MCCRiskRule` — applies risk multiplier based on merchant category code risk table (see `config/mcc_risk_table.json`)
- Redis cache for velocity counters (TTL: 1 hour)

**Tools:** Python 3.12, `redis-py==5.0.0`. MCC risk table: `config/mcc_risk_table.json` (provided by Risk team).

**Local test:**
```bash
pytest tests/unit/test_rule_engine.py -v
pytest tests/unit/test_velocity_rule.py -v
pytest tests/unit/test_amount_threshold_rule.py -v
```

**Expected output for test cases:**

| Scenario | Expected action |
|---|---|
| $500 transaction, low-risk MCC, first transaction | ALLOW |
| $12,000 single transaction | REVIEW (AML threshold) |
| 6th transaction in 9 minutes, same customer | REVIEW (velocity) |
| $500 transaction, MCC = 6051 (currency exchange) | REVIEW (high-risk MCC) |
| $15,000 + high-risk MCC + 4th transaction in 5 min | BLOCK |

**Known constraints:**
- AML threshold of $5,000 rolling window applies to cumulative customer spend, not per-transaction — requires Redis sorted set with TTL, not a simple counter
- MCC risk table is updated quarterly by the Risk team; service must reload without restart (watch `config/mcc_risk_table.json` for changes)

---

### Phase 3 — Alert Dispatch

**Goal:** Send `REVIEW` and `BLOCK` decisions to the Case Management API with deduplication to prevent duplicate case creation.

**Components to create:**
- `AlertDispatcher` — sends alerts to Case Management API; implements idempotency using `transaction_id` as deduplication key
- `RateLimiter` — token bucket; max 50 requests/second to Case Management API
- DynamoDB table: `fraud-alerts-sent` (key: `transaction_id`, TTL: 24h) — deduplication store

**Tools:** Python 3.12, `boto3` for DynamoDB, `httpx` for Case Management API calls.  
Reference: [Case Management API v2 docs](https://internal-docs/case-mgmt/api-v2)

**Case Management API payload:**
```json
{
  "transaction_id": "string (UUID)",
  "customer_id": "string",
  "amount": "number",
  "currency": "string (ISO 4217)",
  "risk_score": "integer (0–100)",
  "triggered_rules": ["string"],
  "action": "REVIEW | BLOCK",
  "timestamp": "ISO 8601"
}
```

> ⚠️ **PCI-DSS:** `card_number` must NOT appear in this payload. The Case Management system is not in PCI scope.

**Integration test (staging):**
```bash
pytest tests/integration/test_alert_dispatch.py --env=staging -v
# Verify: REVIEW alert created, BLOCK alert created, duplicate suppressed
```

**Expected output:** For a BLOCK decision, a case is created in Case Management within 2 seconds; a second dispatch with the same `transaction_id` returns `{"status": "deduplicated"}`.

---

### Phase 4 — Audit Logging

**Goal:** Record all rule evaluation outcomes in an immutable, queryable audit log compliant with PCI-DSS Requirement 10.

**Components to create:**
- `AuditLogger` — writes evaluation records to append-only DynamoDB table
- DynamoDB table: `fraud-audit-log` (partition key: `date`, sort key: `timestamp#transaction_id`; no delete allowed via IAM policy; TTL: 5 years per AML Policy FIN-007)

**Log record schema:**
```json
{
  "date": "YYYY-MM-DD",
  "timestamp": "ISO 8601",
  "transaction_id": "UUID",
  "customer_id": "string",
  "amount": "number",
  "currency": "string",
  "risk_score": "integer",
  "triggered_rules": ["string"],
  "action": "ALLOW | REVIEW | BLOCK",
  "card_last_four": "string (4 digits only — no full PAN)"
}
```

**Local test:**
```bash
pytest tests/unit/test_audit_logger.py -v
# Verify: record written correctly; PAN field absent; card_last_four present
```

---

### Phase 5 — SAR Export

**Goal:** Generate FinCEN-format Suspicious Activity Report (SAR) exports for the Compliance team on a scheduled basis.

**Components to create:**
- `SARExportJob` — Lambda function, scheduled daily at 06:00 UTC
- Queries `fraud-audit-log` for `REVIEW` and `BLOCK` decisions in the prior 24 hours where `amount >= 5000`
- Generates FinCEN XML v2.0 using `fincen-xml-py==0.4.1`
- Uploads to S3 bucket `compliance-sar-exports` (KMS-encrypted, access restricted to Compliance team IAM role)

**Tools:** Python 3.12, `fincen-xml-py==0.4.1`, `boto3`.  
Approved library confirmed by InfoSec 2026-01-10 (ticket SEC-2214).

**Staging test:**
```bash
pytest tests/integration/test_sar_export.py --env=staging --date=2026-01-01
# Verify: XML output validates against FinCEN XSD schema; S3 upload confirmed
```

---

## 5. Security & Compliance

**Authentication:** Service-to-service via IAM roles (no shared credentials)  
**Case Management API:** mTLS client certificate (cert rotation: 90 days; managed by cert-manager)  
**PII handling:**
- `card_number` (PAN): masked to last 4 digits at point of ingestion; never stored or transmitted in full outside PCI-scoped systems
- `customer_id`, `amount`: encrypted at rest in DynamoDB using AWS KMS key `alias/fraud-detection-key`
- No PII in application logs — use `customer_id` hash for log correlation

**Regulatory obligations:**
- PCI-DSS Req 3.4: PAN masked in all outputs and logs
- PCI-DSS Req 10: Audit log retained 12 months online, 5 years archived
- AML Policy FIN-007: SAR filing for transactions ≥ $5,000 meeting suspicion criteria; records retained 5 years

**Compliance sign-offs:**
- AML threshold configuration approved by Compliance: Jira COMP-318 (2026-01-12)
- Fail-open not applicable — this service does not gate transactions (advisory only)

**Security checklist:**
```
□ PAN never appears in logs, payloads to Case Management, or SAR exports
□ All DynamoDB tables encrypted with KMS
□ IAM roles are least-privilege — no wildcard actions
□ SAR export S3 bucket: access restricted to Compliance IAM role only
□ mTLS enforced for Case Management API calls
□ No real customer data in test fixtures
```

---

## 6. Testing Strategy

| Phase | Unit Test | Integration / Staging Test |
|---|---|---|
| Phase 1 | `pytest tests/unit/test_consumer*` | `tests/integration/test_consumer_integration.py` |
| Phase 2 | `pytest tests/unit/test_rule*` | `tests/integration/test_rule_engine_integration.py` |
| Phase 3 | `pytest tests/unit/test_alert*` | `tests/integration/test_alert_dispatch.py` |
| Phase 4 | `pytest tests/unit/test_audit*` | Reviewed via DynamoDB console in staging |
| Phase 5 | `pytest tests/unit/test_sar*` | `tests/integration/test_sar_export.py` |
| End-to-end | N/A | `tests/e2e/test_full_pipeline.py --env=staging` |

**Synthetic test data:** `tests/fixtures/transactions_mixed.json` — 1,000 synthetic transactions covering normal, velocity breach, AML threshold, high-risk MCC, and edge cases (zero-amount, multi-currency, missing fields).

---

## 7. Open Questions

- [x] Is fail-open acceptable if Case Management API is unavailable? → **No — queue alerts locally and retry. Confirmed with Compliance 2026-01-20.**
- [x] Should ALLOW decisions be audit-logged? → **Yes — PCI-DSS Req 10 requires logging all evaluation outcomes.**
- [ ] What is the correct FinCEN filer institution ID for the SAR export? → **Pending response from Compliance team (asked 2026-03-01).**

---

## 8. Change Log

### 2026-03-05
- Phase 5: Confirmed `fincen-xml-py==0.4.1` is the approved library (InfoSec ticket SEC-2214 closed). Updated Phase 5 tools section.

### 2026-02-14
- Phase 2: AML rolling window calculation moved from Redis counter to Redis sorted set after realising counter approach couldn't handle the 24h rolling window correctly. Updated VelocityRule design and test cases.

### 2026-01-20
- Phase 3: Fail-open for Case Management API rejected by Compliance. Switched to local queue-and-retry with exponential backoff. Phase 3 description and architecture diagram updated.

### 2026-01-15
- Initial draft.

---

*This spec follows the [SDD Methodology](../README.md)*
