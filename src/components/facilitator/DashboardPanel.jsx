import { BookOpen, LifeBuoy, ListChecks, Users } from "lucide-react";
import { formatDateTime, formatTokenLimitLabel, getReflectionTopicShortLabel, TOKEN_MISSION_TRAINING_ID } from "../../utils.js";

const TRAINING_MODE_EVENT = "training";
const DEFAULT_TOKEN_GRANT_AMOUNT = 15000;

function toTimestamp(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getExecucoes(evento, teamIdx, missionId) {
  return evento.execucoes?.[`${teamIdx}__${missionId}`] || [];
}

function getTrainingRuns(evento, teamIdx) {
  return evento.trainingRuns?.[`${teamIdx}`] || [];
}

function getLatestTrainingRun(evento, teamIdx) {
  const runs = getTrainingRuns(evento, teamIdx);
  if (!runs.length) return null;
  return [...runs].sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0))[0];
}

function getQuestionarioPendenteEntry(evento, teamIdx, missionId) {
  return evento.questionariosPendentes?.[`${teamIdx}__${missionId}`] || null;
}

function getConclusaoEntry(evento, teamIdx, missionId) {
  return evento.conclusoes?.[`${teamIdx}__${missionId}`] || null;
}

function isConcluida(evento, teamIdx, missionId) {
  return Boolean(getConclusaoEntry(evento, teamIdx, missionId));
}

function canFacilitatorReopenMissionForTeam(evento, teamIdx, missionId) {
  return isConcluida(evento, teamIdx, missionId);
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

function getMissionClosureStatus(evento, teamIdx, missionId) {
  if (isConcluida(evento, teamIdx, missionId)) return "concluida";
  if (isQuestionarioPendente(evento, teamIdx, missionId)) return "aguardando_questionario";
  return "aberta";
}

function getEventMode(evento) {
  return evento?.eventMode || "missions";
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

function getOpenHelpRequests(evento) {
  return getEventMode(evento) === TRAINING_MODE_EVENT
    ? [...getTrainingHelpRequests(evento), ...getTrainingTokenRequests(evento)].filter((request) => request.status === "open")
    : (evento.helpRequests || []).filter((request) => request.status === "open");
}

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function truncatePromptSnippet(text, max = 140) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Sem prompt registrado.";
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}...`;
}

export function DashboardPanel({
  evento,
  dashboardView,
  setDashboardView,
  openConfirm,
  openDeleteConfirm,
  handleFacilitatorCloseMission,
  handleFacilitatorCloseMissionWithoutEvaluation,
  handleFacilitatorReopenMission,
  handleGrantTokens,
  handleRemoveTeam,
  handleResolveHelpRequest,
}) {
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
                          <div className="muted-body training-latest-prompt">"{truncatePromptSnippet(latestRun.input, 180)}"</div>
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
                                  amount: DEFAULT_TOKEN_GRANT_AMOUNT,
                                  source: "queue",
                                })
                              }
                            >
                              Liberar +{DEFAULT_TOKEN_GRANT_AMOUNT.toLocaleString("pt-BR")}
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
                                  amount: DEFAULT_TOKEN_GRANT_AMOUNT,
                                  source: "queue",
                                })
                              }
                            >
                              Liberar +{DEFAULT_TOKEN_GRANT_AMOUNT.toLocaleString("pt-BR")}
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
