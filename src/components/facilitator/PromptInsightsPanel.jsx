import { MessageSquareText } from "lucide-react";
import { TRAINING_THREAD_ID } from "../../utils.js";
import {
  MIN_PARTICIPANT_ANALYSIS_PROMPTS,
  getAllParticipantDescriptors,
} from "./participantAnalysisUtils.js";

function getAnalysisStatus(participant) {
  const entry = participant?.analysisEntry;
  if (!participant?.history?.length) return "empty";
  if (!participant.isEligibleForAnalysis) return "minimum";
  if (!entry) return "pending";
  if (entry.historySignature !== participant.historySignature) return "pending";
  if (entry.status === "ready" && entry.analysis) return "ready";
  if (entry.status === "unavailable") return "unavailable";
  return "pending";
}

function getTrainingPromptCount(history = []) {
  return history.filter((item) => item?.missionId === TRAINING_THREAD_ID).length;
}

function getMissionPromptCount(history = []) {
  return history.filter((item) => item?.missionId !== TRAINING_THREAD_ID).length;
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(4)}`;
}

function getInitials(name = "") {
  return `${name || ""}`
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "--";
}

function buildClassroomOverview(participants) {
  return participants.reduce(
    (acc, participant) => {
      const history = participant.history || [];
      acc.people += 1;
      acc.prompts += history.length;
      acc.trainingPrompts += getTrainingPromptCount(history);
      acc.missionPrompts += getMissionPromptCount(history);
      acc.tokens += history.reduce((sum, item) => sum + (item.tokens || 0), 0);
      acc.cost += history.reduce((sum, item) => sum + (item.custo || 0), 0);
      return acc;
    },
    {
      prompts: 0,
      trainingPrompts: 0,
      missionPrompts: 0,
      tokens: 0,
      cost: 0,
    },
  );
}

export function PromptInsightsPanel({ evento, onOpenParticipant }) {
  const participants = getAllParticipantDescriptors(evento);

  if (!participants.length) {
    return <div className="teams-empty">Nenhum histórico de prompts disponível ainda.</div>;
  }

  const overview = buildClassroomOverview(participants);

  return (
    <div className="prompt-insights-shell">
      <div className="section-header">
        <span className="section-title section-title-with-icon">
          <span className="section-title-icon" aria-hidden="true">
            <MessageSquareText size={16} strokeWidth={1.6} />
          </span>
          <span>Qualidade dos prompts</span>
        </span>
        <span className="muted-mini">{participants.length} pessoa(s)</span>
      </div>

      <div className="prompt-insights-summary-strip">
        <div className="prompt-insights-summary-item">
          <span className="prompt-insights-summary-label">Prompts totais</span>
          <strong className="prompt-insights-summary-value">{overview.prompts}</strong>
        </div>
        <div className="prompt-insights-summary-item">
          <span className="prompt-insights-summary-label">Prompts de treino</span>
          <strong className="prompt-insights-summary-value">{overview.trainingPrompts}</strong>
        </div>
        <div className="prompt-insights-summary-item">
          <span className="prompt-insights-summary-label">Prompts missão</span>
          <strong className="prompt-insights-summary-value">{overview.missionPrompts}</strong>
        </div>
        <div className="prompt-insights-summary-item">
          <span className="prompt-insights-summary-label">Tokens</span>
          <strong className="prompt-insights-summary-value">{overview.tokens.toLocaleString("pt-BR")}</strong>
        </div>
        <div className="prompt-insights-summary-item">
          <span className="prompt-insights-summary-label">Custo</span>
          <strong className="prompt-insights-summary-value">{formatCurrency(overview.cost)}</strong>
        </div>
      </div>

      <div className="prompt-participant-list">
        {participants.map((participant) => {
          const history = participant.history || [];
          const trainingCount = getTrainingPromptCount(history);
          const missionCount = getMissionPromptCount(history);
          const tokens = history.reduce((sum, item) => sum + (item.tokens || 0), 0);
          const cost = history.reduce((sum, item) => sum + (item.custo || 0), 0);
          const showTeamName = participant.teamName && participant.teamName !== participant.displayName;
          const canOpenAnalysis = history.length >= MIN_PARTICIPANT_ANALYSIS_PROMPTS;

          return (
            <article className="prompt-participant-card" key={participant.analysisKey}>
              <div className="prompt-participant-card-head">
                <div className="prompt-participant-card-identity">
                  <span className="team-avatar prompt-participant-card-avatar" aria-hidden="true">
                    {getInitials(participant.displayName)}
                  </span>
                  <div>
                    <div className="team-dash-name prompt-participant-card-name">{participant.displayName}</div>
                    {showTeamName ? <div className="prompt-participant-card-sub">{participant.teamName}</div> : null}
                  </div>
                </div>
                <div className="prompt-participant-card-actions">
                  {canOpenAnalysis ? (
                    <button
                      type="button"
                      className="mission-feedback-toggle"
                      onClick={() => onOpenParticipant?.(participant.teamIdx)}
                    >
                      Ver análise
                    </button>
                  ) : (
                    <span className="prompt-participant-card-note">
                      A análise só fica disponível a partir de {MIN_PARTICIPANT_ANALYSIS_PROMPTS} prompts.
                    </span>
                  )}
                </div>
              </div>

              <div className="prompt-participant-metrics">
                <div className="prompt-participant-metric">
                  <span>Prompts totais</span>
                  <strong>{history.length}</strong>
                </div>
                <div className="prompt-participant-metric">
                  <span>Prompts de treino</span>
                  <strong>{trainingCount}</strong>
                </div>
                <div className="prompt-participant-metric">
                  <span>Prompts missão</span>
                  <strong>{missionCount}</strong>
                </div>
                <div className="prompt-participant-metric">
                  <span>Tokens</span>
                  <strong>{tokens.toLocaleString("pt-BR")}</strong>
                </div>
                <div className="prompt-participant-metric">
                  <span>Custo</span>
                  <strong>{formatCurrency(cost)}</strong>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
