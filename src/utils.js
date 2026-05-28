// Shared constants and helper functions used across components

export const FREE_ACTION_KEY = "__free_instruction__";
export const FREE_ACTION_LABEL = "Escrever minha própria instrução";
export const TRAINING_THREAD_ID = "__training__";
export const CHAT_AI_MODE = "chat";
export const CODING_AI_MODE = "coding";
export const TOKEN_MISSION_TRAINING_ID = "training_lab";
export const TOKEN_POLICY_MODE_UNLIMITED = "unlimited";
export const TOKEN_POLICY_MODE_DEFAULT = "default_15000";
export const TOKEN_POLICY_MODE_CUSTOM = "custom";
export const DEFAULT_MISSION_TOKEN_LIMIT = 15000;
export const ANALYSIS_NOT_APPLICABLE = "não aplicável nesta rodada";
export const PRESENCE_STALE_MS = 45000;
export const MONTH_LABELS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const USD_TO_BRL = 5.4;

export const TECHNICAL_FEEDBACK_REASONS = [
  "Muito vaga",
  "Muito técnica",
  "Muito redundante",
  "Me afastou do meu objetivo",
  "Recomendação pouco assertiva",
];

export const FACILITATOR_TOOL_VIEWS = {
  MENU: "menu",
  CONFIG: "config",
  BROADCAST: "broadcast",
  SCREEN: "screen",
  TIMER: "timer",
  ROOM_MAP: "room-map",
  TOKENS: "tokens",
};

export const PERGUNTAS_REFLEXAO = [
  { id: "q1", texto: "O que a IA fez correspondeu ao que você esperava?", min: "muito abaixo", max: "muito acima" },
  { id: "q2", texto: "Consegue imaginar onde usaria isso no trabalho?", min: "nao consigo", max: "consigo claramente" },
  { id: "q3", texto: "Quão confortável você se sente usando IA para esse tipo de tarefa?", min: "desconfortável", max: "muito confortável" },
];

export const REFLECTION_TOPIC_LABELS = {
  q1: "Expectativa atendida",
  q2: "Aplicação no trabalho",
  q3: "Conforto com IA",
};

export const REFLECTION_TOPIC_SHORT_LABELS = {
  q1: "Expectativa",
  q2: "Aplicação",
  q3: "Conforto",
};

export const TECHNICAL_PANEL_BLOCKS = {
  executiveSummary: {
    index: "◎",
    title: "HIGHLIGHT DA RODADA",
    anchor: "Leitura rápida do que mais importa nesta rodada: o que a IA entendeu, onde acertou e o ajuste mais útil para a próxima tentativa.",
  },
  promptReading: {
    index: "①",
    title: "LEITURA DO PROMPT",
    anchor: "Como o modelo interpretou o que foi escrito. Todo prompt passa por três camadas de leitura antes de gerar uma resposta.",
  },
  chainOfThought: {
    index: "②",
    title: "CHAIN OF THOUGHT",
    anchor:
      "Cadeia de raciocínio. Modelos de linguagem não pensam de forma linear, mas é possível reconstruir as etapas de interpretação e escolha que guiaram a resposta gerada.",
    expanded:
      "Cada etapa do chain of thought representa uma decisão implícita do modelo: o que considerar, o que descartar, qual estratégia adotar. Tornar isso visível é o que diferencia um usuário avançado de um iniciante.",
  },
  responseConstruction: {
    index: "③",
    title: "CONSTRUÇÃO DA RESPOSTA",
    anchor: "Como a resposta foi montada: tom, formato, extensão e conceitos ativados.",
  },
  outputEvaluation: {
    index: "④",
    title: "AVALIAÇÃO DA SAÍDA",
    anchor: "Análise crítica do que foi entregue em relação ao que foi pedido.",
  },
  nextStep: {
    index: "⑤",
    title: "PRÓXIMO PASSO SUGERIDO",
    anchor: "Sugestões concretas para o aluno evoluir o prompt e obter respostas mais precisas.",
  },
  glossary: {
    index: "⑥",
    title: "GLOSSÁRIO DA RODADA",
    anchor: "Termos técnicos usados nesta análise.",
  },
};

export function formatBRL(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatModelLaunch(releasedAt = "") {
  const match = /^(\d{4})-(\d{2})$/.exec(releasedAt);
  if (!match) return "";
  const month = MONTH_LABELS_PT[Number(match[2]) - 1];
  return month ? `${month}/${match[1]}` : match[1];
}

export function formatModelPriceHint(entry) {
  if (!entry?.pricing) return "";
  const inputBRL = formatBRL(entry.pricing.input * USD_TO_BRL);
  const outputBRL = formatBRL(entry.pricing.output * USD_TO_BRL);
  return `${inputBRL}/1M entrada · ${outputBRL}/1M saída`;
}

export function formatTokenLimitLabel(limit) {
  if (limit === null || limit === undefined) return "Ilimitado";
  return `${Number(limit).toLocaleString("pt-BR")} tokens`;
}

export function parseTokenLimitInput(value) {
  const digits = `${value || ""}`.replace(/\D/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function formatTokenLimitInput(value) {
  const parsed = parseTokenLimitInput(value);
  if (!parsed) return "";
  return parsed.toLocaleString("pt-BR");
}

export function formatCountdown(ms = 0) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDateTime(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function isFreeInstructionAction(acao) {
  return acao === FREE_ACTION_KEY;
}

export function getActionLabel(acao) {
  return isFreeInstructionAction(acao) ? FREE_ACTION_LABEL : acao || "-";
}

export function downloadTextArtifact(content, fileName = "artifact.txt", mimeType = "text/plain;charset=utf-8") {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadHtmlArtifact(html, fileName = "prototipo.html") {
  downloadTextArtifact(html, fileName, "text/html;charset=utf-8");
}

export function writePreviewWindowDocument(previewWindow, html) {
  if (!previewWindow || previewWindow.closed) return;
  previewWindow.document.open();
  previewWindow.document.write(html);
  previewWindow.document.close();
}

export function buildPreviewWindowHtmlDocument(html, title = "Preview HTML") {
  const normalized = `${html || ""}`.trim();
  if (/^<!doctype html>/i.test(normalized) || /^<html[\s>]/i.test(normalized)) {
    return normalized;
  }
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>html,body{margin:0;padding:0;background:#fff;min-height:100%;}</style>
  </head>
  <body>${normalized}</body>
</html>`;
}

export function openHtmlPreviewWindow(html, title = "Preview HTML") {
  if (typeof window === "undefined") return null;
  const previewWindow = window.open("", "_blank");
  if (!previewWindow) return null;
  writePreviewWindowDocument(previewWindow, buildPreviewWindowHtmlDocument(html, title));
  return previewWindow;
}

export function normalizeStudentName(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function getEventStudentOptions(evento) {
  if (!evento) return [];

  const rawEntries = (evento.teams || []).flatMap((teamItem, teamIdx) => {
    const names = teamItem.members?.length ? teamItem.members : teamItem.name ? [teamItem.name] : [];
    return names
      .map((name) => normalizeStudentName(name))
      .filter(Boolean)
      .map((name) => ({
        id: `${teamIdx}__${name}`,
        name,
        teamIdx,
        teamName: teamItem.name || `Time ${teamIdx + 1}`,
        fallbackFromTeamName: !(teamItem.members?.length),
      }));
  });

  const duplicateCounts = rawEntries.reduce((accumulator, item) => {
    accumulator[item.name] = (accumulator[item.name] || 0) + 1;
    return accumulator;
  }, {});

  return rawEntries.map((item) => ({
    ...item,
    showTeamName: item.fallbackFromTeamName || duplicateCounts[item.name] > 1,
  }));
}

export function isPresenceLive(presence) {
  if (!presence?.lastSeenAt) return false;
  return Date.now() - new Date(presence.lastSeenAt).getTime() < PRESENCE_STALE_MS;
}

export function getScreenShareState(evento) {
  return {
    active: false,
    roomName: "",
    presenterId: "",
    startedAt: null,
    endedAt: null,
    provider: "livekit",
    ...(evento.screenShare || {}),
  };
}

export async function fetchLiveKitToken({ roomName, identity, name, canPublish }) {
  const response = await fetch("/api/livekit/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomName,
      identity,
      name,
      canPublish,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao obter token do LiveKit.");
  }

  return response.json();
}

export function getReflectionTopicLabel(questionId) {
  return REFLECTION_TOPIC_LABELS[questionId] || questionId.toUpperCase();
}

export function getReflectionTopicShortLabel(questionId) {
  return REFLECTION_TOPIC_SHORT_LABELS[questionId] || getReflectionTopicLabel(questionId);
}

export function getTokenMissionId(missionId, { isTraining = false } = {}) {
  if (isTraining || missionId === TRAINING_THREAD_ID) return TOKEN_MISSION_TRAINING_ID;
  return missionId;
}

export function getMissionTokenPolicy(evento, missionId, { isTraining = false } = {}) {
  const tokenMissionId = getTokenMissionId(missionId, { isTraining });
  const policy = evento?.missionTokenPolicies?.[tokenMissionId] || {};
  return {
    missionId: tokenMissionId,
    mode: policy.mode || TOKEN_POLICY_MODE_UNLIMITED,
    customLimit: Number(policy.customLimit || 0) || 0,
    temporaryUnlimited: Boolean(policy.temporaryUnlimited),
    updatedAt: policy.updatedAt || null,
  };
}

export function getMissionTokenBaseLimit(policy) {
  if (!policy || policy.temporaryUnlimited || policy.mode === TOKEN_POLICY_MODE_UNLIMITED) return null;
  if (policy.mode === TOKEN_POLICY_MODE_CUSTOM) {
    const customLimit = Number(policy.customLimit || 0);
    return customLimit > 0 ? customLimit : DEFAULT_MISSION_TOKEN_LIMIT;
  }
  return DEFAULT_MISSION_TOKEN_LIMIT;
}

export function getMissionAiMode(mission) {
  return mission?.aiMode === CODING_AI_MODE ? CODING_AI_MODE : CHAT_AI_MODE;
}

export function normalizeMission(mission) {
  return {
    ...mission,
    aiMode: getMissionAiMode(mission),
  };
}

export function buildHistorySignal(historyContext) {
  if (!historyContext.length) return "Esta resposta foi gerada como uma primeira rodada desta missao.";
  return `Esta resposta considerou ${historyContext.length} execu${historyContext.length === 1 ? "cao anterior" : "coes anteriores"} desta missao.`;
}

export function isMeaningfulAnalysisText(value) {
  const normalized = `${value || ""}`.trim();
  if (!normalized) return false;
  return normalized.toLowerCase() !== ANALYSIS_NOT_APPLICABLE.toLowerCase();
}

export function normalizeAnalysisItemArray(value) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value
          .split(/\n+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  const normalized = values.map((item) => `${item || ""}`.trim()).filter(Boolean);
  return normalized.length ? normalized : [ANALYSIS_NOT_APPLICABLE];
}

export function normalizeGlossaryEntries(entries = []) {
  const source = Array.isArray(entries) ? entries : [];
  return source
    .map((entry) => {
      if (typeof entry === "string") {
        const term = entry.trim();
        return term ? { term, definition: "Definição não informada nesta rodada." } : null;
      }
      const term = `${entry?.term || entry?.name || ""}`.trim();
      const definition = `${entry?.definition || entry?.meaning || entry?.explanation || ""}`.trim();
      if (!term) return null;
      return {
        term,
        definition: definition || "Definição não informada nesta rodada.",
      };
    })
    .filter(Boolean);
}

export function mergeGlossaryEntries(existingEntries = [], nextEntries = []) {
  const merged = new globalThis.Map();
  [...normalizeGlossaryEntries(existingEntries), ...normalizeGlossaryEntries(nextEntries)].forEach((entry) => {
    const key = entry.term.toLowerCase();
    if (!merged.has(key)) {
      merged.set(key, entry);
      return;
    }
    const previous = merged.get(key);
    const previousDefinition = `${previous?.definition || ""}`.trim();
    if (!previousDefinition || previousDefinition === "Definição não informada nesta rodada.") {
      merged.set(key, entry);
    }
  });
  return [...merged.values()];
}

export function buildTechnicalAnalysisFallbackBlocks() {
  return {
    executiveSummary: {
      takeaway: ANALYSIS_NOT_APPLICABLE,
      risk: ANALYSIS_NOT_APPLICABLE,
      nextMove: ANALYSIS_NOT_APPLICABLE,
    },
    promptReading: {
      explicit: [ANALYSIS_NOT_APPLICABLE],
      inferred: [ANALYSIS_NOT_APPLICABLE],
      assumed: [ANALYSIS_NOT_APPLICABLE],
      ambiguities: [ANALYSIS_NOT_APPLICABLE],
    },
    chainOfThought: {
      contextConsidered: [ANALYSIS_NOT_APPLICABLE],
      strategyChosen: [ANALYSIS_NOT_APPLICABLE],
      discarded: [ANALYSIS_NOT_APPLICABLE],
      expandedExplanation: ANALYSIS_NOT_APPLICABLE,
    },
    responseConstruction: {
      toneAndFormat: [ANALYSIS_NOT_APPLICABLE],
      conceptsActivated: [ANALYSIS_NOT_APPLICABLE],
      generationLimitations: [ANALYSIS_NOT_APPLICABLE],
    },
    outputEvaluation: {
      whatWorked: [ANALYSIS_NOT_APPLICABLE],
      whatStayedGeneric: [ANALYSIS_NOT_APPLICABLE],
      gapBetweenRequestAndDelivery: [ANALYSIS_NOT_APPLICABLE],
    },
    nextStep: {
      howToReformulate: [ANALYSIS_NOT_APPLICABLE],
      whatToTestNext: [ANALYSIS_NOT_APPLICABLE],
    },
  };
}

export function normalizeTechnicalAnalysis(details = {}, { historyContext = [], accumulatedGlossary = [] } = {}) {
  const fallbackBlocks = buildTechnicalAnalysisFallbackBlocks();
  const legacyPromptBreakdown = Array.isArray(details.promptBreakdown) ? details.promptBreakdown : [];
  const legacyConcepts = Array.isArray(details.conceptsAndTerminologies) ? details.conceptsAndTerminologies : [];
  const legacyConstruction = details.constructionProcess || {};
  const legacyInferredPoints = Array.isArray(legacyConstruction.inferredPoints) ? legacyConstruction.inferredPoints : [];
  const legacyAssumptions = Array.isArray(legacyConstruction.assumptionsMade) ? legacyConstruction.assumptionsMade : [];
  const legacyAmbiguities = Array.isArray(legacyConstruction.ambiguities) ? legacyConstruction.ambiguities : [];
  const historyFallback = details.usedHistoryContext || historyContext.length > 0 ? [details.historySignal || buildHistorySignal(historyContext)] : [];
  const contextFallback = isMeaningfulAnalysisText(details.contextUse) ? [details.contextUse] : historyFallback;
  const explicitFallback = legacyPromptBreakdown
    .filter((item) => `${item.segment || ""}`.toLowerCase().includes("exp"))
    .map((item) => item.function || item.segment)
    .filter(Boolean);
  const inferredFallback = legacyInferredPoints.length
    ? legacyInferredPoints
    : isMeaningfulAnalysisText(details.objectiveInterpreted)
      ? [details.objectiveInterpreted]
      : [];
  const roundGlossary = normalizeGlossaryEntries(
    details.glossary?.round ||
      details.glossary ||
      details.technicalTerms ||
      legacyConcepts.map((item) => ({
        term: item.term || item.name || item.segment,
        definition: item.meaning || item.function || item.relevance,
      })),
  );
  const glossaryAccumulated = mergeGlossaryEntries(accumulatedGlossary, roundGlossary);

  const normalized = {
    ...details,
    executiveSummary: {
      takeaway: `${details.executiveSummary?.takeaway || details.takeaway || details.objectiveInterpreted || ""}`.trim() || ANALYSIS_NOT_APPLICABLE,
      risk:
        `${details.executiveSummary?.risk || details.mainRisk || details.limitations || ""}`.trim() ||
        ANALYSIS_NOT_APPLICABLE,
      nextMove:
        `${details.executiveSummary?.nextMove || details.recommendedNextMove || details.howToAskBetter?.[0] || ""}`.trim() ||
        ANALYSIS_NOT_APPLICABLE,
    },
    promptReading: {
      explicit: normalizeAnalysisItemArray(details.promptReading?.explicit?.length ? details.promptReading.explicit : explicitFallback),
      inferred: normalizeAnalysisItemArray(details.promptReading?.inferred?.length ? details.promptReading.inferred : inferredFallback),
      assumed: normalizeAnalysisItemArray(details.promptReading?.assumed?.length ? details.promptReading.assumed : legacyAssumptions),
      ambiguities: normalizeAnalysisItemArray(details.promptReading?.ambiguities?.length ? details.promptReading.ambiguities : legacyAmbiguities),
    },
    chainOfThought: {
      contextConsidered: normalizeAnalysisItemArray(
        details.chainOfThought?.contextConsidered?.length ? details.chainOfThought.contextConsidered : contextFallback,
      ),
      strategyChosen: normalizeAnalysisItemArray(
        details.chainOfThought?.strategyChosen || details.strategyUsed || details.strategy,
      ),
      discarded: normalizeAnalysisItemArray(
        details.chainOfThought?.discarded || details.alternativeAnswerPaths || details.limitationsAndGaps,
      ),
      expandedExplanation: `${details.chainOfThought?.expandedExplanation || details.summary || details.mechanismSummary || details.whyThisAnswer || ""}`.trim() ||
        ANALYSIS_NOT_APPLICABLE,
    },
    responseConstruction: {
      toneAndFormat: normalizeAnalysisItemArray(
        details.responseConstruction?.toneAndFormat ||
          (isMeaningfulAnalysisText(details.actionInfluence) ? [details.actionInfluence] : []),
      ),
      conceptsActivated: normalizeAnalysisItemArray(
        details.responseConstruction?.conceptsActivated ||
          legacyConcepts.map((item) => item.term || item.name).filter(Boolean),
      ),
      generationLimitations: normalizeAnalysisItemArray(
        details.responseConstruction?.generationLimitations || details.limitations || details.limitationsAndGaps,
      ),
    },
    outputEvaluation: {
      whatWorked: normalizeAnalysisItemArray(
        details.outputEvaluation?.whatWorked ||
          (isMeaningfulAnalysisText(details.whyThisAnswer) ? [details.whyThisAnswer] : []),
      ),
      whatStayedGeneric: normalizeAnalysisItemArray(
        details.outputEvaluation?.whatStayedGeneric || details.limitationsAndGaps || details.limitations,
      ),
      gapBetweenRequestAndDelivery: normalizeAnalysisItemArray(
        details.outputEvaluation?.gapBetweenRequestAndDelivery || details.limitationsAndGaps,
      ),
    },
    nextStep: {
      howToReformulate: normalizeAnalysisItemArray(
        details.nextStep?.howToReformulate || details.refinementSuggestions || details.howToAskBetter,
      ),
      whatToTestNext: normalizeAnalysisItemArray(details.nextStep?.whatToTestNext || details.bestPractices),
    },
    glossary: {
      round: roundGlossary,
      accumulated: glossaryAccumulated,
    },
  };

  Object.keys(fallbackBlocks).forEach((blockKey) => {
    normalized[blockKey] = normalized[blockKey] || fallbackBlocks[blockKey];
  });

  return {
    ...normalized,
    objectiveInterpreted:
      normalized.promptReading.explicit.find(isMeaningfulAnalysisText) ||
      normalized.promptReading.inferred.find(isMeaningfulAnalysisText) ||
      details.objectiveInterpreted ||
      ANALYSIS_NOT_APPLICABLE,
    strategyUsed:
      normalized.chainOfThought.strategyChosen.find(isMeaningfulAnalysisText) ||
      details.strategyUsed ||
      ANALYSIS_NOT_APPLICABLE,
    promptBreakdown:
      legacyPromptBreakdown.length
        ? legacyPromptBreakdown
        : [
            { segment: "Explícito", function: normalized.promptReading.explicit.join(" • ") },
            { segment: "Inferido", function: normalized.promptReading.inferred.join(" • ") },
            { segment: "Assumido", function: normalized.promptReading.assumed.join(" • ") },
            { segment: "Ambiguidades", function: normalized.promptReading.ambiguities.join(" • ") },
          ],
    conceptsAndTerminologies:
      legacyConcepts.length
        ? legacyConcepts
        : normalized.glossary.round.map((item) => ({
            term: item.term,
            meaning: item.definition,
          })),
    constructionProcess: {
      explicitRequests: normalized.promptReading.explicit,
      inferredPoints: normalized.promptReading.inferred,
      assumptionsMade: normalized.promptReading.assumed,
      ambiguities: normalized.promptReading.ambiguities,
    },
    limitationsAndGaps: normalized.outputEvaluation.whatStayedGeneric,
    refinementSuggestions: [
      ...normalized.nextStep.howToReformulate,
      ...normalized.nextStep.whatToTestNext,
    ].filter((item, index, array) => array.indexOf(item) === index),
    contextUse: normalized.chainOfThought.contextConsidered.join(" • "),
    technicalTerms: normalized.glossary.accumulated.map((item) => ({
      term: item.term,
      meaning: item.definition,
    })),
    mechanismSummary: normalized.chainOfThought.expandedExplanation,
    summary: normalized.chainOfThought.expandedExplanation,
    selectionLogic: normalized.chainOfThought.strategyChosen.join(" • "),
    whyThisAnswer: normalized.outputEvaluation.whatWorked.join(" • "),
    alternativeAnswerPaths: normalized.chainOfThought.discarded,
    actionInfluence: normalized.responseConstruction.toneAndFormat.join(" • "),
    limitations: normalized.responseConstruction.generationLimitations.join(" • "),
    howToAskBetter: normalized.nextStep.howToReformulate,
    bestPractices: normalized.nextStep.whatToTestNext,
    takeaway: normalized.executiveSummary.takeaway,
    mainRisk: normalized.executiveSummary.risk,
    recommendedNextMove: normalized.executiveSummary.nextMove,
  };
}
