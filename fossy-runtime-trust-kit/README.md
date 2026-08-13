# Runtime Trust Kit

A small, framework-neutral starter kit for making an AI workflow's runtime behaviour inspectable and repairable.

It is intentionally not a prompt library, an agent framework, or a claim that a model can reliably grade its own work. It is a compact example of the controls that should survive a model swap:

1. **Name the action and its bounded authority.**
2. **Collect evidence as observable signals, not a self-reported confidence score.**
3. **Choose an explicit outcome:** proceed, abstain, or send to a maintainer.
4. **Verify the downstream state after a tool action.**
5. **Keep a trace that can become a fixture, an evaluation, and eventually a regression test.**

## Start here

```sh
node tests/verify-runtime-trust-kit.mjs
```

There are no runtime dependencies. The verifier uses Node's standard library and checks the included example policy, evaluation, and trace.

## What is included

| Path | Purpose |
| --- | --- |
| `policy/runtime-policy.example.json` | A portable decision policy: evidence requirements, authority boundaries, verification, and fallback. |
| `evals/feature-x-upgrade.json` | A compact evaluation case for a maintenance assistant. |
| `traces/prompt-only-run.json` | A deliberately unsafe run: plausible answer, no evidence, unverified action. |
| `traces/runtime-aware-run.json` | A run that observes freshness, conflict, coverage, scope, and downstream state before escalating. |
| `fixtures/issues/418-feature-x-migration.md` | The source artifact that grounds the evaluation. |
| `tests/verify-runtime-trust-kit.mjs` | A dependency-free contract check. |
| `MODEL_LOCK.example.json` | The deployment/model artifact that makes a trace reproducible. |
| `THREAT_MODEL.md` | A lightweight threat model and boundaries. |

## The loop this kit is trying to make normal

```text
bad answer or unsafe action
  -> inspectable trace
  -> fixture
  -> evaluation
  -> regression test
  -> policy / code / model change
```

That is the practical connection to open source: a failure becomes a thing a community can inspect, reproduce, improve, and share.

## Adapt it

1. Copy the policy and replace `change_request` with your real workflow action.
2. List signals your application can actually observe. Do not invent a magic confidence number.
3. Set the smallest authority that is useful. Make broader actions require a human approval or a separate policy.
4. Specify the downstream state that proves completion. A successful API call is not, by itself, proof.
5. Turn your next notable production miss into a redacted fixture and an evaluation case.

## Boundaries

This kit is a design and testing pattern, not a security certification. It does not prevent prompt injection, compromised dependencies, or a malicious tool. It makes their effects more explicit and gives a maintainer a place to add controls. Start with the threat model and adapt it to your system.

## License

Apache-2.0. See [LICENSE](LICENSE).

## Talk context

Prepared for Rishabh Banga's FOSSY 2026 session, *From Prompts to Runtime Signals: Making Open-Source AI Systems More Trustworthy.*
