import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { enrichReasoningModels, normalizeReasoningEfforts, readReasoningMetadata } from '../server/reasoning-models.mjs';
import { createOAuthBridge } from '../server/oauth-bridge.mjs';

async function cacheFixture(t, data) {
  const dir = await mkdtemp(path.join(tmpdir(), 'fitmind-model-metadata-'));
  const cachePath = path.join(dir, 'models_cache.json');
  await writeFile(cachePath, JSON.stringify(data));
  t.after(async () => { await unlink(cachePath); await rmdir(dir); });
  return cachePath;
}

test('reasoning normalization allows only actual offered known efforts in stable order', () => {
  assert.deepEqual(normalizeReasoningEfforts([{ effort: 'ultra', description: 'unused' }, 'low', { effort: 'high' }, 'low', 'unknown', null]), ['low', 'high', 'ultra']);
  assert.deepEqual(normalizeReasoningEfforts(null), []);
});

test('upstream metadata overrides exact cached slug and never leaks unrelated cached fields', async (t) => {
  const cachePath = await cacheFixture(t, { models: [
    { slug: 'gpt-6-astra', supported_reasoning_levels: [{ effort: 'low' }, { effort: 'max' }, { effort: 'ultra' }], base_instructions: 'must not be forwarded' },
    { slug: 'gpt-5.6-luna', supported_reasoning_levels: [{ effort: 'low' }, { effort: 'max' }] },
    { slug: 'gpt-only-in-cache', supported_reasoning_levels: [{ effort: 'ultra' }] }
  ] });
  const bridge = createOAuthBridge({ modelsCachePath: cachePath, fetchImpl: async () => new Response(JSON.stringify({ data: [
    { id: 'gpt-6-astra', supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }], privateField: 'omit' },
    { id: 'gpt-5.6-luna' }
  ] }), { headers: { 'Content-Type': 'application/json' } }) });
  assert.deepEqual(await bridge.listModels(), [
    { id: 'gpt-6-astra', reasoningEfforts: ['low', 'high'] },
    { id: 'gpt-5.6-luna', reasoningEfforts: ['low', 'max'] }
  ]);
});

test('missing or malformed cache uses common levels only for verified exact IDs', async (t) => {
  const cachePath = await cacheFixture(t, { models: [] });
  const missing = await readReasoningMetadata(path.join(path.dirname(cachePath), 'absent.json'));
  assert.equal(missing.size, 0);
  assert.deepEqual(enrichReasoningModels([{ id: 'gpt-6-astra' }, { id: 'gpt-5.4-mini' }, { id: 'gpt-6-astra-future' }], missing), [
    { id: 'gpt-6-astra', reasoningEfforts: ['low', 'medium', 'high', 'xhigh'] },
    { id: 'gpt-5.4-mini', reasoningEfforts: ['low', 'medium', 'high', 'xhigh'] },
    { id: 'gpt-6-astra-future', reasoningEfforts: ['low'] }
  ]);
  await writeFile(cachePath, '{ malformed');
  assert.equal((await readReasoningMetadata(cachePath)).size, 0);
});

test('explicit empty or invalid metadata does not invent fallback support', () => {
  const cached = new Map([['gpt-6-astra', ['low', 'ultra']]]);
  assert.deepEqual(enrichReasoningModels([{ id: 'gpt-6-astra', supported_reasoning_levels: [] }, { id: 'gpt-test', supported_reasoning_levels: ['unknown'] }], cached), [
    { id: 'gpt-6-astra', reasoningEfforts: [] }, { id: 'gpt-test', reasoningEfforts: [] }
  ]);
});
