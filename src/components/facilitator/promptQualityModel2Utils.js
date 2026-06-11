import { CODING_AI_MODE, TRAINING_THREAD_ID } from "../../utils.js";

export const PROMPT_QUALITY_LAB_CLARITY_LEVELS = ["Chain-of-thought", "Few-shot", "Zero-shot"];
export const PROMPT_QUALITY_LAB_EFFICIENCY_LEVELS = ["Subfornecido", "Calibrado", "Superfornecido"];
export const PROMPT_QUALITY_LAB_MODEL_LEVELS = ["Trial", "Consciente", "Estratégico"];

const QUADRANT_LABELS = {
  topLeft: "Conciso",
  topRight: "Estrategista",
  bottomLeft: "Descobridor",
  bottomRight: "Articulado",
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeText(value = "") {
  return `${value || ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function truncate(text = "", max = 180) {
  const compact = `${text || ""}`.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max).trim()}...`;
}

function estimatePromptTokens(text = "") {
  return Math.max(1, Math.round(`${text || ""}`.trim().length / 4));
}

function hasRole(text = "") {
  const normalized = normalizeText(text);
  return /(voce e|você é|aja como|atue como|como um|como uma|assuma o papel|finja ser)/.test(normalized);
}

function hasContext(text = "") {
  const normalized = normalizeText(text);
  if (estimatePromptTokens(text) >= 70) return true;
  return /(contexto|cenario|cenário|objetivo|preciso|tenho|dados|arquivo|historico|histórico|referencia|referência|baseado|considerando|situa[cç][aã]o)/.test(normalized);
}

function hasTask(text = "") {
  const normalized = normalizeText(text);
  return /(crie|criar|gere|gerar|analise|analisar|resuma|resumir|explique|explicar|liste|listar|implemente|implementar|corrija|corrigir|traduza|traduzir|compare|comparar|refatore|refatorar|me de|me dê|fa[cç]a|fazer)/.test(normalized);
}

function hasFormat(text = "") {
  const normalized = normalizeText(text);
  return /(em html|em json|em csv|em tabela|em lista|em bullets|em passos|formato|estrutura|markdown|planilha|codigo|c[oó]digo|pdf|quadro|matriz)/.test(normalized);
}

function scorePromptClarity(text = "") {
  const parts = [hasRole(text), hasContext(text), hasTask(text), hasFormat(text)];
  return parts.filter(Boolean).length / parts.length;
}

function classifyTaskType(exec = {}) {
  const prompt = normalizeText(exec?.input || "");
  const model = normalizeText(exec?.selectedModel || exec?.effectiveModel || "");
  if (
    exec?.aiMode === CODING_AI_MODE ||
    /codigo|c[oó]digo|html|css|javascript|typescript|react|bug|refator|api|sql|app|componente|backend|frontend/.test(prompt) ||
    /codex/.test(model)
  ) {
    return "coding";
  }
  if (/(compare|analise|analisar|sintetize|estrategia|estratégia|plano|diagnostico|diagnóstico|avali)/.test(prompt)) {
    return "analysis";
  }
  if (/(extraia|extrair|traduza|traduzir|formate|formatar|converta|converter|organize|organizar|liste|listar)/.test(prompt)) {
    return "extraction";
  }
  return "general";
}

function getIdealPromptTokens(taskType) {
  if (taskType === "coding") return 200;
  if (taskType === "analysis") return 150;
  if (taskType === "extraction") return 60;
  return 100;
}

function computeRedundancy(history = []) {
  if (history.length <= 1) return 0;
  const fingerprints = history
    .map((exec) => normalizeText(exec?.input || "").replace(/\d+/g, "#").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((text) => text.slice(0, 180));
  if (!fingerprints.length) return 0;
  const unique = new Set(fingerprints);
  return clamp(1 - unique.size / fingerprints.length, 0, 1);
}

function getModelTier(modelName = "") {
  const normalized = normalizeText(modelName);
  if (!normalized) return "unknown";
  if (/codex|coding/.test(normalized)) return "coding";
  if (/gpt-5|gpt-4o|opus|o1|o3|o4/.test(normalized)) return "high";
  if (/sonnet|mini|4\.1-mini|4o-mini/.test(normalized)) return "medium";
  if (/3\.5|haiku|nano/.test(normalized)) return "low";
  return "medium";
}

function scoreModelChoice(taskType, modelTier) {
  if (taskType === "coding") {
    if (modelTier === "coding" || modelTier === "high") return 1;
    if (modelTier === "medium") return 0.65;
    return 0.3;
  }
  if (taskType === "analysis") {
    if (modelTier === "high") return 1;
    if (modelTier === "medium") return 0.65;
    return 0.3;
  }
  if (taskType === "extraction") {
    if (modelTier === "low") return 1;
    if (modelTier === "medium") return 0.65;
    if (modelTier === "high") return 0.5;
    return 0.5;
  }
  if (modelTier === "medium") return 1;
  if (modelTier === "high") return 0.65;
  if (modelTier === "low") return 0.8;
  return 0.5;
}

function groupHistoryIntoTasks(history = []) {
  const groups = [];
  let current = null;
  history.forEach((exec) => {
    const taskType = classifyTaskType(exec);
    const ts = new Date(exec?.ts || 0).getTime();
    if (
      !current ||
      current.missionId !== exec?.missionId ||
      current.taskType !== taskType ||
      ts - current.lastTs > 15 * 60 * 1000
    ) {
      current = {
        missionId: exec?.missionId || "",
        taskType,
        lastTs: ts,
        runs: [exec],
      };
      groups.push(current);
      return;
    }
    current.lastTs = ts;
    current.runs.push(exec);
  });
  return groups;
}

function mapClarityLevel(score) {
  if (score <= 0.4) return 0;
  if (score <= 0.7) return 1;
  return 2;
}

function mapModelLevel(score) {
  if (score <= 0.4) return 0;
  if (score <= 0.7) return 1;
  return 2;
}

function mapEfficiencyLevel(avgRatio, efficiencyScore, redundancy) {
  if (avgRatio < 0.75) return 0;
  if (avgRatio > 1.25 || redundancy > 0.22 || efficiencyScore < 0.55) return 2;
  return 1;
}

function buildFindingsForClarity(score, historyLength, avgIterations) {
  const findings = [];
  if (score >= 0.72) findings.push({ type: "ok", text: `Clareza alta no histórico: a maior parte dos prompts já chega com tarefa e contexto bem definidos.` });
  if (score >= 0.5 && score < 0.72) findings.push({ type: "warn", text: `Há boa intenção estrutural, mas ainda faltam elementos de contexto ou formato em parte das rodadas.` });
  if (score < 0.5) findings.push({ type: "crit", text: `Os prompts ainda dependem de iterações para ganhar precisão. Falta estrutura mínima recorrente no histórico.` });
  if (avgIterations >= 3.5) findings.push({ type: "warn", text: `A média estimada de ${avgIterations.toFixed(1).replace(".", ",")} iterações por tarefa sugere retrabalho para chegar ao resultado esperado.` });
  if (historyLength >= 8) findings.push({ type: "ok", text: `A leitura já se apoia em uma amostra consistente de ${historyLength} prompts.` });
  return findings.slice(0, 3);
}

function buildFindingsForEfficiency(levelIndex, efficiencyScore, avgPromptTokens, redundancy) {
  const findings = [];
  if (levelIndex === 1) findings.push({ type: "ok", text: `O volume de contexto tende a estar calibrado para o tipo de tarefa observado.` });
  if (levelIndex === 0) findings.push({ type: "warn", text: `Há sinais de contexto insuficiente: prompts curtos demais para a complexidade das tarefas.` });
  if (levelIndex === 2) findings.push({ type: "warn", text: `Há sinais de superfornecimento: muito contexto ou repetição sem ganho proporcional de precisão.` });
  if (redundancy > 0.18) findings.push({ type: "crit", text: `A repetição de estruturas parecidas em vários prompts sugere desperdício de contexto reutilizado sem síntese.` });
  findings.push({ type: efficiencyScore >= 0.7 ? "ok" : "warn", text: `Estimativa média de ${avgPromptTokens} tokens por prompt no recorte rastreável.` });
  return findings.slice(0, 3);
}

function buildFindingsForModel(modelScore, codingRate) {
  const findings = [];
  if (modelScore >= 0.72) findings.push({ type: "ok", text: `As escolhas de modo e modelo tendem a conversar bem com o tipo de tarefa executada.` });
  if (modelScore >= 0.45 && modelScore < 0.72) findings.push({ type: "warn", text: `Há critério parcial na escolha de modelo, mas ainda com algumas decisões mais por hábito do que por estratégia.` });
  if (modelScore < 0.45) findings.push({ type: "crit", text: `As escolhas de modelo ainda parecem pouco consistentes em relação à complexidade das tarefas.` });
  if (codingRate >= 0.45) findings.push({ type: "ok", text: `Uma fatia relevante do histórico está em modo coding, o que aumenta o peso das decisões operacionais.` });
  return findings.slice(0, 3);
}

function buildGeneralText(quadrant, clarityLevel, efficiencyLevel, modelLevel) {
  if (quadrant === QUADRANT_LABELS.bottomLeft) {
    return "O histórico mostra intenção de formulação, mas ainda com pouco contexto e pouca estabilidade para sustentar respostas precisas já na primeira rodada.";
  }
  if (quadrant === QUADRANT_LABELS.topLeft) {
    return "Os prompts tendem a ser econômicos em recursos, mas ainda perdem precisão em partes importantes da tarefa, o que limita a qualidade da primeira resposta.";
  }
  if (quadrant === QUADRANT_LABELS.bottomRight) {
    return "Há articulação e volume de contexto, mas o histórico ainda sugere excesso de recurso para o ganho real de precisão que as tarefas pedem.";
  }
  if (quadrant === QUADRANT_LABELS.topRight) {
    return "O histórico combina boa definição da tarefa com uso mais calibrado de recursos, criando um padrão mais consistente de precisão já no primeiro envio.";
  }
  return "O histórico já permite ler um padrão de formulação, uso de contexto e escolha operacional relativamente estável neste recorte.";
}

function buildGeneralNextSteps(clarityLevel, efficiencyLevel, modelLevel) {
  const steps = [];
  if (clarityLevel < 2) {
    steps.push("Antes de enviar cada prompt, explicitar contexto, tarefa e formato esperado na mesma mensagem.");
  } else {
    steps.push("Transformar os melhores prompts já usados em templates reutilizáveis para as próximas rodadas.");
  }
  if (efficiencyLevel === 0) {
    steps.push("Adicionar um pouco mais de contexto inicial antes de iterar, para reduzir respostas vagas e retrabalho.");
  } else if (efficiencyLevel === 2) {
    steps.push("Enxugar histórico repetido e consolidar contexto em blocos mais curtos, evitando superfornecimento.");
  } else {
    steps.push("Manter o padrão atual de contexto calibrado e revisar apenas quando a tarefa mudar de natureza.");
  }
  if (modelLevel < 2) {
    steps.push("Escolher o modelo com base no tipo de tarefa: raciocínio, extração, formatação ou coding.");
  } else {
    steps.push("Documentar explicitamente o critério de seleção de modelo para preservar esse padrão estratégico.");
  }
  return steps.slice(0, 3);
}

function getMissionLabel(exec = {}, missions = []) {
  if (exec?.missionId === TRAINING_THREAD_ID || exec?.missionId === "__training__") return "Treino";
  const mission = missions.find((item) => item.id === exec?.missionId);
  return mission ? `${mission.num}. ${mission.name}` : "Missão";
}

function formatCost(value = 0) {
  return `$${Number(value || 0).toFixed(4)}`;
}

export function buildPromptQualityModel2Analysis({ participant, eventName, missions = [] }) {
  const history = Array.isArray(participant?.history) ? participant.history : [];
  const promptScores = history.map((exec) => scorePromptClarity(exec?.input || ""));
  const clarityScore = promptScores.length
    ? promptScores.reduce((sum, value) => sum + value, 0) / promptScores.length
    : 0;

  const promptTokenEstimates = history.map((exec) => estimatePromptTokens(exec?.input || ""));
  const avgPromptTokens = promptTokenEstimates.length
    ? Math.round(promptTokenEstimates.reduce((sum, value) => sum + value, 0) / promptTokenEstimates.length)
    : 0;

  const taskGroups = groupHistoryIntoTasks(history);
  const avgIterations = taskGroups.length
    ? history.length / taskGroups.length
    : history.length || 0;

  const promptRatios = history.map((exec) => {
    const taskType = classifyTaskType(exec);
    const ideal = getIdealPromptTokens(taskType);
    return estimatePromptTokens(exec?.input || "") / ideal;
  });
  const avgRatio = promptRatios.length
    ? promptRatios.reduce((sum, value) => sum + value, 0) / promptRatios.length
    : 1;
  const redundancy = computeRedundancy(history);
  const densityDeviation = Math.abs(1 - avgRatio);
  const efficiencyScore = clamp((1 - redundancy) * (1 / (1 + densityDeviation)), 0, 1);

  const modelScores = history.map((exec) => {
    const taskType = classifyTaskType(exec);
    const modelTier = getModelTier(exec?.effectiveModel || exec?.selectedModel || "");
    return scoreModelChoice(taskType, modelTier);
  });
  const modelFitScore = modelScores.length
    ? modelScores.reduce((sum, value) => sum + value, 0) / modelScores.length
    : 0.5;

  const clarityLevel = mapClarityLevel(clarityScore);
  const efficiencyLevel = mapEfficiencyLevel(avgRatio, efficiencyScore, redundancy);
  const modelLevel = mapModelLevel(modelFitScore);

  const qy = clamp((1 - clarityScore) * 90 + 5, 5, 95);
  let qx = 50;
  if (efficiencyLevel === 1) {
    qx = clamp(45 + modelFitScore * 10, 40, 60);
  } else if (efficiencyLevel === 0) {
    qx = clamp(5 + efficiencyScore * 40, 5, 45);
  } else {
    qx = clamp(55 + (1 - efficiencyScore) * 40, 55, 95);
  }

  const quadrant =
    qy <= 50
      ? qx < 50
        ? QUADRANT_LABELS.topLeft
        : QUADRANT_LABELS.topRight
      : qx < 50
        ? QUADRANT_LABELS.bottomLeft
        : QUADRANT_LABELS.bottomRight;

  const trainingPrompts = history.filter((exec) => exec?.missionId === TRAINING_THREAD_ID || exec?.missionId === "__training__").length;
  const missionPrompts = Math.max(history.length - trainingPrompts, 0);
  const totalTokens = history.reduce((sum, exec) => sum + (exec?.tokens || 0), 0);
  const totalCost = history.reduce((sum, exec) => sum + (typeof exec?.custo === "number" ? exec.custo : 0), 0);
  const codingRate = history.length
    ? history.filter((exec) => exec?.aiMode === CODING_AI_MODE).length / history.length
    : 0;

  return {
    participant_id: participant.participantId,
    event_name: eventName,
    scores: {
      clarity: Number(clarityScore.toFixed(2)),
      efficiency: Number(efficiencyScore.toFixed(2)),
      modelFit: Number(modelFitScore.toFixed(2)),
    },
    stats: {
      prompts: history.length,
      custo: formatCost(totalCost),
      tokens: totalTokens,
      treino: trainingPrompts,
      promptsMissao: missionPrompts,
      tokensPorPrompt: avgPromptTokens,
    },
    triad: {
      clarity: clarityLevel,
      efficiency: efficiencyLevel,
      modelFit: modelLevel,
    },
    qx: Number(qx.toFixed(1)),
    qy: Number(qy.toFixed(1)),
    quadrant,
    tabs: {
      geral: {
        text: buildGeneralText(quadrant, clarityLevel, efficiencyLevel, modelLevel),
        findings: [
          ...buildFindingsForClarity(clarityScore, history.length, avgIterations).slice(0, 1),
          ...buildFindingsForEfficiency(efficiencyLevel, efficiencyScore, avgPromptTokens, redundancy).slice(0, 1),
          ...buildFindingsForModel(modelFitScore, codingRate).slice(0, 1),
        ].slice(0, 3),
        nextSteps: buildGeneralNextSteps(clarityLevel, efficiencyLevel, modelLevel),
      },
      clareza: {
        text:
          clarityLevel === 2
            ? "Os prompts tendem a chegar com objetivo, contexto e direção suficientes para o modelo responder sem depender de andaimes extras."
            : clarityLevel === 1
              ? "Há bons sinais de estrutura, mas o histórico ainda alterna entre pedidos completos e pedidos que exigem complementos nas rodadas seguintes."
              : "O histórico ainda mostra prompts curtos ou vagos demais para sustentar respostas precisas sem iteração corretiva.",
        findings: buildFindingsForClarity(clarityScore, history.length, avgIterations),
        tip: {
          label: "Estrutura recomendada",
          text:
            clarityLevel === 2
              ? "Preserve o padrão atual e acrescente restrições negativas quando quiser reduzir ainda mais as iterações."
              : "Use a sequência contexto → tarefa → formato esperado no mesmo prompt para reduzir ambiguidade sem depender de várias rodadas.",
        },
      },
      eficiencia: {
        text:
          efficiencyLevel === 1
            ? "O uso de recursos aparece equilibrado: contexto suficiente para orientar o modelo, sem excesso recorrente de redundância."
            : efficiencyLevel === 0
              ? "O padrão dominante é de subfornecimento: falta contexto onde a tarefa pede mais densidade informacional."
              : "O padrão dominante é de superfornecimento: há contexto demais ou repetição de histórico sem ganho proporcional.",
        findings: buildFindingsForEfficiency(efficiencyLevel, efficiencyScore, avgPromptTokens, redundancy),
        tip: {
          label: "Critério de ajuste",
          text:
            efficiencyLevel === 1
              ? "Mantenha o contexto enxuto e só amplie quando a tarefa mudar ou quando o output pedir mais precisão."
              : efficiencyLevel === 0
                ? "Invista mais contexto no prompt inicial para evitar compensar a falta de informação com novas tentativas."
                : "Consolide histórico e repita apenas o que muda a resposta, em vez de reenviar blocos inteiros a cada rodada.",
        },
      },
      modelo: {
        text:
          modelLevel === 2
            ? "Há critério claro na escolha de modo e modelo: o histórico sugere decisões proporcionais à tarefa."
            : modelLevel === 1
              ? "A seleção de modelo já mostra alguma percepção de complexidade, mas ainda convive com escolhas por hábito."
              : "A adequação de modelo ainda parece irregular: o histórico mistura escolhas pouco proporcionais ao tipo de tarefa.",
        findings: buildFindingsForModel(modelFitScore, codingRate),
        tip: {
          label: "Mapa de seleção",
          text:
            "Raciocínio e síntese pedem modelos mais robustos; extração, formatação e pedidos simples tendem a funcionar melhor com opções mais leves; coding merece priorizar modelos especializados.",
        },
      },
    },
    logs: history.map((exec, index) => ({
      id: exec?.id || `${participant.analysisKey}_${index}`,
      ts: exec?.ts || "",
      mode: exec?.aiMode === CODING_AI_MODE ? "Coding" : "Chat",
      mission: getMissionLabel(exec, missions),
      prompt: truncate(exec?.input || "", 400),
    })),
  };
}
