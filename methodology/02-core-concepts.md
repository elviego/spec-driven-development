# 2. Core Concepts

---

## 2.1 The Spec Document

A spec is a **structured, behavior-oriented artifact** — or set of related artifacts — written in natural language. It expresses software functionality and serves as guidance to AI coding agents and human developers alike.

### What a Spec Is vs. What It Is Not

| Spec **Is** | Spec **Is Not** |
|---|---|
| Behavior-oriented and actionable | A vague feature idea or user story backlog |
| Written before coding begins | Auto-generated from existing code |
| Maintained and updated as the project evolves | A one-time document written and forgotten |
| Specific enough for an AI to implement from | A high-level business requirements doc |
| Scoped to a feature or sub-project | A monolithic project bible |

A spec is **not** a vague Confluence page. It is a concrete, actionable document that an AI agent can consume directly in its context window to generate high-quality, on-target code.

---

## 2.2 The Project Context Files (Memory Bank)

Separate from feature specs, every project should maintain a set of **project context files** — project-wide documents that inform every AI coding session. These are not specs; they are the architectural backdrop against which specs are written.

### Recommended Context Files

| File | Contents |
|---|---|
| `AGENTS.md` | High-level steering rules and agent instructions |
| `project.md` | Project purpose, tech stack, team conventions |
| `architecture.md` | System design, resource topology, deployment model |
| `tech.md` | Language choices, libraries, version constraints |
| `decisions.md` | Architectural decision records (ADRs) and rationale |

> Project context files are stable and slow-changing. Feature specs are dynamic and task-specific. Keep them separate.

Context files should be updated continuously as architectural decisions are made or revised — not just at project start.

A starter `AGENTS.md` template is available at [`templates/AGENTS.md`](../templates/AGENTS.md).

---

## 2.3 Spec Scope

Each spec should cover **a single feature, sub-project, or coherent unit of work** — not the entire system.

Breaking a large project into sub-projects and phases is essential for:

- **Testability** — each phase can be validated independently
- **Iterative delivery** — phases can ship and be reviewed incrementally
- **Context window efficiency** — smaller specs fit better in AI context windows
- **Compliance traceability** — smaller scope is easier to audit and sign off

### Example: Breaking a Payments Project Into Phases

```
Project: Real-Time Payment Fraud Detection Service

Sub-project 1 — Data Ingestion
  └── Phase 1: Kafka consumer for transaction events (schema validation, DLQ)

Sub-project 2 — Rule Engine
  ├── Phase 2: Rule evaluation service (velocity checks, amount thresholds)
  ├── Phase 3: Integration with third-party sanctions screening API (OFAC)
  └── Phase 4: Alert dispatch to case management system

Sub-project 3 — Audit & Reporting
  └── Phase 5: Immutable audit log + regulatory report export (SAR format)
```

Each phase has its own spec section, is testable independently, and has clear input/output contracts.

---

## 2.4 The Spec Lifecycle

```
Draft → Review → Implement → Update → (repeat)
```

A spec is not a contract set in stone. It is a **living document** that evolves with the implementation. Every time a workaround is discovered, a constraint is hit, or a regulatory requirement changes, the spec must be updated to reflect reality.

In regulated industries like financial services, the Change Log section of a spec also serves as a lightweight audit trail of design decisions.

---

*Next: [The SDD Workflow →](03-workflow.md)*
