# Spec-Driven Development (SDD)

> A clear, actionable methodology for AI-assisted software development.

**Inspired by** [Heeki Park](https://heeki.medium.com/using-spec-driven-development-with-claude-code-4a1ebe5d9f29) · [Birgitta Böckeler](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) · [GitHub Spec-Kit](https://github.com/github/spec-kit)  
**Version:** 1.0 · March 2026

---

## What Is This?

Spec-Driven Development (SDD) is a discipline where a **structured specification document** is written, reviewed, and maintained *before and throughout* implementation. In AI-assisted development, the spec becomes the shared source of truth between the human developer and the AI coding agent.

SDD is the antidote to **vibe coding** — the habit of jumping straight into AI code generation without structured intent. It enforces deliberate thinking, reduces scope creep, and creates a feedback loop between design intent and implementation reality.

> *"Time spent in upfront planning pays dividends for implementation efficiency and output quality."*  
> — Heeki Park, Solutions Architect @ AWS

---

## Repository Structure

```
.
├── README.md                       # This file — overview and quick reference
├── methodology/
│   ├── 01-what-is-sdd.md           # Definition and the three maturity levels
│   ├── 02-core-concepts.md         # Spec documents, context files, scope
│   ├── 03-workflow.md              # The five-phase SDD workflow
│   ├── 04-spec-structure.md        # Spec template and how to write phase specs
│   ├── 05-working-with-ai.md       # Prompting, clarifications, context windows
│   ├── 06-principles.md            # Seven core principles
│   └── 07-anti-patterns.md         # Common failure modes and how to fix them
├── templates/
│   ├── SPEC_TEMPLATE.md            # Copy-paste spec template for new features
│   ├── AGENTS.md                   # Starter project context / steering file
│   └── PHASE_CHECKLIST.md          # Pre-implementation review checklist
└── examples/
    └── payment-fraud-detection.md  # Annotated example: fraud detection pipeline
```

---

## The Three Levels of SDD

| Level | Description | When to Use |
|---|---|---|
| **Spec-First** | Spec written before coding, may be discarded after shipping | Prototypes, exploratory work |
| **Spec-Anchored** | Spec retained and updated as the feature evolves | Production features, team projects |
| **Spec-as-Source** | Spec is the only artifact humans edit; AI regenerates code from it | Experimental, AI-heavy pipelines |

> ⚠️ **Anti-Pattern: Spec-Once** — Writing a strong spec at the start and then ignoring it. It provides an initial boost but creates the same drift and tech debt as unplanned development. Commit to revisiting your spec at each phase transition.

**Recommended default:** `Spec-Anchored`

---

## Quick Start

```
1. Read all documentation for your project. Identify constraints.
2. Decompose into sub-projects and phases. Define resource dependencies.
3. Write the spec using templates/SPEC_TEMPLATE.md
4. Review against templates/PHASE_CHECKLIST.md before any code is generated.
5. Feed the spec to your AI agent as primary context.
6. Implement one phase at a time. Test before moving forward.
7. Update the spec with learnings, workarounds, and decisions.
8. Capture reusable patterns in your project context files.
```

---

## The SDD Workflow (Summary)

| Phase | Activity |
|---|---|
| **1. Research** | Consume documentation, study prior art, understand domain and constraints |
| **2. Plan** | Define sub-projects, phases, resource dependencies, and build order |
| **3. Draft Spec** | Write the specification document for the current scope |
| **4. Review Spec** | Human review and revision before any code is generated |
| **5. Implement & Feedback** | AI-assisted implementation; feed learnings back into the spec |

---

## Core Principles

| Principle | In Practice |
|---|---|
| **Plan Before Prompt** | Never start coding without completing at least a Spec-First draft |
| **Build Stepwise** | One phase at a time; each phase must be testable before the next begins |
| **Spec Reflects Reality** | Update the spec whenever implementation diverges from design |
| **Security Is First-Class** | Address auth and credentials in the spec before implementation |
| **Keep Specs Scoped** | One spec per feature or sub-project |
| **Document Learnings** | Capture reusable patterns in project context files |
| **Revisit Continuously** | The spec is a living document — review at every phase transition |

---

## Resources

- [Using Spec-Driven Development with Claude Code](https://heeki.medium.com/using-spec-driven-development-with-claude-code-4a1ebe5d9f29) — Heeki Park
- [Understanding SDD: Kiro, spec-kit, and Tessl](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) — Birgitta Böckeler (martinfowler.com)
- [GitHub Spec-Kit](https://github.com/github/spec-kit)
- [Kiro IDE](https://kiro.dev)

---

*Spec-Driven Development Methodology · v1.0 · March 2026*
