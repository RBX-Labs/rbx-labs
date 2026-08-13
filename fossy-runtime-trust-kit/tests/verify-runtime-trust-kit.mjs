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

assert.equal(policy.action.authority, 'read_only');
assert.equal(policy.post_action_verification.required, true);
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

assert.equal(evaluation.expected.outcome, 'needs_maintainer_review');
assert.equal(runtimeAware.decision, 'needs_maintainer_review');
assert.equal(promptOnly.mode, 'prompt_only');
assert.equal(promptOnly.decision, 'approved', 'The fixture must preserve the unsafe prompt-only approval for comparison.');
assert.ok(promptOnly.why_this_is_not_trustworthy.length > 0, 'Prompt-only approval must be explicitly marked as unsafe.');
assert.equal(runtimeAware.observed_signals.source_conflict, 'unresolved');
assert.equal(runtimeAware.observed_signals.tool_scope, 'within_policy');

console.log('Runtime Trust Kit contract checks passed.');
