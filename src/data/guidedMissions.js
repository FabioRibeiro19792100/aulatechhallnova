import { CHAT_AI_MODE } from "../utils.js";

export const RAG_MISSION_ID = "mission_rag_practice";
export const AGENT_MISSION_ID = "mission_agent_delegate";

export const GUIDED_DECK_STATUS = {
  NOT_STARTED: "not_started",
  COMPLETED: "completed",
  DISMISSED: "dismissed",
};

export const GUIDED_MISSION_TEMPLATE_VERSION = 2;

export const CORPORATE_DOC_URL =
  "https://docs.google.com/document/d/1XxUZga70wPNhIoVEpEtvebZrd9jcFdyDT82LBDmgik0/edit?usp=sharing";

export const RAG_PACK_DOCUMENTS = [
  {
    name: "governanca-limites-regionais.md",
    label: "Limites regionais",
    text: [
      "Regiões Sul e Sudeste: o endividamento máximo para aquisições não pode ultrapassar 50% do EBITDA da subsidiária local.",
      "Regiões Norte e Centro-Oeste: o endividamento máximo para expansão imobiliária está limitado a 40% do EBITDA local.",
      "Região Nordeste: para aquisições de ativos imobiliários (galpões), o endividamento máximo da subsidiária local está limitado a 35% do seu EBITDA.",
      "Qualquer exceção ao limite do Nordeste exige, obrigatoriamente, a assinatura conjunta de 3 diretores executivos e a validação formal do comitê de riscos.",
      "Os tetos de alavancagem mitigam a exposição ao risco de crédito e garantem a liquidez da operação.",
    ].join("\n"),
  },
  {
    name: "governanca-capex.md",
    label: "CAPEX",
    text: [
      "Todas as aquisições de ativos imobilizados devem estar alinhadas ao Planejamento Estratégico 2026-2030 da companhia.",
      "O orçamento de CAPEX aprovado pelo Conselho de Administração deve ser respeitado por todas as diretorias subsidiárias regionais.",
      "Desvios de CAPEX acima de 5% do orçamento aprovado exigem a convocação de Assembleia Extraordinária do Conselho de Administração.",
      "Desvios de até 5% acima do guidance anual enquadram-se na alçada da Diretoria Colegiada, com validação da Controladoria Central.",
    ].join("\n"),
  },
  {
    name: "governanca-rito-excecoes.md",
    label: "Rito de exceções",
    text: [
      "A flexibilização dos limites de alavancagem é classificada como Exceção Estatutária de Nível 1.",
      "Passo 1: emissão e submissão do Estudo de Viabilidade Econômica (EVE) assinado pelo Controller Regional.",
      "Passo 2: emissão de parecer técnico impeditivo ou liberatório pela Diretoria de Governança e Compliance.",
      "Passo 3: homologação em ata pelo Comitê de Riscos.",
      "Passo 4: coleta de assinaturas dos diretores requeridos conforme a região impactada, antes de qualquer contrato ou Due Diligence.",
    ].join("\n"),
  },
];

const FINE_TUNING_SYSTEM_PROMPT =
  "Você é o Auditor Digital de Compliance da NexaLog S.A. Suas respostas devem ser estritamente formais, baseadas em jargão IFRS/CVM, e sempre destacar os níveis de alçada de aprovação requeridos.";

export const FINE_TUNING_DATASET_DOC = {
  name: "dataset-fine-tuning.jsonl",
  label: "Dataset (.jsonl)",
  kind: "jsonl",
  text: [
    {
      messages: [
        { role: "system", content: FINE_TUNING_SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "Submetida proposta de Capex de R$ 45M para galpão em Recife, impactando alavancagem regional em 38% do EBITDA.",
        },
        {
          role: "assistant",
          content:
            "ALERTA DE COMPLIANCE: Operação REJEITADA em primeira instância. Diretriz de Governança Q2/2026 fixa o teto regional Nordeste em 35% do EBITDA. Enquadramento atual: Exceção Estatutária. Ação Requerida: retornar a proposta para aprovação formal com assinatura conjunta de três (3) Diretores Executivos e parecer favorável do Comitê de Riscos antes da submissão ao Board.",
        },
      ],
    },
    {
      messages: [
        { role: "system", content: FINE_TUNING_SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "Podemos avançar com due diligence de M&A sem aprovação do comitê de riscos se houver NDA assinado?",
        },
        {
          role: "assistant",
          content:
            "PARECER TÉCNICO: Negativo. Conforme o Artigo 14 do Regimento Interno, a assinatura de NDA autoriza apenas o intercâmbio de dados preliminares. O início formal da Due Diligence de M&A exige, obrigatoriamente, a homologação prévia do Comitê de Riscos. Avançar sem este rito configura infração de governança de Nível 2.",
        },
      ],
    },
    {
      messages: [
        { role: "system", content: FINE_TUNING_SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "Qual o rito de aprovação para investimento de capital que exceda o orçamento anual em até 5%?",
        },
        {
          role: "assistant",
          content:
            "DIRETRIZ ORÇAMENTÁRIA: Desvios de Capex de até 5% acima do guidance anual enquadram-se na alçada da Diretoria Colegiada, com justificativa fundamentada e validação da Controladoria Central. Desvios superiores a 5% demandam, mandatoriamente, convocação de Assembleia Extraordinária do Conselho de Administração.",
        },
      ],
    },
  ]
    .map((entry) => JSON.stringify(entry))
    .join("\n"),
};

export const RAG_READABLE_DOCUMENTS = [...RAG_PACK_DOCUMENTS, FINE_TUNING_DATASET_DOC];

export const FINE_TUNING_CASE = {
  title: "Conclusão da experiência: do RAG ao Fine-tuning",
  intro:
    "Você viu o RAG do início ao fim. Quando ele não basta, vem o fine-tuning: em vez de só consultar documentos, ele re-treina o próprio modelo com muitos exemplos de pergunta-e-resposta no jeito certo (um conjunto de treino — cada exemplo traz a instrução, a pergunta e a resposta ideal). Diferente do RAG, que injeta fatos no contexto, o fine-tuning ensina habilidade, estilo e jargão — e muda o modelo de forma permanente, por isso exige curadoria humana cuidadosa.",
  whenToUse:
    "Em uma frase: use RAG quando falta o fato; use fine-tuning quando falta o jeito de responder. O RAG entregou o fato certo (35% do EBITDA, com a fonte), mas não dá o tom de um auditor sênior nem o domínio do jargão técnico do setor (as normas contábeis e da CVM) — é nesse gargalo que o fine-tuning se justifica.",
  caseBlocks: [
    {
      label: "Contexto",
      text:
        "A auditoria interna da NexaLog gastava mais de 1.200 horas/mês revisando contratos, com exposição anual de R$ 2,4 milhões em multas por cláusulas perdidas.",
    },
    {
      label: "Insuficiência do RAG",
      text:
        "O RAG achava as regras certas, mas os pareceres saíam longos, genéricos e sem foco em quem precisa assinar/aprovar cada decisão.",
    },
    {
      label: "Solução via fine-tuning",
      text:
        "Re-treino de um modelo próprio com 350 pareceres antigos de compliance, limpos de dados sensíveis e organizados como exemplos de treino.",
    },
  ],
  metrics: [
    { value: "3 min", label: "tempo de resposta (vs 48h)" },
    { value: "92%", label: "redução em multas de compliance" },
    { value: "4,0x", label: "aumento na capacidade analítica" },
  ],
};

export const AGENT_EMAIL_TRAINING_ITEMS = [
  { subject: "Banco Azul: Sua fatura vence em 3 dias", tag: "financeiro" },
  { subject: "Newsletter TechNews: As 10 tendências da semana", tag: "newsletter" },
  { subject: "Mariana (gestora): Preciso do relatório de junho até sexta", tag: "trabalho, importante" },
  { subject: "RH: Recesso de fim de ano, datas confirmadas", tag: "informativo" },
  { subject: "Loja Prisma: OFERTA: 50% só hoje", tag: "promoção" },
  { subject: "Cliente Sol Ltda: Erro no pedido 4412, podem verificar?", tag: "cliente, importante" },
  { subject: "Agenda: Convite: reunião de equipe, quinta 10h", tag: "agenda" },
  { subject: "Cartão Vivaz: Sua fatura fechou", tag: "financeiro" },
];

export const AGENT_EMAIL_TRIGGER_ITEM = {
  subject: "Mariana (gestora): Conseguem antecipar o relatório para quinta?",
  tag: "trabalho, urgente",
};

export const RAG_MISSION_DEFINITION = {
  id: RAG_MISSION_ID,
  num: 3,
  aiMode: CHAT_AI_MODE,
  name: "RAG",
  category: "guided-rag",
  desc: "Missão guiada para ver o pipeline de RAG funcionando por dentro, com base própria ou o caso de governança da NexaLog S.A.",
  situacao:
    "Use esta missão para ver o RAG funcionando por dentro, com documentos seus ou com a base de governança da NexaLog S.A. Você acompanha trechos, busca, contexto, resposta citada e teste de limite.",
  instrucao:
    "Anexe até 5 arquivos de texto ou use a base de exemplo (governança corporativa). A IA conduz uma etapa por vez, com opções numeradas, até você testar pergunta, recuperação, contraste e limite.",
  placeholder: "A missão conduz a conversa. Se precisar escrever, a própria IA vai pedir uma pergunta sobre a base.",
  acoes: [],
};

export const AGENT_MISSION_DEFINITION = {
  id: AGENT_MISSION_ID,
  num: 4,
  aiMode: CHAT_AI_MODE,
  name: "Agente",
  category: "guided-agent",
  desc: "Missão guiada para montar a ficha de um agente, executar um ciclo completo e revisar o relatório final.",
  situacao:
    "Use esta missão para construir e ver funcionar o seu primeiro agente de IA. Você vai montar conector, evento, memória, variáveis, ferramentas e permissões, e depois assistir à execução.",
  instrucao:
    "A IA conduz. Ela faz uma pergunta por vez e oferece opções numeradas. Ao final, o agente configurado roda sobre uma caixa de dados de treino.",
  placeholder: "A missão conduz a conversa. Quando a IA pedir, responda com uma opção ou escreva o texto solicitado.",
  acoes: [],
};

export const GUIDED_MISSION_DEFINITIONS = {
  [RAG_MISSION_ID]: RAG_MISSION_DEFINITION,
  [AGENT_MISSION_ID]: AGENT_MISSION_DEFINITION,
};

export const AGENT_TOOL_OPTIONS = {
  email: [
    "Ler item",
    "Classificar",
    "Resumir",
    "Criar tarefa",
    "Responder em seu nome",
  ],
  news: [
    "Ler notícia",
    "Classificar por tema",
    "Resumir sinais",
    "Destacar prioridade",
    "Preparar alerta",
  ],
  tasks: [
    "Ler tarefa",
    "Classificar prioridade",
    "Resumir contexto",
    "Criar acompanhamento",
    "Preparar cobrança",
  ],
};

const AGENT_PROFILES = {
  email: {
    mission: "organizar uma caixa de e-mails",
    connector: "Gmail de treino",
    inboxItems: [
      "Banco Azul · Sua fatura vence em 3 dias",
      "TechNews · As 10 tendências da semana",
      "Mariana (gestora) · Preciso do relatório de junho até sexta",
      "RH · Recesso de fim de ano, datas confirmadas",
      "Loja Prisma · OFERTA: 50% só hoje",
      "Cliente Sol Ltda · Erro no pedido 4412",
      "Agenda · Convite: reunião de equipe, quinta 10h",
      "Cartão Vivaz · Sua fatura fechou",
    ],
    triggerItem: 'Mariana (gestora) · "Conseguem antecipar o relatório para quinta?"',
    triggerDecision: "classificada como urgente",
    triggerDelivery: 'Resumo pronto: "Mariana pede antecipação do relatório de junho para quinta."',
    approvedAction: 'Tarefa criada: "Antecipar relatório de junho · prazo quinta".',
    finalDelivery: "1 e-mail processado, classificado como urgente, resumido, e 1 tarefa criada com a sua aprovação.",
    defaultTools: ["Ler e-mail", "Classificar", "Resumir", "Criar tarefa"],
    variableA: "emails_processados",
    variableB: "pendencias_abertas",
  },
  news: {
    mission: "monitorar notícias de um tema",
    connector: "Feed de notícias de treino",
    inboxItems: [
      "Agência Brasil · Novo marco regulatório do setor foi aprovado",
      "Valor Econômico · Mercado reage ao anúncio do Banco Central",
      "TechNews · Startup lança modelo aberto de IA",
      "Clima Hoje · Chuvas intensas elevam alerta em três estados",
      "Reuters · Empresa anuncia aquisição bilionária",
      "Exame · Tendência de produtividade em times híbridos",
      "Nexo · Debate sobre política industrial ganha força",
      "Canal Energia · Leilão de transmissão tem nova data",
    ],
    triggerItem: 'Reuters · "Empresa anuncia aquisição bilionária no setor"',
    triggerDecision: "destacada como notícia prioritária",
    triggerDelivery: 'Resumo pronto: "Aquisição bilionária tende a impactar o setor monitorado."',
    approvedAction: 'Alerta preparado: "Mudança relevante no setor monitorado".',
    finalDelivery: "1 notícia lida, resumida e transformada em alerta com a sua aprovação.",
    defaultTools: ["Ler notícia", "Classificar por tema", "Resumir sinais", "Preparar alerta"],
    variableA: "noticias_lidas",
    variableB: "alertas_abertos",
  },
  tasks: {
    mission: "acompanhar tarefas de um projeto",
    connector: "Quadro de tarefas de treino",
    inboxItems: [
      "Atlas · Corrigir bug do login antes da revisão",
      "Atlas · Atualizar documentação da API pública",
      "Atlas · Validar cronograma com design",
      "Atlas · Revisar métricas da sprint",
      "Atlas · Responder bloqueio do time mobile",
      "Atlas · Preparar pauta da retrospectiva",
      "Atlas · Fechar escopo da entrega de junho",
      "Atlas · Confirmar dependência com dados",
    ],
    triggerItem: 'Atlas · "Responder bloqueio do time mobile até hoje"',
    triggerDecision: "classificada como tarefa crítica",
    triggerDelivery: 'Resumo pronto: "Há um bloqueio do time mobile que exige resposta ainda hoje."',
    approvedAction: 'Acompanhamento criado: "Responder bloqueio do time mobile · hoje".',
    finalDelivery: "1 tarefa priorizada, resumida e convertida em acompanhamento com a sua aprovação.",
    defaultTools: ["Ler tarefa", "Classificar prioridade", "Resumir contexto", "Criar acompanhamento"],
    variableA: "tarefas_lidas",
    variableB: "acompanhamentos_abertos",
  },
};

export function isGuidedMissionId(missionId = "") {
  return missionId === RAG_MISSION_ID || missionId === AGENT_MISSION_ID;
}

export function isGuidedMission(mission) {
  return isGuidedMissionId(mission?.id || "");
}

export function isRagMission(mission) {
  return mission?.id === RAG_MISSION_ID;
}

export function isAgentMission(mission) {
  return mission?.id === AGENT_MISSION_ID;
}

export function getGuidedMissionModeLabel(mission) {
  if (isRagMission(mission)) return "Modo: RAG";
  if (isAgentMission(mission)) return "Modo: Agente";
  return "";
}

export function createDefaultGuidedMissionState(missionId) {
  if (missionId === RAG_MISSION_ID) {
    return {
      missionId,
      deckStatus: GUIDED_DECK_STATUS.NOT_STARTED,
      deckVisible: true,
      deckMode: "overlay",
      started: false,
      scriptIndex: 0,
      step: "E0",
      answers: {},
      responses: {},
      report: "",
      completed: false,
      generatedAt: null,
      persistedAt: null,
      loopCount: 0,
      latestSourceLine: "",
    };
  }

  return {
    missionId,
    deckStatus: GUIDED_DECK_STATUS.NOT_STARTED,
    deckVisible: true,
    deckMode: "overlay",
    started: false,
    scriptIndex: 0,
    step: "E0",
    answers: {},
    responses: {},
    report: "",
    completed: false,
    generatedAt: null,
    persistedAt: null,
    modalOpen: false,
    lastExecution: null,
  };
}

export function createDefaultGuidedMissionParticipantState() {
  return {
    version: GUIDED_MISSION_TEMPLATE_VERSION,
    missions: {
      [RAG_MISSION_ID]: createDefaultGuidedMissionState(RAG_MISSION_ID),
      [AGENT_MISSION_ID]: createDefaultGuidedMissionState(AGENT_MISSION_ID),
    },
  };
}

export function normalizeGuidedMissionParticipantState(rawValue) {
  const base = createDefaultGuidedMissionParticipantState();
  if (!rawValue || typeof rawValue !== "object") return base;
  const rawMissions = rawValue.missions && typeof rawValue.missions === "object" ? rawValue.missions : {};
  return {
    version: GUIDED_MISSION_TEMPLATE_VERSION,
    missions: {
      [RAG_MISSION_ID]: {
        ...base.missions[RAG_MISSION_ID],
        ...(rawMissions[RAG_MISSION_ID] || {}),
      },
      [AGENT_MISSION_ID]: {
        ...base.missions[AGENT_MISSION_ID],
        ...(rawMissions[AGENT_MISSION_ID] || {}),
      },
    },
  };
}

export function getGuidedMissionEntryState(rootState, missionId) {
  const normalized = normalizeGuidedMissionParticipantState(rootState);
  return normalized.missions[missionId] || createDefaultGuidedMissionState(missionId);
}

export function setGuidedMissionEntryState(rootState, missionId, nextMissionState) {
  const normalized = normalizeGuidedMissionParticipantState(rootState);
  return {
    ...normalized,
    missions: {
      ...normalized.missions,
      [missionId]: {
        ...createDefaultGuidedMissionState(missionId),
        ...(nextMissionState || {}),
      },
    },
  };
}

export function getGuidedMissionExplainContent(mission, state) {
  const missionId = mission?.id || "";
  const step = state?.step || "E0";

  if (missionId === RAG_MISSION_ID) {
    const byStep = {
      E0: {
        title: "Abertura da missão",
        body: "Aqui o sistema define a origem da base. O RAG só consegue responder sobre o que entra como base de conhecimento.",
        items: ["Base própria ou pack de exemplo", "A pergunta ainda não entrou", "O pipeline começa pela base"],
      },
      E1: {
        title: "Base de conhecimento",
        body: "Nesta etapa a missão fixa o universo de consulta. Tudo o que vier depois precisa se apoiar nesses arquivos.",
        items: ["Lista de arquivos ativa", "Escopo fechado da base", "Sem base, não há consulta"],
      },
      E2: {
        title: "Trechos",
        body: "Os documentos são quebrados em partes menores para facilitar a recuperação posterior. O chunk é a unidade de busca.",
        items: ["Quebra por parágrafos", "Numeração dos trechos", "Amostras literais da base"],
      },
      E3: {
        title: "Embedding",
        body: "Aqui a missão explica a representação semântica dos trechos. Nesta primeira versão, a ideia é didática e não vetorial de verdade.",
        items: ["Representação de significado", "Scores ilustrativos", "Vocabulário da aula preservado"],
      },
      E4: {
        title: "Pergunta à base",
        body: "A pessoa agora formula uma pergunta que os documentos conseguem responder. O RAG depende da aderência entre pergunta e base.",
        items: ["Pergunta respondível", "Escopo preso aos arquivos", "Preparação para a busca"],
      },
      E5: {
        title: "Recuperação",
        body: "O motor seleciona os trechos mais relevantes para a pergunta. O top 3 é mostrado com citações literais e score ilustrativo.",
        items: ["Top k de trechos", "Busca semântica simplificada", "Citação literal obrigatória"],
      },
      E6: {
        title: "Contexto montado",
        body: "O contexto final é a pergunta acompanhada dos trechos escolhidos. É isso que o modelo realmente recebe antes de responder.",
        items: ["Prompt montado", "Trechos no contexto", "Pergunta e base na mesma mensagem"],
      },
      E7: {
        title: "Resposta citada",
        body: "A resposta é gerada a partir dos trechos recuperados e precisa apontar sua fonte. O foco aqui é verificabilidade.",
        items: ["Resposta presa à base", "Linha de fonte", "Conferência posterior"],
      },
      E8: {
        title: "Contraste sem RAG",
        body: "A missão mostra a mesma pergunta sem documentos, para explicitar o risco de generalização ou alucinação.",
        items: ["Comparação lado a lado", "Sem base, sem citação", "Risco de invenção explícito"],
      },
      E9: {
        title: "Teste de limite",
        body: "Aqui o sistema recusa perguntas fora da base. O valor didático está justamente em não inventar o que não foi recuperado.",
        items: ["Recusa honesta", "Diagnóstico do limite", "Proteção contra alucinação"],
      },
      E10: {
        title: "Encerramento",
        body: "A missão resume o que foi visto e gera um artefato final. O relatório registra base, pergunta, contraste e limite.",
        items: ["Relatório final", "Nova pergunta ou encerramento", "Sentinela de conclusão"],
      },
    };
    return byStep[step] || byStep.E0;
  }

  const byStep = {
    E0: {
      title: "Abertura da missão",
      body: "A missão apresenta o que vai ser montado: um agente composto por missão, conector, evento, modelo, memória, variáveis, ferramentas e permissões.",
      items: ["Início guiado", "Vocabulário da aula", "Execução no final do fluxo"],
    },
    E1: {
      title: "Missão do agente",
      body: "Aqui nasce o objetivo que vai orientar todo o comportamento posterior do agente.",
      items: ["Verbo e objeto", "Direção da atuação", "Base para ferramentas e permissões"],
    },
    E2: {
      title: "Conector",
      body: "O conector liga o agente a um ambiente externo. Nesta missão, essa ligação acontece sobre uma base de treino, não sobre sistemas reais.",
      items: ["Ambiente de treino", "Preview dos dados", "Sem conta real"],
    },
    E3: {
      title: "Evento",
      body: "O evento define quando o agente começa a trabalhar. Ele funciona como o gatilho do workflow.",
      items: ["Item novo", "Horário fixo", "Disparo manual"],
    },
    E4: {
      title: "Modelo",
      body: "O modelo é o cérebro interpretativo do agente. Nesta missão, ele já vem definido para preservar a coerência do exercício.",
      items: ["Modelo travado", "Confirmação explícita", "Coerência entre etapas"],
    },
    E5: {
      title: "Memória",
      body: "A memória guarda preferências e regras do participante. Ela afeta a decisão quando o agente raciocina sobre um caso.",
      items: ["Preferências declarativas", "Contexto persistente", "Uso explícito na execução"],
    },
    E6: {
      title: "Variáveis",
      body: "Variáveis são valores operacionais que o agente atualiza durante a execução. Elas ajudam a acompanhar estado e progresso.",
      items: ["Nome e valor", "Estado mutável", "Atualização no fim do ciclo"],
    },
    E7: {
      title: "Ferramentas",
      body: "Ferramentas são as ações que o agente consegue executar. Sem elas, a decisão não se transforma em resultado.",
      items: ["Ler", "Classificar", "Resumir", "Agir sobre um fluxo"],
    },
    E8: {
      title: "Permissões",
      body: "Permissões definem o que o agente faz sozinho e o que exige aprovação humana. A missão força ao menos um ponto de aprovação.",
      items: ["Sozinho", "Aprovação", "Limite operacional explícito"],
    },
    E9: {
      title: "Execução",
      body: "Agora o agente percebe, raciocina e age sobre um item de treino. É a primeira rodada completa do ciclo de delegação.",
      items: ["Evento disparado", "Decisão com memória", "Aprovação e entrega final"],
    },
    E10: {
      title: "Encerramento",
      body: "A missão gera o relatório final da execução e deixa pronta a leitura do que foi configurado.",
      items: ["Ficha final", "Relatório da missão", "Sentinela de conclusão"],
    },
  };
  return byStep[step] || byStep.E0;
}

export function guidedMissionStateHasHistory(state) {
  if (!state || typeof state !== "object") return false;
  if (state.completed) return true;
  if (state.deckStatus && state.deckStatus !== GUIDED_DECK_STATUS.NOT_STARTED) return true;
  if (Number(state.scriptIndex || 0) > 0) return true;
  if (state.started) return true;
  if (state.step && state.step !== "E0") return true;
  if (state.report) return true;
  if (state.responses && Object.keys(state.responses).length > 0) return true;
  if (state.answers && Object.keys(state.answers).length > 0) return true;
  return false;
}

function agentFicha(values = {}) {
  return `FICHA DO AGENTE
missão: ${values.missao || "..."}
conector: ${values.conector || "..."}
evento: ${values.evento || "..."}
modelo: ${values.modelo || "..."}
memória: ${values.memoria || "..."}
variáveis: ${values.variaveis || "..."}
ferramentas: ${values.ferramentas || "..."}
permissões: ${values.permissoes || "..."}
progresso: etapa ${values.n} de 10`;
}

function ragPainel(values = {}) {
  return `PIPELINE RAG
base: ${values.base || "..."}
trechos: ${values.t || "..."}
pergunta: ${values.q || "..."}
top 3: ${values.top || "..."}
resposta: ${values.r || "..."}
fonte: ${values.f || "..."}
progresso: etapa ${values.n} de 10`;
}

function escapeHtml(value = "") {
  return `${value}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeText(value = "") {
  return `${value}`.replace(/\s+/g, " ").trim();
}

function extractChoiceNumber(value = "") {
  const match = normalizeText(value).match(/^(\d+)/);
  return match ? Number(match[1]) : null;
}

function getAgentProfileFromState(missionState) {
  const missionChoice = extractChoiceNumber(missionState?.responses?.[1] || "");
  if (missionChoice === 2) return AGENT_PROFILES.news;
  if (missionChoice === 3) return AGENT_PROFILES.tasks;
  if (missionChoice === 4) {
    const raw = normalizeText(missionState?.responses?.[1] || "");
    const customMission = raw.replace(/^\d+\.\s*/, "") || "definir uma missão personalizada";
    return {
      ...AGENT_PROFILES.email,
      mission: customMission,
    };
  }
  return AGENT_PROFILES.email;
}

function getAgentEventLabel(missionState) {
  const eventChoice = extractChoiceNumber(missionState?.responses?.[3] || "");
  if (eventChoice === 2) return "todo dia em um horário fixo";
  if (eventChoice === 3) return "quando você pedir";
  return "quando chegar um item novo";
}

function parseSelectedTools(missionState, profile) {
  const response = normalizeText(missionState?.responses?.[7] || "");
  const numbers = [...response.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const tools = profile.defaultTools;
  if (!numbers.length) return tools;
  const selected = numbers
    .map((number) => tools[number - 1])
    .filter(Boolean);
  return selected.length ? Array.from(new Set(selected)) : tools;
}

function summarizePermissions(missionState, selectedTools) {
  const response = normalizeText(missionState?.responses?.[8] || "");
  if (!response) {
    return `${selectedTools[selectedTools.length - 1] || "ação final"} pede aprovação, o resto sozinho`;
  }
  return response;
}

export function renderGuidedMissionStepContent(missionId, stepIndex = 0, missionState = {}, attachments = []) {
  const script = getGuidedMissionScript(missionId);
  const boundedIndex = Math.max(0, Math.min(stepIndex, script.length - 1));
  const baseStep = script[boundedIndex] || script[0] || null;
  if (!baseStep) return null;

  if (missionId === AGENT_MISSION_ID) {
    const profile = getAgentProfileFromState(missionState);
    const connector = `${profile.connector} (conectado)`;
    const eventLabel = getAgentEventLabel(missionState);
    const memory = normalizeText(missionState?.responses?.[5] || "...");
    const selectedTools = parseSelectedTools(missionState, profile);
    const permissionSummary = summarizePermissions(missionState, selectedTools);
    const variableLine = `${profile.variableA} = 0 · ${profile.variableB} = 0`;
    const triggerLabel = profile.triggerItem;
    const triggerActor = triggerLabel.split(" · ")[0] || "o sistema";
    const finalAction = selectedTools[selectedTools.length - 1] || "ação final";

    switch (stepIndex) {
      case 2:
        return {
          ...baseStep,
          ai: `<p>Registrado.</p><pre>${agentFicha({ missao: profile.mission, n: 1 })}</pre><p>Etapa 2. O conector liga o agente a um sistema externo. Aqui será usado um ${profile.connector}, sem conta real. Posso conectar?</p>`,
        };
      case 3:
        return {
          ...baseStep,
          ai: `<p><span class="sent">✓ ${profile.connector} conectado.</span> Estes são os itens na base de treino:</p><pre>${profile.inboxItems.map((item, index) => `${index + 1}. ${item}`).join("\n")}</pre><p>Etapa 3. O evento é o que faz o agente começar a trabalhar, também chamado de gatilho. Qual será o gatilho?</p><div class="ops"><div>1. Quando chegar um item novo</div><div>2. Todo dia em um horário fixo</div><div>3. Quando você pedir</div></div>`,
        };
      case 5:
        return {
          ...baseStep,
          ai: `<pre>${agentFicha({
            missao: profile.mission,
            conector: connector,
            evento: eventLabel,
            modelo: "GPT-4.1",
            n: 4,
          })}</pre><p>Etapa 5. A memória guarda o que o agente sabe sobre você. Escreva uma ou duas frases de preferência para orientar as decisões.</p>`,
        };
      case 7:
        return {
          ...baseStep,
          ai: `<p>Etapa 7. Ferramentas são as ações que o agente consegue executar. Escolha pelo menos três, respondendo com os números.</p><div class="ops">${profile.defaultTools.map((tool, index) => `<div>${index + 1}. ${escapeHtml(tool)}</div>`).join("")}</div>`,
        };
      case 8:
        return {
          ...baseStep,
          ai: `<p>Etapa 8. Permissões definem o que o agente faz sozinho e o que precisa da sua autorização. Para cada ferramenta, responda: sozinho ou aprovação?</p><pre>${selectedTools.map((tool) => `${tool.toLowerCase().padEnd(22, " ")} → ?`).join("\n")}</pre><p>Pelo menos uma precisa ficar em aprovação.</p>`,
        };
      case 9:
        return {
          ...baseStep,
          ai: `<p>Configuração completa.</p><pre>${agentFicha({
            missao: profile.mission,
            conector: connector,
            evento: eventLabel,
            modelo: "GPT-4.1",
            memoria: memory || "...",
            variaveis: variableLine,
            ferramentas: selectedTools.join(", "),
            permissoes: permissionSummary,
            n: 8,
          })}</pre><p>Etapa 9. O agente vai rodar agora. Disparando o evento.</p><div class="passo">PASSO 1 · PERCEBER</div><p>Entrou um item novo: <b>${escapeHtml(triggerLabel)}</b></p><div class="passo">PASSO 2 · RACIOCINAR</div><p>O histórico e a memória orientam a leitura. O item foi ${profile.triggerDecision} e a decisão foi usar as ferramentas configuradas para produzir uma saída útil.</p><div class="passo">PASSO 3 · AGIR</div><p>✓ Lido. ✓ Interpretado. ✓ ${escapeHtml(profile.triggerDelivery)}</p><p>A próxima ferramenta é <b>${escapeHtml(finalAction)}</b>, que está marcada como aprovação.</p><div class="ops"><div>1. Aprovar</div><div>2. Recusar</div></div>`,
        };
      case 10:
        return {
          ...baseStep,
          ai: `<p><span class="sent">✓ Aprovado.</span> ${escapeHtml(profile.approvedAction)}</p><p>Entrega do agente: ${escapeHtml(profile.finalDelivery)}</p><pre>variáveis atualizadas
${profile.variableA} = 1
${profile.variableB} = 1</pre><p>Etapa 10. Você construiu um agente com as dez peças do vocabulário da aula e viu o ciclo rodar de ponta a ponta.</p><div class="ops"><div>1. Disparar mais um evento</div><div>2. Encerrar a missão</div></div>`,
        };
      case 11:
        return {
          ...baseStep,
          ai: `<p>Missão cumprida. Este relatório é seu, copie e guarde.</p><pre>RELATORIO DA MISSAO · MEU PRIMEIRO AGENTE
missão: ${profile.mission}
conector: ${profile.connector} · evento: ${eventLabel} · modelo: GPT-4.1
memória: "${memory || "..."}"
ferramentas: ${selectedTools.join(", ")}
permissões: ${permissionSummary}

evento disparado: ${triggerActor}
decisão do modelo: ${profile.triggerDecision}
aprovação: aprovada · ${finalAction}
entrega: ${profile.finalDelivery}
variáveis finais: ${profile.variableA} = 1 · ${profile.variableB} = 1</pre><pre>STATUS: MISSAO CONCLUIDA</pre>`,
        };
      default:
        return baseStep;
    }
  }

  return baseStep;
}

export function getGuidedMissionScript(missionId) {
  if (missionId === AGENT_MISSION_ID) {
    return [
      {
        ai: `<p>Bem-vindo à missão. Aqui você vai montar um agente peça por peça e ver a ficha dele se preencher. No final, o agente roda de verdade sobre dados de treino.</p><div class="ops"><div>1. Começar</div><div>2. Relembrar em uma frase o que é um agente</div></div>`,
        tech: {
          s: "etapa 0 de 10 · abertura",
          b: "<b>Mecanismo:</b> turno inicial disparado pela mensagem oculta INICIAR_MISSAO. O condutor abre com contrato da missão e duas opções. <b>Limite:</b> nenhuma etapa avança sem resposta do participante.",
        },
        user: "1",
      },
      {
        ai: `<p>Etapa 1. A missão é o objetivo que dá direção a tudo. Qual será a missão do seu agente?</p><div class="ops"><div>1. Organizar uma caixa de e-mails</div><div>2. Monitorar notícias de um tema</div><div>3. Acompanhar tarefas de um projeto</div><div>4. Escrever a sua própria missão</div></div>`,
        tech: {
          s: "etapa 1 de 10 · missão",
          b: "<b>Mecanismo:</b> a escolha vira a primeira linha da ficha e parametriza os dados de treino. <b>Critério:</b> frase com verbo e objeto. Opções 2 a 4 geram ambiente de treino coerente na hora.",
        },
        user: "1",
      },
      {
        ai: `<p>Registrado.</p><pre>${agentFicha({ missao: "organizar uma caixa de e-mails", n: 1 })}</pre><p>Etapa 2. O conector liga o agente a um sistema externo. Aqui será usado um Gmail de treino, sem conta real. Posso conectar?</p>`,
        tech: {
          s: "etapa 2 de 10 · conector",
          b: "<b>Mecanismo:</b> conexão simulada com caixa de treino embutida no prompt condutor, 8 mensagens semeadas. <b>Limite:</b> regra inviolável 8, o condutor nunca finge conectar sistemas reais.",
        },
        user: "pode conectar",
      },
      {
        ai: `<p><span class="sent">✓ Gmail de treino conectado.</span> Estes são os assuntos na caixa:</p><pre>1. Banco Azul · Sua fatura vence em 3 dias
2. TechNews · As 10 tendências da semana
3. Mariana (gestora) · Preciso do relatório de junho até sexta
4. RH · Recesso de fim de ano, datas confirmadas
5. Loja Prisma · OFERTA: 50% só hoje
6. Cliente Sol Ltda · Erro no pedido 4412
7. Agenda · Convite: reunião de equipe, quinta 10h
8. Cartão Vivaz · Sua fatura fechou</pre><p>Etapa 3. O evento é o que faz o agente começar a trabalhar, também chamado de gatilho. Qual será o gatilho?</p><div class="ops"><div>1. Quando chegar um e-mail novo</div><div>2. Todo dia em um horário fixo</div><div>3. Quando você pedir</div></div>`,
        tech: {
          s: "etapa 3 de 10 · evento",
          b: "<b>Mecanismo:</b> o gatilho escolhido define como a etapa 9 dispara a execução. <b>Critério:</b> uma das três opções. A prévia da caixa dá concretude antes da escolha.",
        },
        user: "1",
      },
      {
        ai: `<p>Etapa 4. O modelo é a inteligência artificial que lê e decide. Nesta missão ele já vem selecionado: GPT-4.1. Confirmar?</p>`,
        tech: {
          s: "etapa 4 de 10 · modelo",
          b: "<b>Mecanismo:</b> o seletor de modelo do composer fica travado durante a missão para manter coerência com o que o condutor anuncia. <b>Critério:</b> confirmação simples.",
        },
        user: "confirmar",
      },
      {
        ai: `<pre>${agentFicha({
          missao: "organizar uma caixa de e-mails",
          conector: "Gmail de treino (conectado)",
          evento: "quando chegar um e-mail novo",
          modelo: "GPT-4.1",
          n: 4,
        })}</pre><p>Etapa 5. A memória guarda o que o agente sabe sobre você. Escreva uma ou duas frases de preferência. Por exemplo: newsletters nunca são urgentes.</p>`,
        tech: {
          s: "etapa 5 de 10 · memória",
          b: "<b>Mecanismo:</b> as frases são gravadas literalmente na ficha e injetadas no raciocínio da execução. <b>Critério:</b> frases declarativas. O condutor valida e repete a pergunta se vier vago.",
        },
        user: "Newsletters nunca são urgentes. Tudo que vem da Mariana é prioridade máxima.",
      },
      {
        ai: "<p>Memória registrada.</p><p>Etapa 6. Variáveis são valores que o agente atualiza enquanto trabalha. Proponho duas: <b>emails_processados = 0</b> e <b>pendencias_abertas = 0</b>.</p><div class=\"ops\"><div>1. Aceitar as duas</div><div>2. Ajustar</div><div>3. Criar outra</div></div>",
        tech: {
          s: "etapa 6 de 10 · variáveis",
          b: "<b>Mecanismo:</b> nomes em snake_case com valor inicial, atualizados ao fim da execução para mostrar estado vivo. <b>Critério:</b> nome e valor inicial válidos.",
        },
        user: "1",
      },
      {
        ai: "<p>Etapa 7. Ferramentas são as ações que o agente consegue executar. Escolha pelo menos três, respondendo com os números.</p><div class=\"ops\"><div>1. Ler e-mail</div><div>2. Classificar</div><div>3. Resumir</div><div>4. Criar tarefa</div><div>5. Responder em seu nome</div></div>",
        tech: {
          s: "etapa 7 de 10 · ferramentas",
          b: "<b>Mecanismo:</b> a lista escolhida define o que a execução pode fazer. <b>Critério:</b> mínimo de três. Ferramenta fora da lista fica indisponível para o agente.",
        },
        user: "1, 2, 3 e 4",
      },
      {
        ai: "<p>Etapa 8. Permissões definem o que o agente faz sozinho e o que precisa da sua autorização. Para cada ferramenta, responda: sozinho ou aprovação?</p><pre>ler e-mail      → ?\nclassificar     → ?\nresumir         → ?\ncriar tarefa    → ?</pre><p>Pelo menos uma precisa ficar em aprovação.</p>",
        tech: {
          s: "etapa 8 de 10 · permissões",
          b: "<b>Mecanismo:</b> a regra de pelo menos uma ferramenta em aprovação garante que toda execução tenha o momento de aprovar ou recusar. <b>Limite:</b> se tudo vier como sozinho, o condutor pede a correção.",
        },
        user: "ler sozinho, classificar sozinho, resumir sozinho, criar tarefa com aprovação",
      },
      {
        ai: `<p>Configuração completa.</p><pre>${agentFicha({
          missao: "organizar uma caixa de e-mails",
          conector: "Gmail de treino (conectado)",
          evento: "quando chegar um e-mail novo",
          modelo: "GPT-4.1",
          memoria: "newsletters nunca são urgentes; tudo da Mariana é prioridade máxima",
          variaveis: "emails_processados = 0 · pendencias_abertas = 0",
          ferramentas: "ler, classificar, resumir, criar tarefa",
          permissoes: "criar tarefa pede aprovação, o resto sozinho",
          n: 8,
        })}</pre><p>Etapa 9. O agente vai rodar agora. Disparando o evento.</p><div class="passo">PASSO 1 · PERCEBER</div><p>Chegou um e-mail novo: <b>Mariana (gestora) · "Conseguem antecipar o relatório para quinta?"</b></p><div class="passo">PASSO 2 · RACIOCINAR</div><p>O remetente é a Mariana. A sua memória diz que tudo dela é prioridade máxima, então a mensagem foi classificada como urgente. A decisão: resumir e criar uma tarefa com prazo quinta-feira.</p><div class="passo">PASSO 3 · AGIR</div><p>✓ Lido. ✓ Classificado como trabalho urgente. ✓ Resumo pronto: "Mariana pede antecipação do relatório de junho para quinta."</p><p>A próxima ferramenta é <b>criar tarefa</b>, que está marcada como aprovação.</p><div class="ops"><div>1. Aprovar</div><div>2. Recusar</div></div>`,
        tech: {
          s: "etapa 9 de 10 · execução",
          b: "<b>Mecanismo:</b> o ciclo roda visível nos três passos do deck. O raciocínio cita a memória do participante de forma explícita, provando o efeito dela. A execução para na ferramenta com permissão de aprovação e aguarda decisão.",
        },
        user: "1",
      },
      {
        ai: `<p><span class="sent">✓ Aprovado.</span> Tarefa criada: "Antecipar relatório de junho · prazo quinta".</p><p>Entrega do agente: 1 e-mail processado, classificado como urgente, resumido, e 1 tarefa criada com a sua aprovação.</p><pre>variáveis atualizadas
emails_processados = 1
pendencias_abertas = 1</pre><p>Etapa 10. Você construiu um agente com as dez peças do vocabulário da aula e viu o ciclo rodar de ponta a ponta.</p><div class="ops"><div>1. Disparar mais um evento</div><div>2. Encerrar a missão</div></div>`,
        tech: {
          s: "etapa 10 de 10 · encerramento",
          b: "<b>Mecanismo:</b> variáveis atualizadas no fim do ciclo mostram estado persistente. <b>Critério de conclusão:</b> ficha completa, 1 ciclo executado, 1 decisão de aprovação registrada.",
        },
        user: "2",
      },
      {
        ai: `<p>Missão cumprida. Este relatório é seu, copie e guarde.</p><pre>RELATORIO DA MISSAO · MEU PRIMEIRO AGENTE
missão: organizar uma caixa de e-mails
conector: Gmail de treino · evento: e-mail novo · modelo: GPT-4.1
memória: "newsletters nunca são urgentes";
         "tudo da Mariana é prioridade máxima"
ferramentas: ler, classificar, resumir, criar tarefa
permissões: criar tarefa pede aprovação

evento disparado: Mariana pede antecipação do relatório
decisão do modelo: urgente (memória citada: "tudo da
Mariana é prioridade máxima")
aprovação: aprovada · criar tarefa
entrega: 1 e-mail processado, 1 tarefa criada
variáveis finais: emails_processados = 1 · pendencias_abertas = 1</pre><pre>STATUS: MISSAO CONCLUIDA</pre>`,
        tech: {
          s: "concluída",
          b: "<b>Mecanismo:</b> a linha sentinela STATUS: MISSAO CONCLUIDA é detectada por regex pelo sistema e libera o encerramento com estado de sucesso. Telemetria final: missao_concluida.",
        },
        user: null,
        done: true,
      },
    ];
  }

  return [
    {
      ai: "<p>Bem-vindo à missão. A base de conhecimento da NexaLog S.A. já está indexada (3 documentos de governança, que você pode abrir e ler na faixa <b>Base de conhecimento</b>). Vamos ver o RAG por dentro, do documento confidencial à resposta citada, e no final testar os limites do sistema.</p>",
      tech: {
        s: "etapa 0 de 10 · abertura",
        b:
          "<div class=\"explain-row\"><span class=\"explain-tag is-ai\">O que a IA faz</span><p>Na <b>indexação</b> (a preparação, feita uma vez): lê cada documento (Word, PDF…), <b>extrai o texto</b>, corta em trechos e guarda tudo num <b>banco vetorial</b>. O modelo não \"decora\" os arquivos — eles ficam nesse banco à parte, consultado só na hora da pergunta.</p></div>" +
          "<div class=\"explain-row\"><span class=\"explain-tag is-you\">Boa prática</span><p>Abra e leia os documentos na faixa <b>Base de conhecimento</b> para saber o que dá para perguntar.</p></div>",
      },
      user: "vamos começar",
    },
    {
      ai: "<p>A base de conhecimento é o universo que a IA pode consultar — e ele está fechado nestes três arquivos (Manual de Governança · CONFIDENCIAL):</p><pre>governanca-limites-regionais.md\ngovernanca-capex.md\ngovernanca-rito-excecoes.md</pre><p>Tudo o que vier a seguir vai se apoiar só neles. Vamos fatiar a base?</p>",
      tech: {
        s: "etapa 1 de 10 · base",
        b:
          "<div class=\"explain-row\"><span class=\"explain-tag is-ai\">O que a IA faz</span><p>Define o <b>escopo</b>: só os documentos indexados podem ser consultados. Esses textos não fazem parte do que o modelo aprendeu no treino — ficam numa base externa, à parte da IA.</p></div>" +
          "<div class=\"explain-row\"><span class=\"explain-tag is-you\">Boa prática</span><p>Garanta que a base tem os documentos certos e atualizados — o RAG só é tão bom quanto a base.</p></div>",
      },
      user: "pode seguir",
    },
    {
      ai: "<p>Para buscar melhor, a base é quebrada em pedaços pequenos — os <b>trechos</b> (em inglês, chunks). Os 3 documentos viraram <b>14 trechos</b>. Dois exemplos:</p><pre>governanca-limites-regionais.md · trecho 3\n\"Região Nordeste: para aquisições de ativos\nimobiliários (galpões), o endividamento máximo\nda subsidiária local está limitado a 35% do seu\nEBITDA.\"\n\ngovernanca-capex.md · trecho 3\n\"Desvios de CAPEX acima de 5% do orçamento\naprovado exigem a convocação de Assembleia\nExtraordinária do Conselho de Administração.\"</pre>",
      tech: {
        s: "etapa 2 de 10 · trechos",
        b:
          "<div class=\"explain-row\"><span class=\"explain-tag is-ai\">O que a IA faz</span><p>Faz o <b>chunking</b>: divide o texto em pedaços (chunks), em geral de algumas centenas de palavras, com leve <b>sobreposição</b> entre eles, e guarda a origem de cada um (arquivo e número) para citar depois.</p></div>" +
          "<div class=\"explain-row\"><span class=\"explain-tag is-you\">Boa prática</span><p>Você não fatia nada — é automático. Só lembre: documentos bem escritos e organizados geram trechos melhores.</p></div>",
      },
      user: "entendi, próxima",
    },
    {
      ai: "<p>Cada trecho vira uma lista de números que representa o seu <b>significado</b> — o embedding. Pense num <b>mapa de significados</b>: cada trecho ganha uma coordenada, e trechos parecidos ficam pertinho. Todas essas coordenadas ficam guardadas no <b>banco vetorial</b>.</p><pre>trecho 3 (Nordeste) → [ 0.182, -0.041, 0.733, -0.298, ... ]\n(valores ilustrativos · centenas de números por trecho)</pre><p>É esse banco que vai permitir buscar por significado. Seguir para a busca?</p>",
      tech: {
        s: "etapa 3 de 10 · embedding",
        b:
          "<div class=\"explain-row\"><span class=\"explain-tag is-ai\">O que a IA faz</span><p>Um <b>modelo de embeddings</b> transforma cada chunk num <b>vetor</b> — como uma coordenada num mapa de significados (trechos parecidos ficam perto). Esses vetores ficam no <b>banco vetorial</b>, a memória externa do RAG.</p></div>" +
          "<div class=\"explain-row\"><span class=\"explain-tag is-you\">Boa prática</span><p>Nada a fazer aqui — é interno. Só confie que a busca compara <b>significado</b> (posição no mapa), não palavra exata.</p></div>",
      },
      user: "seguir",
    },
    {
      ai: "<p>Agora é com você. Escreva uma pergunta que esses documentos conseguem responder — algo sobre limites de endividamento, CAPEX ou o rito de exceções.</p>",
      tech: {
        s: "etapa 4 de 10 · pergunta",
        b:
          "<div class=\"explain-row\"><span class=\"explain-tag is-ai\">O que a IA faz</span><p>Coloca a sua pergunta no mesmo <b>mapa de significados</b>: gera o <b>embedding da pergunta</b> (o mesmo tipo de vetor dos trechos) para comparar a posição dela com a dos trechos.</p></div>" +
          "<div class=\"explain-row\"><span class=\"explain-tag is-you\">Boa prática</span><p>Faça UMA pergunta clara e específica sobre a base (cite o tema ou a região). Pergunta vaga gera recuperação fraca.</p></div>",
      },
      user: "Qual é o teto de endividamento para a NexaLog comprar galpões no Nordeste?",
    },
    {
      ai: "<p>A busca trouxe os trechos mais parecidos com a sua pergunta — os 3 melhores (top 3):</p><pre>0.91 · governanca-limites-regionais.md · trecho 3\n\"Região Nordeste: para aquisições de ativos\nimobiliários (galpões), o endividamento máximo\nda subsidiária local está limitado a 35% do seu\nEBITDA.\"\n\n0.84 · governanca-limites-regionais.md · trecho 4\n\"Qualquer exceção ao limite do Nordeste exige\nassinatura conjunta de 3 diretores executivos e\nvalidação formal do comitê de riscos.\"\n\n0.71 · governanca-limites-regionais.md · trecho 2\n\"Regiões Norte e Centro-Oeste: o endividamento\nmáximo para expansão imobiliária está limitado\na 40% do EBITDA local.\"\n\n(scores ilustrativos)</pre><p>Repare: você disse <b>comprar galpões</b> e o documento diz <b>aquisições de ativos imobiliários</b>. A busca encontrou mesmo assim, porque compara significados, não palavras iguais.</p>",
      tech: {
        s: "etapa 5 de 10 · recuperação",
        b:
          "<div class=\"explain-row\"><span class=\"explain-tag is-ai\">O que a IA faz</span><p>Mede quão <b>perto</b> a pergunta está de cada trecho no mapa e traz os mais próximos — os <b>top-k</b> (aqui, k = 3, ou seja, os 3 melhores; quem monta o sistema escolhe esse número). O score mostra o quanto cada um se parece.</p></div>" +
          "<div class=\"explain-row\"><span class=\"explain-tag is-you\">Boa prática</span><p>Olhe os trechos recuperados: se não tiverem a ver com a pergunta, reformule de forma mais específica.</p></div>",
      },
      user: "continuar",
    },
    {
      ai: "<p>Aqui está o segredo do RAG: a IA junta os trechos recuperados com a sua pergunta numa única mensagem — o <b>contexto</b>. É exatamente isto que o modelo recebe:</p><pre>Responda usando apenas os trechos abaixo.\n\nTrecho 1 (governanca-limites-regionais.md): \"Região\nNordeste: para aquisições de ativos imobiliários\n(galpões), o endividamento máximo da subsidiária\nlocal está limitado a 35% do seu EBITDA.\"\nTrecho 2 (governanca-limites-regionais.md): \"Qualquer\nexceção ao limite do Nordeste exige assinatura\nconjunta de 3 diretores executivos e validação\nformal do comitê de riscos.\"\n\nPergunta: Qual é o teto de endividamento para a\nNexaLog comprar galpões no Nordeste?</pre><p>No fundo, RAG é isto: os documentos entram dentro da mensagem. Gerar a resposta?</p>",
      tech: {
        s: "etapa 6 de 10 · contexto",
        b:
          "<div class=\"explain-row\"><span class=\"explain-tag is-ai\">O que a IA faz</span><p>Cola os trechos recuperados junto da pergunta numa só mensagem — dentro da <b>janela de contexto</b> (o espaço de texto que cabe de uma vez numa mensagem). Como esse espaço é <b>limitado</b>, o RAG manda só os melhores trechos (o top-k), não o documento inteiro. É o \"Augmented\" do RAG: o conhecimento entra como texto, <b>sem alterar o modelo</b>.</p></div>" +
          "<div class=\"explain-row\"><span class=\"explain-tag is-you\">Boa prática</span><p>Entenda que \"RAG é texto na mensagem\": quanto melhor a pergunta e os trechos, melhor o contexto montado.</p></div>",
      },
      user: "gerar",
    },
    {
      ai: "<p>E a resposta, construída a partir dos trechos:</p><p><b>O teto de endividamento para aquisições de galpões na Região Nordeste é de 35% do EBITDA da subsidiária local. Qualquer exceção exige a assinatura conjunta de 3 diretores executivos e a validação do comitê de riscos.</b></p><pre>fonte: governanca-limites-regionais.md · trechos 3 e 4</pre><p>Veja: a resposta vem com <b>fonte</b>, então dá para conferir de onde saiu.</p>",
      tech: {
        s: "etapa 7 de 10 · geração e citação",
        b:
          "<div class=\"explain-row\"><span class=\"explain-tag is-ai\">O que a IA faz</span><p>O LLM gera a resposta <b>condicionada (grounded)</b> apenas nos trechos recuperados e cita a fonte. Se os trechos não sustentam a resposta, declara em vez de completar com conhecimento geral.</p></div>" +
          "<div class=\"explain-row\"><span class=\"explain-tag is-you\">Boa prática</span><p>Sempre confira a citação antes de confiar — abra a fonte e leia o trecho original.</p></div>",
      },
      user: "e sem RAG, como ficaria?",
    },
    {
      ai: "<p>Agora a mesma pergunta, mas <b>sem</b> os documentos:</p><p>\"Em geral, operações de aquisição admitem alavancagem de 2 a 3 vezes o EBITDA, conforme a prática de mercado…\"</p><pre>sem RAG · sem fonte</pre><p>Soa razoável, né? Só que cita uma regra de mercado que <b>não está em nenhum documento da NexaLog</b> e não tem fonte. É a amnésia corporativa: o modelo público não conhece a governança interna — e esse é o risco da alucinação. Vamos testar os limites?</p>",
      tech: {
        s: "etapa 8 de 10 · contraste",
        b:
          "<div class=\"explain-row\"><span class=\"explain-tag is-ai\">O que a IA faz</span><p>Sem recuperação, a IA responde \"de cabeça\", só com o que ficou da fase de treino (a chamada <b>memória paramétrica</b>). Daí respostas plausíveis, porém sem fonte e sujeitas a <b>alucinação</b>.</p></div>" +
          "<div class=\"explain-row\"><span class=\"explain-tag is-you\">Boa prática</span><p>Desconfie de resposta sem fonte. Para temas internos da empresa, exija RAG (base + citação).</p></div>",
      },
      user: "sim. Qual é o salário do CEO da NexaLog?",
    },
    {
      ai: "<p>Procurei nos 14 trechos e nenhum trata de remuneração de executivos. <b>Essa informação está fora da base, então eu fico sem resposta.</b></p><p>O assunto simplesmente não existe nos três documentos de governança. Para o RAG responder isso, a base precisaria de um documento de remuneração. Essa recusa não é uma falha — é a proteção do RAG contra a alucinação.</p>",
      tech: {
        s: "etapa 9 de 10 · teste de limite",
        b:
          "<div class=\"explain-row\"><span class=\"explain-tag is-ai\">O que a IA faz</span><p>Quando a busca não traz trechos relevantes, um RAG bem configurado se <b>abstém</b> em vez de inventar. A \"falha\" é a base não cobrir o assunto, não o modelo.</p></div>" +
          "<div class=\"explain-row\"><span class=\"explain-tag is-you\">Boa prática</span><p>Se a IA recusar, o problema é a base (falta o documento), não a sua pergunta — adicione a fonte certa.</p></div>",
      },
      user: "fechou, pode encerrar",
    },
    {
      ai:
        "<p>Você percorreu o caminho completo do RAG. Antes de fechar, vamos amarrar o que você aprendeu:</p>" +
        "<p><b>O pipeline, em uma linha:</b> base de conhecimento → trechos (chunks) → embeddings no banco vetorial → busca por significado → melhores trechos na janela de contexto → resposta gerada e citada.</p>" +
        "<p><b>Os limites que ficaram claros:</b> a IA só sabe o que está na base; sem RAG ela inventa sem fonte (alucinação); o RAG entrega o <b>fato</b>, mas <b>não muda o modelo</b> (não ensina tom nem estilo).</p>" +
        "<p><b>As boas práticas para levar:</b> pergunte de forma específica; <b>sempre confira a citação</b>; lembre que a resposta só é tão boa quanto a base.</p>" +
        "<p><b>Pense no seu dia a dia:</b> que base (um manual, um contrato, uma apostila) você colocaria num RAG? Que pergunta ela responderia — e qual ela <b>não</b> conseguiria?</p>" +
        "<pre>RELATORIO DA MISSAO · RAG NA PRATICA\nempresa: NexaLog S.A.\nbase: 3 arquivos (governanca-limites-regionais.md, governanca-capex.md, governanca-rito-excecoes.md)\ntrechos: 14\npergunta testada: Qual é o teto de endividamento para a NexaLog comprar galpões no Nordeste?\nresposta citada: 35% do EBITDA da subsidiária local\n  excecao: assinatura conjunta de 3 diretores executivos + validacao do comite de riscos\n  fonte: governanca-limites-regionais.md · trechos 3 e 4\ncontraste sem RAG: regra de mercado generica (2 a 3x EBITDA) sem fonte\nteste de limite: \"salario do CEO\" · diagnostico: assunto ausente da base, exigiria documento de remuneracao</pre>" +
        "<p>E quando o RAG não basta? Quando o gargalo deixa de ser o <b>fato</b> e passa a ser o <b>tom</b> — a forma de responder, o jargão certo, o estilo de um especialista. O próximo salto é o <b>fine-tuning</b>. Veja a conclusão abaixo ↓</p>" +
        "<pre>STATUS: MISSAO CONCLUIDA</pre>",
      tech: {
        s: "concluída",
        b:
          "<div class=\"explain-row\"><span class=\"explain-tag is-ai\">O que a IA faz</span><p>O RAG injeta <b>conhecimento factual</b> no contexto, em tempo de consulta, <b>sem mudar o modelo</b>. O que ele não altera é o comportamento, o estilo e o jargão do LLM — isso é território do <b>fine-tuning</b>.</p></div>" +
          "<div class=\"explain-row\"><span class=\"explain-tag is-you\">Boa prática</span><p>Saiba escolher: RAG quando o que falta é o <b>fato</b>; fine-tuning quando o que falta é o <b>jeito de responder</b>.</p></div>",
      },
      user: null,
      done: true,
    },
  ];
}

export function getGuidedMissionStepContent(missionId, stepIndex = 0, missionState = {}, attachments = []) {
  const script = getGuidedMissionScript(missionId);
  const boundedIndex = Math.max(0, Math.min(stepIndex, script.length - 1));
  return renderGuidedMissionStepContent(missionId, boundedIndex, missionState, attachments) || script[boundedIndex] || script[0] || null;
}

export function getGuidedMissionExplainPane(missionId, missionState) {
  const stepContent = getGuidedMissionStepContent(
    missionId,
    Number(missionState?.scriptIndex || 0),
    missionState,
  );
  return {
    kicker: "Componente em foco",
    title: stepContent?.tech?.s || "explicação técnica",
    html: stepContent?.tech?.b || "",
  };
}
