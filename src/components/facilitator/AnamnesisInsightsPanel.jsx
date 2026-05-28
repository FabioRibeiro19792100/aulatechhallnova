import { FileText } from "lucide-react";

const ANAMNESIS_UNKNOWN_VALUE = "__unknown__";

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

function isAnamnesisEnabled(evento) {
  return Boolean(evento?.anamnesisEnabled);
}

function getAnamnesisResponse(evento, teamIdx) {
  if (!evento || teamIdx === null || teamIdx === undefined) return null;
  return evento.anamnesisResponses?.[teamIdx] || null;
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

function normalizeAnamnesisText(value = "") {
  return `${value || ""}`.replace(/\s+/g, " ").trim();
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

export function AnamnesisInsightsPanel({ evento }) {
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
