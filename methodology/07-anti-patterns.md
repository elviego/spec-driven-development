# 7. Common Anti-Patterns to Avoid

---

## 1. Vibe Coding

**What it looks like:** Opening the AI coding tool and typing "build me a transaction monitoring service" with no prior planning.

**Why it fails:** Vague prompts produce mediocre outputs. Without a spec, the AI makes assumptions — about data schemas, API contracts, error handling, and compliance obligations — that may not match your intent. In financial services, wrong assumptions can mean regulatory exposure.

**Fix:** Complete Phases 1–4 of the SDD workflow before generating any code. Even a rough one-page spec dramatically improves output quality and reduces compliance risk.

---

## 2. Spec-Once

**What it looks like:** Writing a thorough spec for the payment processing service in January, diving into implementation, and never updating the spec when the upstream transaction schema changes in February.

**Why it fails:** The spec drifts from reality. Workarounds, pivots, and API changes go undocumented. The spec becomes misleading — future AI agents and engineers are given inaccurate context. In audits, a spec that contradicts the code creates unnecessary risk.

**Fix:** Revisit the spec at every phase transition. Update the Change Log whenever implementation diverges from design.

---

## 3. Monolithic Spec

**What it looks like:** One 20-page document covering the entire fraud detection platform: ingestion, rule engine, ML scoring, alerting, case management, regulatory reporting, and the admin dashboard.

**Why it fails:** Large specs consume context window budget, drift faster, and are too broad to be useful for individual phases. They're hard to review, hard to update, and overwhelming to hand off.

**Fix:** One spec per feature or sub-project, max ~4,000 words. Put shared context (data models, service topology, credential management conventions) in project context files like `architecture.md`.

---

## 4. Security & Compliance as Afterthoughts

**What it looks like:** Building the full loan origination API through Phase 3, then adding OAuth 2.0, PII masking, and PCI-DSS field-level encryption in Phase 4.

**Why it fails:** Security and compliance requirements often reshape architecture. Adding encryption-at-rest late may require changing database schemas and redeploying infrastructure. Adding an authorisation model after the fact creates gaps. In financial services, this can trigger findings in security reviews and regulatory audits.

**Fix:** Include a Security & Compliance section in every spec. Implement PII handling, auth, and encryption in the earliest phase that requires them — even if it means slightly more upfront work.

---

## 5. Undocumented Workarounds

**What it looks like:** The OFAC sanctions API doesn't support batch screening despite being documented as doing so — so the team switches to sequential calls with backoff — but doesn't update the spec.

**Why it fails:** Future AI sessions, team members, and auditors encounter a spec saying "batch screening" but code doing sequential calls. Confusion, re-investigation, and potential compliance questions arise.

**Fix:** Every deviation from the original design must be logged in the Change Log with the reason, date, and any relevant approval references (e.g. Compliance sign-off ticket numbers).

---

## 6. Blind Trust

**What it looks like:** Auto-approving all AI agent actions from the start, including schema migrations against the staging database and API calls to third-party services using production credentials.

**Why it fails:** AI agents can make unexpected choices — running destructive queries, calling APIs with real data, or overwriting configuration files. In financial services, these mistakes can have regulatory, financial, or reputational consequences.

**Fix:** Start conservative. Review each action category. Extend trust incrementally as the agent's behaviour becomes consistent and predictable. Never use production credentials during AI-assisted development sessions.

---

## 7. No Acceptance Criteria

**What it looks like:** A phase spec that says "integrate with the credit bureau API" with no test definition, no expected response shape, and no definition of what a passing result looks like.

**Why it fails:** Neither the human nor the AI knows what "done" means. Integration may be technically complete but returning incorrect credit scores, and no one notices until it reaches a compliance review or customer complaint.

**Fix:** Every phase spec must include a concrete acceptance test: a command to run, an endpoint to call, or an observable output to verify — including edge cases relevant to the domain (e.g. "a customer with a frozen credit file returns `status: FROZEN`, not an error").

---

## Summary

| Anti-Pattern | Root Cause | Fix |
|---|---|---|
| Vibe Coding | No planning phase | Complete SDD Phases 1–4 first |
| Spec-Once | No feedback loop | Update spec at every phase boundary |
| Monolithic Spec | Poor scoping | One spec per feature; context files for shared state |
| Security & Compliance as Afterthoughts | Late prioritisation | Dedicated section in every spec; implement early |
| Undocumented Workarounds | No discipline | Log every deviation in the Change Log with rationale |
| Blind Trust | Overconfidence in AI | Incremental trust; review action categories; no prod credentials |
| No Acceptance Criteria | Vague definition of done | Explicit test command or observable outcome in every phase |

---

*Back to: [README →](../README.md)*
