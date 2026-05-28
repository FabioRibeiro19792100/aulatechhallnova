import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, BookOpen, CalendarDays, ChevronDown, CircleAlert, Clock3, Code2, Coins, FileText, FileStack, FolderOpen, LayoutDashboard, LifeBuoy, ListChecks, Map, MessageSquareText, Monitor, Newspaper, Paperclip, SlidersHorizontal, Sparkles, Users, WandSparkles, Waypoints, X } from "lucide-react";
import { Room, RoomEvent, Track } from "livekit-client";
import { createClient } from "@supabase/supabase-js";
import MarkdownMessage from "./MarkdownMessage.jsx";
import techHallLogoDark from "../tech_hall_branding/tech_hall_preto.png";
import techHallFooterIcon from "../tech_hall_branding/icone_8.png";

const FREE_ACTION_KEY = "__free_instruction__";
const FREE_ACTION_LABEL = "Escrever minha própria instrução";
const TRAINING_MODE_EVENT = "training";
const MISSIONS_MODE_EVENT = "missions";
const TRAINING_THREAD_ID = "__training__";
const CHAT_AI_MODE = "chat";
const CODING_AI_MODE = "coding";
const CODING_AI_REASONING_EFFORT = "medium";
const TECHNICAL_ANALYSIS_MODEL = "gpt-4.1-mini";
const FACILITATOR_PASSWORD = "camila";
const DEFAULT_MISSION_TOKEN_LIMIT = 15000;
const TOKEN_MISSION_TRAINING_ID = "training_lab";
const TOKEN_POLICY_MODE_UNLIMITED = "unlimited";
const TOKEN_POLICY_MODE_DEFAULT = "default_15000";
const TOKEN_POLICY_MODE_CUSTOM = "custom";
const PRESENCE_STALE_MS = 45000;
const BRAND_LOADER_DURATION_MS = 700;
const REMOTE_SYNC_SAVE_DEBOUNCE_MS = 80;
const REMOTE_SYNC_POLL_MS = 400;
const TIMER_NOTICE_TTL_MS = 30000;
const TIMER_LOCK_TTL_MS = 15000;
const FACILITATOR_TOOL_VIEWS = {
  MENU: "menu",
  CONFIG: "config",
  BROADCAST: "broadcast",
  SCREEN: "screen",
  TIMER: "timer",
  ROOM_MAP: "room-map",
  TOKENS: "tokens",
};
const STUDENT_RESOURCE_SECTIONS = [
  {
    id: "materials",
    title: "Materiais de aula",
    groups: [
      {
        id: "materials-1-2",
        title: "Encontros 1 e 2",
        items: [
          {
            id: "class-1-2",
            title: "Material da aula 1 e 2",
            href: "https://drive.google.com/file/d/1fWvpYy8qbm7QsnzeDpBuFhS8dTViupig/view?usp=sharing",
          },
        ],
      },
      {
        id: "materials-3-4",
        items: [
          {
            id: "class-3-4",
            title: "Material da aula 3 e 4",
            href: "https://material-de-aula.vercel.app",
          },
        ],
      },
    ],
  },
  {
    id: "curation",
    title: "Curadoria",
    groups: [
      {
        id: "curation-1-2",
        title: "Encontros 1 e 2",
        description: "Leituras e referências para aprofundar os temas dos dois primeiros encontros.",
        items: [
          {
            id: "cur-apple-gemini",
            title: "Apple fecha parceria com Google para levar o Gemini aos iPhones por meio da Siri",
            description: "g1",
            href: "https://g1.globo.com/tecnologia/noticia/2026/01/12/apple-fecha-parceria-com-google-para-integrar-o-gemini-a-siri.ghtml",
          },
          {
            id: "cur-wef-bargain",
            title: "AI has broken the internet’s economic bargain – here’s how we fix it",
            description: "World Economic Forum",
            href: "https://www.weforum.org/stories/2026/01/ai-has-broken-the-internet-s-economic-bargain-here-s-how-we-fix-it/",
          },
          {
            id: "cur-estonia",
            title: "Estonia bets on artificial intelligence to offset demographic decline",
            description: "Estonian World",
            href: "https://estonianworld.com/technology/estonia-bets-on-artificial-intelligence-to-offset-demographic-decline/",
          },
          {
            id: "cur-pedagogia",
            title: "Pedagogia do aprendizado",
            description: "Link exato ainda não encontrado",
            href: "",
          },
          {
            id: "cur-recall-copyright",
            title: "Researchers Just Found Something That Could Shake the AI Industry to its Core",
            description: "Futurism",
            href: "https://futurism.com/artificial-intelligence/ai-industry-recall-copyright-books",
          },
          {
            id: "cur-data-centers-br",
            title: "Dispara construção de data centers no Brasil mesmo sem incentivo fiscal",
            description: "UOL Tilt",
            href: "https://www.uol.com.br/tilt/noticias/redacao/2026/04/15/data-centers-devem-crescer-cinco-vez-no-brasil-mesmo-sem-incentivo-fiscal.ghtm",
          },
          {
            id: "cur-follow-money",
            title: "Follow the money",
            description: "Bloomberg",
            href: "https://www.bloomberg.com/news/features/2025-10-07/openai-s-nvidia-amd-deals-boost-1-trillion-ai-boom-with-circular-deals",
          },
          {
            id: "cur-circular-deals",
            title: "Efeitos piramidais e circulares",
            description: "Bloomberg",
            href: "https://www.bloomberg.com/news/features/2025-10-07/openai-s-nvidia-amd-deals-boost-1-trillion-ai-boom-with-circular-deals",
          },
          {
            id: "cur-androides",
            title: "Androides sonham com leitores de carne e osso?",
            description: "Folha",
            href: "https://www1.folha.uol.com.br/colunas/alexandra-moraes-ombudsman/2026/02/androides-sonham-com-leitores-de-carne-e-osso.shtml",
          },
          {
            id: "cur-moltbook",
            title: "Moltbook was peak AI theater",
            description: "Technology Review — busca sugerida",
            href: "https://www.technologyreview.com",
          },
          {
            id: "cur-claude-apocalypse",
            title: "The Only Thing Standing Between Humanity and AI Apocalypse Is… Claude?",
            description: "Wired",
            href: "https://www.wired.com/story/the-only-thing-standing-between-humanity-and-ai-apocalypse-is-claude/",
          },
          {
            id: "cur-block-jobs",
            title: "Jack Dorsey’s Block cuts thousands of jobs as it embraces AI",
            description: "BBC",
            href: "https://www.bbc.com/news/articles/cq570d12y9do",
          },
          {
            id: "cur-pokemon-go",
            title: "Pokémon Go players built a 30-billion-photo map...",
            description: "MIT Technology Review",
            href: "https://www.technologyreview.com/2026/03/10/1134099/how-pokemon-go-is-helping-robots-deliver-pizza-on-time/",
          },
          {
            id: "cur-anthropic-risk",
            title: "Anthropic Hits Back After US Military Labels It a ‘Supply Chain Risk’",
            description: "Wired",
            href: "https://www.wired.com/story/anthropic-supply-chain-risk-shockwaves-silicon-valley/",
          },
          {
            id: "cur-amazon-outages",
            title: "Amazon convenes 'deep dive' internal meeting to address outages",
            description: "CNBC",
            href: "https://www.cnbc.com/2026/03/10/amazon-plans-deep-dive-internal-meeting-address-ai-related-outages.html",
          },
          {
            id: "cur-roi-ai",
            title: "O ROI do uso de IA",
            description: "Wall Street Journal",
            href: "https://www.wsj.com/tech/ai/ai-tokens-productivity-d35c6bd8",
          },
        ],
      },
    ],
  },
];
const MAX_ATTACHMENT_COUNT = 3;

function getStudentResourcePreviewUrl(href = "") {
  if (!href) return "";
  try {
    const url = new URL(href);
    if (url.hostname.includes("drive.google.com")) {
      const match = href.match(/\/file\/d\/([^/]+)/);
      if (match?.[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return href;
  } catch {
    return href;
  }
}
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENT_TEXT_CHARS = 12000;
const ATTACHMENT_ACCEPT = ".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp";
const TRAINING_MISSION = {
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

const AI_MODE_LABELS = {
  [CHAT_AI_MODE]: "Chat",
  [CODING_AI_MODE]: "Coding",
};

const RESPOND_IN_PT = "Responda sempre em portugues do Brasil, qualquer que seja o idioma do pedido, dos anexos ou do historico.";
const PLAN_CLOSING_QUESTION = "Ao final do plano, pergunte ao usuario se ele aprova o plano e quer que voce inicie a execucao, se prefere ajustar algum ponto ou se tem feedbacks a dar antes de prosseguir.";

const SYSTEM_PROMPTS = {
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
      PLAN_CLOSING_QUESTION,
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
      PLAN_CLOSING_QUESTION,
      RESPOND_IN_PT,
    ].join(" "),
  },
};

function getSystemPrompt(aiMode, planningMode = "off") {
  const byMode = SYSTEM_PROMPTS[aiMode] || SYSTEM_PROMPTS[CHAT_AI_MODE];
  return planningMode === "on" ? byMode.on : byMode.off;
}

const FIXED_MISSION_TEMPLATE = "fixed-v2";

function EventCardSectionLabel({ icon, children }) {
  const Icon =
    icon === "summary"
      ? FileText
      : icon === "mode"
        ? SlidersHorizontal
        : icon === "teams"
          ? Users
          : icon === "code"
            ? Code2
            : null;
  return (
    <div className="mini-label event-card-label">
      <span className="event-card-label-icon" aria-hidden="true">
        {Icon ? <Icon strokeWidth={1.6} /> : null}
      </span>
      <span className="event-card-label-text">{children}</span>
    </div>
  );
}

function FacilitatorTabLabel({ tab }) {
  const Icon =
    tab === "dashboard"
      ? LayoutDashboard
      : tab === "missoes"
        ? BookOpen
        : tab === "anamnese"
          ? FileText
          : MessageSquareText;
  return (
    <>
      <span className="tab-icon" aria-hidden="true">
        <Icon strokeWidth={1.6} />
      </span>
      <span>
        {tab === "dashboard" ? "Dashboard" : tab === "missoes" ? "Missões" : tab === "anamnese" ? "Anamnese" : "Prompts"}
      </span>
    </>
  );
}

const FIXED_MISSIONS_CATALOG = [
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

const PERGUNTAS_REFLEXAO = [
  { id: "q1", texto: "O que a IA fez correspondeu ao que você esperava?", min: "muito abaixo", max: "muito acima" },
  { id: "q2", texto: "Consegue imaginar onde usaria isso no trabalho?", min: "nao consigo", max: "consigo claramente" },
  { id: "q3", texto: "Quão confortável você se sente usando IA para esse tipo de tarefa?", min: "desconfortável", max: "muito confortável" },
];

const REFLECTION_TOPIC_LABELS = {
  q1: "Expectativa atendida",
  q2: "Aplicação no trabalho",
  q3: "Conforto com IA",
};

const REFLECTION_TOPIC_SHORT_LABELS = {
  q1: "Expectativa",
  q2: "Aplicação",
  q3: "Conforto",
};
const ANAMNESIS_UNKNOWN_VALUE = "__unknown__";

const ANAMNESIS_SECTIONS = [
  {
    id: "A",
    title: "Posição e influência",
    description: "Como você está posicionado para influenciar decisões de IA na sua organização.",
  },
  {
    id: "B",
    title: "Histórico com IA",
    description: "O que você já viveu, tentativas, aprendizados e experiências concretas.",
  },
  {
    id: "C",
    title: "Prioridades estratégicas",
    description: "Para onde o negócio está indo e onde IA poderia ou não importar.",
  },
  {
    id: "D",
    title: "Time e cultura interna",
    description: "Como você lê o ambiente humano ao redor da IA na sua organização.",
  },
  {
    id: "E",
    title: "Expectativas com o programa",
    description: "O que você quer levar daqui.",
  },
];

const ANAMNESIS_QUESTIONS = [
  {
    id: "q1",
    section: "A",
    number: "01",
    prompt: "Qual é o seu papel atual na organização?",
    type: "single",
    options: ["CEO / Fundador", "C-level ou equivalente", "Diretor ou VP de área", "Conselheiro ou membro de board", "Outro"],
  },
  {
    id: "q2",
    section: "A",
    number: "02",
    prompt: "Quando se trata de IA na sua organização, você se descreveria como...",
    type: "single",
    options: [
      "Quem toma as decisões. Tenho autonomia e orçamento",
      "Quem influencia. Participo das decisões, mas não decido sozinho",
      "Quem executa. Recebo as diretrizes e implemento",
      "Quem ainda está buscando espaço para isso",
    ],
  },
  {
    id: "q3",
    section: "B",
    number: "03",
    prompt: "Como você descreveria sua relação pessoal com IA até hoje?",
    type: "scale",
    options: ["Observador distante", "Curioso, mas sem prática", "Uso no dia a dia", "Já conduzi iniciativas", "Referência no tema"],
  },
  {
    id: "q4",
    section: "B",
    number: "04",
    prompt: "Sua organização já tentou alguma iniciativa de IA nos últimos 2 anos? O que aconteceu?",
    type: "single",
    options: [
      "Sim, e está funcionando com resultados claros",
      "Sim, mas ficou no piloto e não escalou",
      "Sim, mas não funcionou. Aprendemos com isso",
      "Ainda não iniciamos nada formalmente",
    ],
  },
  {
    id: "q5",
    section: "B",
    number: "05",
    prompt: "Se houve tentativas, o que você identifica hoje como o fator que mais pesou no resultado?",
    type: "single",
    optionalText: true,
    textPrompt: "Se quiser, detalhe um pouco mais.",
    placeholder: "Pode ser uma decisão, uma pessoa, um contexto, uma escolha de tecnologia...",
    options: [
      "Patrocínio da liderança",
      "Clareza de objetivo e caso de uso",
      "Qualidade de dados ou tecnologia",
      "Capacidade do time para executar",
      "Resistência cultural ou política interna",
    ],
  },
  {
    id: "q6",
    section: "C",
    number: "06",
    prompt: "Quais são as 2 ou 3 prioridades mais urgentes do seu negócio nos próximos 12 a 24 meses?",
    type: "multi",
    optionalText: true,
    textPrompt: "Se alguma prioridade não estiver na lista, complemente aqui.",
    placeholder: "Crescimento, eficiência, novo mercado, reestruturação, M&A, regulação...",
    options: [
      "Crescimento de receita",
      "Eficiência operacional e custo",
      "Expansão comercial ou de mercado",
      "Novos produtos ou inovação",
      "Reorganização interna e pessoas",
      "Risco, compliance ou regulação",
    ],
  },
  {
    id: "q8",
    section: "D",
    number: "07",
    prompt: "Como você percebe o estado geral da sua organização em relação à IA hoje?",
    type: "single",
    options: [
      "Já existe movimento concreto e isso começa a ganhar escala",
      "Existe movimento consistente, mas ainda com ajustes importantes",
      "Há interesse, mas a direção ainda não está clara",
      "O tema ainda está começando a ganhar espaço",
      "Há resistência ou ceticismo relevantes hoje",
    ],
  },
  {
    id: "q9",
    section: "D",
    number: "08",
    prompt: "Quem, dentro da sua organização, mais importa engajar para que IA avance de verdade?",
    type: "multi",
    optionalText: true,
    textPrompt: "Se quiser, especifique nomes, áreas ou coalizões importantes.",
    placeholder: "Pode ser um papel, uma área, um nome, um grupo...",
    options: [
      "Alta liderança / board",
      "Lideranças de negócio",
      "Tecnologia / dados",
      "Jurídico / compliance",
      "Operação / linha de frente",
      "RH / desenvolvimento de pessoas",
    ],
  },
  {
    id: "q10",
    section: "E",
    number: "09",
    prompt: "O que você espera que mude na sua forma de atuar após os 10 encontros?",
    type: "multi",
    options: [
      "Ter clareza de onde priorizar investimentos em IA",
      "Conseguir liderar conversas de IA com mais segurança",
      "Ter um plano concreto para minha organização",
      "Entender os riscos reais e como lidar com eles",
      "Construir uma rede com outros líderes no mesmo momento",
    ],
  },
  {
    id: "q11",
    section: "E",
    number: "10",
    prompt: "Se você pudesse sair deste programa com uma resposta clara para uma única pergunta, qual seria ela?",
    type: "single",
    optionalText: true,
    textPrompt: "Se quiser, escreva a pergunta exata do seu jeito.",
    placeholder: "Escreva a pergunta que mais te preocupa ou intriga sobre IA...",
    options: [
      "Onde priorizar IA no meu contexto",
      "Como provar valor de negócio com IA",
      "Como liderar a adoção com mais segurança",
      "Como equilibrar risco e oportunidade",
      "Como transformar IA em plano concreto",
    ],
  },
];

const ANAMNESIS_STOPWORDS = new Set([
  "a","as","o","os","de","da","do","das","dos","e","em","para","por","com","sem","um","uma","uns","umas","na","no","nas","nos","que","se","ao","aos","à","às","ou","mais","menos","muito","muita","muitos","muitas","já","ainda","como","sobre","ser","estar","ter","há","hoje","amanhã","entre","pela","pelo","pelas","pelos","isso","essa","esse","esta","este","meu","minha","seu","sua","nosso","nossa","quer","quero","nada","algo",
]);

const MOCKS = {
  mission_general_chat: (input) =>
    `ANÁLISE GERAL\n\nLeitura principal:\n- Objetivo central identificado a partir do pedido.\n- Pontos prioritários organizados para resposta útil.\n- Lacunas ou ambiguidades marcadas quando faltou contexto.\n\nPróximo passo sugerido:\n- Refinar o pedido com destinatário, formato e critério de prioridade.\n\nTrecho de contexto recebido:\n"${input.slice(0, 140)}${input.length > 140 ? "..." : ""}"`,
  mission_programming_coding: (input) =>
    `RESPOSTA DE PROGRAMAÇÃO\n\nDiagnóstico inicial:\n- Identifiquei o problema técnico principal no pedido.\n- Priorizaria uma solução implementável, com explicação de trade-offs.\n- Se o contexto estiver incompleto, começo pelo caminho mais seguro e explicito as suposições.\n\nAbordagem prática:\n1. Isolar a causa provável.\n2. Propor correção concreta.\n3. Explicar impacto em arquitetura, manutenção e debugging.\n\nTrecho do pedido técnico:\n"${input.slice(0, 140)}${input.length > 140 ? "..." : ""}"`,
};

const EXPLICACOES = {
  mission_general_chat:
    "Estratégia: leitura ampla e organizada do pedido, com foco em síntese, clareza estrutural e utilidade para decisão. A IA prioriza o que parece central, explicita ambiguidades e evita inventar fatos que não apareceram no material.",
  mission_programming_coding:
    "Estratégia: abordagem orientada a implementação. A IA lê o pedido como problema técnico, prioriza debugging, arquitetura, refatoração e exemplos concretos, e tenta responder com passos reproduzíveis e decisões de engenharia justificadas.",
};

const ANALYSIS_NOT_APPLICABLE = "não aplicável nesta rodada";
const TECHNICAL_PANEL_BLOCKS = {
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

const STORE = "techhall:v3";
const FALLBACK_MODEL_CATALOG = {
  chat: [
    { id: "gpt-4o-mini", label: "GPT-4o mini", releasedAt: "2024-07", pricing: { input: 0.15, output: 0.6 } },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini", releasedAt: "2025-04", pricing: { input: 0.4, output: 1.6 } },
    { id: "gpt-4o", label: "GPT-4o", releasedAt: "2024-05", pricing: { input: 5, output: 15 } },
    { id: "gpt-4.1", label: "GPT-4.1", releasedAt: "2025-04", pricing: { input: 2, output: 8 } },
    { id: "gpt-5-mini", label: "GPT-5 mini", releasedAt: "2025-08", pricing: { input: 0.25, output: 2 } },
    { id: "gpt-5", label: "GPT-5", releasedAt: "2025-08", pricing: { input: 1.25, output: 10 } },
  ],
  coding: [
    { id: "gpt-5.1-codex-mini", label: "GPT-5.1 Codex Mini", releasedAt: "2025-11", pricing: { input: 0.25, output: 2 } },
    { id: "gpt-5.1-codex", label: "GPT-5.1 Codex", releasedAt: "2025-11", pricing: { input: 1.25, output: 10 } },
    { id: "gpt-5.3-codex", label: "GPT-5.3 Codex", releasedAt: "2026-02", pricing: { input: 1.75, output: 14 } },
  ],
};
const DEFAULT_CHAT_MODEL = "gpt-4.1-mini";
const DEFAULT_CODING_MODEL = "gpt-5.1-codex-mini";
const MONTH_LABELS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function getModelCatalog(serverConfig) {
  const models = serverConfig?.models;
  if (models && Array.isArray(models.chat) && models.chat.length && Array.isArray(models.coding) && models.coding.length) {
    return models;
  }
  return FALLBACK_MODEL_CATALOG;
}

function getModelsForMode(catalog, aiMode) {
  return aiMode === CODING_AI_MODE ? catalog.coding : catalog.chat;
}

function getCatalogEntries(catalog) {
  return [...(catalog?.chat || []), ...(catalog?.coding || [])];
}

function findModelEntry(catalog, id) {
  return getCatalogEntries(catalog).find((model) => model.id === id) || null;
}

function getModelPricingMap(catalog) {
  const map = {};
  getCatalogEntries(catalog).forEach((model) => {
    if (model?.id && model.pricing) map[model.id] = model.pricing;
  });
  return map;
}

function getModelLabel(catalog, id) {
  return findModelEntry(catalog, id)?.label || id;
}

function getDefaultModelForMode(serverConfig, aiMode) {
  if (aiMode === CODING_AI_MODE) {
    return serverConfig?.defaultCodingModel || DEFAULT_CODING_MODEL;
  }
  return serverConfig?.defaultChatModel || DEFAULT_CHAT_MODEL;
}

function formatModelLaunch(releasedAt = "") {
  const match = /^(\d{4})-(\d{2})$/.exec(releasedAt);
  if (!match) return "";
  const month = MONTH_LABELS_PT[Number(match[2]) - 1];
  return month ? `${month}/${match[1]}` : match[1];
}

const USD_TO_BRL = 5.4;

function formatBRL(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatModelPriceHint(entry) {
  if (!entry?.pricing) return "";
  const inputBRL = formatBRL(entry.pricing.input * USD_TO_BRL);
  const outputBRL = formatBRL(entry.pricing.output * USD_TO_BRL);
  return `${inputBRL}/1M entrada · ${outputBRL}/1M saída`;
}
const SIMULATION_STEPS = [
  { key: "analisando", label: "analisando pedido" },
  { key: "estrategia", label: "selecionando estratégia" },
  { key: "gerando", label: "gerando resposta" },
  { key: "finalizando", label: "finalizando" },
];
const SHOW_DEV_SWITCH = true;

function buildRunSteps(apiConfigured) {
  if (apiConfigured) {
    return [];
  }
  return SIMULATION_STEPS.map((step, index) => ({
    ...step,
    status: index === 0 ? "active" : "pending",
    label: step.label,
  }));
}
const MISSION_CONCEPTS = {
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
  const response = await fetch(`/api/state?ts=${Date.now()}`, {
    cache: "no-store",
  });
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

function estimateCost(pricingMap, model, inputTokens, outputTokens) {
  const price = pricingMap?.[model] || pricingMap?.[DEFAULT_CHAT_MODEL] || { input: 0, output: 0 };
  return ((inputTokens / 1_000_000) * price.input) + ((outputTokens / 1_000_000) * price.output);
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeStudentName(value) {
  return value.replace(/\s+/g, " ").trim();
}

function parseStudentList(rawValue) {
  const seen = new Set();
  return rawValue
    .split("\n")
    .map((item) => normalizeStudentName(item))
    .filter(Boolean)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function makeTeam(name, members = []) {
  return {
    name,
    runs: 0,
    members,
  };
}

function shuffleArray(items) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[nextIndex]] = [clone[nextIndex], clone[index]];
  }
  return clone;
}

function buildTeamsFromStudents(students, mode, teamCount = 0) {
  if (mode === "solo") {
    return students.map((student) => makeTeam(student, [student]));
  }

  const totalTeams = Number(teamCount);
  if (!totalTeams || totalTeams < 1 || totalTeams > students.length) return [];
  const shuffled = shuffleArray(students);
  const groups = Array.from({ length: totalTeams }, (_, index) => makeTeam(`Time ${index + 1}`, []));
  shuffled.forEach((student, index) => {
    groups[index % totalTeams].members.push(student);
  });
  return groups;
}

function makeEvent({ name, desc, rawTeams }) {
  const teams = rawTeams
    ? rawTeams
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((team) => makeTeam(team))
    : [];
  const missions = buildFixedMissionList().map((mission, index) => ({
    ...mission,
    unlocked: index === 0,
  }));
  return {
    id: `ev_${Date.now()}`,
    name,
    desc,
    status: "draft",
    eventMode: MISSIONS_MODE_EVENT,
    missionTemplate: FIXED_MISSION_TEMPLATE,
    teams,
    missions,
    execucoes: {},
    reflexoes: {},
    questionariosPendentes: {},
    conclusoes: {},
    preservedMissionUsage: {},
    missionGlossaries: {},
    missionTokenPolicies: {},
    tokenGrants: [],
    tokenOperationalLogs: [],
    helpRequests: [],
    helpDisabledMap: {},
    anamnesisEnabled: false,
    anamnesisResponses: {},
    trainingRuns: {},
    trainingHelpRequests: [],
    announcements: [],
    sessionTimer: {
      active: false,
      startedAt: null,
      endsAt: null,
      durationMs: 0,
    },
    sessionTimerNotice: null,
    presenceMap: {},
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

function makeDevLabEvent() {
  const event = makeEvent({
    name: "Lab de teste",
    desc: "Ambiente rápido para validar fluxo local",
    rawTeams: "Time 1",
  });
  return {
    ...event,
    status: "open",
    eventMode: MISSIONS_MODE_EVENT,
    missions: event.missions.map((mission, index) => ({
      ...normalizeMission(mission),
      unlocked: index === 0,
    })),
  };
}

function getEventMode(evento) {
  return evento?.eventMode || MISSIONS_MODE_EVENT;
}

function isAnamnesisEnabled(evento) {
  return Boolean(evento?.anamnesisEnabled);
}

function getAnamnesisResponse(evento, teamIdx) {
  if (!evento || teamIdx === null || teamIdx === undefined) return null;
  return evento.anamnesisResponses?.[teamIdx] || null;
}

function hasCompletedAnamnesis(evento, teamIdx) {
  return Boolean(getAnamnesisResponse(evento, teamIdx)?.submittedAt);
}

function getAnamnesisAnswerChoice(question, value) {
  if (question.optionalText) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value.choice;
    }
    return undefined;
  }
  return value;
}

function getAnamnesisAnswerNote(question, value) {
  if (!question.optionalText) return "";
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return normalizeAnamnesisText(value.note || "");
  }
  return typeof value === "string" ? normalizeAnamnesisText(value) : "";
}

function isAnamnesisUnknownChoice(choice) {
  if (Array.isArray(choice)) return choice.includes(ANAMNESIS_UNKNOWN_VALUE);
  return choice === ANAMNESIS_UNKNOWN_VALUE;
}

function isAnamnesisAnswerFilled(question, value) {
  const note = getAnamnesisAnswerNote(question, value);
  const choice = getAnamnesisAnswerChoice(question, value);
  if (question.type === "text") return Boolean(note);
  if (question.type === "multi") return (Array.isArray(choice) && choice.length > 0) || Boolean(note);
  return (choice !== null && choice !== undefined && choice !== "") || Boolean(note);
}

function countAnsweredAnamnesisQuestions(answers = {}) {
  return ANAMNESIS_QUESTIONS.filter((question) => isAnamnesisAnswerFilled(question, answers[question.id])).length;
}

function normalizeAnamnesisText(value = "") {
  return `${value || ""}`.replace(/\s+/g, " ").trim();
}

function normalizeAnamnesisAnswer(question, value) {
  const normalizeChoice = () => {
    if (question.type === "text") return "";
    if (question.type === "multi") {
      const raw = question.optionalText ? getAnamnesisAnswerChoice(question, value) : value;
      if (Array.isArray(raw)) {
        if (raw.includes(ANAMNESIS_UNKNOWN_VALUE)) return [ANAMNESIS_UNKNOWN_VALUE];
        return [...new Set(raw.map((item) => Number(item)).filter(Number.isFinite))].sort((a, b) => a - b);
      }
      return [];
    }
    const raw = question.optionalText ? getAnamnesisAnswerChoice(question, value) : value;
    if (raw === ANAMNESIS_UNKNOWN_VALUE) return ANAMNESIS_UNKNOWN_VALUE;
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : "";
  };

  const normalizedNote = normalizeAnamnesisText(getAnamnesisAnswerNote(question, value));
  if (!question.optionalText) {
    if (question.type === "text") return normalizedNote;
    return normalizeChoice();
  }

  return {
    choice: normalizeChoice(),
    note: normalizedNote,
  };
}

function getAnamnesisQuestionResults(evento, question) {
  const responses = Object.values(evento?.anamnesisResponses || {}).filter((entry) => entry?.submittedAt);
  const notes = responses
    .map((entry) => getAnamnesisAnswerNote(question, entry.answers?.[question.id]))
    .filter(Boolean);

  if (question.type === "text") {
    return {
      respondents: notes.length,
      responseRate: responses.length ? Math.round((notes.length / responses.length) * 100) : 0,
      texts: notes,
    };
  }

  const choiceOptions = [...(question.options || []), "Não sei responder"];
  const counts = choiceOptions.map((_, optionIdx) => {
    let total = 0;
    responses.forEach((entry) => {
      const answer = getAnamnesisAnswerChoice(question, entry.answers?.[question.id]);
      if (question.type === "multi") {
        if (optionIdx === choiceOptions.length - 1) {
          if (Array.isArray(answer) && answer.includes(ANAMNESIS_UNKNOWN_VALUE)) total += 1;
        } else if (Array.isArray(answer) && answer.includes(optionIdx)) total += 1;
      } else if (optionIdx === choiceOptions.length - 1 ? answer === ANAMNESIS_UNKNOWN_VALUE : answer === optionIdx) {
        total += 1;
      }
    });
    return total;
  });

  return {
    respondents: responses.filter((entry) => isAnamnesisAnswerFilled(question, entry.answers?.[question.id])).length,
    totalResponses: responses.length,
    counts,
    texts: notes,
    noteResponseRate: responses.length ? Math.round((notes.length / responses.length) * 100) : 0,
    optionLabels: choiceOptions,
  };
}

function extractAnamnesisKeywords(texts = [], limit = 8) {
  const counter = new globalThis.Map();
  texts.forEach((text) => {
    normalizeAnamnesisText(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9à-ÿ]+/i)
      .map((word) => word.trim())
      .filter((word) => word.length >= 4 && !ANAMNESIS_STOPWORDS.has(word))
      .forEach((word) => {
        counter.set(word, (counter.get(word) || 0) + 1);
      });
  });
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

function isEventHidden(evento) {
  return Boolean(evento?.hiddenAt);
}

function getExecucoes(evento, teamIdx, missionId) {
  return evento.execucoes?.[`${teamIdx}__${missionId}`] || [];
}

function getTrainingRuns(evento, teamIdx) {
  return evento.trainingRuns?.[`${teamIdx}`] || [];
}

function getReflexao(evento, teamIdx, missionId) {
  return evento.reflexoes?.[`${teamIdx}__${missionId}`] || null;
}

function getQuestionarioPendenteEntry(evento, teamIdx, missionId) {
  return evento.questionariosPendentes?.[`${teamIdx}__${missionId}`] || null;
}

function isQuestionarioPendente(evento, teamIdx, missionId) {
  const pendente = getQuestionarioPendenteEntry(evento, teamIdx, missionId);
  if (!pendente) return false;
  const conclusao = getConclusaoEntry(evento, teamIdx, missionId);
  if (!conclusao) return true;
  const openedAt = toTimestamp(typeof pendente === "object" ? pendente.openedAt : 0);
  const closedAt = toTimestamp(typeof conclusao === "object" ? conclusao.closedAt || conclusao.concludedAt : 0);
  return openedAt > closedAt;
}

function getQuestionarioPendenteSource(evento, teamIdx, missionId) {
  const entry = getQuestionarioPendenteEntry(evento, teamIdx, missionId);
  if (!entry) return null;
  if (typeof entry === "string") return "facilitator";
  return entry.source || "facilitator";
}

function getConclusaoEntry(evento, teamIdx, missionId) {
  return evento.conclusoes?.[`${teamIdx}__${missionId}`] || null;
}

function isConcluida(evento, teamIdx, missionId) {
  return Boolean(getConclusaoEntry(evento, teamIdx, missionId));
}

function getConclusaoSource(evento, teamIdx, missionId) {
  const entry = getConclusaoEntry(evento, teamIdx, missionId);
  if (!entry) return null;
  if (typeof entry === "string") return "legacy";
  return entry.source || "legacy";
}

function canFacilitatorReopenMissionForTeam(evento, teamIdx, missionId) {
  const source = getConclusaoSource(evento, teamIdx, missionId);
  return source === "facilitator" || source === "facilitator_no_evaluation";
}

function getMissionClosureStatus(evento, teamIdx, missionId) {
  if (isConcluida(evento, teamIdx, missionId)) return "concluida";
  if (isQuestionarioPendente(evento, teamIdx, missionId)) return "aguardando_questionario";
  return "aberta";
}

function getFirstPendingMissionIndex(evento, teamIdx) {
  if (!evento || teamIdx === null || teamIdx === undefined) return -1;
  return (evento.missions || []).findIndex((mission) => isQuestionarioPendente(evento, teamIdx, mission.id));
}

function getMissionUsageKey(teamIdx, missionId) {
  return `${teamIdx}__${missionId}`;
}

function getMissionGlossaryKey(teamIdx, missionId) {
  return `${teamIdx}__${missionId}`;
}

function getTokenMissionId(missionId, { isTraining = false } = {}) {
  if (isTraining || missionId === TRAINING_THREAD_ID) return TOKEN_MISSION_TRAINING_ID;
  return missionId;
}

function getAnalysisMissionId(missionId, { isTraining = false } = {}) {
  if (isTraining || missionId === TRAINING_THREAD_ID || !missionId) return TRAINING_THREAD_ID;
  return missionId;
}

function getMissionGlossary(evento, teamIdx, missionId, { isTraining = false } = {}) {
  const analysisMissionId = getAnalysisMissionId(missionId, { isTraining });
  return evento?.missionGlossaries?.[getMissionGlossaryKey(teamIdx, analysisMissionId)] || [];
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

function getMissionTokenPolicy(evento, missionId, { isTraining = false } = {}) {
  const tokenMissionId = getTokenMissionId(missionId, { isTraining });
  const policy = evento?.missionTokenPolicies?.[tokenMissionId] || {};
  return {
    missionId: tokenMissionId,
    mode: policy.mode || TOKEN_POLICY_MODE_DEFAULT,
    customLimit: Number(policy.customLimit || 0) || 0,
    temporaryUnlimited: Boolean(policy.temporaryUnlimited),
    updatedAt: policy.updatedAt || null,
  };
}

function getMissionTokenBaseLimit(policy) {
  if (!policy || policy.temporaryUnlimited || policy.mode === TOKEN_POLICY_MODE_UNLIMITED) return null;
  if (policy.mode === TOKEN_POLICY_MODE_CUSTOM) {
    const customLimit = Number(policy.customLimit || 0);
    return customLimit > 0 ? customLimit : DEFAULT_MISSION_TOKEN_LIMIT;
  }
  return DEFAULT_MISSION_TOKEN_LIMIT;
}

function getMissionTokenGrants(evento, missionId, teamIdx = null, { isTraining = false } = {}) {
  const tokenMissionId = getTokenMissionId(missionId, { isTraining });
  return (evento?.tokenGrants || []).filter((grant) => {
    if (grant.missionId !== tokenMissionId) return false;
    if (grant.scope === "turma") return true;
    if (teamIdx === null || teamIdx === undefined) return false;
    return grant.teamIdx === teamIdx;
  });
}

function getMissionTokenUsage(evento, teamIdx, missionId, { isTraining = false } = {}) {
  if (!evento || teamIdx === null || teamIdx === undefined || !missionId) {
    return {
      missionId: getTokenMissionId(missionId, { isTraining }),
      promptTokens: 0,
      responseTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      analysisTokens: 0,
      analysisCost: 0,
    };
  }

  if (isTraining || missionId === TOKEN_MISSION_TRAINING_ID) {
    const trainingRuns = getTrainingRuns(evento, teamIdx);
    return trainingRuns.reduce(
      (acc, exec) => ({
        ...acc,
        promptTokens: acc.promptTokens + (exec.inputTokens || 0),
        responseTokens: acc.responseTokens + (exec.outputTokens || 0),
        totalTokens: acc.totalTokens + (exec.tokens || 0),
        totalCost: acc.totalCost + (exec.custo || 0),
        analysisTokens: acc.analysisTokens + (exec.technicalAnalysisUsage?.totalTokens || 0),
        analysisCost: acc.analysisCost + (exec.technicalAnalysisUsage?.cost || 0),
      }),
      {
        missionId: TOKEN_MISSION_TRAINING_ID,
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        analysisTokens: 0,
        analysisCost: 0,
      },
    );
  }

  const execs = getExecucoes(evento, teamIdx, missionId);
  const preservedUsage = getPreservedMissionUsage(evento, teamIdx, missionId);
  return execs.reduce(
    (acc, exec) => ({
      ...acc,
      promptTokens: acc.promptTokens + (exec.inputTokens || 0),
      responseTokens: acc.responseTokens + (exec.outputTokens || 0),
      totalTokens: acc.totalTokens + (exec.tokens || 0),
      totalCost: acc.totalCost + (exec.custo || 0),
      analysisTokens: acc.analysisTokens + (exec.technicalAnalysisUsage?.totalTokens || 0),
      analysisCost: acc.analysisCost + (exec.technicalAnalysisUsage?.cost || 0),
    }),
    {
      missionId,
      promptTokens: preservedUsage.input || 0,
      responseTokens: preservedUsage.output || 0,
      totalTokens: preservedUsage.total || 0,
      totalCost: preservedUsage.cost || 0,
      analysisTokens: preservedUsage.explanationTotal || 0,
      analysisCost: preservedUsage.explanationCost || 0,
    },
  );
}

function getEffectiveMissionTokenBudget(evento, teamIdx, missionId, options = {}) {
  const policy = getMissionTokenPolicy(evento, missionId, options);
  const grants = getMissionTokenGrants(evento, missionId, teamIdx, options);
  const baseLimit = getMissionTokenBaseLimit(policy);
  const extraTokens = grants.reduce((sum, grant) => sum + Math.max(0, Number(grant.amount || 0)), 0);
  const effectiveLimit = baseLimit === null ? null : baseLimit + extraTokens;
  const usage = getMissionTokenUsage(evento, teamIdx, missionId, options);
  return {
    missionId: policy.missionId,
    policy,
    grants,
    usage,
    extraTokens,
    baseLimit,
    effectiveLimit,
    unlimited: effectiveLimit === null,
    blocked: effectiveLimit !== null && usage.totalTokens >= effectiveLimit,
  };
}

function getMissionTokenOperationalLogs(evento, missionId, teamIdx = null, { isTraining = false } = {}) {
  const tokenMissionId = getTokenMissionId(missionId, { isTraining });
  return (evento?.tokenOperationalLogs || [])
    .filter((item) => {
      if (item.missionId !== tokenMissionId) return false;
      if (teamIdx === null || teamIdx === undefined) return true;
      return item.teamIdx === null || item.teamIdx === undefined || item.teamIdx === teamIdx;
    })
    .sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function formatTokenLimitLabel(limit) {
  if (limit === null || limit === undefined) return "Ilimitado";
  return `${Number(limit).toLocaleString("pt-BR")} tokens`;
}

function parseTokenLimitInput(value) {
  const digits = `${value || ""}`.replace(/\D/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatTokenLimitInput(value) {
  const parsed = parseTokenLimitInput(value);
  if (!parsed) return "";
  return parsed.toLocaleString("pt-BR");
}

function getHelpRequests(evento, teamIdx, missionId) {
  return (evento.helpRequests || []).filter((request) => request.teamIdx === teamIdx && request.missionId === missionId);
}

function getTrainingHelpRequests(evento, teamIdx = null) {
  return (evento.trainingHelpRequests || []).filter((request) => teamIdx === null || request.teamIdx === teamIdx);
}

function getTrainingTokenRequests(evento, teamIdx = null) {
  return (evento.helpRequests || []).filter(
    (request) =>
      request.missionId === TOKEN_MISSION_TRAINING_ID &&
      (teamIdx === null || request.teamIdx === teamIdx),
  );
}

function isHelpDisabledForTeam(evento, teamIdx) {
  if (!evento || teamIdx === null || teamIdx === undefined) return false;
  return Boolean(evento.helpDisabledMap?.[teamIdx]?.disabled);
}

function getEventAnnouncements(evento) {
  const directAnnouncements = Array.isArray(evento?.announcements) ? evento.announcements : [];
  const legacyAnnouncement =
    directAnnouncements.length === 0 && evento?.announcement?.message?.trim()
      ? [
          {
            ...evento.announcement,
            id: evento.announcement.id || `announcement_legacy_${evento.id || Date.now()}`,
            createdAt: evento.announcement.createdAt || new Date().toISOString(),
            message: evento.announcement.message.trim(),
            dismissedBy: evento.announcement.dismissedBy || {},
            readBy: evento.announcement.readBy || {},
          },
        ]
      : [];

  return [...directAnnouncements, ...legacyAnnouncement]
    .map((announcement) => ({
      ...announcement,
      message: `${announcement.message || ""}`.trim(),
      createdAt: announcement.createdAt || new Date().toISOString(),
      dismissedBy: announcement.dismissedBy || {},
      readBy: announcement.readBy || {},
    }))
    .filter((announcement) => announcement.message)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function getUnreadAnnouncementsForTeam(evento, teamIdx) {
  if (teamIdx === null || teamIdx === undefined) return [];
  return getEventAnnouncements(evento).filter((announcement) => !announcement.readBy?.[teamIdx]);
}

function getLatestUnreadAnnouncementForTeam(evento, teamIdx) {
  const unread = getUnreadAnnouncementsForTeam(evento, teamIdx);
  return unread.length ? unread[unread.length - 1] : null;
}

function isAnnouncementDismissedForTeam(evento, teamIdx, announcementId) {
  if (teamIdx === null || teamIdx === undefined || !announcementId) return false;
  const announcement = getEventAnnouncements(evento).find((item) => item.id === announcementId);
  if (!announcement) return false;
  return Boolean(announcement.dismissedBy?.[teamIdx]);
}

function getSessionTimer(evento) {
  return {
    active: false,
    startedAt: null,
    endsAt: null,
    durationMs: 0,
    ...(evento?.sessionTimer || {}),
  };
}

function getSessionTimerNotice(evento, now = Date.now()) {
  const notice = evento?.sessionTimerNotice;
  if (!notice?.message || !notice?.createdAt || notice.dismissedAt) return null;
  const age = now - new Date(notice.createdAt).getTime();
  if (age >= TIMER_NOTICE_TTL_MS) return null;
  return {
    ...notice,
    expiresInMs: Math.max(0, TIMER_NOTICE_TTL_MS - age),
  };
}

function getSessionTimerRemainingMs(evento, now = Date.now()) {
  const timer = getSessionTimer(evento);
  if (!timer.active || !timer.endsAt) return 0;
  return Math.max(0, new Date(timer.endsAt).getTime() - now);
}

function isSessionTimerRunning(evento, now = Date.now()) {
  const timer = getSessionTimer(evento);
  return Boolean(timer.active && timer.endsAt && getSessionTimerRemainingMs(evento, now) > 0);
}

function isSessionTimerExpired(evento, now = Date.now()) {
  const timer = getSessionTimer(evento);
  return Boolean(timer.active && timer.endsAt && getSessionTimerRemainingMs(evento, now) <= 0);
}

function isSessionTimerLockActive(evento, now = Date.now()) {
  const timer = getSessionTimer(evento);
  if (!timer.active || !timer.endsAt) return false;
  const endsAtMs = new Date(timer.endsAt).getTime();
  if (endsAtMs > now) return false;
  return now - endsAtMs < TIMER_LOCK_TTL_MS;
}

function formatCountdown(ms = 0) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function parseTimerInputToMs(rawValue) {
  const value = `${rawValue || ""}`.trim();
  if (!value) return null;
  const mmssMatch = value.match(/^(\d{1,3}):([0-5]\d)$/);
  if (mmssMatch) {
    const minutes = Number(mmssMatch[1]);
    const seconds = Number(mmssMatch[2]);
    const totalMs = (minutes * 60 + seconds) * 1000;
    return totalMs > 0 ? totalMs : null;
  }
  const asMinutes = Number(value);
  if (!Number.isFinite(asMinutes) || asMinutes <= 0) return null;
  return Math.round(asMinutes * 60 * 1000);
}

function getEventStudentOptions(evento) {
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

function isPresenceLive(presence) {
  if (!presence?.lastSeenAt) return false;
  return Date.now() - new Date(presence.lastSeenAt).getTime() < PRESENCE_STALE_MS;
}

function getOpenHelpRequests(evento) {
  return getEventMode(evento) === TRAINING_MODE_EVENT
    ? [...getTrainingHelpRequests(evento), ...getTrainingTokenRequests(evento)].filter((request) => request.status === "open")
    : (evento.helpRequests || []).filter((request) => request.status === "open");
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

function extractPromptFeatures(text) {
  const prompt = (text || "").trim();
  const normalized = prompt.toLowerCase();
  return {
    prompt,
    tooShort: prompt.length < 50,
    hasStructure: /[\n:;-]/.test(prompt),
    hasGoalVerb: /(resuma|analise|classifique|gere|crie|compare|liste|explique|avalie|descreva|organize|reescreva|priorize|sugira)/i.test(prompt),
    hasContext: /(contexto|empresa|cliente|time|dados|tabela|documento|sistema|reuni[aã]o|cen[aá]rio|objetivo|problema)/i.test(prompt),
    asksFormat: /(em t[oó]picos|em tabela|formato|em lista|passo a passo|bullet|markdown|colunas|json)/i.test(prompt),
    mixedRequests: /\be\b.*\be\b/i.test(normalized) || /,.*?,.*?,/.test(prompt),
    vague: !/(quem|para|com base|use|considere|objetivo|formato|crit[eé]rio|limite)/i.test(prompt),
  };
}

function analyzePromptQuality({ exec, mission }) {
  const features = extractPromptFeatures(exec.input);
  const strengths = [];
  const watchouts = [];

  if (features.hasGoalVerb) strengths.push("deixou claro o que a IA deveria fazer");
  else watchouts.push("o pedido não explicita bem a operação esperada");

  if (features.hasContext) strengths.push("trouxe contexto suficiente para orientar a resposta");
  else watchouts.push("faltou contexto para a IA entender o cenário");

  if (features.asksFormat) strengths.push("definiu um formato de saída útil");
  else watchouts.push("não definiu como a resposta deveria voltar");

  if (features.hasStructure) strengths.push("organizou o pedido de forma legível");
  else watchouts.push("o prompt pode ficar mais estruturado visualmente");

  if (features.tooShort) watchouts.push("o prompt está curto demais para reduzir ambiguidades");
  if (features.mixedRequests) watchouts.push("misturou objetivos demais numa única instrução");
  if (features.vague) watchouts.push("há termos vagos que deixam a intenção aberta");

  const actionHint = exec.isFreeInstruction ? "objetivo" : `ação (${getActionLabel(exec.acao)})`;
  const rewriteSuggestion = [
    `Contexto: ${features.hasContext ? "use o contexto central já citado" : "descreva rapidamente o cenário e o material disponível"}.`,
    `Pedido: explicite o ${actionHint}.`,
    `Saída: ${features.asksFormat ? "mantenha o formato pedido" : "diga em que formato a resposta deve vir"}.`,
  ].join(" ");

  const teachingNote = strengths.length
    ? "Quando o prompt define contexto, tarefa e formato, a resposta tende a ficar mais aproveitável."
    : "Antes de buscar uma resposta melhor, vale tornar o pedido mais concreto e menos ambíguo.";

  return {
    strengths: strengths.slice(0, 3),
    watchouts: watchouts.slice(0, 3),
    rewriteSuggestion,
    teachingNote,
  };
}

function getPromptInsightEntries(evento) {
  if (getEventMode(evento) === TRAINING_MODE_EVENT) {
    const entries = [];
    Object.entries(evento.trainingRuns || {}).forEach(([teamIdxRaw, execs]) => {
      const teamIdx = Number(teamIdxRaw);
      const team = evento.teams?.[teamIdx];
      (execs || []).forEach((exec, index) => {
        entries.push({
          id: `training-${teamIdxRaw}-${exec.id || exec.ts || index}`,
          key: `training__${teamIdxRaw}`,
          teamIdx,
          teamName: team?.name || `Time ${teamIdx + 1}`,
          missionId: TRAINING_THREAD_ID,
          missionName: TRAINING_MISSION.name,
          missionNum: null,
          actionLabel: getActionLabel(exec.acao),
          ts: exec.ts,
          prompt: exec.input || "",
          output: exec.output || "",
          analysis: analyzePromptQuality({ exec, mission: TRAINING_MISSION }),
        });
      });
    });
    return entries.sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
  }

  const entries = [];
  Object.entries(evento.execucoes || {}).forEach(([key, execs]) => {
    const [teamIdxRaw, missionId] = key.split("__");
    const teamIdx = Number(teamIdxRaw);
    const team = evento.teams?.[teamIdx];
    const mission = evento.missions?.find((item) => item.id === missionId);
    (execs || []).forEach((exec, index) => {
      entries.push({
        id: `${key}-${exec.ts || index}`,
        key,
        teamIdx,
        teamName: team?.name || `Time ${teamIdx + 1}`,
        missionId,
        missionName: mission?.name || missionId,
        missionNum: mission?.num || null,
        actionLabel: getActionLabel(exec.acao),
        ts: exec.ts,
        prompt: exec.input || "",
        output: exec.output || "",
        analysis: analyzePromptQuality({ exec, mission }),
      });
    });
  });
  return entries.sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
}

function summarizePromptPatterns(entries, side) {
  const counter = new globalThis.Map();
  entries.forEach((entry) => {
    (entry.analysis?.[side] || []).forEach((item) => {
      counter.set(item, (counter.get(item) || 0) + 1);
    });
  });
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([text, count]) => ({ text, count }));
}

function truncatePromptSnippet(text, max = 140) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Sem prompt registrado.";
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}...`;
}

function groupPromptInsightsByObservation(entries, side) {
  const grouped = new globalThis.Map();
  entries.forEach((entry) => {
    (entry.analysis?.[side] || []).forEach((item) => {
      if (!grouped.has(item)) {
        grouped.set(item, new globalThis.Map());
      }
      const participants = grouped.get(item);
      if (!participants.has(entry.teamName)) {
        participants.set(entry.teamName, {
          id: entry.teamName,
          teamName: entry.teamName,
          actionLabel: entry.actionLabel,
          prompt: truncatePromptSnippet(entry.prompt, 84),
        });
      }
    });
  });
  return [...grouped.entries()].map(([text, participants]) => ({
    text,
    participants: [...participants.values()],
  }));
}

function getLatestTrainingRun(evento, teamIdx) {
  const runs = getTrainingRuns(evento, teamIdx);
  if (!runs.length) return null;
  return [...runs].sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0))[0];
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
  const response = await fetch(`/api/config?ts=${Date.now()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Falha ao carregar configuração do servidor.");
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

function getFileExtension(name = "") {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

function getMissionAiMode(mission) {
  return mission?.aiMode === CODING_AI_MODE ? CODING_AI_MODE : CHAT_AI_MODE;
}

function normalizeMission(mission) {
  return {
    ...mission,
    aiMode: getMissionAiMode(mission),
  };
}

function toTimestamp(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function mergeRecordArraysById(remoteItems = [], localItems = [], candidateFields = ["updatedAt", "submittedAt", "resolvedAt", "cancelledAt", "createdAt", "ts"]) {
  const merged = new globalThis.Map();
  [...remoteItems, ...localItems].forEach((item) => {
    if (!item?.id) return;
    const previous = merged.get(item.id);
    if (!previous) {
      merged.set(item.id, item);
      return;
    }
    merged.set(item.id, pickLatestByTimestamp(previous, item, candidateFields));
  });
  return [...merged.values()];
}

function mergeObjectMaps(remoteMap = {}, localMap = {}, pickValue) {
  const keys = new Set([...Object.keys(remoteMap || {}), ...Object.keys(localMap || {})]);
  return Object.fromEntries(
    [...keys].map((key) => {
      const remoteValue = remoteMap?.[key];
      const localValue = localMap?.[key];
      return [key, pickValue ? pickValue(remoteValue, localValue) : localValue ?? remoteValue];
    }),
  );
}

function mergeExecucaoMaps(remoteMap = {}, localMap = {}) {
  const keys = new Set([...Object.keys(remoteMap || {}), ...Object.keys(localMap || {})]);
  return Object.fromEntries(
    [...keys].map((key) => {
      const mergedRuns = mergeRecordArraysById(remoteMap?.[key] || [], localMap?.[key] || [], ["ts"]);
      mergedRuns.sort((a, b) => toTimestamp(a.ts) - toTimestamp(b.ts));
      return [key, mergedRuns];
    }),
  );
}

function pickLatestByTimestamp(remoteValue, localValue, candidateFields = []) {
  if (!remoteValue) return localValue;
  if (!localValue) return remoteValue;

  const remoteTs = Math.max(...candidateFields.map((field) => toTimestamp(remoteValue?.[field])), 0);
  const localTs = Math.max(...candidateFields.map((field) => toTimestamp(localValue?.[field])), 0);

  if (localTs >= remoteTs) return { ...remoteValue, ...localValue };
  return { ...localValue, ...remoteValue };
}

function mergePresenceMaps(remoteMap = {}, localMap = {}) {
  return mergeObjectMaps(remoteMap, localMap, (remoteValue, localValue) =>
    pickLatestByTimestamp(remoteValue, localValue, ["lastSeenAt"]),
  );
}

function mergeAnnouncements(remoteItems = [], localItems = []) {
  const merged = new globalThis.Map();
  [...remoteItems, ...localItems].forEach((item) => {
    if (!item?.id) return;
    const previous = merged.get(item.id) || {};
    merged.set(item.id, {
      ...previous,
      ...item,
      dismissedBy: {
        ...(previous.dismissedBy || {}),
        ...(item.dismissedBy || {}),
      },
      readBy: {
        ...(previous.readBy || {}),
        ...(item.readBy || {}),
      },
    });
  });
  return [...merged.values()].sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function mergeHelpRequestArrays(remoteItems = [], localItems = []) {
  const merged = mergeRecordArraysById(remoteItems, localItems, ["resolvedAt", "cancelledAt", "updatedAt", "createdAt"]);
  return merged.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function mergeTokenPolicies(remotePolicies = {}, localPolicies = {}) {
  return mergeObjectMaps(remotePolicies, localPolicies, (remoteValue, localValue) =>
    pickLatestByTimestamp(remoteValue, localValue, ["updatedAt"]),
  );
}

function mergeTokenGrants(remoteItems = [], localItems = []) {
  const merged = mergeRecordArraysById(remoteItems, localItems, ["updatedAt", "createdAt"]);
  return merged.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function mergeTokenOperationalLogs(remoteItems = [], localItems = []) {
  const merged = mergeRecordArraysById(remoteItems, localItems, ["createdAt", "updatedAt"]);
  return merged.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function mergeMissionGlossaries(remoteGlossaries = {}, localGlossaries = {}) {
  const keys = new Set([...Object.keys(remoteGlossaries || {}), ...Object.keys(localGlossaries || {})]);
  const merged = {};
  keys.forEach((key) => {
    merged[key] = mergeGlossaryEntries(remoteGlossaries?.[key] || [], localGlossaries?.[key] || []);
  });
  return merged;
}

function mergeScreenShareState(remoteState = {}, localState = {}) {
  return pickLatestByTimestamp(remoteState, localState, ["startedAt", "endedAt"]);
}

function mergeTimerNotice(remoteNotice, localNotice) {
  return pickLatestByTimestamp(remoteNotice, localNotice, ["createdAt"]);
}

function mergeEventEntity(remoteEvent, localEvent) {
  if (!remoteEvent) return localEvent;
  if (!localEvent) return remoteEvent;

  const remoteUpdatedAt = toTimestamp(remoteEvent.updatedAt || remoteEvent.createdAt);
  const localUpdatedAt = toTimestamp(localEvent.updatedAt || localEvent.createdAt);
  const newestEvent = localUpdatedAt >= remoteUpdatedAt ? localEvent : remoteEvent;
  const oldestEvent = newestEvent === localEvent ? remoteEvent : localEvent;

  return {
    ...oldestEvent,
    ...newestEvent,
    teams: newestEvent.teams || oldestEvent.teams || [],
    missions: newestEvent.missions || oldestEvent.missions || [],
    execucoes: mergeExecucaoMaps(remoteEvent.execucoes, localEvent.execucoes),
    reflexoes: mergeObjectMaps(remoteEvent.reflexoes, localEvent.reflexoes, (remoteValue, localValue) =>
      pickLatestByTimestamp(remoteValue, localValue, ["submittedAt", "ts"]),
    ),
    questionariosPendentes: mergeObjectMaps(remoteEvent.questionariosPendentes, localEvent.questionariosPendentes, (remoteValue, localValue) =>
      pickLatestByTimestamp(remoteValue, localValue, ["openedAt"]),
    ),
    conclusoes: mergeObjectMaps(remoteEvent.conclusoes, localEvent.conclusoes, (remoteValue, localValue) =>
      pickLatestByTimestamp(remoteValue, localValue, ["closedAt", "concludedAt"]),
    ),
    preservedMissionUsage: {
      ...(remoteEvent.preservedMissionUsage || {}),
      ...(localEvent.preservedMissionUsage || {}),
    },
    missionGlossaries: mergeMissionGlossaries(remoteEvent.missionGlossaries, localEvent.missionGlossaries),
    missionTokenPolicies: mergeTokenPolicies(remoteEvent.missionTokenPolicies, localEvent.missionTokenPolicies),
    tokenGrants: mergeTokenGrants(remoteEvent.tokenGrants, localEvent.tokenGrants),
    tokenOperationalLogs: mergeTokenOperationalLogs(remoteEvent.tokenOperationalLogs, localEvent.tokenOperationalLogs),
    helpRequests: mergeHelpRequestArrays(remoteEvent.helpRequests, localEvent.helpRequests),
    helpDisabledMap: mergeObjectMaps(remoteEvent.helpDisabledMap, localEvent.helpDisabledMap, (remoteValue, localValue) =>
      pickLatestByTimestamp(remoteValue, localValue, ["updatedAt"]),
    ),
    anamnesisEnabled: newestEvent.anamnesisEnabled ?? oldestEvent.anamnesisEnabled ?? false,
    anamnesisResponses: mergeObjectMaps(
      remoteEvent.anamnesisResponses,
      localEvent.anamnesisResponses,
      (remoteValue, localValue) => pickLatestByTimestamp(remoteValue, localValue, ["submittedAt", "updatedAt"]),
    ),
    trainingRuns: mergeExecucaoMaps(remoteEvent.trainingRuns, localEvent.trainingRuns),
    trainingHelpRequests: mergeHelpRequestArrays(remoteEvent.trainingHelpRequests, localEvent.trainingHelpRequests),
    announcements: mergeAnnouncements(getEventAnnouncements(remoteEvent), getEventAnnouncements(localEvent)),
    presenceMap: mergePresenceMaps(remoteEvent.presenceMap, localEvent.presenceMap),
    sessionTimer: pickLatestByTimestamp(remoteEvent.sessionTimer, localEvent.sessionTimer, ["startedAt", "endsAt"]),
    sessionTimerNotice: mergeTimerNotice(remoteEvent.sessionTimerNotice, localEvent.sessionTimerNotice),
    screenShare: mergeScreenShareState(remoteEvent.screenShare, localEvent.screenShare),
    updatedAt: newestEvent.updatedAt || oldestEvent.updatedAt || new Date().toISOString(),
    createdAt: remoteEvent.createdAt || localEvent.createdAt || newestEvent.createdAt || oldestEvent.createdAt || new Date().toISOString(),
  };
}

function mergeEventCollections(remoteEvents = [], localEvents = []) {
  const mergedById = new globalThis.Map();
  [...remoteEvents, ...localEvents].forEach((event) => {
    if (!event?.id) return;
    const previous = mergedById.get(event.id);
    mergedById.set(event.id, mergeEventEntity(previous, event));
  });
  return [...mergedById.values()].sort((a, b) => toTimestamp(a.createdAt || a.updatedAt) - toTimestamp(b.createdAt || b.updatedAt));
}

function stampUpdatedEvents(previousEvents = [], nextEvents = []) {
  const previousById = new globalThis.Map(previousEvents.map((event) => [event.id, event]));
  const now = new Date().toISOString();
  return nextEvents.map((event) => {
    const previous = previousById.get(event.id);
    if (!previous) {
      return {
        ...event,
        createdAt: event.createdAt || now,
        updatedAt: now,
      };
    }
    const previousSerialized = JSON.stringify(previous);
    const nextSerialized = JSON.stringify(event);
    return {
      ...event,
      createdAt: previous.createdAt || event.createdAt || now,
      updatedAt: previousSerialized === nextSerialized ? previous.updatedAt || event.updatedAt || now : now,
    };
  });
}

function isFixedMissionsEvent(event) {
  if (event?.missionTemplate !== FIXED_MISSION_TEMPLATE) return false;
  const currentMissionIds = buildFixedMissionList().map((mission) => mission.id);
  const eventMissionIds = (event?.missions || []).map((mission) => mission?.id).filter(Boolean);
  if (eventMissionIds.length !== currentMissionIds.length) return false;
  return currentMissionIds.every((missionId, index) => eventMissionIds[index] === missionId);
}

function buildFixedMissionList() {
  return FIXED_MISSIONS_CATALOG.map((mission, index) => ({
    ...normalizeMission(mission),
    unlocked: index === 0,
  }));
}

function buildCanonicalFixedMissionList(event) {
  const currentMissionsById = new globalThis.Map((event?.missions || []).map((mission) => [mission.id, mission]));
  return buildFixedMissionList().map((mission, index) => {
    const savedMission = currentMissionsById.get(mission.id);
    if (!savedMission) return mission;
    return {
      ...mission,
      unlocked: typeof savedMission.unlocked === "boolean" ? savedMission.unlocked : index === 0,
      aiMode: getMissionAiMode(savedMission),
    };
  });
}

function migrateEventToFixedMissions(event) {
  if (!event) return event;

  const announcements = getEventAnnouncements(event);
  const baseEvent = {
    ...event,
    announcements,
    announcement: null,
    sessionTimerNotice: event.sessionTimerNotice || null,
    missionGlossaries: event.missionGlossaries || {},
    missionTokenPolicies: event.missionTokenPolicies || {},
    tokenGrants: event.tokenGrants || [],
    tokenOperationalLogs: event.tokenOperationalLogs || [],
    anamnesisEnabled: Boolean(event.anamnesisEnabled),
    anamnesisResponses: event.anamnesisResponses || {},
  };

  if (getEventMode(baseEvent) !== MISSIONS_MODE_EVENT) {
    return baseEvent;
  }

  const alreadyCanonical = isFixedMissionsEvent(baseEvent);
  return {
    ...baseEvent,
    missionTemplate: FIXED_MISSION_TEMPLATE,
    legacyMissionArchive: alreadyCanonical
      ? baseEvent.legacyMissionArchive || null
      : baseEvent.legacyMissionArchive || {
          migratedAt: new Date().toISOString(),
          missions: baseEvent.missions || [],
          execucoes: baseEvent.execucoes || {},
          reflexoes: baseEvent.reflexoes || {},
          questionariosPendentes: baseEvent.questionariosPendentes || {},
          conclusoes: baseEvent.conclusoes || {},
          preservedMissionUsage: baseEvent.preservedMissionUsage || {},
          helpRequests: baseEvent.helpRequests || [],
          helpDisabledMap: baseEvent.helpDisabledMap || {},
        },
    missions: buildCanonicalFixedMissionList(baseEvent),
    execucoes: alreadyCanonical ? baseEvent.execucoes || {} : {},
    reflexoes: alreadyCanonical ? baseEvent.reflexoes || {} : {},
    questionariosPendentes: alreadyCanonical ? baseEvent.questionariosPendentes || {} : {},
    conclusoes: alreadyCanonical ? baseEvent.conclusoes || {} : {},
    preservedMissionUsage: alreadyCanonical ? baseEvent.preservedMissionUsage || {} : {},
    missionGlossaries: alreadyCanonical ? baseEvent.missionGlossaries || {} : {},
    helpRequests: alreadyCanonical ? baseEvent.helpRequests || [] : [],
    helpDisabledMap: alreadyCanonical ? baseEvent.helpDisabledMap || {} : {},
  };
}

function normalizeEventsForProduct(events = []) {
  return events.map((event) => migrateEventToFixedMissions(event));
}

function classifyAttachment(file) {
  const ext = getFileExtension(file.name);
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "image";
  if (["txt", "md", "csv"].includes(ext)) return "text";
  if (["pdf", "docx"].includes(ext)) return "document";
  return "unsupported";
}

function formatAttachmentSize(bytes = 0) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function normalizeAttachmentText(text = "") {
  return text.replace(/\r/g, "").trim();
}

function truncateAttachmentText(text = "", max = MAX_ATTACHMENT_TEXT_CHARS) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[trecho truncado para caber no contexto]`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const base64 = raw.includes(",") ? raw.split(",")[1] : raw;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function extractDocumentAttachmentText(file) {
  const contentBase64 = await readFileAsBase64(file);
  return extractDocumentAttachmentTextFromBase64(file.name, contentBase64);
}

async function extractDocumentAttachmentTextFromBase64(fileName, contentBase64) {
  const response = await fetch("/api/attachments/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      contentBase64,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Falha ao extrair ${file.name}`);
  }

  const data = await response.json();
  return truncateAttachmentText(normalizeAttachmentText(data.text || ""));
}

function canSendAttachmentDirectlyToOpenAI(fileName = "") {
  return getFileExtension(fileName) === "pdf";
}

function sanitizeAttachmentsForStorage(attachments = []) {
  return attachments.map(({ openAiFileBase64, openAiMimeType, openAiDirectFile, ...attachment }) => attachment);
}

async function createAttachmentRecord(file) {
  const kind = classifyAttachment(file);
  if (kind === "unsupported") {
    throw new Error(`${file.name}: tipo de arquivo não suportado.`);
  }

  const base = {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    sizeLabel: formatAttachmentSize(file.size),
    extension: getFileExtension(file.name),
    kind,
  };

  if (kind === "image") {
    return {
      ...base,
      previewMode: "image",
      dataUrl: await readFileAsDataUrl(file),
      summary: "Imagem anexada para análise visual.",
    };
  }

  if (kind === "text") {
    const text = truncateAttachmentText(normalizeAttachmentText(await file.text()));
    return {
      ...base,
      previewMode: "text",
      extractedText: text,
      summary: "Texto extraído e enviado junto da rodada.",
    };
  }

  if (kind === "document") {
    const contentBase64 = await readFileAsBase64(file);
    const canSendDirectly = canSendAttachmentDirectlyToOpenAI(file.name);
    const directFileFields = canSendDirectly
      ? {
          openAiDirectFile: true,
          openAiMimeType: file.type || "application/pdf",
          openAiFileBase64: contentBase64,
        }
      : {};
    try {
      const text = await extractDocumentAttachmentTextFromBase64(file.name, contentBase64);
      if (text) {
        return {
          ...base,
          ...directFileFields,
          previewMode: "text",
          extractedText: text,
          summary: "Texto extraído do documento e enviado junto da rodada.",
        };
      }
      throw new Error(`${file.name}: não foi possível extrair texto do documento.`);
    } catch (error) {
      console.warn(`Falha ao extrair ${file.name}:`, error);
      return {
        ...base,
        ...directFileFields,
        previewMode: "metadata",
        extractedText: "",
        extractionFailed: !canSendDirectly,
        summary: canSendDirectly
          ? "PDF anexado e enviado diretamente para a IA."
          : "Documento anexado sem leitura automática de conteúdo.",
        warningMessage: canSendDirectly
          ? ""
          : `${file.name}: o documento foi anexado, mas a leitura automática falhou. Só os metadados seguirão para a IA nesta rodada.`,
      };
    }
  }

  return {
    ...base,
    previewMode: "metadata",
    extractedText: "",
    summary: "Arquivo anexado sem extração automática de texto nesta versão.",
  };
}

function buildAttachmentContext(attachments = []) {
  const textBlocks = attachments
    .filter((attachment) => attachment.extractedText)
    .map(
      (attachment, index) =>
        `Arquivo ${index + 1}: ${attachment.name}\nConteúdo extraído:\n${attachment.extractedText}`,
    );

  const metadataBlocks = attachments
    .filter((attachment) => attachment.kind === "document" && !attachment.extractedText && !attachment.openAiDirectFile)
    .map(
      (attachment, index) =>
        `Arquivo ${index + 1}: ${attachment.name} (${attachment.extension.toUpperCase()}, ${attachment.sizeLabel})\nObservação: o arquivo foi anexado, mas o conteúdo não pôde ser lido automaticamente. Só os metadados seguem para a IA nesta rodada.`,
    );

  return [...textBlocks, ...metadataBlocks].join("\n\n");
}

function buildAttachmentSummary(attachments = []) {
  if (!attachments.length) return "";
  const labels = attachments.map((attachment) => attachment.name);
  return `Anexos: ${labels.join(", ")}`;
}

function buildUserMessageContent(input, attachments = []) {
  const attachmentContext = buildAttachmentContext(attachments);
  const textPart = attachmentContext
    ? `${input || "Considere os anexos desta rodada."}\n\nArquivos anexados para contexto:\n${attachmentContext}`
    : input;

  const images = attachments.filter((attachment) => attachment.kind === "image" && attachment.dataUrl);
  const directFiles = attachments.filter(
    (attachment) => attachment.kind === "document" && attachment.openAiDirectFile && attachment.openAiFileBase64,
  );
  if (!images.length && !directFiles.length) return textPart;

  return [
    { type: "text", text: textPart || "Considere os anexos desta rodada." },
    ...directFiles.map((attachment) => ({
      type: "input_file",
      filename: attachment.name,
      file_data: `data:${attachment.openAiMimeType || "application/pdf"};base64,${attachment.openAiFileBase64}`,
    })),
    ...images.map((attachment) => ({
      type: "image_url",
      image_url: { url: attachment.dataUrl },
    })),
  ];
}

function buildResponsesApiInput(input, attachments = []) {
  const content = buildUserMessageContent(input, attachments);
  if (Array.isArray(content)) {
    return [
      {
        role: "user",
        content: content.map((item) =>
          item.type === "image_url"
            ? {
                type: "input_image",
                image_url: item.image_url?.url,
              }
            : item.type === "input_file"
              ? {
                  type: "input_file",
                  filename: item.filename || "anexo.pdf",
                  file_data: item.file_data || "",
                }
            : {
                type: "input_text",
                text: item.text || "",
              },
        ),
      },
    ];
  }

  return [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: content || "Considere a mensagem enviada nesta rodada.",
        },
      ],
    },
  ];
}

function buildHistoryContext(execs) {
  return execs.slice(-3).map((exec, index) => ({
    ordem: index + 1,
    acao: exec.isFreeInstruction ? "Instrucao livre" : getActionLabel(exec.acao),
    input: exec.input,
    anexos: buildAttachmentSummary(exec.attachments || []),
    output: exec.output,
  }));
}

function buildHistorySignal(historyContext) {
  if (!historyContext.length) return "Esta resposta foi gerada como uma primeira rodada desta missao.";
  return `Esta resposta considerou ${historyContext.length} execu${historyContext.length === 1 ? "cao anterior" : "coes anteriores"} desta missao.`;
}

function isMeaningfulAnalysisText(value) {
  const normalized = `${value || ""}`.trim();
  if (!normalized) return false;
  return normalized.toLowerCase() !== ANALYSIS_NOT_APPLICABLE.toLowerCase();
}

function normalizeAnalysisItemArray(value) {
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

function normalizeGlossaryEntries(entries = []) {
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

function mergeGlossaryEntries(existingEntries = [], nextEntries = []) {
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

function buildTechnicalAnalysisFallbackBlocks() {
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

function normalizeTechnicalAnalysis(details = {}, { historyContext = [], accumulatedGlossary = [] } = {}) {
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

function getTechnicalAnalysisLeadText(technicalAnalysis = {}) {
  return (
    technicalAnalysis.objectiveInterpreted ||
    technicalAnalysis.unavailableReason ||
    technicalAnalysis.promptReading?.explicit?.find(isMeaningfulAnalysisText) ||
    ANALYSIS_NOT_APPLICABLE
  );
}

function getTechnicalAnalysisReasoningSummary(technicalAnalysis = {}) {
  return (
    technicalAnalysis.strategyUsed ||
    technicalAnalysis.chainOfThought?.strategyChosen?.find(isMeaningfulAnalysisText) ||
    technicalAnalysis.unavailableReason ||
    ANALYSIS_NOT_APPLICABLE
  );
}

function isFreeInstructionAction(acao) {
  return acao === FREE_ACTION_KEY;
}

function getActionLabel(acao) {
  return isFreeInstructionAction(acao) ? FREE_ACTION_LABEL : acao || "-";
}

function modelSupportsReasoning(model = "") {
  return /^gpt-5/i.test(model) || /^o[134]/i.test(model);
}

function resolvePlanningRuntime(model, planningMode = "off") {
  if (planningMode !== "on") {
    return {
      requestModel: model,
      reasoningEffort: undefined,
      planningModeReal: false,
      planningResolution: "off",
    };
  }

  if (modelSupportsReasoning(model)) {
    return {
      requestModel: model,
      reasoningEffort: "medium",
      planningModeReal: true,
      planningResolution: "reasoning-medium",
    };
  }

  return {
    requestModel: model,
    reasoningEffort: undefined,
    planningModeReal: true,
    planningResolution: "prompt-only",
  };
}

function buildPromptApplied({ mission, acao, historyContext, planningMode = "off" }) {
  const historyBlock = historyContext.length
    ? `\n\nContexto anterior desta missao:\n${historyContext
        .map(
          (item) =>
            `Rodada ${item.ordem}\nAcao: ${item.acao}\nInput: ${item.input}${item.anexos ? `\n${item.anexos}` : ""}\nResposta: ${item.output}`,
        )
        .join("\n\n")}`
    : "";
  const actionBlock = isFreeInstructionAction(acao)
    ? "Diretriz da rodada: o time escreveu a propria instrucao livremente, sem usar uma acao rapida predefinida."
    : `Acao selecionada: ${getActionLabel(acao)}.`;
  const aiMode = getMissionAiMode(mission);
  const systemPrompt = getSystemPrompt(aiMode, planningMode);
  return [systemPrompt, actionBlock]
    .filter(Boolean)
    .join("\n\n")
    .concat(historyBlock);
}

function buildConceptSummary(mission) {
  return (MISSION_CONCEPTS[mission.id] || []).map((concept) => concept.name).join(", ");
}

function buildTechnicalTerms(mission) {
  const aiMode = getMissionAiMode(mission);
  const missionSpecific = {
    mission_general_chat: [
      { term: "Compressao semantica", meaning: "reduzir o texto preservando a intencao central e descartando redundancias." },
      { term: "Saliência", meaning: "dar mais peso aos trechos com maior densidade de decisao ou informacao." },
      { term: "Condicionamento por prompt", meaning: "usar a instrucao da missao para definir tom, estrutura e nivel de concisao." },
    ],
    mission_programming_coding: [
      { term: "Debugging orientado por hipótese", meaning: "isolar a causa provável de um problema antes de alterar código ou arquitetura." },
      { term: "Refatoração incremental", meaning: "melhorar estrutura e legibilidade sem mudar o comportamento esperado da solução." },
      { term: "Trade-off técnico", meaning: "explicar o custo, o risco e o benefício das decisões de implementação." },
    ],
  };

  if (missionSpecific[mission.id]) return missionSpecific[mission.id];
  return aiMode === CODING_AI_MODE
    ? [
        { term: "Tokenização contextual", meaning: "quebrar o pedido e os trechos de código em unidades que o modelo usa para analisar dependências e padrões." },
        { term: "Atenção sobre dependências", meaning: "priorizar linhas, funções e sinais do prompt que mais influenciam a correção ou arquitetura proposta." },
        { term: "Decisão de implementação", meaning: "escolher o caminho mais seguro e reproduzível diante de contexto incompleto ou ambíguo." },
      ]
    : [
        { term: "Tokenizacao", meaning: "quebrar entrada e saida em unidades que o modelo usa para processar linguagem." },
        { term: "Predicao do proximo token", meaning: "escolher iterativamente a proxima parte da resposta com base no contexto anterior." },
        { term: "Atenção", meaning: "priorizar partes do input e do prompt que mais influenciam a saida final." },
      ];
}

function buildAlternativeAnswerPaths({ mission, acao, freeInstruction }) {
  if (mission.id === "mission_general_chat") {
    return [
      "um resumo mais executivo, com menos contexto e mais decisoes",
      "uma lista de pontos principais, preservando mais granularidade",
      "um plano de acao, se a instrucao pedisse saida orientada a proximo passo",
    ];
  }
  if (getMissionAiMode(mission) === CODING_AI_MODE) {
    return [
      "uma resposta mais orientada a correção imediata, com patch direto no código",
      "uma resposta mais arquitetural, explicando trade-offs antes de codar",
      "uma resposta mais didática, com exemplo mínimo reproduzível antes da solução final",
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
  const aiMode = getMissionAiMode(mission);
  const missionHint =
    mission.id === "mission_general_chat"
      ? "Se quiser um resumo melhor, marque o que e central, o que pode ser cortado e para quem o material sera entregue."
      : aiMode === CODING_AI_MODE
        ? "Se quiser um resultado técnico melhor, diga ambiente, erro observado, código atual e o comportamento esperado."
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
  const aiMode = getMissionAiMode(mission);
  const mechanismSummary =
    mission.id === "mission_general_chat"
      ? "A IA tratou seu pedido como uma tarefa de compressao semantica: leu o texto, detectou redundancias, puxou os trechos mais salientes e reorganizou o material em uma forma mais curta e util."
      : aiMode === CODING_AI_MODE
        ? "A IA tratou esta rodada como um problema técnico: identificou o objetivo de implementação, isolou sinais do erro ou da arquitetura e montou uma resposta priorizando código, debugging e decisões práticas."
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

function buildTechnicalAnalysisUnavailable({ apiConfigured, historyContext, reason = "" }) {
  return normalizeTechnicalAnalysis({
    unavailable: true,
    analysisTarget: "latest_prompt",
    usedHistoryContext: historyContext.length > 0,
    historySignal: buildHistorySignal(historyContext),
    sourceLabel: apiConfigured ? "Análise técnica indisponível" : "Análise técnica depende da API",
    sourceType: apiConfigured ? "openai-unavailable" : "api-not-configured",
    unavailableReason:
      reason ||
      (apiConfigured
        ? "A resposta principal foi gerada, mas a análise pedagógica desta rodada não pôde ser retornada pela API."
        : "Conecte a OpenAI para gerar a análise pedagógica desta rodada."),
  }, { historyContext });
}

function buildTechnicalAnalysisPending({ historyContext }) {
  return normalizeTechnicalAnalysis({
    pending: true,
    analysisTarget: "latest_prompt",
    usedHistoryContext: historyContext.length > 0,
    historySignal: buildHistorySignal(historyContext),
    sourceLabel: "Análise técnica em processamento",
    sourceType: "openai-pending",
    unavailableReason: "A resposta principal já foi entregue. A análise técnica desta rodada ainda está sendo preparada.",
  }, { historyContext });
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

function truncateForAnalysis(text = "", limit = 1800) {
  const normalized = `${text || ""}`.trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}...`;
}

function isHtmlPrototypeRequest(input = "") {
  const normalized = `${input || ""}`.toLowerCase();
  return /(front[\s-]?end|html|css|landing page|landing|pagina|página|site|webapp|web app|interface|ui|tela|prototype|prot[oó]tipo|componente visual)/i.test(normalized);
}

function inferArtifactExtension(language = "") {
  const normalized = `${language || ""}`.toLowerCase();
  if (["html", "htm"].includes(normalized)) return "html";
  if (["css", "scss", "sass"].includes(normalized)) return "css";
  if (["javascript", "js", "jsx"].includes(normalized)) return "js";
  if (["typescript", "ts", "tsx"].includes(normalized)) return "ts";
  if (["json"].includes(normalized)) return "json";
  if (["markdown", "md"].includes(normalized)) return "md";
  if (["python", "py"].includes(normalized)) return "py";
  if (["sql"].includes(normalized)) return "sql";
  if (["xml", "svg"].includes(normalized)) return normalized;
  return "txt";
}

function inferArtifactMimeType(extension = "") {
  const normalized = `${extension || ""}`.toLowerCase();
  if (normalized === "html") return "text/html;charset=utf-8";
  if (normalized === "css") return "text/css;charset=utf-8";
  if (normalized === "js") return "text/javascript;charset=utf-8";
  if (normalized === "ts") return "text/plain;charset=utf-8";
  if (normalized === "json") return "application/json;charset=utf-8";
  if (normalized === "md") return "text/markdown;charset=utf-8";
  if (normalized === "py") return "text/x-python;charset=utf-8";
  if (normalized === "sql") return "application/sql;charset=utf-8";
  if (normalized === "svg") return "image/svg+xml;charset=utf-8";
  if (normalized === "xml") return "application/xml;charset=utf-8";
  return "text/plain;charset=utf-8";
}

function sanitizeArtifactFileName(fileName = "", fallbackBase = "artifact", fallbackExtension = "txt") {
  const cleaned = `${fileName || ""}`.trim().replace(/^["'`]+|["'`]+$/g, "").replace(/[\\/:*?"<>|]+/g, "-");
  if (cleaned && /\.[a-z0-9]+$/i.test(cleaned)) return cleaned;
  const base = cleaned || fallbackBase;
  return `${base}.${fallbackExtension}`;
}

function extractRunnableHtml(output = "") {
  if (!output) return null;
  const fencedBlocks = [...output.matchAll(/```html\s*([\s\S]*?)```/gi)];
  for (const match of fencedBlocks) {
    const candidate = match[1]?.trim();
    if (candidate && /<(?:!doctype|html|head|body|main|section|div)\b/i.test(candidate)) {
      return candidate;
    }
  }

  const trimmed = output.trim();
  if (/^<!doctype html>/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function extractGeneratedArtifacts(output = "", baseName = "artifact") {
  const artifacts = [];
  const fencedBlocks = [...`${output || ""}`.matchAll(/```([a-zA-Z0-9_+-]+)?(?:\s+([^\n`]+))?\n([\s\S]*?)```/g)];

  fencedBlocks.forEach((match, index) => {
    const language = `${match[1] || ""}`.trim().toLowerCase();
    const explicitName = `${match[2] || ""}`.trim();
    const content = `${match[3] || ""}`.replace(/^\n+|\n+$/g, "");
    if (!content.trim()) return;
    const extension = explicitName.includes(".") ? getFileExtension(explicitName) || inferArtifactExtension(language) : inferArtifactExtension(language);
    const fileName = sanitizeArtifactFileName(explicitName, `${baseName}-${index + 1}`, extension);
    artifacts.push({
      id: `artifact_${index}_${fileName}`,
      fileName,
      extension,
      language: language || extension,
      mimeType: inferArtifactMimeType(extension),
      content,
      previewMode: extension === "html" ? "html" : "code",
    });
  });

  if (!artifacts.length) {
    const html = extractRunnableHtml(output);
    if (html) {
      artifacts.push({
        id: `${baseName}-html`,
        fileName: sanitizeArtifactFileName(`${baseName}.html`, baseName, "html"),
        extension: "html",
        language: "html",
        mimeType: inferArtifactMimeType("html"),
        content: html,
        previewMode: "html",
      });
    }
  }

  const deduped = new globalThis.Map();
  artifacts.forEach((artifact) => {
    const key = `${artifact.fileName}__${artifact.content}`;
    if (!deduped.has(key)) deduped.set(key, artifact);
  });

  return [...deduped.values()];
}

function buildHtmlArtifact(exec) {
  const generated = Array.isArray(exec?.generatedArtifacts) ? exec.generatedArtifacts : [];
  const htmlArtifact = generated.find((artifact) => artifact.previewMode === "html");
  if (htmlArtifact) {
    return {
      html: htmlArtifact.content,
      fileName: htmlArtifact.fileName,
    };
  }

  const html = extractRunnableHtml(exec?.output || "");
  if (!html) return null;
  const fileBase = (exec?.iterationNumber ? `rodada-${exec.iterationNumber}` : exec?.id || "prototipo")
    .toString()
    .replace(/[^a-z0-9_-]+/gi, "-")
    .toLowerCase();
  return {
    html,
    fileName: `${fileBase}.html`,
  };
}

function downloadTextArtifact(content, fileName = "artifact.txt", mimeType = "text/plain;charset=utf-8") {
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

function downloadHtmlArtifact(html, fileName = "prototipo.html") {
  downloadTextArtifact(html, fileName, "text/html;charset=utf-8");
}

function estimateStreamedOutputTokens(text = "") {
  return Math.max(0, Math.round(`${text || ""}`.length / 4));
}

function writePreviewWindowDocument(previewWindow, html) {
  if (!previewWindow || previewWindow.closed) return;
  previewWindow.document.open();
  previewWindow.document.write(html);
  previewWindow.document.close();
}

function buildPreviewWindowHtmlDocument(html, title = "Preview HTML") {
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

function openHtmlPreviewWindow(html, title = "Preview HTML") {
  if (typeof window === "undefined") return null;
  const previewWindow = window.open("", "_blank");
  if (!previewWindow) return null;
  writePreviewWindowDocument(previewWindow, buildPreviewWindowHtmlDocument(html, title));
  return previewWindow;
}

function renderPreviewWindowPlaceholder(previewWindow, title, message) {
  writePreviewWindowDocument(
    previewWindow,
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f4f8ff;
        color: #14213d;
        font: 500 16px/1.6 Inter, system-ui, sans-serif;
      }
      .shell {
        width: min(520px, calc(100vw - 48px));
        padding: 28px 30px;
        border: 1px solid rgba(20, 33, 61, 0.14);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 22px 48px rgba(20, 33, 61, 0.12);
      }
      h1 {
        margin: 0 0 10px;
        font-size: 26px;
        line-height: 1.1;
      }
      p {
        margin: 0;
        color: rgba(20, 33, 61, 0.74);
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <h1>${title}</h1>
      <p>${message}</p>
    </div>
  </body>
</html>`,
  );
}

async function gerarExplicacaoGuiadaIA({ model, modelPricing, mission, input, attachments = [], acao, output, historyContext }) {
  const historySignal = buildHistorySignal(historyContext);
  const compactHistory = historyContext.slice(-2).map((item) => truncateForAnalysis(item, 260));
  const historyBlock = compactHistory.length
    ? compactHistory.map((item, index) => `Rodada ${index + 1}: ${item}`).join("\n\n")
    : "Sem histórico anterior nesta missão.";
  const attachmentSummary = attachments.length
    ? attachments.map((attachment, index) => `Arquivo ${index + 1}: ${attachment.name} (${attachment.kind})`).join("\n")
    : "Sem arquivos anexados nesta rodada.";
  const aiMode = getMissionAiMode(mission);
  const analysisModel = TECHNICAL_ANALYSIS_MODEL;
  const prompt = [
    "Você é um sistema de análise pedagógica em tempo real.",
    "Seu trabalho é explicar para o aluno, de forma técnica e didática, como a IA leu o prompt e construiu a resposta desta rodada.",
    "Fale diretamente com quem escreveu o prompt. Use 'você' quando indicar ajustes, riscos e próximos passos.",
    "O objeto principal da análise é sempre o ÚLTIMO prompt enviado nesta rodada.",
    "O histórico anterior da missão entra apenas como contexto secundário.",
    "Reconstrua o chain of thought de modo pedagógico. Nunca exponha raciocínio interno literal bruto.",
    "Use linguagem direta, técnica e assertiva. Evite soar como se estivesse descrevendo o comportamento de outra pessoa.",
    "Evite redundância entre seções. Se um ponto já apareceu no highlight, aprofunde nos blocos seguintes em vez de repetir a mesma frase.",
    `Quando faltar conteúdo em qualquer campo, use exatamente: "${ANALYSIS_NOT_APPLICABLE}".`,
    "Retorne JSON válido, sem markdown, com esta estrutura exata:",
    `{
  "executiveSummary": {
    "takeaway": "...",
    "risk": "...",
    "nextMove": "..."
  },
  "promptReading": {
    "explicit": ["..."],
    "inferred": ["..."],
    "assumed": ["..."],
    "ambiguities": ["..."]
  },
  "chainOfThought": {
    "contextConsidered": ["..."],
    "strategyChosen": ["..."],
    "discarded": ["..."],
    "expandedExplanation": "..."
  },
  "responseConstruction": {
    "toneAndFormat": ["..."],
    "conceptsActivated": ["..."],
    "generationLimitations": ["..."]
  },
  "outputEvaluation": {
    "whatWorked": ["..."],
    "whatStayedGeneric": ["..."],
    "gapBetweenRequestAndDelivery": ["..."]
  },
  "nextStep": {
    "howToReformulate": ["..."],
    "whatToTestNext": ["..."]
  },
  "glossary": {
    "round": [
      { "term": "...", "definition": "..." }
    ]
  }
}`,
    "O bloco executiveSummary deve ser curto, direto e acionável.",
    "Cada array deve ter no máximo 3 itens curtos.",
    "As recomendações precisam ser específicas, assertivas e utilizáveis já na próxima rodada.",
    "No glossário, inclua apenas termos técnicos realmente novos ou necessários nesta rodada. Se não houver termo novo, retorne array vazio.",
    "Cada definição do glossário deve ter uma linha em linguagem simples.",
    aiMode === CODING_AI_MODE
      ? "Missão em modo coding: enfatize implementação, debugging, arquitetura e refatoração."
      : "Missão em modo chat: enfatize clareza estrutural, intenção do prompt e qualidade da resposta.",
    `Missao: ${mission.name}`,
    `AI Mode: ${AI_MODE_LABELS[aiMode]}`,
    isFreeInstructionAction(acao)
      ? "A rodada foi feita em modo de instrução livre, sem ação rápida predefinida."
      : `Ação escolhida: ${getActionLabel(acao)}`,
    `Sinal de histórico: ${historySignal}`,
    `Último prompt do usuário (foco principal):\n${truncateForAnalysis(input, 1200)}`,
    `Arquivos anexados considerados nesta rodada:\n${attachmentSummary}`,
    `Histórico anterior da missão (apenas contexto secundário):\n${historyBlock}`,
    `Resposta da IA para esta rodada:\n${truncateForAnalysis(output, 1600)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await fetchChatCompletion({
    model: analysisModel,
    reasoningEffort: "low",
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
  return normalizeTechnicalAnalysis({
    ...parsed,
    sourceType: "openai-guided",
    sourceLabel: "Análise pedagógica gerada com OpenAI",
    analysisTarget: "latest_prompt",
    usedHistoryContext: historyContext.length > 0,
    historySignal,
    usage: {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.inputTokens + result.outputTokens,
      cost: estimateCost(modelPricing, analysisModel, result.inputTokens, result.outputTokens),
      model: analysisModel,
    },
  }, { historyContext });
}

async function fetchChatCompletion({ model, messages, reasoningEffort }) {
  const requestBody = {
    model,
    temperature: 0.4,
    messages,
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
  };
  const response = await fetch("/api/openai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao consultar a OpenAI.");
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  const output = Array.isArray(rawContent)
    ? rawContent
        .map((item) => item?.text || "")
        .join("\n")
        .trim()
    : `${rawContent || ""}`.trim();
  return {
    output: output || "Sem conteudo retornado.",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

function extractResponsesOutputText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const outputItems = Array.isArray(data?.output) ? data.output : [];
  return outputItems
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .map((part) => {
      if (typeof part?.text === "string") return part.text;
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function fetchResponsesCompletion({ model, instructions, input, previousResponseId, reasoningEffort }) {
  const requestBody = {
    model,
    instructions,
    input,
    ...(previousResponseId ? { previousResponseId } : {}),
    ...(reasoningEffort ? { reasoningEffort } : {}),
  };

  const response = await fetch("/api/openai/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao consultar a OpenAI.");
  }

  const data = await response.json();
  return {
    id: data.id || "",
    output: extractResponsesOutputText(data) || "Sem conteudo retornado.",
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };
}

async function fetchResponsesCompletionStream({
  model,
  instructions,
  input,
  previousResponseId,
  reasoningEffort,
  onDelta,
  onReasoning,
}) {
  const requestBody = {
    model,
    instructions,
    input,
    ...(previousResponseId ? { previousResponseId } : {}),
    ...(reasoningEffort ? { reasoningEffort } : {}),
  };

  const response = await fetch("/api/openai/responses/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha ao consultar a OpenAI.");
  }

  if (!response.body) {
    return fetchResponsesCompletion({ model, instructions, input, previousResponseId, reasoningEffort });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";
  let responseId = "";
  let usage = null;
  let streamingFailed = false;
  let reasoning = "";
  const UI_FLUSH_INTERVAL_MS = 60;
  let lastEmitAt = 0;
  let lastReasoningAt = 0;

  function emitDelta(force = false) {
    if (!onDelta) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (!force && now - lastEmitAt < UI_FLUSH_INTERVAL_MS) return;
    lastEmitAt = now;
    onDelta(accumulated);
  }

  function emitReasoning(force = false) {
    if (!onReasoning) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (!force && now - lastReasoningAt < UI_FLUSH_INTERVAL_MS) return;
    lastReasoningAt = now;
    onReasoning(reasoning);
  }

  function handleStreamEvent(payload) {
    if (!payload || typeof payload !== "object") return;

    if (payload.type === "response.reasoning_summary_text.delta" && typeof payload.delta === "string") {
      reasoning += payload.delta;
      emitReasoning(false);
      return;
    }

    if (payload.type === "response.reasoning_summary_part.added" && reasoning) {
      reasoning += "\n\n";
      return;
    }

    if (payload.type === "response.output_text.delta" && typeof payload.delta === "string") {
      accumulated += payload.delta;
      emitDelta(false);
      return;
    }

    if (payload.type === "response.completed") {
      const completed = payload.response || payload;
      responseId = completed.id || responseId;
      usage = completed.usage || usage;
      const finalOutput = extractResponsesOutputText(completed);
      if (finalOutput && finalOutput !== accumulated) {
        accumulated = finalOutput;
      }
      emitReasoning(true);
      emitDelta(true);
      return;
    }

    if (payload.type === "error") {
      streamingFailed = true;
      throw new Error(payload.error?.message || "Falha ao consultar a OpenAI.");
    }

    if (payload.response?.id) {
      responseId = payload.response.id;
    }
  }

  function drainBuffer(force = false) {
    buffer = buffer.replace(/\r\n/g, "\n");
    let boundaryIndex = buffer.indexOf("\n\n");
    while (boundaryIndex >= 0) {
      const chunk = buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + 2);
      const dataPayload = chunk
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (dataPayload && dataPayload !== "[DONE]") {
        try {
          handleStreamEvent(JSON.parse(dataPayload));
        } catch (error) {
          streamingFailed = true;
          throw error;
        }
      }
      boundaryIndex = buffer.indexOf("\n\n");
    }

    if (force && buffer.trim()) {
      const dataPayload = buffer
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      buffer = "";
      if (dataPayload && dataPayload !== "[DONE]") {
        handleStreamEvent(JSON.parse(dataPayload));
      }
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      drainBuffer(done);
      if (done) break;
    }
  } catch (error) {
    if (!streamingFailed) {
      return fetchResponsesCompletion({ model, instructions, input, previousResponseId, reasoningEffort });
    }
    throw error;
  }

  emitReasoning(true);
  emitDelta(true);

  return {
    id: responseId || "",
    output: accumulated.trim() || "Sem conteudo retornado.",
    reasoningText: reasoning.trim(),
    inputTokens: usage?.input_tokens || 0,
    outputTokens: usage?.output_tokens || estimateStreamedOutputTokens(accumulated),
  };
}

async function executarComIA({
  mission,
  input,
  attachments = [],
  acao,
  model,
  modelPricing,
  planningMode,
  historyContext,
  previousResponseId = "",
  onDelta,
  onReasoning,
}) {
  const aiMode = getMissionAiMode(mission);
  const planningRuntime = resolvePlanningRuntime(model, planningMode);
  const promptBase = buildPromptApplied({
    mission,
    acao,
    historyContext: aiMode === CODING_AI_MODE ? [] : historyContext,
    planningMode,
  });
  const promptApplied = promptBase;
  const effectiveRuntime = { ...planningRuntime };
  if (aiMode === CODING_AI_MODE && !effectiveRuntime.reasoningEffort) {
    effectiveRuntime.reasoningEffort = CODING_AI_REASONING_EFFORT;
  }

  const result = await fetchResponsesCompletionStream({
    model: effectiveRuntime.requestModel,
    instructions: promptApplied,
    input: buildResponsesApiInput(input, attachments),
    previousResponseId: aiMode === CODING_AI_MODE ? previousResponseId : "",
    reasoningEffort: effectiveRuntime.reasoningEffort,
    onDelta,
    onReasoning,
  });

  const custo = estimateCost(modelPricing, effectiveRuntime.requestModel, result.inputTokens, result.outputTokens);
  return {
    output: result.output,
    promptApplied,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    tokens: result.inputTokens + result.outputTokens,
    custo,
    aiMode,
    effectiveModel: effectiveRuntime.requestModel,
    selectedModel: model,
    planningModeReal: effectiveRuntime.planningModeReal,
    planningResolution: effectiveRuntime.planningResolution,
    responseId: result.id || "",
    reasoningText: result.reasoningText || "",
  };
}

function executarMock({ mission, input, acao, model, modelPricing, planningMode, historyContext }) {
  const aiMode = getMissionAiMode(mission);
  const effectiveModel = model;
  const output = (MOCKS[mission.id] || (() => "Sem mock configurado."))(input, getActionLabel(acao));
  const inputTokens = Math.max(120, Math.round(input.length / 3.5));
  const outputTokens = Math.max(180, Math.round(output.length / 3.8));
  return {
    output,
    promptApplied: buildPromptApplied({ mission, acao, historyContext, planningMode }),
    inputTokens,
    outputTokens,
    tokens: inputTokens + outputTokens,
    custo: estimateCost(modelPricing, effectiveModel, inputTokens, outputTokens),
    aiMode,
    selectedModel: model,
    effectiveModel,
    planningModeReal: false,
    planningResolution: "mock-runtime",
  };
}

function Modal({ open, children, onClose, small = false, dismissible = true, className = "" }) {
  if (!open) return null;
  const modalNode = (
    <div className="overlay open" onClick={dismissible ? onClose : undefined}>
      <div
        className={`modal${small ? " modal-small" : ""}${className ? ` ${className}` : ""}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {onClose ? (
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Fechar janela"
            onClick={onClose}
          >
            <X size={16} strokeWidth={1.9} />
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
  if (typeof document === "undefined") return modalNode;
  return createPortal(modalNode, document.body);
}

function BrandLoaderOverlay({ open }) {
  if (!open) return null;
  return (
    <div className="brand-loader-overlay" aria-hidden="true">
      <div className="brand-loader-shell">
        <img className="brand-loader-icon" src={techHallFooterIcon} alt="" />
      </div>
    </div>
  );
}

function ModelSelect({ options = [], value, onChange, disabled = false, ariaLabel, dropUp = false }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find((entry) => entry.id === value) || options[0] || null;

  const updateCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, 220);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeUp = dropUp ? spaceAbove > 180 : spaceBelow < 300 && spaceAbove > spaceBelow;
    setCoords({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      width,
      placeUp,
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
    });
  }, [dropUp]);

  useEffect(() => {
    if (!open) return undefined;
    updateCoords();
    function handleReposition() {
      updateCoords();
    }
    function handlePointer(event) {
      if (triggerRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  function handleSelect(nextId) {
    if (nextId !== value) onChange(nextId);
    setOpen(false);
  }

  const menu =
    open && coords
      ? createPortal(
          <ul
            ref={menuRef}
            className="model-select-menu"
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              left: coords.left,
              width: coords.width,
              ...(coords.placeUp ? { bottom: coords.bottom } : { top: coords.top }),
            }}
          >
            {options.map((entry) => (
              <li key={entry.id} role="option" aria-selected={entry.id === value}>
                <button
                  type="button"
                  className={`model-select-option${entry.id === value ? " is-selected" : ""}`}
                  title={formatModelPriceHint(entry)}
                  onClick={() => handleSelect(entry.id)}
                >
                  <span className="model-select-option-name">{entry.label}</span>
                  <span className="model-select-option-date">{formatModelLaunch(entry.releasedAt) || "—"}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className={`model-select${open ? " is-open" : ""}${disabled ? " is-disabled" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className="model-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        title={formatModelPriceHint(selected)}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="model-select-trigger-name">{selected?.label || "Modelo"}</span>
        <span className="model-select-caret" aria-hidden="true">
          <ChevronDown size={14} strokeWidth={1.8} />
        </span>
      </button>
      {menu}
    </div>
  );
}

function App() {
  const isLocalDev = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const rawInitialLocalStore = loadStore();
  const initialLocalStore = {
    ...rawInitialLocalStore,
    events: normalizeEventsForProduct(rawInitialLocalStore.events || []),
    archivedEvents: rawInitialLocalStore.archivedEvents || [],
  };
  const [store, setStore] = useState(() => ({
    events: initialLocalStore.events || [],
    archivedEvents: initialLocalStore.archivedEvents || [],
    chatModel: initialLocalStore.chatModel || initialLocalStore.model || DEFAULT_CHAT_MODEL,
    codingModel: initialLocalStore.codingModel || DEFAULT_CODING_MODEL,
    planningMode: initialLocalStore.planningMode || "off",
  }));
  const [screen, setScreen] = useState("home");
  const [facSelectedId, setFacSelectedId] = useState(null);
  const [facTab, setFacTab] = useState("dashboard");
  const [dashboardView, setDashboardView] = useState("team");
  const [promptInsightsView, setPromptInsightsView] = useState("team");
  const [entryCode, setEntryCode] = useState("");
  const [entryError, setEntryError] = useState("");
  const [timeEventId, setTimeEventId] = useState(null);
  const [timeTeamIdx, setTimeTeamIdx] = useState(null);
  const [timeMissionIdx, setTimeMissionIdx] = useState(null);
  const [missionInput, setMissionInput] = useState("");
  const [missionAttachments, setMissionAttachments] = useState([]);
  const [activePrompt, setActivePrompt] = useState("");
  const [activeAttachments, setActiveAttachments] = useState([]);
  const [running, setRunning] = useState(false);
  const [runState, setRunState] = useState(null);
  const liveAnswerRef = useRef(null);
  const [runError, setRunError] = useState("");
  const [toastText, setToastText] = useState("");
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [facAccessOpen, setFacAccessOpen] = useState(false);
  const [facAccessPassword, setFacAccessPassword] = useState("");
  const [facAccessError, setFacAccessError] = useState("");
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    body: "",
    onConfirm: null,
    secondaryAction: null,
    confirmTone: "danger",
    requiresPassword: false,
    confirmValue: "",
    confirmLabel: "",
    confirmPlaceholder: "",
    confirmHint: "",
  });
  const [confirmInput, setConfirmInput] = useState("");
  const [missionFlow, setMissionFlow] = useState({ stage: "idle", exec: null });
  const [newEventForm, setNewEventForm] = useState({
    name: "",
    desc: "",
    teams: "",
    eventMode: MISSIONS_MODE_EVENT,
    anamnesisEnabled: false,
    teamMode: "manual",
    studentsRaw: "",
    importMode: "solo",
    randomTeamCount: 2,
  });
  const [configForm, setConfigForm] = useState({ apiKey: "", chatModel: DEFAULT_CHAT_MODEL, codingModel: DEFAULT_CODING_MODEL, planningMode: "off" });
  const [eventMetaForm, setEventMetaForm] = useState({ name: "", desc: "" });
  const [newTeamName, setNewTeamName] = useState("");
  const [teamImportForm, setTeamImportForm] = useState({
    studentsRaw: "",
    importMode: "solo",
    randomTeamCount: 2,
  });
  const [reflectionAnswers, setReflectionAnswers] = useState({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [teamAnnouncementOpen, setTeamAnnouncementOpen] = useState(false);
  const [teamAnnouncementInboxOpen, setTeamAnnouncementInboxOpen] = useState(false);
  const [anamnesisOpen, setAnamnesisOpen] = useState(false);
  const [anamnesisAnswers, setAnamnesisAnswers] = useState({});
  const [anamnesisError, setAnamnesisError] = useState("");
  const [anamnesisContext, setAnamnesisContext] = useState(null);
  const [anamnesisStep, setAnamnesisStep] = useState(0);
  const [reflectionComment, setReflectionComment] = useState("");
  const [reflectionError, setReflectionError] = useState("");
  const [missionMenuOpen, setMissionMenuOpen] = useState(null);
  const [missionFeedbackOpen, setMissionFeedbackOpen] = useState({});
  const [missionTeamRowsOpen, setMissionTeamRowsOpen] = useState({});
  const [tokenDrawerOpen, setTokenDrawerOpen] = useState(false);
  const [materialsDrawerOpen, setMaterialsDrawerOpen] = useState(false);
  const [studentResourcePreview, setStudentResourcePreview] = useState(null);
  const [dismissedScreenShareSession, setDismissedScreenShareSession] = useState("");
  const [tokenLimitModalOpen, setTokenLimitModalOpen] = useState(false);
  const [facilitatorToolsOpen, setFacilitatorToolsOpen] = useState(false);
  const [facilitatorToolView, setFacilitatorToolView] = useState(FACILITATOR_TOOL_VIEWS.MENU);
  const [tokenGrantTargetMissionId, setTokenGrantTargetMissionId] = useState("");
  const [tokenPolicyCustomInput, setTokenPolicyCustomInput] = useState("15000");
  const [activeStudentName, setActiveStudentName] = useState("");
  const [brandLoaderOpen, setBrandLoaderOpen] = useState(true);
  const [timerMinutesInput, setTimerMinutesInput] = useState("10:00");
  const [clockNow, setClockNow] = useState(Date.now());
  const [serverConfig, setServerConfig] = useState({
    openaiConfigured: false,
    openaiSource: "none",
    livekitConfigured: false,
    supabaseConfigured: false,
    supabaseUrl: "",
    supabaseAnonKey: "",
    remoteStateKey: "techhall-v1",
  });
  const [storeHydrated, setStoreHydrated] = useState(false);
  const composerFileInputRef = useRef(null);
  const lastEventMetaSavedRef = useRef({ id: null, name: "", desc: "" });
  const lastRemoteEventsRef = useRef(JSON.stringify(initialLocalStore.events || []));
  const brandLoaderTimerRef = useRef(null);

  function clearBrandLoaderTimer() {
    if (!brandLoaderTimerRef.current) return;
    window.clearTimeout(brandLoaderTimerRef.current);
    brandLoaderTimerRef.current = null;
  }

  function runBrandLoaderTransition(action, duration = BRAND_LOADER_DURATION_MS) {
    clearBrandLoaderTimer();
    setBrandLoaderOpen(true);
    brandLoaderTimerRef.current = window.setTimeout(() => {
      action?.();
      setBrandLoaderOpen(false);
      brandLoaderTimerRef.current = null;
    }, duration);
  }

  useEffect(() => {
    saveStore(store);
  }, [store]);

  useEffect(() => {
    runBrandLoaderTransition();
    return () => clearBrandLoaderTimer();
  }, []);

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
          const normalizedRemoteEvents = normalizeEventsForProduct(remoteState.events || []);
          lastRemoteEventsRef.current = JSON.stringify(remoteState.events || []);
          setStore((current) => ({
            ...current,
            events: normalizedRemoteEvents,
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

  function handleOpenStudentResource(item, sectionTitle) {
    if (!item?.href) return;
    setStudentResourcePreview({
      id: item.id,
      title: item.title,
      sectionTitle,
      href: item.href,
      previewHref: getStudentResourcePreviewUrl(item.href),
      description: item.description || "",
    });
  }

  function handleOpenStudentResourceInNewTab() {
    if (!studentResourcePreview?.href) return;
    window.open(studentResourcePreview.href, "_blank", "noopener,noreferrer");
  }

  const supabaseRealtimeClient = useMemo(() => {
    if (!serverConfig.supabaseConfigured || !serverConfig.supabaseUrl || !serverConfig.supabaseAnonKey) return null;
    return createClient(serverConfig.supabaseUrl, serverConfig.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }, [serverConfig.supabaseAnonKey, serverConfig.supabaseConfigured, serverConfig.supabaseUrl]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!storeHydrated) return undefined;

    const serializedEvents = JSON.stringify(store.events || []);
    if (serializedEvents === lastRemoteEventsRef.current) return undefined;

    if (!serverConfig.supabaseConfigured) return undefined;

    const timer = window.setTimeout(() => {
      (async () => {
        try {
          const remoteState = await fetchRemoteState();
          const normalizedRemoteEvents = normalizeEventsForProduct(remoteState.events || []);
          const mergedEvents = normalizeEventsForProduct(mergeEventCollections(normalizedRemoteEvents, store.events || []));
          const mergedSerialized = JSON.stringify(mergedEvents);
          lastRemoteEventsRef.current = mergedSerialized;
          await saveRemoteState(mergedEvents);
          setStore((current) =>
            JSON.stringify(current.events || []) === mergedSerialized
              ? current
              : {
                  ...current,
                  events: mergedEvents,
                },
          );
        } catch (error) {
          console.error(error);
        }
      })();
    }, REMOTE_SYNC_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [serverConfig.supabaseConfigured, store.events, storeHydrated]);

  useEffect(() => {
    if (!storeHydrated || !supabaseRealtimeClient || !serverConfig.remoteStateKey) return undefined;

    const channel = supabaseRealtimeClient
      .channel(`app-state-${serverConfig.remoteStateKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_state",
          filter: `id=eq.${serverConfig.remoteStateKey}`,
        },
        (payload) => {
          const nextEvents = normalizeEventsForProduct(payload.new?.payload?.events || []);
          setStore((current) => {
            const mergedEvents = normalizeEventsForProduct(mergeEventCollections(nextEvents, current.events || []));
            lastRemoteEventsRef.current = JSON.stringify(mergedEvents);
            return {
              ...current,
              events: mergedEvents,
            };
          });
        },
      )
      .subscribe();

    return () => {
      supabaseRealtimeClient.removeChannel(channel);
    };
  }, [serverConfig.remoteStateKey, storeHydrated, supabaseRealtimeClient]);

  useEffect(() => {
    if (!["workspace", "facilitador"].includes(screen)) return undefined;

    const timer = window.setInterval(async () => {
      try {
        const config = await fetchServerConfig();
        setServerConfig(config);

        if (config.supabaseConfigured) {
          const remoteState = await fetchRemoteState();
          const remoteEvents = normalizeEventsForProduct(remoteState.events || []);
          setStore((current) => {
            const mergedEvents = normalizeEventsForProduct(mergeEventCollections(remoteEvents, current.events || []));
            lastRemoteEventsRef.current = JSON.stringify(mergedEvents);
            return {
              ...current,
              events: mergedEvents,
            };
          });
          return;
        }
      } catch (error) {
        console.error(error);
      }

      setStore((current) => {
        const normalizedCurrentEvents = normalizeEventsForProduct(current.events || []);
        lastRemoteEventsRef.current = JSON.stringify(normalizedCurrentEvents);
        return {
          ...current,
          events: normalizedCurrentEvents,
        };
      });
    }, REMOTE_SYNC_POLL_MS);

    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (!storeHydrated || !isLocalDev) return;
    if ((store.events || []).length > 0) return;

    const labEvent = makeDevLabEvent();
    setStore((current) => ({
      ...current,
      events: [labEvent],
    }));
    setFacSelectedId(labEvent.id);
    setTimeEventId(labEvent.id);
    setTimeTeamIdx(0);
    setTimeMissionIdx(0);
    setEntryCode(labEvent.id);
    setFacTab("dashboard");
  }, [isLocalDev, store.events, storeHydrated]);

  useEffect(() => {
    if (!isLocalDev) return;
    if (!(store.events || []).length) return;
    const firstVisibleEvent = (store.events || []).find((event) => !isEventHidden(event));
    if (!firstVisibleEvent) return;
    if (!facSelectedId || !(store.events || []).some((event) => event.id === facSelectedId && !isEventHidden(event))) {
      setFacSelectedId(firstVisibleEvent.id);
    }
    if (!timeEventId || !(store.events || []).some((event) => event.id === timeEventId && !isEventHidden(event))) {
      setTimeEventId(firstVisibleEvent.id);
    }
  }, [facSelectedId, isLocalDev, store.events, timeEventId]);

  const allEvents = store.events || [];
  const events = allEvents.filter((event) => !isEventHidden(event));
  const selectedEvent = events.find((event) => event.id === facSelectedId) || null;
  const teamEvent = events.find((event) => event.id === timeEventId) || null;
  const selectedEventMode = getEventMode(selectedEvent);
  const teamEventMode = getEventMode(teamEvent);
  const isTrainingEvent = teamEventMode === TRAINING_MODE_EVENT;
  const team = teamEvent && timeTeamIdx !== null ? teamEvent.teams[timeTeamIdx] : null;
  const selectedEventAnnouncements = getEventAnnouncements(selectedEvent);
  const selectedEventLatestAnnouncement = selectedEventAnnouncements.length ? selectedEventAnnouncements[selectedEventAnnouncements.length - 1] : null;
  const teamEventAnnouncements = getEventAnnouncements(teamEvent);
  const teamUnreadAnnouncements = teamEvent && timeTeamIdx !== null ? getUnreadAnnouncementsForTeam(teamEvent, timeTeamIdx) : [];
  const teamUnreadAnnouncementCount = teamUnreadAnnouncements.length;
  const latestUnreadAnnouncement = teamEvent && timeTeamIdx !== null ? getLatestUnreadAnnouncementForTeam(teamEvent, timeTeamIdx) : null;
  const selectedEventTimer = getSessionTimer(selectedEvent);
  const selectedEventTimerRemainingMs = getSessionTimerRemainingMs(selectedEvent, clockNow);
  const selectedEventTimerRunning = isSessionTimerRunning(selectedEvent, clockNow);
  const selectedEventTimerNotice = getSessionTimerNotice(selectedEvent, clockNow);
  const teamEventTimer = getSessionTimer(teamEvent);
  const teamEventTimerRemainingMs = getSessionTimerRemainingMs(teamEvent, clockNow);
  const teamEventTimerRunning = isSessionTimerRunning(teamEvent, clockNow);
  const teamEventTimerNotice = getSessionTimerNotice(teamEvent, clockNow);
  const teamTimerExpired = isSessionTimerExpired(teamEvent, clockNow);
  const teamTimerLockActive = isSessionTimerLockActive(teamEvent, clockNow);
  const selectedEventScreenShare = selectedEvent ? getScreenShareState(selectedEvent) : null;
  const teamEventScreenShare = teamEvent ? getScreenShareState(teamEvent) : null;
  const teamScreenShareSessionId =
    teamEventScreenShare?.active && teamEvent
      ? `${teamEvent.id}:${teamEventScreenShare.roomName || ""}:${teamEventScreenShare.startedAt || ""}`
      : "";
  const teamScreenShareVisible = Boolean(teamScreenShareSessionId && dismissedScreenShareSession !== teamScreenShareSessionId);

  useEffect(() => {
    if (!teamScreenShareSessionId) {
      setDismissedScreenShareSession("");
    }
  }, [teamScreenShareSessionId]);

  useEffect(() => {
    if (!events.length) {
      if (facSelectedId) setFacSelectedId(null);
      if (timeEventId) {
        setTimeEventId(null);
        setTimeTeamIdx(null);
        setTimeMissionIdx(null);
      }
      return;
    }
    if (facSelectedId && !events.some((event) => event.id === facSelectedId)) {
      setFacSelectedId(events[0].id);
    }
    if (timeEventId && !events.some((event) => event.id === timeEventId)) {
      setTimeEventId(null);
      setTimeTeamIdx(null);
      setTimeMissionIdx(null);
      if (screen !== "home") setScreen("entry");
    }
  }, [events, facSelectedId, timeEventId, screen]);
  const currentMission = isTrainingEvent ? TRAINING_MISSION : teamEvent && timeMissionIdx !== null ? normalizeMission(teamEvent.missions[timeMissionIdx]) : null;
  const currentExecs = currentMission && teamEvent
    ? isTrainingEvent
      ? getTrainingRuns(teamEvent, timeTeamIdx)
      : getExecucoes(teamEvent, timeTeamIdx, currentMission.id)
    : [];
  const currentReflexao = currentMission && teamEvent && !isTrainingEvent ? getReflexao(teamEvent, timeTeamIdx, currentMission.id) : null;
  const currentQuestionarioPendente = currentMission && teamEvent && !isTrainingEvent ? isQuestionarioPendente(teamEvent, timeTeamIdx, currentMission.id) : false;
  const currentQuestionarioPendenteSource = currentMission && teamEvent && !isTrainingEvent
    ? getQuestionarioPendenteSource(teamEvent, timeTeamIdx, currentMission.id)
    : null;
  const currentConcluida = currentMission && teamEvent && !isTrainingEvent ? isConcluida(teamEvent, timeTeamIdx, currentMission.id) : false;
  const currentConclusaoSource = currentMission && teamEvent && !isTrainingEvent
    ? getConclusaoSource(teamEvent, timeTeamIdx, currentMission.id)
    : null;
  const currentMissionStatus = currentMission && teamEvent && !isTrainingEvent ? getMissionClosureStatus(teamEvent, timeTeamIdx, currentMission.id) : "aberta";
  const latestCurrentExec = currentExecs.length ? currentExecs[currentExecs.length - 1] : null;
  const readingExec = missionFlow.exec || latestCurrentExec || null;
  const readingStage = Boolean(readingExec);
  const hasMissionHistory = currentMission && teamEvent
    ? isTrainingEvent
      ? currentExecs.length > 0
      : currentExecs.length > 0 || Boolean(currentReflexao) || currentQuestionarioPendente || currentConcluida
    : false;
  const preservedUsage = currentMission && teamEvent && !isTrainingEvent ? getPreservedMissionUsage(teamEvent, timeTeamIdx, currentMission.id) : null;
  const currentHelpRequests = currentMission && teamEvent
    ? isTrainingEvent
      ? [...getTrainingHelpRequests(teamEvent, timeTeamIdx), ...getTrainingTokenRequests(teamEvent, timeTeamIdx)]
      : getHelpRequests(teamEvent, timeTeamIdx, currentMission.id)
    : [];
  const currentOpenHelpCount = currentHelpRequests.filter((request) => request.status === "open" && request.kind !== "tokens").length;
  const currentOpenHelpRequest = currentHelpRequests.find((request) => request.status === "open" && request.kind !== "tokens") || null;
  const currentTokenMissionId = currentMission ? getTokenMissionId(currentMission.id, { isTraining: isTrainingEvent }) : null;
  const currentTokenBudget = currentMission && teamEvent && timeTeamIdx !== null
    ? getEffectiveMissionTokenBudget(teamEvent, timeTeamIdx, currentMission.id, { isTraining: isTrainingEvent })
    : null;
  const currentOpenTokenRequest =
    currentMission && teamEvent
      ? currentHelpRequests.find((request) => request.status === "open" && request.kind === "tokens") || null
      : null;
  const currentMissionOperationalLogs =
    currentMission && teamEvent && timeTeamIdx !== null
      ? getMissionTokenOperationalLogs(teamEvent, currentMission.id, timeTeamIdx, { isTraining: isTrainingEvent })
      : [];
  const facilitatorTabs = selectedEvent && isAnamnesisEnabled(selectedEvent)
    ? ["dashboard", "missoes", "prompts", "anamnese"]
    : ["dashboard", "missoes", "prompts"];
  const selectedTokenPolicy = selectedEvent && tokenGrantTargetMissionId
    ? getMissionTokenPolicy(selectedEvent, tokenGrantTargetMissionId, {
        isTraining: tokenGrantTargetMissionId === TOKEN_MISSION_TRAINING_ID,
      })
    : null;
  const teamHelpDisabled = teamEvent && timeTeamIdx !== null ? isHelpDisabledForTeam(teamEvent, timeTeamIdx) : false;
  const newEventStudents = parseStudentList(newEventForm.studentsRaw || "");
  const anamnesisTargetEvent = anamnesisContext ? events.find((event) => event.id === anamnesisContext.eventId) || null : null;
  const answeredAnamnesisCount = countAnsweredAnamnesisQuestions(anamnesisAnswers);
  const currentAnamnesisQuestion = ANAMNESIS_QUESTIONS[anamnesisStep] || null;
  const currentAnamnesisAnswer = currentAnamnesisQuestion ? anamnesisAnswers[currentAnamnesisQuestion.id] : null;
  const currentAnamnesisChoiceValue = currentAnamnesisQuestion
    ? getAnamnesisAnswerChoice(currentAnamnesisQuestion, currentAnamnesisAnswer)
    : null;
  const currentAnamnesisNoteValue = currentAnamnesisQuestion
    ? getAnamnesisAnswerNote(currentAnamnesisQuestion, currentAnamnesisAnswer)
    : "";
  const isCurrentAnamnesisAnswered = currentAnamnesisQuestion
    ? isAnamnesisAnswerFilled(currentAnamnesisQuestion, currentAnamnesisAnswer)
    : false;

  useEffect(() => {
    if (screen !== "workspace" || !teamEvent || timeTeamIdx === null) {
      setTeamAnnouncementOpen(false);
      return;
    }
    const announcement = getLatestUnreadAnnouncementForTeam(teamEvent, timeTeamIdx);
    if (!announcement) {
      setTeamAnnouncementOpen(false);
      return;
    }
    if (!isAnnouncementDismissedForTeam(teamEvent, timeTeamIdx, announcement.id)) {
      setTeamAnnouncementOpen(true);
      return;
    }
    setTeamAnnouncementOpen(false);
  }, [screen, teamEvent, timeTeamIdx, clockNow]);
  const importedStudents = parseStudentList(teamImportForm.studentsRaw || "");

  useEffect(() => {
    if (!currentMission) {
      setMissionInput("");
      setRunState(null);
      setMissionFlow({ stage: "idle", exec: null });
      setHistoryOpen(false);
      setHelpOpen(false);
      setHelpMessage("");
      setReflectionAnswers({});
      setReflectionComment("");
      setReflectionError("");
      setMissionAttachments([]);
      return;
    }
    setMissionInput("");
    setMissionAttachments([]);
    setRunError("");
    setHistoryOpen(false);
    setHelpOpen(false);
    setHelpMessage("");
    setReflectionAnswers({});
    setReflectionComment("");
    setReflectionError("");
    setMissionMenuOpen(null);
  }, [timeMissionIdx, timeEventId]);

  useEffect(() => {
    if (!currentMission) return;
    if (isTrainingEvent) {
      setMissionFlow({
        stage: latestCurrentExec ? "cot_aberto" : "idle",
        exec: latestCurrentExec || null,
      });
      return;
    }
    if (currentQuestionarioPendente) {
      setMissionFlow({
        stage: "questionario_final",
        exec: latestCurrentExec || null,
      });
      return;
    }
    if (currentConcluida) {
      setMissionFlow({
        stage: "concluida",
        exec: latestCurrentExec || null,
      });
      return;
    }
    setMissionFlow({
      stage: latestCurrentExec ? "cot_aberto" : "idle",
      exec: latestCurrentExec || null,
    });
  }, [currentConcluida, currentMission?.id, currentQuestionarioPendente, isTrainingEvent, latestCurrentExec]);

  useEffect(() => {
    if (isTrainingEvent || !currentQuestionarioPendente) return;
    setReflectionAnswers({});
    setReflectionComment("");
    setReflectionError("");
  }, [currentMission?.id, currentQuestionarioPendente, isTrainingEvent]);

  useEffect(() => {
    if (!teamEvent || timeTeamIdx === null || isTrainingEvent) return;
    const pendingMissionIdx = getFirstPendingMissionIndex(teamEvent, timeTeamIdx);
    if (pendingMissionIdx >= 0 && timeMissionIdx !== pendingMissionIdx) {
      setTimeMissionIdx(pendingMissionIdx);
    }
  }, [isTrainingEvent, teamEvent, timeMissionIdx, timeTeamIdx]);

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
    if (!selectedEvent) {
      setTokenGrantTargetMissionId("");
      return;
    }
    const availableMissionId =
      getEventMode(selectedEvent) === TRAINING_MODE_EVENT
        ? TOKEN_MISSION_TRAINING_ID
        : selectedEvent.missions?.[0]?.id || "";
    setTokenGrantTargetMissionId((current) => (current ? current : availableMissionId));
  }, [selectedEvent]);

  useEffect(() => {
    if (!selectedEvent || !tokenGrantTargetMissionId || !selectedTokenPolicy) return;
    setTokenPolicyCustomInput(
      formatTokenLimitInput(
        selectedTokenPolicy.mode === TOKEN_POLICY_MODE_CUSTOM ? Math.max(1, Number(selectedTokenPolicy.customLimit || 0)) : DEFAULT_MISSION_TOKEN_LIMIT,
      ),
    );
  }, [
    selectedEvent?.id,
    tokenGrantTargetMissionId,
    selectedTokenPolicy?.mode,
    selectedTokenPolicy?.customLimit,
    selectedTokenPolicy?.updatedAt,
  ]);

  useEffect(() => {
    if (facTab === "anamnese" && (!selectedEvent || !isAnamnesisEnabled(selectedEvent))) {
      setFacTab("dashboard");
    }
  }, [facTab, selectedEvent]);

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

  useEffect(() => {
    if (screen !== "workspace" || !teamEvent || timeTeamIdx === null) return undefined;

    const presenceName = activeStudentName || team?.name || "";
    markTeamPresence(teamEvent.id, timeTeamIdx, presenceName);

    const timer = window.setInterval(() => {
      markTeamPresence(teamEvent.id, timeTeamIdx, presenceName);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [activeStudentName, screen, team?.name, teamEvent?.id, timeTeamIdx]);


  const openEventsForTeamEntry = useMemo(
    () => events.filter((event) => event.status === "open"),
    [events],
  );

  const teamStudentOptions = useMemo(() => getEventStudentOptions(teamEvent), [teamEvent]);

  const apiConfigured = Boolean(serverConfig.openaiConfigured);
  const modelCatalog = useMemo(() => getModelCatalog(serverConfig), [serverConfig]);
  const modelPricingMap = useMemo(() => getModelPricingMap(modelCatalog), [modelCatalog]);
  const currentMissionAiMode = currentMission ? getMissionAiMode(currentMission) : CHAT_AI_MODE;
  const composerModelOptions = getModelsForMode(modelCatalog, currentMissionAiMode);
  const storedModelForMode =
    currentMissionAiMode === CODING_AI_MODE ? store.codingModel : store.chatModel;
  const selectedModelForMode = composerModelOptions.some((entry) => entry.id === storedModelForMode)
    ? storedModelForMode
    : getDefaultModelForMode(serverConfig, currentMissionAiMode);
  const devEventId = timeEventId || facSelectedId || events[0]?.id || "";
  const devEvent = events.find((event) => event.id === devEventId) || null;
  const devTeamIdx = devEvent && timeTeamIdx !== null && devEvent.teams[timeTeamIdx] ? timeTeamIdx : "";
  const devQuickSwitch = import.meta.env.DEV && isLocalDev && SHOW_DEV_SWITCH ? (
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
    setStore((current) => {
      const previousEvents = current.events || [];
      const nextEvents = updater(previousEvents);
      if (nextEvents === previousEvents) return current;
      return {
        ...current,
        events: stampUpdatedEvents(previousEvents, nextEvents),
      };
    });
  }

  function markTeamPresence(eventId, teamIdx, memberName) {
    if (!eventId || teamIdx === null || teamIdx === undefined) return;
    const normalizedName = normalizeStudentName(memberName || "");
    const now = Date.now();
    updateEvents((current) => {
      let changed = false;
      const next = current.map((event) => {
        if (event.id !== eventId) return event;
        const existing = event.presenceMap?.[teamIdx];
        const nextName = normalizedName || event.teams?.[teamIdx]?.name || `Time ${Number(teamIdx) + 1}`;
        if (existing && existing.memberName === nextName && now - new Date(existing.lastSeenAt).getTime() < 10000) {
          return event;
        }
        changed = true;
        return {
          ...event,
          presenceMap: {
            ...(event.presenceMap || {}),
            [teamIdx]: { teamIdx, memberName: nextName, lastSeenAt: new Date(now).toISOString() },
          },
        };
      });
      return changed ? next : current;
    });
  }

  function showToast(message) {
    setToastText(message);
  }

  function appendTokenOperationalLog(event, entry) {
    return {
      ...event,
      tokenOperationalLogs: [
        ...(event.tokenOperationalLogs || []),
        {
          id: `token_log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          ...entry,
        },
      ],
    };
  }

  function handleUpdateMissionTokenPolicy(eventId, missionId, nextPolicyInput) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const tokenMissionId = getTokenMissionId(missionId, { isTraining: missionId === TOKEN_MISSION_TRAINING_ID });
        const currentPolicy = getMissionTokenPolicy(event, tokenMissionId, { isTraining: tokenMissionId === TOKEN_MISSION_TRAINING_ID });
        const nextPolicy = {
          ...currentPolicy,
          ...nextPolicyInput,
          updatedAt: new Date().toISOString(),
        };
        const nextEvent = {
          ...event,
          missionTokenPolicies: {
            ...(event.missionTokenPolicies || {}),
            [tokenMissionId]: nextPolicy,
          },
        };
        if (Object.prototype.hasOwnProperty.call(nextPolicyInput, "temporaryUnlimited")) {
          return appendTokenOperationalLog(nextEvent, {
            missionId: tokenMissionId,
            teamIdx: null,
            type: nextPolicyInput.temporaryUnlimited ? "temporary_unlimited_on" : "temporary_unlimited_off",
            message: nextPolicyInput.temporaryUnlimited
              ? "Missão ficou temporariamente ilimitada."
              : "Missão voltou a respeitar o limite de tokens.",
          });
        }
        if (Object.prototype.hasOwnProperty.call(nextPolicyInput, "mode")) {
          const modeMessage =
            nextPolicy.mode === TOKEN_POLICY_MODE_UNLIMITED
              ? "Missão configurada como ilimitada."
              : nextPolicy.mode === TOKEN_POLICY_MODE_CUSTOM
                ? `Missão configurada com limite personalizado de ${Math.max(1, Number(nextPolicy.customLimit || 0)).toLocaleString("pt-BR")} tokens.`
                : `Missão configurada com limite padrão de ${DEFAULT_MISSION_TOKEN_LIMIT.toLocaleString("pt-BR")} tokens.`;
          return appendTokenOperationalLog(nextEvent, {
            missionId: tokenMissionId,
            teamIdx: null,
            type: "policy_change",
            message: modeMessage,
          });
        }
        return nextEvent;
      }),
    );
  }

  function handleGrantTokens({ eventId, missionId, scope, teamIdx = null, amount, source = "facilitator", note = "" }) {
    const numericAmount = Math.max(0, Number(amount || 0));
    if (!numericAmount) {
      showToast("Defina uma quantidade válida de tokens");
      return;
    }

    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const tokenMissionId = getTokenMissionId(missionId, { isTraining: missionId === TOKEN_MISSION_TRAINING_ID });
        const createdAt = new Date().toISOString();
        const nextEvent = {
          ...event,
          tokenGrants: [
            ...(event.tokenGrants || []),
            {
              id: `grant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              missionId: tokenMissionId,
              scope,
              teamIdx: scope === "turma" ? null : teamIdx,
              amount: numericAmount,
              createdAt,
              updatedAt: createdAt,
              note,
              source,
            },
          ],
          helpRequests: (event.helpRequests || []).map((request) =>
            request.kind === "tokens" &&
            request.status === "open" &&
            request.missionId === tokenMissionId &&
            (scope === "turma" || request.teamIdx === teamIdx)
              ? {
                  ...request,
                  status: "resolved",
                  resolvedAt: createdAt,
                  updatedAt: createdAt,
                }
              : request,
          ),
        };
        return appendTokenOperationalLog(nextEvent, {
          missionId: tokenMissionId,
          teamIdx: scope === "turma" ? null : teamIdx,
          type: "grant",
          message: `Facilitador liberou +${numericAmount.toLocaleString("pt-BR")} tokens.`,
        });
      }),
    );

    showToast(`+${numericAmount.toLocaleString("pt-BR")} tokens liberados`);
  }

  function handleSendTokenRequest() {
    if (!teamEvent || timeTeamIdx === null || !currentMission || !currentTokenBudget) return;
    if (teamHelpDisabled) {
      showToast("Ajuda desativada para este time");
      return;
    }
    if (!currentTokenBudget.blocked) {
      showToast("A solicitação de tokens só libera quando o limite da missão for atingido");
      return;
    }
    if (currentOpenTokenRequest) {
      showToast("Já existe uma solicitação de tokens em aberto");
      return;
    }

    const createdAt = new Date().toISOString();
    updateEvents((current) =>
      current.map((event) =>
        event.id !== teamEvent.id
          ? event
          : {
              ...event,
              helpRequests: [
                ...(event.helpRequests || []),
                {
                  id: `token_help_${Date.now()}`,
                  kind: "tokens",
                  teamIdx: timeTeamIdx,
                  missionId: currentTokenBudget.missionId,
                  message: "Solicitação de liberação de tokens.",
                  status: "open",
                  createdAt,
                  updatedAt: createdAt,
                  currentUsage: currentTokenBudget.usage.totalTokens,
                  currentLimit: currentTokenBudget.effectiveLimit,
                },
              ],
            },
      ),
    );
    showToast("Solicitação enviada ao facilitador.");
  }

  function handleQuickModelChange(nextModel) {
    const storeKey = currentMissionAiMode === CODING_AI_MODE ? "codingModel" : "chatModel";
    setStore((current) => ({ ...current, [storeKey]: nextModel }));
    setConfigForm((current) => ({ ...current, [storeKey]: nextModel }));
  }

  function handleQuickPlanningModeChange(nextPlanningMode) {
    setStore((current) => ({ ...current, planningMode: nextPlanningMode }));
    setConfigForm((current) => ({ ...current, planningMode: nextPlanningMode }));
  }

  async function handleAttachFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    if (missionAttachments.length >= MAX_ATTACHMENT_COUNT) {
      showToast(`Limite de ${MAX_ATTACHMENT_COUNT} arquivos por rodada.`);
      return;
    }

    const availableSlots = MAX_ATTACHMENT_COUNT - missionAttachments.length;
    const nextFiles = files.slice(0, availableSlots);

    try {
      const validFiles = nextFiles.filter((file) => {
        if (file.size > MAX_ATTACHMENT_SIZE) {
          showToast(`${file.name} excede o limite de 10 MB.`);
          return false;
        }
        if (classifyAttachment(file) === "unsupported") {
          showToast(`${file.name} não é um tipo permitido.`);
          return false;
        }
        return true;
      });

      const settled = await Promise.allSettled(validFiles.map((file) => createAttachmentRecord(file)));
      const records = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
      const failures = settled
        .flatMap((result, index) =>
          result.status === "rejected"
            ? [{ fileName: validFiles[index]?.name || "arquivo", message: result.reason?.message || "Falha ao anexar arquivo." }]
            : [],
        );
      const warnings = records
        .map((record) => record.warningMessage)
        .filter(Boolean);
      failures.forEach((failure) => showToast(failure.message || `${failure.fileName}: falha ao anexar.`));
      warnings.forEach((warning) => showToast(warning));
      if (!records.length) return;
      setMissionAttachments((current) => [...current, ...records].slice(0, MAX_ATTACHMENT_COUNT));
      showToast(`${records.length} arquivo(s) anexado(s)`);
    } catch (error) {
      console.error(error);
      showToast("Falha ao anexar arquivo.");
    }
  }

  function handleRemoveAttachment(attachmentId) {
    setMissionAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  }

  function openConfirm(title, body, onConfirm, options = {}) {
    setConfirmInput("");
    setConfirmState({
      open: true,
      title,
      body,
      onConfirm,
      secondaryAction: options.secondaryAction || null,
      confirmTone: options.confirmTone || "danger",
      requiresPassword: Boolean(options.requiresPassword),
      confirmValue: options.confirmValue || "",
      confirmLabel: options.confirmLabel || "Senha de confirmação",
      confirmPlaceholder: options.confirmPlaceholder || "",
      confirmHint: options.confirmHint || "",
      confirmActionLabel: options.confirmActionLabel || "Confirmar",
    });
  }

  function closeConfirm() {
    setConfirmInput("");
    setConfirmState({
      open: false,
      title: "",
      body: "",
      onConfirm: null,
      secondaryAction: null,
      confirmTone: "danger",
      requiresPassword: false,
      confirmValue: "",
      confirmLabel: "",
      confirmPlaceholder: "",
      confirmHint: "",
      confirmActionLabel: "Confirmar",
    });
  }

  function openDeleteConfirm({
    eventId,
    title,
    body,
    onConfirm,
    onArchive,
    passwordMode = "event_code",
    confirmActionLabel = "Confirmar",
    secondaryActionLabel = "Salvar histórico",
    facilitatorHint = "Digite a mesma senha do facilitador para liberar esta exclusão.",
  }) {
    const usesFacilitatorPassword = passwordMode === "facilitator";
    openConfirm(title, body, onConfirm, {
      requiresPassword: true,
      confirmValue: usesFacilitatorPassword ? FACILITATOR_PASSWORD : eventId,
      confirmLabel: "Senha de segurança",
      confirmPlaceholder: usesFacilitatorPassword ? "Digite a senha do facilitador" : `Digite o código do evento (${eventId})`,
      confirmHint: usesFacilitatorPassword
        ? facilitatorHint
        : "Digite exatamente o código do evento para liberar esta exclusão.",
      secondaryAction: onArchive
        ? {
            label: secondaryActionLabel,
            className: "btn-primary",
            onClick: onArchive,
          }
        : null,
      confirmActionLabel,
    });
  }

  function goHome() {
    setScreen("home");
    setEntryError("");
    setActiveStudentName("");
    setMaterialsDrawerOpen(false);
    setAnamnesisOpen(false);
    setAnamnesisAnswers({});
    setAnamnesisError("");
    setAnamnesisContext(null);
  }

  function goFacilitador() {
    setFacAccessPassword("");
    setFacAccessError("");
    setFacAccessOpen(true);
  }

  function handleFacilitadorAccess() {
    if (facAccessPassword.trim() !== FACILITATOR_PASSWORD) {
      setFacAccessError("Senha incorreta.");
      return;
    }
    setFacAccessOpen(false);
    setScreen("facilitador");
  }

  function goEntradaTime() {
    setMaterialsDrawerOpen(false);
    setAnamnesisOpen(false);
    setAnamnesisAnswers({});
    setAnamnesisError("");
    setAnamnesisContext(null);
    runBrandLoaderTransition(() => {
      setScreen("entry");
      setEntryError("");
      setTimeEventId(null);
      setTimeTeamIdx(null);
      setTimeMissionIdx(null);
      setActiveStudentName("");
    });
  }

  function goEscolhaTime() {
    setMaterialsDrawerOpen(false);
    setAnamnesisOpen(false);
    setAnamnesisAnswers({});
    setAnamnesisError("");
    setAnamnesisContext(null);
    setScreen("team");
    setTimeTeamIdx(null);
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
    const trimmedName = newEventForm.name.trim();
    const trimmedDesc = newEventForm.desc.trim();
    const trimmedTeams = newEventForm.teams.trim();

    if (!trimmedName) {
      showToast("Digite um nome para criar o evento");
      return;
    }

    try {
      const event = migrateEventToFixedMissions(
        Object.assign(
          makeEvent({
            name: trimmedName,
            desc: trimmedDesc,
            rawTeams: trimmedTeams,
          }),
          {
            eventMode: newEventForm.eventMode,
            anamnesisEnabled: Boolean(newEventForm.anamnesisEnabled),
          },
        ),
      );

      if (newEventForm.teamMode === "import") {
        if (!newEventStudents.length) {
          showToast("Cole pelo menos um nome para importar");
          return;
        }
        const generatedTeams = buildTeamsFromStudents(newEventStudents, "solo", 1);
        event.teams = generatedTeams;
      }

      updateEvents((current) => [...current, event]);
      setFacSelectedId(event.id);
      setFacTab("dashboard");
      setNewEventForm({
        name: "",
        desc: "",
        teams: "",
        eventMode: MISSIONS_MODE_EVENT,
        anamnesisEnabled: false,
        teamMode: "manual",
        studentsRaw: "",
        importMode: "solo",
        randomTeamCount: 2,
      });
      setNewEventOpen(false);
      setScreen("facilitador");
      showToast("Evento criado");
    } catch (error) {
      console.error(error);
      showToast(error?.message || "Falha ao criar evento");
    }
  }

  function handleSetAnamnesisEnabled(eventId, enabled) {
    updateEvents((current) =>
      current.map((event) => (event.id === eventId ? { ...event, anamnesisEnabled: enabled } : event)),
    );
    showToast(enabled ? "Anamnese habilitada no evento" : "Anamnese desabilitada no evento");
  }

  async function removeEventFromActiveList(eventId, { archive = false } = {}) {
    const currentEvents = store.events || [];
    const removedEvent = currentEvents.find((event) => event.id === eventId) || null;
    if (!removedEvent) {
      showToast("Não foi possível localizar o evento para excluir");
      return;
    }
    const hiddenAt = new Date().toISOString();
    const nextEventsSnapshot = currentEvents.map((event) =>
      event.id !== eventId
        ? event
        : {
            ...event,
            hiddenAt,
            hiddenReason: archive ? "archived" : "hidden",
          },
    );
    const archivedRecord = archive
      ? {
          archivedAt: hiddenAt,
          event: removedEvent,
        }
      : null;

    setStore((current) => ({
      ...current,
      events: nextEventsSnapshot,
      archivedEvents: archivedRecord ? [archivedRecord, ...(current.archivedEvents || [])] : current.archivedEvents || [],
    }));

    if (facSelectedId === eventId) setFacSelectedId(null);
    if (timeEventId === eventId) {
      setTimeEventId(null);
      setTimeTeamIdx(null);
      setTimeMissionIdx(null);
      setScreen("entry");
    }

    try {
      if (serverConfig.supabaseConfigured) {
        const normalizedEvents = normalizeEventsForProduct(nextEventsSnapshot);
        lastRemoteEventsRef.current = JSON.stringify(normalizedEvents);
        await saveRemoteState(normalizedEvents);
      }
      showToast(archive ? "Evento ocultado e histórico salvo" : "Evento ocultado da lista ativa");
    } catch (error) {
      console.error(error);
      showToast(archive ? "Evento ocultado localmente e histórico salvo, mas falhou na sincronização" : "Evento ocultado localmente, mas falhou na sincronização");
    }
  }

  function archiveEventSnapshot(eventId) {
    void removeEventFromActiveList(eventId, { archive: true });
  }

  function handleDeleteEvent(eventId) {
    void removeEventFromActiveList(eventId, { archive: false });
  }

  function handleSetStatus(eventId, status) {
    updateEvents((current) => current.map((event) => (event.id === eventId ? { ...event, status } : event)));
    showToast(status === "open" ? "Evento aberto" : status === "closed" ? "Evento encerrado" : "Evento voltou para preparação");
  }

  function handleSetEventMode(eventId, eventMode) {
    updateEvents((current) => current.map((event) => (event.id === eventId ? { ...event, eventMode } : event)));
    if (timeEventId === eventId) {
      setTimeMissionIdx(null);
      setMissionFlow({ stage: "idle", exec: null });
      setMissionInput("");
      setRunError("");
    }
    showToast(eventMode === TRAINING_MODE_EVENT ? "Modo treino ativado" : "Modo por missões ativado");
  }

  function handleAddTeam() {
    if (!newTeamName.trim() || !selectedEvent) return;
    updateEvents((current) =>
      current.map((event) =>
        event.id !== selectedEvent.id
          ? event
          : { ...event, teams: [...event.teams, makeTeam(newTeamName.trim())] },
      ),
    );
    setNewTeamName("");
    setAddTeamOpen(false);
    showToast("Time adicionado");
  }

  function applyImportedTeams(eventId, teams) {
    updateEvents((current) =>
      current.map((event) =>
        event.id !== eventId
          ? event
          : {
              ...event,
              teams,
              execucoes: {},
              reflexoes: {},
              questionariosPendentes: {},
              conclusoes: {},
              preservedMissionUsage: {},
              helpRequests: [],
              helpDisabledMap: {},
            },
      ),
    );
    if (timeEventId === eventId) {
      setTimeTeamIdx(null);
      setTimeMissionIdx(null);
      setMissionFlow({ stage: "idle", exec: null });
      setHistoryOpen(false);
      setMissionInput("");
    }
    setTeamImportForm({
      studentsRaw: "",
      importMode: "solo",
      randomTeamCount: 2,
    });
    setAddTeamOpen(false);
    showToast("Times gerados");
  }

  function handleGenerateTeamsForEvent() {
    if (!selectedEvent) return;
    if (!importedStudents.length) {
      showToast("Cole pelo menos um nome para importar");
      return;
    }
    if (teamImportForm.importMode === "random" && (!teamImportForm.randomTeamCount || teamImportForm.randomTeamCount > importedStudents.length)) {
      showToast("Defina uma quantidade de times válida");
      return;
    }

    const teams = buildTeamsFromStudents(importedStudents, teamImportForm.importMode, teamImportForm.randomTeamCount);
    if (selectedEvent.teams.length) {
      openConfirm(
        "Substituir estrutura de times",
        "Os times atuais serão substituídos e os vínculos operacionais desta turma serão zerados para reconfigurar o evento do zero. Deseja continuar?",
        () => applyImportedTeams(selectedEvent.id, teams),
        { confirmTone: "primary" },
      );
      return;
    }

    applyImportedTeams(selectedEvent.id, teams);
  }

  function handleRemoveTeam(eventId, index) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const teams = [...event.teams];
        teams.splice(index, 1);
        const filterMissionKeyMap = (map = {}) =>
          Object.fromEntries(
            Object.entries(map).filter(([key]) => {
              const teamIdx = Number(`${key}`.split("__")[0]);
              return teamIdx !== index;
            }),
          );
        const remapTeamScopedMap = (map = {}) =>
          Object.fromEntries(
            Object.entries(map).flatMap(([key, value]) => {
              const teamIdx = Number(key);
              if (!Number.isFinite(teamIdx) || teamIdx === index) return [];
              const nextKey = teamIdx > index ? `${teamIdx - 1}` : `${teamIdx}`;
              return [[nextKey, value]];
            }),
          );
        return {
          ...event,
          teams,
          execucoes: filterMissionKeyMap(event.execucoes),
          reflexoes: filterMissionKeyMap(event.reflexoes),
          questionariosPendentes: filterMissionKeyMap(event.questionariosPendentes),
          conclusoes: filterMissionKeyMap(event.conclusoes),
          preservedMissionUsage: filterMissionKeyMap(event.preservedMissionUsage),
          helpRequests: (event.helpRequests || []).filter((request) => request.teamIdx !== index),
          helpDisabledMap: remapTeamScopedMap(event.helpDisabledMap),
          trainingRuns: Object.fromEntries(
            Object.entries(event.trainingRuns || {}).filter(([key]) => Number(key) !== index),
          ),
          trainingHelpRequests: (event.trainingHelpRequests || []).filter((request) => request.teamIdx !== index),
        };
      }),
    );
    showToast("Time removido");
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
    showToast(unlocked ? "Missão liberada" : "Missão bloqueada");
  }

  function handleMissionAiModeChange(eventId, index, aiMode) {
    updateEvents((current) =>
      current.map((event) =>
        event.id !== eventId
          ? event
          : {
              ...event,
              missions: event.missions.map((mission, missionIndex) =>
                missionIndex === index ? { ...mission, aiMode: aiMode === CODING_AI_MODE ? CODING_AI_MODE : CHAT_AI_MODE } : mission,
              ),
            },
      ),
    );
    showToast(`Missão ajustada para ${AI_MODE_LABELS[aiMode] || AI_MODE_LABELS[CHAT_AI_MODE]}`);
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
        chatModel: configForm.chatModel,
        codingModel: configForm.codingModel,
      }));
      setConfigForm((current) => ({ ...current, apiKey: "" }));
      setConfigOpen(false);
      showToast(trimmedKey ? "Chave salva no servidor local" : "Modelo atualizado");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Falha ao salvar configuração da IA");
    }
  }

  async function handleRemoveKey() {
    try {
      const nextConfig = await removeServerOpenAIKey();
      setServerConfig(nextConfig);
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
      setEntryError("Informe o código do evento.");
      return;
    }
    const event = events.find((item) => item.id === entryCode.trim());
    if (!event) {
      setEntryError("Evento não encontrado. Verifique o código com o facilitador.");
      return;
    }
    if (event.status === "draft") {
      setEntryError("Este evento ainda não foi aberto. Aguarde o facilitador.");
      return;
    }
    if (event.status === "closed") {
      setEntryError("Este evento já foi encerrado.");
      return;
    }
    setEntryError("");
    setTimeEventId(event.id);
    setTimeTeamIdx(null);
    setScreen("team");
  }

  function handleEscolherTime(index, memberName = "") {
    const selectedEvent = events.find((event) => event.id === timeEventId) || null;
    const eventMode = selectedEvent ? getEventMode(selectedEvent) : MISSIONS_MODE_EVENT;
    const pendingMissionIdx =
      selectedEvent && eventMode !== TRAINING_MODE_EVENT ? getFirstPendingMissionIndex(selectedEvent, index) : -1;
    const firstUnlockedMissionIdx =
      selectedEvent && eventMode !== TRAINING_MODE_EVENT
        ? selectedEvent.missions.findIndex((mission) => mission.unlocked)
        : -1;
    const normalizedMemberName = normalizeStudentName(memberName || "") || selectedEvent?.teams?.[index]?.name || "";

    if (selectedEvent && isAnamnesisEnabled(selectedEvent) && !hasCompletedAnamnesis(selectedEvent, index)) {
      setActiveStudentName(normalizedMemberName);
      setAnamnesisAnswers({});
      setAnamnesisError("");
      setAnamnesisStep(0);
      setAnamnesisContext({
        eventId: selectedEvent.id,
        teamIdx: index,
        memberName: normalizedMemberName,
        nextMissionIdx: pendingMissionIdx >= 0 ? pendingMissionIdx : firstUnlockedMissionIdx >= 0 ? firstUnlockedMissionIdx : null,
      });
      setAnamnesisOpen(true);
      return;
    }

    runBrandLoaderTransition(() => {
      setActiveStudentName(normalizedMemberName);
      setTimeTeamIdx(index);
      setTimeMissionIdx(pendingMissionIdx >= 0 ? pendingMissionIdx : firstUnlockedMissionIdx >= 0 ? firstUnlockedMissionIdx : null);
      setScreen("workspace");
    });
  }

  function handleSelectEntryEvent(eventId) {
    setEntryError("");
    setTimeEventId(eventId);
    setTimeTeamIdx(null);
    setTimeMissionIdx(null);
    setScreen("team");
  }

  function handleEscolherAluno(teamIdx) {
    const selectedStudent = teamStudentOptions.find((item) => item.teamIdx === teamIdx);
    const label = selectedStudent?.name || teamEvent?.teams?.[teamIdx]?.name || "este nome";
    openConfirm(
      "Confirmar identidade",
      `Confirmar que você é ${label}?`,
      () => handleEscolherTime(teamIdx, label),
      { confirmTone: "primary" },
    );
  }

  function handleToggleAnamnesisOption(question, optionIdx) {
    setAnamnesisError("");
    setAnamnesisAnswers((current) => {
      const currentValue = current[question.id];
      const unknownSelected = optionIdx === ANAMNESIS_UNKNOWN_VALUE;
      const currentChoice = question.optionalText ? getAnamnesisAnswerChoice(question, currentValue) : currentValue;
      const currentNote = question.optionalText ? getAnamnesisAnswerNote(question, currentValue) : "";

      if (question.type === "multi") {
        const next = Array.isArray(currentChoice) ? [...currentChoice] : [];
        let nextValue;
        if (unknownSelected) {
          nextValue = next.includes(ANAMNESIS_UNKNOWN_VALUE) ? [] : [ANAMNESIS_UNKNOWN_VALUE];
        } else {
          const withoutUnknown = next.filter((item) => item !== ANAMNESIS_UNKNOWN_VALUE);
          nextValue = withoutUnknown.includes(optionIdx)
            ? withoutUnknown.filter((item) => item !== optionIdx)
            : [...withoutUnknown, optionIdx].sort((a, b) => a - b);
        }
        return {
          ...current,
          [question.id]: question.optionalText ? { choice: nextValue, note: currentNote } : nextValue,
        };
      }

      const nextValue = currentChoice === optionIdx ? "" : optionIdx;
      const finalChoice = unknownSelected ? ANAMNESIS_UNKNOWN_VALUE : nextValue;
      return {
        ...current,
        [question.id]: question.optionalText ? { choice: finalChoice, note: currentNote } : finalChoice,
      };
    });
  }

  function handleChangeAnamnesisText(questionId, value) {
    setAnamnesisError("");
    const question = ANAMNESIS_QUESTIONS.find((item) => item.id === questionId);
    if (!question) return;
    setAnamnesisAnswers((current) => {
      if (!question.optionalText) return { ...current, [questionId]: value };
      const currentValue = current[questionId];
      return {
        ...current,
        [questionId]: {
          choice: getAnamnesisAnswerChoice(question, currentValue) ?? (question.type === "multi" ? [] : ""),
          note: value,
        },
      };
    });
  }

  function handleCloseAnamnesisModal() {
    setAnamnesisOpen(false);
    setAnamnesisAnswers({});
    setAnamnesisError("");
    setAnamnesisContext(null);
    setAnamnesisStep(0);
    setActiveStudentName("");
  }

  function handleAdvanceAnamnesisStep() {
    if (!currentAnamnesisQuestion) return;
    if (!isCurrentAnamnesisAnswered) {
      setAnamnesisError(`Responda a pergunta ${currentAnamnesisQuestion.number} antes de continuar.`);
      return;
    }
    setAnamnesisError("");
    setAnamnesisStep((current) => Math.min(current + 1, ANAMNESIS_QUESTIONS.length - 1));
  }

  function handleReturnAnamnesisStep() {
    setAnamnesisError("");
    setAnamnesisStep((current) => Math.max(current - 1, 0));
  }

  function handleSubmitAnamnesis() {
    if (!anamnesisContext) return;
    const missingQuestion = ANAMNESIS_QUESTIONS.find(
      (question) => !isAnamnesisAnswerFilled(question, anamnesisAnswers[question.id]),
    );
    if (missingQuestion) {
      setAnamnesisError(`Responda a pergunta ${missingQuestion.number} antes de continuar.`);
      setAnamnesisStep(Math.max(0, ANAMNESIS_QUESTIONS.findIndex((question) => question.id === missingQuestion.id)));
      return;
    }

    const normalizedAnswers = ANAMNESIS_QUESTIONS.reduce((accumulator, question) => {
      accumulator[question.id] = normalizeAnamnesisAnswer(question, anamnesisAnswers[question.id]);
      return accumulator;
    }, {});
    const submittedAt = new Date().toISOString();

    updateEvents((current) =>
      current.map((event) =>
        event.id !== anamnesisContext.eventId
          ? event
          : {
              ...event,
              anamnesisResponses: {
                ...(event.anamnesisResponses || {}),
                [anamnesisContext.teamIdx]: {
                  teamIdx: anamnesisContext.teamIdx,
                  memberName: anamnesisContext.memberName,
                  answers: normalizedAnswers,
                  submittedAt,
                  updatedAt: submittedAt,
                },
              },
            },
      ),
    );

    setAnamnesisOpen(false);
    setAnamnesisAnswers({});
    setAnamnesisError("");
    setAnamnesisStep(0);
    const nextContext = anamnesisContext;
    setAnamnesisContext(null);
    runBrandLoaderTransition(() => {
      setTimeEventId(nextContext.eventId);
      setTimeTeamIdx(nextContext.teamIdx);
      setTimeMissionIdx(nextContext.nextMissionIdx);
      setActiveStudentName(nextContext.memberName);
      setScreen("workspace");
    });
    showToast("Obrigado. Sua anamnese foi enviada.");
  }

  function handleSelectMission(index) {
    if (teamEvent && timeTeamIdx !== null) {
      const pendingMissionIdx = getFirstPendingMissionIndex(teamEvent, timeTeamIdx);
      if (pendingMissionIdx >= 0 && pendingMissionIdx !== index) {
        setTimeMissionIdx(pendingMissionIdx);
        return;
      }
    }
    setTimeMissionIdx(index);
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

  function saveTrainingExecution(eventId, teamIdx, execData) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const key = `${teamIdx}`;
        const trainingRuns = { ...(event.trainingRuns || {}) };
        trainingRuns[key] = [...(trainingRuns[key] || []), execData];
        const teams = event.teams.map((item, index) => (index === teamIdx ? { ...item, runs: (item.runs || 0) + 1 } : item));
        return { ...event, trainingRuns, teams };
      }),
    );
  }

  function updateExecutionAnalysis(eventId, teamIdx, missionId, execId, technicalAnalysis, technicalAnalysisUsage) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const isTraining = !missionId;
        const glossaryMissionId = getAnalysisMissionId(missionId, { isTraining });
        const currentGlossary = getMissionGlossary(event, teamIdx, glossaryMissionId, { isTraining });
        const normalizedAnalysis = normalizeTechnicalAnalysis(technicalAnalysis, {
          accumulatedGlossary: currentGlossary,
        });
        const missionGlossaries = {
          ...(event.missionGlossaries || {}),
          [getMissionGlossaryKey(teamIdx, glossaryMissionId)]: normalizedAnalysis.glossary.accumulated,
        };
        if (missionId) {
          const key = `${teamIdx}__${missionId}`;
          const execucoes = { ...(event.execucoes || {}) };
          execucoes[key] = (execucoes[key] || []).map((exec) =>
            exec.id !== execId
              ? exec
              : {
                  ...exec,
                  explicacao: getTechnicalAnalysisLeadText(normalizedAnalysis) || exec.explicacao,
                  reasoningSummary: getTechnicalAnalysisReasoningSummary(normalizedAnalysis) || exec.reasoningSummary,
                  reasoningDetails: normalizedAnalysis,
                  technicalAnalysis: normalizedAnalysis,
                  technicalAnalysisUsage,
                },
          );
          return { ...event, execucoes, missionGlossaries };
        }

        const key = `${teamIdx}`;
        const trainingRuns = { ...(event.trainingRuns || {}) };
        trainingRuns[key] = (trainingRuns[key] || []).map((exec) =>
          exec.id !== execId
            ? exec
            : {
                ...exec,
                explicacao: getTechnicalAnalysisLeadText(normalizedAnalysis) || exec.explicacao,
                reasoningSummary: getTechnicalAnalysisReasoningSummary(normalizedAnalysis) || exec.reasoningSummary,
                reasoningDetails: normalizedAnalysis,
                technicalAnalysis: normalizedAnalysis,
                technicalAnalysisUsage,
              },
        );
        return { ...event, trainingRuns, missionGlossaries };
      }),
    );

    const normalizedAnalysis = normalizeTechnicalAnalysis(technicalAnalysis, {
      accumulatedGlossary: missionFlow.exec?.technicalAnalysis?.glossary?.accumulated || [],
    });
    setMissionFlow((current) =>
      current.exec?.id !== execId
        ? current
        : {
            ...current,
            exec: {
              ...current.exec,
              explicacao: getTechnicalAnalysisLeadText(normalizedAnalysis) || current.exec.explicacao,
              reasoningSummary: getTechnicalAnalysisReasoningSummary(normalizedAnalysis) || current.exec.reasoningSummary,
              reasoningDetails: normalizedAnalysis,
              technicalAnalysis: normalizedAnalysis,
              technicalAnalysisUsage,
            },
          },
    );
  }

  function saveReflection(eventId, teamIdx, missionId, missionName, respostas, comment) {
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const key = `${teamIdx}__${missionId}`;
        const submittedAt = new Date().toISOString();
        const questionariosPendentes = { ...(event.questionariosPendentes || {}) };
        const pendingSource =
          typeof questionariosPendentes[key] === "object" && questionariosPendentes[key]
            ? questionariosPendentes[key].source
            : "team";
        delete questionariosPendentes[key];
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
          questionariosPendentes,
          conclusoes: {
            ...(event.conclusoes || {}),
            [key]: {
              closedAt: submittedAt,
              source: pendingSource === "team" ? "team" : "facilitator",
            },
          },
        };
      }),
    );
  }

  function openMissionQuestionnaireForTeams(eventId, missionId, teamIndexes, source = "facilitator") {
    if (!teamIndexes.length) return;
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const pendingMap = { ...(event.questionariosPendentes || {}) };
        teamIndexes.forEach((teamIdx) => {
          const key = `${teamIdx}__${missionId}`;
          if (!event.conclusoes?.[key]) {
            pendingMap[key] = {
              openedAt: new Date().toISOString(),
              source,
            };
          }
        });
        return {
          ...event,
          questionariosPendentes: pendingMap,
        };
      }),
    );
  }

  function handleTeamCloseMission() {
    if (!teamEvent || timeTeamIdx === null || !currentMission || isTrainingEvent) return;
    openMissionQuestionnaireForTeams(teamEvent.id, currentMission.id, [timeTeamIdx], "team");
    setReflectionAnswers({});
    setReflectionComment("");
    setReflectionError("");
    setMissionFlow((current) => ({ ...current, stage: "questionario_final" }));
    setMissionInput("");
    setMissionAttachments([]);
    showToast("Missão encerrada para este time");
  }

  function handleCancelTeamMissionClosure() {
    if (!teamEvent || timeTeamIdx === null || !currentMission || isTrainingEvent) return;
    if (getQuestionarioPendenteSource(teamEvent, timeTeamIdx, currentMission.id) !== "team") return;
    const key = `${timeTeamIdx}__${currentMission.id}`;
    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== teamEvent.id) return event;
        const questionariosPendentes = { ...(event.questionariosPendentes || {}) };
        delete questionariosPendentes[key];
        return {
          ...event,
          questionariosPendentes,
        };
      }),
    );
    setReflectionAnswers({});
    setReflectionComment("");
    setReflectionError("");
    setMissionFlow((current) => ({ ...current, stage: current.exec ? current.stage : "idle" }));
    showToast("Encerramento cancelado");
  }

  function handleFacilitatorCloseMission(eventId, missionId) {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    const teamIndexes = event.teams
      .map((_, teamIdx) => teamIdx)
      .filter((teamIdx) => getMissionClosureStatus(event, teamIdx, missionId) === "aberta");
    if (!teamIndexes.length) {
      showToast("Todos os times desta missão já foram encerrados");
      return;
    }
    openMissionQuestionnaireForTeams(eventId, missionId, teamIndexes, "facilitator");
    showToast("Questionário liberado para os times ainda abertos");
  }

  function handleFacilitatorCloseMissionWithoutEvaluation(eventId, missionId) {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    const teamIndexes = event.teams
      .map((_, teamIdx) => teamIdx)
      .filter((teamIdx) => !isConcluida(event, teamIdx, missionId));
    if (!teamIndexes.length) {
      showToast("Todos os times desta missão já foram concluídos");
      return;
    }
    const concludedAt = new Date().toISOString();
    updateEvents((current) =>
      current.map((item) => {
        if (item.id !== eventId) return item;
        const questionariosPendentes = { ...(item.questionariosPendentes || {}) };
        const conclusoes = { ...(item.conclusoes || {}) };
        teamIndexes.forEach((teamIdx) => {
          const key = `${teamIdx}__${missionId}`;
          delete questionariosPendentes[key];
          conclusoes[key] = {
            closedAt: concludedAt,
            source: "facilitator_no_evaluation",
          };
        });
        return {
          ...item,
          questionariosPendentes,
          conclusoes,
        };
      }),
    );
    showToast("Missão encerrada sem avaliação para os times restantes");
  }

  function handleFacilitatorReopenMission(eventId, missionId) {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    const teamIndexes = event.teams
      .map((_, teamIdx) => teamIdx)
      .filter((teamIdx) => canFacilitatorReopenMissionForTeam(event, teamIdx, missionId));
    if (!teamIndexes.length) {
      showToast("Nenhum time elegível para reabertura nesta missão");
      return;
    }
    updateEvents((current) =>
      current.map((item) => {
        if (item.id !== eventId) return item;
        const questionariosPendentes = { ...(item.questionariosPendentes || {}) };
        const conclusoes = { ...(item.conclusoes || {}) };
        const reflexoes = { ...(item.reflexoes || {}) };
        teamIndexes.forEach((teamIdx) => {
          const key = `${teamIdx}__${missionId}`;
          delete questionariosPendentes[key];
          delete conclusoes[key];
          if (getConclusaoSource(item, teamIdx, missionId) === "facilitator") {
            delete reflexoes[key];
          }
        });
        return {
          ...item,
          questionariosPendentes,
          conclusoes,
          reflexoes,
        };
      }),
    );
    showToast("Missão reaberta para os times fechados pelo facilitador");
  }

  function handleOpenHelp() {
    if (teamHelpDisabled) {
      showToast("Ajuda desativada para este time");
      return;
    }
    setHelpMessage(currentOpenHelpRequest?.message || "");
    setHelpOpen(true);
  }

  function handleToggleHelpDisabled() {
    if (!teamEvent || timeTeamIdx === null) return;
    const nextDisabled = !teamHelpDisabled;
    const nowIso = new Date().toISOString();

    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== teamEvent.id) return event;

        const baseEvent = {
          ...event,
          helpDisabledMap: {
            ...(event.helpDisabledMap || {}),
            [timeTeamIdx]: {
              disabled: nextDisabled,
              updatedAt: nowIso,
            },
          },
        };

        if (!nextDisabled) return baseEvent;

        const cancelRequest = (request) =>
          request.teamIdx === timeTeamIdx && request.status === "open"
            ? {
                ...request,
                status: "cancelled",
                cancelledAt: nowIso,
                updatedAt: nowIso,
              }
            : request;

        return {
          ...baseEvent,
          helpRequests: (baseEvent.helpRequests || []).map(cancelRequest),
          trainingHelpRequests: (baseEvent.trainingHelpRequests || []).map(cancelRequest),
        };
      }),
    );

    if (nextDisabled) {
      setHelpOpen(false);
      setHelpMessage("");
      showToast(currentOpenHelpRequest ? "Ajuda desativada e pedido cancelado" : "Ajuda desativada para este time");
      return;
    }

    showToast("Ajuda reativada para este time");
  }

  function handleOpenBroadcastModal() {
    if (!selectedEvent) return;
    setBroadcastMessage("");
    setBroadcastOpen(true);
  }

  function handleStartSessionTimer() {
    if (!selectedEvent) return;
    const durationMs = parseTimerInputToMs(timerMinutesInput);
    if (!durationMs) {
      showToast("Defina um tempo válido em MM:SS");
      return;
    }
    const startedAt = new Date().toISOString();
    const endsAt = new Date(Date.now() + durationMs).toISOString();
    updateEvents((current) =>
      current.map((event) =>
        event.id !== selectedEvent.id
          ? event
          : {
              ...event,
              sessionTimer: {
                active: true,
                startedAt,
                endsAt,
                durationMs,
              },
              sessionTimerNotice: {
                id: `timer_notice_${Date.now()}`,
                message: `Cronômetro iniciado com ${formatCountdown(durationMs)}.`,
                createdAt: new Date().toISOString(),
                dismissedAt: null,
              },
            },
      ),
    );
    showToast("Cronômetro iniciado");
  }

  function handleAddSessionTimer(extraMinutes = null) {
    if (!selectedEvent) return;
    const extraDurationMs = extraMinutes !== null ? Math.round(extraMinutes * 60 * 1000) : parseTimerInputToMs(timerMinutesInput);
    if (!extraDurationMs) {
      showToast("Defina um tempo válido para acrescentar");
      return;
    }
    const currentTimer = getSessionTimer(selectedEvent);
    const now = Date.now();
    const currentEndsAt = currentTimer.endsAt ? new Date(currentTimer.endsAt).getTime() : now;
    const baseTime = Math.max(now, currentEndsAt);
    const nextEndsAt = new Date(baseTime + extraDurationMs).toISOString();
    updateEvents((current) =>
      current.map((event) =>
        event.id !== selectedEvent.id
          ? event
          : {
              ...event,
              sessionTimer: {
                active: true,
                startedAt: currentTimer.startedAt || new Date(now).toISOString(),
                endsAt: nextEndsAt,
                durationMs: Math.max(0, currentTimer.durationMs || 0) + extraDurationMs,
              },
              sessionTimerNotice: {
                id: `timer_notice_${Date.now()}`,
                message: `Tempo acrescentado: +${formatCountdown(extraDurationMs)}.`,
                createdAt: new Date().toISOString(),
                dismissedAt: null,
              },
            },
      ),
    );
    showToast(`+${formatCountdown(extraDurationMs)} adicionados`);
  }

  function handleClearSessionTimer() {
    if (!selectedEvent) return;
    updateEvents((current) =>
      current.map((event) =>
        event.id !== selectedEvent.id
          ? event
          : {
              ...event,
              sessionTimer: {
                active: false,
                startedAt: null,
                endsAt: null,
                durationMs: 0,
              },
              sessionTimerNotice: null,
            },
      ),
    );
    showToast("Cronômetro encerrado");
  }

  function handleDismissSessionTimerNotice() {
    if (!selectedEvent) return;
    updateEvents((current) =>
      current.map((event) =>
        event.id !== selectedEvent.id
          ? event
          : {
              ...event,
              sessionTimerNotice: event.sessionTimerNotice
                ? {
                    ...event.sessionTimerNotice,
                    dismissedAt: new Date().toISOString(),
                  }
                : null,
            },
      ),
    );
  }

  function handleSaveMissionTokenPolicy(missionId, nextPolicyInput) {
    if (!selectedEvent || !missionId) return;
    handleUpdateMissionTokenPolicy(selectedEvent.id, missionId, nextPolicyInput);
    showToast("Política de tokens atualizada");
  }

  function handleToggleMissionTemporaryUnlimited(missionId, nextValue) {
    if (!selectedEvent || !missionId) return;
    handleUpdateMissionTokenPolicy(selectedEvent.id, missionId, { temporaryUnlimited: nextValue });
    showToast(nextValue ? "Missão temporariamente ilimitada" : "Missão voltou ao limite configurado");
  }

  function handleSaveBroadcastMessage() {
    if (!selectedEvent) return;
    const message = broadcastMessage.trim();
    if (!message) return;
    const createdAt = new Date().toISOString();
    updateEvents((current) =>
      current.map((event) =>
        event.id !== selectedEvent.id
          ? event
          : {
              ...event,
              announcements: [
                ...getEventAnnouncements(event),
                {
                  id: `announcement_${Date.now()}`,
                  message,
                  createdAt,
                  dismissedBy: {},
                  readBy: {},
                },
              ],
              announcement: null,
            },
      ),
    );
    setBroadcastOpen(false);
    showToast("Mensagem enviada para a turma");
  }

  function handleClearBroadcastMessage() {
    if (!selectedEvent) return;
    updateEvents((current) =>
      current.map((event) =>
        event.id !== selectedEvent.id
          ? event
          : {
              ...event,
              announcements: [],
              announcement: null,
            },
      ),
    );
    setBroadcastOpen(false);
    setBroadcastMessage("");
    setTeamAnnouncementOpen(false);
    showToast("Mensagem da turma removida");
  }

  function handleDismissTeamAnnouncement() {
    if (!teamEvent || timeTeamIdx === null || !latestUnreadAnnouncement) {
      setTeamAnnouncementOpen(false);
      return;
    }
    updateEvents((current) =>
      current.map((event) =>
        event.id !== teamEvent.id
          ? event
          : {
              ...event,
              announcements: getEventAnnouncements(event).map((announcement) =>
                announcement.id !== latestUnreadAnnouncement.id
                  ? announcement
                  : {
                      ...announcement,
                      dismissedBy: {
                        ...(announcement.dismissedBy || {}),
                        [timeTeamIdx]: new Date().toISOString(),
                      },
                    },
              ),
              announcement: null,
            },
      ),
    );
    setTeamAnnouncementOpen(false);
  }

  function handleOpenTeamAnnouncementInbox() {
    if (!teamEvent || timeTeamIdx === null) {
      setTeamAnnouncementInboxOpen(true);
      return;
    }
    updateEvents((current) =>
      current.map((event) =>
        event.id !== teamEvent.id
          ? event
          : {
              ...event,
              announcements: getEventAnnouncements(event).map((announcement) => ({
                ...announcement,
                readBy: {
                  ...(announcement.readBy || {}),
                  [timeTeamIdx]: new Date().toISOString(),
                },
              })),
              announcement: null,
            },
      ),
    );
    setTeamAnnouncementOpen(false);
    setTeamAnnouncementInboxOpen(true);
  }

  function handleSendHelpRequest() {
    if (!teamEvent || timeTeamIdx === null || !currentMission) return;
    if (teamHelpDisabled) {
      showToast("Ajuda desativada para este time");
      return;
    }
    const message = helpMessage.trim();
    if (!message) return;
    if (currentOpenHelpRequest) return;

    updateEvents((current) =>
      current.map((event) =>
        event.id !== teamEvent.id
          ? event
          : {
              ...event,
              ...(isTrainingEvent
                ? {
                    trainingHelpRequests: [
                      ...(event.trainingHelpRequests || []),
                      {
                        id: `help_${Date.now()}`,
                        teamIdx: timeTeamIdx,
                        message,
                        status: "open",
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  }
                : {
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
                  }),
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
              ...(isTrainingEvent && !(event.helpRequests || []).some((request) => request.id === requestId)
                ? {
                    trainingHelpRequests: (event.trainingHelpRequests || []).map((request) =>
                      request.id !== requestId
                        ? request
                        : {
                            ...request,
                            status: "cancelled",
                            cancelledAt: new Date().toISOString(),
                          },
                    ),
                  }
                : {
                    helpRequests: (event.helpRequests || []).map((request) =>
                      request.id !== requestId
                        ? request
                        : {
                            ...request,
                            status: "cancelled",
                            cancelledAt: new Date().toISOString(),
                          },
                    ),
                  }),
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
              ...(getEventMode(event) === TRAINING_MODE_EVENT && !(event.helpRequests || []).some((request) => request.id === requestId)
                ? {
                    trainingHelpRequests: (event.trainingHelpRequests || []).map((request) =>
                      request.id !== requestId
                        ? request
                        : {
                            ...request,
                            status: "resolved",
                            resolvedAt: new Date().toISOString(),
                          },
                    ),
                  }
                : {
                    helpRequests: (event.helpRequests || []).map((request) =>
                      request.id !== requestId
                        ? request
                        : {
                            ...request,
                            status: "resolved",
                            resolvedAt: new Date().toISOString(),
                          },
                    ),
                  }),
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
        explanationTotal: acc.explanationTotal + (exec.technicalAnalysisUsage?.totalTokens || 0),
        explanationInput: acc.explanationInput + (exec.technicalAnalysisUsage?.inputTokens || 0),
        explanationOutput: acc.explanationOutput + (exec.technicalAnalysisUsage?.outputTokens || 0),
        explanationCost: acc.explanationCost + (exec.technicalAnalysisUsage?.cost || 0),
      }),
      { total: 0, input: 0, output: 0, cost: 0, explanationTotal: 0, explanationInput: 0, explanationOutput: 0, explanationCost: 0 },
    );

    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== teamEvent.id) return event;
        const execucoes = { ...(event.execucoes || {}) };
        const reflexoes = { ...(event.reflexoes || {}) };
        const questionariosPendentes = { ...(event.questionariosPendentes || {}) };
        const conclusoes = { ...(event.conclusoes || {}) };
        const preservedMissionUsage = { ...(event.preservedMissionUsage || {}) };
        const currentPreserved = preservedMissionUsage[key] || {
          total: 0,
          input: 0,
          output: 0,
          cost: 0,
          explanationTotal: 0,
          explanationInput: 0,
          explanationOutput: 0,
          explanationCost: 0,
        };

        delete execucoes[key];
        delete reflexoes[key];
        delete questionariosPendentes[key];
        delete conclusoes[key];

        preservedMissionUsage[key] = {
          total: currentPreserved.total + removedTotals.total,
          input: currentPreserved.input + removedTotals.input,
          output: currentPreserved.output + removedTotals.output,
          cost: currentPreserved.cost + removedTotals.cost,
          explanationTotal: currentPreserved.explanationTotal + removedTotals.explanationTotal,
          explanationInput: currentPreserved.explanationInput + removedTotals.explanationInput,
          explanationOutput: currentPreserved.explanationOutput + removedTotals.explanationOutput,
          explanationCost: currentPreserved.explanationCost + removedTotals.explanationCost,
        };

        return {
          ...event,
          execucoes,
          reflexoes,
          questionariosPendentes,
          conclusoes,
          preservedMissionUsage,
        };
      }),
    );

    setMissionInput("");
    setRunError("");
    setRunState(null);
    setMissionFlow({ stage: "idle", exec: null });
    showToast("Missão reaberta do zero");
  }

  function handleResetTrainingConversation() {
    if (!teamEvent || timeTeamIdx === null) return;

    updateEvents((current) =>
      current.map((event) => {
        if (event.id !== teamEvent.id) return event;
        const trainingRuns = { ...(event.trainingRuns || {}) };
        delete trainingRuns[`${timeTeamIdx}`];
        return {
          ...event,
          trainingRuns,
          trainingHelpRequests: (event.trainingHelpRequests || []).filter((request) => request.teamIdx !== timeTeamIdx),
        };
      }),
    );

    setMissionInput("");
    setRunError("");
    setRunState(null);
    setMissionFlow({ stage: "idle", exec: null });
    showToast("Conversa do time reiniciada");
  }

  async function handleExecutarMissao() {
    if (!teamEvent || timeTeamIdx === null || !currentMission) return;
    if (!isTrainingEvent && currentMissionStatus !== "aberta") return;
    if (teamTimerLockActive) {
      setRunError("O cronômetro desta atividade foi encerrado pelo facilitador.");
      return;
    }
    if (currentTokenBudget?.blocked) {
      setTokenLimitModalOpen(true);
      return;
    }
    const input = missionInput.trim();
    const attachments = missionAttachments;
    const acao = FREE_ACTION_KEY;
    const historyContext = buildHistoryContext(currentExecs);
    const aiMode = getMissionAiMode(currentMission);
    const selectedModel = selectedModelForMode;
    const wasPlanningOn = store.planningMode === "on";
    const shouldStreamCoding = apiConfigured && aiMode === CODING_AI_MODE;
    const shouldAutoOpenPreview = shouldStreamCoding && isHtmlPrototypeRequest(input);
    const previousCodingResponseId =
      aiMode === CODING_AI_MODE
        ? currentExecs[currentExecs.length - 1]?.codingResponseId || ""
        : "";
    if (!input && !attachments.length) {
      setRunError("Escreva um input ou anexe pelo menos um arquivo.");
      return;
    }

    setActivePrompt(input);
    setActiveAttachments(attachments);
    setMissionInput("");
    setMissionAttachments([]);

    setRunning(true);
    setRunError("");
    setMissionFlow({
      stage: "executando",
      exec: {
        id: `pending_${Date.now()}`,
        iterationNumber: currentExecs.length + 1,
        historySignal: buildHistorySignal(historyContext),
        technicalAnalysis: buildTechnicalAnalysisPending({
          historyContext,
        }),
      },
    });
    setRunState({
      phase: "analisando",
      stepIndex: 0,
      displayedOutput: "",
      fullOutput: "",
      reasoningText: "",
      processingSteps: buildRunSteps(apiConfigured),
      reasoningDetails: null,
      usedHistory: historyContext.length > 0,
      simulationMode: apiConfigured ? "openai-live" : "mock-stream",
    });

    const previewWindow =
      shouldAutoOpenPreview && typeof window !== "undefined"
        ? window.open("", "_blank")
        : null;
    if (previewWindow) {
      renderPreviewWindowPlaceholder(previewWindow, "Preview em preparação", "A IA já começou a montar a instância HTML desta rodada.");
    }

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
            attachments,
            acao,
            model: selectedModel,
            modelPricing: modelPricingMap,
            planningMode: store.planningMode,
            historyContext,
            previousResponseId: previousCodingResponseId,
            onDelta: apiConfigured
              ? (nextText) => {
                  liveAnswerRef.current?.pushAnswer(nextText);
                }
              : undefined,
            onReasoning: apiConfigured
              ? (nextReasoning) => {
                  liveAnswerRef.current?.pushReasoning(nextReasoning);
                }
              : undefined,
          })
        : executarMock({
            mission: currentMission,
            input,
            acao,
            model: selectedModel,
            modelPricing: modelPricingMap,
            planningMode: store.planningMode,
            historyContext,
          });

      setRunState((current) =>
        current
          ? {
              ...current,
              phase: "gerando",
              stepIndex: 2,
              fullOutput: result.output,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
              custo: result.custo,
              reasoningDetails: null,
              processingSteps: current.processingSteps.map((step, stepIndex) => ({
                ...step,
                status: stepIndex < 2 ? "done" : stepIndex === 2 ? "active" : "pending",
              })),
            }
          : current,
      );

      if (!apiConfigured) {
        let cursor = 0;
        const chunkSize = 30;
        while (cursor < result.output.length) {
          cursor = Math.min(result.output.length, cursor + chunkSize);
          liveAnswerRef.current?.pushAnswer(result.output.slice(0, cursor));
          await sleep(40);
        }
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

      const initialTechnicalAnalysis = apiConfigured
        ? buildTechnicalAnalysisPending({
            historyContext,
          })
        : buildTechnicalAnalysisUnavailable({
            apiConfigured,
            historyContext,
          });
      const iterationNumber = currentExecs.length + 1;
      const generatedArtifacts = aiMode === CODING_AI_MODE
        ? extractGeneratedArtifacts(result.output, `rodada-${iterationNumber}`)
        : [];
      const htmlArtifact = generatedArtifacts.find((artifact) => artifact.previewMode === "html");
      if (previewWindow) {
        if (htmlArtifact) {
          writePreviewWindowDocument(
            previewWindow,
            buildPreviewWindowHtmlDocument(htmlArtifact.content, htmlArtifact.fileName || "Preview HTML"),
          );
        } else {
          renderPreviewWindowPlaceholder(
            previewWindow,
            "Sem preview executável",
            "Esta rodada terminou, mas a IA não devolveu um arquivo HTML completo para abrir automaticamente.",
          );
        }
      }
      const execRecord = {
        id: `run_${Date.now()}`,
        ts: new Date().toISOString(),
        input,
        attachments: sanitizeAttachmentsForStorage(attachments),
        acao,
        actionMode: isFreeInstructionAction(acao) ? "free" : "preset",
        isFreeInstruction: isFreeInstructionAction(acao),
        output: result.output,
        explicacao: getTechnicalAnalysisLeadText(initialTechnicalAnalysis),
        reasoningSummary: getTechnicalAnalysisReasoningSummary(initialTechnicalAnalysis),
        reasoningDetails: initialTechnicalAnalysis,
        technicalAnalysis: initialTechnicalAnalysis,
        technicalAnalysisUsage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: 0,
          model: result.effectiveModel || selectedModel,
        },
        processingSteps: buildRunSteps(apiConfigured).map((step) => ({ ...step, status: "done" })),
        simulationMode: apiConfigured ? "openai-live" : "mock-stream",
        promptApplied: result.promptApplied,
        usedHistory: historyContext.length > 0,
        historySignal: buildHistorySignal(historyContext),
        analysisTarget: "latest_prompt",
        usedHistoryContext: historyContext.length > 0,
        iterationNumber,
        aiMode,
        generatedArtifacts,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        tokens: result.tokens,
        custo: result.custo,
        selectedModel: result.selectedModel || selectedModel,
        effectiveModel: result.effectiveModel || selectedModel,
        codingResponseId: result.responseId || "",
        reasoningText: result.reasoningText || "",
        planningMode: store.planningMode,
        planningModeReal: Boolean(result.planningModeReal),
        planningResolution: result.planningResolution || "off",
      };

      if (isTrainingEvent) {
        saveTrainingExecution(teamEvent.id, timeTeamIdx, execRecord);
      } else {
        saveExecution(teamEvent.id, timeTeamIdx, currentMission.id, execRecord);
      }
      const nextTokenUsageTotal = (currentTokenBudget?.usage.totalTokens || 0) + (execRecord.tokens || 0);
      if (currentTokenBudget && !currentTokenBudget.unlimited && currentTokenBudget.effectiveLimit !== null && nextTokenUsageTotal >= currentTokenBudget.effectiveLimit) {
        updateEvents((current) =>
          current.map((event) => {
            if (event.id !== teamEvent.id) return event;
            const alreadyLogged = (event.tokenOperationalLogs || []).some(
              (item) =>
                item.type === "limit_reached" &&
                item.missionId === currentTokenBudget.missionId &&
                item.teamIdx === timeTeamIdx &&
                item.referenceExecId === execRecord.id,
            );
            if (alreadyLogged) return event;
            return appendTokenOperationalLog(event, {
              missionId: currentTokenBudget.missionId,
              teamIdx: timeTeamIdx,
              type: "limit_reached",
              referenceExecId: execRecord.id,
              message: "Limite de tokens excedido na missão.",
              detail: `${nextTokenUsageTotal.toLocaleString("pt-BR")} / ${currentTokenBudget.effectiveLimit.toLocaleString("pt-BR")} tokens utilizados.`,
            });
          }),
        );
      }
      setRunState(null);
      setMissionFlow({ stage: "cot_aberto", exec: execRecord });
      showToast(apiConfigured ? "Execução concluída" : "Execução simulada");

      if (wasPlanningOn) {
        setStore((current) => ({ ...current, planningMode: "off" }));
        setConfigForm((current) => ({ ...current, planningMode: "off" }));
      }

      if (apiConfigured) {
        void gerarExplicacaoGuiadaIA({
          model: result.effectiveModel || selectedModel,
          modelPricing: modelPricingMap,
          mission: currentMission,
          input,
          attachments,
          acao,
          output: result.output,
          historyContext,
        })
          .then((guidedReasoning) => {
            const finalTechnicalAnalysis =
              guidedReasoning ||
              buildTechnicalAnalysisUnavailable({
                apiConfigured,
                historyContext,
              });
            updateExecutionAnalysis(
              teamEvent.id,
              timeTeamIdx,
              isTrainingEvent ? null : currentMission.id,
              execRecord.id,
              finalTechnicalAnalysis,
              guidedReasoning?.usage || {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                cost: 0,
                model: result.effectiveModel || selectedModel,
              },
            );
          })
          .catch(() => {
            updateExecutionAnalysis(
              teamEvent.id,
              timeTeamIdx,
              isTrainingEvent ? null : currentMission.id,
              execRecord.id,
              buildTechnicalAnalysisUnavailable({
                apiConfigured,
                historyContext,
              }),
              {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                cost: 0,
                model: result.effectiveModel || selectedModel,
              },
            );
          });
      }
    } catch (error) {
      if (previewWindow) {
        renderPreviewWindowPlaceholder(
          previewWindow,
          "Preview interrompido",
          "A rodada falhou antes de devolver um HTML executável. Você pode tentar novamente com um pedido mais específico.",
        );
      }
      const failedModelLabel = getModelLabel(modelCatalog, selectedModel);
      setRunError(`Falha ao executar com ${failedModelLabel}. Verifique a chave, o acesso ao modelo ou a conexão.`);
      setRunState(null);
      setMissionFlow({ stage: "idle", exec: null });
      setMissionInput(input);
      setMissionAttachments(attachments);
      console.error(error);
    } finally {
      setRunning(false);
    }
  }

  function handleSaveReflection() {
    if (!teamEvent || timeTeamIdx === null || !currentMission) return;
    const answered = PERGUNTAS_REFLEXAO.every((question) => reflectionAnswers[question.id]);
    if (!answered) {
      setReflectionError("Responda as 3 perguntas para concluir a missão.");
      showToast("Responda as 3 perguntas antes de enviar");
      return;
    }
    setReflectionError("");
    saveReflection(
      teamEvent.id,
      timeTeamIdx,
      currentMission.id,
      currentMission.name,
      reflectionAnswers,
      reflectionComment.trim(),
    );
    setReflectionAnswers({});
    setReflectionComment("");
    setReflectionError("");
    setMissionFlow((current) => ({ ...current, stage: "concluida" }));
    showToast("Reflexão enviada");
  }

  function renderDashboard(evento) {
    if (getEventMode(evento) === TRAINING_MODE_EVENT) {
      const openHelpRequests = getOpenHelpRequests(evento);
      let totalTokens = 0;
      let totalCusto = 0;
      let totalRuns = 0;

      evento.teams.forEach((_, teamIdx) => {
        const execs = getTrainingRuns(evento, teamIdx);
        execs.forEach((execucao) => {
          totalTokens += execucao.tokens || 0;
          totalCusto += execucao.custo || 0;
        });
        totalRuns += execs.length;
      });

      return (
        <>
          <div className="event-summary-strip">
            <div className="event-summary-item">
              <span className="event-summary-label">Times</span>
              <strong className="event-summary-value">{evento.teams.length}</strong>
            </div>
            <div className="event-summary-item">
              <span className="event-summary-label">Rodadas</span>
              <strong className="event-summary-value">{totalRuns}</strong>
            </div>
            <div className="event-summary-item">
              <span className="event-summary-label">Tokens</span>
              <strong className="event-summary-value">{totalTokens.toLocaleString()}</strong>
            </div>
            <div className="event-summary-item">
              <span className="event-summary-label">Custo</span>
              <strong className="event-summary-value">${totalCusto.toFixed(4)}</strong>
            </div>
            <div className="event-summary-item">
              <span className="event-summary-label">Ajuda aberta</span>
              <strong className="event-summary-value">{openHelpRequests.length}</strong>
            </div>
          </div>

          {!evento.teams.length && <div className="teams-empty">Nenhum time cadastrado ainda.</div>}

          <div className="dashboard-layout">
            <div className="dashboard-main">
              <div className="section-header section-title-with-icon">
                <span className="section-title-icon" aria-hidden="true">
                  <Users size={16} strokeWidth={1.6} />
                </span>
                <span className="section-title">Times no laboratório livre</span>
              </div>
              <div className="team-admin-grid">
                {evento.teams.map((teamItem, teamIdx) => {
                  const execs = getTrainingRuns(evento, teamIdx);
                  const latestRun = getLatestTrainingRun(evento, teamIdx);
                  const teamTokens = execs.reduce((sum, execucao) => sum + (execucao.tokens || 0), 0);
                  const teamCusto = execs.reduce((sum, execucao) => sum + (execucao.custo || 0), 0);
                  const teamHelpOpen = openHelpRequests.filter((request) => request.teamIdx === teamIdx).length;

                  return (
                    <div className={`team-admin-card${teamHelpOpen ? " has-open-help" : ""}`} key={teamItem.name}>
                      <div className="team-admin-head">
                        <div className="team-admin-id">
                          <div className="team-avatar">{initials(teamItem.name)}</div>
                          <div>
                            <div className="team-dash-name">{teamItem.name}</div>
                          </div>
                        </div>
                        <div className="team-admin-actions">
                          <button
                            className="icon-copy-btn team-remove-icon"
                            aria-label={`Remover time ${teamItem.name}`}
                            title="Remover time"
                            onClick={() =>
                              openDeleteConfirm({
                                eventId: evento.id,
                                title: "Remover time",
                                body: `O time "${teamItem.name}" será removido deste evento. Para continuar, digite o código do evento como senha de segurança.`,
                                onConfirm: () => handleRemoveTeam(evento.id, teamIdx),
                              })
                            }
                          >
                            Excluir time
                          </button>
                        </div>
                      </div>
                      <div className="team-admin-metrics">
                        <div className="team-admin-metric">
                          <span>Rodadas</span>
                          <strong>{execs.length}</strong>
                        </div>
                        <div className="team-admin-metric">
                          <span>Tokens</span>
                          <strong>{teamTokens.toLocaleString()}</strong>
                        </div>
                        <div className="team-admin-metric">
                          <span>Ajuda</span>
                          <strong>{teamHelpOpen}</strong>
                        </div>
                        <div className="team-admin-metric">
                          <span>Custo</span>
                          <strong>${teamCusto.toFixed(4)}</strong>
                        </div>
                      </div>
                      <div className="team-admin-foot training-team-foot">
                        {latestRun ? (
                          <div className="training-latest-run">
                            <span className="mini-label">Última rodada</span>
                            <div className="muted-body training-latest-prompt">“{truncatePromptSnippet(latestRun.input, 180)}”</div>
                            <div className="team-mission-side-date">{formatDateTime(latestRun.ts)}</div>
                          </div>
                        ) : (
                          <div className="muted-body">Este time ainda não iniciou a conversa livre.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="dashboard-side">
              <div className="help-queue">
                <div className="section-header">
                  <span className="section-title section-title-with-icon">
                    <span className="section-title-icon" aria-hidden="true">
                      <LifeBuoy size={16} strokeWidth={1.6} />
                    </span>
                    <span>Fila de ajuda</span>
                  </span>
                  <span className="muted-mini">{openHelpRequests.length ? `${openHelpRequests.length} na fila` : "Sem fila agora"}</span>
                </div>
                {openHelpRequests.length ? (
                  <div className="help-list">
                    {openHelpRequests.map((request) => {
                      const requestTeam = evento.teams[request.teamIdx];
                      const isTokenRequest = request.kind === "tokens";
                      return (
                        <div className={`help-item${isTokenRequest ? " is-token-request" : ""}`} key={request.id}>
                          <div className="help-item-header">
                            <div>
                              <div className="help-item-title">{requestTeam?.name || `Time ${request.teamIdx + 1}`}</div>
                              <div className="help-item-meta">
                                {isTokenRequest ? "Solicitação de tokens" : "Modo treino"} · {formatDateTime(request.createdAt)}
                              </div>
                            </div>
                            <span className="team-inline-pill is-alert">aberto</span>
                          </div>
                          <div className="help-item-body">
                            {isTokenRequest ? (
                              <>
                                <strong>Consumo atual:</strong> {(request.currentUsage || 0).toLocaleString("pt-BR")} tok ·{" "}
                                <strong>Limite:</strong> {formatTokenLimitLabel(request.currentLimit)}
                              </>
                            ) : (
                              request.message
                            )}
                          </div>
                          <div className="help-item-actions">
                            {isTokenRequest ? (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() =>
                                  handleGrantTokens({
                                    eventId: evento.id,
                                    missionId: request.missionId,
                                    scope: "time",
                                    teamIdx: request.teamIdx,
                                    amount: 5000,
                                    source: "queue",
                                  })
                                }
                              >
                                Liberar +5.000
                              </button>
                            ) : (
                              <button className="btn btn-sm" onClick={() => handleResolveHelpRequest(evento.id, request.id)}>
                                Resolver ajuda
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="help-empty muted-body">Quando um time pedir ajuda no treino, a fila lateral aparece aqui com a mensagem completa.</div>
                )}
              </div>
            </aside>
          </div>
        </>
      );
    }

    const openHelpRequests = getOpenHelpRequests(evento);
    const unlockedMissions = evento.missions.filter((mission) => mission.unlocked);
    let totalTokens = 0;
    let totalCusto = 0;
    let totalConclusoes = 0;
    let totalPromptsExecutados = 0;
    evento.teams.forEach((_, teamIdx) => {
      evento.missions.forEach((mission) => {
        const execs = getExecucoes(evento, teamIdx, mission.id);
        execs.forEach((execucao) => {
          totalTokens += execucao.tokens || 0;
          totalCusto += execucao.custo || 0;
        });
        totalPromptsExecutados += execs.length;
        if (isConcluida(evento, teamIdx, mission.id)) totalConclusoes += 1;
      });
    });
    const totalConclusoesPossiveis = evento.teams.length * (unlockedMissions.length || 0);

    return (
      <>
        <div className="event-summary-strip">
          <div className="event-summary-item">
            <span className="event-summary-label">Times</span>
            <strong className="event-summary-value">{evento.teams.length}</strong>
          </div>
          <div className="event-summary-item">
            <span className="event-summary-label">Prompts</span>
            <strong className="event-summary-value">{totalPromptsExecutados}</strong>
          </div>
          <div className="event-summary-item">
            <span className="event-summary-label">Missões concluídas</span>
            <strong className="event-summary-value">
              {totalConclusoesPossiveis ? `${totalConclusoes}/${totalConclusoesPossiveis}` : "0/0"}
            </strong>
          </div>
          <div className="event-summary-item">
            <span className="event-summary-label">Tokens</span>
            <strong className="event-summary-value">{totalTokens.toLocaleString()}</strong>
          </div>
          <div className="event-summary-item">
            <span className="event-summary-label">Custo</span>
            <strong className="event-summary-value">${totalCusto.toFixed(4)}</strong>
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
              <span className="section-title section-title-with-icon">
                <span className="section-title-icon" aria-hidden="true">
                  {dashboardView === "team" ? <Users size={16} strokeWidth={1.6} /> : <BookOpen size={16} strokeWidth={1.6} />}
                </span>
                <span>{dashboardView === "team" ? "Times no evento" : "Missões no evento"}</span>
              </span>
              <div className="section-actions">
                <div className="inline-choice-row dashboard-view-toggle">
                  <button
                    className={`choice-pill${dashboardView === "team" ? " active" : ""}`}
                    onClick={() => setDashboardView("team")}
                  >
                    Visão por time
                  </button>
                  <button
                    className={`choice-pill${dashboardView === "mission" ? " active" : ""}`}
                    onClick={() => setDashboardView("mission")}
                  >
                    Visão por missão
                  </button>
                </div>
              </div>
            </div>

            {dashboardView === "team" ? (
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
                closureStatus: getMissionClosureStatus(evento, teamIdx, mission.id),
                reflection,
                helpOpen: teamHelpOpenRequests.filter((request) => request.missionId === mission.id).length,
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
                  </div>
                </div>
                <div className="team-admin-actions">
                  <button
                    className="icon-copy-btn team-remove-icon"
                    aria-label={`Remover time ${teamItem.name}`}
                    title="Remover time"
                    onClick={() =>
                      openDeleteConfirm({
                        eventId: evento.id,
                        title: "Remover time",
                        body: `O time "${teamItem.name}" será removido deste evento. Para continuar, digite o código do evento como senha de segurança.`,
                        onConfirm: () => handleRemoveTeam(evento.id, teamIdx),
                      })
                    }
                  >
                    Excluir time
                  </button>
                </div>
              </div>
              <div className="team-admin-metrics">
                <div className="team-admin-metric">
                  <span>Prompts</span>
                  <strong>{missionRuns}</strong>
                </div>
                <div className="team-admin-metric">
                  <span>Missões concluídas</span>
                  <strong>{`${teamConc}/${unlockedCount}`}</strong>
                </div>
                <div className="team-admin-metric">
                  <span>Tokens</span>
                  <strong>{teamTokens.toLocaleString()}</strong>
                </div>
                <div className="team-admin-metric">
                  <span>Custo</span>
                  <strong>${teamCusto.toFixed(4)}</strong>
                </div>
              </div>
              <div className="team-admin-foot">
                {missionProgressItems.length ? (
                  <div className="team-mission-section">
                    <div className="team-mission-section-head">
                      <span className="mini-label team-mission-section-label">
                        <ListChecks size={16} strokeWidth={1.6} aria-hidden="true" />
                        <span>Missões liberadas</span>
                      </span>
                    </div>
                    <div className="team-mission-list">
                    {missionProgressItems.map((missionItem, missionIndex) => (
                      <div className="team-mission-row" key={missionItem.id}>
                        <div className="team-mission-main">
                          <div className="team-mission-copy">
                            <div className="team-mission-title-row">
                              <div className="team-mission-kicker">{missionIndex + 1}.</div>
                              <div className="team-mission-name">{missionItem.name}</div>
                            </div>
                            {missionItem.runs && !missionItem.concluded ? (
                              <div className="team-mission-meta">
                                {`${missionItem.runs} prompt${missionItem.runs > 1 ? "s" : ""}`}
                              </div>
                            ) : null}
                          </div>
                          <div className="team-mission-side">
                            <div className="team-mission-status">
                              <span className={`team-inline-pill${missionItem.closureStatus === "concluida" ? " is-complete" : missionItem.closureStatus === "aguardando_questionario" ? " is-alert" : missionItem.runs ? "" : " is-muted"}`}>
                                {missionItem.closureStatus === "concluida"
                                  ? "feito"
                                  : missionItem.closureStatus === "aguardando_questionario"
                                    ? "questionário"
                                    : missionItem.runs
                                      ? "em andamento"
                                      : "pendente"}
                              </span>
                              {missionItem.helpOpen ? (
                                <span
                                  className="team-help-indicator is-alert"
                                  aria-label={`${missionItem.helpOpen} pedidos de ajuda abertos nesta missão`}
                                  title={`${missionItem.helpOpen} pedidos de ajuda abertos nesta missão`}
                                >
                                  <span className="team-help-indicator-icon">!</span>
                                  <span className="team-help-indicator-count">{missionItem.helpOpen}</span>
                                </span>
                              ) : null}
                            </div>
                            <div className="team-mission-side-date">
                              {missionItem.reflection
                                ? formatDateTime(missionItem.reflection.submittedAt || missionItem.reflection.ts)
                                : ""}
                            </div>
                          </div>
                          {missionItem.reflection ? (
                            <div className="team-mission-feedback">
                              <div className="team-admin-feedback-scores is-inline">
                                {Object.entries(missionItem.reflection.respostas || {}).map(([key, value]) => (
                                  <span className="mission-feedback-chip is-rating" key={`${missionItem.id}-${key}`}>
                                    <strong>{getReflectionTopicShortLabel(key)}</strong>
                                              <span className="mission-feedback-score" aria-label={`${Number(value).toFixed(1)} de 5`}>
                                                    {Number(value).toFixed(1)}/5
                                                  </span>
                                                </span>
                                              ))}
                              </div>
                              {missionItem.reflection.comment ? (
                                <div className="team-admin-feedback-comment">{missionItem.reflection.comment}</div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
              </div>
            ) : (
              <div className="mission-admin-grid">
                {unlockedMissions.map((mission, missionIndex) => {
                  let missionTokens = 0;
                  let missionCusto = 0;
                  let missionRuns = 0;
                  let missionConcluded = 0;
                  const missionHelpOpen = openHelpRequests.filter((request) => request.missionId === mission.id).length;
                  const missionHasOpenTeams = evento.teams.some((_, teamIdx) => getMissionClosureStatus(evento, teamIdx, mission.id) === "aberta");
                  const missionHasReopenableTeams = evento.teams.some((_, teamIdx) => canFacilitatorReopenMissionForTeam(evento, teamIdx, mission.id));

                  const teamRows = evento.teams.map((teamItem, teamIdx) => {
                    const execs = getExecucoes(evento, teamIdx, mission.id);
                    const reflection = (evento.reflexoes || {})[`${teamIdx}__${mission.id}`];
                    const closureStatus = getMissionClosureStatus(evento, teamIdx, mission.id);
                    const helpOpen = openHelpRequests.filter((request) => request.teamIdx === teamIdx && request.missionId === mission.id).length;
                    const teamTokens = execs.reduce((sum, execucao) => sum + (execucao.tokens || 0), 0);
                    const teamCusto = execs.reduce((sum, execucao) => sum + (execucao.custo || 0), 0);
                    missionTokens += teamTokens;
                    missionCusto += teamCusto;
                    missionRuns += execs.length;
                    if (reflection) missionConcluded += 1;
                    return {
                      teamName: teamItem.name,
                      reflection,
                      closureStatus,
                      helpOpen,
                      runs: execs.length,
                    };
                  });

                  return (
                    <div className="mission-admin-card" key={mission.id}>
                      <div className="mission-admin-head">
                        <div>
                          <div className="mission-admin-title">
                            {missionIndex + 1}. {mission.name}
                          </div>
                          <div className="mission-admin-sub">
                            {missionConcluded}/{evento.teams.length} times concluíram
                          </div>
                        </div>
                        {missionHelpOpen ? (
                          <span className="team-help-indicator is-alert" title={`${missionHelpOpen} pedidos de ajuda abertos nesta missão`}>
                            <span className="team-help-indicator-icon">!</span>
                            <span className="team-help-indicator-count">{missionHelpOpen}</span>
                          </span>
                        ) : null}
                        <div className="mission-head-actions">
                          <button
                            className="mission-close-btn"
                            type="button"
                            onClick={() =>
                              missionHasOpenTeams
                                ? openConfirm(
                                    "Encerrar missão",
                                    `Abrir o questionário final para todos os times ainda abertos na missão "${mission.name}"?`,
                                    () => handleFacilitatorCloseMission(evento.id, mission.id),
                                    { confirmTone: "primary" },
                                  )
                                : missionHasReopenableTeams
                                  ? openConfirm(
                                      "Reabrir missão",
                                      `Reabrir a missão "${mission.name}" apenas para os times que foram fechados pelo facilitador?`,
                                      () => handleFacilitatorReopenMission(evento.id, mission.id),
                                      { confirmTone: "primary" },
                                    )
                                  : null
                            }
                            disabled={!missionHasOpenTeams && !missionHasReopenableTeams}
                          >
                            {missionHasOpenTeams ? "Encerrar missão" : "Reabrir missão"}
                          </button>
                          <button
                            className="mission-close-btn is-secondary-action"
                            type="button"
                            onClick={() =>
                              openConfirm(
                                "Encerrar sem avaliação",
                                `Concluir a missão "${mission.name}" para os times restantes sem abrir questionário?`,
                                () => handleFacilitatorCloseMissionWithoutEvaluation(evento.id, mission.id),
                                { confirmTone: "primary" },
                            )
                          }
                            disabled={!missionHasOpenTeams}
                          >
                            Encerrar sem avaliação
                          </button>
                        </div>
                      </div>
                      <div className="mission-admin-metrics">
                        <div className="team-admin-metric">
                          <span>Times</span>
                          <strong>{evento.teams.length}</strong>
                        </div>
                        <div className="team-admin-metric">
                          <span>Prompts</span>
                          <strong>{missionRuns}</strong>
                        </div>
                        <div className="team-admin-metric">
                          <span>Times que concluíram</span>
                          <strong>{`${missionConcluded}/${evento.teams.length}`}</strong>
                        </div>
                        <div className="team-admin-metric">
                          <span>Tokens</span>
                          <strong>{missionTokens.toLocaleString()}</strong>
                        </div>
                      </div>
                      <div className="mission-team-list">
                        {teamRows.map((teamRow) => (
                          <div className="mission-team-row" key={`${mission.id}-${teamRow.teamName}`}>
                            <div className="mission-team-main">
                              <div className="mission-team-top">
                                <div className="mission-team-name">{teamRow.teamName}</div>
                                <div className="team-mission-status">
                                  <span className={`team-inline-pill${teamRow.closureStatus === "concluida" ? " is-complete" : teamRow.closureStatus === "aguardando_questionario" ? " is-alert" : teamRow.runs ? "" : " is-muted"}`}>
                                    {teamRow.closureStatus === "concluida"
                                      ? "feito"
                                      : teamRow.closureStatus === "aguardando_questionario"
                                        ? "questionário"
                                        : teamRow.runs
                                          ? "em andamento"
                                          : "pendente"}
                                  </span>
                                  {teamRow.helpOpen ? (
                                    <span className="team-help-indicator is-alert" title={`${teamRow.helpOpen} pedidos de ajuda abertos nesta missão`}>
                                      <span className="team-help-indicator-icon">!</span>
                                      <span className="team-help-indicator-count">{teamRow.helpOpen}</span>
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              {teamRow.reflection ? (
                                <div className="team-mission-feedback mission-team-feedback">
                                  <div className="team-admin-feedback-scores is-inline">
                                    {Object.entries(teamRow.reflection.respostas || {}).map(([key, value]) => (
                                      <span className="mission-feedback-chip is-rating" key={`${mission.id}-${teamRow.teamName}-${key}`}>
                                        <strong>{getReflectionTopicShortLabel(key)}</strong>
                                        <span className="mission-feedback-score" aria-label={`${value} de 5`}>
                                          {value}/5
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                  {teamRow.reflection.comment ? (
                                    <div className="team-admin-feedback-comment">{teamRow.reflection.comment}</div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="dashboard-side">
            <div className="help-queue">
              <div className="section-header">
                <span className="section-title section-title-with-icon">
                  <span className="section-title-icon" aria-hidden="true">
                    <LifeBuoy size={16} strokeWidth={1.6} />
                  </span>
                  <span>Fila de ajuda</span>
                </span>
                <span className="muted-mini">{openHelpRequests.length ? `${openHelpRequests.length} na fila` : "Sem fila agora"}</span>
              </div>
              {openHelpRequests.length ? (
                <div className="help-list">
                  {openHelpRequests.map((request) => {
                    const requestMission = evento.missions.find((mission) => mission.id === request.missionId);
                    const requestTeam = evento.teams[request.teamIdx];
                    const isTokenRequest = request.kind === "tokens";
                    return (
                      <div className={`help-item${isTokenRequest ? " is-token-request" : ""}`} key={request.id}>
                        <div className="help-item-header">
                          <div>
                            <div className="help-item-title">{requestTeam?.name || `Time ${request.teamIdx + 1}`}</div>
                            <div className="help-item-meta">
                              {requestMission?.name || (request.missionId === TOKEN_MISSION_TRAINING_ID ? "Modo treino" : request.missionId)} · {formatDateTime(request.createdAt)}
                            </div>
                          </div>
                          <span className="team-inline-pill is-alert">aberto</span>
                        </div>
                        <div className="help-item-body">
                          {isTokenRequest ? (
                            <>
                              <strong>Solicitação de tokens.</strong> {(request.currentUsage || 0).toLocaleString("pt-BR")} /{" "}
                              {formatTokenLimitLabel(request.currentLimit)}
                            </>
                          ) : (
                            request.message
                          )}
                        </div>
                        <div className="help-item-actions">
                          {isTokenRequest ? (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() =>
                                handleGrantTokens({
                                  eventId: evento.id,
                                  missionId: request.missionId,
                                  scope: "time",
                                  teamIdx: request.teamIdx,
                                  amount: 5000,
                                  source: "queue",
                                })
                              }
                            >
                              Liberar +5.000
                            </button>
                          ) : (
                            <button className="btn btn-sm" onClick={() => handleResolveHelpRequest(evento.id, request.id)}>
                              Resolver ajuda
                            </button>
                          )}
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

  function renderPromptInsights(evento) {
    const entries = getPromptInsightEntries(evento);
    if (!entries.length) {
      return <div className="teams-empty">Nenhum prompt executado ainda.</div>;
    }

    if (getEventMode(evento) === TRAINING_MODE_EVENT) {
      const byTeam = evento.teams
        .map((teamItem, teamIdx) => ({
          teamName: teamItem.name,
          entries: entries.filter((entry) => entry.teamIdx === teamIdx),
        }))
        .filter((group) => group.entries.length);

      return (
        <div className="prompt-insights-shell">
          <div className="section-header">
            <span className="section-title section-title-with-icon">
              <span className="section-title-icon" aria-hidden="true">
                <MessageSquareText size={16} strokeWidth={1.6} />
              </span>
              <span>Leitura pedagógica dos prompts</span>
            </span>
            <span className="muted-mini">{entries.length} rodada(s) livres analisadas</span>
          </div>

          <div className="prompt-insight-group-list">
            {byTeam.map(({ teamName, entries: teamEntries }) => (
              <section className="prompt-insight-group editorial" key={`training-${teamName}`}>
                <div className="prompt-insight-group-head">
                  <div>
                    <div className="prompt-insight-group-title">{teamName}</div>
                    <div className="prompt-insight-group-sub">{teamEntries.length} prompt(s) livres neste time</div>
                  </div>
                </div>

                <div className="prompt-insight-columns editorial">
                  <div className="prompt-insight-column editorial is-good">
                    <div className="prompt-insight-column-head">
                      <div className="prompt-insight-column-title">
                        <span className="prompt-insight-column-icon" aria-hidden="true">✓</span>
                        <span>Funcionou bem</span>
                      </div>
                    </div>
                    <div className="prompt-insight-open-list">
                      {teamEntries.some((entry) => entry.analysis?.strengths?.length) ? (
                        teamEntries.map((entry) => (
                          <article className="prompt-insight-open-item" key={`${entry.id}-good`}>
                            <div className="prompt-insight-open-note prompt-insight-observation">“{truncatePromptSnippet(entry.prompt, 120)}”</div>
                            <div className="prompt-insight-chip-row">
                              {(entry.analysis?.strengths || []).map((item) => (
                                <span className="prompt-insight-person-chip" key={`${entry.id}-${item}`}>{item}</span>
                              ))}
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="prompt-insight-empty">Ainda não apareceu um caso forte de acerto neste time.</div>
                      )}
                    </div>
                  </div>

                  <div className="prompt-insight-column editorial is-watchout">
                    <div className="prompt-insight-column-head">
                      <div className="prompt-insight-column-title">
                        <span className="prompt-insight-column-icon" aria-hidden="true">!</span>
                        <span>A observar</span>
                      </div>
                    </div>
                    <div className="prompt-insight-open-list">
                      {teamEntries.some((entry) => entry.analysis?.watchouts?.length) ? (
                        teamEntries.map((entry) => (
                          <article className="prompt-insight-open-item" key={`${entry.id}-watch`}>
                            <div className="prompt-insight-open-note prompt-insight-observation">“{truncatePromptSnippet(entry.prompt, 120)}”</div>
                            <div className="prompt-insight-chip-row">
                              {(entry.analysis?.watchouts || []).map((item) => (
                                <span className="prompt-insight-person-chip" key={`${entry.id}-${item}`}>{item}</span>
                              ))}
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="prompt-insight-empty">Nenhum ponto crítico recorrente apareceu neste time.</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      );
    }

    const byMission = evento.missions
      .filter((mission) => entries.some((entry) => entry.missionId === mission.id))
      .map((mission) => ({
        mission,
        entries: entries.filter((entry) => entry.missionId === mission.id),
      }));

    return (
      <div className="prompt-insights-shell">
        <div className="section-header">
          <span className="section-title">Leitura pedagógica dos prompts</span>
          <span className="muted-mini">{byMission.length} missão(ões) com prompts analisados</span>
        </div>

        <div className="prompt-insight-group-list">
          {byMission.map(({ mission, entries: missionEntries }) => (
            <section className="prompt-insight-group editorial" key={`mission-${mission.id}`}>
              {(() => {
                const strengthGroups = groupPromptInsightsByObservation(missionEntries, "strengths");
                const watchoutGroups = groupPromptInsightsByObservation(missionEntries, "watchouts");
                const participantCount = new Set(missionEntries.map((entry) => entry.teamName)).size;

                return (
                  <>
              <div className="prompt-insight-group-head">
                <div>
                  <div className="prompt-insight-group-title">
                    {mission.num ? `${mission.num}. ` : ""}
                    {mission.name}
                  </div>
                  <div className="prompt-insight-group-sub">
                    {missionEntries.length} prompt(s) · {participantCount} pessoa(s) nesta missão
                  </div>
                </div>
              </div>

              <div className="prompt-insight-columns editorial">
                <div className="prompt-insight-column editorial is-good">
                  <div className="prompt-insight-column-head">
                    <div className="prompt-insight-column-title">
                      <span className="prompt-insight-column-icon" aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="none">
                          <path d="M4.5 10.5l3.2 3.2 7.8-7.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>Funcionou bem</span>
                    </div>
                  </div>
                  <div className="prompt-insight-open-list">
                    {strengthGroups.length ? (
                      strengthGroups.map((group) => (
                        <article className="prompt-insight-open-item" key={`strength-group-${group.text}`}>
                          <div className="prompt-insight-open-note prompt-insight-observation">{group.text}</div>
                          <div className="prompt-insight-chip-row">
                            {group.participants.map((participant) => (
                              <span className="prompt-insight-person-chip" key={`${group.text}-${participant.id}`}>
                                {participant.teamName}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="prompt-insight-empty">
                        <strong>Ainda não apareceu um caso forte de acerto.</strong>
                        <span>Procure próximos prompts com objetivo claro, contexto suficiente e formato de saída definido.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="prompt-insight-column editorial is-watchout">
                  <div className="prompt-insight-column-head">
                    <div className="prompt-insight-column-title">
                      <span className="prompt-insight-column-icon" aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="none">
                          <path d="M10 4.5v6.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                          <circle cx="10" cy="13.9" r="0.9" fill="currentColor" />
                          <path d="M10 2.8l7 12.1a1 1 0 0 1-.86 1.5H3.86a1 1 0 0 1-.86-1.5l7-12.1a1 1 0 0 1 1.72 0Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>A observar</span>
                    </div>
                  </div>
                  <div className="prompt-insight-open-list">
                    {watchoutGroups.length ? (
                      watchoutGroups.map((group) => (
                        <article className="prompt-insight-open-item" key={`watchout-group-${group.text}`}>
                          <div className="prompt-insight-open-note prompt-insight-observation">{group.text}</div>
                          <div className="prompt-insight-chip-row">
                            {group.participants.map((participant) => (
                              <span className="prompt-insight-person-chip" key={`${group.text}-${participant.id}`}>
                                {participant.teamName}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="prompt-insight-empty">Nenhum ponto crítico recorrente apareceu nesta missão.</div>
                    )}
                  </div>
                </div>
              </div>
                  </>
                );
              })()}
            </section>
          ))}
        </div>
      </div>
    );
  }

  function renderAnamnesisInsights(evento) {
    if (!isAnamnesisEnabled(evento)) {
      return <div className="teams-empty">A anamnese está desabilitada neste evento.</div>;
    }

    const responses = Object.values(evento.anamnesisResponses || {}).filter((entry) => entry?.submittedAt);
    if (!responses.length) {
      return <div className="teams-empty">Nenhuma resposta de anamnese foi enviada ainda.</div>;
    }

    const completionRate = evento.teams.length ? Math.round((responses.length / evento.teams.length) * 100) : 0;
    const openQuestions = ANAMNESIS_QUESTIONS.filter((question) => question.type === "text" || question.optionalText).length;
    const choiceQuestions = ANAMNESIS_QUESTIONS.filter((question) => question.type !== "text").length;

    return (
      <div className="anamnesis-insights-shell">
        <div className="section-header">
          <span className="section-title section-title-with-icon">
            <span className="section-title-icon" aria-hidden="true">
              <FileText size={16} strokeWidth={1.6} />
            </span>
            <span>Perfil agregado da turma</span>
          </span>
          <span className="muted-mini">
            {responses.length}/{evento.teams.length || responses.length} resposta(s) · {completionRate}% de adesão
          </span>
        </div>

        <div className="anamnesis-summary-strip">
          <div className="anamnesis-summary-item">
            <span>Respondentes</span>
            <strong>{responses.length}</strong>
          </div>
          <div className="anamnesis-summary-item">
            <span>Cobertura</span>
            <strong>{completionRate}%</strong>
          </div>
          <div className="anamnesis-summary-item">
            <span>Perguntas de escolha</span>
            <strong>{choiceQuestions}</strong>
          </div>
          <div className="anamnesis-summary-item">
            <span>Perguntas abertas</span>
            <strong>{openQuestions}</strong>
          </div>
        </div>

        <div className="anamnesis-question-list-linear">
          {ANAMNESIS_QUESTIONS.map((question) => {
            const results = getAnamnesisQuestionResults(evento, question);
            const isTextOnly = question.type === "text";
            const optionLabels = results.optionLabels || question.options || [];
            const maxCount = isTextOnly ? 0 : Math.max(1, ...(results.counts || [0]));
            const keywords = extractAnamnesisKeywords(results.texts || []);
            return (
              <article className="anamnesis-question-card" key={question.id}>
                <div className="anamnesis-question-head">
                  <div className="anamnesis-question-number">{question.number}</div>
                  <div>
                    <div className="anamnesis-question-title">{question.prompt}</div>
                    <div className="anamnesis-question-meta">
                      {isTextOnly
                        ? `${results.respondents} resposta(s) abertas`
                        : question.optionalText
                          ? `${results.respondents} resposta(s) objetivas · ${results.texts?.length || 0} complemento(s)`
                          : `${results.respondents} resposta(s) computadas`}
                    </div>
                  </div>
                </div>

                {isTextOnly ? (
                  <div className="anamnesis-text-summary">
                    <div className="anamnesis-open-bar">
                      <div
                        className="anamnesis-open-bar-fill"
                        style={{ width: `${results.responseRate ? Math.max(8, results.responseRate) : 0}%` }}
                      />
                    </div>
                    <div className="anamnesis-open-meta">
                      <span>Pergunta aberta</span>
                      <strong>{results.responseRate}% da turma respondeu</strong>
                    </div>
                    {keywords.length ? (
                      <div className="anamnesis-keyword-row">
                        {keywords.map((keyword) => (
                          <span className="anamnesis-keyword-chip" key={`${question.id}-${keyword.term}`}>
                            {keyword.term}
                            <small>{keyword.count}</small>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="anamnesis-empty-note">Ainda não há termos recorrentes suficientes para sintetizar esta pergunta.</div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="anamnesis-bar-list">
                      {optionLabels.map((option, optionIdx) => {
                        const count = results.counts?.[optionIdx] || 0;
                        const width = maxCount ? Math.max(4, (count / maxCount) * 100) : 0;
                        const percent = responses.length ? Math.round((count / responses.length) * 100) : 0;
                        return (
                          <div className="anamnesis-bar-row" key={`${question.id}-${optionIdx}`}>
                            <div className="anamnesis-bar-copy">
                              <span>{option}</span>
                              <strong>{count}</strong>
                            </div>
                            <div className="anamnesis-bar-track" aria-hidden="true">
                              <div className="anamnesis-bar-fill" style={{ width: `${width}%` }} />
                            </div>
                            <div className="anamnesis-bar-meta">{percent}%</div>
                          </div>
                        );
                      })}
                    </div>
                    {question.optionalText ? (
                      <div className="anamnesis-text-summary is-secondary">
                        <div className="anamnesis-open-bar">
                          <div
                            className="anamnesis-open-bar-fill"
                            style={{ width: `${results.noteResponseRate ? Math.max(8, results.noteResponseRate) : 0}%` }}
                          />
                        </div>
                        <div className="anamnesis-open-meta">
                          <span>Complemento opcional</span>
                          <strong>{results.noteResponseRate}% da turma detalhou</strong>
                        </div>
                        {keywords.length ? (
                          <div className="anamnesis-keyword-row">
                            {keywords.map((keyword) => (
                              <span className="anamnesis-keyword-chip" key={`${question.id}-${keyword.term}`}>
                                {keyword.term}
                                <small>{keyword.count}</small>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="anamnesis-empty-note">Sem termos recorrentes suficientes nos complementos desta pergunta.</div>
                        )}
                      </div>
                    ) : null}
                  </>
                )}
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <BrandLoaderOverlay open={brandLoaderOpen} />
      {screen === "home" && (
        <div className="screen active">
          <Topbar
            onLogoClick={goHome}
            right={
              <>
                {devQuickSwitch}
              </>
            }
          />
          <div className="center-wrap">
            <div className="center-box home-box">
              <div className="brand-kicker hero-kicker">Tech Hall AI Lab</div>
              <div className="hero-grid">
                <button className="card hero-card" onClick={goFacilitador}>
                  <div className="hero-card-icon" aria-hidden="true">
                    <Waypoints strokeWidth={1.6} />
                  </div>
                  <div className="hero-card-title">Facilitador</div>
                  <div className="hero-card-text">Criar eventos, organizar times e liberar missões.</div>
                </button>
                <button className="card hero-card" onClick={goEntradaTime}>
                  <div className="hero-card-icon" aria-hidden="true">
                    <Users strokeWidth={1.6} />
                  </div>
                  <div className="hero-card-title">Participante</div>
                  <div className="hero-card-text">Entrar num evento, escolher o time e executar missões.</div>
                </button>
              </div>
            </div>
          </div>
          <AppFooter />
        </div>
      )}

      {screen === "facilitador" && (
        <div className="screen active facilitator-screen">
          <Topbar
            onLogoClick={goHome}
            right={
              <>
                {devQuickSwitch}
                <div className="topbar-status-strip">
                  <span className={`topbar-api-pill${apiConfigured ? " is-connected" : ""}`}>
                    {apiConfigured ? "API ligada" : "API não configurada"}
                  </span>
                  {selectedEvent && getOpenHelpRequests(selectedEvent).length > 0 ? (
                    <span className="topbar-help-pill">{getOpenHelpRequests(selectedEvent).length} ajuda(s)</span>
                  ) : null}
                  {selectedEventTimerRunning ? (
                    <span className="topbar-live-pill">
                      <Clock3 size={12} strokeWidth={1.8} aria-hidden="true" />
                      {formatCountdown(selectedEventTimerRemainingMs)}
                    </span>
                  ) : null}
                  {selectedEventScreenShare?.active ? <span className="topbar-live-pill">tela ao vivo</span> : null}
                </div>
                <div className="topbar-actions-main">
                  <FacilitatorScreenShareButton
                    event={selectedEvent}
                    screenShare={selectedEventScreenShare}
                    onPublishState={(nextState) => {
                      if (!selectedEvent) return;
                      handlePublishScreenShare(selectedEvent.id, nextState);
                    }}
                    iconOnly
                  />
                  <button
                    className="btn btn-sm topbar-tools-btn"
                    onClick={() => {
                      setFacilitatorToolView(FACILITATOR_TOOL_VIEWS.MENU);
                      setFacilitatorToolsOpen(true);
                    }}
                  >
                    <SlidersHorizontal size={14} strokeWidth={1.7} aria-hidden="true" />
                    Ferramentas do facilitador
                  </button>
                </div>
              </>
            }
          />

          <div className="fac-layout">
            <aside className="sidebar">
              <div className="sidebar-label section-title-with-icon sidebar-label-with-icon">
                <span className="section-title-icon" aria-hidden="true">
                  <CalendarDays size={16} strokeWidth={1.6} />
                </span>
                <span>Eventos</span>
              </div>
              {!events.length && <div className="empty-list-text">Nenhum evento ainda.</div>}
              {events.map((event) => {
                const isSelected = facSelectedId === event.id;
                const isCollapsed = isSelected && event.status !== "open";
                return (
                <div className={`event-item-card${isSelected ? " active" : ""}${isCollapsed ? " is-collapsed" : ""}`} key={event.id}>
                  {isSelected ? (
                    <div className="event-item-status-toggle-row">
                      <div className="event-item-top-actions">
                        <button
                          className={`event-status-toggle${event.status === "open" ? " is-on" : ""}`}
                          aria-label={event.status === "open" ? "Desligar evento" : "Ligar evento"}
                          title={event.status === "open" ? "Desligar evento" : "Ligar evento"}
                          onClick={() => handleSetStatus(event.id, event.status === "open" ? "closed" : "open")}
                        >
                          <span className="event-status-toggle-track">
                            <span className="event-status-toggle-thumb" />
                          </span>
                        </button>
                        {event.status === "open" ? (
                          <button
                            className="icon-copy-btn team-remove-icon event-delete-btn"
                            aria-label={`Excluir evento ${event.name}`}
                            title="Excluir evento"
                            onClick={() =>
                              openDeleteConfirm({
                                eventId: event.id,
                                title: "Ocultar evento",
                                body: "Escolha se você quer apenas ocultar este evento da lista ativa ou ocultar e salvar um histórico local antes disso. Para liberar as opções, digite a senha do facilitador.",
                                onConfirm: () => handleDeleteEvent(event.id),
                                onArchive: () => archiveEventSnapshot(event.id),
                                passwordMode: "facilitator",
                                confirmActionLabel: "Ocultar evento",
                                secondaryActionLabel: "Ocultar e salvar histórico",
                                facilitatorHint: "Digite a mesma senha do facilitador para ocultar este evento da lista ativa.",
                              })
                            }
                          >
                            Ocultar evento
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <button
                    className={`event-item${isSelected ? " active" : ""}`}
                    onClick={() => {
                      setFacSelectedId(event.id);
                      setFacTab("dashboard");
                    }}
                  >
                    <div className="event-item-name">
                      {event.status === "open" ? <span className="live-dot" /> : null}
                      {event.name}
                    </div>
                    {event.desc ? <div className="event-item-desc">{event.desc}</div> : null}
                  </button>
                  {isSelected && event.status === "open" ? (
                    <div className="event-item-details">
                      <div className="event-item-detail-block">
                        <EventCardSectionLabel icon="mode">Modo do evento</EventCardSectionLabel>
                        <div className="inline-choice-row event-mode-row">
                          <button
                            className={`choice-pill${getEventMode(event) === MISSIONS_MODE_EVENT ? " active" : ""}`}
                            onClick={() => handleSetEventMode(event.id, MISSIONS_MODE_EVENT)}
                          >
                            Missões
                          </button>
                          <button
                            className={`choice-pill${getEventMode(event) === TRAINING_MODE_EVENT ? " active" : ""}`}
                            onClick={() => handleSetEventMode(event.id, TRAINING_MODE_EVENT)}
                          >
                            Treino
                          </button>
                        </div>
                      </div>
                      <div className="event-item-detail-block">
                        <EventCardSectionLabel icon="summary">Anamnese da turma</EventCardSectionLabel>
                        <div className="inline-choice-row event-mode-row">
                          <button
                            className={`choice-pill${!isAnamnesisEnabled(event) ? " active" : ""}`}
                            onClick={() => handleSetAnamnesisEnabled(event.id, false)}
                          >
                            Desligada
                          </button>
                          <button
                            className={`choice-pill${isAnamnesisEnabled(event) ? " active" : ""}`}
                            onClick={() => handleSetAnamnesisEnabled(event.id, true)}
                          >
                            Ligada
                          </button>
                        </div>
                      </div>
                      <div className="event-item-management-actions">
                        <div className="event-item-management-head">
                          <EventCardSectionLabel icon="teams">Incluir pessoas no LAB</EventCardSectionLabel>
                        </div>
                        <div className="event-item-management-grid">
                          <div className="event-item-management-option">
                            <button className="btn btn-sm event-management-btn" onClick={() => setAddTeamOpen(true)}>
                              Por lote
                            </button>
                          </div>
                          <div className="event-item-management-option">
                            <button className="btn btn-sm event-management-btn is-secondary" onClick={() => setAddTeamOpen("manual")}>
                              Individual
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )})}
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
                    {facilitatorTabs.map((tab) => (
                      <button
                        key={tab}
                        className={`tab${facTab === tab ? " active" : ""}`}
                        onClick={() => setFacTab(tab)}
                      >
                        <FacilitatorTabLabel tab={tab} />
                      </button>
                    ))}
                  </div>

                  {facTab === "dashboard" && renderDashboard(selectedEvent)}

                  {facTab === "missoes" && (
                    <>
                      {selectedEventMode === TRAINING_MODE_EVENT ? (
                        <>
                          <div className="section-header">
                            <span className="section-title section-title-with-icon">
                              <span className="section-title-icon" aria-hidden="true">
                                <BookOpen size={16} strokeWidth={1.6} />
                              </span>
                              <span>Missões</span>
                            </span>
                          </div>
                          <div className="teams-empty">Este evento está em modo treino livre. As missões e o catálogo ficam ocultos até você voltar para o modo Missões.</div>
                        </>
                      ) : (
                        <>
                          <div className="section-header">
                            <span className="section-title">{selectedEvent.missions.length} missões</span>
                            <span className="section-helper-text">Fluxo fixo com Análise geral e Programação.</span>
                          </div>
                          {!selectedEvent.missions.length ? (
                            <div className="teams-empty">Nenhuma missão.</div>
                          ) : (
                            <div className="mission-simple-list">
                              {selectedEvent.missions.map((mission, index) => {
                                const missionAiMode = getMissionAiMode(mission);
                                const reflections = getMissionReflections(selectedEvent, mission.id);
                                const feedbackKey = `${selectedEvent.id}__${mission.id}`;
                                const feedbackOpen = Boolean(missionFeedbackOpen[feedbackKey]);
                                const missionHasOpenTeams = selectedEvent.teams.some((_, teamIdx) => getMissionClosureStatus(selectedEvent, teamIdx, mission.id) === "aberta");
                                const missionHasReopenableTeams = selectedEvent.teams.some((_, teamIdx) => canFacilitatorReopenMissionForTeam(selectedEvent, teamIdx, mission.id));
                                const teamRowsOpen = Boolean(missionTeamRowsOpen[feedbackKey]);
                                const teamRows = selectedEvent.teams.map((teamItem, teamIdx) => {
                                  const execs = getExecucoes(selectedEvent, teamIdx, mission.id);
                                  const latestExec = execs[execs.length - 1] || null;
                                  const reflection = (selectedEvent.reflexoes || {})[`${teamIdx}__${mission.id}`];
                                  const closureStatus = getMissionClosureStatus(selectedEvent, teamIdx, mission.id);
                                  const helpOpen = getOpenHelpRequests(selectedEvent).filter(
                                    (request) => request.teamIdx === teamIdx && request.missionId === mission.id,
                                  ).length;
                                  const preservedUsage = getPreservedMissionUsage(selectedEvent, teamIdx, mission.id);
                                  const responseTokens = execs.reduce((sum, execucao) => sum + (execucao.tokens || 0), 0) + (preservedUsage.total || 0);
                                  const responseCost = execs.reduce((sum, execucao) => sum + (execucao.custo || 0), 0) + (preservedUsage.cost || 0);
                                  const analysisTokens =
                                    execs.reduce((sum, execucao) => sum + (execucao.technicalAnalysisUsage?.totalTokens || 0), 0) +
                                    (preservedUsage.explanationTotal || 0);
                                  const analysisCost =
                                    execs.reduce((sum, execucao) => sum + (execucao.technicalAnalysisUsage?.cost || 0), 0) +
                                    (preservedUsage.explanationCost || 0);
                                  const teamTokens = responseTokens + analysisTokens;
                                  return {
                                    teamName: teamItem.name,
                                    reflection,
                                    closureStatus,
                                    helpOpen,
                                    runs: execs.length,
                                    teamTokens,
                                    responseTokens,
                                    responseCost,
                                    analysisTokens,
                                    analysisCost,
                                    latestExec,
                                  };
                                });
                                const topicAverages = PERGUNTAS_REFLEXAO.map((question) => {
                                  const values = reflections
                                    .map((reflection) => Number(reflection.respostas?.[question.id] || 0))
                                    .filter(Boolean);
                                  const average = values.length
                                    ? values.reduce((sum, value) => sum + value, 0) / values.length
                                    : 0;
                                  return {
                                    id: question.id,
                                    label: getReflectionTopicShortLabel(question.id),
                                    average,
                                  };
                                });
                                const scoredTopics = topicAverages.filter((item) => item.average > 0);
                                const overallAverage = scoredTopics.length
                                  ? scoredTopics.reduce((sum, item) => sum + item.average, 0) / scoredTopics.length
                                  : 0;

                                return (
                                  <div className="mission-row-wrap" key={`${mission.id}-${index}`}>
                                    <div className="mission-row">
                                      <div className="mission-main">
                                        <div className="mission-row-header">
                                          <span className="mission-num">{mission.num || ""}</span>
                                          <button
                                            className={`mission-toggle mission-toggle-inline${mission.unlocked ? " is-on" : ""}`}
                                            onClick={() => handleToggleMission(selectedEvent.id, index, !mission.unlocked)}
                                            aria-label={mission.unlocked ? `Desligar missão ${mission.name}` : `Ligar missão ${mission.name}`}
                                          >
                                            <span className="mission-toggle-track">
                                              <span className="mission-toggle-thumb" />
                                            </span>
                                          </button>
                                          <span className="mname">{mission.name}</span>
                                          <label className="mission-ai-mode-inline">
                                            <span className="mission-ai-mode-label">IA</span>
                                            <select
                                              value={missionAiMode}
                                              onChange={(event) => handleMissionAiModeChange(selectedEvent.id, index, event.target.value)}
                                            >
                                              <option value={CHAT_AI_MODE}>{AI_MODE_LABELS[CHAT_AI_MODE]}</option>
                                              <option value={CODING_AI_MODE}>{AI_MODE_LABELS[CODING_AI_MODE]}</option>
                                            </select>
                                          </label>
                                        </div>
                                        {mission.desc ? <div className="mdesc">{mission.desc}</div> : null}
                                        <div className="mission-inline-stats">
                                          <span>{reflections.length} feedback(s)</span>
                                          <span>
                                            {selectedEvent.teams.filter((_, teamIdx) => isConcluida(selectedEvent, teamIdx, mission.id)).length} time(s) concluíram
                                          </span>
                                        </div>
                                        {reflections.length ? (
                                          <div className="mission-feedback-list">
                                            <div className="mission-feedback-card is-summary">
                                              <div className="mission-feedback-head">
                                                <div>
                                                  <div className="mission-feedback-team">Média geral das avaliações</div>
                                                  <div className="mission-feedback-meta">{reflections.length} time(s) responderam</div>
                                                </div>
                                                <div className="mission-feedback-overall-score" aria-label={`${overallAverage.toFixed(1)} de 5`}>
                                                  {overallAverage ? `${overallAverage.toFixed(1)}/5` : "-"}
                                                </div>
                                              </div>
                                              {scoredTopics.length ? (
                                                <div className="mission-feedback-bars">
                                                  {scoredTopics.map((item) => (
                                                    <div className="mission-feedback-bar-row" key={item.id}>
                                                      <div className="mission-feedback-bar-head">
                                                        <strong>{item.label}</strong>
                                                        <span className="mission-feedback-score" aria-label={`${item.average.toFixed(1)} de 5`}>
                                                          {item.average.toFixed(1)}/5
                                                        </span>
                                                      </div>
                                                      <div className="mission-feedback-bar-track" aria-hidden="true">
                                                        <div className="mission-feedback-bar-fill" style={{ width: `${(item.average / 5) * 100}%` }} />
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : null}
                                              <div className="mission-feedback-actions">
                                                <button
                                                  className="mission-feedback-toggle"
                                                  type="button"
                                                  onClick={() =>
                                                    setMissionFeedbackOpen((current) => ({
                                                      ...current,
                                                      [feedbackKey]: !current[feedbackKey],
                                                    }))
                                                  }
                                                >
                                                  {feedbackOpen ? "Ocultar times" : "Ver times"}
                                                </button>
                                              </div>
                                            </div>
                                            {feedbackOpen
                                              ? reflections.map((reflection) => (
                                                  <div className="mission-feedback-card" key={`${reflection.teamIdx}-${reflection.submittedAt || reflection.ts}`}>
                                                    <div className="mission-feedback-head">
                                                      <div className="mission-feedback-team">{selectedEvent.teams[reflection.teamIdx]?.name || `Time ${reflection.teamIdx + 1}`}</div>
                                                      <div className="mission-feedback-meta">{formatDateTime(reflection.submittedAt || reflection.ts)}</div>
                                                    </div>
                                                    <div className="mission-feedback-scores is-inline">
                                                      {Object.entries(reflection.respostas || {}).map(([key, value]) => (
                                                        <span className="mission-feedback-chip is-rating" key={key}>
                                                          <strong>{getReflectionTopicShortLabel(key)}</strong>
                                                          <span className="mission-feedback-score" aria-label={`${Number(value).toFixed(1)} de 5`}>
                                                            {Number(value).toFixed(1)}/5
                                                          </span>
                                                        </span>
                                                      ))}
                                                    </div>
                                                    {reflection.comment ? <div className="mission-feedback-comment">{reflection.comment}</div> : null}
                                                  </div>
                                                ))
                                              : null}
                                          </div>
                                        ) : null}
                                        <div className="mission-team-collapsible">
                                          <div className="mission-team-collapsible-head">
                                            <span className="mission-team-collapsible-copy">
                                              {teamRows.length} {teamRows.length === 1 ? "time" : "times"} nesta missão
                                            </span>
                                            <button
                                              className="mission-feedback-toggle"
                                              type="button"
                                              onClick={() =>
                                                setMissionTeamRowsOpen((current) => ({
                                                  ...current,
                                                  [feedbackKey]: !current[feedbackKey],
                                                }))
                                              }
                                            >
                                              {teamRowsOpen ? "Ocultar times" : "Ver times"}
                                            </button>
                                          </div>
                                          {teamRowsOpen ? (
                                            <div className="mission-team-list mission-team-list-rich">
                                              {teamRows.map((teamRow) => (
                                                <div className="mission-team-row mission-team-row-rich" key={`${mission.id}-${teamRow.teamName}`}>
                                                  <div className="mission-team-main">
                                                    <div className="mission-team-top">
                                                      <div>
                                                        <div className="mission-team-name">{teamRow.teamName}</div>
                                                        <div className="mission-team-meta">
                                                          {teamRow.runs ? `${teamRow.runs} prompt(s)` : "Sem prompts ainda"} · {teamRow.teamTokens.toLocaleString()} tokens
                                                        </div>
                                                      </div>
                                                      <div className="team-mission-status">
                                                        <span className={`team-inline-pill${teamRow.closureStatus === "concluida" ? " is-complete" : teamRow.closureStatus === "aguardando_questionario" ? " is-alert" : teamRow.runs ? "" : " is-muted"}`}>
                                                          {teamRow.closureStatus === "concluida"
                                                            ? "feito"
                                                            : teamRow.closureStatus === "aguardando_questionario"
                                                              ? "questionário"
                                                              : teamRow.runs
                                                                ? "em andamento"
                                                                : "pendente"}
                                                        </span>
                                                        {teamRow.helpOpen ? (
                                                          <span className="team-help-indicator is-alert" title={`${teamRow.helpOpen} pedido(s) de ajuda aberto(s) nesta missão`}>
                                                            <span className="team-help-indicator-icon">!</span>
                                                            <span className="team-help-indicator-count">{teamRow.helpOpen}</span>
                                                          </span>
                                                        ) : null}
                                                      </div>
                                                    </div>
                                                    {teamRow.latestExec ? (
                                                      <div className="mission-team-latest">
                                                        <div className="mission-team-latest-label">Último prompt</div>
                                                        <div className="mission-team-latest-copy">“{truncatePromptSnippet(teamRow.latestExec.input, 180)}”</div>
                                                        <div className="mission-team-latest-meta">{formatDateTime(teamRow.latestExec.ts)}</div>
                                                      </div>
                                                    ) : null}
                                                    <div className="mission-team-token-grid">
                                                      <div className="mission-team-token-cell">
                                                        <span>Resposta</span>
                                                        <strong>{teamRow.responseTokens.toLocaleString()} tok</strong>
                                                        <small>${teamRow.responseCost.toFixed(4)}</small>
                                                      </div>
                                                      <div className="mission-team-token-cell">
                                                        <span>Análise</span>
                                                        <strong>{teamRow.analysisTokens.toLocaleString()} tok</strong>
                                                        <small>${teamRow.analysisCost.toFixed(4)}</small>
                                                      </div>
                                                      <div className="mission-team-token-cell is-total">
                                                        <span>Total</span>
                                                        <strong>{teamRow.teamTokens.toLocaleString()} tok</strong>
                                                        <small>${(teamRow.responseCost + teamRow.analysisCost).toFixed(4)}</small>
                                                      </div>
                                                    </div>
                                                    {teamRow.reflection ? (
                                                      <div className="team-mission-feedback mission-team-feedback">
                                                        <div className="team-admin-feedback-scores is-inline">
                                                          {Object.entries(teamRow.reflection.respostas || {}).map(([key, value]) => (
                                                            <span className="mission-feedback-chip is-rating" key={`${mission.id}-${teamRow.teamName}-${key}`}>
                                                              <strong>{getReflectionTopicShortLabel(key)}</strong>
                                                              <span className="mission-feedback-score" aria-label={`${Number(value).toFixed(1)} de 5`}>
                                                                {Number(value).toFixed(1)}/5
                                                              </span>
                                                            </span>
                                                          ))}
                                                        </div>
                                                        {teamRow.reflection.comment ? <div className="team-admin-feedback-comment">{teamRow.reflection.comment}</div> : null}
                                                      </div>
                                                    ) : null}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                      <div className="mission-actions">
                                        <button
                                          className="mission-close-btn"
                                          type="button"
                                          onClick={() =>
                                            missionHasOpenTeams
                                              ? openConfirm(
                                                  "Encerrar missão",
                                                  `Abrir o questionário final para todos os times ainda abertos na missão "${mission.name}"?`,
                                                  () => handleFacilitatorCloseMission(selectedEvent.id, mission.id),
                                                  { confirmTone: "primary" },
                                                )
                                              : missionHasReopenableTeams
                                                ? openConfirm(
                                                    "Reabrir missão",
                                                    `Reabrir a missão "${mission.name}" apenas para os times que foram fechados pelo facilitador?`,
                                                    () => handleFacilitatorReopenMission(selectedEvent.id, mission.id),
                                                    { confirmTone: "primary" },
                                                  )
                                                : null
                                          }
                                          disabled={!missionHasOpenTeams && !missionHasReopenableTeams}
                                        >
                                          {missionHasOpenTeams ? "Encerrar missão" : "Reabrir missão"}
                                        </button>
                                        <div className="mission-overflow">
                                          <button
                                            className={`mission-overflow-trigger${missionMenuOpen === `${mission.id}-${index}` ? " is-open" : ""}`}
                                            onClick={() => setMissionMenuOpen((current) => (current === `${mission.id}-${index}` ? null : `${mission.id}-${index}`))}
                                            aria-label={`Abrir menu da missão ${mission.name}`}
                                          >
                                            ⋯
                                          </button>
                                          {missionMenuOpen === `${mission.id}-${index}` ? (
                                            <div className="mission-overflow-menu">
                                              <button
                                                className="mission-overflow-item"
                                                onClick={() => {
                                                  setMissionMenuOpen(null);
                                                  openConfirm(
                                                    "Encerrar sem avaliação",
                                                    `Concluir a missão "${mission.name}" para os times restantes sem abrir questionário?`,
                                                    () => handleFacilitatorCloseMissionWithoutEvaluation(selectedEvent.id, mission.id),
                                                    { confirmTone: "primary" },
                                                  );
                                                }}
                                              >
                                                Encerrar sem avaliação
                                              </button>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {facTab === "prompts" && renderPromptInsights(selectedEvent)}

                  {facTab === "anamnese" && renderAnamnesisInsights(selectedEvent)}

                </>
              )}
            </main>
          </div>
          <AppFooter compact />
        </div>
      )}

      {screen === "entry" && (
        <div className="screen active selection-screen">
          <Topbar
            onLogoClick={goHome}
            right={
              <>
                {devQuickSwitch}
                <button className="btn btn-ghost btn-sm" onClick={goHome}>Início</button>
              </>
            }
          />
          <div className="center-wrap">
            <div className="center-box entry-selection-box">
              <div className="center-box-title">Escolha seu evento</div>
              <div className="center-box-sub">Selecione o laboratório em que você vai entrar.</div>
              <div className="entry-event-grid">
                {!openEventsForTeamEntry.length ? (
                  <div className="card entry-empty-card">Nenhum evento aberto no momento.</div>
                ) : (
                  openEventsForTeamEntry.map((event) => (
                    <button className="card entry-event-card" key={event.id} onClick={() => handleSelectEntryEvent(event.id)}>
                      <div className="entry-event-card-icon" aria-hidden="true">
                        <CalendarDays strokeWidth={1.6} />
                      </div>
                      <div className="entry-event-card-body">
                        <div className="entry-event-card-title">{event.name}</div>
                        {event.desc ? <div className="entry-event-card-sub">{event.desc}</div> : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
          <AppFooter />
        </div>
      )}

      {screen === "team" && teamEvent && (
        <div className="screen active selection-screen">
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
            <div className="center-box entry-selection-box">
              <div className="center-box-title">Escolha seu nome</div>
              <div className="entry-selected-event">{teamEvent.name}</div>
              <div className="student-card-grid">
                {!teamStudentOptions.length ? (
                  <div className="card entry-empty-card">Nenhum aluno cadastrado ainda.</div>
                ) : (
                  teamStudentOptions.map((student) => (
                    <button className="student-entry-card" key={student.id} onClick={() => handleEscolherAluno(student.teamIdx)}>
                      <div className="student-entry-icon" aria-hidden="true">
                        <Monitor strokeWidth={1.6} />
                      </div>
                      <div className="student-entry-name">{student.name}</div>
                      {student.showTeamName ? <div className="student-entry-team">{student.teamName}</div> : null}
                    </button>
                  ))
                )}
              </div>
              <div className="entry-back-row">
                <button className="btn btn-ghost btn-sm" onClick={goEntradaTime}>
                  Trocar evento
                </button>
              </div>
            </div>
          </div>
          <AppFooter />
        </div>
      )}

      {screen === "workspace" && teamEvent && team && (
        <div className="screen active workspace-screen">
          <Topbar
            onLogoClick={goHome}
            leftMeta={
              <div className="topbar-context-strip">
                <span className="topbar-context-item">
                  <CalendarDays size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span className="topbar-context-value">{teamEvent.name}</span>
                </span>
                <span className="topbar-context-item">
                  <Users size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span className="topbar-context-value">{team.name}</span>
                </span>
              </div>
            }
            right={
              <>
                {teamEventAnnouncements.length ? (
                  <button className="btn btn-sm topbar-participant-action" onClick={handleOpenTeamAnnouncementInbox}>
                    <MessageSquareText size={14} strokeWidth={1.7} aria-hidden="true" />
                    Mensagens
                    {teamUnreadAnnouncementCount ? <span className="help-trigger-badge">{teamUnreadAnnouncementCount}</span> : null}
                  </button>
                ) : null}
                {!teamScreenShareVisible ? (
                  <button className="btn btn-sm topbar-participant-action" onClick={() => setTokenDrawerOpen(true)}>
                    <FileText size={14} strokeWidth={1.7} aria-hidden="true" />
                    Extrato de tokens
                  </button>
                ) : null}
                {(currentMission || isTrainingEvent) && !teamScreenShareVisible ? (
                  <>
                    <button
                      className={`btn btn-sm topbar-participant-action${teamHelpDisabled ? " is-disabled" : ""}`}
                      onClick={handleOpenHelp}
                      disabled={teamHelpDisabled}
                    >
                      <LifeBuoy size={14} strokeWidth={1.7} aria-hidden="true" />
                      {currentOpenHelpRequest ? "Ajuda enviada" : "Pedir ajuda"}
                      {currentOpenHelpCount ? <span className="help-trigger-badge">{currentOpenHelpCount}</span> : null}
                    </button>
                    <button
                      className={`btn btn-sm topbar-participant-action topbar-token-request-btn${teamHelpDisabled ? " is-disabled" : ""}`}
                      onClick={handleSendTokenRequest}
                      disabled={teamHelpDisabled || !currentMission || !currentTokenBudget?.blocked || Boolean(currentOpenTokenRequest)}
                      title={!currentTokenBudget?.blocked ? "Disponível quando o limite da missão for atingido" : undefined}
                    >
                      <Coins size={14} strokeWidth={1.7} aria-hidden="true" />
                      {currentOpenTokenRequest ? "Tokens solicitados" : "Solicitar tokens"}
                    </button>
                  </>
                ) : null}
                {!teamScreenShareVisible ? (
                  <button className="btn btn-sm topbar-participant-action topbar-student-area-btn" onClick={() => setMaterialsDrawerOpen(true)}>
                    <Users size={14} strokeWidth={1.7} aria-hidden="true" />
                    Área do aluno
                  </button>
                ) : null}
              </>
            }
          />
          {devQuickSwitch ? <div className="dev-toolbar-shell">{devQuickSwitch}</div> : null}
          {!apiConfigured && <div className="demo-banner">Modo demonstração - sem chave OpenAI. Respostas são simuladas.</div>}
          {teamScreenShareVisible ? (
            <div className="live-share-banner">
              Compartilhamento de tela ao vivo. O facilitador está projetando a própria tela.
            </div>
          ) : null}
          {teamEventTimerNotice ? (
            <div className="team-timer-notice-banner">
              <span className="team-timer-notice-kicker">Atualização do cronômetro</span>
              <span className="team-timer-notice-text">{teamEventTimerNotice.message}</span>
            </div>
          ) : null}
          <div className={`workspace${teamScreenShareVisible ? " workspace-live-focus" : ""}`}>
            {!teamScreenShareVisible ? (
              <aside className="ws-sidebar">
                <div className="ws-sidebar-label workspace-col-label is-block">
                  <span className="ws-column-label-icon" aria-hidden="true">
                    {isTrainingEvent ? <Sparkles size={15} strokeWidth={1.7} /> : <ListChecks size={15} strokeWidth={1.7} />}
                  </span>
                  <div className="workspace-col-label-copy">
                    <span className="workspace-col-label-title">{isTrainingEvent ? "Modo treino" : "Missões"}</span>
                    <span className="workspace-col-label-sub workspace-col-label-sub-empty" aria-hidden="true">.</span>
                  </div>
                </div>
                {isTrainingEvent ? (
                  <div className="training-sidebar-panel">
                    <div className="mission-item-brief-meta">
                      <span>Modo: livre</span>
                      <span>Tipo: laboratório</span>
                    </div>
                    <div className="mission-item-brief-block">
                      <strong className="mini-label mission-brief-label">
                        <CircleAlert size={15} strokeWidth={1.6} aria-hidden="true" />
                        <span>Situação</span>
                      </strong>
                      <p>{TRAINING_MISSION.situacao}</p>
                    </div>
                    <div className="mission-item-brief-block">
                      <strong className="mini-label mission-brief-label">
                        <WandSparkles size={15} strokeWidth={1.6} aria-hidden="true" />
                        <span>O que fazer</span>
                      </strong>
                      <p>{TRAINING_MISSION.instrucao}</p>
                    </div>
                    {hasMissionHistory ? (
                      <button
                        className="mission-reset-btn"
                        onClick={() =>
                          openConfirm(
                            "Reiniciar conversa do time",
                            "Isso apaga o histórico livre, os pedidos de ajuda do treino e reinicia a conversa deste time do zero. Deseja continuar?",
                            handleResetTrainingConversation,
                          )
                        }
                      >
                        Reiniciar conversa do time
                      </button>
                    ) : null}
                  </div>
                ) : !teamEvent.missions.length ? (
                  <div className="empty-list-text">Nenhuma missão disponível.</div>
                ) : (
                  <div className="ws-mission-list">
                    {teamEvent.missions.map((mission, index) => {
                      const locked = !mission.unlocked;
                      const missionStatus = getMissionClosureStatus(teamEvent, timeTeamIdx, mission.id);
                      const concluida = missionStatus === "concluida";
                      const aguardandoQuestionario = missionStatus === "aguardando_questionario";
                      const execs = getExecucoes(teamEvent, timeTeamIdx, mission.id);
                      const meta = concluida
                        ? "feito"
                        : aguardandoQuestionario
                          ? "questionário"
                          : locked
                            ? "bloqueada"
                            : execs.length
                              ? "em andamento"
                              : "liberada";
                      const isCurrentMission = timeMissionIdx === index;
                      const canResetMission = isCurrentMission && hasMissionHistory;
                      return (
                        <div className="mission-item-wrap" key={`${mission.id}-${index}`}>
                          <button
                            className={`mission-item${isCurrentMission ? " active" : ""}${locked ? " locked" : ""}${concluida ? " done" : ""}`}
                            disabled={locked}
                            onClick={() => handleSelectMission(index)}
                            title={locked ? "Bloqueada pelo facilitador" : ""}
                          >
                            <div className="mission-item-head">
                              <div className="mission-item-name">
                                {mission.num ? `${mission.num}. ` : ""}
                                {mission.name}
                              </div>
                              <span
                                className={`mission-item-status-dot${locked ? " is-locked" : concluida ? " is-done" : aguardandoQuestionario ? " is-open" : " is-open"}`}
                                aria-label={meta}
                                title={meta}
                              />
                            </div>
                          </button>
                          {isCurrentMission ? (
                            <div className="mission-item-brief">
                              <div className="mission-item-brief-meta">
                                <span>IA: {AI_MODE_LABELS[getMissionAiMode(mission)]}</span>
                              </div>
                              <div className="mission-item-brief-block">
                                <strong className="mini-label mission-brief-label">
                                  <CircleAlert size={15} strokeWidth={1.6} aria-hidden="true" />
                                  <span>Situação</span>
                                </strong>
                                <p>{mission.situacao || mission.desc}</p>
                              </div>
                              <div className="mission-item-brief-block">
                                <strong className="mini-label mission-brief-label">
                                  <WandSparkles size={15} strokeWidth={1.6} aria-hidden="true" />
                                  <span>O que fazer</span>
                                </strong>
                                <p>{mission.instrucao || "Escreva o input abaixo e escolha a ação."}</p>
                              </div>
                            </div>
                          ) : null}
                          {canResetMission ? (
                            <button
                              className="mission-reset-btn"
                              onClick={() =>
                                openConfirm(
                                  "Reabrir missão do zero",
                                  "Isso vai apagar respostas, explicações, histórico, questionário e status de concluída desta missão para o time atual. Os tokens consumidos permanecerão no acumulado histórico. Deseja continuar?",
                                  handleResetMissionFromZero,
                                )
                              }
                            >
                              Reabrir missão do zero
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </aside>
            ) : null}

            <main className={`ws-content${teamScreenShareVisible ? " ws-content-live" : ""}`}>
              {teamScreenShareVisible ? (
                <TeamScreenShareViewer
                  event={teamEvent}
                  screenShare={teamEventScreenShare}
                  team={team}
                  onDismiss={() => setDismissedScreenShareSession(teamScreenShareSessionId)}
                />
              ) : !currentMission ? (
                <EmptyState icon="◎" title="Nenhuma missão selecionada" sub="Selecione uma missão liberada na barra lateral." />
              ) : (
                <>
                  <div className="workspace-col-label is-block">
                    <span className="ws-column-label-icon" aria-hidden="true">
                      <MessageSquareText size={15} strokeWidth={1.7} />
                    </span>
                    <div className="workspace-col-label-copy workspace-col-label-copy-inline">
                      <span className="workspace-col-label-title">TECH HALL GPT</span>
                      <span className="workspace-col-label-sub workspace-col-label-sub-inline">
                        {apiConfigured ? "CONNECTED TO OPENAI API" : "DEMO MODE"}
                      </span>
                    </div>
                  </div>
                  <div className="workspace-chat-body">
                    {(!currentConcluida && !currentQuestionarioPendente) ? (
                      <div className="input-card input-card-chat">
                        <div className="prompt-composer">
                          <PromptConversation
                            execs={currentExecs}
                            pendingPrompt={activePrompt}
                            pendingAttachments={activeAttachments}
                            runState={running ? runState : null}
                            liveAnswerRef={liveAnswerRef}
                          />
                          {!isTrainingEvent ? (
                            <div className="prompt-composer-top-actions">
                              <button
                                className="mission-close-btn is-compact"
                                type="button"
                                onClick={() =>
                                  openConfirm(
                                    "Encerrar missão",
                                    "Ao encerrar, este time para de conversar nesta missão e entra direto no questionário final. Deseja continuar?",
                                    handleTeamCloseMission,
                                    { confirmTone: "primary" },
                                  )
                                }
                                disabled={running}
                              >
                                Encerrar missão
                              </button>
                            </div>
                          ) : null}
                          <div className="prompt-entry-shell">
                            {missionAttachments.length ? (
                              <div className="composer-attachments">
                                {missionAttachments.map((attachment) => (
                                  <div className={`composer-attachment-chip is-${attachment.kind}`} key={attachment.id}>
                                    <div className="composer-attachment-copy">
                                      <span>{attachment.name}</span>
                                      <small>
                                        {attachment.kind === "document"
                                          ? attachment.extractedText
                                            ? `${attachment.sizeLabel} · texto extraído`
                                            : attachment.extractionFailed
                                              ? `${attachment.sizeLabel} · leitura indisponível`
                                              : attachment.sizeLabel
                                          : attachment.sizeLabel}
                                      </small>
                                    </div>
                                    <button
                                      className="composer-attachment-remove"
                                      type="button"
                                      aria-label={`Remover ${attachment.name}`}
                                      onClick={() => handleRemoveAttachment(attachment.id)}
                                      disabled={running}
                                    >
                                      <X size={14} strokeWidth={1.8} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            <textarea
                              value={missionInput}
                              onChange={(event) => setMissionInput(event.target.value)}
                              disabled={running || teamTimerLockActive}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) {
                                  event.preventDefault();
                                  if (!running && !teamTimerLockActive) {
                                    handleExecutarMissao();
                                  }
                                }
                              }}
                              placeholder="Escreva sua mensagem ou anexe até 3 arquivos"
                            />
                            <input
                              ref={composerFileInputRef}
                              type="file"
                              accept={ATTACHMENT_ACCEPT}
                              multiple
                              className="visually-hidden-file-input"
                              onChange={handleAttachFiles}
                            />
                            <div className="input-actions input-compose-bar">
                              <div className="input-compose-meta">
                                <button
                                  className="input-attach-btn"
                                  type="button"
                                  onClick={() => composerFileInputRef.current?.click()}
                                  disabled={running || missionAttachments.length >= MAX_ATTACHMENT_COUNT}
                                  title={`Anexar arquivo (${MAX_ATTACHMENT_COUNT} por rodada, até 10 MB cada)`}
                                >
                                  <Paperclip size={14} strokeWidth={1.8} />
                                  <span>Anexar</span>
                                </button>
                                <div className="input-compact-control">
                                  <button
                                    id="mission-planning-toggle"
                                    type="button"
                                    className={`plan-toggle-btn${store.planningMode === "on" ? " is-on" : ""}`}
                                    aria-label="Planejar"
                                    aria-pressed={store.planningMode === "on"}
                                    onClick={() => handleQuickPlanningModeChange(store.planningMode === "on" ? "off" : "on")}
                                    disabled={running}
                                  >
                                    Planejar
                                  </button>
                                </div>
                                <div className="input-compact-control input-compact-control-model">
                                  <ModelSelect
                                    ariaLabel="Modelo"
                                    options={composerModelOptions}
                                    value={selectedModelForMode}
                                    onChange={handleQuickModelChange}
                                    disabled={running}
                                    dropUp
                                  />
                                </div>
                              </div>
                                <button
                                  className="input-send-btn"
                                  aria-label={running ? "Executando com IA" : "Executar com IA"}
                                  disabled={running || teamTimerLockActive}
                                  onClick={handleExecutarMissao}
                                  title={teamTimerLockActive ? "Tempo encerrado pelo facilitador" : running ? "Executando com IA" : "Executar com IA"}
                                >
                                  <span className="input-send-btn-icon">{running ? "…" : "↑"}</span>
                                </button>
                            </div>
                          </div>
                        </div>
                        {runError ? <div className="error-box top-gap-sm">{runError}</div> : null}
                      </div>
                    ) : null}

                    {!isTrainingEvent && currentQuestionarioPendente ? (
                      <div className="done-inline-banner is-pending-survey">
                        {currentQuestionarioPendenteSource === "team"
                          ? "Missão encerrada para este time."
                          : "Missão encerrada pelo facilitador para este time."}
                        <span className="done-sub">Preencha o questionário final para concluir esta missão.</span>
                      </div>
                    ) : null}

                    {!isTrainingEvent ? (
                      <>
                        <MissionClosurePanel
                          stage={missionFlow.stage}
                          reflectionAnswers={reflectionAnswers}
                          reflectionComment={reflectionComment}
                          reflectionError={reflectionError}
                          canClose={currentQuestionarioPendenteSource === "team"}
                          onClose={handleCancelTeamMissionClosure}
                          onSelectAnswer={(questionId, score) =>
                            {
                              setReflectionError("");
                              setReflectionAnswers((current) => ({ ...current, [questionId]: score }));
                            }
                          }
                          onChangeComment={(value) => {
                            setReflectionError("");
                            setReflectionComment(value);
                          }}
                          onSubmitReflection={handleSaveReflection}
                        />

                        {currentConcluida ? (
                          <div className="workspace-finish-state">
                            <div className="done-inline-banner">
                              {currentConclusaoSource === "team"
                                ? "Missão concluída pelo seu time."
                                : "Missão encerrada pelo facilitador para este time."}
                              <span className="done-sub">Aguarde a próxima missão ser liberada pelo facilitador.</span>
                            </div>
                            {currentReflexao ? <ReflectionSummary reflexao={currentReflexao} /> : null}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </main>

            {!teamScreenShareVisible ? (
              <aside className="workspace-explain-shell">
                <div className="workspace-col-label is-block">
                  <span className="ws-column-label-icon" aria-hidden="true">
                    <BookOpen size={15} strokeWidth={1.7} />
                  </span>
                  <div className="workspace-col-label-copy">
                    <span className="workspace-col-label-title">Explicação técnica</span>
                    <span className="workspace-col-label-sub workspace-col-label-sub-empty" aria-hidden="true">.</span>
                  </div>
                </div>
                <div className="workspace-explain-body">
                  {readingStage && readingExec ? (
                    <MissionReadingPanel
                      exec={readingExec}
                    />
                  ) : (
                    <div className="reading-placeholder workspace-reading-placeholder">
                      <div className="reading-placeholder-title">Explicação técnica</div>
                      <div className="reading-placeholder-text">
                        Depois de executar uma rodada, a leitura técnica aparece aqui automaticamente com mecanismo, critérios e limites da resposta.
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            ) : null}
          </div>
          {teamTimerLockActive ? (
            <div className="team-timer-lock-overlay">
              <div className="team-timer-lock-card">
                <div className="team-timer-lock-kicker">Tempo encerrado</div>
                <div className="team-timer-lock-title">A atividade foi pausada pelo cronômetro.</div>
                <div className="team-timer-lock-text">
                  A sala será liberada automaticamente em alguns segundos, a menos que o facilitador acrescente mais tempo antes.
                </div>
              </div>
            </div>
          ) : null}
          {teamEventTimerRunning && !teamScreenShareVisible ? (
            <div className={`team-timer-widget${teamTimerExpired ? " is-expired" : ""}`}>
              <span className="team-timer-widget-icon" aria-hidden="true">
                <Clock3 size={18} strokeWidth={1.8} />
              </span>
              <span className="team-timer-widget-label">Cronômetro</span>
              <span className="team-timer-widget-value">{formatCountdown(teamEventTimerRemainingMs)}</span>
            </div>
          ) : null}
          <AppFooter compact />
        </div>
      )}

      {screen === "workspace" && tokenDrawerOpen ? (
        <div className="side-sheet-backdrop" onClick={() => setTokenDrawerOpen(false)}>
          <aside className="side-sheet side-sheet-right" onClick={(event) => event.stopPropagation()}>
            <div className="side-sheet-header">
              <div>
                <div className="side-sheet-kicker">Extrato</div>
                <div className="side-sheet-title">Uso de tokens</div>
              </div>
              <button
                className="side-sheet-close"
                aria-label="Fechar extrato de tokens"
                onClick={() => setTokenDrawerOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="side-sheet-body">
              <MissionTokenRail
                execs={currentExecs}
                runState={runState}
                flowStage={missionFlow.stage}
                model={getModelLabel(modelCatalog, selectedModelForMode)}
                preservedUsage={preservedUsage}
                tokenBudget={currentTokenBudget}
                operationalLogs={currentMissionOperationalLogs}
              />
            </div>
          </aside>
        </div>
      ) : null}

      {screen === "workspace" && materialsDrawerOpen ? (
        <div className="side-sheet-backdrop" onClick={() => setMaterialsDrawerOpen(false)}>
          <aside className="side-sheet side-sheet-right" onClick={(event) => event.stopPropagation()}>
            <div className="side-sheet-header">
              <div>
                <div className="side-sheet-kicker">Participante</div>
                <div className="side-sheet-title">Área do aluno</div>
              </div>
              <button
                className="side-sheet-close"
                aria-label="Fechar materiais"
                onClick={() => setMaterialsDrawerOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="side-sheet-body materials-sheet-body">
              {STUDENT_RESOURCE_SECTIONS.map((section) => (
                <section className="materials-section" key={section.id}>
                  <div className="materials-section-title">
                    <span className="materials-section-title-icon" aria-hidden="true">
                      {section.id === "materials" ? <FolderOpen size={18} strokeWidth={1.45} /> : <Newspaper size={18} strokeWidth={1.45} />}
                    </span>
                    <span>{section.title}</span>
                  </div>
                  <div className="materials-group-list">
                    {section.groups.map((group) => (
                      <div className="materials-group-card" key={group.id}>
                        <div className="materials-group-head">
                          {section.id !== "materials" && group.title ? <div className="materials-group-title">{group.title}</div> : null}
                          {group.description ? <div className="materials-group-description">{group.description}</div> : null}
                        </div>
                        <div className="materials-link-list">
                          {group.items.map((item) =>
                            item.href ? (
                              <button
                                type="button"
                                key={item.id}
                                className={`materials-link-card materials-link-card-${section.id}`}
                                onClick={() => handleOpenStudentResource(item, section.title)}
                              >
                                <div className="materials-link-copy">
                                  <strong>{item.title}</strong>
                                  {item.description ? <span>{item.description}</span> : null}
                                </div>
                              </button>
                            ) : (
                              <div key={item.id} className={`materials-link-card materials-link-card-${section.id} is-disabled`}>
                                <div className="materials-link-copy">
                                  <strong>{item.title}</strong>
                                  {item.description ? <span>{item.description}</span> : null}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      <Modal
        open={Boolean(studentResourcePreview)}
        onClose={() => setStudentResourcePreview(null)}
        className="student-resource-preview-modal"
      >
        {studentResourcePreview ? (
          <div className="student-resource-preview-shell">
            <div className="student-resource-preview-header">
              <div className="student-resource-preview-kicker">{studentResourcePreview.sectionTitle}</div>
              <div className="student-resource-preview-title">{studentResourcePreview.title}</div>
              {studentResourcePreview.description ? (
                <div className="student-resource-preview-description">{studentResourcePreview.description}</div>
              ) : null}
            </div>
            <div className="student-resource-preview-frame-wrap">
              <iframe
                className="student-resource-preview-frame"
                src={studentResourcePreview.previewHref}
                title={studentResourcePreview.title}
              />
            </div>
            <div className="student-resource-preview-note">
              Se o conteúdo não abrir bem aqui, você pode continuar em outra aba.
            </div>
            <div className="student-resource-preview-actions">
              <button type="button" className="btn secondary" onClick={() => setStudentResourcePreview(null)}>
                Fechar
              </button>
              <button type="button" className="btn primary" onClick={handleOpenStudentResourceInNewTab}>
                Abrir em outra aba
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {screen === "facilitador" && facilitatorToolsOpen ? (
        <FacilitatorToolsDrawer
          event={selectedEvent}
          activeView={facilitatorToolView}
          apiConfigured={apiConfigured}
          announcement={selectedEventLatestAnnouncement}
          announcementCount={selectedEventAnnouncements.length}
          timer={selectedEventTimer}
          timerRunning={selectedEventTimerRunning}
          timerRemainingMs={selectedEventTimerRemainingMs}
          timerNotice={selectedEventTimerNotice}
          timerMinutesInput={timerMinutesInput}
          onChangeTimerMinutes={setTimerMinutesInput}
          onChangeView={setFacilitatorToolView}
          onClose={() => {
            setFacilitatorToolsOpen(false);
            setFacilitatorToolView(FACILITATOR_TOOL_VIEWS.MENU);
          }}
          onOpenConfig={() => {
            setFacilitatorToolsOpen(false);
            setFacilitatorToolView(FACILITATOR_TOOL_VIEWS.MENU);
            setConfigForm({
              apiKey: "",
              chatModel: store.chatModel || getDefaultModelForMode(serverConfig, CHAT_AI_MODE),
              codingModel: store.codingModel || getDefaultModelForMode(serverConfig, CODING_AI_MODE),
              planningMode: store.planningMode,
            });
            setConfigOpen(true);
          }}
          onOpenBroadcast={() => {
            setFacilitatorToolsOpen(false);
            setFacilitatorToolView(FACILITATOR_TOOL_VIEWS.MENU);
            handleOpenBroadcastModal();
          }}
          onStartTimer={handleStartSessionTimer}
          onAddTimer={handleAddSessionTimer}
          onClearTimer={handleClearSessionTimer}
          onDismissTimerNotice={handleDismissSessionTimerNotice}
          onPublishScreenShare={(nextState) => {
            if (!selectedEvent) return;
            handlePublishScreenShare(selectedEvent.id, nextState);
          }}
          screenShare={selectedEventScreenShare}
          tokenGrantTargetMissionId={tokenGrantTargetMissionId}
          onChangeTokenGrantTargetMissionId={setTokenGrantTargetMissionId}
          tokenPolicyCustomInput={tokenPolicyCustomInput}
          onChangeTokenPolicyCustomInput={setTokenPolicyCustomInput}
          onSaveMissionTokenPolicy={handleSaveMissionTokenPolicy}
        />
      ) : null}

      <Modal open={tokenLimitModalOpen} onClose={() => setTokenLimitModalOpen(false)} small className="token-limit-modal">
        <div className="modal-title">Limite de tokens atingido</div>
        <div className="modal-sub">
          Você usou todo o limite disponível para esta missão.
        </div>
        <div className="modal-sub">
          Para continuar, solicite mais tokens ao facilitador.
        </div>
        <div className="modal-actions">
          <button className="btn" type="button" onClick={() => setTokenLimitModalOpen(false)}>
            Fechar
          </button>
          <button
            className="btn btn-primary topbar-token-request-btn"
            type="button"
            onClick={() => {
              setTokenLimitModalOpen(false);
              handleSendTokenRequest();
            }}
            disabled={Boolean(currentOpenTokenRequest)}
          >
            <Coins size={14} strokeWidth={1.7} aria-hidden="true" />
            {currentOpenTokenRequest ? "Solicitação enviada" : "Solicitar tokens"}
          </button>
        </div>
      </Modal>

      <Modal
        open={anamnesisOpen}
        onClose={handleCloseAnamnesisModal}
        dismissible
        className="anamnesis-modal-shell"
      >
        <div className="anamnesis-modal-header">
          <div className="anamnesis-modal-kicker">Check-in da turma</div>
          <div className="modal-title">Antes de começar</div>
          <div className="modal-sub">
            {anamnesisContext?.memberName ? `${anamnesisContext.memberName},` : "Antes de entrar,"} responda esta anamnese. Ela ajuda o facilitador a conhecer o perfil agregado da turma.
          </div>
          <div className="anamnesis-progress-row">
            <div className="anamnesis-progress-track" aria-hidden="true">
              <div className="anamnesis-progress-fill" style={{ width: `${(answeredAnamnesisCount / ANAMNESIS_QUESTIONS.length) * 100}%` }} />
            </div>
            <div className="anamnesis-progress-label">
              Pergunta {Math.min(anamnesisStep + 1, ANAMNESIS_QUESTIONS.length)}/{ANAMNESIS_QUESTIONS.length}
            </div>
          </div>
          {anamnesisTargetEvent?.name ? <div className="anamnesis-context-line">{anamnesisTargetEvent.name}</div> : null}
        </div>

        <div className="anamnesis-modal-body">
          {currentAnamnesisQuestion ? (
            <section className="anamnesis-form-question-card">
              <div className="anamnesis-form-question-label">
                <span className="anamnesis-form-question-number">{currentAnamnesisQuestion.number}.</span>
                <div className="anamnesis-form-question-copy">
                  <span className="anamnesis-form-question-prompt">{currentAnamnesisQuestion.prompt}</span>
                  {currentAnamnesisQuestion.optionalText ? <span className="anamnesis-question-optional-tag">Complemento opcional</span> : null}
                </div>
              </div>

              {currentAnamnesisQuestion.type === "text" ? (
                <textarea
                  className="anamnesis-textarea"
                  rows={currentAnamnesisQuestion.id === "q9" ? 2 : 3}
                  value={currentAnamnesisNoteValue}
                  placeholder={currentAnamnesisQuestion.placeholder || ""}
                  onChange={(event) => handleChangeAnamnesisText(currentAnamnesisQuestion.id, event.target.value)}
                />
              ) : currentAnamnesisQuestion.type === "scale" ? (
                <>
                  <div className="scale-pills anamnesis-scale-pills">
                    {currentAnamnesisQuestion.options.map((option, optionIdx) => (
                      <button
                        key={`${currentAnamnesisQuestion.id}-${optionIdx}`}
                        type="button"
                        className={`scale-pill${currentAnamnesisChoiceValue === optionIdx ? " sel" : ""}`}
                        onClick={() => handleToggleAnamnesisOption(currentAnamnesisQuestion, optionIdx)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={`anamnesis-unknown-btn${currentAnamnesisChoiceValue === ANAMNESIS_UNKNOWN_VALUE ? " is-selected" : ""}`}
                    onClick={() => handleToggleAnamnesisOption(currentAnamnesisQuestion, ANAMNESIS_UNKNOWN_VALUE)}
                  >
                    Não sei responder
                  </button>
                </>
              ) : (
                <>
                  <div className="opts anamnesis-opts">
                    {currentAnamnesisQuestion.options.map((option, optionIdx) => {
                      const selected = currentAnamnesisQuestion.type === "multi"
                        ? Array.isArray(currentAnamnesisChoiceValue) && currentAnamnesisChoiceValue.includes(optionIdx)
                        : currentAnamnesisChoiceValue === optionIdx;
                      return (
                        <button
                          key={`${currentAnamnesisQuestion.id}-${optionIdx}`}
                          type="button"
                          className={`opt${currentAnamnesisQuestion.type === "multi" ? " opt-sq" : ""}${selected ? " sel" : ""}`}
                          onClick={() => handleToggleAnamnesisOption(currentAnamnesisQuestion, optionIdx)}
                        >
                          <span className="opt-mark" aria-hidden="true">
                            <span className="opt-mark-inner" />
                          </span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className={`anamnesis-unknown-btn${isAnamnesisUnknownChoice(currentAnamnesisChoiceValue) ? " is-selected" : ""}`}
                    onClick={() => handleToggleAnamnesisOption(currentAnamnesisQuestion, ANAMNESIS_UNKNOWN_VALUE)}
                  >
                    Não sei responder
                  </button>
                  {currentAnamnesisQuestion.optionalText ? (
                    <div className="anamnesis-optional-shell">
                      <div className="anamnesis-optional-label">Campo opcional</div>
                      <textarea
                        className="anamnesis-textarea anamnesis-textarea-optional"
                        rows={currentAnamnesisQuestion.id === "q9" ? 2 : 3}
                        value={currentAnamnesisNoteValue}
                        placeholder={currentAnamnesisQuestion.placeholder || ""}
                        onChange={(event) => handleChangeAnamnesisText(currentAnamnesisQuestion.id, event.target.value)}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </section>
          ) : null}
        </div>

        {anamnesisError ? <div className="error-box top-gap-sm">{anamnesisError}</div> : null}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={handleCloseAnamnesisModal}>
            Voltar
          </button>
          <div className="anamnesis-step-actions">
            {anamnesisStep > 0 ? (
              <button type="button" className="btn" onClick={handleReturnAnamnesisStep}>
                Anterior
              </button>
            ) : null}
            {anamnesisStep < ANAMNESIS_QUESTIONS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={handleAdvanceAnamnesisStep}>
                Próxima
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleSubmitAnamnesis} disabled={!isCurrentAnamnesisAnswered}>
                Enviar anamnese
              </button>
            )}
          </div>
        </div>
      </Modal>

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
          <label className="form-label">Descrição</label>
          <input
            type="text"
            value={newEventForm.desc}
            onChange={(event) => setNewEventForm((current) => ({ ...current, desc: event.target.value }))}
            placeholder="Ex: Aula de IA generativa"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Como montar os times</label>
          <div className="inline-choice-row">
            <button
              type="button"
              className={`choice-pill${newEventForm.teamMode === "manual" ? " active" : ""}`}
              onClick={() => setNewEventForm((current) => ({ ...current, teamMode: "manual" }))}
            >
              Digitar times
            </button>
            <button
              type="button"
              className={`choice-pill${newEventForm.teamMode === "import" ? " active" : ""}`}
              onClick={() => setNewEventForm((current) => ({ ...current, teamMode: "import" }))}
            >
              Importar alunos
            </button>
          </div>
        </div>
        {newEventForm.teamMode === "manual" ? (
          <div className="form-group">
            <label className="form-label">Times</label>
            <textarea
              value={newEventForm.teams}
              onChange={(event) => setNewEventForm((current) => ({ ...current, teams: event.target.value }))}
              placeholder={"Um por linha\nTime 1\nTime 2\nTime 3"}
            />
            <div className="form-hint">Um por linha.</div>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Lista de alunos</label>
              <textarea
                value={newEventForm.studentsRaw}
                onChange={(event) => setNewEventForm((current) => ({ ...current, studentsRaw: event.target.value }))}
                placeholder={"Um nome por linha\nAna Souza\nBruno Lima\nCamila Rocha"}
              />
              <div className="form-hint">{newEventStudents.length} aluno(s) validado(s).</div>
            </div>
          </>
        )}
        <div className="form-group">
          <label className="form-label">Anamnese antes do laboratório</label>
          <div className="inline-choice-row">
            <button
              type="button"
              className={`choice-pill${!newEventForm.anamnesisEnabled ? " active" : ""}`}
              onClick={() => setNewEventForm((current) => ({ ...current, anamnesisEnabled: false }))}
            >
              Desligada
            </button>
            <button
              type="button"
              className={`choice-pill${newEventForm.anamnesisEnabled ? " active" : ""}`}
              onClick={() => setNewEventForm((current) => ({ ...current, anamnesisEnabled: true }))}
            >
              Ligada
            </button>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={() => setNewEventOpen(false)}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCreateEvent}>
            Criar
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(addTeamOpen)} onClose={() => setAddTeamOpen(false)}>
        {addTeamOpen === "manual" ? (
          <>
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
          </>
        ) : (
          <>
            <div className="modal-title">Importar alunos e gerar times</div>
            <div className="modal-sub">
              Cole uma lista com um nome por linha. Depois escolha entre criar uma sala por aluno ou randomizar em grupos.
            </div>
            <div className="form-group">
              <label className="form-label">Lista de alunos</label>
              <textarea
                value={teamImportForm.studentsRaw}
                onChange={(event) => setTeamImportForm((current) => ({ ...current, studentsRaw: event.target.value }))}
                placeholder={"Um nome por linha\nAna Souza\nBruno Lima\nCamila Rocha"}
              />
              <div className="form-hint">{importedStudents.length} aluno(s) valido(s).</div>
            </div>
            <div className="form-group">
              <label className="form-label">Como gerar</label>
              <div className="inline-choice-row">
                <button
                  className={`choice-pill${teamImportForm.importMode === "solo" ? " active" : ""}`}
                  onClick={() => setTeamImportForm((current) => ({ ...current, importMode: "solo" }))}
                >
                  1 sala por aluno
                </button>
                <button
                  className={`choice-pill${teamImportForm.importMode === "random" ? " active" : ""}`}
                  onClick={() => setTeamImportForm((current) => ({ ...current, importMode: "random" }))}
                >
                  Randomizar em times
                </button>
              </div>
            </div>
            {teamImportForm.importMode === "random" ? (
              <div className="form-group">
                <label className="form-label">Quantidade de times</label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, importedStudents.length || 1)}
                  value={teamImportForm.randomTeamCount}
                  onChange={(event) =>
                    setTeamImportForm((current) => ({ ...current, randomTeamCount: Number(event.target.value) || 1 }))
                  }
                />
              </div>
            ) : null}
            {importedStudents.length ? (
              <div className="import-preview">
                <div className="mini-label">Prévia</div>
                <div className="import-preview-list">
                  {importedStudents.slice(0, 10).map((student) => (
                    <span className="import-preview-chip" key={student}>
                      {student}
                    </span>
                  ))}
                  {importedStudents.length > 10 ? <span className="import-preview-more">+{importedStudents.length - 10} nomes</span> : null}
                </div>
              </div>
            ) : null}
            <div className="modal-actions">
              <button className="btn" onClick={() => setAddTeamOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleGenerateTeamsForEvent}>
                Gerar times
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={configOpen} onClose={() => setConfigOpen(false)}>
        <div className="modal-title">Configuração da IA</div>
        <div className="notice">
          {serverConfig.deploymentTarget === "vercel"
            ? serverConfig.openaiConfigured
              ? "Há uma chave OpenAI ativa neste deploy. No Vercel, ela vem das variáveis do projeto."
              : "No Vercel, configure OPENAI_API_KEY nas variáveis do projeto para ativar a IA."
            : serverConfig.openaiConfigured
              ? `Há uma chave persistente ativa no servidor local (${serverConfig.openaiSource === "env" ? "vinda do .env" : "salva neste projeto"}).`
              : "Se você salvar uma chave aqui, ela fica persistente no servidor local deste projeto e não depende da porta do navegador."}
        </div>
        <div className="form-group">
          <label className="form-label">Chave OpenAI</label>
          <input
            type="password"
            value={configForm.apiKey}
            onChange={(event) => setConfigForm((current) => ({ ...current, apiKey: event.target.value }))}
            placeholder={
              serverConfig.deploymentTarget === "vercel"
                ? "Em produção, prefira configurar OPENAI_API_KEY no Vercel"
                : serverConfig.openaiConfigured
                  ? "Cole uma nova chave para substituir a atual"
                  : "sk-..."
            }
          />
        </div>
        <div className="form-group">
          <label className="form-label">Modelo padrão (chat)</label>
          <ModelSelect
            ariaLabel="Modelo padrão de chat"
            options={modelCatalog.chat}
            value={configForm.chatModel}
            onChange={(nextId) => setConfigForm((current) => ({ ...current, chatModel: nextId }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Modelo padrão (programação)</label>
          <ModelSelect
            ariaLabel="Modelo padrão de programação"
            options={modelCatalog.coding}
            value={configForm.codingModel}
            onChange={(nextId) => setConfigForm((current) => ({ ...current, codingModel: nextId }))}
          />
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

      <Modal
        open={facAccessOpen}
        onClose={() => {
          setFacAccessOpen(false);
          setFacAccessPassword("");
          setFacAccessError("");
        }}
        small
      >
        <div className="modal-title">Acesso do facilitador</div>
        <div className="modal-sub">Digite a senha para entrar no painel do facilitador.</div>
        <div className="form-group">
          <label className="form-label">Senha</label>
          <input
            type="password"
            value={facAccessPassword}
            onChange={(event) => {
              setFacAccessPassword(event.target.value);
              if (facAccessError) setFacAccessError("");
            }}
            placeholder="Digite a senha"
            onKeyDown={(event) => {
              if (event.key === "Enter") handleFacilitadorAccess();
            }}
          />
          {facAccessError ? <div className="error-box top-gap-sm">{facAccessError}</div> : null}
        </div>
        <div className="modal-actions">
          <button
            className="btn"
            onClick={() => {
              setFacAccessOpen(false);
              setFacAccessPassword("");
              setFacAccessError("");
            }}
          >
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleFacilitadorAccess}>
            Entrar
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
            <div className="form-hint">{confirmState.confirmHint || "Digite exatamente o código do evento para liberar esta exclusão."}</div>
          </div>
        ) : null}
        <div className="modal-actions">
          <button className="btn" onClick={closeConfirm}>
            Cancelar
          </button>
          {confirmState.secondaryAction ? (
            <button
              className={`btn ${confirmState.secondaryAction.className || ""}`.trim()}
              disabled={confirmState.requiresPassword && confirmInput.trim() !== confirmState.confirmValue}
              onClick={() => {
                confirmState.secondaryAction.onClick?.();
                closeConfirm();
              }}
            >
              {confirmState.secondaryAction.label}
            </button>
          ) : null}
          <button
            className={`btn ${confirmState.confirmTone === "primary" ? "btn-primary" : "btn-primary btn-danger"}`}
            disabled={confirmState.requiresPassword && confirmInput.trim() !== confirmState.confirmValue}
            onClick={() => {
              confirmState.onConfirm?.();
              closeConfirm();
            }}
          >
            {confirmState.confirmActionLabel || (confirmState.secondaryAction ? "Confirmar" : "Confirmar")}
          </button>
        </div>
      </Modal>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} small>
        <div className="modal-title">Pedir ajuda ao facilitador</div>
        <div className="modal-sub">
          {teamHelpDisabled
            ? "A ajuda está desativada para este time. Reative no topo da tela quando quiser voltar a falar com o facilitador."
            : currentOpenHelpRequest
            ? "Seu pedido já foi enviado. Você pode revisar a mensagem ou cancelar se não precisar mais de ajuda."
            : "O facilitador vai receber este pedido junto com o contexto da missão e do seu time."}
        </div>
        <div className="form-group">
          <label className="form-label">Mensagem curta</label>
          <textarea
            value={helpMessage}
            onChange={(event) => setHelpMessage(event.target.value)}
            placeholder="Ex: Estamos travados para escolher a melhor ação e validar a resposta."
            disabled={teamHelpDisabled || Boolean(currentOpenHelpRequest)}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setHelpOpen(false)}>
            Fechar
          </button>
          {teamHelpDisabled ? (
            <button className="btn btn-primary" onClick={handleToggleHelpDisabled}>
              Reativar ajuda
            </button>
          ) : currentOpenHelpRequest ? (
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

      <Modal open={broadcastOpen} onClose={() => setBroadcastOpen(false)}>
        <div className="modal-title">Mensagem para a turma</div>
        <div className="modal-sub">
          Publique avisos para todos os times deste evento. Cada envio entra na caixa de entrada da turma e pode reaparecer pelo ícone de mensagens no header.
        </div>
        <div className="form-group">
          <label className="form-label">Mensagem</label>
          <textarea
            value={broadcastMessage}
            onChange={(event) => setBroadcastMessage(event.target.value)}
            placeholder="Ex: Pessoal, fechem a Missão 1 até 14h20. Depois vamos discutir os resultados em conjunto."
          />
        </div>
        <div className="modal-actions">
          {selectedEventAnnouncements.length ? (
            <button className="btn btn-ghost btn-danger" onClick={handleClearBroadcastMessage}>
              Limpar mensagens
            </button>
          ) : null}
          <button className="btn" onClick={() => setBroadcastOpen(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={!broadcastMessage.trim()} onClick={handleSaveBroadcastMessage}>
            Enviar
          </button>
        </div>
      </Modal>

      <Modal open={teamAnnouncementOpen} onClose={handleDismissTeamAnnouncement} small className="team-announcement-modal">
        <div className="modal-title">Mensagem do facilitador</div>
        <div className="team-announcement-modal-copy">{latestUnreadAnnouncement?.message}</div>
        <div className="modal-actions">
          <button className="btn" onClick={handleOpenTeamAnnouncementInbox}>
            Abrir caixa de entrada
          </button>
          <button className="btn btn-primary" onClick={handleDismissTeamAnnouncement}>
            Fechar
          </button>
        </div>
      </Modal>

      <Modal open={teamAnnouncementInboxOpen} onClose={() => setTeamAnnouncementInboxOpen(false)} className="team-announcement-inbox-modal">
        <div className="modal-title">Mensagens do facilitador</div>
        <div className="modal-sub">Tudo o que foi enviado para esta turma neste evento fica guardado aqui.</div>
        <div className="team-announcement-inbox-list">
          {teamEventAnnouncements.length ? (
            [...teamEventAnnouncements].reverse().map((announcement) => (
              <article key={announcement.id} className="team-announcement-inbox-item">
                <div className="team-announcement-inbox-meta">
                  <span>Facilitador</span>
                  <span>{new Date(announcement.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="team-announcement-inbox-copy">{announcement.message}</div>
              </article>
            ))
          ) : (
            <div className="teams-empty">Nenhuma mensagem registrada neste evento.</div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => setTeamAnnouncementInboxOpen(false)}>
            Fechar
          </button>
        </div>
      </Modal>

      <div className={`toast${toastText ? " show" : ""}`}>{toastText}</div>
    </>
  );
}

function Topbar({ onLogoClick, right, roleBadge, leftMeta = null }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="logo" onClick={onLogoClick}>
          <img src={techHallLogoDark} alt="Tech Hall" className="brand-wordmark topbar-wordmark" />
          {roleBadge ? <span className="badge-role">{roleBadge}</span> : null}
        </button>
        {leftMeta ? <div className="topbar-left-meta">{leftMeta}</div> : null}
      </div>
      <div className="topbar-right">{right}</div>
    </div>
  );
}

function AppFooter({ compact = false }) {
  return (
    <footer className={`app-footer${compact ? " is-compact" : ""}`}>
      <div className="app-footer-inner">
        <div className="app-footer-copy-block">
          <div className="app-footer-brand">
            <span className="app-footer-title app-footer-title-brand">Tech Hall AI Lab</span>
          </div>
          <div className="app-footer-copy">Laboratório de prática com IA para times</div>
        </div>
        <img className="app-footer-corner-icon" src={techHallFooterIcon} alt="" aria-hidden="true" />
      </div>
    </footer>
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
          Código
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
  const promptText = exec.promptApplied || details?.promptApplied || exec.acao || "Sem ação";

  if (!details && !exec.explicacao) return null;

  return (
    <div className="explain-section">
      {!forceOpen ? (
        <button className="explain-toggle" onClick={onToggle}>
          Como a IA pensou esta missão {open ? "▴" : "▾"}
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
              <div className="explain-block-label">Termos técnicos usados</div>
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
            <div className="explain-block-text">{details?.selectionLogic || details?.actionInfluence || exec.acao || "Sem ação."}</div>
          </div>
          {details?.alternativeAnswerPaths?.length ? (
            <div>
              <div className="explain-block-label">Outras respostas plausíveis</div>
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
            <div className="explain-block-label">Limites e suposições</div>
            <div className="explain-block-text">{details?.limitations || "Sem observações adicionais."}</div>
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

function ReasoningPanel({ text, live = false }) {
  const [open, setOpen] = useState(live);
  const [userToggled, setUserToggled] = useState(false);

  useEffect(() => {
    if (!userToggled) setOpen(live);
  }, [live, userToggled]);

  if (!text) return null;

  return (
    <div className={`reasoning-panel${live ? " is-live" : ""}`}>
      <button
        type="button"
        className="reasoning-toggle"
        onClick={() => {
          setUserToggled(true);
          setOpen((value) => !value);
        }}
      >
        {live ? (
          <span className="thinking-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : null}
        <span className="reasoning-toggle-label">{live ? "Pensando" : "Raciocínio"}</span>
        <span className="reasoning-toggle-caret">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div className="reasoning-body">
          <MarkdownMessage text={text} />
        </div>
      ) : null}
    </div>
  );
}

function ThinkingIndicator({ label = "Pensando" }) {
  return (
    <div className="thinking-indicator" role="status" aria-live="polite">
      <span className="thinking-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="thinking-label">{label}</span>
    </div>
  );
}

function LiveRunCard({ runState }) {
  return (
    <div className="output-card live-run-card">
      <div className="output-header">
        <div className="output-label">{runState.simulationMode === "openai-live" ? "OpenAI em execução" : "IA simulada em execução"}</div>
        <span className="muted-mini">
          {runState.simulationMode === "openai-live" ? "chamada real em andamento" : "simulação local com streaming"}
        </span>
      </div>
      <div className="output-body">
        <ProcessingPipeline processingSteps={runState.processingSteps} />
        {runState.usedHistory ? <div className="context-banner">Esta nova resposta está considerando o histórico anterior desta missão.</div> : null}
        <div className="output-text output-text-live">
          {runState.displayedOutput || (runState.simulationMode === "openai-live" ? "Aguardando retorno da OpenAI..." : "Preparando resposta da IA...")}
          <span className="streaming-cursor" />
        </div>
      </div>
    </div>
  );
}

function AttachmentList({ attachments = [] }) {
  if (!attachments.length) return null;
  return (
    <div className="prompt-attachment-list">
      {attachments.map((attachment) => (
        <div className={`prompt-attachment-chip is-${attachment.kind}`} key={attachment.id}>
          <span>{attachment.name}</span>
          <small>{attachment.sizeLabel}</small>
        </div>
      ))}
    </div>
  );
}

function HtmlArtifactCard({ artifact, compact = false }) {
  if (!artifact) return null;
  return (
    <div className={`html-artifact-card${compact ? " is-compact" : ""}`}>
      <div className="html-artifact-head">
        <div>
          <div className="html-artifact-kicker">Instância HTML</div>
          <div className="html-artifact-title">Preview executável</div>
        </div>
        <div className="html-artifact-actions">
          <button
            className="btn btn-sm btn-ghost"
            type="button"
            onClick={() => openHtmlPreviewWindow(artifact.html, artifact.fileName || "Preview HTML")}
          >
            Abrir preview
          </button>
          <button
            className="btn btn-sm btn-ghost"
            type="button"
            onClick={() => downloadHtmlArtifact(artifact.html, artifact.fileName)}
          >
            Baixar .html
          </button>
        </div>
      </div>
      <div className="html-artifact-frame-shell">
        <iframe
          className="html-artifact-frame"
          title="Pré-visualização HTML"
          sandbox="allow-scripts"
          srcDoc={artifact.html}
        />
      </div>
    </div>
  );
}

function GeneratedArtifactsPanel({ exec, compact = false }) {
  const artifacts = Array.isArray(exec?.generatedArtifacts) ? exec.generatedArtifacts : [];
  if (!artifacts.length) return null;

  const htmlArtifact = artifacts.find((artifact) => artifact.previewMode === "html");
  const otherArtifacts = artifacts.filter((artifact) => artifact !== htmlArtifact);

  return (
    <div className={`generated-artifacts-panel${compact ? " is-compact" : ""}`}>
      <div className="generated-artifacts-head">
        <div className="generated-artifacts-kicker">Artefatos gerados</div>
        <div className="generated-artifacts-sub">{artifacts.length} arquivo(s) real(is) nesta rodada</div>
      </div>
      <div className="generated-artifacts-list">
        {artifacts.map((artifact) => (
          <div className="generated-artifact-row" key={artifact.id}>
            <div className="generated-artifact-copy">
              <strong>{artifact.fileName}</strong>
              <span>{artifact.language?.toUpperCase() || artifact.extension?.toUpperCase() || "TXT"}</span>
            </div>
            <button
              className="btn btn-sm btn-ghost"
              type="button"
              onClick={() => downloadTextArtifact(artifact.content, artifact.fileName, artifact.mimeType)}
            >
              Baixar
            </button>
          </div>
        ))}
      </div>
      {htmlArtifact ? (
        <HtmlArtifactCard
          artifact={{
            html: htmlArtifact.content,
            fileName: htmlArtifact.fileName,
          }}
          compact={compact}
        />
      ) : null}
      {!htmlArtifact && otherArtifacts.length ? (
        <div className="generated-artifacts-note">Os arquivos acima já podem ser baixados e usados fora do chat.</div>
      ) : null}
    </div>
  );
}

const LiveAnswer = forwardRef(function LiveAnswer({ simulationMode, onUpdate }, ref) {
  const [answer, setAnswer] = useState("");
  const [reasoning, setReasoning] = useState("");

  useImperativeHandle(
    ref,
    () => ({
      pushAnswer: (text) => setAnswer(text),
      pushReasoning: (text) => setReasoning(text),
      reset: () => {
        setAnswer("");
        setReasoning("");
      },
    }),
    [],
  );

  useEffect(() => {
    onUpdate?.();
  }, [answer, reasoning, onUpdate]);

  return (
    <>
      {reasoning ? <ReasoningPanel text={reasoning} live={!answer} /> : null}
      {answer ? (
        <>
          <MarkdownMessage text={answer} />
          <span className="streaming-cursor" />
        </>
      ) : !reasoning ? (
        <ThinkingIndicator label={simulationMode === "openai-live" ? "Pensando" : "Preparando resposta"} />
      ) : null}
    </>
  );
});

function PromptConversation({ execs, pendingPrompt, pendingAttachments = [], runState, liveAnswerRef }) {
  const hasHistory = execs.length > 0;
  const hasPending = Boolean(runState && (pendingPrompt.trim() || pendingAttachments.length));
  const threadRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    const node = threadRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [execs.length, hasPending, scrollToBottom]);

  return (
    <div className={`prompt-thread${!hasHistory && !hasPending ? " is-empty" : ""}`} ref={threadRef}>
      {execs.map((exec, index) => {
        const key = exec.id || exec.ts || `exec-${index}`;
        return (
          <div className="prompt-thread-turn" key={key}>
            <div className="prompt-thread-bubble is-user">
              <div className="prompt-thread-meta">
                <span>Você</span>
                <span>{exec.isFreeInstruction ? "Instrução livre" : getActionLabel(exec.acao)}</span>
              </div>
              {exec.input ? <div className="prompt-thread-text">{exec.input}</div> : null}
              <AttachmentList attachments={exec.attachments || []} />
            </div>
            <div className="prompt-thread-bubble is-assistant">
              <div className="prompt-thread-meta">
                <span>IA</span>
                <span>{exec.tokens?.toLocaleString() || 0} tokens</span>
              </div>
              {exec.historySignal ? <div className="context-banner">{exec.historySignal}</div> : null}
              {exec.reasoningText ? <ReasoningPanel text={exec.reasoningText} /> : null}
              <MarkdownMessage text={exec.output} />
              <GeneratedArtifactsPanel exec={exec} compact />
            </div>
          </div>
        );
      })}

      {hasPending ? (
        <div className="prompt-thread-turn is-pending">
          <div className="prompt-thread-bubble is-user">
            <div className="prompt-thread-meta">
              <span>Você</span>
              <span>{runState?.selectedActionLabel || "Nova rodada"}</span>
            </div>
            {pendingPrompt.trim() ? <div className="prompt-thread-text">{pendingPrompt}</div> : null}
            <AttachmentList attachments={pendingAttachments} />
          </div>
          <div className="prompt-thread-bubble is-assistant">
            <div className="prompt-thread-meta">
              <span>IA</span>
              <span>{runState?.simulationMode === "openai-live" ? "OpenAI em execução" : "IA simulada em execução"}</span>
            </div>
            {runState?.processingSteps?.length ? <ProcessingPipeline processingSteps={runState.processingSteps} /> : null}
            {runState?.usedHistory ? (
              <div className="context-banner">Esta nova resposta está considerando o histórico anterior desta missão.</div>
            ) : null}
            <div className="prompt-thread-text is-live">
              <LiveAnswer ref={liveAnswerRef} simulationMode={runState?.simulationMode} onUpdate={scrollToBottom} />
            </div>
          </div>
        </div>
      ) : null}

      {!hasHistory && !hasPending ? <div className="prompt-thread-empty-spacer" aria-hidden="true" /> : null}
    </div>
  );
}

function ComposerResponseInline({ exec, runState, onOpenExplanation }) {
  const isRunning = Boolean(runState);
  const responseContent = isRunning ? (runState?.displayedOutput || "") : (exec?.output || "");
  const reasoningText = isRunning ? (runState?.reasoningText || "") : (exec?.reasoningText || "");
  const thinkingLabel = runState?.simulationMode === "openai-live" ? "Pensando" : "Preparando resposta";

  if (!isRunning && !exec) return null;

  return (
    <div className="prompt-composer-response">
      <div className="prompt-composer-response-head">
        <div className="output-label">{isRunning ? "Resposta em andamento" : "Resposta desta rodada"}</div>
        <span className="muted-mini">
          {isRunning
            ? runState?.simulationMode === "openai-live"
              ? "OpenAI em execução"
              : "IA simulada em execução"
            : `${exec?.acao || "-"} · ${exec?.tokens?.toLocaleString() || 0} tokens`}
        </span>
      </div>
      <div className="prompt-composer-response-body">
        {isRunning && runState?.processingSteps?.length ? <ProcessingPipeline processingSteps={runState.processingSteps} /> : null}
        {(runState?.usedHistory || exec?.historySignal) ? (
          <div className="context-banner">
            {isRunning && runState?.usedHistory ? "Esta nova resposta está considerando o histórico anterior desta missão." : exec?.historySignal}
          </div>
        ) : null}
        {reasoningText ? <ReasoningPanel text={reasoningText} live={isRunning && !responseContent} /> : null}
        <div className={`output-text${isRunning ? " output-text-live" : ""}`}>
          {responseContent ? (
            <>
              <MarkdownMessage text={responseContent} />
              {isRunning ? <span className="streaming-cursor" /> : null}
            </>
          ) : (
            isRunning && !reasoningText ? <ThinkingIndicator label={thinkingLabel} /> : null
          )}
        </div>
        {!isRunning && exec && onOpenExplanation ? (
          <div className="prompt-composer-response-actions">
            <button className="btn btn-primary btn-sm" onClick={onOpenExplanation}>
              Abrir explicação técnica
            </button>
          </div>
        ) : null}
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

function TechnicalReadingList({ items = [] }) {
  const normalizedItems = normalizeAnalysisItemArray(items);
  return (
    <div className="tech-reading-list">
      {normalizedItems.map((item, index) => (
        <div className="tech-reading-item" key={`${item}-${index}`}>
          <span className="tech-reading-item-bullet" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function TechnicalReadingBlock({ blockKey, children }) {
  const copy = TECHNICAL_PANEL_BLOCKS[blockKey];
  return (
    <section className="tech-reading-structured-block">
      <div className="tech-reading-structured-head">
        <span className="tech-reading-structured-index">{copy.index}</span>
        <div className="tech-reading-structured-copy">
          <div className="tech-reading-structured-title">{copy.title}</div>
          <div className="tech-reading-structured-anchor">{copy.anchor}</div>
        </div>
      </div>
      <div className="tech-reading-structured-body">{children}</div>
    </section>
  );
}

function MissionReadingPanel({ exec }) {
  const details = normalizeTechnicalAnalysis(exec.technicalAnalysis || exec.reasoningDetails || {}, {
    accumulatedGlossary: exec.technicalAnalysis?.glossary?.accumulated || exec.reasoningDetails?.glossary?.accumulated || [],
  });
  const [chainExpanded, setChainExpanded] = useState(false);
  const glossaryItems = details.glossary?.round?.length ? details.glossary.round : [];

  if (details.pending) {
    return (
      <section className="tech-reading-panel">
        <div className="tech-reading-header">
          <div className="tech-reading-meta">
            <span>Rodada {exec.iterationNumber || "-"}</span>
          </div>
        </div>
        <div className="tech-reading-body">
          <div className="tech-reading-unavailable tech-reading-pending">
            <div className="tech-reading-block-label">Análise em processamento</div>
            <div className="tech-reading-copy">{details.unavailableReason}</div>
            <div className="tech-reading-loader" aria-hidden="true">
              <img className="tech-reading-loader-icon" src={techHallFooterIcon} alt="" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tech-reading-panel">
      <div className="tech-reading-header">
        <div className="tech-reading-meta">
          <span>Rodada {exec.iterationNumber || "-"}</span>
        </div>
      </div>

      <div className="tech-reading-body">
        {details.unavailable ? (
          <div className="tech-reading-unavailable">
            <div className="tech-reading-block-label">Análise indisponível</div>
            <div className="tech-reading-copy">{details.unavailableReason}</div>
          </div>
        ) : null}

        {!details.unavailable && !details.pending && exec.historySignal ? (
          <div className="tech-reading-banner">{exec.historySignal}</div>
        ) : null}

        <TechnicalReadingBlock blockKey="executiveSummary">
          <div className="tech-reading-highlight">
            <div className="tech-reading-highlight-item">
              <div className="tech-reading-subtitle">Leitura principal</div>
              <div className="tech-reading-highlight-copy">{details.executiveSummary?.takeaway || ANALYSIS_NOT_APPLICABLE}</div>
            </div>
            <div className="tech-reading-highlight-item">
              <div className="tech-reading-subtitle">Ponto de atenção</div>
              <div className="tech-reading-highlight-copy">{details.executiveSummary?.risk || ANALYSIS_NOT_APPLICABLE}</div>
            </div>
            <div className="tech-reading-highlight-item">
              <div className="tech-reading-subtitle">Próximo ajuste</div>
              <div className="tech-reading-highlight-copy">{details.executiveSummary?.nextMove || ANALYSIS_NOT_APPLICABLE}</div>
            </div>
          </div>
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="promptReading">
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">EXPLÍCITO</div>
            <TechnicalReadingList items={details.promptReading?.explicit} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">INFERIDO</div>
            <TechnicalReadingList items={details.promptReading?.inferred} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">ASSUMIDO</div>
            <TechnicalReadingList items={details.promptReading?.assumed} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">AMBIGUIDADES</div>
            <TechnicalReadingList items={details.promptReading?.ambiguities} />
          </div>
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="chainOfThought">
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Contexto considerado</div>
            <TechnicalReadingList items={details.chainOfThought?.contextConsidered} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Estratégia escolhida</div>
            <TechnicalReadingList items={details.chainOfThought?.strategyChosen} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Descartado</div>
            <TechnicalReadingList items={details.chainOfThought?.discarded} />
          </div>
          <button className="tech-reading-expand-btn" type="button" onClick={() => setChainExpanded((value) => !value)}>
            Entender mais {chainExpanded ? "▴" : "▾"}
          </button>
          {chainExpanded ? (
            <div className="tech-reading-expanded-copy">
              {TECHNICAL_PANEL_BLOCKS.chainOfThought.expanded}
              <span>{details.chainOfThought?.expandedExplanation || ANALYSIS_NOT_APPLICABLE}</span>
            </div>
          ) : null}
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="responseConstruction">
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Tom e formato escolhidos</div>
            <TechnicalReadingList items={details.responseConstruction?.toneAndFormat} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Conceitos e terminologias ativados</div>
            <TechnicalReadingList items={details.responseConstruction?.conceptsActivated} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Limitações encontradas durante a geração</div>
            <TechnicalReadingList items={details.responseConstruction?.generationLimitations} />
          </div>
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="outputEvaluation">
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">O que a resposta faz bem</div>
            <TechnicalReadingList items={details.outputEvaluation?.whatWorked} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">O que ficou genérico ou em aberto</div>
            <TechnicalReadingList items={details.outputEvaluation?.whatStayedGeneric} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Gap entre pedido e entrega</div>
            <TechnicalReadingList items={details.outputEvaluation?.gapBetweenRequestAndDelivery} />
          </div>
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="nextStep">
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Como reformular o prompt para ir mais fundo</div>
            <TechnicalReadingList items={details.nextStep?.howToReformulate} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">O que vale testar na próxima rodada</div>
            <TechnicalReadingList items={details.nextStep?.whatToTestNext} />
          </div>
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="glossary">
          {glossaryItems.length ? (
            <div className="tech-reading-glossary-list">
              {glossaryItems.map((item, index) => (
                <div className="tech-reading-glossary-item" key={`${item.term}-${index}`}>
                  <strong>{item.term}</strong>
                  <span>{item.definition}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="tech-reading-copy">Sem termos novos relevantes nesta rodada.</div>
          )}
        </TechnicalReadingBlock>
      </div>
    </section>
  );
}

function MissionClosurePanel({
  stage,
  reflectionAnswers,
  reflectionComment,
  reflectionError,
  canClose = false,
  onClose,
  onSelectAnswer,
  onChangeComment,
  onSubmitReflection,
}) {
  if (stage !== "questionario_final") return null;
  const answeredCount = PERGUNTAS_REFLEXAO.filter((question) => reflectionAnswers[question.id]).length;
  const allAnswered = answeredCount === PERGUNTAS_REFLEXAO.length;

  return (
    <Modal
      open
      small={false}
      dismissible={canClose}
      onClose={canClose ? onClose : undefined}
      className="mission-closure-modal-shell"
    >
      <section className="reading-panel mission-inline-panel mission-closure-modal">
        <div className="reading-panel-header">
          <div>
            <div className="reading-panel-kicker">Avaliação</div>
            <div className="reading-panel-title">Concluir missão</div>
            <div className="reading-panel-sub">Responda as 3 perguntas para fechar a atividade do time.</div>
          </div>
        </div>
        <div className="mission-inline-panel-body">
          <div className="mission-closure-progress">
            <span>{answeredCount}/{PERGUNTAS_REFLEXAO.length} respondidas</span>
            {!allAnswered ? <strong>Faltam {PERGUNTAS_REFLEXAO.length - answeredCount}</strong> : <strong>Pronto para enviar</strong>}
          </div>
          {PERGUNTAS_REFLEXAO.map((question) => (
            <div className="reflexao-question" key={question.id}>
              <div className="reflexao-q-text">{question.texto}</div>
              <div className="scale-row">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    className={`scale-btn${reflectionAnswers[question.id] === score ? " selected" : ""}`}
                    onClick={() => onSelectAnswer(question.id, score)}
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
            <label className="form-label">Observação geral</label>
            <textarea
              value={reflectionComment}
              onChange={(event) => onChangeComment(event.target.value)}
              placeholder="Opcional: registre uma observação geral sobre a missão, a resposta da IA ou o que o time aprendeu."
            />
          </div>
          {reflectionError ? <div className="error-box">{reflectionError}</div> : null}
          <div className="mission-inline-actions">
            <button className="btn btn-green" type="button" disabled={!allAnswered} onClick={onSubmitReflection}>
              Enviar avaliação
            </button>
          </div>
        </div>
      </section>
    </Modal>
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
          <GuidedSection label="Lógica de seleção">
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
        title="Por que saiu isso e não outra coisa"
        subtitle="Aqui o foco é mostrar por que a IA privilegiou esse caminho de resposta."
        accent="amber"
      >
        <GuidedSection label="Por que essa saída aconteceu">
          <div className="explain-block-text">{details.whyThisAnswer || details.strategy || exec.explicacao}</div>
        </GuidedSection>
        <div className="two-col-guided">
          <GuidedSection label="Influência da ação ou instrução">
            <div className="explain-block-text">{details.actionInfluence || exec.acao || "Sem ação."}</div>
          </GuidedSection>
          <GuidedSection label="Limite ou trade-off">
            <div className="explain-block-text">{details.limitations || "Sem observações adicionais."}</div>
          </GuidedSection>
        </div>
        {details.alternativeAnswerPaths?.length ? (
          <GuidedSection label="Outras respostas plausíveis">
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
        title="Como perguntar melhor e extrair variações"
        subtitle="Este slide transforma a devolutiva em boa prática operacional."
        accent="green"
      >
        {details.howToAskBetter?.length ? (
          <GuidedSection label="Como pedir outras versões">
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
          <GuidedSection label="Boas práticas">
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
          <div className="prompt-preview">{exec.promptApplied || details.promptApplied || exec.acao || "Sem ação"}</div>
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
        <div className="output-label">{compact ? "Resposta desta rodada" : "Última resposta"}</div>
        <span className="muted-mini">
          {exec.acao || "-"} · {exec.tokens?.toLocaleString() || 0} tokens
        </span>
      </div>
      <div className="output-body">
        {exec.processingSteps?.length ? <ProcessingPipeline processingSteps={exec.processingSteps} /> : null}
        {exec.historySignal ? <div className="context-banner">{exec.historySignal}</div> : null}
        {exec.reasoningText ? <ReasoningPanel text={exec.reasoningText} /> : null}
        <MarkdownMessage text={exec.output} />
        <GeneratedArtifactsPanel exec={exec} compact={compact} />
      </div>
      {!compact ? <TransparencyPanel exec={exec} open={open} onToggle={() => setOpen((value) => !value)} /> : null}
    </div>
  );
}

function MissionTokenRail({ execs, runState, flowStage, model, preservedUsage, tokenBudget, operationalLogs }) {
  const totals = execs.reduce(
    (acc, exec) => ({
      responseTotal: acc.responseTotal + (exec.tokens || 0),
      responseInput: acc.responseInput + (exec.inputTokens || 0),
      responseOutput: acc.responseOutput + (exec.outputTokens || 0),
      responseCost: acc.responseCost + (exec.custo || 0),
      analysisTotal: acc.analysisTotal + (exec.technicalAnalysisUsage?.totalTokens || 0),
      analysisInput: acc.analysisInput + (exec.technicalAnalysisUsage?.inputTokens || 0),
      analysisOutput: acc.analysisOutput + (exec.technicalAnalysisUsage?.outputTokens || 0),
      analysisCost: acc.analysisCost + (exec.technicalAnalysisUsage?.cost || 0),
    }),
    { responseTotal: 0, responseInput: 0, responseOutput: 0, responseCost: 0, analysisTotal: 0, analysisInput: 0, analysisOutput: 0, analysisCost: 0 },
  );
  const liveOutput = runState?.displayedOutput || "";
  const liveOutputTokens = liveOutput ? Math.max(0, Math.round(liveOutput.length / 3.8)) : 0;
  const currentRun = runState
    ? {
        responseInput: runState.inputTokens || 0,
        responseOutput: runState.outputTokens || liveOutputTokens,
        responseTotal: (runState.inputTokens || 0) + (runState.outputTokens || liveOutputTokens),
        responseCost: runState.custo || 0,
        analysisInput: 0,
        analysisOutput: 0,
        analysisTotal: 0,
        analysisCost: 0,
      }
    : execs.length
      ? {
          responseInput: execs[execs.length - 1].inputTokens || 0,
          responseOutput: execs[execs.length - 1].outputTokens || 0,
          responseTotal: execs[execs.length - 1].tokens || 0,
          responseCost: execs[execs.length - 1].custo || 0,
          analysisInput: execs[execs.length - 1].technicalAnalysisUsage?.inputTokens || 0,
          analysisOutput: execs[execs.length - 1].technicalAnalysisUsage?.outputTokens || 0,
          analysisTotal: execs[execs.length - 1].technicalAnalysisUsage?.totalTokens || 0,
          analysisCost: execs[execs.length - 1].technicalAnalysisUsage?.cost || 0,
        }
      : { responseInput: 0, responseOutput: 0, responseTotal: 0, responseCost: 0, analysisInput: 0, analysisOutput: 0, analysisTotal: 0, analysisCost: 0 };
  const combinedTotals = {
    responseTotal: totals.responseTotal + (preservedUsage?.total || 0),
    responseInput: totals.responseInput + (preservedUsage?.input || 0),
    responseOutput: totals.responseOutput + (preservedUsage?.output || 0),
    responseCost: totals.responseCost + (preservedUsage?.cost || 0),
    analysisTotal: totals.analysisTotal + (preservedUsage?.explanationTotal || 0),
    analysisInput: totals.analysisInput + (preservedUsage?.explanationInput || 0),
    analysisOutput: totals.analysisOutput + (preservedUsage?.explanationOutput || 0),
    analysisCost: totals.analysisCost + (preservedUsage?.explanationCost || 0),
  };
  const grandTotalTokens = combinedTotals.responseTotal + combinedTotals.analysisTotal;
  const grandTotalCost = combinedTotals.responseCost + combinedTotals.analysisCost;

  return (
    <aside className="token-rail">
      <div className="tokens-panel token-rail-panel">
        <div className="tokens-panel-header">
          <div className="tokens-panel-title">Uso de tokens</div>
          <div className="muted-mini">{execs.length} execuções</div>
        </div>
        <div className="token-rail-status">
          <div className="token-rail-stage">{flowStage.replaceAll("_", " ")}</div>
          <div className="token-rail-model">{model}</div>
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Limite da missão</div>
          <div className="token-rail-summary">
            <div className="token-summary-item token-summary-primary">
              <span>Uso do participante</span>
              <strong>{tokenBudget?.usage.totalTokens?.toLocaleString?.("pt-BR") || "0"} tok</strong>
            </div>
            <div className="token-summary-item">
              <span>Limite efetivo</span>
              <strong>{formatTokenLimitLabel(tokenBudget?.effectiveLimit ?? null)}</strong>
            </div>
            <div className="token-summary-item">
              <span>Tokens liberados</span>
              <strong>{(tokenBudget?.extraTokens || 0).toLocaleString("pt-BR")} tok</strong>
            </div>
          </div>
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Totais acumulados</div>
          <div className="token-rail-summary">
            <div className="token-summary-item token-summary-primary">
              <span>Total geral</span>
              <strong>{grandTotalTokens.toLocaleString()} tok</strong>
            </div>
            <div className="token-summary-item">
              <span>Resposta principal</span>
              <strong>{combinedTotals.responseTotal.toLocaleString()} tok</strong>
            </div>
            <div className="token-summary-item">
              <span>Explicação técnica</span>
              <strong>{combinedTotals.analysisTotal.toLocaleString()} tok</strong>
            </div>
            <div className="token-summary-item token-summary-cost">
              <span>Custo total</span>
              <strong>${grandTotalCost.toFixed(4)}</strong>
            </div>
          </div>
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Última rodada</div>
          <div className="token-rail-summary">
            <div className="token-summary-item">
              <span>Resposta principal</span>
              <strong>{currentRun.responseTotal.toLocaleString()} tok · ${currentRun.responseCost.toFixed(4)}</strong>
            </div>
            <div className="token-summary-item">
              <span>Explicação técnica</span>
              <strong>{currentRun.analysisTotal.toLocaleString()} tok · ${currentRun.analysisCost.toFixed(4)}</strong>
            </div>
          </div>
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Histórico operacional</div>
          {operationalLogs?.length ? (
            <div className="token-log-list">
              {[...operationalLogs].reverse().map((log) => (
                <div className="token-log-item" key={log.id}>
                  <div className="token-log-head">
                    <strong>{log.message}</strong>
                    <span>{formatDateTime(log.createdAt)}</span>
                  </div>
                  {log.detail ? <div className="token-log-meta"><span>{log.detail}</span></div> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="muted-body">Nenhum registro operacional ainda.</div>
          )}
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Log de execuções</div>
          {execs.length ? (
            <div className="token-log-list">
              {[...execs].reverse().map((exec, index) => (
                <div className="token-log-item" key={exec.id || `${exec.ts}-${index}`}>
                  <div className="token-log-head">
                    <strong>Rodada {exec.iterationNumber || execs.length - index}</strong>
                    <span>{exec.isFreeInstruction ? "Instrução livre" : getActionLabel(exec.acao)}</span>
                  </div>
                  <div className="token-log-meta">
                    <span>resposta {(exec.tokens || 0).toLocaleString()} tok</span>
                    <span>in {(exec.inputTokens || 0).toLocaleString()}</span>
                    <span>out {(exec.outputTokens || 0).toLocaleString()}</span>
                    <span>${(exec.custo || 0).toFixed(4)}</span>
                  </div>
                  <div className="token-log-meta">
                    <span>explicação {(exec.technicalAnalysisUsage?.totalTokens || 0).toLocaleString()} tok</span>
                    <span>in {(exec.technicalAnalysisUsage?.inputTokens || 0).toLocaleString()}</span>
                    <span>out {(exec.technicalAnalysisUsage?.outputTokens || 0).toLocaleString()}</span>
                    <span>${(exec.technicalAnalysisUsage?.cost || 0).toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted-body">Nenhuma execução ainda.</div>
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
        <span>Ver histórico da missão ({execs.length} execuções)</span>
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
                <MarkdownMessage text={exec.output} />
                {exec.historySignal ? (
                  <>
                    <div className="mini-label">Contexto usado</div>
                    <div className="history-text muted-body">{exec.historySignal}</div>
                  </>
                ) : null}
                {exec.reasoningSummary || exec.explicacao ? (
                  <>
                    <div className="mini-label">Raciocínio técnico</div>
                    <div className="history-text muted-body">{exec.reasoningSummary || exec.explicacao}</div>
                  </>
                ) : null}
                <div className="mini-label">Modo da rodada</div>
                <div className="history-text muted-body">{exec.isFreeInstruction ? "Instrução livre" : getActionLabel(exec.acao)}</div>
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
        <div className="history-collapsed-hint">Registro de execuções, contexto usado e raciocínio técnico da missão.</div>
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
                {score <= value ? "✦" : "✧"}
              </span>
            ))}
          </div>
        </div>
      ))}
      {reflexao.comment ? (
        <div className="reflection-comment">
          <div className="mini-label">Observação geral</div>
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
      setError("Não foi possível iniciar o compartilhamento. Verifique o servidor LiveKit e as credenciais.");
    }
  }

  const effectiveStatus = status === "live" || screenShare.active ? "live" : status;
  return { status, error, effectiveStatus, startShare, stopShare };
}

function FacilitatorScreenShareButton({ event, screenShare, onPublishState, iconOnly = false }) {
  const shareState = screenShare || getScreenShareState({});
  const { status, error, effectiveStatus, startShare, stopShare } = useFacilitatorScreenSharePresenter(
    event,
    shareState,
    onPublishState,
  );
  const disabled = !event || status === "connecting";

  return (
    <button
      className={`btn btn-sm topbar-screen-share-btn${shareState.active ? " is-live" : ""}${iconOnly ? " is-icon" : ""}`}
      disabled={disabled}
      title={
        !event
          ? "Selecione um evento para projetar"
          : error
            ? error
            : effectiveStatus === "live"
              ? shareState.startedAt
                ? `Ao vivo desde ${formatDateTime(shareState.startedAt)}`
                : "Transmissão ao vivo"
              : effectiveStatus === "connecting"
                ? "Conectando apresentação"
                : "Projetar sua tela para os times"
      }
      onClick={() => (shareState.active ? stopShare(true) : startShare())}
    >
      <Monitor size={15} strokeWidth={1.8} aria-hidden="true" />
      {iconOnly ? (
        <span className="sr-only">
          {status === "connecting"
            ? "Conectando projeção"
            : shareState.active
              ? "Encerrar projeção"
              : "Projetar tela"}
        </span>
      ) : status === "connecting" ? (
        "Conectando..."
      ) : shareState.active ? (
        "Encerrar projeção"
      ) : (
        "Projetar tela"
      )}
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
          Apresentação ao vivo
          {screenShare.active ? <span className="help-badge">ao vivo</span> : null}
        </span>
      </div>
      <div className="screen-share-row">
        <div>
          <div className="screen-share-title">
            {screenShare.active ? "Você está apresentando sua tela" : "Projetar tela"}
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
              Encerrar apresentação
            </button>
          )}
        </div>
      </div>
      {error ? <div className="error-box top-gap-sm">{error}</div> : null}
    </div>
  );
}

function TeamScreenShareViewer({ event, screenShare, team, onDismiss }) {
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
        setError("Não foi possível assistir à transmissão ao vivo.");
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
      <button
        type="button"
        className="live-viewer-close"
        onClick={onDismiss}
        aria-label="Fechar projeção"
        title="Não quero ver a projeção agora"
      >
        <X size={18} strokeWidth={1.9} aria-hidden="true" />
      </button>
      <div className="reading-panel-header live-viewer-header">
        <div>
          <div className="reading-panel-kicker">Apresentação ao vivo</div>
          <div className="reading-panel-title">Você está assistindo a tela do facilitador</div>
          <div className="reading-panel-sub">
            Sua equipe está vendo a tela do facilitador em tempo real. A interação da missão fica pausada enquanto a apresentação estiver ativa.
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
                ? "Conectando na transmissão..."
                : status === "waiting"
                  ? "Aguardando a tela do facilitador aparecer..."
                  : status === "ended"
                    ? "A transmissão foi encerrada."
                    : "Falha ao abrir a transmissão."}
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
        <span>Apresentação iniciada em {formatDateTime(screenShare.startedAt)}</span>
      </div>
    </div>
  );
}

function RoomMapPanel({ event }) {
  const studentOptions = getEventStudentOptions(event);
  const presenceMap = event?.presenceMap || {};
  const liveStudentIds = new Set();
  const livePresenceByTeam = new globalThis.Map();

  const optionsByTeam = studentOptions.reduce((accumulator, student) => {
    const list = accumulator.get(student.teamIdx) || [];
    list.push(student);
    accumulator.set(student.teamIdx, list);
    return accumulator;
  }, new globalThis.Map());

  optionsByTeam.forEach((students, teamIdx) => {
    const presence = presenceMap?.[teamIdx];
    if (!isPresenceLive(presence)) return;
    const connectedName = normalizeStudentName(presence?.memberName || "");
    const exactMatch = students.find((student) => normalizeStudentName(student.name) === connectedName);
    const fallbackStudent = exactMatch || students[0];
    if (fallbackStudent?.id) {
      liveStudentIds.add(fallbackStudent.id);
      livePresenceByTeam.set(teamIdx, connectedName || fallbackStudent.name);
    }
  });

  return (
    <div className="room-map-sheet-body">
      <div className="room-map-sheet-event">{event?.name || "Evento"}</div>
      {!studentOptions.length ? (
        <div className="teams-empty">Ainda não há nomes disponíveis neste evento.</div>
      ) : (
        <div className="room-map-grid">
          {studentOptions.map((student) => {
            const isLive = liveStudentIds.has(student.id);
            const connectedName = livePresenceByTeam.get(student.teamIdx) || "";
            return (
              <div className={`room-map-card${isLive ? " is-live" : ""}`} key={student.id}>
                <div className="room-map-card-icon-wrap">
                  <div className="room-map-card-icon" aria-hidden="true">
                    <Monitor strokeWidth={1.6} />
                  </div>
                  <span className={`room-map-presence-dot${isLive ? " is-live" : ""}`} aria-hidden="true" />
                </div>
                <div className="room-map-card-name">{student.name}</div>
                {student.showTeamName ? <div className="room-map-card-team">{student.teamName}</div> : null}
                {isLive && connectedName ? <div className="room-map-card-live-name">Conectado: {connectedName}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TokenManagementPanel({
  event,
  selectedMissionId,
  onSelectMission,
  customLimitInput,
  onChangeCustomLimitInput,
  onSavePolicy,
}) {
  if (!event) return <div className="teams-empty">Selecione um evento para gerir os tokens.</div>;

  const missionOptions = [
    { id: TOKEN_MISSION_TRAINING_ID, name: "Treino" },
    ...(event.missions || []).map((mission) => ({ id: mission.id, name: normalizeMission(mission).name })),
  ];
  const activeMissionId = selectedMissionId || missionOptions[0]?.id || "";
  const activePolicy = getMissionTokenPolicy(event, activeMissionId, { isTraining: activeMissionId === TOKEN_MISSION_TRAINING_ID });
  const activeBaseLimit = getMissionTokenBaseLimit(activePolicy);

  return (
    <section className="fac-tools-section">
      <div className="fac-tools-head">
        <div className="fac-tools-title">Gestão de tokens</div>
        <div className="fac-tools-meta">Configuração por fluxo</div>
      </div>

      <div className="token-management-panel token-management-panel-compact">
        <div className="mini-label">Fluxos</div>
        <div className="token-mission-pill-row">
          {missionOptions.map((mission) => (
            <button
              key={mission.id}
              type="button"
              className={`choice-pill${mission.id === activeMissionId ? " active" : ""}`}
              onClick={() => onSelectMission(mission.id)}
            >
              {mission.name}
            </button>
          ))}
        </div>

        <div className="mini-label">Defina limites</div>
        <div className="token-mode-list">
          <button
            className={`token-mode-row${activePolicy.mode === TOKEN_POLICY_MODE_UNLIMITED ? " is-active" : ""}`}
            type="button"
            onClick={() => onSavePolicy(activeMissionId, { mode: TOKEN_POLICY_MODE_UNLIMITED, customLimit: 0 })}
          >
            <span className="token-mode-row-main">
              <strong>Ilimitado</strong>
              <small>Sem limite de tokens</small>
            </span>
          </button>
          <button
            className={`token-mode-row${activePolicy.mode === TOKEN_POLICY_MODE_DEFAULT ? " is-active" : ""}`}
            type="button"
            onClick={() => onSavePolicy(activeMissionId, { mode: TOKEN_POLICY_MODE_DEFAULT, customLimit: DEFAULT_MISSION_TOKEN_LIMIT })}
          >
            <span className="token-mode-row-main">
              <strong>Padrão</strong>
              <span className="token-mode-row-value">
                <b>{DEFAULT_MISSION_TOKEN_LIMIT.toLocaleString("pt-BR")}</b>
                <small>tokens</small>
              </span>
            </span>
          </button>
          <div className={`token-mode-row token-mode-row-custom${activePolicy.mode === TOKEN_POLICY_MODE_CUSTOM ? " is-active" : ""}`}>
            <div className="token-mode-row-main">
              <strong>Personalizado</strong>
            </div>
            <div className="fac-timer-input-row token-policy-custom-row">
              <div className="token-policy-custom-input-wrap">
                <input
                type="text"
                inputMode="numeric"
                min="1"
                value={customLimitInput}
                onChange={(event) => onChangeCustomLimitInput(formatTokenLimitInput(event.target.value))}
                placeholder="15000"
              />
                <span className="token-policy-custom-suffix">tokens</span>
              </div>
              <button
                className="btn btn-sm topbar-roommap-btn"
                type="button"
                onClick={() =>
                  onSavePolicy(activeMissionId, {
                    mode: TOKEN_POLICY_MODE_CUSTOM,
                    customLimit: Math.max(1, parseTokenLimitInput(customLimitInput) || DEFAULT_MISSION_TOKEN_LIMIT),
                  })
                }
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FacilitatorToolsDrawer({
  event,
  activeView,
  apiConfigured,
  announcement,
  announcementCount,
  timer,
  timerRunning,
  timerRemainingMs,
  timerNotice,
  timerMinutesInput,
  onChangeTimerMinutes,
  onChangeView,
  onClose,
  onOpenConfig,
  onOpenBroadcast,
  onStartTimer,
  onAddTimer,
  onClearTimer,
  onDismissTimerNotice,
  onPublishScreenShare,
  screenShare,
  tokenGrantTargetMissionId,
  onChangeTokenGrantTargetMissionId,
  tokenPolicyCustomInput,
  onChangeTokenPolicyCustomInput,
  onSaveMissionTokenPolicy,
}) {
  const toolCards = [
    {
      id: FACILITATOR_TOOL_VIEWS.CONFIG,
      title: "Configuração da IA",
      meta: apiConfigured ? "API ligada" : "API não configurada",
      icon: Sparkles,
    },
    {
      id: FACILITATOR_TOOL_VIEWS.BROADCAST,
      title: "Mensagem para a turma",
      meta: announcementCount ? `${announcementCount} mensagem(ns)` : "Nenhum aviso ativo",
      icon: MessageSquareText,
    },
    {
      id: FACILITATOR_TOOL_VIEWS.TIMER,
      title: "Cronômetro",
      meta: timerRunning ? formatCountdown(timerRemainingMs) : "Nenhum cronômetro ativo",
      icon: CircleAlert,
    },
    {
      id: FACILITATOR_TOOL_VIEWS.ROOM_MAP,
      title: "Mapa da sala",
      meta: event ? `${getEventStudentOptions(event).length} posições` : "Selecione um evento",
      icon: Map,
    },
    {
      id: FACILITATOR_TOOL_VIEWS.TOKENS,
      title: "Gestão de tokens",
      meta: event ? "Configurar limite por missão" : "Selecione um evento",
      icon: Coins,
    },
  ];
  const viewingMenu = activeView === FACILITATOR_TOOL_VIEWS.MENU;
  const activeCard = toolCards.find((item) => item.id === activeView);
  return (
    <div className="side-sheet-backdrop" onClick={onClose}>
      <aside className="side-sheet side-sheet-right" onClick={(ev) => ev.stopPropagation()}>
        <div className="side-sheet-header">
          <div>
            <div className="side-sheet-kicker">Facilitador</div>
            <div className="side-sheet-title">{viewingMenu ? "Ferramentas do facilitador" : activeCard?.title}</div>
          </div>
          <button className="side-sheet-close" aria-label="Fechar ferramentas do facilitador" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="side-sheet-body facilitator-tools-body">
          {viewingMenu ? (
            <div className="fac-tools-menu">
              {toolCards.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} className="fac-tool-entry" onClick={() => onChangeView(item.id)}>
                    <span className="fac-tool-entry-icon" aria-hidden="true">
                      <Icon size={18} strokeWidth={1.7} />
                    </span>
                    <span className="fac-tool-entry-copy">
                      <span className="fac-tool-entry-title">{item.title}</span>
                      <span className="fac-tool-entry-meta">{item.meta}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <button className="fac-tools-back" aria-label="Voltar para ferramentas" onClick={() => onChangeView(FACILITATOR_TOOL_VIEWS.MENU)}>
                <ArrowLeft size={16} strokeWidth={1.9} aria-hidden="true" />
              </button>

              {activeView === FACILITATOR_TOOL_VIEWS.CONFIG ? (
                <section className="fac-tools-section">
                  <div className="fac-tools-head">
                    <div className="fac-tools-title">Configuração da IA</div>
                    <div className="fac-tools-meta">{apiConfigured ? "API ligada" : "API não configurada"}</div>
                  </div>
                  <div className="fac-tools-inline-copy">
                    {apiConfigured
                      ? "A conexão com a OpenAI já está ativa para este laboratório."
                      : "Conecte a API para liberar respostas reais, análise técnica e modo coding."}
                  </div>
                  <button className={`btn btn-sm topbar-api-btn${apiConfigured ? " is-connected" : ""}`} onClick={onOpenConfig}>
                    {apiConfigured ? "Ver configuração" : "Configurar IA"}
                  </button>
                </section>
              ) : null}

              {activeView === FACILITATOR_TOOL_VIEWS.BROADCAST ? (
                <section className="fac-tools-section">
                  <div className="fac-tools-head">
                    <div className="fac-tools-title">Mensagem para a turma</div>
                    <div className="fac-tools-meta">{announcementCount ? `${announcementCount} mensagem(ns)` : "Nenhum aviso ativo"}</div>
                  </div>
                  {announcement ? <div className="fac-tools-inline-copy">{announcement.message}</div> : null}
                  <button className={`btn btn-sm topbar-roommap-btn${announcementCount ? " is-active" : ""}`} disabled={!event} onClick={onOpenBroadcast}>
                    <MessageSquareText size={14} strokeWidth={1.7} aria-hidden="true" />
                    {announcementCount ? "Nova mensagem" : "Criar mensagem"}
                  </button>
                </section>
              ) : null}

              {activeView === FACILITATOR_TOOL_VIEWS.TIMER ? (
                <section className="fac-tools-section">
                  <div className="fac-tools-head">
                    <div className="fac-tools-title">Cronômetro</div>
                    <div className="fac-tools-meta">
                      {timerRunning ? `Rodando · ${formatCountdown(timerRemainingMs)}` : "Nenhum cronômetro ativo"}
                    </div>
                  </div>
                  {timerNotice ? (
                    <div className="fac-tools-inline-copy">
                      {timerNotice.message}
                    </div>
                  ) : null}
                  <div className="fac-timer-controls">
                    <div className="fac-timer-input-row">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={timerMinutesInput}
                        onChange={(event) => onChangeTimerMinutes(event.target.value)}
                        placeholder="00:00"
                      />
                      {!timerRunning ? (
                        <button className="btn btn-sm btn-primary" disabled={!event} onClick={onStartTimer}>
                          Iniciar
                        </button>
                      ) : (
                        <button className="btn btn-sm topbar-roommap-btn" disabled={!event} onClick={() => onAddTimer()}>
                          Acrescentar
                        </button>
                      )}
                      {timerRunning ? (
                        <button className="btn btn-sm btn-ghost btn-danger" disabled={!event} onClick={onClearTimer}>
                          Encerrar
                        </button>
                      ) : null}
                    </div>
                    <div className="fac-timer-quick-row">
                      {timerNotice ? (
                        <button className="btn btn-sm topbar-roommap-btn" disabled={!event} onClick={onDismissTimerNotice}>
                          Ocultar aviso
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>
              ) : null}

              {activeView === FACILITATOR_TOOL_VIEWS.ROOM_MAP ? (
                <section className="fac-tools-section">
                  <div className="fac-tools-head">
                    <div className="fac-tools-title">Mapa da sala</div>
                    <div className="fac-tools-meta">{event ? `${getEventStudentOptions(event).length} posições` : "Selecione um evento"}</div>
                  </div>
                  {event ? <RoomMapPanel event={event} /> : <div className="teams-empty">Selecione um evento para ver quem está logado.</div>}
                </section>
              ) : null}

              {activeView === FACILITATOR_TOOL_VIEWS.TOKENS ? (
                <TokenManagementPanel
                  event={event}
                  selectedMissionId={tokenGrantTargetMissionId}
                  onSelectMission={onChangeTokenGrantTargetMissionId}
                  customLimitInput={tokenPolicyCustomInput}
                  onChangeCustomLimitInput={onChangeTokenPolicyCustomInput}
                  onSavePolicy={onSaveMissionTokenPolicy}
                />
              ) : null}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;
