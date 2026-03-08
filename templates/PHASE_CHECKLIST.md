# Pre-Implementation Spec Review Checklist

> Run this checklist before handing any spec to an AI coding agent.
> A spec that passes all checks is ready for implementation.

---

## Scope & Intent

```
□ The spec covers exactly one feature, sub-project, or coherent unit of work
□ Out-of-scope items are explicitly listed
□ The goal of each phase is stated in one clear sentence
□ There is no scope creep or gold plating in the spec
```

## Accuracy & Specificity

```
□ API endpoint names, schema field names, and configuration values are specific and correct
□ Documentation references (internal and external) are included for non-obvious choices
□ Version-sensitive, preview-state, or known-buggy features are flagged as constraints
□ Tool preferences and fallback strategies are specified
```

## Architecture

```
□ Service dependencies are clearly identified and ordered
□ Each phase can be deployed and tested independently
□ The architecture diagram or description matches the phase breakdown
□ No circular dependencies between phases
```

## Security & Compliance

```
□ Authentication and authorisation requirements are defined (not "TBD")
□ PII fields are identified and handling is specified (masking, encryption, exclusion from logs)
□ Applicable regulations are named with specific requirements (e.g. PCI-DSS Req 3.4)
□ Compliance sign-offs are referenced or noted as pending with owner
□ Data residency requirements are identified
□ Security is implemented in the earliest phase that requires it — not deferred
□ Test fixtures use synthetic data only — no real customer data
```

## Testing

```
□ Every phase has at least one concrete acceptance test
□ Local / unit test commands are specified and runnable before deployment
□ Integration / staging test commands are specified
□ Expected outputs are observable and unambiguous
□ Edge cases relevant to the domain are included (e.g. frozen accounts, sanctioned names, zero-amount transactions)
```

## Open Questions

```
□ All open questions are documented in Section 7
□ Any open question that would block implementation is resolved before approving
□ Compliance questions have been escalated to the appropriate team
```

## Project Context

```
□ The spec references the relevant AGENTS.md / architecture.md
□ Any new architectural or compliance decisions are reflected in project context files
□ The spec's Change Log section exists (even if empty)
```

## AI Readiness

```
□ An AI agent could implement Phase 1 from this spec without asking basic clarifying questions
□ The spec is concise enough to fit comfortably in a context window (<4,000 words)
□ Synthetic test data references are included so the agent can generate tests
□ No real credentials, API keys, or PII are present in the spec
```

---

## Sign-off

| Item | Status |
|---|---|
| Spec reviewed by | [Name] |
| Date reviewed | YYYY-MM-DD |
| Compliance reviewed by | [Name / "N/A"] |
| Approved to implement | Yes / No / Needs revision |
| Notes | |

---

*Part of the [SDD Methodology](../README.md)*
