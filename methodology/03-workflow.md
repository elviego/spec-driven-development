# 3. The SDD Workflow

The SDD process follows **five phases**. Each has clear inputs, outputs, and checkpoints. The workflow is iterative — later phases feed back into earlier ones.

```
┌──────────────────────────────────────────────────────────┐
│  1. Research → 2. Plan → 3. Draft → 4. Review → 5. Implement
│                                          ↑                    │
│                                          └─── feedback loop ──┘
└──────────────────────────────────────────────────────────┘
```

---

## Phase 1 — Research

**Goal:** Understand the problem space before writing a single line of spec.

Read official documentation, review API references, study regulatory requirements, and identify constraints and dependencies. Direct the AI agent to consume the same documentation so it operates on shared context.

**Actions:**
- Read all relevant official documentation and internal API references
- Identify key data models, APIs, and configuration parameters
- Note constraints: compliance requirements, data residency rules, third-party API limitations
- Study prior art and similar internal implementations
- Instruct your AI agent to ingest the same sources

**Output:** A clear understanding of the domain, key constraints, and resource requirements.

### Financial Services Example

Before speccing a new KYC (Know Your Customer) onboarding flow, the team reads:
- Internal identity verification API docs and rate limits
- PEP/sanctions screening vendor documentation
- Relevant AML regulatory guidance (FinCEN, FATF)
- Existing customer data model schemas and validation rules
- Prior incident post-mortems for the current onboarding flow

---

## Phase 2 — Plan

**Goal:** Decompose the project into testable, independently deliverable phases.

Think about data dependencies, compliance gates, and the logical sequence of implementation. Define what "done" looks like for each phase before writing the spec.

**Actions:**
- Identify data and service dependencies and their correct order
- Create independent, testable sub-projects
- Define phase boundaries — each phase should have a discrete, runnable test
- Identify which tools, frameworks, and third-party services each phase requires
- Flag areas requiring compliance sign-off or security review before implementation

**Output:** A phased build plan with clear boundaries and dependencies.

---

## Phase 3 — Draft the Spec

**Goal:** Write a specification document detailed enough that an AI can implement from it.

Use the [spec template](../templates/SPEC_TEMPLATE.md) as a starting point. Write in natural language. No code yet.

**Actions:**
- Write the spec using the structure in [Section 4](04-spec-structure.md)
- Include architectural decisions *and* rationale, not just requirements
- Reference specific API documentation, data schemas, and field names
- Define acceptance criteria for each phase
- Specify preferred tools, fallback strategies, and constraints
- Address security, data privacy, and compliance requirements from the start

**Output:** A complete draft spec document ready for human review.

---

## Phase 4 — Review the Spec

**Goal:** Verify the spec before any code is generated. Treat it like a pull request.

**Review Checklist:**

```
□ Does the spec accurately reflect the intended architecture and design?
□ Are API names, schema fields, and configuration values specific and correct?
□ Is each phase independently testable with clear acceptance criteria?
□ Are constraints, fallbacks, and workarounds documented?
□ Are compliance and regulatory requirements addressed (not deferred)?
□ Are data privacy rules respected (PII handling, encryption at rest/in transit)?
□ Are sub-project dependencies clear and ordered correctly?
□ Would an AI agent have everything needed to implement without asking basic questions?
□ Is scope well-contained — no gold plating or out-of-scope features?
```

Revise until the spec accurately represents what you want built. A well-reviewed spec is the single biggest lever for output quality.

**Output:** A reviewed, approved spec ready to hand off to the AI agent.

---

## Phase 5 — Implement & Feedback

**Goal:** Execute AI-assisted implementation using the spec as the primary context. Feed learnings back into the spec continuously.

**Actions:**
- Provide the spec and project context files as context to the AI agent
- Build one phase at a time — do not skip ahead
- Run tests after each phase before proceeding to the next
- Update the spec when reality diverges from design (workarounds, API changes, compliance findings)
- Update project context files with new architectural decisions
- Capture reusable patterns for future projects

**Output:** Working implementation + updated spec that reflects what was actually built.

---

## The Feedback Loop

Every phase of implementation produces learnings. These must flow back into the spec:

| Discovery | Action |
|---|---|
| Third-party API behaves differently than documented | Update phase spec with actual behaviour and workaround |
| Compliance requirement added mid-sprint | Add to spec Security/Compliance section; assess phase impact |
| Schema field deprecated by upstream team | Update spec data model section; log in Change Log |
| Performance constraint discovered during load test | Document constraint and architectural response in spec |
| Reusable pattern identified (e.g. idempotent event handler) | Capture in project context files for future services |

---

*Next: [Spec Document Structure →](04-spec-structure.md)*
