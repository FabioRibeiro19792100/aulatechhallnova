export const ANAMNESIS_UNKNOWN_VALUE = "__unknown__";

export const ANAMNESIS_SECTIONS = [
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

export const ANAMNESIS_QUESTIONS = [
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

export const ANAMNESIS_STOPWORDS = new Set([
  "a","as","o","os","de","da","do","das","dos","e","em","para","por","com","sem","um","uma","uns","umas","na","no","nas","nos","que","se","ao","aos","à","às","ou","mais","menos","muito","muita","muitos","muitas","já","ainda","como","sobre","ser","estar","ter","há","hoje","amanhã","entre","pela","pelo","pelas","pelos","isso","essa","esse","esta","este","meu","minha","seu","sua","nosso","nossa","quer","quero","nada","algo",
]);

export function isAnamnesisEnabled(evento) {
  return Boolean(evento?.anamnesisEnabled);
}

export function getAnamnesisResponse(evento, teamIdx) {
  if (!evento || teamIdx === null || teamIdx === undefined) return null;
  return evento.anamnesisResponses?.[teamIdx] || null;
}

export function hasCompletedAnamnesis(evento, teamIdx) {
  return Boolean(getAnamnesisResponse(evento, teamIdx)?.submittedAt);
}

export function getAnamnesisAnswerChoice(question, value) {
  if (question.optionalText) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value.choice;
    }
    return undefined;
  }
  return value;
}

export function getAnamnesisAnswerNote(question, value) {
  if (!question.optionalText) return "";
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return normalizeAnamnesisText(value.note || "");
  }
  return typeof value === "string" ? normalizeAnamnesisText(value) : "";
}

export function isAnamnesisUnknownChoice(choice) {
  if (Array.isArray(choice)) return choice.includes(ANAMNESIS_UNKNOWN_VALUE);
  return choice === ANAMNESIS_UNKNOWN_VALUE;
}

export function isAnamnesisAnswerFilled(question, value) {
  const note = getAnamnesisAnswerNote(question, value);
  const choice = getAnamnesisAnswerChoice(question, value);
  if (question.type === "text") return Boolean(note);
  if (question.type === "multi") return (Array.isArray(choice) && choice.length > 0) || Boolean(note);
  return (choice !== null && choice !== undefined && choice !== "") || Boolean(note);
}

export function countAnsweredAnamnesisQuestions(answers = {}) {
  return ANAMNESIS_QUESTIONS.filter((question) => isAnamnesisAnswerFilled(question, answers[question.id])).length;
}

export function normalizeAnamnesisText(value = "") {
  return `${value || ""}`.replace(/\s+/g, " ").trim();
}

export function normalizeAnamnesisAnswer(question, value) {
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

export function getAnamnesisQuestionResults(evento, question) {
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

export function extractAnamnesisKeywords(texts = [], limit = 8) {
  const counter = new globalThis.Map();
  texts.forEach((text) => {
    normalizeAnamnesisText(text)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
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
