import { useState } from "react";
import { BookOpen, ChevronDown, LifeBuoy, ListChecks, Users } from "lucide-react";
import { formatDateTime, formatTokenLimitLabel, formatCountdown, getReflectionTopicShortLabel, TOKEN_MISSION_TRAINING_ID } from "../../utils.js";
import { ParticipantInsightsPanel } from "./ParticipantInsightsPanel.jsx";
import { PromptQualityLabPanel } from "./PromptQualityLabPanel.jsx";
import { PROMPT_QUALITY_MODEL_2, buildParticipantDescriptor, getEventPromptQualityModel } from "./participantAnalysisUtils.js";

const TRAINING_MODE_EVENT = "training";
const DEFAULT_TOKEN_GRANT_AMOUNT = 15000;
const TRAINING_MISSION_CARD_ID = "__training_card__";

function toTimestamp(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getMissionResetAt(evento, teamIdx, missionId) {
  return evento?.missionResets?.[`${teamIdx}__${missionId}`] || null;
}

function getExecucoes(evento, teamIdx, missionId) {
  const execs = evento.execucoes?.[`${teamIdx}__${missionId}`] || [];
  const resetAt = getMissionResetAt(evento, teamIdx, missionId);
  if (!resetAt) return execs;
  return execs.filter((exec) => exec?.ts && exec.ts >= resetAt);
}

function getExecucoesRaw(evento, teamIdx, missionId) {
  return evento.execucoes?.[`${teamIdx}__${missionId}`] || [];
}

function getTrainingRuns(evento, teamIdx) {
  const runs = evento.trainingRuns?.[`${teamIdx}`] || [];
  const resetAt = getMissionResetAt(evento, teamIdx, "__training__");
  if (!resetAt) return runs;
  return runs.filter((exec) => exec?.ts && exec.ts >= resetAt);
}

function getLatestTrainingRun(evento, teamIdx) {
  const runs = getTrainingRuns(evento, teamIdx);
  if (!runs.length) return null;
  return [...runs].sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0))[0];
}

function getQuestionarioPendenteEntry(evento, teamIdx, missionId) {
  const entry = evento.questionariosPendentes?.[`${teamIdx}__${missionId}`] || null;
  if (!entry) return null;
  if (typeof entry === "object" && entry.source === "reopened") return null;
  const resetAt = getMissionResetAt(evento, teamIdx, missionId);
  const openedAt = typeof entry === "object" ? entry.openedAt : null;
  if (resetAt && openedAt && openedAt < resetAt) return null;
  return entry;
}

function getConclusaoEntry(evento, teamIdx, missionId) {
  const entry = evento.conclusoes?.[`${teamIdx}__${missionId}`] || null;
  if (!entry) return null;
  if (typeof entry === "object" && entry.source === "reopened") return null;
  const resetAt = getMissionResetAt(evento, teamIdx, missionId);
  const concludedAt = typeof entry === "object" ? (entry.closedAt || entry.concludedAt) : null;
  if (resetAt && concludedAt && concludedAt < resetAt) return null;
  return entry;
}

function isConcluida(evento, teamIdx, missionId) {
  return Boolean(getConclusaoEntry(evento, teamIdx, missionId));
}

function getQuestionarioPendenteSource(evento, teamIdx, missionId) {
  const entry = getQuestionarioPendenteEntry(evento, teamIdx, missionId);
  if (!entry) return null;
  if (typeof entry === "string") return "facilitator";
  return entry.source || "facilitator";
}

function getConclusaoSource(evento, teamIdx, missionId) {
  const entry = getConclusaoEntry(evento, teamIdx, missionId);
  if (!entry) return null;
  if (typeof entry === "string") return "legacy";
  return entry.source || "legacy";
}

function canFacilitatorReopenMissionForTeam(evento, teamIdx, missionId) {
  const closureSource = getConclusaoSource(evento, teamIdx, missionId);
  if (closureSource === "facilitator" || closureSource === "facilitator_no_evaluation") return true;
  return getQuestionarioPendenteSource(evento, teamIdx, missionId) === "facilitator";
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

function getSortedTeamEntries(evento) {
  return (evento?.teams || [])
    .map((teamItem, teamIdx) => ({ teamItem, teamIdx }))
    .sort((a, b) => (a.teamItem?.name || "").localeCompare(b.teamItem?.name || "", "pt-BR"));
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

function openParticipantInsights(event, teamIdx, onOpenParticipantAnalysis) {
  event.preventDefault();
  event.stopPropagation();
  onOpenParticipantAnalysis?.(teamIdx);
}

export function DashboardPanel({
  evento,
  dashboardView,
  setDashboardView,
  promptQualityModel,
  onRetryParticipantAnalysis,
  openConfirm,
  openDeleteConfirm,
  handleFacilitatorCloseMission,
  handleFacilitatorCloseMissionWithoutEvaluation,
  handleFacilitatorReopenMission,
  handleGrantTokens,
  handleRemoveTeam,
  handleResolveHelpRequest,
}) {
  const [participantDrawerTeamIdx, setParticipantDrawerTeamIdx] = useState(null);
  const [showAllTeamMissions, setShowAllTeamMissions] = useState(false);
  const [expandedMissionTeams, setExpandedMissionTeams] = useState({});
  const [missionTeamStatusFilters, setMissionTeamStatusFilters] = useState({});
  const handleOpenParticipantDrawer = (teamIdx) => {
    setParticipantDrawerTeamIdx(teamIdx);
    onRetryParticipantAnalysis?.(teamIdx);
  };
  const selectedParticipant =
    participantDrawerTeamIdx !== null ? buildParticipantDescriptor(evento, participantDrawerTeamIdx) : null;

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
                      <button
                        type="button"
                        className="team-admin-id team-admin-id-button"
                        onClick={(event) => openParticipantInsights(event, teamIdx, handleOpenParticipantDrawer)}
                        aria-label={`Abrir leitura pedagógica de ${teamItem.name}`}
                        title="Abrir leitura pedagógica"
                      >
                        <div className="team-avatar">{initials(teamItem.name)}</div>
                        <div>
                          <div className="team-dash-name">{teamItem.name}</div>
                        </div>
                      </button>
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
                      <button
                        type="button"
                        className="team-admin-metric team-admin-metric-action"
                        onClick={(event) => openParticipantInsights(event, teamIdx, handleOpenParticipantDrawer)}
                        aria-label={`Abrir leitura pedagógica de ${teamItem.name}`}
                        title="Abrir leitura pedagógica"
                      >
                        <span>Tokens</span>
                        <strong>{teamTokens.toLocaleString()}</strong>
                      </button>
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
                    const displayName = request.teamName || requestTeam?.name || `Time ${(request.teamIdx ?? -1) + 1}`;
                    const displayStudent = request.studentName && request.studentName !== displayName ? request.studentName : null;
                    return (
                      <div className={`help-item${isTokenRequest ? " is-token-request" : ""}`} key={request.id}>
                        <div className="help-item-header">
                          <div>
                            <div className="help-item-title">{displayName}{displayStudent ? ` · ${displayStudent}` : ""}</div>
                            <div className="help-item-meta">
                              {isTokenRequest ? "Solicitação de tokens" : "Modo treino"}
                              {request.timerRemainingMs ? ` · ⏱ ${formatCountdown(request.timerRemainingMs)}` : ""}
                              {" · "}{formatDateTime(request.createdAt)}
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
  const visibleMissions = evento.missions || [];
  const trainingMissionSummary = {
    id: TRAINING_MISSION_CARD_ID,
    name: "Treino",
    isTraining: true,
  };
  let totalTokens = 0;
  let totalCusto = 0;
  let totalConclusoes = 0;
  let totalPromptsExecutados = 0;
  evento.teams.forEach((_, teamIdx) => {
    const trainingExecs = getTrainingRuns(evento, teamIdx);
    trainingExecs.forEach((execucao) => {
      totalTokens += execucao.tokens || 0;
      totalCusto += execucao.custo || 0;
    });
    totalPromptsExecutados += trainingExecs.length;
    evento.missions.forEach((mission) => {
      const execs = getExecucoesRaw(evento, teamIdx, mission.id);
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
              {dashboardView === "team" ? (
                <button
                  className={`dashboard-expand-icon${showAllTeamMissions ? " is-open" : ""}`}
                  type="button"
                  aria-label={showAllTeamMissions ? "Recolher missões" : "Expandir missões"}
                  title={showAllTeamMissions ? "Recolher missões" : "Expandir missões"}
                  onClick={() => setShowAllTeamMissions((current) => !current)}
                >
                  <ChevronDown size={16} strokeWidth={1.8} />
                </button>
              ) : null}
            </span>
            <div className="section-actions">
              <div className="dashboard-view-controls">
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
          </div>

          {dashboardView === "team" ? (
            <div className="team-admin-grid">
      {getSortedTeamEntries(evento).map(({ teamItem, teamIdx }) => {
        let teamTokens = 0;
        let teamCusto = 0;
        let teamConc = 0;
        let missionRuns = 0;
        const trainingRuns = getTrainingRuns(evento, teamIdx);
        const trainingTokens = trainingRuns.reduce((sum, execucao) => sum + (execucao.tokens || 0), 0);
        const trainingCusto = trainingRuns.reduce((sum, execucao) => sum + (execucao.custo || 0), 0);

        evento.missions
          .map((mission) => {
            const execs = getExecucoesRaw(evento, teamIdx, mission.id);
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
        teamTokens += trainingTokens;
        teamCusto += trainingCusto;
        missionRuns += trainingRuns.length;

        const unlockedCount = evento.missions.filter((mission) => mission.unlocked).length || 1;
        const teamHelpOpenRequests = openHelpRequests.filter((request) => request.teamIdx === teamIdx);
        const teamHelpOpen = teamHelpOpenRequests.length;
        const missionProgressItems = evento.missions
          .filter((mission) => mission.unlocked)
          .map((mission) => {
            const execs = getExecucoesRaw(evento, teamIdx, mission.id);
            const currentExecs = getExecucoes(evento, teamIdx, mission.id);
            const reflection = (evento.reflexoes || {})[`${teamIdx}__${mission.id}`];
            const missionTokens = execs.reduce((sum, execucao) => sum + (execucao.tokens || 0), 0);
            const missionCusto = execs.reduce((sum, execucao) => sum + (execucao.custo || 0), 0);
            return {
              id: mission.id,
              name: mission.name,
              runs: execs.length,
              currentRuns: currentExecs.length,
              tokens: missionTokens,
              cost: missionCusto,
              concluded: Boolean(reflection),
              closureStatus: getMissionClosureStatus(evento, teamIdx, mission.id),
              reflection,
              helpOpen: teamHelpOpenRequests.filter((request) => request.missionId === mission.id).length,
              lastRunAt: execs.length ? execs[execs.length - 1].ts : null,
            };
          });
        return (
          <div className="team-admin-card" key={teamItem.name}>
            <div className="team-admin-head">
              <button
                type="button"
                className="team-admin-id team-admin-id-button"
                onClick={(event) => openParticipantInsights(event, teamIdx, handleOpenParticipantDrawer)}
                aria-label={`Abrir leitura pedagógica de ${teamItem.name}`}
                title="Abrir leitura pedagógica"
              >
                <div className="team-avatar">{initials(teamItem.name)}</div>
                <div>
                  <div className="team-dash-name">{teamItem.name}</div>
                </div>
              </button>
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
                <span>Missões concluídas</span>
                <strong>{`${teamConc}/${unlockedCount}`}</strong>
              </div>
              <button
                type="button"
                className="team-admin-metric team-admin-metric-action"
                onClick={(event) => openParticipantInsights(event, teamIdx, handleOpenParticipantDrawer)}
                aria-label={`Abrir leitura pedagógica de ${teamItem.name}`}
                title="Abrir leitura pedagógica"
              >
                <span>Prompts</span>
                <strong>{missionRuns}</strong>
              </button>
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
              {showAllTeamMissions ? (
                <div className="team-mission-section-stack">
                  <div className="team-mission-section">
                    <div className="team-mission-section-head">
                      <span className="mini-label team-mission-section-label">
                        <BookOpen size={16} strokeWidth={1.6} aria-hidden="true" />
                        <span>Treino</span>
                      </span>
                    </div>
                    <div className="team-mission-list">
                      <div className="team-mission-row">
                        <div className="team-mission-main">
                          <div className="team-mission-copy">
                            <div className="team-mission-title-row">
                              <div className="team-mission-name">Modo treino</div>
                            </div>
                            <div className="team-admin-metrics team-mission-metrics">
                              <div className="team-admin-metric team-mission-metric">
                                <span>Status</span>
                                <strong>
                                  <span className={`team-mission-status-chip${trainingRuns.length ? " is-active" : " is-pending"}`}>
                                    {trainingRuns.length ? "utilizou" : "não utilizou"}
                                  </span>
                                </strong>
                              </div>
                              <div className="team-admin-metric team-mission-metric">
                                <span>Prompts</span>
                                <strong>{trainingRuns.length}</strong>
                              </div>
                              <div className="team-admin-metric team-mission-metric">
                                <span>Tokens</span>
                                <strong>{trainingTokens.toLocaleString()}</strong>
                              </div>
                              <div className="team-admin-metric team-mission-metric">
                                <span>Custo</span>
                                <strong>${trainingCusto.toFixed(4)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {missionProgressItems.length ? (
                    <div className="team-mission-section">
                      <div className="team-mission-section-head">
                        <span className="mini-label team-mission-section-label">
                          <ListChecks size={16} strokeWidth={1.6} aria-hidden="true" />
                          <span>Missões do evento</span>
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
                              <div className="team-admin-metrics team-mission-metrics">
                                <div className="team-admin-metric team-mission-metric">
                                  <span>Status</span>
                                  <strong>
                                    <span
                                      className={`team-mission-status-chip${
                                        missionItem.closureStatus === "concluida"
                                          ? " is-complete"
                                          : missionItem.currentRuns || missionItem.closureStatus === "aguardando_questionario"
                                            ? " is-active"
                                            : " is-pending"
                                      }`}
                                    >
                                      {missionItem.closureStatus === "concluida"
                                        ? "finalizou"
                                        : missionItem.currentRuns || missionItem.closureStatus === "aguardando_questionario"
                                          ? "em andamento"
                                          : "não iniciou"}
                                    </span>
                                  </strong>
                                </div>
                                <div className="team-admin-metric team-mission-metric">
                                  <span>Prompts</span>
                                  <strong>{missionItem.runs}</strong>
                                </div>
                                <div className="team-admin-metric team-mission-metric">
                                  <span>Tokens</span>
                                  <strong>{missionItem.tokens.toLocaleString()}</strong>
                                </div>
                                <div className="team-admin-metric team-mission-metric">
                                  <span>Custo</span>
                                  <strong>${missionItem.cost.toFixed(4)}</strong>
                                </div>
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
              ) : null}
            </div>
          </div>
        );
      })}
            </div>
          ) : (
            <div className="mission-admin-grid">
              {[trainingMissionSummary, ...visibleMissions].map((mission, missionIndex) => {
                let missionTokens = 0;
                let missionCusto = 0;
                let missionRuns = 0;
                let missionConcluded = 0;
                const isTrainingCard = mission.id === TRAINING_MISSION_CARD_ID;
                const isMissionExpanded = Boolean(expandedMissionTeams[mission.id]);
                const missionHelpOpen = isTrainingCard
                  ? [...getTrainingHelpRequests(evento), ...getTrainingTokenRequests(evento)].filter((request) => request.status === "open").length
                  : openHelpRequests.filter((request) => request.missionId === mission.id).length;
                const missionHasOpenTeams = isTrainingCard
                  ? false
                  : evento.teams.some((_, teamIdx) => getMissionClosureStatus(evento, teamIdx, mission.id) === "aberta");
                const missionHasReopenableTeams = isTrainingCard
                  ? false
                  : evento.teams.some((_, teamIdx) => canFacilitatorReopenMissionForTeam(evento, teamIdx, mission.id));
                const missionStatusFilter = missionTeamStatusFilters[mission.id] || "all";

                const teamRows = getSortedTeamEntries(evento).map(({ teamItem, teamIdx }) => {
                  const execs = isTrainingCard ? getTrainingRuns(evento, teamIdx) : getExecucoesRaw(evento, teamIdx, mission.id);
                  const currentExecs = isTrainingCard ? getTrainingRuns(evento, teamIdx) : getExecucoes(evento, teamIdx, mission.id);
                  const reflection = isTrainingCard ? null : (evento.reflexoes || {})[`${teamIdx}__${mission.id}`];
                  const closureStatus = isTrainingCard ? "treino" : getMissionClosureStatus(evento, teamIdx, mission.id);
                  const helpOpen = isTrainingCard
                    ? [...getTrainingHelpRequests(evento, teamIdx), ...getTrainingTokenRequests(evento, teamIdx)].filter((request) => request.status === "open").length
                    : openHelpRequests.filter((request) => request.teamIdx === teamIdx && request.missionId === mission.id).length;
                  const teamTokens = execs.reduce((sum, execucao) => sum + (execucao.tokens || 0), 0);
                  const teamCusto = execs.reduce((sum, execucao) => sum + (execucao.custo || 0), 0);
                  missionTokens += teamTokens;
                  missionCusto += teamCusto;
                  missionRuns += execs.length;
                  if (isTrainingCard ? execs.length > 0 : reflection) missionConcluded += 1;
                  return {
                    teamName: teamItem.name,
                    reflection,
                    closureStatus,
                    statusKey:
                      isTrainingCard
                        ? (execs.length ? "active" : "pending")
                        : closureStatus === "concluida"
                        ? "complete"
                        : currentExecs.length || closureStatus === "aguardando_questionario"
                          ? "active"
                          : "pending",
                    helpOpen,
                    runs: execs.length,
                    currentRuns: currentExecs.length,
                    tokens: teamTokens,
                    cost: teamCusto,
                  };
                });
                const filteredTeamRows =
                  missionStatusFilter === "all"
                    ? teamRows
                    : teamRows.filter((teamRow) => teamRow.statusKey === missionStatusFilter);

                return (
                  <div className="mission-admin-card" key={mission.id}>
                    <div className="mission-admin-head">
                      <div>
                        <div className="mission-admin-title">
                          {isTrainingCard ? "Treino" : `${missionIndex}. ${mission.name}`}
                        </div>
                        <div className="mission-admin-sub">
                          {missionConcluded}/{evento.teams.length} {isTrainingCard ? "times utilizaram" : mission.unlocked ? "times concluíram" : "missão ainda não liberada"}
                        </div>
                      </div>
                      {missionHelpOpen ? (
                        <span className="team-help-indicator is-alert" title={`${missionHelpOpen} pedidos de ajuda abertos nesta missão`}>
                          <span className="team-help-indicator-icon">!</span>
                          <span className="team-help-indicator-count">{missionHelpOpen}</span>
                        </span>
                      ) : null}
                      {!isTrainingCard ? (
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
                            disabled={!mission.unlocked || (!missionHasOpenTeams && !missionHasReopenableTeams)}
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
                            disabled={!mission.unlocked || !missionHasOpenTeams}
                          >
                            Encerrar sem avaliação
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className="mission-admin-inline-control">
                      <button
                        className={`dashboard-expand-icon${
                          isMissionExpanded ? " is-open" : ""
                        }`}
                        type="button"
                        aria-label={isMissionExpanded ? "Recolher times" : "Expandir times"}
                        title={isMissionExpanded ? "Recolher times" : "Expandir times"}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          const nextExpanded = !isMissionExpanded;
                          setExpandedMissionTeams((current) => ({
                            ...current,
                            [mission.id]: nextExpanded,
                          }));
                          if (nextExpanded) {
                            setMissionTeamStatusFilters((current) => ({
                              ...current,
                              [mission.id]: "all",
                            }));
                          }
                        }}
                      >
                        <ChevronDown size={16} strokeWidth={1.8} />
                      </button>
                      {isMissionExpanded ? (
                        <div className="dashboard-status-filters mission-status-filters" aria-label="Filtrar times desta missão por status">
                          <button
                            type="button"
                            className={`dashboard-status-filter${missionStatusFilter === "complete" ? " is-active" : ""} is-complete`}
                            aria-pressed={missionStatusFilter === "complete"}
                            onClick={() =>
                              setMissionTeamStatusFilters((current) => ({
                                ...current,
                                [mission.id]: current[mission.id] === "complete" ? "all" : "complete",
                              }))
                            }
                            aria-label="Mostrar times que finalizaram esta missão"
                            title="Finalizou"
                          />
                          <button
                            type="button"
                            className={`dashboard-status-filter${missionStatusFilter === "active" ? " is-active" : ""} is-active-state`}
                            aria-pressed={missionStatusFilter === "active"}
                            onClick={() =>
                              setMissionTeamStatusFilters((current) => ({
                                ...current,
                                [mission.id]: current[mission.id] === "active" ? "all" : "active",
                              }))
                            }
                            aria-label="Mostrar times em andamento nesta missão"
                            title="Em andamento"
                          />
                          <button
                            type="button"
                            className={`dashboard-status-filter${missionStatusFilter === "pending" ? " is-active" : ""} is-pending`}
                            aria-pressed={missionStatusFilter === "pending"}
                            onClick={() =>
                              setMissionTeamStatusFilters((current) => ({
                                ...current,
                                [mission.id]: current[mission.id] === "pending" ? "all" : "pending",
                              }))
                            }
                            aria-label="Mostrar times que não começaram esta missão"
                            title="Não começou"
                          />
                        </div>
                      ) : null}
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
                        <span>{isTrainingCard ? "Times que utilizaram" : "Times que concluíram"}</span>
                        <strong>{`${missionConcluded}/${evento.teams.length}`}</strong>
                      </div>
                      <div className="team-admin-metric">
                        <span>Tokens</span>
                        <strong>{missionTokens.toLocaleString()}</strong>
                      </div>
                    </div>
                    {isMissionExpanded ? (
                      <div className="mission-team-list">
                        {filteredTeamRows.map((teamRow) => (
                          <div className="mission-team-row" key={`${mission.id}-${teamRow.teamName}`}>
                            <div className="mission-team-main">
                              <div className="mission-team-top">
                                <div className="mission-team-identity">
                                  <div className="team-avatar mission-team-avatar">{initials(teamRow.teamName)}</div>
                                  <div className="mission-team-name">{teamRow.teamName}</div>
                                  {teamRow.helpOpen ? (
                                    <span className="team-help-indicator is-alert" title={`${teamRow.helpOpen} pedidos de ajuda abertos nesta missão`}>
                                      <span className="team-help-indicator-icon">!</span>
                                      <span className="team-help-indicator-count">{teamRow.helpOpen}</span>
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="team-admin-metrics mission-team-metrics">
                                <div className="team-admin-metric mission-team-metric">
                                  <span>Status</span>
                                  <strong>
                                    <span
                                      className={`team-mission-status-chip${
                                        isTrainingCard
                                          ? teamRow.runs
                                            ? " is-active"
                                            : " is-pending"
                                          : teamRow.closureStatus === "concluida"
                                          ? " is-complete"
                                          : teamRow.currentRuns || teamRow.closureStatus === "aguardando_questionario"
                                            ? " is-active"
                                            : " is-pending"
                                      }`}
                                    >
                                      {isTrainingCard
                                        ? teamRow.runs
                                          ? "utilizou"
                                          : "não utilizou"
                                        : teamRow.closureStatus === "concluida"
                                          ? "finalizou"
                                          : teamRow.currentRuns || teamRow.closureStatus === "aguardando_questionario"
                                            ? "em andamento"
                                            : "não iniciou"}
                                    </span>
                                  </strong>
                                </div>
                                <div className="team-admin-metric mission-team-metric">
                                  <span>Prompts</span>
                                  <strong>{teamRow.runs}</strong>
                                </div>
                                <div className="team-admin-metric mission-team-metric">
                                  <span>Tokens</span>
                                  <strong>{teamRow.tokens.toLocaleString()}</strong>
                                </div>
                                <div className="team-admin-metric mission-team-metric">
                                  <span>Custo</span>
                                  <strong>${teamRow.cost.toFixed(4)}</strong>
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
                    ) : null}
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
                  const displayName = request.teamName || requestTeam?.name || `Time ${(request.teamIdx ?? -1) + 1}`;
                  const displayStudent = request.studentName && request.studentName !== displayName ? request.studentName : null;
                  return (
                    <div className={`help-item${isTokenRequest ? " is-token-request" : ""}`} key={request.id}>
                      <div className="help-item-header">
                        <div>
                          <div className="help-item-title">{displayName}{displayStudent ? ` · ${displayStudent}` : ""}</div>
                          <div className="help-item-meta">
                            {requestMission?.name || (request.missionId === TOKEN_MISSION_TRAINING_ID ? "Modo treino" : request.missionId)}
                            {request.timerRemainingMs ? ` · ⏱ ${formatCountdown(request.timerRemainingMs)}` : ""}
                            {" · "}{formatDateTime(request.createdAt)}
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

      {participantDrawerTeamIdx !== null ? (
        <div className="side-sheet-backdrop" onClick={() => setParticipantDrawerTeamIdx(null)}>
          <aside
            className={`side-sheet side-sheet-right ${getEventPromptQualityModel(evento) === PROMPT_QUALITY_MODEL_2 ? "prompt-quality-lab-drawer" : "participant-insights-drawer"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="side-sheet-body participant-insights-drawer-body">
              {promptQualityModel === PROMPT_QUALITY_MODEL_2 ? (
                <PromptQualityLabPanel
                  evento={evento}
                  participant={selectedParticipant}
                  onClose={() => setParticipantDrawerTeamIdx(null)}
                  onSelectParticipant={(teamIdx) => setParticipantDrawerTeamIdx(teamIdx)}
                  onRetryParticipantAnalysis={onRetryParticipantAnalysis}
                />
              ) : (
                <ParticipantInsightsPanel
                  evento={evento}
                  participant={selectedParticipant}
                  compact
                  onClose={() => setParticipantDrawerTeamIdx(null)}
                  onRetryParticipantAnalysis={onRetryParticipantAnalysis}
                />
              )}
            </div>
          </aside>
        </div>
      ) : null}

    </>
  );
}
