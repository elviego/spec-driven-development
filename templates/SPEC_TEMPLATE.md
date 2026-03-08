# Spec: [Feature / Sub-Project Name]

**Status:** Draft / In Review / Approved / In Progress / Complete  
**Created:** YYYY-MM-DD  
**Last Updated:** YYYY-MM-DD  
**Author:** [Name]  
**Project Context:** [Link to AGENTS.md / architecture.md]  
**Compliance Reference:** [Link to relevant regulatory guidance or internal policy, if applicable]

---

## 1. Overview

> One paragraph describing what this spec covers, the goal, and why it matters.
> Link to relevant project context files and upstream tickets or PRDs.

**Scope:** What is included in this spec.  
**Out of Scope:** [List explicitly — this is as important as the scope]

---

## 2. Background & Research

> What documentation, prior art, and sources informed this spec?

**Key documentation:**
- [API / Service Name](URL) — brief note on relevance
- [Regulatory guidance](URL) — brief note

**Known constraints:**
- [Constraint 1 — e.g. "Vendor API does not support batch requests despite documentation claiming otherwise"]
- [Constraint 2 — e.g. "PCI-DSS Requirement 3.4 applies: PAN must not appear in logs"]

**Prior art / related implementations:**
- [Reference — e.g. link to similar internal service or ADR]

---

## 3. Architecture

> Describe the component topology. A simple ASCII diagram is sufficient.

```
[Client / Upstream Service]
         │
         ▼
[API Gateway / Load Balancer]
         │
         ▼
[Service: Feature Name]
     │           │
     ▼           ▼
[Datastore]  [External API / Event Bus]
```

**Sub-projects and phases:**

| Phase | Sub-project | Description |
|---|---|---|
| 1 | [Name] | [Description] |
| 2 | [Name] | [Description] |
| 3 | [Name] | [Description] |

**Service dependencies:**
- Phase 2 requires Phase 1 to be deployed and integration-tested first
- [Other dependencies]

---

## 4. Phase Specifications

---

### Phase 1 — [Name]

**Goal:** [One sentence]

**Components to create or modify:**
- [Service / Lambda / class]: `[name]` — [brief spec]
- [Database table / schema]: `[name]` — [brief spec]

**Tools:** [Primary framework/tool]. Fallback: [Fallback if primary unavailable].  
Reference: [URL to relevant internal or external docs]

**Configuration:**
- [Config key]: `[value or description]`
- [Config key]: `[value or description]`

**Local test:**
```bash
[command to run locally]
```

**Integration / staging test:**
```bash
[command to test against staging environment]
```

**Expected output:** [What a passing test looks like — specific and observable, including relevant edge cases]

**Known constraints / compliance gates:**
- [e.g. "Compliance sign-off required before connecting to production sanctions API — see Jira COMP-XXX"]

---

### Phase 2 — [Name]

*(Repeat structure above)*

---

## 5. Security & Compliance

> Address authentication, authorisation, data privacy, and regulatory obligations before implementation.

**Authentication:** [How clients and services authenticate]  
**Authorisation:** [Role-based or attribute-based access control model]  
**PII handling:** [Which fields are considered PII; how they are masked, encrypted, or excluded from logs]  
**Encryption:** [At rest and in transit requirements]  
**Regulatory obligations:** [Specific requirements — e.g. PCI-DSS Req 3.4, GDPR Art. 25, AML threshold reporting]  
**Compliance sign-offs obtained:** [Reference to approvals — Jira IDs, document links]

**Security checklist:**
```
□ Auth implemented in Phase [N], not retrofitted later
□ No real customer data (PII, PAN, SSN) in test fixtures or logs
□ IAM / RBAC roles follow least-privilege principle
□ Secrets stored in vault / secrets manager — not in code or config files
□ mTLS enforced for service-to-service calls
□ PAN masked in all log output (last 4 digits only)
□ Data residency requirements identified and met
```

---

## 6. Testing Strategy

| Phase | Unit Test | Integration / Staging Test |
|---|---|---|
| Phase 1 | `[command]` | `[command]` |
| Phase 2 | `[command]` | `[command]` |
| End-to-end | N/A | `[command]` |

**Synthetic test data:** [Where synthetic data fixtures live — e.g. `tests/fixtures/`]  
**Test environments:** [Staging environment details; which external APIs use sandbox vs. production endpoints]

---

## 7. Open Questions

> Unresolved decisions or areas of uncertainty. Resolve these before Phase 4 (Review).

- [ ] [Question 1 — e.g. "Does the sanctions vendor API support concurrent connections > 10?"]
- [ ] [Question 2 — e.g. "Confirm with Compliance: is fail-open acceptable for the screening step?"]

---

## 8. Change Log

> Date-stamped record of spec revisions. Update whenever implementation diverges from design.

### YYYY-MM-DD
- Initial draft

---

*This spec follows the [SDD Methodology](../README.md)*
