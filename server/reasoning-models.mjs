import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

export const REASONING_EFFORTS = Object.freeze(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra']);
const VERIFIED_MODELS = new Set(['gpt-6-astra', 'gpt-reserve', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5', 'gpt-5.4-mini', 'gpt-5.3-codex-spark']);
const COMMON_EFFORTS = ['low', 'medium', 'high', 'xhigh'];

export function normalizeReasoningEfforts(levels) {
  if (!Array.isArray(levels)) return [];
  const offered = new Set(levels.map((level) => typeof level === 'string' ? level : level?.effort));
  return REASONING_EFFORTS.filter((effort) => offered.has(effort));
}

export async function readReasoningMetadata(cachePath = path.join(process.env.CODEX_HOME || path.join(homedir(), '.codex'), 'models_cache.json')) {
  try {
    // Read model metadata only. OAuth authentication files are not consulted.
    if ((await stat(cachePath)).size > 8 * 1024 * 1024) return new Map();
    const cache = JSON.parse(await readFile(cachePath, 'utf8'));
    if (!Array.isArray(cache.models)) return new Map();
    return new Map(cache.models.filter((model) => typeof model?.slug === 'string' && Object.hasOwn(model, 'supported_reasoning_levels')).map((model) => [model.slug, normalizeReasoningEfforts(model.supported_reasoning_levels)]));
  } catch { return new Map(); }
}

export function enrichReasoningModels(models, metadata = new Map()) {
  return models.map((model) => ({
    id: model.id,
    reasoningEfforts: Object.hasOwn(model, 'supported_reasoning_levels')
      ? normalizeReasoningEfforts(model.supported_reasoning_levels)
      : metadata.has(model.id)
        ? [...metadata.get(model.id)]
        : VERIFIED_MODELS.has(model.id) ? [...COMMON_EFFORTS] : ['low']
  }));
}
