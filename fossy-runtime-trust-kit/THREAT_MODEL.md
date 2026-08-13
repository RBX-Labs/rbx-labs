# Threat model and boundaries

## Assets worth protecting

- The authority to change code, configuration, or published information.
- Private repositories, tickets, credentials, and user data.
- The integrity of source material used to ground a response.
- The ability for a maintainer to reconstruct why a decision was made.

## Relevant threats

| Threat | Why prompts alone are insufficient | Starter control in this kit |
| --- | --- | --- |
| Prompt injection in retrieved content | A prompt cannot establish that retrieved content is trustworthy or authorized. | Source roles, bounded tool scope, and explicit escalation. |
| Stale or contradictory documentation | A fluent answer can hide uncertainty. | Freshness and conflict signals; no silent averaging. |
| Excessive agent authority | A correctly interpreted task can still have an unsafe side effect. | Named `read_only` authority and denied actions. |
| Tool success mistaken for completion | An API may return success while the intended state never appears. | Post-action verification requirement. |
| Model or retrieval drift | A later run can look similar but behave differently. | `MODEL_LOCK` and recorded signal values. |
| Supply-chain compromise | A model, adapter, tool, or package can be replaced upstream. | This kit does not solve it; add pinned revisions, provenance, signatures, and review to your deployment process. |

## Non-goals

- This is not a sandbox, secret manager, network policy, model scanner, or complete evaluation framework.
- It does not certify a model, provider, or deployment as secure.
- It cannot tell you whether a source is true; it makes the evidence and the unresolved gaps inspectable.

## Extension questions

Before adopting this pattern, write answers to these questions:

1. What action can the workflow take, and what must it never take without approval?
2. What evidence is required for each material claim?
3. What source conditions cause abstention or maintainer review?
4. What downstream state proves an action succeeded?
5. Which redacted traces can become public fixtures for community review?
