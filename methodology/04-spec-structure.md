# 4. Spec Document Structure

A well-formed spec should be detailed enough for an AI agent to implement from, but scoped tightly enough to fit comfortably in a context window. Use the [SPEC_TEMPLATE.md](../templates/SPEC_TEMPLATE.md) as your starting point.

---

## Recommended Sections

| Section | Contents |
|---|---|
| **1. Overview** | One paragraph: what this spec covers, the goal, and context. Link to project context files. |
| **2. Background & Research** | Key documentation sources consulted. Known constraints, limitations, third-party API quirks, regulatory requirements. |
| **3. Architecture** | Diagram or description of resource topology. Sub-project and phase breakdown. Service dependencies and deployment order. |
| **4. Phase Specifications** | For each phase: goal, components to build, tools to use, fallback strategies, test criteria, and expected outputs. |
| **5. Security & Compliance** | Authentication, authorisation, data privacy (PII, PCI, GDPR). Regulatory obligations. Address early — not retrofitted. |
| **6. Testing Strategy** | How each phase is tested. Unit test coverage expectations, integration tests, contract tests. |
| **7. Open Questions** | Unresolved decisions, areas of uncertainty, things to verify during implementation. |
| **8. Change Log** | Date-stamped record of spec revisions. What changed and why. |

Not every section is required for every project — adapt to scope and complexity. Smaller features may only need sections 1, 4, and 8.

---

## Writing Phase Specifications

The phase specification is the most critical section of the spec. A well-written phase spec answers all of these:

1. **What is the goal of this phase?** (One sentence)
2. **What components or services need to be created or modified?**
3. **Which tools, frameworks, or third-party services should be used?** Are there fallbacks if the primary is unavailable?
4. **What specific fields, endpoints, or configuration values are required?** (Reference docs by name)
5. **How will this phase be tested locally? In staging? Against production data?**
6. **What is the expected output or observable behaviour when complete?**
7. **What are known constraints, risks, or compliance gates?**

### Example Phase Specification

```markdown
## Phase 2 — Sanctions Screening Integration

**Goal:** Integrate real-time OFAC/PEP sanctions screening into the customer onboarding flow.

**Components:**
- `SanctionsScreeningService` — new service wrapping the Acuris Compliance API
- `CustomerOnboardingOrchestrator` — updated to call screening before account activation
- DynamoDB table: `sanctions-screening-results` (TTL: 90 days, for audit retention)

**Tools:** AWS Lambda (Python 3.12). API client: Acuris Compliance REST API v2.
Reference: https://internal-docs/acuris-api-v2

**Configuration:**
- API timeout: 5 seconds (fail-open with alert if exceeded — regulatory risk accepted by Compliance team)
- Match threshold: score ≥ 85 triggers manual review queue
- PII handling: customer name and DOB transmitted over mTLS; not stored in logs

**Local test:**
```bash
pytest tests/unit/test_sanctions_screening_service.py -v
```

**Integration test (staging):**
```bash
pytest tests/integration/test_onboarding_with_screening.py --env=staging
```

**Expected output:** Customer with name matching OFAC list receives `status: PENDING_REVIEW`
and a case is created in the case management system within 2 seconds.

**Known constraints:**
- Acuris API SLA is 99.5% — implement circuit breaker with 30s cooldown
- Fail-open behaviour approved by Compliance (2026-02-14 sign-off in Jira COMP-447)
```

---

## Spec Length and Depth Guidelines

| Project Size | Recommended Spec Length |
|---|---|
| Small feature / single endpoint | 1–2 pages (500–800 words) |
| Multi-phase feature | 3–5 pages (1,000–2,000 words) |
| Full sub-project (3+ phases) | 5–10 pages (2,000–4,000 words) |
| Large system | Split into multiple feature-level specs |

> Specs longer than ~4,000 words should be split. Monolithic specs become stale faster and consume excessive context window budget.

---

## Keeping Specs Current

Every time implementation diverges from the spec, update the spec's **Change Log** section:

```markdown
## 8. Change Log

### 2026-03-15
- Phase 2: Acuris API v2 does not support batch screening (documented as supported).
  Switched to sequential calls with exponential backoff. Throughput impact assessed as
  acceptable for current onboarding volume (<500 req/day).

### 2026-03-10
- Phase 3 added after Compliance team requested SAR export capability by end of quarter.
  Scope confirmed with Product and Legal in Slack thread #aml-project.

### 2026-03-01
- Initial draft.
```

---

*Next: [Working with AI Agents →](05-working-with-ai.md)*
