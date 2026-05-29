import { BookOpen } from "lucide-react";
import {
  CHAT_AI_MODE, CODING_AI_MODE, PERGUNTAS_REFLEXAO, TECHNICAL_FEEDBACK_REASONS,
  getMissionAiMode, getReflectionTopicShortLabel, formatDateTime,
} from "../../utils.js";
import { AI_MODE_LABELS } from "../../data/missions.js";

const TRAINING_MODE_EVENT = "training";

function getExecucoes(evento, teamIdx, missionId) {
  return (evento?.execucoes?.[`${teamIdx}__${missionId}`] || []);
}

function getQuestionarioPendenteEntry(evento, teamIdx, missionId) {
  return (evento?.questionariosPendentes || []).find((item) => item.teamIdx === teamIdx && item.missionId === missionId) || null;
}

function getConclusaoEntry(evento, teamIdx, missionId) {
  return (evento?.conclusoes || []).find((item) => item.teamIdx === teamIdx && item.missionId === missionId) || null;
}

function isConcluida(evento, teamIdx, missionId) {
  return Boolean(getConclusaoEntry(evento, teamIdx, missionId));
}

function canFacilitatorReopenMissionForTeam(evento, teamIdx, missionId) {
  return getConclusaoEntry(evento, teamIdx, missionId)?.closedBy === "facilitador";
}

function isQuestionarioPendente(evento, teamIdx, missionId) {
  const entry = getQuestionarioPendenteEntry(evento, teamIdx, missionId);
  if (!entry) return false;
  if (isConcluida(evento, teamIdx, missionId)) return false;
  return true;
}

function getMissionClosureStatus(evento, teamIdx, missionId) {
  if (isConcluida(evento, teamIdx, missionId)) return "concluida";
  if (isQuestionarioPendente(evento, teamIdx, missionId)) return "aguardando_questionario";
  return "aberta";
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

function getEventMode(evento) {
  return evento?.eventMode || "missions";
}

function getTrainingHelpRequests(evento, teamIdx = null) {
  return (evento.trainingHelpRequests || []).filter((request) => teamIdx === null || request.teamIdx === teamIdx);
}

function getTrainingTokenRequests(evento, teamIdx = null) {
  return (evento.helpRequests || []).filter(
    (request) => (teamIdx === null || request.teamIdx === teamIdx) && request.type === "tokens",
  );
}

function getOpenHelpRequests(evento) {
  return getEventMode(evento) === TRAINING_MODE_EVENT
    ? [...getTrainingHelpRequests(evento), ...getTrainingTokenRequests(evento)].filter((request) => request.status === "open")
    : (evento.helpRequests || []).filter((request) => request.status === "open");
}

function getMissionReflections(evento, missionId) {
  return Object.entries(evento.reflexoes || {})
    .map(([key, entry]) => ({ ...entry, key }))
    .filter((entry) => entry?.missionId === missionId || `${entry?.key || ""}`.endsWith(`__${missionId}`))
    .sort((a, b) => new Date(b.submittedAt || b.ts || 0) - new Date(a.submittedAt || a.ts || 0));
}

function getMissionTechnicalFeedbackEntries(evento, missionId) {
  if (!evento?.teams?.length || !missionId) return [];
  return evento.teams
    .flatMap((teamItem, teamIdx) =>
      getExecucoes(evento, teamIdx, missionId)
        .filter((exec) => exec?.technicalFeedback?.rating)
        .map((exec) => ({
          ...exec.technicalFeedback,
          teamIdx,
          teamName: teamItem?.name || `Time ${teamIdx + 1}`,
          execId: exec.id,
          execTs: exec.ts,
          iterationNumber: exec.iterationNumber || null,
          prompt: exec.input || "",
        })),
    )
    .sort((a, b) => new Date(b.submittedAt || b.execTs || 0) - new Date(a.submittedAt || a.execTs || 0));
}

function truncatePromptSnippet(text, max = 140) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Sem prompt registrado.";
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}...`;
}

export function MissionsPanel({
  evento,
  eventMode,
  missionFeedbackOpen,
  missionTeamRowsOpen,
  missionMenuOpen,
  setMissionFeedbackOpen,
  setMissionTeamRowsOpen,
  setMissionMenuOpen,
  openConfirm,
  handleToggleMission,
  handleMissionAiModeChange,
  handleFacilitatorCloseMission,
  handleFacilitatorReopenMission,
  handleFacilitatorCloseMissionWithoutEvaluation,
}) {
  if (eventMode === TRAINING_MODE_EVENT) {
    return (
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
    );
  }

  return (
    <>
      <div className="section-header">
        <span className="section-title">{evento.missions.length} missões</span>
        <span className="section-helper-text">Fluxo fixo com Análise geral e Programação.</span>
      </div>
      {!evento.missions.length ? (
        <div className="teams-empty">Nenhuma missão.</div>
      ) : (
        <div className="mission-simple-list">
          {evento.missions.map((mission, index) => {
            const missionAiMode = getMissionAiMode(mission);
            const reflections = getMissionReflections(evento, mission.id);
            const technicalFeedbackEntries = getMissionTechnicalFeedbackEntries(evento, mission.id);
            const feedbackKey = `${evento.id}__${mission.id}`;
            const feedbackOpen = Boolean(missionFeedbackOpen[feedbackKey]);
            const missionHasOpenTeams = evento.teams.some((_, teamIdx) => getMissionClosureStatus(evento, teamIdx, mission.id) === "aberta");
            const missionHasReopenableTeams = evento.teams.some((_, teamIdx) => canFacilitatorReopenMissionForTeam(evento, teamIdx, mission.id));
            const teamRowsOpen = Boolean(missionTeamRowsOpen[feedbackKey]);
            const teamRows = evento.teams.map((teamItem, teamIdx) => {
              const execs = getExecucoes(evento, teamIdx, mission.id);
              const latestExec = execs[execs.length - 1] || null;
              const reflection = (evento.reflexoes || {})[`${teamIdx}__${mission.id}`];
              const closureStatus = getMissionClosureStatus(evento, teamIdx, mission.id);
              const helpOpen = getOpenHelpRequests(evento).filter(
                (request) => request.teamIdx === teamIdx && request.missionId === mission.id,
              ).length;
              const preservedUsage = getPreservedMissionUsage(evento, teamIdx, mission.id);
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
            const technicalHelpfulCount = technicalFeedbackEntries.filter((item) => item.rating === "up").length;
            const technicalUnhelpfulCount = technicalFeedbackEntries.filter((item) => item.rating === "down").length;
            const technicalReasonCounts = TECHNICAL_FEEDBACK_REASONS.map((reason) => ({
              reason,
              count: technicalFeedbackEntries.filter((item) => item.rating === "down" && item.reason === reason).length,
            })).filter((item) => item.count > 0);
            const hasAnyMissionFeedback = reflections.length || technicalFeedbackEntries.length;

            return (
              <div className="mission-row-wrap" key={`${mission.id}-${index}`}>
                <div className="mission-row">
                  <div className="mission-main">
                    <div className="mission-row-header">
                      <span className="mission-num">{mission.num || ""}</span>
                      <button
                        className={`mission-toggle mission-toggle-inline${mission.unlocked ? " is-on" : ""}`}
                        onClick={() => handleToggleMission(evento.id, index, !mission.unlocked)}
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
                          onChange={(event) => handleMissionAiModeChange(evento.id, index, event.target.value)}
                        >
                          <option value={CHAT_AI_MODE}>{AI_MODE_LABELS[CHAT_AI_MODE]}</option>
                          <option value={CODING_AI_MODE}>{AI_MODE_LABELS[CODING_AI_MODE]}</option>
                        </select>
                      </label>
                    </div>
                    {mission.desc ? <div className="mdesc">{mission.desc}</div> : null}
                    <div className="mission-inline-stats">
                      <span>{reflections.length} feedback(s)</span>
                      <span>{technicalFeedbackEntries.length} feedback(s) da explicação</span>
                      <span>
                        {evento.teams.filter((_, teamIdx) => isConcluida(evento, teamIdx, mission.id)).length} time(s) concluíram
                      </span>
                    </div>
                    {hasAnyMissionFeedback ? (
                      <div className="mission-feedback-list">
                        {reflections.length ? (
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
                          </div>
                        ) : null}
                        {technicalFeedbackEntries.length ? (
                          <div className="mission-feedback-card is-summary">
                            <div className="mission-feedback-head">
                              <div>
                                <div className="mission-feedback-team">Feedback da explicação técnica</div>
                                <div className="mission-feedback-meta">{technicalFeedbackEntries.length} retorno(s) coletados</div>
                              </div>
                            </div>
                            <div className="mission-feedback-scores is-inline">
                              <span className="mission-feedback-chip is-rating">
                                <strong>Útil</strong>
                                <span className="mission-feedback-score">{technicalHelpfulCount}</span>
                              </span>
                              <span className="mission-feedback-chip is-rating">
                                <strong>Não útil</strong>
                                <span className="mission-feedback-score">{technicalUnhelpfulCount}</span>
                              </span>
                            </div>
                            {technicalReasonCounts.length ? (
                              <div className="mission-feedback-scores is-detailed">
                                {technicalReasonCounts.map((item) => (
                                  <div className="team-admin-feedback-topic" key={item.reason}>
                                    <span className="team-admin-feedback-topic-label">{item.reason}</span>
                                    <span className="mission-feedback-score">{item.count}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
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
                        {feedbackOpen
                          ? reflections.map((reflection) => (
                              <div className="mission-feedback-card" key={`${reflection.teamIdx}-${reflection.submittedAt || reflection.ts}`}>
                                <div className="mission-feedback-head">
                                  <div className="mission-feedback-team">{evento.teams[reflection.teamIdx]?.name || `Time ${reflection.teamIdx + 1}`}</div>
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
                        {feedbackOpen
                          ? technicalFeedbackEntries.map((entry) => (
                              <div className="mission-feedback-card" key={`tech-${entry.teamIdx}-${entry.execId}`}>
                                <div className="mission-feedback-head">
                                  <div className="mission-feedback-team">{entry.teamName}</div>
                                  <div className="mission-feedback-meta">{formatDateTime(entry.submittedAt || entry.execTs)}</div>
                                </div>
                                <div className="mission-feedback-scores is-inline">
                                  <span className="mission-feedback-chip is-rating">
                                    <strong>Leitura</strong>
                                    <span className="mission-feedback-score">{entry.rating === "up" ? "Útil" : "Não útil"}</span>
                                  </span>
                                  {entry.reason ? (
                                    <span className="mission-feedback-chip is-rating">
                                      <strong>Motivo</strong>
                                      <span className="mission-feedback-score">{entry.reason}</span>
                                    </span>
                                  ) : null}
                                </div>
                                {entry.comment ? <div className="mission-feedback-comment">{entry.comment}</div> : null}
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
                                    <div className="mission-team-latest-copy">"{truncatePromptSnippet(teamRow.latestExec.input, 180)}"</div>
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
                                () => handleFacilitatorCloseMissionWithoutEvaluation(evento.id, mission.id),
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
  );
}
