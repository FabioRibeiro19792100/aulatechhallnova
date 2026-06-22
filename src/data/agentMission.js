export const AGENT_MISSION_ID = "mission_agent_delegate";

export const AGENT_DEFAULT_PERMISSIONS = ["read", "classify", "summarize", "recommend"];

export const AGENT_TYPE_OPTIONS = [
  {
    id: "inbox",
    title: "Agente de Caixa de Entrada",
    description: "Lê uma caixa de entrada, identifica sinais e organiza prioridades.",
    available: true,
  },
  {
    id: "calendar",
    title: "Agente de Agenda",
    description: "Em breve: acompanhamento de compromissos, conflitos e follow-ups.",
    available: false,
  },
  {
    id: "documents",
    title: "Agente de Documentos",
    description: "Em breve: leitura, síntese e acompanhamento de arquivos e relatórios.",
    available: false,
  },
];

export const AGENT_OBJECTIVE_OPTIONS = [
  { id: "pending_messages", title: "Identificar mensagens pendentes" },
  { id: "recurring_topics", title: "Mapear temas recorrentes" },
  { id: "frequent_contacts", title: "Listar contatos frequentes" },
  { id: "weekly_summary", title: "Gerar resumo da semana" },
  { id: "priority_suggestions", title: "Sugerir prioridades" },
];

export const AGENT_DATA_SOURCE_OPTIONS = [
  {
    id: "demo",
    title: "Base de demonstração",
    description: "Usa uma caixa de entrada simulada, pronta para a aula.",
    available: true,
  },
  {
    id: "gmail",
    title: "Minha conta Gmail",
    description: "Disponível depois da jornada demo, com conexão da conta real.",
    available: false,
  },
];

export const AGENT_CAPABILITY_OPTIONS = [
  { id: "read_messages", title: "Ler mensagens" },
  { id: "classify_contents", title: "Classificar conteúdos" },
  { id: "summarize_information", title: "Resumir informações" },
  { id: "identify_pending", title: "Identificar pendências" },
  { id: "recommend_priorities", title: "Recomendar prioridades" },
];

export const AGENT_PERMISSION_LABELS = {
  read: "Ler",
  classify: "Classificar",
  summarize: "Resumir",
  recommend: "Recomendar",
};

export const AGENT_COMPOSER_STEPS = [
  "type",
  "objective",
  "data-source",
  "capabilities",
  "permissions",
  "review",
];

export const AGENT_ONBOARDING_SLIDES = [
  {
    kicker: "Slide 1",
    title: "Da conversa à delegação",
    message:
      "Ao longo da jornada você utilizou IA para conversar e construir. Agora irá configurar um sistema capaz de atuar sobre ambientes digitais a partir de objetivos definidos.",
    accent: "blue",
    visual: ["Chat → Conversar", "Coding → Construir", "Agente → Delegar"],
  },
  {
    kicker: "Slide 2",
    title: "Todo agente começa por uma missão",
    message: "Um agente existe para cumprir um objetivo específico.",
    accent: "amber",
    bullets: [
      "Organizar mensagens",
      "Identificar pendências",
      "Resumir documentos",
      "Acompanhar atividades",
      "Consolidar informações",
    ],
  },
  {
    kicker: "Slide 3",
    title: "O cérebro do agente",
    message: "O modelo interpreta informações, raciocina e escolhe caminhos.",
    accent: "blue",
    visual: ["Objetivo", "↓", "Modelo", "↓", "Decisão"],
  },
  {
    kicker: "Slide 4",
    title: "Memória gera continuidade",
    message: "A memória preserva contexto, histórico e preferências.",
    accent: "green",
    visual: ["Mensagem 1", "Mensagem 2", "Mensagem 3", "Preferências", "Próxima ação"],
  },
  {
    kicker: "Slide 5",
    title: "Ferramentas ampliam capacidades",
    message: "Ferramentas permitem executar atividades específicas.",
    accent: "amber",
    bullets: [
      "Ler mensagens",
      "Consultar calendários",
      "Analisar documentos",
      "Produzir relatórios",
    ],
  },
  {
    kicker: "Slide 6",
    title: "Conectores criam pontes",
    message: "Conectores permitem acessar ambientes digitais.",
    accent: "blue",
    visual: ["Agente", "↓", "Conector", "↓", "Sistema"],
    bullets: ["Gmail", "Drive", "Calendar", "GitHub", "Slack"],
  },
  {
    kicker: "Slide 7",
    title: "Eventos iniciam movimentos",
    message: "Os agentes podem reagir a acontecimentos.",
    accent: "green",
    visual: ["Novo e-mail", "↓", "Análise", "↓", "Classificação", "↓", "Registro"],
  },
  {
    kicker: "Slide 8",
    title: "Workflows organizam decisões",
    message: "Workflows definem a sequência de atividades.",
    accent: "amber",
    visual: ["Evento", "↓", "Análise", "↓", "Decisão", "↓", "Ação", "↓", "Resultado"],
  },
  {
    kicker: "Slide 9",
    title: "Variáveis preservam estado",
    message: "Os agentes mantêm informações operacionais para acompanhar sua atuação.",
    accent: "blue",
    bullets: [
      "Última execução",
      "Último item analisado",
      "Tema principal",
      "Pendências abertas",
    ],
  },
  {
    kicker: "Slide 10",
    title: "Permissões definem alcance",
    message: "As permissões estabelecem o espaço de atuação do agente.",
    accent: "green",
    bullets: ["Ler", "Classificar", "Resumir", "Recomendar", "Solicitar aprovação"],
  },
  {
    kicker: "Slide 11",
    title: "Ação transforma interpretação em resultado",
    message: "O valor do agente aparece quando ele atua sobre um ambiente.",
    accent: "amber",
    bullets: [
      "Gerar relatório",
      "Organizar prioridades",
      "Produzir resumo",
      "Identificar pendências",
    ],
  },
  {
    kicker: "Slide 12",
    title: "Agentes podem colaborar",
    message: "Agentes especializados podem atuar em conjunto.",
    accent: "blue",
    visual: ["Pesquisador", "↓", "Analista", "↓", "Executor"],
  },
  {
    kicker: "Slide 13",
    title: "Arquitetura completa",
    message: "Agentes surgem da combinação desses componentes.",
    accent: "green",
    visual: [
      "Objetivo",
      "↓",
      "Modelo",
      "↓",
      "Memória",
      "↓",
      "Ferramentas",
      "↓",
      "Conectores",
      "↓",
      "Eventos",
      "↓",
      "Workflow",
      "↓",
      "Variáveis",
      "↓",
      "Permissões",
      "↓",
      "Ação",
    ],
  },
  {
    kicker: "Slide 14",
    title: "Vamos configurar um agente",
    message: "Agora você irá configurar seu primeiro agente e observar sua atuação em um ambiente de demonstração.",
    accent: "blue",
    ctaLabel: "Começar",
  },
];

const AGENT_EXPLAIN_BY_SLIDE = [
  {
    title: "Da conversa à delegação",
    body: "Aqui o foco é entender a mudança de papel. Em Chat você conversa. Em Coding você constrói. Em Agente você define um objetivo e delega atuação sobre um ambiente.",
    items: ["Chat → conversar", "Coding → construir", "Agente → delegar"],
  },
  {
    title: "Missão",
    body: "Todo agente nasce de um objetivo delimitado. Sem missão clara, ele até interpreta sinais, mas não sabe o que priorizar nem que tipo de resultado deve produzir.",
    items: ["Objetivo específico", "Escopo definido", "Resultado esperado"],
  },
  {
    title: "Modelo",
    body: "O modelo funciona como o núcleo de interpretação. Ele lê entradas, raciocina sobre possibilidades e escolhe o próximo movimento com base no objetivo dado.",
    items: ["Entrada", "Raciocínio", "Decisão"],
  },
  {
    title: "Memória",
    body: "Memória é o que dá continuidade. Ela preserva histórico, contexto acumulado e preferências, evitando que cada rodada comece do zero.",
    items: ["Histórico", "Contexto", "Preferências"],
  },
  {
    title: "Ferramentas",
    body: "Ferramentas ampliam o alcance operacional do agente. Elas permitem ler, classificar, resumir e produzir saídas específicas a partir do ambiente observado.",
    items: ["Ler", "Classificar", "Resumir", "Produzir"],
  },
  {
    title: "Conectores",
    body: "Conectores são pontes com ambientes digitais reais. Nesta versão eles aparecem conceitualmente, mas a experiência roda inteira em uma base simulada.",
    items: ["Agente", "Conector", "Sistema"],
  },
  {
    title: "Eventos",
    body: "Eventos são gatilhos que iniciam o movimento. Um agente pode reagir a um novo e-mail, uma mudança de status ou qualquer acontecimento que mereça leitura.",
    items: ["Acontecimento", "Leitura", "Registro"],
  },
  {
    title: "Workflow",
    body: "Workflow organiza a sequência de decisões. Ele evita improviso permanente e define uma ordem clara entre observar, interpretar, decidir e agir.",
    items: ["Evento", "Análise", "Decisão", "Ação", "Resultado"],
  },
  {
    title: "Variáveis",
    body: "Variáveis preservam o estado operacional do agente. Elas registram, por exemplo, a última execução, pendências abertas e o último item analisado.",
    items: ["Última execução", "Último item", "Pendências"],
  },
  {
    title: "Permissões",
    body: "Permissões delimitam até onde o agente pode ir. Elas estabelecem o que ele observa, classifica, resume ou recomenda dentro de um ambiente.",
    items: ["Ler", "Classificar", "Resumir", "Recomendar"],
  },
  {
    title: "Ação",
    body: "É na ação que o agente gera valor. A interpretação só ganha sentido quando se transforma em resultado operacional observável.",
    items: ["Relatório", "Prioridade", "Resumo", "Pendência"],
  },
  {
    title: "Colaboração entre agentes",
    body: "Agentes especializados podem trabalhar em cadeia. Um investiga, outro analisa e outro executa, compondo uma arquitetura distribuída.",
    items: ["Pesquisador", "Analista", "Executor"],
  },
  {
    title: "Arquitetura completa",
    body: "Este slide amarra o sistema inteiro. Agentes surgem da combinação entre objetivo, modelo, memória, ferramentas, conectores, eventos e ações.",
    items: ["Objetivo", "Modelo", "Memória", "Ferramentas", "Eventos", "Ação"],
  },
  {
    title: "Próxima etapa",
    body: "Agora a arquitetura sai do plano conceitual e vira configuração guiada. O próximo passo é montar o primeiro agente e observar sua atuação.",
    items: ["Tipo", "Objetivo", "Fonte", "Capacidades", "Permissões"],
  },
];

const AGENT_COMPOSER_EXPLAIN_BY_STEP = {
  type: {
    title: "O tipo de agente",
    body: "Aqui você escolhe a natureza do sistema que vai montar. Nesta primeira versão, só o agente de caixa de entrada executa de fato. Os outros aparecem como próximos desdobramentos possíveis.",
    items: ["O ambiente de atuação", "A natureza da tarefa", "O recorte funcional da demonstração"],
  },
  objective: {
    title: "O objetivo do agente",
    body: "Agora você define o que o agente deve procurar ou produzir dentro da caixa de entrada. Esse objetivo muda o foco da leitura: pendências, temas, contatos, resumo ou prioridades.",
    items: ["O que observar", "O que priorizar", "Que tipo de saída produzir"],
  },
  "data-source": {
    title: "A fonte de dados",
    body: "Nesta etapa você escolhe onde o agente irá operar. Por padrão, ele atua sobre uma base simulada. A conta real só entra depois, quando a pessoa quiser repetir a experiência com seus próprios dados.",
    items: ["Base de demonstração", "Conta real depois", "Sem dependência externa agora"],
  },
  capabilities: {
    title: "As capacidades autorizadas",
    body: "Capacidades são os tipos de operação que o agente pode executar. Você está definindo se ele só lê, se também classifica, se resume informações e se recomenda prioridades.",
    items: ["Ler", "Classificar", "Resumir", "Identificar", "Recomendar"],
  },
  permissions: {
    title: "O alcance do agente",
    body: "Permissões deixam explícito até onde esse sistema pode ir. Nesta experiência, o agente observa e recomenda. Ele não envia mensagens nem altera sistemas reais.",
    items: ["Pode ler", "Pode classificar", "Pode resumir", "Pode recomendar"],
  },
  review: {
    title: "A configuração final",
    body: "Aqui você revisa a arquitetura escolhida antes da execução. É a combinação entre tipo, objetivo, fonte, capacidades e permissões que define o comportamento do agente na demonstração.",
    items: ["Tipo", "Objetivo", "Fonte", "Capacidades", "Permissões"],
  },
};

export const AGENT_DEMO_INBOX = [
  {
    id: "mail_001",
    from: "Camila Rocha <camila.rocha@orbita.co>",
    subject: "Aprovação pendente do orçamento do workshop",
    snippet: "Precisamos da aprovação até amanhã às 11h para manter a reserva do espaço.",
    body: "Fabio, precisamos da aprovação do orçamento do workshop até amanhã às 11h para manter a reserva do espaço e confirmar a equipe de apoio.",
    receivedAt: "2026-06-09T09:10:00.000Z",
    labels: ["approval", "deadline", "workshop"],
    threadId: "thr_approval_budget",
  },
  {
    id: "mail_002",
    from: "Rafael Lima <rafael.lima@orbita.co>",
    subject: "Re: status do projeto Atlas",
    snippet: "Ainda faltam dois retornos do jurídico para liberarmos a versão final.",
    body: "Atualizando o status do Atlas: já fechamos produto e design, mas ainda faltam dois retornos do jurídico para liberar a versão final. Se não vier hoje, o cronograma escorrega.",
    receivedAt: "2026-06-09T11:25:00.000Z",
    labels: ["project", "pending", "legal"],
    threadId: "thr_project_atlas",
  },
  {
    id: "mail_003",
    from: "Marina Costa <marina.costa@cliente.com>",
    subject: "Dúvida sobre acesso à pasta compartilhada",
    snippet: "O time do cliente segue sem visualizar a pasta de materiais da entrega.",
    body: "Bom dia, o time do cliente ainda não consegue acessar a pasta compartilhada da entrega. Conseguem checar as permissões ainda hoje?",
    receivedAt: "2026-06-09T12:40:00.000Z",
    labels: ["support", "access", "client"],
    threadId: "thr_drive_access",
  },
  {
    id: "mail_004",
    from: "Patricia Nunes <patricia.nunes@orbita.co>",
    subject: "Confirmação da reunião com diretoria na quinta",
    snippet: "Preciso consolidar pauta e nomes confirmados até o fim do dia.",
    body: "Conseguem me enviar até o fim do dia a pauta consolidada e os nomes confirmados para a reunião com a diretoria na quinta?",
    receivedAt: "2026-06-09T14:05:00.000Z",
    labels: ["meeting", "deadline", "leadership"],
    threadId: "thr_board_meeting",
  },
  {
    id: "mail_005",
    from: "Camila Rocha <camila.rocha@orbita.co>",
    subject: "Follow-up: lista de fornecedores prioritários",
    snippet: "Precisamos fechar quem entra no comparativo final antes da reunião de sexta.",
    body: "Reforçando o follow-up da lista de fornecedores prioritários. Precisamos fechar quem entra no comparativo final antes da reunião de sexta.",
    receivedAt: "2026-06-10T08:15:00.000Z",
    labels: ["followup", "deadline", "procurement"],
    threadId: "thr_suppliers_followup",
  },
  {
    id: "mail_006",
    from: "Rafael Lima <rafael.lima@orbita.co>",
    subject: "Materiais para a sprint review",
    snippet: "Anexei o deck preliminar e marquei pontos que ainda precisam de ajuste.",
    body: "Seguem os materiais da sprint review. O deck preliminar está anexado e marquei os pontos que ainda precisam de ajuste antes de compartilhar com o cliente.",
    receivedAt: "2026-06-10T10:50:00.000Z",
    labels: ["project", "review", "client"],
    threadId: "thr_sprint_review",
  },
  {
    id: "mail_007",
    from: "Felipe Moura <felipe.moura@financeiro.co>",
    subject: "Comprovantes pendentes para reembolso",
    snippet: "Sem os anexos até hoje, o financeiro adia o pagamento para a próxima janela.",
    body: "Ainda faltam os comprovantes de alimentação e transporte. Se não chegarem hoje, o financeiro adia o reembolso para a próxima janela.",
    receivedAt: "2026-06-10T13:30:00.000Z",
    labels: ["finance", "deadline", "pending"],
    threadId: "thr_reimbursement",
  },
  {
    id: "mail_008",
    from: "Marina Costa <marina.costa@cliente.com>",
    subject: "Retorno sobre prioridades do lançamento",
    snippet: "O cliente quer uma visão simples do que é crítico nesta semana.",
    body: "Vocês conseguem mandar ainda hoje uma visão simples das prioridades críticas do lançamento? O comitê vai revisar isso amanhã cedo.",
    receivedAt: "2026-06-10T15:05:00.000Z",
    labels: ["client", "priority", "launch"],
    threadId: "thr_launch_priorities",
  },
  {
    id: "mail_009",
    from: "Patricia Nunes <patricia.nunes@orbita.co>",
    subject: "Aprovação do texto final do convite",
    snippet: "Última revisão antes de disparar o convite do evento para parceiros.",
    body: "Segue o texto final do convite. Preciso da aprovação final até as 17h para disparar ainda hoje para os parceiros.",
    receivedAt: "2026-06-10T15:35:00.000Z",
    labels: ["approval", "event", "deadline"],
    threadId: "thr_event_invite",
  },
  {
    id: "mail_010",
    from: "Joana Prado <joana.prado@people.co>",
    subject: "Confirmação de presença no treinamento",
    snippet: "Ainda temos oito pessoas sem resposta no formulário de presença.",
    body: "Atualização rápida: ainda temos oito pessoas sem resposta no formulário de presença. Se você topar, posso consolidar os nomes para dispararmos um lembrete.",
    receivedAt: "2026-06-10T16:20:00.000Z",
    labels: ["training", "pending", "people"],
    threadId: "thr_training_attendance",
  },
];

export function createDefaultAgentDraft() {
  return {
    agentType: "inbox",
    objective: "pending_messages",
    dataSource: "demo",
    capabilities: ["read_messages", "classify_contents", "identify_pending", "recommend_priorities"],
    permissions: [...AGENT_DEFAULT_PERMISSIONS],
  };
}

export function createDefaultAgentMissionState() {
  return {
    agentOnboardingCompleted: false,
    currentStep: "onboarding",
    slideIndex: 0,
    composerStep: 0,
    completedSteps: [],
    agentDraft: createDefaultAgentDraft(),
    agentLastRun: null,
    agentDemoResult: null,
    agentRealConnectionStatus: "idle",
  };
}

export function getAgentObjectiveLabel(objectiveId) {
  return AGENT_OBJECTIVE_OPTIONS.find((item) => item.id === objectiveId)?.title || "Objetivo não definido";
}

export function getAgentTypeLabel(typeId) {
  return AGENT_TYPE_OPTIONS.find((item) => item.id === typeId)?.title || "Tipo não definido";
}

export function getAgentDataSourceLabel(sourceId) {
  return AGENT_DATA_SOURCE_OPTIONS.find((item) => item.id === sourceId)?.title || "Fonte não definida";
}

export function getAgentCapabilityLabel(capabilityId) {
  return AGENT_CAPABILITY_OPTIONS.find((item) => item.id === capabilityId)?.title || capabilityId;
}

export function getAgentPermissionLabel(permissionId) {
  return AGENT_PERMISSION_LABELS[permissionId] || permissionId;
}

export function normalizeAgentMissionState(state) {
  const base = createDefaultAgentMissionState();
  const nextDraft = {
    ...base.agentDraft,
    ...(state?.agentDraft || {}),
  };
  const capabilities = Array.isArray(nextDraft.capabilities) && nextDraft.capabilities.length
    ? nextDraft.capabilities
    : base.agentDraft.capabilities;
  const permissions = Array.isArray(nextDraft.permissions) && nextDraft.permissions.length
    ? nextDraft.permissions
    : base.agentDraft.permissions;
  return {
    ...base,
    ...(state || {}),
    slideIndex: Number.isInteger(state?.slideIndex) ? state.slideIndex : base.slideIndex,
    composerStep: Number.isInteger(state?.composerStep) ? state.composerStep : base.composerStep,
    completedSteps: Array.isArray(state?.completedSteps) ? state.completedSteps : base.completedSteps,
    agentDraft: {
      ...nextDraft,
      capabilities,
      permissions,
    },
  };
}

export function getAgentMissionExplainContent(state) {
  const normalizedState = normalizeAgentMissionState(state);
  if (normalizedState.currentStep === "onboarding") {
    return AGENT_EXPLAIN_BY_SLIDE[normalizedState.slideIndex] || AGENT_EXPLAIN_BY_SLIDE[0];
  }
  if (normalizedState.currentStep === "composer") {
    return AGENT_COMPOSER_EXPLAIN_BY_STEP[AGENT_COMPOSER_STEPS[normalizedState.composerStep] || AGENT_COMPOSER_STEPS[0]];
  }
  if (normalizedState.currentStep === "running") {
    return {
      title: "Execução em demonstração",
      body: "Nesta etapa o agente opera sobre a base simulada. Ele lê mensagens, organiza sinais e produz uma primeira leitura operacional do ambiente.",
      items: ["Leitura", "Classificação", "Prioridades", "Recomendações"],
    };
  }
  return {
    title: "Resultado do agente",
    body: "O encerramento mostra o que o agente conseguiu observar, priorizar e recomendar. É aqui que a delegação vira resultado concreto.",
    items: ["Temas", "Pendências", "Contatos", "Prioridades", "Recomendações"],
  };
}

function countBy(items, getKey) {
  return items.reduce((accumulator, item) => {
    const key = getKey(item);
    if (!key) return accumulator;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function sortEntriesByCount(map) {
  return Object.entries(map).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], "pt-BR");
  });
}

export function buildAgentDemoResult(draft, inbox = AGENT_DEMO_INBOX) {
  const normalizedDraft = {
    ...createDefaultAgentDraft(),
    ...(draft || {}),
  };
  const labelCounts = countBy(
    inbox.flatMap((message) => message.labels || []),
    (label) => label,
  );
  const senderCounts = countBy(inbox, (message) => message.from);

  const recurringThemes = sortEntriesByCount(labelCounts)
    .slice(0, 4)
    .map(([label, count]) => ({
      theme: mapThemeLabel(label),
      evidenceCount: count,
      summary: buildThemeSummary(label, count),
    }));

  const attentionMessages = inbox
    .filter((message) => (message.labels || []).some((label) => ["deadline", "approval", "pending", "priority"].includes(label)))
    .slice(0, 4)
    .map((message) => ({
      id: message.id,
      from: message.from,
      subject: message.subject,
      reason: buildAttentionReason(message),
    }));

  const frequentContacts = sortEntriesByCount(senderCounts)
    .slice(0, 4)
    .map(([contact, count]) => ({
      contact,
      interactions: count,
    }));

  const possiblePriorities = buildPossiblePriorities(normalizedDraft.objective, inbox);
  const recommendations = buildRecommendations(normalizedDraft, recurringThemes, attentionMessages);

  return {
    objective: normalizedDraft.objective,
    generatedAt: new Date().toISOString(),
    inboxSize: inbox.length,
    recurringThemes,
    attentionMessages,
    frequentContacts,
    possiblePriorities,
    recommendations,
  };
}

function mapThemeLabel(label) {
  const labels = {
    approval: "Fluxos de aprovação",
    deadline: "Prazos curtos e urgências",
    project: "Acompanhamento de projetos",
    client: "Demandas de clientes",
    pending: "Pendências operacionais",
    meeting: "Preparação de reuniões",
    priority: "Definição de prioridades",
  };
  return labels[label] || label;
}

function buildThemeSummary(label, count) {
  switch (label) {
    case "approval":
      return `${count} mensagens dependem de algum aceite para destravar a próxima ação.`;
    case "deadline":
      return `${count} mensagens trazem janela curta de resposta e risco de atraso.`;
    case "project":
      return `${count} mensagens tratam de avanço, revisão ou bloqueio de projeto.`;
    case "client":
      return `${count} mensagens exigem retorno claro para stakeholders externos.`;
    case "pending":
      return `${count} mensagens apontam itens ainda abertos ou aguardando retorno.`;
    default:
      return `${count} mensagens acionam esse tema na base simulada.`;
  }
}

function buildAttentionReason(message) {
  if ((message.labels || []).includes("approval")) return "Depende de aprovação para seguir.";
  if ((message.labels || []).includes("deadline")) return "Tem prazo curto ou janela de decisão próxima.";
  if ((message.labels || []).includes("priority")) return "Pede priorização explícita para a semana.";
  return "Revela pendência que pode bloquear outra frente.";
}

function buildPossiblePriorities(objective, inbox) {
  const priorities = [
    "Responder aprovações com prazo no mesmo dia para evitar bloqueios operacionais.",
    "Consolidar pendências de projeto que dependem de retorno jurídico e financeiro.",
    "Organizar um resumo simples para clientes e diretoria com o que é crítico nesta semana.",
    "Disparar follow-ups para itens sem resposta em reuniões, convites e treinamentos.",
  ];

  if (objective === "weekly_summary") {
    return [
      "Agrupar os temas da semana por projeto, cliente e operação.",
      "Separar o que foi resolvido, o que segue pendente e o que precisa de decisão.",
      "Destacar riscos com prazo curto para a próxima manhã.",
    ];
  }

  if (objective === "frequent_contacts") {
    return [
      "Mapear os contatos que mais acionam o time e o tipo de demanda que cada um traz.",
      "Diferenciar contatos de decisão, execução e acompanhamento.",
      "Priorizar respostas para remetentes que concentram prazos e aprovações.",
    ];
  }

  if (objective === "recurring_topics") {
    return [
      "Consolidar temas repetidos para reduzir retrabalho em respostas dispersas.",
      "Criar uma visão única de aprovações, prazos e bloqueios recorrentes.",
      ...priorities.slice(0, 2),
    ];
  }

  return priorities.slice(0, Math.min(4, inbox.length));
}

function buildRecommendations(draft, recurringThemes, attentionMessages) {
  const recommendations = [
    `Configurar o agente para atuar sobre ${getAgentTypeLabel(draft.agentType).toLowerCase()} com foco em ${getAgentObjectiveLabel(draft.objective).toLowerCase()}.`,
    `Usar ${recurringThemes[0]?.theme?.toLowerCase() || "os temas recorrentes"} como eixo principal de classificação inicial.`,
    `Separar ${attentionMessages.length} mensagens críticas em uma fila de atenção antes de gerar resumos.`,
  ];

  if ((draft.capabilities || []).includes("summarize_information")) {
    recommendations.push("Gerar um resumo curto no fim de cada rodada para apoiar decisões rápidas.");
  }
  if ((draft.capabilities || []).includes("recommend_priorities")) {
    recommendations.push("Apresentar prioridades em ordem prática: responder, aprovar, desbloquear e acompanhar.");
  }

  return recommendations.slice(0, 5);
}
