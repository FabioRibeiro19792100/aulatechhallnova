import { FileText } from "lucide-react";
import {
  ANAMNESIS_QUESTIONS,
  isAnamnesisEnabled,
  getAnamnesisQuestionResults,
  extractAnamnesisKeywords,
} from "../../data/anamnesis.js";

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
