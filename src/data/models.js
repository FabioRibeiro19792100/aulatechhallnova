import { CODING_AI_MODE } from "../utils.js";

export const FALLBACK_MODEL_CATALOG = {
  chat: [
    { id: "gpt-4o-mini", label: "GPT-4o mini", releasedAt: "2024-07", pricing: { input: 0.15, output: 0.6 }, supportsWebSearch: false },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini", releasedAt: "2025-04", pricing: { input: 0.4, output: 1.6 }, supportsWebSearch: false },
    { id: "gpt-4o", label: "GPT-4o", releasedAt: "2024-05", pricing: { input: 5, output: 15 }, supportsWebSearch: false },
    { id: "gpt-4.1", label: "GPT-4.1", releasedAt: "2025-04", pricing: { input: 2, output: 8 }, supportsWebSearch: true },
    { id: "gpt-5-mini", label: "GPT-5 mini", releasedAt: "2025-08", pricing: { input: 0.25, output: 2 }, supportsWebSearch: true },
    { id: "gpt-5", label: "GPT-5", releasedAt: "2025-08", pricing: { input: 1.25, output: 10 }, supportsWebSearch: true },
  ],
  coding: [
    { id: "gpt-5.1-codex-mini", label: "GPT-5.1 Codex Mini", releasedAt: "2025-11", pricing: { input: 0.25, output: 2 } },
    { id: "gpt-5.1-codex", label: "GPT-5.1 Codex", releasedAt: "2025-11", pricing: { input: 1.25, output: 10 } },
    { id: "gpt-5.3-codex", label: "GPT-5.3 Codex", releasedAt: "2026-02", pricing: { input: 1.75, output: 14 } },
  ],
};

export const DEFAULT_CHAT_MODEL = "gpt-4.1-mini";
export const DEFAULT_CODING_MODEL = "gpt-5.1-codex-mini";

export function getModelCatalog(serverConfig) {
  const models = serverConfig?.models;
  if (models && Array.isArray(models.chat) && models.chat.length && Array.isArray(models.coding) && models.coding.length) {
    return models;
  }
  return FALLBACK_MODEL_CATALOG;
}

export function getModelsForMode(catalog, aiMode) {
  return aiMode === CODING_AI_MODE ? catalog.coding : catalog.chat;
}

export function getCatalogEntries(catalog) {
  return [...(catalog?.chat || []), ...(catalog?.coding || [])];
}

export function findModelEntry(catalog, id) {
  return getCatalogEntries(catalog).find((model) => model.id === id) || null;
}

export function getModelPricingMap(catalog) {
  const map = {};
  getCatalogEntries(catalog).forEach((model) => {
    if (model?.id && model.pricing) map[model.id] = model.pricing;
  });
  return map;
}

export function getModelLabel(catalog, id) {
  return findModelEntry(catalog, id)?.label || id;
}

export function getDefaultModelForMode(serverConfig, aiMode) {
  if (aiMode === CODING_AI_MODE) {
    return serverConfig?.defaultCodingModel || DEFAULT_CODING_MODEL;
  }
  return serverConfig?.defaultChatModel || DEFAULT_CHAT_MODEL;
}

export function supportsWebSearch(catalog, id) {
  return Boolean(findModelEntry(catalog, id)?.supportsWebSearch);
}

export function getDefaultWebSearchModel(catalog) {
  const preferredIds = ["gpt-5-mini", "gpt-4.1", "gpt-5"];
  for (const id of preferredIds) {
    if (supportsWebSearch(catalog, id)) return id;
  }
  return (catalog?.chat || []).find((model) => model.supportsWebSearch)?.id || DEFAULT_CHAT_MODEL;
}
