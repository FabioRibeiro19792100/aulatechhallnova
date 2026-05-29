import { CHAT_AI_MODE, CODING_AI_MODE, TRAINING_THREAD_ID } from "../utils.js";

export const TRAINING_MISSION = {
  id: TRAINING_THREAD_ID,
  num: 0,
  aiMode: CHAT_AI_MODE,
  name: "Modo treino",
  category: "livre",
  desc: "Laboratório livre para explorar prompts sem catálogo de missões.",
  situacao: "Use este espaço para experimentar perguntas, reformulações e conversas livres com a IA.",
  instrucao: "Escreva o prompt livremente. Você pode iterar, testar variações e pedir ajuda ao facilitador quando quiser.",
  placeholder: "Escreva aqui o que você quer testar...",
  acoes: [],
};

export const AI_MODE_LABELS = {
  [CHAT_AI_MODE]: "Chat",
  [CODING_AI_MODE]: "Coding",
};

const RESPOND_IN_PT = "Responda sempre em portugues do Brasil, qualquer que seja o idioma do pedido, dos anexos ou do historico.";
function getBehaviorPromptAddendum(aiMode, {
  planningMode = "off",
  investigateMode = false,
  webSearchEnabled = false,
  guidedMode = false,
} = {}) {
  if (aiMode === CHAT_AI_MODE) {
    const parts = [];
    if (planningMode === "on") {
      if (investigateMode) {
        parts.push(
          "Se faltar uma informacao critica para um plano confiavel, encerre com no maximo uma pergunta objetiva de clarificacao.",
        );
      }
      if (webSearchEnabled) {
        parts.push(
          "Modo pesquisar na web ligado: use web search obrigatoriamente para embasar o plano com fatos atuais, dados externos ou entidades nichadas antes de responder.",
          "Sempre inclua referencias externas verificaveis quando a busca for usada.",
        );
      }
      return parts.join(" ");
    }

    parts.push(
      "Quando o pedido estiver claro, responda diretamente. Nao recue cedo demais por ambiguidade leve.",
      "Se houver uma melhor hipotese plausivel, responda a partir dela e sinalize com clareza o que e inferencia.",
    );
    if (investigateMode) {
      parts.push(
        "Modo investigar ligado: antes de responder, voce pode fazer no maximo uma pergunta curta e relevante quando faltar contexto essencial para entender a intencao, a entidade citada ou o criterio de resposta.",
        "Evite entrevistas longas: se a melhor resposta ja for viavel, entregue a resposta em vez de perguntar.",
      );
    }
    if (webSearchEnabled) {
      parts.push(
        "Modo pesquisar na web ligado: use web search obrigatoriamente antes de responder.",
        "Baseie a resposta em fontes reais e atuais e inclua referencias externas verificaveis.",
      );
    }
    return parts.join(" ");
  }

  if (aiMode === CODING_AI_MODE && guidedMode) {
    if (planningMode === "on") {
      return [
        "Modo guiado ligado: priorize o plano tecnico.",
        "Se faltar uma decisao critica para que o plano seja seguro, encerre com no maximo uma pergunta operacional de bloqueio.",
        "Nao implemente nem escreva o codigo final.",
      ].join(" ");
    }
    return [
      "Modo guiado ligado: explique enquanto faz, usando um raciocinio operacional resumido e objetivo durante a construcao da resposta.",
      "Quando faltar uma decisao tecnica critica, voce pode interromper com no maximo uma pergunta curta e operacional antes de responder.",
      "Priorize perguntas sobre escopo, restricoes, ambiente, criterio de sucesso ou risco.",
      "Se o pedido estiver suficientemente claro, siga direto, mas deixe explicito o que esta fazendo, por que escolheu esse caminho e quais ajustes estao sendo considerados.",
      "Nao exponha chain-of-thought bruto; entregue apenas um resumo operacional do processo.",
    ].join(" ");
  }

  return "";
}

export const SYSTEM_PROMPTS = {
  [CHAT_AI_MODE]: {
    off: [
      "Voce e o assistente de chat do Tech Hall AI Lab, especializado em analise geral: sintetizar, comparar, interpretar, organizar e revisar informacoes com clareza estrutural.",
      "Responda de forma util, clara e honesta. Nao invente fatos ausentes e diferencie o que esta explicito do que e inferencia. Se o pedido estiver vago, ajude a melhorar o prompt antes de responder.",
      RESPOND_IN_PT,
    ].join(" "),
    on: [
      "Voce e o assistente de chat do Tech Hall AI Lab em modo planejamento. Sua unica tarefa e planejar como a solicitacao seria resolvida, sem executa-la.",
      "Nao produza o resultado ou o entregavel final: entregue apenas um plano claro com objetivo, premissas, etapas ordenadas, decisoes e trade-offs, dependencias e riscos.",
      "Pare apos apresentar o plano, mesmo que o pedido peca o resultado pronto.",
      RESPOND_IN_PT,
    ].join(" "),
  },
  [CODING_AI_MODE]: {
    off: [
      "Voce e o assistente de programacao do Tech Hall AI Lab. Priorize codigo funcional, debugging, arquitetura, refatoracao, explicacoes tecnicas e exemplos praticos orientados a implementacao, mostrando implementacoes concretas, riscos, trade-offs e cuidados de manutencao.",
      "Quando a resposta principal for codigo utilizavel, entregue arquivos reais em blocos nomeados com a linguagem (por exemplo, ```js app.js```); para interfaces ou prototipos web, prefira um unico HTML autocontido em um bloco ```html index.html```. Depois dos blocos, adicione apenas notas curtas de uso ou proximos passos.",
      RESPOND_IN_PT,
    ].join(" "),
    on: [
      "Voce e o assistente de programacao do Tech Hall AI Lab em modo planejamento. Sua unica tarefa e planejar a abordagem tecnica, sem implementa-la.",
      "Nao escreva o codigo final nem produza o entregavel: entregue apenas um plano claro com objetivo, premissas, arquitetura proposta, etapas ordenadas, decisoes e trade-offs tecnicos, dependencias e riscos.",
      "Pare apos apresentar o plano, mesmo que o pedido peca o codigo pronto.",
      RESPOND_IN_PT,
    ].join(" "),
  },
};

export function getSystemPrompt(aiMode, planningMode = "off", behaviorOptions = {}) {
  const byMode = SYSTEM_PROMPTS[aiMode] || SYSTEM_PROMPTS[CHAT_AI_MODE];
  const basePrompt = planningMode === "on" ? byMode.on : byMode.off;
  const behaviorPrompt = getBehaviorPromptAddendum(aiMode, { planningMode, ...behaviorOptions });
  return [basePrompt, behaviorPrompt].filter(Boolean).join(" ");
}

export const FIXED_MISSION_TEMPLATE = "fixed-v2";

export const FIXED_MISSIONS_CATALOG = [
  {
    id: "mission_general_chat",
    num: 1,
    aiMode: CHAT_AI_MODE,
    name: "Análise geral",
    category: "chat",
    desc: "Missão ampla para análise, síntese, interpretação, revisão crítica e estruturação de informação.",
    situacao:
      "Use esta missão quando o time precisar pensar, resumir, comparar, organizar ideias, revisar uma resposta ou transformar material disperso em algo útil para decisão.",
    instrucao:
      "Escreva o pedido livremente e contextualize o objetivo, o destinatário e o formato esperado da resposta. A IA vai atuar como parceira de análise geral.",
    placeholder:
      "Cole seu contexto, pergunta, notas, briefing, resposta de IA ou material bruto. Ex.: \"Preciso transformar estas anotações em um resumo executivo com próximos passos.\"",
    acoes: [],
  },
  {
    id: "mission_programming_coding",
    num: 2,
    aiMode: CODING_AI_MODE,
    name: "Programação",
    category: "coding",
    desc: "Missão dedicada a código, debugging, arquitetura, refatoração e exemplos práticos.",
    situacao:
      "Use esta missão quando o time precisar programar, depurar, revisar arquitetura, refatorar código ou transformar uma ideia técnica em implementação concreta.",
    instrucao:
      "Descreva o problema técnico, cole código quando existir e diga o resultado esperado. A IA vai responder priorizando implementação, debugging e decisões de engenharia.",
    placeholder:
      "Cole o código, o erro, a arquitetura ou o requisito. Ex.: \"Este componente React renderiza duas vezes e quebra o estado. Quero entender a causa e corrigir com uma solução limpa.\"",
    acoes: [],
  },
];

export const MOCKS = {
  mission_general_chat: (input) =>
    `ANÁLISE GERAL\n\nLeitura principal:\n- Objetivo central identificado a partir do pedido.\n- Pontos prioritários organizados para resposta útil.\n- Lacunas ou ambiguidades marcadas quando faltou contexto.\n\nPróximo passo sugerido:\n- Refinar o pedido com destinatário, formato e critério de prioridade.\n\nTrecho de contexto recebido:\n"${input.slice(0, 140)}${input.length > 140 ? "..." : ""}"`,
  mission_programming_coding: (input) =>
    `RESPOSTA DE PROGRAMAÇÃO\n\nDiagnóstico inicial:\n- Identifiquei o problema técnico principal no pedido.\n- Priorizaria uma solução implementável, com explicação de trade-offs.\n- Se o contexto estiver incompleto, começo pelo caminho mais seguro e explicito as suposições.\n\nAbordagem prática:\n1. Isolar a causa provável.\n2. Propor correção concreta.\n3. Explicar impacto em arquitetura, manutenção e debugging.\n\nTrecho do pedido técnico:\n"${input.slice(0, 140)}${input.length > 140 ? "..." : ""}"`,
};

export const EXPLICACOES = {
  mission_general_chat:
    "Estratégia: leitura ampla e organizada do pedido, com foco em síntese, clareza estrutural e utilidade para decisão. A IA prioriza o que parece central, explicita ambiguidades e evita inventar fatos que não apareceram no material.",
  mission_programming_coding:
    "Estratégia: abordagem orientada a implementação. A IA lê o pedido como problema técnico, prioriza debugging, arquitetura, refatoração e exemplos concretos, e tenta responder com passos reproduzíveis e decisões de engenharia justificadas.",
};

export const SIMULATION_STEPS = [
  { key: "analisando", label: "analisando pedido" },
  { key: "estrategia", label: "selecionando estratégia" },
  { key: "gerando", label: "gerando resposta" },
  { key: "finalizando", label: "finalizando" },
];

export const MISSION_CONCEPTS = {
  mission_general_chat: [
    { name: "Síntese", explanation: "Condensa contexto extenso em uma resposta mais clara e utilizável." },
    { name: "Estruturação", explanation: "Organiza o pedido em blocos lógicos para melhorar entendimento e decisão." },
    { name: "Ambiguidade controlada", explanation: "Explicita lacunas e evita preencher informação ausente como se fosse fato." },
  ],
  mission_programming_coding: [
    { name: "Debugging", explanation: "Isola a causa provável de um erro antes de propor correção." },
    { name: "Refatoração", explanation: "Melhora clareza, manutenção e robustez sem alterar o objetivo funcional." },
    { name: "Trade-off técnico", explanation: "Explica custo, risco e benefício das escolhas de implementação." },
  ],
};
