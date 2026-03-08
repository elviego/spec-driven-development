# 5. Working with AI Coding Agents

The spec is most valuable when it is the **primary input** to an AI coding session. The following practices improve the quality of AI-generated outputs.

---

## 5.1 Structuring the Initial Prompt

The initial prompt to the AI agent should establish three things:

1. The goal and context (reference the spec, not inline description)
2. The phased build plan
3. Behavioural instructions (clarifying questions, testing gates)

### Prompt Pattern

```
We are building [project name].

Please ingest the spec at [path/spec.md] and the project context at [AGENTS.md].

The project is broken into [N] phases. Please start with Phase 1 and ask clarifying
questions as needed before beginning implementation.

For clarifying questions, present numbered options where possible so I can respond quickly.

Do not proceed to the next phase until the current phase passes its acceptance tests.
```

**What to avoid:**
- Describing the full project inline in the initial prompt (use the spec instead)
- Starting multiple phases simultaneously
- Skipping the instruction to pause between phases

---

## 5.2 Managing Clarifying Questions

Instruct the AI agent to ask clarifying questions as **selectable options** rather than open-ended queries. This makes the back-and-forth faster and produces a useful record of decisions made during implementation.

**Best practices:**
- Ask the AI to present questions as numbered or lettered options
- Keep open input as a fallback option (e.g., "5. Other — I'll describe")
- Review the summary of decisions at the end of each phase
- Capture key decisions back into the spec's Change Log

**Example instruction to include in your prompt:**
```
When you need to make a design decision, present your options as a numbered list.
Keep the last option as "Other — I'll specify". At the end of each phase, give me
a summary of decisions made.
```

---

## 5.3 Context Window Management

AI coding agents operate within a **context window** — the total information available in a single interaction. Managing this window matters for long-running projects.

| Practice | Rationale |
|---|---|
| Keep specs concise and scoped | Large monolithic specs consume context budget and reduce precision |
| Use project context files for persistent state | Separates stable architectural context from task-specific specs |
| Allow context compaction when prompted | Necessary for long sessions; some tools do this automatically |
| Split large projects into separate agent sessions | Reduces context pressure; each phase can be its own session |
| Review context usage periodically | Most AI coding tools show context consumption — monitor it |

---

## 5.4 Trust and Permission Management

AI coding agents typically request permission before taking actions. Manage this incrementally:

| Action Type | Risk Level | Recommended Approach |
|---|---|---|
| Read files, fetch docs | Low | Allow broadly |
| Write to local code files | Medium | Review initially, allow once output quality is established |
| Execute local test commands | Medium | Review each command early; allow common patterns over time |
| Call external APIs (e.g. sanctions screening sandbox) | Medium–High | Review every call; ensure test credentials are used |
| Deploy to cloud infrastructure | High | Review every action |
| Modify database schemas or run migrations | High | Always review individually; require staging validation first |

Start conservative. Review each action category. Extend trust incrementally as the agent's behaviour becomes consistent and predictable.

---

## 5.5 Running Parallel Sessions

Multiple agent sessions can be run in parallel for:

- Testing different implementation approaches for the same phase
- Running separate sessions per sub-project (e.g. fraud detection engine vs. audit reporting)
- Agent team workflows (assigning sub-tasks to specialised agents)

**Recommended tool:** `tmux` for terminal multiplexing

```bash
# Open a new named session per sub-project
tmux new-session -s fraud-engine
tmux new-session -s audit-reporting
```

---

## 5.6 Domain-Specific Considerations for Financial Services

Working with AI agents in regulated domains requires additional care:

| Area | Guidance |
|---|---|
| **PII in prompts** | Never paste real customer names, account numbers, or transaction data into a prompt. Use synthetic test data. |
| **Regulatory references** | Include specific regulation names and sections in the spec (e.g. "PCI-DSS Requirement 3.4 — PAN must be masked"). The agent will use these as constraints. |
| **Compliance sign-offs** | Reference Jira ticket IDs or document links for compliance decisions in the spec (not inline in prompts). |
| **Audit trails** | Instruct the agent to include structured logging for all state transitions — regulators expect traceable event histories. |
| **Test data** | Maintain a synthetic data set that mirrors production schemas. Reference it in the spec's Testing Strategy section. |

---

*Next: [Core Principles →](06-principles.md)*
