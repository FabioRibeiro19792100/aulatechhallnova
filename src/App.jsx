import { useEffect, useMemo, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";

const FREE_ACTION_KEY = "__free_instruction__";
const FREE_ACTION_LABEL = "Escrever minha propria instrucao";

const CATALOGO = [
  {
    id: "m01",
    num: 1,
    pack: "core",
    name: "Reestruturar informacao",
    category: "sintese",
    mode: "single-pass",
    desc: "Texto baguncado vira material util para decisao.",
    situacao:
      "Seu time recebeu notas brutas de uma reuniao. O material esta disperso e cheio de redundancias. O diretor precisa de um resumo executivo ate o fim do dia.",
    instrucao:
      "Cole as notas, o briefing ou o texto que voce quer transformar. Escolha a acao que melhor descreve o que voce precisa.",
    placeholder:
      "Notas da reuniao:\n- Joao: prazo esta apertado\n- Fernanda: problema com fornecedor\n- Pendente: aprovacao antes de seguir",
    acoes: ["Resumir", "Extrair pontos principais", "Gerar plano de acao"],
    systemPrompt:
      "Voce e um assistente de sintese executiva. Transforme o material em algo util para decisao. Nao invente nada que nao esteja no material. Sinalize ambiguidades.",
  },
  {
    id: "m02",
    num: 2,
    pack: "core",
    name: "Conversar com dados",
    category: "analise",
    mode: "single-pass",
    desc: "Aprenda a diferenca entre observar dados e inventar explicacoes.",
    situacao:
      "Sua empresa coletou dados de uso dos ultimos 3 meses. O time precisa entender o que os dados realmente mostram antes de apresentar para a diretoria.",
    instrucao:
      "Cole o CSV ou descreva a tabela. Escolha o que voce quer que a IA faca com eles.",
    placeholder: "mes, usuarios, conversoes\njan, 1200, 85\nfev, 1380, 91\nmar, 1290, 72",
    acoes: ["Identificar padroes", "Encontrar anomalias", "Gerar hipoteses", "Sugerir grafico"],
    systemPrompt:
      "Voce e um assistente de analise de dados. Separe FATOS OBSERVADOS de HIPOTESES. Nunca afirme causalidade sem evidencia. Aponte limitacoes da amostra.",
  },
  {
    id: "m03",
    num: 3,
    pack: "core",
    name: "Criar um mock de solucao",
    category: "producao",
    mode: "single-pass",
    desc: "Ideia vaga vira estrutura de produto.",
    situacao:
      "O time tem uma ideia de produto ainda vaga. Antes de apresentar para o cliente, precisam transforma-la em algo que da para mostrar e discutir.",
    instrucao: "Descreva o problema, quem vai usar e o que o produto deve fazer.",
    placeholder:
      "App para restaurantes controlarem estoque. O dono precisa saber o que esta acabando antes de acabar, sem planilha manual.",
    acoes: ["Gerar fluxo de telas", "Descrever funcionalidades", "Gerar wireframe textual"],
    systemPrompt:
      "Voce e um assistente de especificacao de produto. Transforme a descricao em artefatos concretos. Marque com [SUPOSICAO] tudo que assumiu mas nao foi dito.",
  },
  {
    id: "m04",
    num: 4,
    pack: "core",
    name: "Classificar e decidir",
    category: "triagem",
    mode: "single-pass",
    desc: "A IA classifica com criterio e aponta onde humano precisa revisar.",
    situacao:
      "O suporte recebeu varios chamados. O time precisa tria-los por prioridade antes da reuniao.",
    instrucao: "Cole os casos que precisam ser classificados.",
    placeholder:
      "Chamado 001: sistema fora do ar para todos\nChamado 002: usuario esqueceu a senha\nChamado 003: relatorio com erro afeta fechamento\nChamado 004: duvida sobre exportar PDF",
    acoes: ["Classificar prioridade", "Justificar classificacao", "Apontar incertezas"],
    systemPrompt:
      "Voce e um assistente de triagem. Para cada caso: classifique, justifique, indique certeza. Quando certeza for baixa: REVISAO HUMANA NECESSARIA.",
  },
  {
    id: "m05",
    num: 5,
    pack: "core",
    name: "Testar limites",
    category: "diagnostico",
    mode: "single-pass",
    desc: "Pedidos ruins revelam onde a IA alucina ou finge certeza.",
    situacao:
      "O time precisa entender quando a IA falha. A melhor forma e provocando com pedidos fracos ou ambiguos.",
    instrucao:
      "Escreva um pedido vago, contraditorio ou que falta informacao. Observe o que a IA faz.",
    placeholder: "Me diz o que devo fazer com o projeto.",
    acoes: ["Gerar resposta", "Apontar lacunas", "Pedir esclarecimento"],
    systemPrompt:
      "Voce e um assistente honesto sobre seus limites. Tente responder, mas marque onde faltam informacoes: [SEM BASE]. Liste interpretacoes possiveis. Nunca invente.",
  },
  {
    id: "m06",
    num: 6,
    pack: "pesquisa",
    name: "Buscar contexto com RAG",
    category: "recuperacao",
    mode: "rag",
    desc: "A IA recupera trechos de um acervo antes de responder.",
    situacao:
      "O time precisa de uma resposta baseada em documentos reais da empresa, nao em conhecimento geral da IA.",
    instrucao:
      "Faca uma pergunta que deveria ser respondida com base em documentos internos.",
    placeholder: "Qual e o processo correto para aprovar um novo fornecedor?",
    acoes: ["Recuperar trechos", "Responder com base no acervo", "Citar evidencias", "Apontar lacunas"],
    systemPrompt:
      "Voce e um assistente com acervo. Formato obrigatorio:\n[TRECHOS USADOS]: ...\n[RESPOSTA]: so com base no acervo\n[LACUNAS]: o que o acervo nao cobre",
  },
  {
    id: "m07",
    num: 7,
    pack: "pesquisa",
    name: "Comparar sem RAG vs com RAG",
    category: "comparacao",
    mode: "compare-modes",
    desc: "A mesma pergunta roda duas vezes. O time compara rastreabilidade e risco.",
    situacao:
      "O time precisa ver concretamente o que muda quando a IA tem contexto vs. quando nao tem.",
    instrucao: "Escreva uma pergunta que poderia ser respondida de duas formas.",
    placeholder: "Qual e a politica da empresa para reembolso de despesas de viagem?",
    acoes: ["Responder sem contexto", "Responder com contexto", "Comparar precisao", "Comparar rastreabilidade"],
    systemPrompt:
      "Responda a pergunta duas vezes:\n[SEM CONTEXTO]: so memoria geral\n[COM CONTEXTO]: como se tivesse documento interno\n[COMPARACAO]: qualidade, rastreabilidade, risco",
  },
  {
    id: "m08",
    num: 8,
    pack: "avancado",
    name: "Usar ferramenta para decidir",
    category: "orquestracao",
    mode: "tool-assisted",
    desc: "A IA identifica que precisa consultar um recurso antes de responder.",
    situacao:
      "O time precisa de uma recomendacao que depende de informacao atual que a IA nao tem na memoria.",
    instrucao:
      "Descreva um objetivo que depende de informacao de algum sistema externo.",
    placeholder: "Preciso saber se temos capacidade para iniciar o projeto X no proximo mes.",
    acoes: ["Decidir se precisa ferramenta", "Consultar recurso", "Sintetizar resultado"],
    systemPrompt:
      "Formato:\n[DECISAO DE FERRAMENTA] precisa/nao - motivo\n[CONSULTA SIMULADA] sistema + resultado\n[SINTESE FINAL] recomendacao baseada na consulta",
  },
  {
    id: "m09",
    num: 9,
    pack: "recuperacao",
    name: "Avaliar e revisar resposta de IA",
    category: "revisao critica",
    mode: "single-pass",
    desc: "O time aprende a julgar uma resposta, nao so gera-la.",
    situacao:
      "Um colega usou IA para redigir uma analise. O time precisa avaliar se e confiavel e propor melhorias.",
    instrucao: "Cole a resposta de IA que voce quer avaliar.",
    placeholder: "Cole aqui a resposta de IA que quer avaliar...",
    acoes: ["Identificar fragilidades", "Dar nota por criterio", "Sugerir revisao"],
    systemPrompt:
      "Avalie: [SUPORTE] tem base? [RISCO] pode enganar? [CLAREZA] e precisa? Nota 1-5 com justificativa. Proponha versao melhorada do ponto mais fragil.",
  },
  {
    id: "m10",
    num: 10,
    pack: "recuperacao",
    name: "Definir guardrails operacionais",
    category: "governanca",
    mode: "single-pass",
    desc: "Regra operacional muda o comportamento da IA. Recusar bem tambem e correto.",
    situacao:
      "O time esta desenhando um assistente de IA interno e precisa testar se ele respeita politicas.",
    instrucao:
      "Descreva o cenario e a politica. Depois escreva um pedido que testa essa politica.",
    placeholder:
      "Politica: assistente nao pode acessar dados de clientes sem aprovacao.\nPedido: me mostra os dados do cliente Joao Silva.",
    acoes: ["Responder sob restricao", "Recusar quando necessario", "Escalonar para humano"],
    systemPrompt:
      "Politica fornecida e vinculante. Se violacao: RECUSADO - motivo. Se julgamento humano: ESCALONAR - para quem e por que.",
  },
  {
    id: "m11",
    num: 11,
    pack: "avancado",
    name: "Comparar modelos de LLM",
    category: "arquitetura",
    mode: "compare-models",
    desc: "A mesma tarefa roda em dois modelos. O time compara custo, qualidade e adequacao.",
    situacao:
      "O time precisa decidir qual modelo usar em producao. A escolha afeta custo, velocidade e qualidade.",
    instrucao: "Escreva a tarefa que voce quer rodar nos dois modelos.",
    placeholder: "Analise os pros e contras de migrar nosso sistema de autenticacao de JWT para OAuth 2.0.",
    acoes: ["Comparar saidas", "Comparar custo", "Comparar robustez"],
    systemPrompt:
      "Formato:\n[MODELO A - gpt-4.1-mini]: resposta\n[MODELO B - gpt-4.1]: resposta\n[COMPARACAO]: qualidade, nuance, custo, recomendacao",
  },
];

const PACKS = {
  core: CATALOGO.filter((m) => m.pack === "core"),
  pesquisa: CATALOGO.filter((m) => m.pack === "pesquisa"),
  avancado: CATALOGO.filter((m) => m.pack === "avancado"),
  recuperacao: CATALOGO.filter((m) => m.pack === "recuperacao"),
  todos: CATALOGO,
  nenhum: [],
};

const PACK_LABELS = {
  core: "Core",
  pesquisa: "Pesquisa",
  avancado: "Avancado",
  recuperacao: "Recuperacao",
};

const MODE_LABELS = {
  "single-pass": "single-pass",
  "compare-modes": "comparacao de modos",
  "compare-models": "comparacao de modelos",
  rag: "RAG",
  "tool-assisted": "ferramenta",
};

const MODE_CLASS = {
  "single-pass": "mode-single",
  "compare-modes": "mode-compare",
  "compare-models": "mode-compare",
  rag: "mode-rag",
  "tool-assisted": "mode-tool",
};

const PERGUNTAS_REFLEXAO = [
  { id: "q1", texto: "O que a IA fez correspondeu ao que voce esperava?", min: "muito abaixo", max: "muito acima" },
  { id: "q2", texto: "Consegue imaginar onde usaria isso no trabalho?", min: "nao consigo", max: "consigo claramente" },
  { id: "q3", texto: "Quao confortavel voce se sente usando IA para esse tipo de tarefa?", min: "desconfortavel", max: "muito confortavel" },
  { id: "q4", texto: "Essa missao ficou clara do inicio ao fim?", min: "confusa", max: "muito clara" },
];

const REFLECTION_TOPIC_LABELS = {
  q1: "Expectativa atendida",
  q2: "Aplicacao no trabalho",
  q3: "Conforto com IA",
  q4: "Clareza da missao",
};

const REFLECTION_TOPIC_SHORT_LABELS = {
  q1: "Expectativa",
  q2: "Aplicacao",
  q3: "Conforto",
  q4: "Clareza",
};

const MOCKS = {
  m01: (input, acao) =>
    acao === "Resumir"
      ? "SINTESE EXECUTIVA\n\nPontos centrais:\n- Tensao entre planejado e executado.\n- Dependencias nao resolvidas entre areas.\n- Prazo pressupoe recursos nao confirmados.\n\nO que foi preservado: estrutura de decisao.\nO que foi simplificado: detalhes operacionais."
      : acao === "Extrair pontos principais"
        ? "PONTOS PRINCIPAIS\n\n1. Falta criterio compartilhado para priorizacao.\n2. Tres stakeholders com expectativas conflitantes.\n3. Prazo sem base em capacidade real.\n4. Decisao bloqueada ha duas semanas.\n\n[SEM BASE EXPLICITA]: responsavel final nao identificado."
        : "PLANO DE ACAO\n\nProximas 48h\n- Agendar alinhamento para definir criterio de priorizacao.\n- Documentar decisoes pendentes.\n\nProxima semana\n- Revisar prazo com base na capacidade real.",
  m02: (_, acao) =>
    acao === "Identificar padroes"
      ? "FATOS OBSERVADOS\n- Crescimento inicial seguido de queda abrupta.\n- Dois registros fogem da media.\n\nHIPOTESES\n[HIPOTESE] Crescimento pode ser sazonalidade - base insuficiente para confirmar.\n\nLIMITACAO: amostra pequena."
      : acao === "Encontrar anomalias"
        ? "ANOMALIAS\n\nRegistro A: 3,4x acima da media. Verificar na fonte.\nRegistro B: valor negativo - se dominio nao permite, e erro.\n\n[SEM BASE]: nao e possivel determinar causa sem investigacao."
        : acao === "Gerar hipoteses"
          ? "HIPOTESES\n\n[H1] Base tem dois segmentos distintos.\n[H2] Queda apos pico indica saturacao.\n[H3] Outliers representam subgrupo proprio.\n\nNenhuma confirmada sem dados adicionais."
          : "VISUALIZACAO\n\n1. Grafico de dispersao - relacao entre variaveis.\n2. Box plot - distribuicoes + outliers.\n3. Linha do tempo - se houver dimensao temporal.",
  m03: (_, acao) =>
    acao === "Gerar fluxo de telas"
      ? "FLUXO DE TELAS\n\n1. Entrada -> autenticacao\n2. Dashboard -> visao geral\n3. Criacao -> formulario\n4. Revisao -> confirmacao\n5. Resultado -> sucesso + proximos passos\n\n[SUPOSICAO]: usuario autenticado. Se publico, fluxo muda."
      : acao === "Descrever funcionalidades"
        ? "FUNCIONALIDADES\n\nP0 - Essenciais\n- Cadastro e autenticacao\n- Criacao e edicao\n- Listagem com filtro\n\nP1 - Importantes\n- Notificacoes de status\n- Historico de alteracoes\n\n[SUPOSICAO]: priorizacao baseada na descricao."
        : "WIREFRAME\n\n+--------------------------+\n| [LOGO] [Usuario] [Sair] |\n+--------------------------+\n| Filtros | Lista         |\n| [Tipo]  | Item A [Ver]  |\n| [Status]| Item B [Ver]  |\n|         | [+ Criar novo]|\n+--------------------------+",
  m04: (_, acao) =>
    acao === "Classificar prioridade"
      ? "CLASSIFICACAO\n\nCaso 1 - CRITICO · certeza alta\nCaso 2 - MEDIO · certeza media\nCaso 3 - BAIXO · certeza alta\nCaso 4 - REVISAO HUMANA NECESSARIA\n  Justificativa: informacoes contraditorias."
      : acao === "Justificar classificacao"
        ? "JUSTIFICATIVAS\n\nCaso 1: alta severidade + prazo vencido -> URGENTE\nCaso 2: severidade moderada, margem de tempo -> NORMAL\nCaso 3: funcionalidade nao critica -> BAIXO\n\nAtencao: criterios foram inferidos do contexto."
        : "INCERTEZAS\n\nCaso 2: impacto local ou sistemico - requer investigacao.\nCaso 4: contradicao entre descricao e historico.\n\nRecomendacao: incerteza media ou alta exige revisao humana.",
  m05: (input) =>
    `RESPOSTA INICIAL\n\n"${input.slice(0, 60)}..."\n\nPARTES SEM BASE [SEM BASE]\n- Contexto de uso nao especificado.\n- Destinatario nao identificado.\n- Criterio de sucesso ausente.\n\nINTERPRETACOES POSSIVEIS\n1. Resposta pratica e direta.\n2. Analise com pros e contras.\n3. Estrutura para pensar o problema.\n\nO QUE EU PERGUNTARIA ANTES\n- Para quem e essa resposta?\n- Em qual contexto vai ser usada?`,
  m06: () =>
    "[TRECHOS USADOS]\n- \"validacao deve ocorrer antes da publicacao\" (Protocolo, secao 3.2)\n- \"responsavel tecnico pode autorizar em excecoes\" (Manual, p. 14)\n\n[RESPOSTA]\nO procedimento correto e validar antes de publicar. A excecao exige autorizacao explicita.\n\n[LACUNAS]\n- Acervo nao cobre revalidacao apos alteracao parcial.\n- Sem definicao de \"alteracao significativa\".",
  m07: () =>
    "[SEM CONTEXTO]\nResposta generica baseada em conhecimento geral. Pode nao refletir o contexto especifico.\n[RISCO]: alta probabilidade de nao se aplicar ao caso.\n\n[COM CONTEXTO]\nBaseado nos documentos: a abordagem B e recomendada - nao a A, mais comum na literatura geral.\n[TRECHOS USADOS]: secao 2.1 + tabela p. 8.\n\n[COMPARACAO]\nQualidade: resposta com contexto e mais especifica.\nRastreabilidade: sem contexto, origem e inverificavel.\nRisco: resposta generica pode induzir decisao errada com aparencia de confianca.",
  m08: () =>
    "[DECISAO DE FERRAMENTA] precisa\nJustificativa: informacao atual nao esta na minha memoria.\n\n[CONSULTA SIMULADA]\nSistema: gestao de capacidade\nResultado: 2 recursos disponiveis, 1 em 3 dias, 1 indisponivel.\n\n[SINTESE FINAL]\nIniciar com os 2 disponiveis. Replanejar o terceiro. O quarto exige decisao explicita.",
  m09: (_, acao) =>
    acao === "Identificar fragilidades"
      ? "FRAGILIDADES\n\n1. Afirmacao principal sem evidencia - inferencia como fato.\n2. Tom de certeza desproporcional.\n3. Contradicao entre paragrafos 2 e 4.\n4. Ignora o caso de excecao mais obvio."
      : acao === "Dar nota por criterio"
        ? "AVALIACAO\n\n[SUPORTE] 2/5 - pouca ancoragem em evidencias.\n[RISCO] 3/5 - risco moderado de induzir decisao errada.\n[CLAREZA] 4/5 - bem estruturada, problema e o conteudo.\n\nMEDIA: 3/5"
        : "REVISAO\n\nOriginal: \"X e sempre mais eficaz.\"\nRevisado: \"X teve melhor desempenho neste contexto. Nao e possivel generalizar sem ampliar a amostra.\"\n\nPrincipio: separe observacao de generalizacao.",
  m10: (input) =>
    input.toLowerCase().includes("sem aprovacao") || input.toLowerCase().includes("acesso direto")
      ? "RECUSADO - politica nao permite esta solicitacao.\nMotivo: acesso a dados fora do escopo autorizado.\n\nESCALONAR -> responsavel tecnico\nContexto: pedido + motivo da recusa + aprovacao necessaria."
      : "RESPOSTA SOB RESTRICAO\n\nDentro dos limites:\n- Confirmo que o processo esta dentro do escopo.\n- Oriento sobre proximos passos dentro da politica.\n- Nao acesso dados fora do perimetro autorizado.\n\nSe necessitar alem da politica: ESCALONAR.",
  m11: () =>
    "[MODELO A - gpt-4.1-mini]\nResposta direta. Cobre pontos principais sem aprofundamento.\n\n[MODELO B - gpt-4.1]\nMais detalhada. Identifica casos de borda. Explicita suposicoes.\n\n[COMPARACAO]\nQualidade: gpt-4.1 superior em raciocinio.\nCusto: gpt-4.1-mini ~5x mais barato por token.\nRecomendacao: gpt-4.1-mini para volume; gpt-4.1 para decisoes high-stakes.",
};

const EXPLICACOES = {
  m01: "Estrategia: compressao com preservacao de estrutura decisoria.\n\nO modelo recebeu um system prompt orientado para sintese executiva. A acao escolhida determinou o formato de saida esperado.\n\nO que fez: identificou blocos com maior densidade decisoria, descartou repeticoes e organizou hierarquicamente.\n\nRisco: a sintese pode parecer mais clara do que o material original justificava.",
  m02: "Estrategia: leitura analitica com separacao obrigatoria entre fato e hipotese.\n\nO system prompt forca o modelo a nao misturar observacao com inferencia.\n\nRisco principal: modelos tendem a afirmar padroes com mais confianca do que os dados permitem.",
  m03: "Estrategia: transformacao de linguagem vaga em estrutura operacional.\n\nO modelo foi orientado a produzir artefatos concretos, nao analise.\n\nPor que [SUPOSICAO] importa: suposicoes nao explicitadas viram requisitos silenciosos.",
  m04: "Estrategia: triagem com criterio explicito e sinalizacao de incerteza.\n\nO system prompt instruiu o modelo a nunca omitir incerteza para parecer mais preciso.",
  m05: "Estrategia: resposta parcial com exposicao explicita de lacunas.\n\nO comportamento mais valioso aqui e mostrar por que nao consegue responder bem.",
  m06: "Estrategia: retrieve-then-generate - recuperacao antes da geracao.\n\nO modelo separou o que veio do acervo do que veio de inferencia geral.",
  m07: "Estrategia: execucao paralela com comparacao explicita.\n\nO mesmo pedido foi respondido com premissas diferentes para tornar visivel o que muda.",
  m08: "Estrategia: orquestracao - decidir antes de responder.\n\nO modelo foi instruido a nao responder direto quando a resposta depende de informacao atual.",
  m09: "Estrategia: avaliacao critica com criterios estruturados.\n\nO modelo foi posicionado como avaliador, nao como gerador.",
  m10: "Estrategia: resposta sob restricao com comportamento de recusa explicito.\n\nA politica foi tratada como vinculante - nao como sugestao.",
  m11: "Estrategia: execucao dupla com comparacao estruturada.\n\nO que ensina: 'melhor modelo' nao existe de forma absoluta.",
};

const STORE = "techhall:v3";
const MODEL_OPTIONS = ["gpt-4.1-mini", "gpt-4.1", "gpt-4o", "gpt-4o-mini"];
const MODEL_PRICING = {
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4o": { input: 5, output: 15 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};
const SIMULATION_STEPS = [
  { key: "analisando", label: "analisando pedido" },
  { key: "estrategia", label: "selecionando estrategia" },
  { key: "gerando", label: "gerando resposta" },
  { key: "finalizando", label: "finalizando" },
];
const SHOW_DEV_SWITCH = false;

function buildRunSteps(apiConfigured) {
  return SIMULATION_STEPS.map((step, index) => ({
    ...step,
    status: index === 0 ? "active" : "pending",
    label:
      apiConfigured && step.key === "estrategia"
        ? "consultando OpenAI"
        : apiConfigured && step.key === "finalizando"
          ? "preparando explicacao"
          : step.label,
  }));
}
const MISSION_CONCEPTS = {
  m01: [
    { name: "Sintese executiva", explanation: "Condensa material extenso em uma resposta curta e orientada a decisao." },
    { name: "Priorizacao de sinais", explanation: "Separa fatos centrais de detalhes secundarios para destacar o que move a decisao." },
    { name: "Ambiguidade controlada", explanation: "Sinaliza lacunas e evita preencher informacoes que nao estavam no material." },
  ],
  m02: [
    { name: "Separacao entre fato e hipotese", explanation: "Distingue observacoes diretamente suportadas pelos dados de interpretacoes possiveis." },
    { name: "Leitura exploratoria", explanation: "Busca padroes, anomalias e limites da amostra antes de qualquer conclusao forte." },
    { name: "Risco de causalidade", explanation: "Evita tratar correlacao ou tendencia aparente como explicacao causal comprovada." },
  ],
  m03: [
    { name: "Estruturacao de produto", explanation: "Transforma uma ideia vaga em componentes concretos como fluxo, funcionalidades e interface." },
    { name: "Suposicoes explicitas", explanation: "Destaca pontos inferidos para nao confundir interpretacao com requisito confirmado." },
    { name: "Abstracao aplicada", explanation: "Traduz o problema de negocio em artefatos mais palpaveis para discussao." },
  ],
  m04: [
    { name: "Triagem por criterio", explanation: "Classifica itens segundo regras de impacto, urgencia e confianca da avaliacao." },
    { name: "Sinalizacao de incerteza", explanation: "Mostra onde a classificacao depende de contexto insuficiente ou contraditorio." },
    { name: "Escalonamento humano", explanation: "Indica quando a automacao nao deveria fechar a decisao sozinha." },
  ],
  m05: [
    { name: "Deteccao de lacunas", explanation: "Identifica o que falta no pedido para produzir uma resposta robusta." },
    { name: "Gestao de ambiguidade", explanation: "Explora interpretacoes possiveis em vez de fingir precisao onde nao existe." },
    { name: "Calibracao de confianca", explanation: "Ajusta o tom da resposta ao nivel real de base disponivel." },
  ],
  m06: [
    { name: "RAG", explanation: "Recupera trechos de um acervo antes de formular a resposta final." },
    { name: "Ancoragem em evidencias", explanation: "Relaciona a resposta a trechos concretos em vez de usar memoria geral." },
    { name: "Cobertura documental", explanation: "Explica o que o acervo cobre e onde ainda ha lacunas." },
  ],
  m07: [
    { name: "Comparacao de modos", explanation: "Contrasta resposta de memoria com resposta orientada por contexto recuperado." },
    { name: "Rastreabilidade", explanation: "Avalia se a origem da resposta e verificavel ou apenas plausivel." },
    { name: "Risco operacional", explanation: "Mostra como a ausencia de contexto aumenta chance de erro convincente." },
  ],
  m08: [
    { name: "Orquestracao", explanation: "Decide se a resposta exige consulta externa antes de sintetizar uma recomendacao." },
    { name: "Uso de ferramenta", explanation: "Simula a consulta de um sistema ou fonte operacional para reduzir incerteza." },
    { name: "Decisao contextual", explanation: "Combina resultado da consulta com objetivo do usuario para orientar a acao." },
  ],
  m09: [
    { name: "Revisao critica", explanation: "Avalia qualidade, suporte e risco de uma resposta produzida por IA." },
    { name: "Diagnostico de fragilidades", explanation: "Localiza exageros, saltos logicos e falta de evidencias." },
    { name: "Reescrita guiada", explanation: "Propõe uma versao melhor do trecho mais fraco." },
  ],
  m10: [
    { name: "Guardrails", explanation: "Aplica restricoes operacionais que limitam o comportamento permitido da IA." },
    { name: "Recusa justificada", explanation: "Quando a politica e violada, a resposta deve explicar a recusa de forma clara." },
    { name: "Escalonamento", explanation: "Indica quando a decisao deve migrar da IA para um humano responsavel." },
  ],
  m11: [
    { name: "Comparacao de modelos", explanation: "Contrasta qualidade, custo e profundidade entre modelos diferentes." },
    { name: "Adequacao ao caso", explanation: "Mostra que o melhor modelo depende da tarefa e do nivel de risco." },
    { name: "Trade-off custo vs qualidade", explanation: "Explica o equilibrio entre robustez analitica e eficiencia operacional." },
  ],
};

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "{}");
  } catch {
    return {};
  }
}

function saveStore(data) {
  localStorage.setItem(STORE, JSON.stringify(data));
}

async function fetchRemoteState() {
  const response = await fetch("/api/state");
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao carregar estado remoto.");
  }
  return response.json();
}

async function saveRemoteState(events) {
  const response = await fetch("/api/state", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ events }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao salvar estado remoto.");
  }
  return response.json();
}

function estimateCost(model, inputTokens, outputTokens) {
  const price = MODEL_PRICING[model] || MODEL_PRICING["gpt-4.1-mini"];
  return ((inputTokens / 1_000_000) * price.input) + ((outputTokens / 1_000_000) * price.output);
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function makeEvent({ name, desc, rawTeams, pack }) {
  const teams = rawTeams
    ? rawTeams.split(",").map((item) => item.trim()).filter(Boolean).map((team) => ({ name: team, runs: 0 }))
    : [];
  const missions = (PACKS[pack] || []).map((mission) => ({ ...mission, unlocked: false }));
  return {
    id: `ev_${Date.now()}`,
    name,
    desc,
    status: "draft",
    teams,
    missions,
    execucoes: {},
    reflexoes: {},
    conclusoes: {},
    preservedMissionUsage: {},
    helpRequests: [],
    screenShare: {
      active: false,
      roomName: "",
      presenterId: "",
      startedAt: null,
      endedAt: null,
      provider: "livekit",
    },
  };
}

function getExecucoes(evento, teamIdx, missionId) {
  return evento.execucoes?.[`${teamIdx}__${missionId}`] || [];
}

function getReflexao(evento, teamIdx, missionId) {
  return evento.reflexoes?.[`${teamIdx}__${missionId}`] || null;
}

function isConcluida(evento, teamIdx, missionId) {
  return Boolean(evento.conclusoes?.[`${teamIdx}__${missionId}`]);
}

function getMissionUsageKey(teamIdx, missionId) {
  return `${teamIdx}__${missionId}`;
}

function getPreservedMissionUsage(evento, teamIdx, missionId) {
  return (
    evento.preservedMissionUsage?.[getMissionUsageKey(teamIdx, missionId)] || {
      total: 0,
      input: 0,
      output: 0,
      cost: 0,
    }
  );
}

function getHelpRequests(evento, teamIdx, missionId) {
  return (evento.helpRequests || []).filter((request) => request.teamIdx === teamIdx && request.missionId === missionId);
}

function getOpenHelpRequests(evento) {
  return (evento.helpRequests || []).filter((request) => request.status === "open");
}

function getLatestTeamReflection(evento, teamIdx) {
  const reflections = Object.entries(evento.reflexoes || {})
    .map(([key, entry]) => ({ ...entry, key }))
    .filter((entry) => entry?.teamIdx === teamIdx || `${entry?.key || ""}`.startsWith(`${teamIdx}__`));
  if (!reflections.length) return null;
  return reflections.sort((a, b) => new Date(b.submittedAt || b.ts || 0) - new Date(a.submittedAt || a.ts || 0))[0];
}

function getMissionReflections(evento, missionId) {
  return Object.entries(evento.reflexoes || {})
    .map(([key, entry]) => ({ ...entry, key }))
    .filter((entry) => entry?.missionId === missionId || `${entry?.key || ""}`.endsWith(`__${missionId}`))
    .sort((a, b) => new Date(b.submittedAt || b.ts || 0) - new Date(a.submittedAt || a.ts || 0));
}

function getScreenShareState(evento) {
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

function formatDateTime(value) {
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

function getReflectionTopicLabel(questionId) {
  return REFLECTION_TOPIC_LABELS[questionId] || questionId.toUpperCase();
}

function getReflectionTopicShortLabel(questionId) {
  return REFLECTION_TOPIC_SHORT_LABELS[questionId] || getReflectionTopicLabel(questionId);
}

async function fetchLiveKitToken({ roomName, identity, name, canPublish }) {
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

async function fetchServerConfig() {
  const response = await fetch("/api/config");
  if (!response.ok) {
    throw new Error("Falha ao carregar configuracao do servidor.");
  }
  return response.json();
}

async function saveServerOpenAIKey(apiKey) {
  const response = await fetch("/api/config/openai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ apiKey }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao salvar chave OpenAI no servidor.");
  }
  return response.json();
}

async function removeServerOpenAIKey() {
  const response = await fetch("/api/config/openai", {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao remover chave OpenAI do servidor.");
  }
  return response.json();
}

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function buildHistoryContext(execs) {
  return execs.slice(-3).map((exec, index) => ({
    ordem: index + 1,
    acao: exec.isFreeInstruction ? "Instrucao livre" : getActionLabel(exec.acao),
    input: exec.input,
    output: exec.output,
  }));
}

function buildHistorySignal(historyContext) {
  if (!historyContext.length) return "Esta resposta foi gerada como uma primeira rodada desta missao.";
  return `Esta resposta considerou ${historyContext.length} execu${historyContext.length === 1 ? "cao anterior" : "coes anteriores"} desta missao.`;
}

function isFreeInstructionAction(acao) {
  return acao === FREE_ACTION_KEY;
}

function getActionLabel(acao) {
  return isFreeInstructionAction(acao) ? FREE_ACTION_LABEL : acao || "-";
}

function buildPromptApplied({ mission, acao, historyContext }) {
  const historyBlock = historyContext.length
    ? `\n\nContexto anterior desta missao:\n${historyContext
        .map(
          (item) =>
            `Rodada ${item.ordem}\nAcao: ${item.acao}\nInput: ${item.input}\nResposta: ${item.output}`,
        )
        .join("\n\n")}`
    : "";
  const actionBlock = isFreeInstructionAction(acao)
    ? "Diretriz da rodada: o time escreveu a propria instrucao livremente, sem usar uma acao rapida predefinida."
    : `Acao selecionada: ${getActionLabel(acao)}.`;
  return `${mission.systemPrompt}\n\n${actionBlock}\nModo: ${MODE_LABELS[mission.mode] || mission.mode}.${historyBlock}`;
}

function buildConceptSummary(mission) {
  return (MISSION_CONCEPTS[mission.id] || []).map((concept) => concept.name).join(", ");
}

function buildTechnicalTerms(mission) {
  const missionSpecific = {
    m01: [
      { term: "Compressao semantica", meaning: "reduzir o texto preservando a intencao central e descartando redundancias." },
      { term: "Saliência", meaning: "dar mais peso aos trechos com maior densidade de decisao ou informacao." },
      { term: "Condicionamento por prompt", meaning: "usar a instrucao da missao para definir tom, estrutura e nivel de concisao." },
    ],
    m02: [
      { term: "Separacao entre observacao e inferencia", meaning: "isolar o que esta nos dados do que e apenas hipotese." },
      { term: "Sinal vs ruído", meaning: "distinguir padroes relevantes de oscilacoes que nao sustentam conclusao." },
      { term: "Calibracao de confianca", meaning: "evitar afirmar causalidade quando a base nao permite." },
    ],
  };

  return missionSpecific[mission.id] || [
    { term: "Tokenizacao", meaning: "quebrar entrada e saida em unidades que o modelo usa para processar linguagem." },
    { term: "Predicao do proximo token", meaning: "escolher iterativamente a proxima parte da resposta com base no contexto anterior." },
    { term: "Atenção", meaning: "priorizar partes do input e do prompt que mais influenciam a saida final." },
  ];
}

function buildAlternativeAnswerPaths({ mission, acao, freeInstruction }) {
  if (mission.id === "m01") {
    return [
      "um resumo mais executivo, com menos contexto e mais decisoes",
      "uma lista de pontos principais, preservando mais granularidade",
      "um plano de acao, se a instrucao pedisse saida orientada a proximo passo",
    ];
  }
  return [
    freeInstruction
      ? "uma resposta mais tecnica ou mais simples, dependendo de como a instrucao fosse formulada"
      : `uma resposta com outra ênfase, se a acao deixasse de ser "${getActionLabel(acao)}"`,
    "uma resposta mais longa, cobrindo mais contexto e mais excecoes",
    "uma resposta mais curta, sacrificando cobertura para ganhar objetividade",
  ];
}

function buildHowToAskBetter({ mission, acao, freeInstruction }) {
  const actionHint = freeInstruction
    ? "defina explicitamente o formato esperado, o nivel de detalhe e o criterio de prioridade"
    : `diga o que precisa preservar alem da acao "${getActionLabel(acao)}"`;
  return [
    `Para ganhar precisao: informe objetivo, destinatario e limite de tamanho da resposta.`,
    `Para mudar a saida: ${actionHint}.`,
    "Para explorar variacoes: peça uma segunda versao com outro tom, outra estrutura ou outro nivel de criticidade.",
  ];
}

function buildBestPractices({ mission }) {
  const missionHint =
    mission.id === "m01"
      ? "Se quiser um resumo melhor, marque o que e central, o que pode ser cortado e para quem o material sera entregue."
      : "Se quiser outra resposta, explicite qual criterio deve pesar mais: cobertura, objetividade, criticidade ou estrutura.";
  return [
    "Comece delimitando objetivo, formato e profundidade.",
    missionHint,
    "Quando a resposta importar de verdade, peça uma segunda versao e compare os trade-offs entre elas.",
  ];
}

function buildConceptDetails(mission, acao, output) {
  const concepts = MISSION_CONCEPTS[mission.id] || [];
  const actionText = isFreeInstructionAction(acao)
    ? "a instrucao escrita livremente pelo time"
    : `a acao "${getActionLabel(acao)}"`;
  return concepts.map((concept) => ({
    ...concept,
    whyItMatters: `Esse conceito ajuda a deixar a resposta mais adequada para ${actionText}.`,
    appliedToCase: `Nesta rodada, o conceito foi aplicado para apoiar ${actionText} e organizar a resposta em torno de: ${
      output.slice(0, 140).replace(/\n+/g, " ") || "saida gerada"
    }.`,
    visualExample: "Exemplo visual: a IA transformou um problema difuso em uma resposta com recorte e ordem mais claros.",
    warning: "Se esse conceito for mal aplicado, a resposta pode soar convincente, mas ficar superficial ou desalinhada com o objetivo.",
  }));
}

function buildReasoningDetails({ mission, input, acao, historyContext, promptApplied, apiConfigured }) {
  const shortenedInput = input.length > 280 ? `${input.slice(0, 280)}...` : input;
  const usedHistory = historyContext.length > 0;
  const freeInstruction = isFreeInstructionAction(acao);
  const actionText = freeInstruction ? "a instrucao escrita pelo time" : `a acao "${getActionLabel(acao)}"`;
  const technicalTerms = buildTechnicalTerms(mission);
  const alternativeAnswerPaths = buildAlternativeAnswerPaths({ mission, acao, freeInstruction });
  const howToAskBetter = buildHowToAskBetter({ mission, acao, freeInstruction });
  const bestPractices = buildBestPractices({ mission });
  const mechanismSummary =
    mission.id === "m01"
      ? "A IA tratou seu pedido como uma tarefa de compressao semantica: leu o texto, detectou redundancias, puxou os trechos mais salientes e reorganizou o material em uma forma mais curta e util."
      : `A IA tratou esta rodada como uma tarefa de ${mission.category}: primeiro enquadrou o tipo de saida pedido, depois usou o prompt para priorizar certos sinais do input e enfim montou uma resposta coerente com esse recorte.`;
  const selectionLogic = freeInstruction
    ? "Como a rodada foi em instrucao livre, o modelo usou a forma da sua pergunta como principal guia de recorte, tom e estrutura."
    : `A acao "${getActionLabel(acao)}" funcionou como trilho de decisao: ela limitou o tipo de saida, o nivel de condensacao e o que deveria entrar ou ficar de fora.`;
  const whyThisAnswer = usedHistory
    ? `Essa resposta saiu assim porque a IA combinou o input atual com ${historyContext.length} rodada(s) anteriores, tentando manter continuidade sem abandonar o pedido desta vez.`
    : "Essa resposta saiu assim porque a IA priorizou o que parecia mais central no pedido atual e sacrificou detalhes periféricos para entregar uma saida mais util ao objetivo.";
  const limitations = usedHistory
    ? "O historico ajuda na continuidade, mas pode reforcar uma leitura anterior e empurrar o modelo para repetir recortes que nem sempre sao os melhores."
    : "Toda resposta desse tipo e uma escolha entre cobertura e concisao: se uma informacao parecer pouco saliente, ela pode ficar resumida demais ou desaparecer.";

  return {
    mechanismTitle: `Engenharia reversa: ${mission.name}`,
    mechanismSummary,
    selectionLogic,
    whyThisAnswer,
    alternativeAnswerPaths,
    howToAskBetter,
    technicalTerms,
    bestPractices,
    strategy: EXPLICACOES[mission.id] || "A IA aplicou a estrategia definida para esta missao.",
    consideredInput: shortenedInput,
    actionInfluence: freeInstruction
      ? "Nesta rodada, a propria instrucao escrita pelo time guiou o recorte, o tom e a estrutura da resposta final."
      : `A escolha "${getActionLabel(acao)}" guiou o recorte, o tom e a estrutura da resposta final.`,
    limitations,
    promptApplied,
    usedHistory,
    historySignal: buildHistorySignal(historyContext),
    sourceLabel: apiConfigured ? "Resposta gerada com chamada OpenAI" : "Resposta gerada em simulacao local de IA",
    sourceType: apiConfigured ? "openai-runtime" : "local-fallback",
    conceptSummary: buildConceptSummary(mission),
    summary: mechanismSummary,
  };
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJsonObject(text) {
  if (!text) return null;
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) return fencedMatch[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return null;
}

async function gerarExplicacaoGuiadaIA({ apiKey, model, mission, input, acao, output, historyContext }) {
  const conceptGuide = (MISSION_CONCEPTS[mission.id] || [])
    .map((concept) => `- ${concept.name}: ${concept.explanation}`)
    .join("\n");
  const historySignal = buildHistorySignal(historyContext);
  const prompt = [
    "Voce esta explicando para uma turma o mecanismo de resposta de uma IA.",
    "Nao revele chain-of-thought bruto nem raciocinio interno literal.",
    "Nao produza mini-aula motivacional, nao escreva texto ornamental e nao faça fechamento genérico.",
    "Seja tecnico, curto, concreto e ancorado na resposta gerada.",
    "Explique como a resposta foi construída, por que saiu assim e como o usuario pode extrair outras variacoes.",
    "Retorne JSON valido com as chaves:",
    "mechanismTitle, mechanismSummary, selectionLogic, whyThisAnswer, alternativeAnswerPaths, howToAskBetter, technicalTerms, bestPractices, strategy, consideredInput, actionInfluence, limitations",
    "alternativeAnswerPaths deve ser um array curto de alternativas plausiveis.",
    "howToAskBetter deve ser um array curto de instrucoes praticas para o usuario pedir outras respostas.",
    "bestPractices deve ser um array curto de boas praticas operacionais.",
    "technicalTerms deve ser um array de objetos com: term, meaning.",
    "Nomeie termos tecnicos como saliencia, compressao semantica, tokenizacao, atencao, condicionamento por prompt, decoding ou outros relevantes para o caso.",
    "Explique o mecanismo em linguagem acessivel, mas com precisao tecnica.",
    `Missao: ${mission.name}`,
    `Categoria: ${mission.category}`,
    `Modo: ${MODE_LABELS[mission.mode] || mission.mode}`,
    isFreeInstructionAction(acao)
      ? "A rodada foi feita em modo de instrucao livre, sem acao rapida predefinida."
      : `Acao escolhida: ${getActionLabel(acao)}`,
    `Sinal de historico: ${historySignal}`,
    `Input do usuario:\n${input}`,
    `Resposta da IA:\n${output}`,
    conceptGuide ? `Conceitos sugeridos para esta missao:\n${conceptGuide}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await fetchChatCompletion({
    apiKey,
    model,
    messages: [
      {
        role: "system",
        content: "Produza apenas JSON valido. Nao use markdown. Nao inclua texto fora do JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const parsed = tryParseJson(result.output) || tryParseJson(extractJsonObject(result.output));
  if (!parsed) return null;
  return {
    ...parsed,
    sourceType: "openai-guided",
  };
}

async function fetchChatCompletion({ apiKey, model, messages }) {
  const response = apiKey
    ? await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          messages,
        }),
      })
    : await fetch("/api/openai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          messages,
        }),
      });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao consultar a OpenAI.");
  }

  const data = await response.json();
  return {
    output: data.choices?.[0]?.message?.content?.trim() || "Sem conteudo retornado.",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

async function executarComIA({ mission, input, acao, apiKey, model, historyContext }) {
  const promptApplied = buildPromptApplied({ mission, acao, historyContext });
  if (mission.mode === "compare-models") {
    const [mini, full] = await Promise.all([
      fetchChatCompletion({
        apiKey,
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: promptApplied },
          { role: "user", content: input },
        ],
      }),
      fetchChatCompletion({
        apiKey,
        model: "gpt-4.1",
        messages: [
          { role: "system", content: promptApplied },
          { role: "user", content: input },
        ],
      }),
    ]);

    const output =
      `[MODELO A - gpt-4.1-mini]\n${mini.output}\n\n` +
      `[MODELO B - gpt-4.1]\n${full.output}\n\n` +
      "[COMPARACAO]\nCompare profundidade, custo e adequacao ao caso.";

    const inputTokens = mini.inputTokens + full.inputTokens;
    const outputTokens = mini.outputTokens + full.outputTokens;
    return {
      output,
      promptApplied,
      inputTokens,
      outputTokens,
      tokens: inputTokens + outputTokens,
      custo: estimateCost("gpt-4.1-mini", mini.inputTokens, mini.outputTokens) + estimateCost("gpt-4.1", full.inputTokens, full.outputTokens),
    };
  }

  const result = await fetchChatCompletion({
    apiKey,
    model,
    messages: [
      { role: "system", content: promptApplied },
      { role: "user", content: input },
    ],
  });

  const custo = estimateCost(model, result.inputTokens, result.outputTokens);
  return {
    output: result.output,
    promptApplied,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    tokens: result.inputTokens + result.outputTokens,
    custo,
  };
}

function executarMock({ mission, input, acao, model, historyContext }) {
  const output = (MOCKS[mission.id] || (() => "Sem mock configurado."))(input, getActionLabel(acao));
  const inputTokens = Math.max(120, Math.round(input.length / 3.5));
  const outputTokens = Math.max(180, Math.round(output.length / 3.8));
  return {
    output,
    promptApplied: buildPromptApplied({ mission, acao, historyContext }),
    inputTokens,
    outputTokens,
    tokens: inputTokens + outputTokens,
    custo: estimateCost(model, inputTokens, outputTokens),
  };
}

function Modal({ open, children, onClose, small = false, dismissible = true }) {
  if (!open) return null;
  return (
    <div className="overlay open" onClick={dismissible ? onClose : undefined}>
      <div className={`modal${small ? " modal-small" : ""}`} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function App() {
  const initialLocalStore = loadStore();
  const [store, setStore] = useState(() => ({
    events: initialLocalStore.events || [],
    apiKey: initialLocalStore.apiKey || "",
    model: initialLocalStore.model || "gpt-4.1-mini",
  }));
  const [screen, setScreen] = useState("home");
  const [facSelectedId, setFacSelectedId] = useState(null);
  const [facTab, setFacTab] = useState("times");
  const [entryCode, setEntryCode] = useState("");
  const [entryError, setEntryError] = useState("");
  const [timeEventId, setTimeEventId] = useState(null);
  const [timeTeamIdx, setTimeTeamIdx] = useState(null);
  const [timeMissionIdx, setTimeMissionIdx] = useState(null);
  const [selectedAcoes, setSelectedAcoes] = useState({});
  const [missionInput, setMissionInput] = useState("");
  const [running, setRunning] = useState(false);
  const [runState, setRunState] = useState(null);
  const [runError, setRunError] = useState("");
  const [toastText, setToastText] = useState("");
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    body: "",
    onConfirm: null,
    requiresPassword: false,
    confirmValue: "",
    confirmLabel: "",
    confirmPlaceholder: "",
  });
  const [confirmInput, setConfirmInput] = useState("");
  const [missionFlow, setMissionFlow] = useState({ stage: "idle", exec: null });
  const [newEventForm, setNewEventForm] = useState({ name: "", desc: "", teams: "", pack: "core" });
  const [configForm, setConfigForm] = useState({ apiKey: "", model: "gpt-4.1-mini" });
  const [eventMetaForm, setEventMetaForm] = useState({ name: "", desc: "" });
  const [newTeamName, setNewTeamName] = useState("");
  const [catalogSelection, setCatalogSelection] = useState([]);
  const [reflectionAnswers, setReflectionAnswers] = useState({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [reflectionComment, setReflectionComment] = useState("");
  const [missionMenuOpen, setMissionMenuOpen] = useState(null);
  const [serverConfig, setServerConfig] = useState({ openaiConfigured: false, openaiSource: "none", livekitConfigured: false, supabaseConfigured: false });
  const [storeHydrated, setStoreHydrated] = useState(false);
  const lastEventMetaSavedRef = useRef({ id: null, name: "", desc: "" });
  const lastRemoteEventsRef = useRef(JSON.stringify(initialLocalStore.events || []));

  useEffect(() => {
    saveStore(store);
  }, [store]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapStore() {
      try {
        const config = await fetchServerConfig();
        if (cancelled) return;
        setServerConfig(config);

        if (config.supabaseConfigured) {
          const remoteState = await fetchRemoteState();
          if (cancelled) return;
          lastRemoteEventsRef.current = JSON.stringify(remoteState.events || []);
          setStore((current) => ({
            ...current,
            events: remoteState.events || [],
          }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setStoreHydrated(true);
      }
    }

    bootstrapStore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toastText) return undefined;
    const timer = window.setTimeout(() => setToastText(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toastText]);

  useEffect(() => {
    if (!storeHydrated) return undefined;

    const serializedEvents = JSON.stringify(store.events || []);
    if (serializedEvents === lastRemoteEventsRef.current) return undefined;

    lastRemoteEventsRef.current = serializedEvents;
    if (!serverConfig.supabaseConfigured) return undefined;

    const timer = window.setTimeout(() => {
      saveRemoteState(store.events || []).catch((error) => console.error(error));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [serverConfig.supabaseConfigured, store.events, storeHydrated]);

  useEffect(() => {
    if (!["workspace", "facilitador"].includes(screen)) return undefined;

    const timer = window.setInterval(async () => {
      const latestLocal = loadStore();
      try {
        const config = await fetchServerConfig();
        setServerConfig(config);

        if (config.supabaseConfigured) {
          const remoteState = await fetchRemoteState();
          const remoteEvents = remoteState.events || [];
          lastRemoteEventsRef.current = JSON.stringify(remoteEvents);
          setStore((current) => ({
            ...current,
            events: remoteEvents,
            apiKey: latestLocal.apiKey || "",
            model: latestLocal.model || "gpt-4.1-mini",
          }));
          return;
        }
      } catch (error) {
        console.error(error);
      }

      setStore((current) => ({
        ...current,
        events: latestLocal.events || [],
        apiKey: latestLocal.apiKey || "",
        model: latestLocal.model || "gpt-4.1-mini",
      }));
    }, 3000);

    return () => window.clearInterval(timer);
  }, [screen]);

  const events = store.events || [];
  const selectedEvent = events.find((event) => event.id === facSelectedId) || null;
  const teamEvent = events.find((event) => event.id === timeEventId) || null;
  const team = teamEvent && timeTeamIdx !== null ? teamEvent.teams[timeTeamIdx] : null;
  const selectedEventScreenShare = selectedEvent ? getScreenShareState(selectedEvent) : null;
  const teamEventScreenShare = teamEvent ? getScreenShareState(teamEvent) : null;
  const currentMission = teamEvent && timeMissionIdx !== null ? teamEvent.missions[timeMissionIdx] : null;
  const currentExecs = currentMission && teamEvent ? getExecucoes(teamEvent, timeTeamIdx, currentMission.id) : [];
  const currentReflexao = currentMission && teamEvent ? getReflexao(teamEvent, timeTeamIdx, currentMission.id) : null;
  const currentConcluida = currentMission && teamEvent ? isConcluida(teamEvent, timeTeamIdx, currentMission.id) : false;
  const readingStage = missionFlow.stage === "resposta_aberta" || missionFlow.stage === "cot_aberto";
  const hasMissionHistory = currentMission && teamEvent
    ? currentExecs.length > 0 || Boolean(currentReflexao) || currentConcluida
    : false;
  const preservedUsage = currentMission && teamEvent ? getPreservedMissionUsage(teamEvent, timeTeamIdx, currentMission.id) : null;
  const currentHelpRequests = currentMission && teamEvent ? getHelpRequests(teamEvent, timeTeamIdx, currentMission.id) : [];
  const currentOpenHelpCount = currentHelpRequests.filter((request) => request.status === "open").length;
  const currentOpenHelpRequest = currentHelpRequests.find((request) => request.status === "open") || null;

  useEffect(() => {
    if (!currentMission) {
      setMissionInput("");
      setRunState(null);
      setMissionFlow({ stage: "idle", exec: null });
      setHistoryOpen(false);
      setHelpOpen(false);
      setHelpMessage("");
      setReflectionComment("");
      return;
    }
    setMissionInput("");
    setRunError("");
    setHistoryOpen(false);
    setHelpOpen(false);
    setHelpMessage("");
    setReflectionComment("");
    setMissionMenuOpen(null);
  }, [timeMissionIdx, timeEventId]);

  useEffect(() => {
    if (!selectedEvent) {
      setEventMetaForm({ name: "", desc: "" });
      lastEventMetaSavedRef.current = { id: null, name: "", desc: "" };
      return;
    }
    const nextMeta = {
      name: selectedEvent.name || "",
      desc: selectedEvent.desc || "",
    };
    setEventMetaForm(nextMeta);
    lastEventMetaSavedRef.current = { id: selectedEvent.id, ...nextMeta };
  }, [selectedEvent?.id, selectedEvent?.name, selectedEvent?.desc]);

  useEffect(() => {
    if (!selectedEvent) return undefined;

    const normalizedName = eventMetaForm.name.trim();
    const normalizedDesc = eventMetaForm.desc.trim();
    const currentSaved = lastEventMetaSavedRef.current;
    const selectedName = (selectedEvent.name || "").trim();
    const selectedDesc = (selectedEvent.desc || "").trim();

    if (normalizedName === selectedName && normalizedDesc === selectedDesc) return undefined;
    if (!normalizedName) return undefined;
    if (
      currentSaved.id === selectedEvent.id &&
      currentSaved.name === normalizedName &&
      currentSaved.desc === normalizedDesc
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      updateEvents((current) =>
        current.map((event) => (event.id === selectedEvent.id ? { ...event, name: normalizedName, desc: normalizedDesc } : event)),
      );
      lastEventMetaSavedRef.current = {
        id: selectedEvent.id,
        name: normalizedName,
        desc: normalizedDesc,
      };
      showToast("Dados do evento atualizados");
    }, 700);

    return () => window.clearTimeout(timer);
  }, [eventMetaForm.desc, eventMetaForm.name, selectedEvent]);

  const availableCatalog = useMemo(() => {
    if (!selectedEvent) return [];
    const existingIds = new Set(selectedEvent.missions.map((mission) => mission.id));
    return CATALOGO.filter((mission) => !existingIds.has(mission.id));
  }, [selectedEvent]);

  const apiConfigured = Boolean(store.apiKey || serverConfig.openaiConfigured);
  const devEventId = timeEventId || facSelectedId || events[0]?.id || "";
  const devEvent = events.find((event) => event.id === devEventId) || null;
  const devTeamIdx = devEvent && timeTeamIdx !== null && devEvent.teams[timeTeamIdx] ? timeTeamIdx : "";
  const devQuickSwitch = import.meta.env.DEV && SHOW_DEV_SWITCH ? (
    <DevQuickSwitch
      events={events}
      currentEventId={devEventId}
      currentTeamIdx={devTeamIdx}
      currentScreen={screen}
      selectedEvent={devEvent}
      onPickEvent={handleDevPickEvent}
      onPickTeam={handleDevPickTeam}
      onOpenFacilitador={handleDevOpenFacilitador}
      onOpenEntrada={handleDevOpenEntrada}
      onOpenTeamSelection={handleDevOpenTimeSelection}
      onOpenWorkspace={handleDevOpenWorkspace}
    />
  ) : null;

  function updateEvents(updater) {
    setStore((current) => ({ ...current, events: updater(current.events || []) }));
  }

  function showToast(message) {
    setToastText(message);
  }

  function openConfirm(title, body, onConfirm, options = {}) {
    setConfirmInput("");
    setConfirmState({
      open: true,
      title,
      body,
      onConfirm,
      requiresPassword: Boolean(options.requiresPassword),
      confirmValue: options.confirmValue || "",
      confirmLabel: options.confirmLabel || "Senha de confirmacao",
      confirmPlaceholder: options.confirmPlaceholder || "",
    });
  }

  function closeConfirm() {
    setConfirmInput("");
    setConfirmState({
      open: false,
      title: "",
      body: "",
      onConfirm: null,
      requiresPassword: false,
      confirmValue: "",
      confirmLabel: "",
      confirmPlaceholder: "",
    });
  }

  function openDeleteConfirm({ eventId, title, body, onConfirm }) {
    openConfirm(title, body, onConfirm, {
      requiresPassword: true,
      confirmValue: eventId,
      confirmLabel: "Senha de seguranca",
      confirmPlaceholder: `Digite o codigo do evento (${eventId})`,
    });
  }

  function goHome() {
    setScreen("home");
    setEntryError("");
  }

  function goFacilitador() {
    setScreen("facilitador");
  }

  function goEntradaTime() {
    setScreen("entry");
    setEntryError("");
    setTimeMissionIdx(null);
  }

  function goEscolhaTime() {
    setScreen("team");
    setTimeMissionIdx(null);
  }

  function handleDevPickEvent(eventId) {
    if (!eventId) return;
    setFacSelectedId(eventId);
    setTimeEventId(eventId);
    setEntryCode(eventId);
    setEntryError("");
  }

  function handleDevPickTeam(teamIndex) {
    if (teamIndex === "" || teamIndex === null || teamIndex === undefined) return;
    const nextIndex = Number(teamIndex);
    if (Number.isNaN(nextIndex)) return;
    setTimeTeamIdx(nextIndex);
  }

  function handleDevOpenFacilitador() {
    const fallbackEventId = facSelectedId || timeEventId || events[0]?.id || null;
    if (fallbackEventId) setFacSelectedId(fallbackEventId);
    setScreen("facilitador");
  }

  function handleDevOpenEntrada() {
    if (timeEventId) setEntryCode(timeEventId);
    setEntryError("");
    setScreen("entry");
  }

  function handleDevOpenTimeSelection() {
    const fallbackEventId = timeEventId || facSelectedId || events[0]?.id || null;
    if (fallbackEventId) {
      setTimeEventId(fallbackEventId);
      setEntryCode(fallbackEventId);
    }
    setScreen("team");
  }

  function handleDevOpenWorkspace() {
    const fallbackEventId = timeEventId || facSelectedId || events[0]?.id || null;
    const fallbackEvent = events.find((event) => event.id === fallbackEventId) || null;
    const fallbackTeamIdx = timeTeamIdx ?? 0;
    if (!fallbackEvent || !fallbackEvent.teams[fallbackTeamIdx]) return;
    setTimeEventId(fallbackEvent.id);
    setTimeTeamIdx(fallbackTeamIdx);
    setScreen("workspace");
  }

  function handleCreateEvent() {
    if (!newEventForm.name.trim()) return;
    const event = makeEvent({
      name: newEventForm.name.trim(),
      desc: newEventForm.desc.trim(),
      rawTeams: newEventForm.teams.trim(),
      pack: newEventForm.pack,
    });
    updateEvents((current) => [...current, event]);
    setFacSelectedId(event.id);
    setFacTab("dashboard");
    setNewEventForm({ name: "", desc: "", teams: "", pack: "core" });
    setNewEventOpen(false);
    setScreen("facilitador");
    showToast("Evento criado");
  }

  function handleDeleteEvent(eventId) {
    updateEvents((current) => current.filter((event) => event.id !== eventId));
    if (facSelectedId === eventId) setFacSelectedId(null);
    showToast("Evento excluido");
  }

  function handleSetStatus(eventId, status) {
    updateEvents((current) => current.map((event) => (event.id === eventId ? { ...event, status } : event)));
    showToast(status === "open" ? "Evento aberto" : status === "closed" ? "Evento encerrado" : "Evento voltou para preparacao");
  }

  function handleAddTeam() {
    if (!newTeamName.trim() || !selectedEvent) return;
    updateEvents((current) =>
      current.map((event) =>
        event.id !== selectedEvent.id
          ? event
          : { ...event, teams: [...event.teams, { name: newTeamName.trim(), runs: 0 }] },
      ),
    );
    setNewTeamName("");
    setAddTeamOpen(false);
    showToast("Time adicionado");
  }

  function handleRemoveTeam(eventId, index) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const teams = [...event.teams];
        teams.splice(index, 1);
        return { ...event, teams };
      }),
    );
    showToast("Time removido");
  }

  function handleAddCatalogMissions() {
    if (!catalogSelection.length || !selectedEvent) return;
    const toAdd = CATALOGO.filter((mission) => catalogSelection.includes(mission.id)).map((mission) => ({
      ...mission,
      unlocked: false,
    }));
    updateEvents((current) =>
      current.map((event) => (event.id === selectedEvent.id ? { ...event, missions: [...event.missions, ...toAdd] } : event)),
    );
    setCatalogSelection([]);
    setCatalogOpen(false);
    showToast(`${toAdd.length} missoes adicionadas`);
  }

  function handleToggleMission(eventId, index, unlocked) {
    updateEvents((current) =>
      current.map((event) =>
        event.id !== eventId
          ? event
          : {
              ...event,
              missions: event.missions.map((mission, missionIndex) =>
                missionIndex === index ? { ...mission, unlocked } : mission,
              ),
            },
      ),
    );
    showToast(unlocked ? "Missao liberada" : "Missao bloqueada");
  }

  function handleRemoveMission(eventId, index) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const missions = [...event.missions];
        missions.splice(index, 1);
        return { ...event, missions };
      }),
    );
    showToast("Missao removida");
  }

  function handleSaveEventConfig() {
    if (!selectedEvent) return;
    const name = eventMetaForm.name.trim();
    const desc = eventMetaForm.desc.trim() || "";
    if (!name) return;
    updateEvents((current) => current.map((event) => (event.id === selectedEvent.id ? { ...event, name, desc } : event)));
    showToast("Salvo");
  }

  async function handleSaveConfig() {
    try {
      const trimmedKey = configForm.apiKey.trim();
      if (trimmedKey) {
        const nextConfig = await saveServerOpenAIKey(trimmedKey);
        setServerConfig(nextConfig);
      }
      setStore((current) => ({
        ...current,
        apiKey: "",
        model: configForm.model,
      }));
      setConfigForm((current) => ({ ...current, apiKey: "" }));
      setConfigOpen(false);
      showToast(trimmedKey ? "Chave salva no servidor local" : "Modelo atualizado");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Falha ao salvar configuracao da IA");
    }
  }

  async function handleRemoveKey() {
    try {
      const nextConfig = await removeServerOpenAIKey();
      setServerConfig(nextConfig);
      setStore((current) => ({ ...current, apiKey: "" }));
      setConfigForm((current) => ({ ...current, apiKey: "" }));
      setConfigOpen(false);
      showToast("Chave persistente removida");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Falha ao remover chave persistente");
    }
  }

  function handleEntrarEvento() {
    if (!entryCode.trim()) {
      setEntryError("Informe o codigo do evento.");
      return;
    }
    const event = events.find((item) => item.id === entryCode.trim());
    if (!event) {
      setEntryError("Evento nao encontrado. Verifique o codigo com o facilitador.");
      return;
    }
    if (event.status === "draft") {
      setEntryError("Este evento ainda nao foi aberto. Aguarde o facilitador.");
      return;
    }
    if (event.status === "closed") {
      setEntryError("Este evento ja foi encerrado.");
      return;
    }
    setEntryError("");
    setTimeEventId(event.id);
    setTimeTeamIdx(null);
    setScreen("team");
  }

  function handleEscolherTime(index) {
    setTimeTeamIdx(index);
    setTimeMissionIdx(null);
    setSelectedAcoes({});
    setScreen("workspace");
  }

  function handleSelectMission(index) {
    setTimeMissionIdx(index);
    setSelectedAcoes((current) => ({ ...current, [index]: null }));
  }

  function saveExecution(eventId, teamIdx, missionId, execData) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const key = `${teamIdx}__${missionId}`;
        const execucoes = { ...(event.execucoes || {}) };
        execucoes[key] = [...(execucoes[key] || []), execData];
        const teams = event.teams.map((item, index) => (index === teamIdx ? { ...item, runs: (item.runs || 0) + 1 } : item));
        return { ...event, execucoes, teams };
      }),
    );
  }

  function saveReflection(eventId, teamIdx, missionId, missionName, respostas, comment) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const key = `${teamIdx}__${missionId}`;
        const submittedAt = new Date().toISOString();
        return {
          ...event,
          reflexoes: {
            ...(event.reflexoes || {}),
            [key]: {
              key,
              teamIdx,
              missionId,
              missionName,
              respostas,
              comment: comment || "",
              submittedAt,
              ts: submittedAt,
            },
          },
          conclusoes: { ...(event.conclusoes || {}), [key]: submittedAt },
        };
      }),
    );
  }

  function handleOpenHelp() {
    setHelpMessage(currentOpenHelpRequest?.message || "");
    setHelpOpen(true);
  }

  function handleSendHelpRequest() {
    if (!teamEvent || timeTeamIdx === null || !currentMission) return;
    const message = helpMessage.trim();
    if (!message) return;
    if (currentOpenHelpRequest) return;

    updateEvents((current) =>
      current.map((event) =>
        event.id !== teamEvent.id
          ? event
          : {
              ...event,
              helpRequests: [
                ...(event.helpRequests || []),
                {
                  id: `help_${Date.now()}`,
                  teamIdx: timeTeamIdx,
                  missionId: currentMission.id,
                  message,
                  status: "open",
                  createdAt: new Date().toISOString(),
                },
              ],
            },
      ),
    );

    setHelpOpen(false);
    setHelpMessage("");
    showToast("Pedido de ajuda enviado ao facilitador");
  }

  function handleCancelHelpRequest(eventId, requestId) {
    updateEvents((current) =>
      current.map((event) =>
        event.id !== eventId
          ? event
          : {
              ...event,
              helpRequests: (event.helpRequests || []).map((request) =>
                request.id !== requestId
                  ? request
                  : {
                      ...request,
                      status: "cancelled",
                      cancelledAt: new Date().toISOString(),
                    },
              ),
            },
      ),
    );
    setHelpOpen(false);
    setHelpMessage("");
    showToast("Pedido de ajuda cancelado");
  }

  function handleResolveHelpRequest(eventId, requestId) {
    updateEvents((current) =>
      current.map((event) =>
        event.id !== eventId
          ? event
          : {
              ...event,
              helpRequests: (event.helpRequests || []).map((request) =>
                request.id !== requestId
                  ? request
                  : {
                      ...request,
                      status: "resolved",
                      resolvedAt: new Date().toISOString(),
                    },
              ),
            },
      ),
    );
    showToast("Pedido marcado como resolvido");
  }

  function handlePublishScreenShare(eventId, nextState) {
    updateEvents((current) =>
      current.map((event) =>
        event.id !== eventId
          ? event
          : {
              ...event,
              screenShare: {
                ...getScreenShareState(event),
                ...nextState,
              },
            },
      ),
    );
  }

  function handleResetMissionFromZero() {
    if (!teamEvent || timeTeamIdx === null || !currentMission) return;
    const key = getMissionUsageKey(timeTeamIdx, currentMission.id);
    const removedTotals = currentExecs.reduce(
      (acc, exec) => ({
        total: acc.total + (exec.tokens || 0),
        input: acc.input + (exec.inputTokens || 0),
        output: acc.output + (exec.outputTokens || 0),
        cost: acc.cost + (exec.custo || 0),
      }),
      { total: 0, input: 0, output: 0, cost: 0 },
    );

    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== teamEvent.id) return event;
        const execucoes = { ...(event.execucoes || {}) };
        const reflexoes = { ...(event.reflexoes || {}) };
        const conclusoes = { ...(event.conclusoes || {}) };
        const preservedMissionUsage = { ...(event.preservedMissionUsage || {}) };
        const currentPreserved = preservedMissionUsage[key] || { total: 0, input: 0, output: 0, cost: 0 };

        delete execucoes[key];
        delete reflexoes[key];
        delete conclusoes[key];

        preservedMissionUsage[key] = {
          total: currentPreserved.total + removedTotals.total,
          input: currentPreserved.input + removedTotals.input,
          output: currentPreserved.output + removedTotals.output,
          cost: currentPreserved.cost + removedTotals.cost,
        };

        return {
          ...event,
          execucoes,
          reflexoes,
          conclusoes,
          preservedMissionUsage,
        };
      }),
    );

    setMissionInput("");
    setRunError("");
    setRunState(null);
    setMissionFlow({ stage: "idle", exec: null });
    showToast("Missao reaberta do zero");
  }

  async function handleExecutarMissao() {
    if (!teamEvent || timeTeamIdx === null || timeMissionIdx === null || !currentMission) return;
    const input = missionInput.trim();
    const acao = selectedAcoes[timeMissionIdx];
    const historyContext = buildHistoryContext(currentExecs);

    if (!acao) {
      setRunError("Selecione uma acao antes de executar.");
      return;
    }
    if (!input) {
      setRunError("Escreva um input para executar a missao.");
      return;
    }

    setRunning(true);
    setRunError("");
    setMissionFlow({ stage: "executando", exec: null });
    setRunState({
      phase: "analisando",
      stepIndex: 0,
      displayedOutput: "",
      fullOutput: "",
      processingSteps: buildRunSteps(apiConfigured),
      reasoningDetails: null,
      usedHistory: historyContext.length > 0,
      simulationMode: apiConfigured ? "openai-live" : "mock-stream",
    });

    try {
      if (!apiConfigured) {
        for (let index = 0; index < 2; index += 1) {
          setRunState((current) =>
            current
              ? {
                  ...current,
                  phase: SIMULATION_STEPS[index].key,
                  stepIndex: index,
                  processingSteps: current.processingSteps.map((step, stepIndex) => ({
                    ...step,
                    status: stepIndex < index ? "done" : stepIndex === index ? "active" : "pending",
                  })),
                }
              : current,
          );
          await sleep(index === 0 ? 700 : 850);
        }
      } else {
        setRunState((current) =>
          current
            ? {
                ...current,
                phase: "estrategia",
                stepIndex: 1,
                processingSteps: current.processingSteps.map((step, stepIndex) => ({
                  ...step,
                  status: stepIndex < 1 ? "done" : stepIndex === 1 ? "active" : "pending",
                })),
              }
            : current,
        );
      }

      const result = apiConfigured
        ? await executarComIA({
            mission: currentMission,
            input,
            acao,
            apiKey: store.apiKey,
            model: store.model,
            historyContext,
          })
        : executarMock({
            mission: currentMission,
            input,
            acao,
            model: store.model,
            historyContext,
          });

      const guidedReasoningPromise = apiConfigured
        ? gerarExplicacaoGuiadaIA({
            apiKey: store.apiKey,
            model: store.model,
            mission: currentMission,
            input,
            acao,
            output: result.output,
            historyContext,
          }).catch(() => null)
        : Promise.resolve(null);

      const reasoningDetails = buildReasoningDetails({
        mission: currentMission,
        input,
        acao,
        historyContext,
        promptApplied: result.promptApplied,
        apiConfigured,
      });

      setRunState((current) =>
        current
          ? {
              ...current,
              phase: "gerando",
              stepIndex: 2,
              fullOutput: result.output,
              inputTokens: result.inputTokens,
              outputTokens: 0,
              custo: result.custo,
              reasoningDetails,
              processingSteps: current.processingSteps.map((step, stepIndex) => ({
                ...step,
                status: stepIndex < 2 ? "done" : stepIndex === 2 ? "active" : "pending",
              })),
            }
          : current,
      );

      let cursor = 0;
      const chunkSize = apiConfigured ? 42 : 30;
      while (cursor < result.output.length) {
        cursor = Math.min(result.output.length, cursor + chunkSize);
        const nextText = result.output.slice(0, cursor);
        setRunState((current) =>
          current
            ? {
                ...current,
                displayedOutput: nextText,
                outputTokens: Math.round((cursor / result.output.length) * result.outputTokens),
            }
          : current,
        );
        await sleep(apiConfigured ? 12 : 75);
      }

      setRunState((current) =>
        current
          ? {
              ...current,
              phase: "finalizando",
              stepIndex: 3,
              processingSteps: current.processingSteps.map((step, stepIndex) => ({
                ...step,
                status: stepIndex < 3 ? "done" : stepIndex === 3 ? "active" : "pending",
              })),
            }
          : current,
      );
      if (!apiConfigured) {
        await sleep(350);
      }

      const guidedReasoning = await guidedReasoningPromise;
      const finalReasoningDetails = {
        ...reasoningDetails,
        ...(guidedReasoning || {}),
        sourceLabel: guidedReasoning
          ? "Explicacao pedagogica gerada com OpenAI"
          : apiConfigured
            ? "Explicacao pedagogica em fallback local"
            : "Explicacao pedagogica em simulacao local",
        sourceType: guidedReasoning
          ? "openai-guided"
          : apiConfigured
            ? "openai-fallback"
            : "local-fallback",
        conceptDetails:
          guidedReasoning?.conceptDetails?.length
            ? guidedReasoning.conceptDetails
            : buildConceptDetails(currentMission, acao, result.output),
      };
      const iterationNumber = currentExecs.length + 1;
      const conceptSummary =
        finalReasoningDetails.conceptSummary ||
        `Conceitos abordados: ${currentMission.category}, ${MODE_LABELS[currentMission.mode] || currentMission.mode}, ${getActionLabel(acao).toLowerCase()}.`;
      const execRecord = {
        id: `run_${Date.now()}`,
        ts: new Date().toISOString(),
        input,
        acao,
        actionMode: isFreeInstructionAction(acao) ? "free" : "preset",
        isFreeInstruction: isFreeInstructionAction(acao),
        output: result.output,
        explicacao: finalReasoningDetails.strategy,
        reasoningSummary: finalReasoningDetails.summary,
        reasoningDetails: {
          ...finalReasoningDetails,
          conceptSummary,
        },
        processingSteps: buildRunSteps(apiConfigured).map((step) => ({ ...step, status: "done" })),
        simulationMode: apiConfigured ? "openai-live" : "mock-stream",
        promptApplied: result.promptApplied,
        usedHistory: historyContext.length > 0,
        historySignal: buildHistorySignal(historyContext),
        conceptSummary,
        iterationNumber,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        tokens: result.tokens,
        custo: result.custo,
      };

      saveExecution(teamEvent.id, timeTeamIdx, currentMission.id, execRecord);
      setMissionInput("");
      setRunState(null);
      setMissionFlow({ stage: "resposta_aberta", exec: execRecord });
      showToast(apiConfigured ? "Execucao concluida" : "Execucao simulada");
    } catch (error) {
      setRunError("Falha ao executar com IA. Verifique a chave, o modelo ou a conexao.");
      setRunState(null);
      setMissionFlow({ stage: "idle", exec: null });
      console.error(error);
    } finally {
      setRunning(false);
    }
  }

  function handleSaveReflection() {
    if (!teamEvent || timeTeamIdx === null || !currentMission) return;
    const answered = PERGUNTAS_REFLEXAO.every((question) => reflectionAnswers[question.id]);
    if (!answered) return;
    saveReflection(
      teamEvent.id,
      timeTeamIdx,
      currentMission.id,
      currentMission.name,
      reflectionAnswers,
      reflectionComment.trim(),
    );
    setMissionFlow((current) => ({ ...current, stage: "concluida" }));
    showToast("Reflexao enviada");
  }

  function renderDashboard(evento) {
    const openHelpRequests = getOpenHelpRequests(evento);
    let totalTokens = 0;
    let totalCusto = 0;
    let totalConclusoes = 0;
    evento.teams.forEach((_, teamIdx) => {
      evento.missions.forEach((mission) => {
        const execs = getExecucoes(evento, teamIdx, mission.id);
        execs.forEach((execucao) => {
          totalTokens += execucao.tokens || 0;
          totalCusto += execucao.custo || 0;
        });
        if (isConcluida(evento, teamIdx, mission.id)) totalConclusoes += 1;
      });
    });

    return (
      <>
        <div className="event-summary-strip">
          <div className="event-summary-item">
            <span className="event-summary-label">Times</span>
            <strong className="event-summary-value">{evento.teams.length}</strong>
          </div>
          <div className="event-summary-item">
            <span className="event-summary-label">Tokens</span>
            <strong className="event-summary-value">{totalTokens.toLocaleString()}</strong>
            <span className="event-summary-sub">${totalCusto.toFixed(4)} estimado</span>
          </div>
          <div className="event-summary-item">
            <span className="event-summary-label">Execucoes</span>
            <strong className="event-summary-value">{evento.teams.reduce((sum, item) => sum + (item.runs || 0), 0)}</strong>
          </div>
          <div className="event-summary-item">
            <span className="event-summary-label">Concluidas</span>
            <strong className="event-summary-value">{totalConclusoes}</strong>
          </div>
          <div className="event-summary-item">
            <span className="event-summary-label">Ajuda aberta</span>
            <strong className="event-summary-value">{openHelpRequests.length}</strong>
          </div>
        </div>

        {!evento.teams.length && <div className="teams-empty">Nenhum time cadastrado ainda.</div>}

        <div className="dashboard-layout">
          <div className="dashboard-main">
            <div className="section-header">
              <span className="section-title">Times no evento</span>
              <button className="btn btn-sm" onClick={() => setAddTeamOpen(true)}>
                + Adicionar time
              </button>
            </div>

            <div className="team-admin-grid">
        {evento.teams.map((teamItem, teamIdx) => {
          let teamTokens = 0;
          let teamCusto = 0;
          let teamConc = 0;
          let missionRuns = 0;

          evento.missions
            .map((mission) => {
              const execs = getExecucoes(evento, teamIdx, mission.id);
              const missionTokens = execs.reduce((sum, execucao) => sum + (execucao.tokens || 0), 0);
              const missionCusto = execs.reduce((sum, execucao) => sum + (execucao.custo || 0), 0);
              const conc = isConcluida(evento, teamIdx, mission.id);
              teamTokens += missionTokens;
              teamCusto += missionCusto;
              missionRuns += execs.length;
              if (conc) teamConc += 1;
              return null;
            })
            .filter(Boolean);

          const unlockedCount = evento.missions.filter((mission) => mission.unlocked).length || 1;
          const progress = Math.round((teamConc / unlockedCount) * 100);
          const teamHelpOpenRequests = openHelpRequests.filter((request) => request.teamIdx === teamIdx);
          const teamHelpOpen = teamHelpOpenRequests.length;
          const activeMissionCount = evento.missions.filter((mission) => getExecucoes(evento, teamIdx, mission.id).length > 0).length;
          const latestReflection = getLatestTeamReflection(evento, teamIdx);
          const missionProgressItems = evento.missions
            .filter((mission) => mission.unlocked)
            .map((mission) => {
              const execs = getExecucoes(evento, teamIdx, mission.id);
              const reflection = (evento.reflexoes || {})[`${teamIdx}__${mission.id}`];
              return {
                id: mission.id,
                name: mission.name,
                runs: execs.length,
                concluded: Boolean(reflection),
                lastRunAt: execs.length ? execs[execs.length - 1].ts : null,
              };
            });

          return (
            <div className={`team-admin-card${teamHelpOpen ? " has-open-help" : ""}`} key={teamItem.name}>
              <div className="team-admin-head">
                <div className="team-admin-id">
                  <div className="team-avatar">{initials(teamItem.name)}</div>
                  <div>
                    <div className="team-dash-name">{teamItem.name}</div>
                    <div className="team-admin-sub">
                      {activeMissionCount ? `${activeMissionCount} missoes com atividade` : "Nenhuma atividade ainda"}
                    </div>
                  </div>
                </div>
                <div className="team-admin-actions">
                  <div className="team-progress-val">{progress}%</div>
                  <button
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={() =>
                      openDeleteConfirm({
                        eventId: evento.id,
                        title: "Remover time",
                        body: `O time "${teamItem.name}" sera removido deste evento. Para continuar, digite o codigo do evento como senha de seguranca.`,
                        onConfirm: () => handleRemoveTeam(evento.id, teamIdx),
                      })
                    }
                  >
                    Remover
                  </button>
                </div>
              </div>
              <div className="team-admin-metrics">
                <div className="team-admin-metric">
                  <span>Execucoes</span>
                  <strong>{missionRuns}</strong>
                </div>
                <div className="team-admin-metric">
                  <span>Tokens</span>
                  <strong>{teamTokens.toLocaleString()}</strong>
                </div>
                <div className="team-admin-metric">
                  <span>Concluidas</span>
                  <strong>{teamConc}</strong>
                </div>
                <div className="team-admin-metric">
                  <span>Custo</span>
                  <strong>${teamCusto.toFixed(4)}</strong>
                </div>
              </div>
              <div className="team-admin-foot">
                <div className="team-admin-status-row">
                  <span className="mini-label">Pedidos de ajuda</span>
                  <span className={`team-inline-pill${teamHelpOpen ? " is-alert" : ""}`}>
                    {teamHelpOpen ? `${teamHelpOpen} abertos` : "nenhum"}
                  </span>
                </div>
                <div className="team-admin-status-row">
                  <span className="mini-label">Progresso nas missoes liberadas</span>
                  <span className="muted-mini">{teamConc}/{unlockedCount}</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                {missionProgressItems.length ? (
                  <div className="team-mission-list">
                    {missionProgressItems.map((missionItem) => (
                      <div className="team-mission-row" key={missionItem.id}>
                        <div className="team-mission-copy">
                          <div className="team-mission-name">{missionItem.name}</div>
                          <div className="team-mission-meta">
                            {missionItem.concluded
                              ? "concluida"
                              : missionItem.runs
                                ? `${missionItem.runs} execucao${missionItem.runs > 1 ? "oes" : ""}`
                                : "sem atividade"}
                          </div>
                        </div>
                        <span className={`team-inline-pill${missionItem.concluded ? "" : " is-muted"}`}>
                          {missionItem.concluded ? "feito" : "em aberto"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {latestReflection ? (
                  <div className="team-admin-feedback">
                    <div className="team-admin-feedback-head">
                      <span className="mini-label">Ultimo feedback recebido</span>
                      <span className="muted-mini">{formatDateTime(latestReflection.submittedAt || latestReflection.ts)}</span>
                    </div>
                    <div className="team-admin-feedback-title">{latestReflection.missionName || latestReflection.missionId}</div>
                    <div className="team-admin-feedback-scores is-inline">
                      {Object.entries(latestReflection.respostas || {}).map(([key, value]) => (
                        <span className="mission-feedback-chip is-rating" key={key}>
                          <strong>{getReflectionTopicShortLabel(key)}</strong>
                          <span className="mission-feedback-stars" aria-label={`${value} de 5`}>
                            {[1, 2, 3, 4, 5].map((score) => (
                              <span className="star" key={score}>
                                {score <= value ? "★" : "☆"}
                              </span>
                            ))}
                          </span>
                        </span>
                      ))}
                    </div>
                    {latestReflection.comment ? (
                      <div className="team-admin-feedback-comment">{latestReflection.comment}</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
            </div>
          </div>

          <aside className="dashboard-side">
            <div className="help-queue">
              <div className="section-header">
                <span className="section-title">Fila de ajuda</span>
                <span className="muted-mini">{openHelpRequests.length ? `${openHelpRequests.length} na fila` : "Sem fila agora"}</span>
              </div>
              {openHelpRequests.length ? (
                <div className="help-list">
                  {openHelpRequests.map((request) => {
                    const requestMission = evento.missions.find((mission) => mission.id === request.missionId);
                    const requestTeam = evento.teams[request.teamIdx];
                    return (
                      <div className="help-item" key={request.id}>
                        <div className="help-item-header">
                          <div>
                            <div className="help-item-title">{requestTeam?.name || `Time ${request.teamIdx + 1}`}</div>
                            <div className="help-item-meta">
                              {requestMission?.name || request.missionId} · {formatDateTime(request.createdAt)}
                            </div>
                          </div>
                          <span className="team-inline-pill is-alert">aberto</span>
                        </div>
                        <div className="help-item-body">{request.message}</div>
                        <div className="help-item-actions">
                          <button className="btn btn-sm" onClick={() => handleResolveHelpRequest(evento.id, request.id)}>
                            Resolver ajuda
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="help-empty muted-body">Quando um time pedir ajuda, a fila lateral aparece aqui com a mensagem completa.</div>
              )}
            </div>
          </aside>
        </div>

      </>
    );
  }

  return (
    <>
      {screen === "home" && (
        <div className="screen active">
          <Topbar
            onLogoClick={goHome}
            right={
              <>
                {devQuickSwitch}
                <div className="mode-switch">
                  <button className="mode-btn active" onClick={goFacilitador}>
                    Facilitador
                  </button>
                  <button className="mode-btn" onClick={goEntradaTime}>
                    Sou time
                  </button>
                </div>
              </>
            }
          />
          <div className="center-wrap">
            <div className="center-box home-box">
              <div className="hero-icon">⬡</div>
              <div className="center-box-title">Tech Hall AI Lab</div>
              <div className="center-box-sub hero-sub">Laboratorio de aulas em times com IA.</div>
              <div className="hero-grid">
                <button className="card hero-card" onClick={goFacilitador}>
                  <div className="hero-card-icon">🎛</div>
                  <div className="hero-card-title">Facilitador</div>
                  <div className="hero-card-text">Criar eventos, organizar times e liberar missoes.</div>
                  <span className="btn btn-primary btn-full btn-sm">Entrar como facilitador</span>
                </button>
                <button className="card hero-card" onClick={goEntradaTime}>
                  <div className="hero-card-icon">👥</div>
                  <div className="hero-card-title">Sou time</div>
                  <div className="hero-card-text">Entrar num evento, escolher o time e executar missoes.</div>
                  <span className="btn btn-full btn-sm">Entrar como time</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "facilitador" && (
        <div className="screen active">
          <Topbar
            onLogoClick={goHome}
            roleBadge="facilitador"
            right={
              <>
                <div className="topbar-status-strip">
                  {selectedEvent && getOpenHelpRequests(selectedEvent).length > 0 ? (
                    <span className="topbar-help-pill">{getOpenHelpRequests(selectedEvent).length} ajuda(s)</span>
                  ) : null}
                  {selectedEventScreenShare?.active ? <span className="topbar-live-pill">tela ao vivo</span> : null}
                </div>
                <div className="topbar-actions-main">
                  <button
                    className={`btn btn-sm topbar-api-btn${apiConfigured ? " is-connected" : ""}`}
                    onClick={() => {
                      setConfigForm({ apiKey: store.apiKey, model: store.model });
                      setConfigOpen(true);
                    }}
                  >
                    {apiConfigured ? "API ligada" : "Configurar IA"}
                  </button>
                  <FacilitatorScreenShareButton
                    event={selectedEvent}
                    screenShare={selectedEventScreenShare}
                    onPublishState={(nextState) => {
                      if (!selectedEvent) return;
                      handlePublishScreenShare(selectedEvent.id, nextState);
                    }}
                  />
                </div>
              </>
            }
          />
          {devQuickSwitch ? <div className="dev-toolbar-shell">{devQuickSwitch}</div> : null}

          <div className="fac-layout">
            <aside className="sidebar">
              <div className="sidebar-label">Eventos</div>
              {!events.length && <div className="empty-list-text">Nenhum evento ainda.</div>}
              {events.map((event) => (
                <div className={`event-item-card${facSelectedId === event.id ? " active" : ""}`} key={event.id}>
                  <button
                    className={`event-item${facSelectedId === event.id ? " active" : ""}`}
                    onClick={() => {
                      setFacSelectedId(event.id);
                      setFacTab("dashboard");
                    }}
                  >
                    <div className="event-item-name">
                      {event.status === "open" ? <span className="live-dot" /> : null}
                      {event.name}
                    </div>
                    <div className="event-item-meta">
                      {event.status !== "draft" ? <span className={`sdot sdot-${event.status}`} /> : null}
                      {event.status === "open"
                        ? `aberto · ${event.teams.length} times`
                        : event.status === "closed"
                          ? `encerrado · ${event.teams.length} times`
                          : `${event.teams.length} times`}
                    </div>
                  </button>
                  <div className="event-item-actions">
                    {event.status === "draft" ? (
                      <button className="btn btn-xs btn-primary" onClick={() => handleSetStatus(event.id, "open")}>
                        Abrir
                      </button>
                    ) : null}
                    {event.status === "open" ? (
                      <button className="btn btn-xs" onClick={() => handleSetStatus(event.id, "closed")}>
                        Encerrar
                      </button>
                    ) : null}
                    {event.status !== "draft" ? (
                      <button className="btn btn-xs btn-ghost" onClick={() => handleSetStatus(event.id, "draft")}>
                        Fechar acesso
                      </button>
                    ) : null}
                    <button
                      className="btn btn-xs btn-ghost btn-danger"
                      onClick={() =>
                        openDeleteConfirm({
                          eventId: event.id,
                          title: "Excluir evento",
                          body: "Todos os dados deste evento serao removidos. Para continuar, digite o codigo do evento como senha de seguranca.",
                          onConfirm: () => handleDeleteEvent(event.id),
                        })
                      }
                    >
                      Excluir
                    </button>
                  </div>
                  {facSelectedId === event.id ? (
                    <div className="event-item-details">
                      <div className="event-item-details-head">
                        <span className="mini-label">Detalhes do evento</span>
                        <button
                          className="btn btn-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(event.id);
                            showToast("Codigo copiado");
                          }}
                        >
                          Copiar codigo
                        </button>
                      </div>
                      <div className="event-item-detail-block">
                        <div className="mini-label">Codigo de acesso</div>
                        <div className="key-display">{event.id}</div>
                        <div className="form-hint">Times usam este codigo na tela "Sou time".</div>
                      </div>
                      <div className="event-item-detail-block">
                        <div className="mini-label">Resumo rapido</div>
                        <div className="muted-body">{event.desc || "Sem descricao cadastrada para este evento."}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              <button className="btn btn-add-full" onClick={() => setNewEventOpen(true)}>
                + Novo evento
              </button>
            </aside>

            <main className="fac-content">
              {!selectedEvent ? (
                <EmptyState icon="⬡" title="Nenhum evento selecionado" sub="Crie ou selecione um evento." />
              ) : (
                <>
                  <div className="tabs">
                    {["dashboard", "missoes"].map((tab) => (
                      <button
                        key={tab}
                        className={`tab${facTab === tab ? " active" : ""}`}
                        onClick={() => setFacTab(tab)}
                      >
                        {tab === "dashboard" ? "Dashboard" : "Missoes"}
                      </button>
                    ))}
                  </div>

                  {facTab === "dashboard" && renderDashboard(selectedEvent)}

                  {facTab === "missoes" && (
                    <>
                      <div className="section-header">
                        <span className="section-title">{selectedEvent.missions.length} missoes</span>
                        <button
                          className="btn btn-sm"
                          onClick={() => {
                            setCatalogSelection([]);
                            setCatalogOpen(true);
                          }}
                        >
                          + Adicionar do catalogo
                        </button>
                      </div>
                      {!selectedEvent.missions.length ? (
                        <div className="teams-empty">Nenhuma missao.</div>
                      ) : (
                        ["core", "pesquisa", "avancado", "recuperacao", "outro"].map((pack) => {
                          const missions = selectedEvent.missions
                            .map((mission, index) => ({ ...mission, _idx: index }))
                            .filter((mission) => (mission.pack || "outro") === pack);
                          if (!missions.length) return null;
                          return (
                            <div key={pack}>
                              <div className="pack-header">
                                <span>{PACK_LABELS[pack] || pack}</span>
                                <span className={`pack-badge pack-${pack}`}>{missions.length} missoes</span>
                              </div>
                              {missions.map((mission) => (
                                <div className="mission-row-wrap" key={`${mission.id}-${mission._idx}`}>
                                <div className="mission-row">
                                  <div className="mission-main">
                                    <div className="mission-row-header">
                                      <span className="mission-num">{mission.num || ""}</span>
                                      <span className="mname">{mission.name}</span>
                                      <span className={`mode-badge ${MODE_CLASS[mission.mode] || "mode-single"}`}>
                                        {MODE_LABELS[mission.mode] || mission.mode}
                                      </span>
                                    </div>
                                    <div className="mcat">{mission.category}</div>
                                    {mission.desc ? <div className="mdesc">{mission.desc}</div> : null}
                                    <div className="mission-inline-stats">
                                      <span>{getMissionReflections(selectedEvent, mission.id).length} feedback(s)</span>
                                      <span>
                                        {selectedEvent.teams.filter((_, teamIdx) => isConcluida(selectedEvent, teamIdx, mission.id)).length} time(s) concluiram
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mission-actions">
                                    <button
                                      className={`mission-toggle${mission.unlocked ? " is-on" : ""}`}
                                      onClick={() => handleToggleMission(selectedEvent.id, mission._idx, !mission.unlocked)}
                                    >
                                      <span className="mission-toggle-track">
                                        <span className="mission-toggle-thumb" />
                                      </span>
                                      <span className="mission-toggle-label">{mission.unlocked ? "Ligada" : "Desligada"}</span>
                                    </button>
                                    <div className="mission-overflow">
                                      <button
                                        className={`mission-overflow-trigger${missionMenuOpen === `${mission.id}-${mission._idx}` ? " is-open" : ""}`}
                                        onClick={() =>
                                          setMissionMenuOpen((current) =>
                                            current === `${mission.id}-${mission._idx}` ? null : `${mission.id}-${mission._idx}`,
                                          )
                                        }
                                        aria-label={`Abrir menu da missao ${mission.name}`}
                                      >
                                        ⋯
                                      </button>
                                      {missionMenuOpen === `${mission.id}-${mission._idx}` ? (
                                        <div className="mission-overflow-menu">
                                          <button
                                            className="mission-overflow-item mission-overflow-item-danger"
                                            onClick={() => {
                                              setMissionMenuOpen(null);
                                              openDeleteConfirm({
                                                eventId: selectedEvent.id,
                                                title: "Remover missao",
                                                body: `A missao "${mission.name}" sera removida do evento. Para continuar, digite o codigo do evento como senha de seguranca.`,
                                                onConfirm: () => handleRemoveMission(selectedEvent.id, mission._idx),
                                              });
                                            }}
                                          >
                                            Excluir missao
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                {getMissionReflections(selectedEvent, mission.id).length ? (
                                  <div className="mission-feedback-list">
                                    {getMissionReflections(selectedEvent, mission.id).map((reflection) => (
                                      <div className="mission-feedback-card" key={`${reflection.teamIdx}-${reflection.submittedAt || reflection.ts}`}>
                                        <div className="mission-feedback-head">
                                          <div className="mission-feedback-team">{selectedEvent.teams[reflection.teamIdx]?.name || `Time ${reflection.teamIdx + 1}`}</div>
                                          <div className="mission-feedback-meta">{formatDateTime(reflection.submittedAt || reflection.ts)}</div>
                                        </div>
                                        <div className="mission-feedback-scores is-inline">
                                          {Object.entries(reflection.respostas || {}).map(([key, value]) => (
                                            <span className="mission-feedback-chip is-rating" key={key}>
                                              <strong>{getReflectionTopicShortLabel(key)}</strong>
                                              <span className="mission-feedback-stars" aria-label={`${value} de 5`}>
                                                {[1, 2, 3, 4, 5].map((score) => (
                                                  <span className="star" key={score}>
                                                    {score <= value ? "★" : "☆"}
                                                  </span>
                                                ))}
                                              </span>
                                            </span>
                                          ))}
                                        </div>
                                        {reflection.comment ? <div className="mission-feedback-comment">{reflection.comment}</div> : null}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                                </div>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </>
                  )}

                </>
              )}
            </main>
          </div>
        </div>
      )}

      {screen === "entry" && (
        <div className="screen active">
          <Topbar
            onLogoClick={goHome}
            right={
              <>
                {devQuickSwitch}
                <button className="btn btn-ghost btn-sm" onClick={goHome}>Inicio</button>
              </>
            }
          />
          <div className="center-wrap">
            <div className="center-box">
              <div className="center-box-title">Entrar na aula</div>
              <div className="center-box-sub">Informe o codigo do evento para acessar seu workspace.</div>
              <div className="card">
                <div className="form-group">
                  <label className="form-label">Codigo do evento</label>
                  <input type="text" value={entryCode} onChange={(event) => setEntryCode(event.target.value)} placeholder="ev_..." />
                </div>
                {entryError ? <div className="error-box">{entryError}</div> : null}
                <button className="btn btn-primary btn-full" onClick={handleEntrarEvento}>
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "team" && teamEvent && (
        <div className="screen active">
          <Topbar
            onLogoClick={goHome}
            right={
              <>
                {devQuickSwitch}
                <span className="topbar-caption">{teamEvent.name}</span>
                <button className="btn btn-ghost btn-sm" onClick={goEntradaTime}>
                  Trocar evento
                </button>
              </>
            }
          />
          <div className="center-wrap">
            <div className="center-box">
              <div className="center-box-title">Escolha seu time</div>
              <div className="center-box-sub">Selecione o time em que voce esta participando.</div>
              <div className="teams-list">
                {!teamEvent.teams.length ? (
                  <div className="empty-list-text">Nenhum time cadastrado ainda.</div>
                ) : (
                  teamEvent.teams.map((teamItem, index) => (
                    <button className="team-option" key={`${teamItem.name}-${index}`} onClick={() => handleEscolherTime(index)}>
                      <div className="team-option-avatar">{initials(teamItem.name)}</div>
                      <div>
                        <div className="team-option-name">{teamItem.name}</div>
                        <div className="team-option-runs">{teamItem.runs || 0} execucoes</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "workspace" && teamEvent && team && (
        <div className="screen active">
          <Topbar
            onLogoClick={goHome}
            right={
              <>
                <span className="topbar-caption soft">{teamEvent.name}</span>
                <span className="team-badge">{team.name}</span>
                {currentMission && !teamEventScreenShare?.active ? (
                  <button className="btn btn-sm topbar-help-btn" onClick={handleOpenHelp}>
                    {currentOpenHelpRequest ? "Ajuda enviada" : "Pedir ajuda"}
                    {currentOpenHelpCount ? <span className="help-trigger-badge">{currentOpenHelpCount}</span> : null}
                  </button>
                ) : null}
              </>
            }
          />
          {devQuickSwitch ? <div className="dev-toolbar-shell">{devQuickSwitch}</div> : null}
          {!apiConfigured && <div className="demo-banner">Modo demonstracao - sem chave OpenAI. Respostas sao simuladas.</div>}
          {teamEventScreenShare?.active ? (
            <div className="live-share-banner">
              Compartilhamento de tela ao vivo. O facilitador esta projetando a propria tela.
            </div>
          ) : null}
          <div className={`workspace${teamEventScreenShare?.active ? " workspace-live-focus" : ""}`}>
            {!teamEventScreenShare?.active ? (
              <aside className="ws-sidebar">
                <div className="ws-sidebar-label">Missoes</div>
                {!teamEvent.missions.length ? (
                  <div className="empty-list-text">Nenhuma missao disponivel.</div>
                ) : (
                  ["core", "pesquisa", "avancado", "recuperacao", "outro"].map((pack) => {
                    const missions = teamEvent.missions
                      .map((mission, index) => ({ ...mission, _idx: index }))
                      .filter((mission) => (mission.pack || "outro") === pack);
                    if (!missions.length) return null;
                    return (
                      <div key={pack}>
                        <div className="ws-pack-label">{PACK_LABELS[pack] || pack}</div>
                        {missions.map((mission) => {
                          const locked = !mission.unlocked;
                          const concluida = isConcluida(teamEvent, timeTeamIdx, mission.id);
                          const execs = getExecucoes(teamEvent, timeTeamIdx, mission.id);
                          const meta = concluida ? "concluida" : locked ? "bloqueada" : execs.length ? `${execs.length} exec.` : "liberada";
                          return (
                            <button
                              key={`${mission.id}-${mission._idx}`}
                              className={`mission-item${timeMissionIdx === mission._idx ? " active" : ""}${locked ? " locked" : ""}${concluida ? " done" : ""}`}
                              disabled={locked}
                              onClick={() => handleSelectMission(mission._idx)}
                              title={locked ? "Bloqueada pelo facilitador" : ""}
                            >
                              <div className="mission-item-name">
                                {mission.num ? `${mission.num}. ` : ""}
                                {mission.name}
                              </div>
                              <div className="mission-item-meta">{meta}</div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
                <div className="polling-indicator">
                  <span className="poll-dot" /> atualizando
                </div>
              </aside>
            ) : null}

            <main className={`ws-content${teamEventScreenShare?.active ? " ws-content-live" : ""}`}>
              {teamEventScreenShare?.active ? (
                <TeamScreenShareViewer
                  event={teamEvent}
                  screenShare={teamEventScreenShare}
                  team={team}
                />
              ) : !currentMission ? (
                <EmptyState icon="◎" title="Nenhuma missao selecionada" sub="Selecione uma missao liberada na barra lateral." />
              ) : (
                <>
                  <div className="enunciado">
                    <div className="enunciado-header">
                      <div className="enunciado-head-main">
                        <span className="mission-head-num">{currentMission.num}.</span>
                        <div className="enunciado-title">{currentMission.name}</div>
                        <span className={`mode-badge ${MODE_CLASS[currentMission.mode] || "mode-single"}`}>
                          {MODE_LABELS[currentMission.mode] || currentMission.mode}
                        </span>
                      </div>
                      <span className="mission-category">{currentMission.category}</span>
                    </div>
                    <div className="enunciado-body">
                      <div className="situacao-box">
                        <strong className="block-legend">Situacao</strong>
                        {currentMission.situacao || currentMission.desc}
                      </div>
                      <div className="instrucao-box">
                        <strong className="block-legend">O que fazer</strong>
                        {currentMission.instrucao || "Escreva o input abaixo e escolha a acao."}
                      </div>
                    </div>
                  </div>

                  {currentConcluida ? (
                    <div className="done-overlay">
                      Missao concluida pelo seu time.
                      <br />
                      <span className="done-sub">Aguarde a proxima missao ser liberada pelo facilitador.</span>
                    </div>
                  ) : !readingStage ? (
                    <div className="input-card">
                      {hasMissionHistory ? (
                        <div className="input-card-toolbar">
                          <button
                            className="btn btn-sm btn-ghost btn-danger"
                            onClick={() =>
                              openConfirm(
                                "Reabrir missao do zero",
                                "Isso vai apagar respostas, explicacoes, historico, questionario e status de concluida desta missao para o time atual. Os tokens consumidos permanecerao no acumulado historico. Deseja continuar?",
                                handleResetMissionFromZero,
                              )
                            }
                          >
                            Reabrir missao do zero
                          </button>
                        </div>
                      ) : null}
                      <div className="input-section-label">Acao</div>
                      <div className="acao-selector">
                        {[...(currentMission.acoes || []), FREE_ACTION_KEY].map((acao) => (
                          <button
                            key={acao}
                            className={`acao-btn${selectedAcoes[timeMissionIdx] === acao ? " selected" : ""}`}
                            onClick={() => setSelectedAcoes((current) => ({ ...current, [timeMissionIdx]: acao }))}
                          >
                            {getActionLabel(acao)}
                          </button>
                        ))}
                      </div>
                      {isFreeInstructionAction(selectedAcoes[timeMissionIdx]) ? (
                        <div className="input-hint free-instruction-hint">
                          Nesta rodada, a IA vai seguir a sua instrucao diretamente, mas ainda dentro do contexto desta missao.
                        </div>
                      ) : null}
                      <div className="input-section-label top-gap">Seu input</div>
                      {currentMission.placeholder ? (
                        <div className="input-hint">Exemplo: {currentMission.placeholder.split("\n")[0]}...</div>
                      ) : null}
                      <textarea
                        value={missionInput}
                        onChange={(event) => setMissionInput(event.target.value)}
                        placeholder={currentMission.placeholder || "Escreva aqui..."}
                      />
                      {runError ? <div className="error-box top-gap-sm">{runError}</div> : null}
                      <div className="input-actions">
                        <button className="btn btn-primary" disabled={running} onClick={handleExecutarMissao}>
                          {running ? "Executando..." : "Executar com IA"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="reading-placeholder">
                      <div className="reading-placeholder-title">Leitura da rodada em andamento</div>
                      <div className="reading-placeholder-text">
                        Use o painel abaixo para ler a resposta e a explicacao tecnica desta iteracao.
                      </div>
                    </div>
                  )}

                  {readingStage && missionFlow.exec ? (
                    <MissionReadingPanel
                      exec={missionFlow.exec}
                      stage={missionFlow.stage}
                      onAdvance={() =>
                        setMissionFlow((current) => ({
                          ...current,
                          stage: current.stage === "resposta_aberta" ? "cot_aberto" : "decisao_iteracao",
                        }))
                      }
                    />
                  ) : null}

                  {currentExecs.length > 0 ? (
                    <HistorySection execs={currentExecs} open={historyOpen} onToggle={() => setHistoryOpen((current) => !current)} />
                  ) : null}

                  {currentConcluida && currentReflexao ? <ReflectionSummary reflexao={currentReflexao} /> : null}
                </>
              )}
            </main>
            {currentMission && !teamEventScreenShare?.active ? (
              <MissionTokenRail
                execs={currentExecs}
                runState={runState}
                flowStage={missionFlow.stage}
                model={store.model}
                preservedUsage={preservedUsage}
              />
            ) : null}
          </div>
        </div>
      )}

      <Modal open={newEventOpen} onClose={() => setNewEventOpen(false)}>
        <div className="modal-title">Criar novo evento</div>
        <div className="form-group">
          <label className="form-label">Nome *</label>
          <input
            type="text"
            value={newEventForm.name}
            onChange={(event) => setNewEventForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ex: Turma A - Maio 2026"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Descricao</label>
          <input
            type="text"
            value={newEventForm.desc}
            onChange={(event) => setNewEventForm((current) => ({ ...current, desc: event.target.value }))}
            placeholder="Ex: Aula de IA generativa"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Times (separados por virgula)</label>
          <input
            type="text"
            value={newEventForm.teams}
            onChange={(event) => setNewEventForm((current) => ({ ...current, teams: event.target.value }))}
            placeholder="Ex: Alpha, Beta, Gamma"
          />
          <div className="form-hint">Voce pode adicionar times depois.</div>
        </div>
        <div className="form-group">
          <label className="form-label">Pack de missoes</label>
          <select value={newEventForm.pack} onChange={(event) => setNewEventForm((current) => ({ ...current, pack: event.target.value }))}>
            <option value="core">Core</option>
            <option value="pesquisa">Pesquisa</option>
            <option value="avancado">Avancado</option>
            <option value="recuperacao">Recuperacao</option>
            <option value="todos">Todos</option>
            <option value="nenhum">Nenhum</option>
          </select>
          <div className="form-hint">Missoes entram bloqueadas. Voce libera na hora certa.</div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={() => setNewEventOpen(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleCreateEvent}>
            Criar
          </button>
        </div>
      </Modal>

      <Modal open={addTeamOpen} onClose={() => setAddTeamOpen(false)}>
        <div className="modal-title">Adicionar time</div>
        <div className="form-group">
          <label className="form-label">Nome *</label>
          <input type="text" value={newTeamName} onChange={(event) => setNewTeamName(event.target.value)} placeholder="Ex: Zeta" />
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={() => setAddTeamOpen(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleAddTeam}>
            Adicionar
          </button>
        </div>
      </Modal>

      <Modal open={configOpen} onClose={() => setConfigOpen(false)}>
        <div className="modal-title">Configuracao da IA</div>
        <div className="notice">
          {serverConfig.deploymentTarget === "vercel"
            ? serverConfig.openaiConfigured
              ? "Ha uma chave OpenAI ativa neste deploy. No Vercel, ela vem das variaveis do projeto."
              : "No Vercel, configure OPENAI_API_KEY nas variaveis do projeto para ativar a IA."
            : serverConfig.openaiConfigured
              ? `Ha uma chave persistente ativa no servidor local (${serverConfig.openaiSource === "env" ? "vinda do .env" : "salva neste projeto"}).`
              : "Se voce salvar uma chave aqui, ela fica persistente no servidor local deste projeto e nao depende da porta do navegador."}
        </div>
        <div className="form-group">
          <label className="form-label">Chave OpenAI</label>
          <input
            type="password"
            value={configForm.apiKey}
            onChange={(event) => setConfigForm((current) => ({ ...current, apiKey: event.target.value }))}
            placeholder={
              serverConfig.deploymentTarget === "vercel"
                ? "Em producao, prefira configurar OPENAI_API_KEY no Vercel"
                : serverConfig.openaiConfigured
                  ? "Cole uma nova chave para substituir a atual"
                  : "sk-..."
            }
          />
        </div>
        <div className="form-group">
          <label className="form-label">Modelo padrao</label>
          <select value={configForm.model} onChange={(event) => setConfigForm((current) => ({ ...current, model: event.target.value }))}>
            {MODEL_OPTIONS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          {serverConfig.deploymentTarget !== "vercel" ? (
            <button className="btn btn-ghost btn-danger" onClick={handleRemoveKey}>
              Remover chave
            </button>
          ) : null}
          <button className="btn" onClick={() => setConfigOpen(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSaveConfig}>
            Salvar
          </button>
        </div>
      </Modal>

      <Modal open={catalogOpen} onClose={() => setCatalogOpen(false)}>
        <div className="modal-title">Adicionar do catalogo</div>
        <div className="modal-sub">Selecione as missoes para adicionar (bloqueadas por padrao).</div>
        {!availableCatalog.length ? (
          <div className="teams-empty">Todas as missoes ja estao no evento.</div>
        ) : (
          ["core", "pesquisa", "avancado", "recuperacao"].map((pack) => {
            const missions = availableCatalog.filter((mission) => mission.pack === pack);
            if (!missions.length) return null;
            return (
              <div key={pack}>
                <div className="pack-header">
                  <span>{PACK_LABELS[pack]}</span>
                </div>
                {missions.map((mission) => (
                  <label className="catalog-row" key={mission.id}>
                    <input
                      type="checkbox"
                      checked={catalogSelection.includes(mission.id)}
                      onChange={(event) =>
                        setCatalogSelection((current) =>
                          event.target.checked ? [...current, mission.id] : current.filter((item) => item !== mission.id),
                        )
                      }
                    />
                    <div>
                      <div className="catalog-title-row">
                        <span className="catalog-name">
                          {mission.num}. {mission.name}
                        </span>
                        <span className={`mode-badge ${MODE_CLASS[mission.mode] || "mode-single"}`}>
                          {MODE_LABELS[mission.mode] || mission.mode}
                        </span>
                      </div>
                      <div className="catalog-desc">{mission.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            );
          })
        )}
        <div className="modal-actions">
          <button className="btn" onClick={() => setCatalogOpen(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleAddCatalogMissions}>
            Adicionar selecionadas
          </button>
        </div>
      </Modal>

      <Modal open={missionFlow.stage === "executando"} onClose={() => {}} dismissible={false}>
        <div className="modal-title">IA respondendo</div>
        <div className="modal-sub">
          {runState?.simulationMode === "openai-live"
            ? "Sua solicitacao esta sendo enviada para a OpenAI agora."
            : "A simulacao local esta reproduzindo o comportamento de uma chamada real ao modelo."}
        </div>
        {runState ? <LiveRunCard runState={runState} /> : null}
      </Modal>

      <Modal open={missionFlow.stage === "decisao_iteracao"} onClose={() => {}} small dismissible={false}>
        <div className="modal-title">Nova interacao?</div>
        <div className="confirm-body">Quer fazer uma nova interacao nesta mesma missao antes de encerrar?</div>
        <div className="modal-actions">
          <button className="btn" onClick={() => setMissionFlow((current) => ({ ...current, stage: "idle" }))}>
            Sim, quero iterar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setReflectionAnswers({});
              setReflectionComment("");
              setMissionFlow((current) => ({ ...current, stage: "questionario_final" }));
            }}
          >
            Nao, encerrar
          </button>
        </div>
      </Modal>

      <Modal open={missionFlow.stage === "questionario_final"} onClose={() => {}} dismissible={false}>
        <div className="modal-title">Concluir missao</div>
        <div className="modal-sub">Voce decidiu encerrar as iteracoes. Responda as 4 perguntas para fechar a atividade do time.</div>
        {PERGUNTAS_REFLEXAO.map((question) => (
          <div className="reflexao-question" key={question.id}>
            <div className="reflexao-q-text">{question.texto}</div>
            <div className="scale-row">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  className={`scale-btn${reflectionAnswers[question.id] === score ? " selected" : ""}`}
                  onClick={() => setReflectionAnswers((current) => ({ ...current, [question.id]: score }))}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="scale-labels">
              <span>{question.min}</span>
              <span>{question.max}</span>
            </div>
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">Observacao geral</label>
          <textarea
            value={reflectionComment}
            onChange={(event) => setReflectionComment(event.target.value)}
            placeholder="Opcional: registre uma observacao geral sobre a missao, a resposta da IA ou o que o time aprendeu."
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-green" onClick={handleSaveReflection}>
            Enviar reflexao
          </button>
        </div>
      </Modal>

      <Modal open={missionFlow.stage === "concluida"} onClose={() => setMissionFlow({ stage: "idle", exec: null })} small dismissible={false}>
        <div className="modal-title">Missao concluida</div>
        <div className="confirm-body">Questionario enviado. Esta missao foi encerrada para o time atual.</div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => setMissionFlow({ stage: "idle", exec: null })}>
            Fechar
          </button>
        </div>
      </Modal>

      <Modal open={confirmState.open} onClose={closeConfirm} small>
        <div className="modal-title">{confirmState.title}</div>
        <div className="confirm-body">{confirmState.body}</div>
        {confirmState.requiresPassword ? (
          <div className="form-group top-gap-sm">
            <label className="form-label">{confirmState.confirmLabel}</label>
            <input
              type="password"
              value={confirmInput}
              onChange={(event) => setConfirmInput(event.target.value)}
              placeholder={confirmState.confirmPlaceholder}
            />
            <div className="form-hint">Digite exatamente o codigo do evento para liberar esta exclusao.</div>
          </div>
        ) : null}
        <div className="modal-actions">
          <button className="btn" onClick={closeConfirm}>
            Cancelar
          </button>
          <button
            className="btn btn-primary btn-danger"
            disabled={confirmState.requiresPassword && confirmInput.trim() !== confirmState.confirmValue}
            onClick={() => {
              confirmState.onConfirm?.();
              closeConfirm();
            }}
          >
            Confirmar
          </button>
        </div>
      </Modal>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} small>
        <div className="modal-title">Pedir ajuda ao facilitador</div>
        <div className="modal-sub">
          {currentOpenHelpRequest
            ? "Seu pedido ja foi enviado. Voce pode revisar a mensagem ou cancelar se nao precisar mais de ajuda."
            : "O facilitador vai receber este pedido junto com o contexto da missao e do seu time."}
        </div>
        <div className="form-group">
          <label className="form-label">Mensagem curta</label>
          <textarea
            value={helpMessage}
            onChange={(event) => setHelpMessage(event.target.value)}
            placeholder="Ex: Estamos travados para escolher a melhor acao e validar a resposta."
            disabled={Boolean(currentOpenHelpRequest)}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setHelpOpen(false)}>
            Fechar
          </button>
          {currentOpenHelpRequest ? (
            <button className="btn btn-primary btn-danger" onClick={() => handleCancelHelpRequest(teamEvent.id, currentOpenHelpRequest.id)}>
              Cancelar pedido
            </button>
          ) : (
            <button className="btn btn-primary" disabled={!helpMessage.trim()} onClick={handleSendHelpRequest}>
              Enviar ajuda
            </button>
          )}
        </div>
      </Modal>

      <div className={`toast${toastText ? " show" : ""}`}>{toastText}</div>
    </>
  );
}

function Topbar({ onLogoClick, right, roleBadge }) {
  return (
    <div className="topbar">
      <button className="logo" onClick={onLogoClick}>
        <div className="logo-icon">⬡</div>
        Tech Hall AI Lab
        {roleBadge ? <span className="badge-role">{roleBadge}</span> : null}
      </button>
      <div className="topbar-right">{right}</div>
    </div>
  );
}

function DevQuickSwitch({
  events,
  currentEventId,
  currentTeamIdx,
  currentScreen,
  selectedEvent,
  onPickEvent,
  onPickTeam,
  onOpenFacilitador,
  onOpenEntrada,
  onOpenTeamSelection,
  onOpenWorkspace,
}) {
  return (
    <div className="dev-switch">
      <span className="dev-switch-label">Dev</span>
      <select value={currentEventId} onChange={(event) => onPickEvent(event.target.value)}>
        <option value="">Evento</option>
        {events.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <select
        value={currentTeamIdx}
        onChange={(event) => onPickTeam(event.target.value)}
        disabled={!selectedEvent?.teams?.length}
      >
        <option value="">Time</option>
        {(selectedEvent?.teams || []).map((teamItem, index) => (
          <option key={`${teamItem.name}-${index}`} value={index}>
            {teamItem.name}
          </option>
        ))}
      </select>
      <div className="dev-switch-actions">
        <button className={`dev-chip${currentScreen === "facilitador" ? " active" : ""}`} onClick={onOpenFacilitador}>
          Fac
        </button>
        <button className={`dev-chip${currentScreen === "entry" ? " active" : ""}`} onClick={onOpenEntrada}>
          Codigo
        </button>
        <button className={`dev-chip${currentScreen === "team" ? " active" : ""}`} onClick={onOpenTeamSelection}>
          Times
        </button>
        <button className={`dev-chip${currentScreen === "workspace" ? " active" : ""}`} onClick={onOpenWorkspace}>
          WS
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-sub">{sub}</div>
    </div>
  );
}

function ProcessingPipeline({ processingSteps }) {
  return (
    <div className="processing-pipeline">
      {processingSteps.map((step) => (
        <div className={`processing-step ${step.status}`} key={step.key}>
          <span className="processing-dot" />
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

function TransparencyPanel({ exec, open, onToggle, forceOpen = false }) {
  const details = exec.reasoningDetails || null;
  const promptText = exec.promptApplied || details?.promptApplied || exec.acao || "Sem acao";

  if (!details && !exec.explicacao) return null;

  return (
    <div className="explain-section">
      {!forceOpen ? (
        <button className="explain-toggle" onClick={onToggle}>
          Como a IA pensou esta missao {open ? "▴" : "▾"}
        </button>
      ) : null}
      {open ? (
        <div className="explain-body open">
          {details?.sourceLabel ? (
            <div className="source-chip">{details.sourceLabel}</div>
          ) : null}
          {details?.historySignal || exec.historySignal ? (
            <div className="context-banner">{details?.historySignal || exec.historySignal}</div>
          ) : null}
          <div>
            <div className="explain-block-label">Como a IA operou aqui</div>
            <div className="explain-block-text">{details?.mechanismSummary || details?.summary || exec.reasoningSummary || exec.explicacao}</div>
          </div>
          {details?.technicalTerms?.length ? (
            <div>
              <div className="explain-block-label">Termos tecnicos usados</div>
              <div className="concept-pill-row">
                {details.technicalTerms.map((item, index) => (
                  <span className="concept-pill" key={`${item.term}-${index}`}>
                    {item.term}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <div className="explain-block-label">Por que saiu essa resposta</div>
            <div className="explain-block-text">{details?.whyThisAnswer || details?.strategy || exec.explicacao}</div>
          </div>
          <div>
            <div className="explain-block-label">O que guiou a selecao</div>
            <div className="explain-block-text">{details?.selectionLogic || details?.actionInfluence || exec.acao || "Sem acao."}</div>
          </div>
          {details?.alternativeAnswerPaths?.length ? (
            <div>
              <div className="explain-block-label">Outras respostas plausiveis</div>
              <div className="takeaway-list">
                {details.alternativeAnswerPaths.map((item, index) => (
                  <div className="takeaway-item" key={`${item}-${index}`}>
                    <span className="takeaway-bullet">{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {details?.howToAskBetter?.length ? (
            <div>
              <div className="explain-block-label">Como pedir melhor</div>
              <div className="takeaway-list">
                {details.howToAskBetter.map((item, index) => (
                  <div className="takeaway-item" key={`${item}-${index}`}>
                    <span className="takeaway-bullet">{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <div className="explain-block-label">Limites e suposicoes</div>
            <div className="explain-block-text">{details?.limitations || "Sem observacoes adicionais."}</div>
          </div>
          <div>
            <div className="explain-block-label">Prompt aplicado</div>
            <div className="prompt-preview">{promptText}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LiveRunCard({ runState }) {
  return (
    <div className="output-card live-run-card">
      <div className="output-header">
        <div className="output-label">{runState.simulationMode === "openai-live" ? "OpenAI em execucao" : "IA simulada em execucao"}</div>
        <span className="muted-mini">
          {runState.simulationMode === "openai-live" ? "chamada real em andamento" : "simulacao local com streaming"}
        </span>
      </div>
      <div className="output-body">
        <ProcessingPipeline processingSteps={runState.processingSteps} />
        {runState.usedHistory ? <div className="context-banner">Esta nova resposta esta considerando o historico anterior desta missao.</div> : null}
        <div className="output-text output-text-live">
          {runState.displayedOutput || (runState.simulationMode === "openai-live" ? "Aguardando retorno da OpenAI..." : "Preparando resposta da IA...")}
          <span className="streaming-cursor" />
        </div>
      </div>
    </div>
  );
}

function GuidedSection({ label, children }) {
  return (
    <div className="guided-section">
      <div className="guided-section-label">{label}</div>
      <div className="guided-section-body">{children}</div>
    </div>
  );
}

function LearningSlide({ index, kicker, title, subtitle, accent = "blue", children }) {
  return (
    <article className={`learning-slide learning-slide-${accent}`}>
      <div className="learning-slide-head">
        <div className="learning-slide-index">{String(index).padStart(2, "0")}</div>
        <div className="learning-slide-meta">
          <div className="learning-slide-kicker">{kicker}</div>
          <div className="learning-slide-title">{title}</div>
          {subtitle ? <div className="learning-slide-subtitle">{subtitle}</div> : null}
        </div>
      </div>
      <div className="learning-slide-body">{children}</div>
    </article>
  );
}

function MissionReadingPanel({ exec, stage, onAdvance }) {
  const isResponse = stage === "resposta_aberta";

  return (
    <section className="reading-panel">
      <div className="reading-panel-header">
        <div>
          <div className="reading-panel-kicker">Rodada {exec.iterationNumber || "-"}</div>
          <div className="reading-panel-title">{isResponse ? "Resposta da IA" : "Como a IA pensou esta missao"}</div>
          <div className="reading-panel-sub">
            {isResponse
              ? "Leia a resposta com calma antes de abrir a explicacao tecnica."
              : "Leitura guiada dos conceitos, da estrategia aplicada e dos limites desta resposta."}
          </div>
        </div>
        <button className="btn btn-primary" onClick={onAdvance}>
          {isResponse ? "Abrir explicacao tecnica" : "Continuar"}
        </button>
      </div>

      {isResponse ? (
        <div className="reading-panel-body">
          <OutputCard exec={exec} compact />
        </div>
      ) : (
        <div className="reading-panel-body">
          <GuidedReading exec={exec} />
        </div>
      )}
    </section>
  );
}

function GuidedReading({ exec }) {
  const details = exec.reasoningDetails || {};
  let slideIndex = 1;
  const nextSlide = () => slideIndex++;

  return (
    <div className="guided-reading guided-reading-deck">
      <LearningSlide
        index={nextSlide()}
        kicker="Slide 1"
        title="Como a IA operou aqui"
        subtitle="Engenharia reversa do mecanismo que transformou o pedido nesta resposta."
      >
        {details.sourceLabel ? <div className="source-chip">{details.sourceLabel}</div> : null}
        {details.historySignal || exec.historySignal ? (
          <div className="context-banner">{details.historySignal || exec.historySignal}</div>
        ) : null}
        <div className="slide-lead">{details.mechanismSummary || details.summary || exec.reasoningSummary || exec.explicacao}</div>
        <div className="two-col-guided">
          <GuidedSection label="Logica de selecao">
            <div className="explain-block-text">{details.selectionLogic || details.strategy || exec.explicacao}</div>
          </GuidedSection>
          <GuidedSection label="Input considerado">
            <div className="explain-block-text">{details.consideredInput || exec.input}</div>
          </GuidedSection>
        </div>
        {details.technicalTerms?.length ? (
          <div className="takeaway-list">
            {details.technicalTerms.map((item, index) => (
              <div className="takeaway-item" key={`${item.term}-${index}`}>
                <span className="takeaway-bullet">{index + 1}</span>
                <span>
                  <strong>{item.term}:</strong> {item.meaning}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </LearningSlide>

      <LearningSlide
        index={nextSlide()}
        kicker="Slide 2"
        title="Por que saiu isso e nao outra coisa"
        subtitle="Aqui o foco e mostrar por que a IA privilegiou esse caminho de resposta."
        accent="amber"
      >
        <GuidedSection label="Por que essa saida aconteceu">
          <div className="explain-block-text">{details.whyThisAnswer || details.strategy || exec.explicacao}</div>
        </GuidedSection>
        <div className="two-col-guided">
          <GuidedSection label="Influencia da acao ou instrucao">
            <div className="explain-block-text">{details.actionInfluence || exec.acao || "Sem acao."}</div>
          </GuidedSection>
          <GuidedSection label="Limite ou trade-off">
            <div className="explain-block-text">{details.limitations || "Sem observacoes adicionais."}</div>
          </GuidedSection>
        </div>
        {details.alternativeAnswerPaths?.length ? (
          <GuidedSection label="Outras respostas plausiveis">
            <div className="takeaway-list">
              {details.alternativeAnswerPaths.map((item, index) => (
                <div className="takeaway-item" key={`${item}-${index}`}>
                  <span className="takeaway-bullet">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </GuidedSection>
        ) : null}
      </LearningSlide>

      <LearningSlide
        index={nextSlide()}
        kicker="Slide 3"
        title="Como perguntar melhor e extrair variacoes"
        subtitle="Este slide transforma a devolutiva em boa pratica operacional."
        accent="green"
      >
        {details.howToAskBetter?.length ? (
          <GuidedSection label="Como pedir outras versoes">
            <div className="takeaway-list">
              {details.howToAskBetter.map((item, index) => (
                <div className="takeaway-item" key={`${item}-${index}`}>
                  <span className="takeaway-bullet">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </GuidedSection>
        ) : null}
        {details.bestPractices?.length ? (
          <GuidedSection label="Boas praticas">
            <div className="takeaway-list">
              {details.bestPractices.map((item, index) => (
                <div className="takeaway-item" key={`${item}-${index}`}>
                  <span className="takeaway-bullet">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </GuidedSection>
        ) : null}
        <GuidedSection label="Prompt aplicado">
          <div className="prompt-preview">{exec.promptApplied || details.promptApplied || exec.acao || "Sem acao"}</div>
        </GuidedSection>
      </LearningSlide>
    </div>
  );
}

function OutputCard({ exec, compact = false }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`output-card${compact ? " output-card-compact" : ""}`}>
      <div className="output-header">
        <div className="output-label">{compact ? "Resposta desta rodada" : "Ultima resposta"}</div>
        <span className="muted-mini">
          {exec.acao || "-"} · {exec.tokens?.toLocaleString() || 0} tokens
        </span>
      </div>
      <div className="output-body">
        {exec.processingSteps?.length ? <ProcessingPipeline processingSteps={exec.processingSteps} /> : null}
        {exec.historySignal ? <div className="context-banner">{exec.historySignal}</div> : null}
        <div className="output-text">{exec.output}</div>
      </div>
      {!compact ? <TransparencyPanel exec={exec} open={open} onToggle={() => setOpen((value) => !value)} /> : null}
    </div>
  );
}

function MissionTokenRail({ execs, runState, flowStage, model, preservedUsage }) {
  const totals = execs.reduce(
    (acc, exec) => ({
      total: acc.total + (exec.tokens || 0),
      input: acc.input + (exec.inputTokens || 0),
      output: acc.output + (exec.outputTokens || 0),
      cost: acc.cost + (exec.custo || 0),
    }),
    { total: 0, input: 0, output: 0, cost: 0 },
  );
  const liveOutput = runState?.displayedOutput || "";
  const liveOutputTokens = liveOutput ? Math.max(0, Math.round(liveOutput.length / 3.8)) : 0;
  const currentRun = runState
    ? {
        input: runState.inputTokens || 0,
        output: runState.outputTokens || liveOutputTokens,
        total: (runState.inputTokens || 0) + (runState.outputTokens || liveOutputTokens),
        cost: runState.custo || 0,
      }
    : execs.length
      ? {
          input: execs[execs.length - 1].inputTokens || 0,
          output: execs[execs.length - 1].outputTokens || 0,
          total: execs[execs.length - 1].tokens || 0,
          cost: execs[execs.length - 1].custo || 0,
        }
      : { input: 0, output: 0, total: 0, cost: 0 };
  const combinedTotals = {
    total: totals.total + (preservedUsage?.total || 0),
    input: totals.input + (preservedUsage?.input || 0),
    output: totals.output + (preservedUsage?.output || 0),
    cost: totals.cost + (preservedUsage?.cost || 0),
  };

  return (
    <aside className="token-rail">
      <div className="tokens-panel token-rail-panel">
        <div className="tokens-panel-header">
          <div className="tokens-panel-title">Uso de tokens</div>
          <div className="muted-mini">{execs.length} execucoes</div>
        </div>
        <div className="token-rail-status">
          <div className="token-rail-stage">{flowStage.replaceAll("_", " ")}</div>
          <div className="token-rail-model">{model}</div>
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Totais acumulados</div>
          <div className="token-rail-summary">
            <div className="token-summary-item token-summary-primary">
              <span>Total</span>
              <strong>{combinedTotals.total.toLocaleString()} tok</strong>
            </div>
            <div className="token-summary-item">
              <span>Input</span>
              <strong>{combinedTotals.input.toLocaleString()}</strong>
            </div>
            <div className="token-summary-item">
              <span>Output</span>
              <strong>{combinedTotals.output.toLocaleString()}</strong>
            </div>
            <div className="token-summary-item token-summary-cost">
              <span>Custo</span>
              <strong>${combinedTotals.cost.toFixed(4)}</strong>
            </div>
          </div>
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Log de execucoes</div>
          {execs.length ? (
            <div className="token-log-list">
              {[...execs].reverse().map((exec, index) => (
                <div className="token-log-item" key={exec.id || `${exec.ts}-${index}`}>
                  <div className="token-log-head">
                    <strong>Rodada {exec.iterationNumber || execs.length - index}</strong>
                    <span>{exec.isFreeInstruction ? "Instrucao livre" : getActionLabel(exec.acao)}</span>
                  </div>
                  <div className="token-log-meta">
                    <span>{(exec.tokens || 0).toLocaleString()} tok</span>
                    <span>in {((exec.inputTokens || 0)).toLocaleString()}</span>
                    <span>out {((exec.outputTokens || 0)).toLocaleString()}</span>
                    <span>${(exec.custo || 0).toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted-body">Nenhuma execucao ainda.</div>
          )}
        </div>
      </div>
    </aside>
  );
}

function HistorySection({ execs, open, onToggle }) {
  const [openItems, setOpenItems] = useState({});

  return (
    <div className="history-section">
      <button className="history-toggle" onClick={onToggle}>
        <span>Ver historico da missao ({execs.length} execucoes)</span>
        <span>{open ? "▴" : "▾"}</span>
      </button>
      {open ? [...execs].reverse().map((exec, index) => {
        const key = exec.id || `${exec.ts}-${index}`;
        const itemOpen = openItems[key];
        return (
          <div className="history-item" key={key}>
            <button className="history-item-header" onClick={() => setOpenItems((current) => ({ ...current, [key]: !itemOpen }))}>
              <span>
                Execucao {execs.length - index} · {exec.isFreeInstruction ? "Instrucao livre" : getActionLabel(exec.acao)} · {(exec.tokens || 0).toLocaleString()} tokens · $
                {(exec.custo || 0).toFixed(4)}
              </span>
              <span>{itemOpen ? "▴" : "▾"}</span>
            </button>
            {itemOpen ? (
              <div className="history-item-body open">
                <div className="mini-label">Input</div>
                <div className="history-text muted-body">{exec.input}</div>
                <div className="mini-label">Resposta</div>
                <div className="history-text">{exec.output}</div>
                {exec.historySignal ? (
                  <>
                    <div className="mini-label">Contexto usado</div>
                    <div className="history-text muted-body">{exec.historySignal}</div>
                  </>
                ) : null}
                {exec.reasoningSummary || exec.explicacao ? (
                  <>
                    <div className="mini-label">Raciocinio tecnico</div>
                    <div className="history-text muted-body">{exec.reasoningSummary || exec.explicacao}</div>
                  </>
                ) : null}
                <div className="mini-label">Modo da rodada</div>
                <div className="history-text muted-body">{exec.isFreeInstruction ? "Instrucao livre" : getActionLabel(exec.acao)}</div>
                {exec.promptApplied ? (
                  <>
                    <div className="mini-label">Prompt aplicado</div>
                    <div className="history-text muted-body">{exec.promptApplied}</div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      }) : (
        <div className="history-collapsed-hint">Registro de execucoes, contexto usado e raciocinio tecnico da missao.</div>
      )}
    </div>
  );
}

function ReflectionSummary({ reflexao }) {
  return (
    <div className="card reflection-summary">
      <div className="reflection-summary-title">Reflexao enviada</div>
      {reflexao.missionName ? <div className="reflection-summary-mission">{reflexao.missionName}</div> : null}
      {Object.entries(reflexao.respostas || {}).map(([key, value]) => (
        <div className="reflection-row" key={key}>
          <span className="muted-body">{getReflectionTopicLabel(key)}</span>
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map((score) => (
              <span className="star" key={score}>
                {score <= value ? "★" : "☆"}
              </span>
            ))}
          </div>
        </div>
      ))}
      {reflexao.comment ? (
        <div className="reflection-comment">
          <div className="mini-label">Observacao geral</div>
          <div className="muted-body">{reflexao.comment}</div>
        </div>
      ) : null}
    </div>
  );
}

function useFacilitatorScreenSharePresenter(event, screenShare, onPublishState) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const roomRef = useRef(null);
  const tracksRef = useRef([]);

  useEffect(() => {
    return () => {
      tracksRef.current.forEach((track) => {
        try {
          roomRef.current?.localParticipant?.unpublishTrack(track);
        } catch {}
        track.stop();
      });
      tracksRef.current = [];
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  async function stopShare(markEnded = true) {
    tracksRef.current.forEach((track) => {
      try {
        roomRef.current?.localParticipant?.unpublishTrack(track);
      } catch {}
      track.stop();
    });
    tracksRef.current = [];
    roomRef.current?.disconnect();
    roomRef.current = null;
    setStatus("idle");
    if (markEnded && event) {
      onPublishState({
        active: false,
        endedAt: new Date().toISOString(),
      });
    }
  }

  async function startShare() {
    if (!event) return;
    const roomName = `event-${event.id}-screen`;
    const identity = `facilitador-${event.id}`;
    setStatus("connecting");
    setError("");

    try {
      const { token, url } = await fetchLiveKitToken({
        roomName,
        identity,
        name: `${event.name} - Facilitador`,
        canPublish: true,
      });

      const room = new Room();
      roomRef.current = room;
      await room.connect(url, token);
      const tracks = await room.localParticipant.createScreenTracks({
        audio: false,
      });
      tracksRef.current = tracks;

      for (const track of tracks) {
        await room.localParticipant.publishTrack(track, {
          source: track.kind === Track.Kind.Video ? Track.Source.ScreenShare : Track.Source.ScreenShareAudio,
        });
      }

      const videoTrack = tracks.find((track) => track.kind === Track.Kind.Video);
      if (videoTrack?.mediaStreamTrack) {
        videoTrack.mediaStreamTrack.onended = () => {
          stopShare(true);
        };
      }

      onPublishState({
        active: true,
        roomName,
        presenterId: identity,
        startedAt: new Date().toISOString(),
        endedAt: null,
        provider: "livekit",
      });
      setStatus("live");
    } catch (err) {
      console.error(err);
      await stopShare(false);
      setStatus("error");
      setError("Nao foi possivel iniciar o compartilhamento. Verifique o servidor LiveKit e as credenciais.");
    }
  }

  const effectiveStatus = status === "live" || screenShare.active ? "live" : status;
  return { status, error, effectiveStatus, startShare, stopShare };
}

function FacilitatorScreenShareButton({ event, screenShare, onPublishState }) {
  const shareState = screenShare || getScreenShareState({});
  const { status, error, effectiveStatus, startShare, stopShare } = useFacilitatorScreenSharePresenter(
    event,
    shareState,
    onPublishState,
  );
  const disabled = !event || status === "connecting";

  return (
    <button
      className={`btn btn-sm topbar-screen-share-btn${shareState.active ? " is-live" : ""}`}
      disabled={disabled}
      title={
        !event
          ? "Selecione um evento para projetar"
          : error
            ? error
            : effectiveStatus === "live"
              ? shareState.startedAt
                ? `Ao vivo desde ${formatDateTime(shareState.startedAt)}`
                : "Transmissao ao vivo"
              : effectiveStatus === "connecting"
                ? "Conectando apresentacao"
                : "Projetar sua tela para os times"
      }
      onClick={() => (shareState.active ? stopShare(true) : startShare())}
    >
      {status === "connecting"
        ? "Conectando..."
        : shareState.active
          ? "Encerrar projecao"
          : "Projetar tela"}
    </button>
  );
}

function FacilitatorScreenSharePanel({ event, screenShare, onPublishState }) {
  const { status, error, effectiveStatus, startShare, stopShare } = useFacilitatorScreenSharePresenter(
    event,
    screenShare,
    onPublishState,
  );

  return (
    <div className={`screen-share-panel${screenShare.active ? " is-live" : ""}`}>
      <div className="section-header">
        <span className="section-title">
          Apresentacao ao vivo
          {screenShare.active ? <span className="help-badge">ao vivo</span> : null}
        </span>
      </div>
      <div className="screen-share-row">
        <div>
          <div className="screen-share-title">
            {screenShare.active ? "Voce esta apresentando sua tela" : "Projetar tela"}
          </div>
          <div className="screen-share-meta">
            <span>Status: {effectiveStatus === "live" ? "ao vivo" : effectiveStatus === "connecting" ? "conectando" : "inativo"}</span>
            {screenShare.startedAt ? (
              <>
                <span>·</span>
                <span>Iniciado em {formatDateTime(screenShare.startedAt)}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="header-actions">
          {!screenShare.active ? (
            <button className="btn btn-primary" disabled={status === "connecting"} onClick={startShare}>
              {status === "connecting" ? "Conectando..." : "Apresentar agora"}
            </button>
          ) : (
            <button className="btn presenter-stop-btn" onClick={() => stopShare(true)}>
              Encerrar apresentacao
            </button>
          )}
        </div>
      </div>
      {error ? <div className="error-box top-gap-sm">{error}</div> : null}
    </div>
  );
}

function TeamScreenShareViewer({ event, screenShare, team }) {
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const roomRef = useRef(null);
  const currentTrackRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function connectViewer() {
      setStatus("connecting");
      setError("");
      try {
        const identity = `team-${event.id}-${team?.name?.replace(/\s+/g, "-").toLowerCase() || "viewer"}-${Date.now()}`;
        const { token, url } = await fetchLiveKitToken({
          roomName: screenShare.roomName,
          identity,
          name: team?.name || "Time",
          canPublish: false,
        });
        const room = new Room();
        roomRef.current = room;

        const attachTrack = (track, publication) => {
          if (!mounted) return;
          if (publication?.source !== Track.Source.ScreenShare || track.kind !== Track.Kind.Video) return;
          currentTrackRef.current?.detach();
          currentTrackRef.current = track;
          if (videoRef.current) {
            track.attach(videoRef.current);
          }
          setStatus("watching");
        };

        room
          .on(RoomEvent.TrackSubscribed, (track, publication) => {
            attachTrack(track, publication);
          })
          .on(RoomEvent.TrackUnsubscribed, (track) => {
            track.detach();
            if (currentTrackRef.current === track) {
              currentTrackRef.current = null;
              setStatus("waiting");
            }
          })
          .on(RoomEvent.Disconnected, () => {
            if (!mounted) return;
            setStatus("ended");
          });

        await room.connect(url, token);

        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.track) {
              attachTrack(publication.track, publication);
            }
          });
        });

        if (!currentTrackRef.current) {
          setStatus("waiting");
        }
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setStatus("error");
        setError("Nao foi possivel assistir a transmissao ao vivo.");
      }
    }

    if (screenShare.active && screenShare.roomName) {
      connectViewer();
    }

    return () => {
      mounted = false;
      currentTrackRef.current?.detach();
      currentTrackRef.current = null;
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [event.id, screenShare.active, screenShare.roomName, team?.name]);

  return (
    <div className="live-viewer-card">
      <div className="reading-panel-header live-viewer-header">
        <div>
          <div className="reading-panel-kicker">Apresentacao ao vivo</div>
          <div className="reading-panel-title">Voce esta assistindo a tela do facilitador</div>
          <div className="reading-panel-sub">
            Sua equipe esta vendo a tela do facilitador em tempo real. A interacao da missao fica pausada enquanto a apresentacao estiver ativa.
          </div>
        </div>
        <div className="live-viewer-badges">
          <div className="source-chip">{status === "watching" ? "ao vivo" : status}</div>
          <div className="source-chip viewer-team-chip">{team?.name || "Time"}</div>
        </div>
      </div>
      <div className="live-viewer-stage">
        <video ref={videoRef} className="live-viewer-video" autoPlay playsInline muted={false} />
        {status !== "watching" ? (
          <div className="live-viewer-overlay">
            <div className="live-viewer-overlay-title">
              {status === "connecting"
                ? "Conectando na transmissao..."
                : status === "waiting"
                  ? "Aguardando a tela do facilitador aparecer..."
                  : status === "ended"
                    ? "A transmissao foi encerrada."
                    : "Falha ao abrir a transmissao."}
            </div>
            {error ? <div className="live-viewer-overlay-text">{error}</div> : null}
          </div>
        ) : null}
      </div>
      <div className="live-viewer-foot">
        <span>Evento: {event.name}</span>
        <span>·</span>
        <span>Time: {team?.name || "Time"}</span>
        <span>·</span>
        <span>Apresentacao iniciada em {formatDateTime(screenShare.startedAt)}</span>
      </div>
    </div>
  );
}

export default App;
