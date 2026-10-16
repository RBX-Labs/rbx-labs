import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const here = new URL('../', import.meta.url);
const readJson = async (relativePath) =>
  JSON.parse(await readFile(new URL(relativePath, here), 'utf8'));

const policy = await readJson('policy/runtime-policy.example.json');
const evaluation = await readJson('evals/feature-x-upgrade.json');
const promptOnly = await readJson('traces/prompt-only-run.json');
const runtimeAware = await readJson('traces/runtime-aware-run.json');

const hasIndependentlyObservedEffect = (trace) =>
  trace.observed_effect.status === 'observed' &&
  trace.observed_effect.independently_verified === true &&
  Boolean(trace.observed_effect.evidence);

assert.equal(policy.action.authority, 'read_only');
assert.equal(policy.post_action_verification.required, true);
assert.equal(policy.post_action_verification.execution_acknowledgement.satisfies_proof, false);
assert.equal(policy.post_action_verification.observed_effect.required_for_completion, true);
assert.equal(policy.post_action_verification.observed_effect.requires_independent_verification, true);
assert.equal(policy.human_disposition.required_for_authorized_action, true);
assert.equal(policy.accountable_rationale.required_for_closure, true);
assert.equal(policy.accountable_rationale.record_separately_from_human_disposition, true);
assert.equal(policy.fallback.outcome, 'needs_maintainer_review');

for (const signal of [
  'retrieval_coverage',
  'source_freshness_days',
  'source_conflict',
  'tool_scope'
]) {
  assert.ok(signal in policy.required_signals, `policy is missing ${signal}`);
  assert.ok(signal in runtimeAware.observed_signals, `runtime trace is missing ${signal}`);
}

for (const trace of [promptOnly, runtimeAware]) {
  for (const field of [
    'runtime_outcome',
    'human_disposition',
    'accountable_rationale',
    'execution_acknowledgement',
    'observed_effect'
  ]) {
    assert.ok(field in trace, `${trace.trace_id} is missing ${field}`);
  }
  assert.ok(!('decision' in trace), `${trace.trace_id} must not collapse lifecycle state into decision`);
  assert.ok(!('rationale' in trace.human_disposition), `${trace.trace_id} must keep accountable rationale separate from human disposition`);
  assert.notStrictEqual(trace.human_disposition, trace.accountable_rationale);
}

assert.equal(runtimeAware.schema_version, '0.3.0');
assert.equal(evaluation.expected.runtime_outcome, 'needs_maintainer_review');
assert.equal(evaluation.expected.human_disposition, 'pending');
assert.equal(evaluation.expected.accountable_rationale, 'pending');
assert.equal(runtimeAware.runtime_outcome, 'needs_maintainer_review');
assert.equal(runtimeAware.human_disposition.status, 'pending');
assert.equal(runtimeAware.human_disposition.owner, 'maintainer');
assert.notEqual(runtimeAware.human_disposition.status, 'approved', 'Pending human review must not be represented as approval.');
assert.equal(runtimeAware.accountable_rationale.status, 'pending');
assert.equal(runtimeAware.accountable_rationale.reason, null);
assert.equal(runtimeAware.execution_acknowledgement.status, 'not_attempted');
assert.equal(runtimeAware.observed_effect.status, 'not_observed');
assert.equal(runtimeAware.observed_effect.independently_verified, false);
assert.equal(promptOnly.mode, 'prompt_only');
assert.equal(promptOnly.runtime_outcome, 'approved', 'The fixture must preserve the unsafe prompt-only approval for comparison.');
assert.equal(promptOnly.human_disposition.status, 'not_recorded');
assert.equal(promptOnly.accountable_rationale.status, 'not_recorded');
assert.equal(promptOnly.execution_acknowledgement.status, 'not_attempted');
assert.equal(promptOnly.observed_effect.status, 'not_observed');
assert.equal(promptOnly.observed_effect.independently_verified, false);
assert.ok(promptOnly.why_this_is_not_trustworthy.length > 0, 'Prompt-only approval must be explicitly marked as unsafe.');
assert.equal(runtimeAware.observed_signals.source_conflict, 'unresolved');
assert.equal(runtimeAware.observed_signals.tool_scope, 'within_policy');

const acknowledgementOnly = structuredClone(runtimeAware);
acknowledgementOnly.execution_acknowledgement = {
  status: 'succeeded',
  receipt: 'transport-acknowledgement-only'
};
assert.equal(
  hasIndependentlyObservedEffect(acknowledgementOnly),
  false,
  'A success acknowledgement must not satisfy observed-effect verification.'
);

const independentlyObserved = structuredClone(acknowledgementOnly);
independentlyObserved.observed_effect = {
  ...independentlyObserved.observed_effect,
  status: 'observed',
  evidence: { artifact: 'feature-x-4.2-adapter-result.json' },
  independently_verified: true
};
assert.equal(hasIndependentlyObservedEffect(independentlyObserved), true);

console.log('Runtime Trust Kit contract checks passed.');
