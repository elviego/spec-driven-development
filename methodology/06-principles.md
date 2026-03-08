# 6. Core Principles

These seven principles distill the essence of spec-driven development as a practical discipline.

---

## 1. Plan Before Prompt

> Never start coding before completing at least a Spec-First draft.

The research and planning phase is non-negotiable. Skipping it leads to vague prompts, poor outputs, and expensive course corrections. Even a one-page spec is better than no spec.

**In practice:** Complete Phases 1–3 of the [SDD Workflow](03-workflow.md) before opening your AI coding tool.

**In financial services:** Regulatory requirements, data schemas, and third-party API contracts must be understood before implementation begins. Discovering a PCI-DSS constraint mid-sprint is far more costly than reading the spec upfront.

---

## 2. Build Stepwise

> Implement one phase at a time. Each phase must be testable before the next begins.

Stacked, independently reviewable phases catch problems early and keep the scope of each review small — analogous to [stacked pull requests](https://www.stacking.dev/).

**In practice:** Define acceptance tests for each phase in the spec. Do not proceed to Phase N+1 until Phase N passes.

**In financial services:** Phased delivery also creates natural checkpoints for compliance and security reviews, preventing late-stage blockers.

---

## 3. Spec Reflects Reality

> When implementation diverges from spec, update the spec.

Workarounds, fallbacks, and discovered constraints are inevitable. When they happen, they must be captured in the spec's Change Log. A spec that doesn't reflect what was built is worse than no spec.

**In practice:** After every workaround or design pivot, update the spec before continuing.

**In financial services:** The Change Log also functions as a lightweight audit trail. If a regulatory examiner asks "why was fail-open chosen for the sanctions screening step?", the answer should be findable in the spec.

---

## 4. Security & Compliance Are First-Class

> Address authentication, authorisation, data privacy, and regulatory obligations in the spec before implementation.

Retrofitting security causes rework and risk. Retrofitting compliance can cause regulatory findings. Design both in from Phase 1.

**In practice:** Include a Security & Compliance section in every spec. Implement auth and PII handling in the earliest phase that requires them.

**In financial services:** PCI-DSS, GDPR, AML, and KYC requirements must be identified in the Research phase and specified explicitly — not left as implementation details for the AI to infer.

---

## 5. Keep Specs Scoped

> One spec per feature or sub-project. Monolithic specs become stale and hard to maintain.

Large specs consume context window budget, drift faster, and are harder to review. Smaller scopes are easier to validate, update, hand off, and audit.

**In practice:** If a spec exceeds ~4,000 words, split it. Use project context files for shared architectural context.

---

## 6. Document Learnings

> Capture reusable patterns in project context files.

Every project produces reusable knowledge — service patterns, API quirks, effective data handling approaches, compliance workarounds. Capturing these compounds over time, making future projects faster and more reliable.

**In practice:** At the end of each project, update `AGENTS.md` and document reusable patterns such as idempotent event handlers, circuit breaker configurations, or PII masking utilities.

---

## 7. Revisit Continuously

> The spec is a living document. Review and revise at every phase transition.

The spec is not a contract set in stone. It is the evolving record of design intent and implementation reality. Regular revisits keep it accurate and useful.

**In practice:** At the start of each new phase, re-read the spec section for that phase before handing off to the AI agent.

---

*Next: [Common Anti-Patterns →](07-anti-patterns.md)*
