# AGENTS.md — Project Steering Document

> This file is part of the project context (Memory Bank). It provides persistent context to AI coding
> agents across all sessions. Update it as architectural and compliance decisions are made.
>
> **Do not include real PII, account numbers, credentials, or production API keys in this file.**

---

## Project Overview

**Name:** [Project Name]  
**Purpose:** [One paragraph — what this project does and why it exists]  
**Domain:** [e.g. Payments / Fraud Detection / KYC / Lending / Reporting]  
**Status:** [Active / Prototype / Maintenance]  
**Repo:** [URL]  
**Regulatory scope:** [e.g. PCI-DSS Level 1 / GDPR / AML / FCA regulated]

---

## Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Language | [Python / Java / TypeScript / etc.] | [version] |
| Framework | [FastAPI / Spring Boot / Express / etc.] | [version] |
| Infrastructure | [CloudFormation / Terraform / Pulumi] | [version] |
| Cloud | [AWS / GCP / Azure] | Region: [region]; data residency: [jurisdiction] |
| Message bus | [Kafka / SQS / Pub/Sub] | [version / cluster] |
| Datastore | [PostgreSQL / DynamoDB / etc.] | [version / notes on encryption] |
| Secrets | [AWS Secrets Manager / Vault / etc.] | |

---

## Repository Structure

```
.
├── src/                  # Application code
├── iac/                  # Infrastructure as code
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/         # Synthetic test data only — no real customer data
├── specs/                # Feature spec documents (one per feature/sub-project)
├── AGENTS.md             # This file (project context)
└── README.md
```

---

## Architectural Principles

> These are the immutable decisions that apply to every change in this project.

1. **Modular services** — Each service is independently deployable and testable.
2. **Test before deploy** — Every component must pass unit and integration tests before being promoted to staging.
3. **Least privilege** — Every IAM role, service account, and API key is scoped to the minimum permissions required.
4. **Security and compliance in Phase 1** — Auth, PII handling, and encryption are designed and implemented at the earliest phase that requires them. Never retrofitted.
5. **Immutable audit logs** — All state-changing operations are logged with a timestamp, actor, and before/after state. Logs are append-only and retained per regulatory requirements.
6. **No real data in tests** — All tests use synthetic fixtures that mirror production schemas. Real PII is never used in development or CI environments.
7. [Add project-specific principles here]

---

## Data Classification

| Classification | Examples | Handling |
|---|---|---|
| **Restricted** | PAN, SSN, full account numbers | Encrypted at rest and in transit; never logged; masked in output |
| **Confidential** | Name, DOB, address, transaction amounts | Encrypted at rest; access-controlled; pseudonymised in non-prod |
| **Internal** | Aggregate metrics, anonymised reports | Internal access only |
| **Public** | API documentation, product descriptions | No restrictions |

---

## Conventions

**Naming:**
- Services: `[domain]-[function]-service` (e.g. `payments-fraud-detection-service`)
- Database tables: `[domain]_[entity]` in snake_case (e.g. `payments_transactions`)
- Specs: `specs/[feature-slug].md`
- Config keys: `SCREAMING_SNAKE_CASE` for env vars

**Branching:**
- `main` — production
- `staging` — pre-production
- `feature/[ticket-id]-[short-description]` — feature branches

**Testing:**
- Unit tests: `tests/unit/` — no external I/O, no network calls
- Integration tests: `tests/integration/` — run against staging services
- All tests use synthetic data from `tests/fixtures/`

---

## Compliance Reference

> Quick reference for commonly applicable requirements. For full details, see linked documents.

| Requirement | Scope | Key obligations |
|---|---|---|
| PCI-DSS Req 3.4 | Any service handling PANs | Mask PAN in logs (show last 4 only); encrypt stored PAN |
| GDPR Art. 25 | Any service processing EU resident data | Privacy by design; data minimisation; right to erasure |
| AML / FinCEN | Transaction monitoring | SAR filing threshold: $5,000 USD; retain records 5 years |
| [Add others] | | |

---

## Known Constraints

> Record project-specific constraints and workarounds discovered during development.

- [Constraint 1 — e.g. "Vendor X sanctions API: batch endpoint documented but not functional in production. Use sequential calls with exponential backoff. Confirmed 2026-02-20."]
- [Constraint 2]

---

## Agent Instructions

> Specific instructions for AI coding agents working in this project.

- Always read the relevant spec in `specs/` before implementing a feature
- Never include real PII, credentials, or production API keys in generated code or test fixtures
- Ask clarifying questions as numbered options before starting implementation
- Do not proceed to the next phase until acceptance tests for the current phase pass
- Reference compliance requirements by name and regulation section when generating security-related code
- Update this file when new architectural or compliance decisions are made
- Log all workarounds and deviations in the spec's Change Log

---

*Last updated: YYYY-MM-DD*
