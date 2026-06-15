import { CHAT_AI_MODE } from "../utils.js";

export const RAG_MISSION_ID = "mission_rag_practice";
export const AGENT_MISSION_ID = "mission_agent_delegate";

export const GUIDED_DECK_STATUS = {
  NOT_STARTED: "not_started",
  COMPLETED: "completed",
  DISMISSED: "dismissed",
};

export const GUIDED_MISSION_TEMPLATE_VERSION = 2;

export const RAG_PACK_DOCUMENTS = [
  {
    name: "politica-de-ferias.md",
    text: [
      "As férias devem ser solicitadas com 30 dias de antecedência pelo sistema de RH.",
      "As férias podem ser emendadas com feriados nacionais, desde que a solicitação respeite o prazo do item 1.",
      "O período mínimo de gozo é de 5 dias corridos e o máximo é de 30 dias.",
      "A venda de até 10 dias de férias é permitida uma vez por ano.",
      "Gestores devem aprovar ou recusar solicitações em até 5 dias úteis.",
      "Férias coletivas, quando decretadas, são comunicadas com 60 dias de antecedência.",
    ].join("\n"),
  },
  {
    name: "manual-de-reembolso.md",
    text: [
      "Despesas reembolsáveis: transporte a trabalho, hospedagem, alimentação em viagem e material aprovado previamente.",
      "O limite diário de alimentação em viagem é de R$ 120 por pessoa.",
      "Notas fiscais devem ser enviadas em até 15 dias após a despesa.",
      "Reembolsos aprovados são pagos na folha do mês seguinte.",
      "Despesas com bebida alcoólica não são reembolsáveis.",
      "Viagens internacionais exigem aprovação prévia da diretoria.",
    ].join("\n"),
  },
  {
    name: "codigo-de-conduta.md",
    text: [
      "Informações de clientes são confidenciais e seu compartilhamento externo é proibido.",
      "Presentes de fornecedores acima de R$ 200 devem ser recusados ou reportados ao comitê de ética.",
      "O uso de equipamentos da empresa para trabalhos pessoais remunerados é proibido.",
      "Conflitos de interesse devem ser declarados ao gestor imediato.",
      "Denúncias podem ser feitas de forma anônima pelo canal de ética.",
      "Assédio de qualquer natureza resulta em apuração imediata pelo comitê.",
    ].join("\n"),
  },
];

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
  desc: "Missão guiada para ver o pipeline de RAG funcionando por dentro, com base própria ou pack de exemplo.",
  situacao:
    "Use esta missão para ver o RAG funcionando por dentro, com documentos seus ou com o pack de exemplo. Você acompanha trechos, busca, contexto, resposta citada e teste de limite.",
  instrucao:
    "Anexe até 5 arquivos de texto ou use o pack de exemplo. A IA conduz uma etapa por vez, com opções numeradas, até você testar pergunta, recuperação, contraste e limite.",
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
      ai: "<p>Bem-vindo à missão. Você vai ver o RAG por dentro, do documento à resposta citada, e no final vai testar os limites do sistema.</p><div class=\"ops\"><div>1. Anexar meus arquivos (até 5, de texto)</div><div>2. Usar o pack de exemplo (3 documentos de uma empresa fictícia)</div></div>",
      tech: {
        s: "etapa 0 de 10 · abertura",
        b: "<b>Mecanismo:</b> turno inicial automático. A pessoa escolhe entre arquivos próprios, extraídos pelo sistema e injetados no contexto, ou o pack embutido no prompt condutor.",
      },
      user: "2",
    },
    {
      ai: "<p>Etapa 1. A base de conhecimento são os documentos que a IA pode consultar. Base carregada:</p><pre>politica-de-ferias.md\nmanual-de-reembolso.md\ncodigo-de-conduta.md</pre><p>A IA só responde sobre o que está nesses três arquivos. Seguir para o fatiamento?</p>",
      tech: {
        s: "etapa 1 de 10 · base",
        b: "<b>Mecanismo:</b> os textos entram no contexto do condutor com cabeçalho por arquivo. <b>Limite:</b> assunto fora da base fica fora do alcance, e isso será demonstrado na etapa 9.",
      },
      user: "pode seguir",
    },
    {
      ai: "<p>Etapa 2. O trecho é um pedaço pequeno de documento, em inglês chunk. A base foi dividida em <b>18 trechos</b>. Dois exemplos:</p><pre>politica-de-ferias.md · trecho 2\n\"As férias podem ser emendadas com feriados nacionais,\ndesde que a solicitação respeite o prazo do item 1.\"\n\nmanual-de-reembolso.md · trecho 2\n\"O limite diário de alimentação em viagem é de\nR$ 120 por pessoa.\"</pre>",
      tech: {
        s: "etapa 2 de 10 · trechos",
        b: "<b>Mecanismo:</b> citações sempre literais, com arquivo e número, regra inviolável 4 do condutor. No backend v2, o fatiamento real usa 500 a 800 caracteres com sobreposição de 100.",
      },
      user: "entendi, próxima",
    },
    {
      ai: "<p>Etapa 3. O embedding é uma lista de números que representa o significado de um trecho. Trechos parecidos ganham números parecidos.</p><pre>trecho 2 → [ 0.012, -0.348, 0.901, 0.077, ... ]\n(valores ilustrativos, o cálculo real acontece\nno servidor de embeddings)</pre><p>Seguir para a busca?</p>",
      tech: {
        s: "etapa 3 de 10 · embedding",
        b: "<b>Mecanismo:</b> regra de honestidade, o condutor declara que os números são ilustrativos no Modo A. Com o backend v2 ligado, os valores passam a ser reais e o aviso some.",
      },
      user: "seguir",
    },
    {
      ai: "<p>Etapa 4. Agora é com você. Escreva uma pergunta que esses documentos conseguem responder. Por exemplo, algo sobre férias, reembolso ou conduta.</p>",
      tech: {
        s: "etapa 4 de 10 · pergunta",
        b: "<b>Critério:</b> pergunta respondível pela base. Se vier algo claramente fora, o condutor guarda para o teste de limite da etapa 9 e pede outra.",
      },
      user: "Posso emendar o descanso com o feriado?",
    },
    {
      ai: "<p>Etapa 5. A recuperação seleciona os trechos mais parecidos com a pergunta. Top 3, com k igual a 3:</p><pre>0.89 · politica-de-ferias.md · trecho 2\n\"As férias podem ser emendadas com feriados nacionais...\"\n\n0.81 · politica-de-ferias.md · trecho 1\n\"As férias devem ser solicitadas com 30 dias de antecedência...\"\n\n0.72 · politica-de-ferias.md · trecho 3\n\"O período mínimo de gozo é de 5 dias corridos...\"\n\n(scores ilustrativos)</pre><p>Repare: a sua pergunta diz <b>descanso</b> e o documento diz <b>férias</b>. A busca semântica encontrou mesmo assim, porque compara significados.</p>",
      tech: {
        s: "etapa 5 de 10 · recuperação",
        b: "<b>Mecanismo:</b> o condutor aponta ativamente o caso de sinônimo quando ele ocorre, demonstrando busca semântica com o exemplo da própria pessoa. Telemetria: pergunta_registrada.",
      },
      user: "continuar",
    },
    {
      ai: "<p>Etapa 6. O contexto é a mensagem final enviada ao modelo, a pergunta junto com os trechos. Este é o prompt montado, literalmente:</p><pre>Responda usando apenas os trechos abaixo.\n\nTrecho 1: \"As férias podem ser emendadas com\nferiados nacionais, desde que a solicitação\nrespeite o prazo do item 1.\"\nTrecho 2: \"As férias devem ser solicitadas com\n30 dias de antecedência pelo sistema de RH.\"\n\nPergunta: Posso emendar o descanso com o feriado?</pre><p>Os documentos entram dentro da mensagem. Gerar a resposta?</p>",
      tech: {
        s: "etapa 6 de 10 · contexto",
        b: "<b>Mecanismo:</b> exibir o prompt montado é a revelação central da missão, desfaz a caixa-preta. O participante vê que RAG é, no fim, texto dentro da mensagem.",
      },
      user: "gerar",
    },
    {
      ai: "<p>Etapa 7. Resposta gerada com base nos trechos:</p><p><b>Sim. As férias podem ser emendadas com feriados nacionais, desde que solicitadas com 30 dias de antecedência pelo sistema de RH.</b></p><pre>fonte: politica-de-ferias.md · trechos 1 e 2</pre><p>A citação permite conferir a origem.</p>",
      tech: {
        s: "etapa 7 de 10 · geração e citação",
        b: "<b>Limite:</b> regra inviolável 6, a resposta usa somente os trechos recuperados. Se forem insuficientes, o condutor declara em vez de completar com conhecimento geral.",
      },
      user: "e sem RAG, como ficaria?",
    },
    {
      ai: "<p>Etapa 8. A mesma pergunta, sem os documentos:</p><p>\"Sim, a legislação trabalhista costuma permitir a emenda, em geral até 5 dias, dependendo da política da empresa.\"</p><pre>sem RAG · sem fonte</pre><p>Compare. A resposta sem RAG soa razoável, cita uma regra que está em lugar nenhum dos seus documentos e zero fonte para conferir. Esse é o risco da alucinação. Testar os limites?</p>",
      tech: {
        s: "etapa 8 de 10 · contraste",
        b: "<b>Mecanismo:</b> o contraste usa a mesma pergunta da pessoa, o que torna a alucinação pessoal e memorável. A resposta sem RAG é rotulada para nunca ser confundida com a citada.",
      },
      user: "sim. Qual é o salário do CEO?",
    },
    {
      ai: "<p>Etapa 9. Busquei nos 18 trechos e nenhum trata de salários. <b>Essa informação está fora da base, então eu fico sem resposta.</b></p><p>Diagnóstico: o assunto não existe nos três documentos carregados. Para o RAG responder isso, a base precisaria de um documento de remuneração. Essa recusa é a proteção do RAG contra a alucinação.</p>",
      tech: {
        s: "etapa 9 de 10 · teste de limite",
        b: "<b>Mecanismo:</b> a recusa diante de pergunta fora da base é o comportamento correto e vira aprendizado. Telemetria: fora_da_base_detectada. O condutor mantém a recusa mesmo sob insistência.",
      },
      user: "fechou, pode encerrar",
    },
    {
      ai: "<p>Etapa 10. Você viu o caminho completo, do documento à resposta citada, e o sistema recusando o que está fora da base. Este relatório é seu, copie e guarde.</p><pre>RELATORIO DA MISSAO · RAG NA PRATICA\nbase: 3 arquivos (pack de exemplo)\ntrechos: 18\npergunta testada: posso emendar o descanso com o feriado?\nresposta citada: sim, com 30 dias de antecedência\n  fonte: politica-de-ferias.md · trechos 1 e 2\ncontraste sem RAG: inventou regra de CLT, sem fonte\nteste de limite: \"qual o salário do CEO?\" · diagnóstico:\n  assunto ausente da base, exigiria documento de remuneração</pre><pre>STATUS: MISSAO CONCLUIDA</pre>",
      tech: {
        s: "concluída",
        b: "<b>Critério de conclusão:</b> 1 resposta com fonte, 1 contraste sem RAG, 1 recusa fora da base com diagnóstico. Sentinela detectada, telemetria final: missao_concluida.",
      },
      user: null,
      done: true,
    },
  ];
}

export function getGuidedMissionStepContent(missionId, stepIndex = 0) {
  const script = getGuidedMissionScript(missionId);
  return script[Math.max(0, Math.min(stepIndex, script.length - 1))] || script[0] || null;
}

export function getGuidedMissionExplainPane(missionId, missionState) {
  const stepContent = getGuidedMissionStepContent(
    missionId,
    Number(missionState?.scriptIndex || 0),
  );
  return {
    kicker: "Componente em foco",
    title: stepContent?.tech?.s || "explicação técnica",
    html: stepContent?.tech?.b || "",
  };
}
