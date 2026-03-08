# 1. What Is Spec-Driven Development?

Spec-Driven Development (SDD) is a software development methodology where a **structured specification document** is written, reviewed, and maintained before and throughout the implementation process.

In the context of AI-assisted coding tools (Cursor, Copilot, Kiro, and similar agents), the spec becomes the **shared source of truth** between the human developer and the AI coding agent.

SDD is not just about writing requirements first. It is a discipline that:

- Forces deliberate thinking before any code is generated
- Reduces scope creep and feature divergence
- Creates a feedback loop between design intent and implementation reality
- Prevents *vibe coding* — jumping straight to generation with no structured intent

---

## The Three Maturity Levels

SDD exists on a spectrum. Birgitta Böckeler (Thoughtworks) identified three implementation levels:

### Level 1 — Spec-First

A well thought-out spec is written **before coding begins** and used to guide the AI-assisted development workflow for that task. The spec may be discarded or replaced once the feature ships.

- ✅ Minimum viable level of SDD
- ✅ Forces planning before action
- ⚠️ Spec may go stale after shipping

### Level 2 — Spec-Anchored *(Recommended)*

The spec is retained after the task is complete and **actively updated** as the feature evolves. It serves as living documentation for ongoing maintenance.

- ✅ Suitable for production features and team projects
- ✅ Enables evolution without drift
- ✅ Makes onboarding and audits easier

### Level 3 — Spec-as-Source *(Experimental)*

The spec is the **permanent primary artifact**. The human only edits the spec — never the code directly. The AI generates and regenerates code from the spec.

- ⚠️ Emerging paradigm, not yet widely production-proven
- Suited for AI-heavy pipelines and research contexts

---

## The Spec-Once Anti-Pattern

A common failure mode that looks like SDD but isn't:

> Write a thorough spec at project start → get excited, dive into implementation → forget the spec exists → end up with drift and tech debt

This is **Spec-Once**. It provides an initial boost but creates the same problems as unplanned development. The fix is committing to revisit and update the spec at every phase transition.

---

## How SDD Relates to Existing Practices

SDD is not a replacement for:

- **Agile / Scrum** — SDD works within sprints; the spec gives each story enough depth to be AI-implementable
- **TDD** — Test specs and implementation specs complement each other
- **PRDs / Confluence docs** — The spec is more concrete and AI-consumable than typical documentation

SDD *extends* these practices by creating a format that an AI coding agent can directly consume as context.

---

### Example in Financial Services

A payments team building a new fraud detection microservice would use SDD as follows:

- **Research phase:** Study the existing transaction schema, fraud rule engine API, and regulatory reporting requirements (PCI-DSS, AML thresholds)
- **Spec:** One document covering the feature scope — event ingestion, rule evaluation, alert dispatch, and audit logging — with explicit out-of-scope items (model retraining, dashboards)
- **Spec-Anchored:** The spec lives in the repo alongside the service. When AML threshold rules change in Q3, the spec is updated first, then the implementation follows

---

*Next: [Core Concepts →](02-core-concepts.md)*
