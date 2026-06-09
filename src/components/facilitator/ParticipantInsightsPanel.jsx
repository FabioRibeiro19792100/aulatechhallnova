import { Fragment, useMemo, useState } from "react";
import { Activity, GraduationCap, Lightbulb, RefreshCw, Target, TrendingUp, UserRoundSearch } from "lucide-react";
import { formatDateTime } from "../../utils.js";
import { MIN_PARTICIPANT_ANALYSIS_PROMPTS, getAllParticipantDescriptors } from "./participantAnalysisUtils.js";

const LEVEL_OPTIONS = ["Simples", "Solida", "Refinada"];

const DIMENSION_LABELS = {
  intent: "Clareza de intencao",
  context: "Uso de contexto",
  instruction: "Estruturacao de instrucoes",
  iteration: "Refinamento iterativo",
  operations: "Escolhas operacionais",
  efficiency: "Eficiencia operacional",
};

function normalizeDimensionLevel(level) {
  const normalized = `${level || ""}`.trim().toLowerCase();
  if (normalized === "emergente" || normalized === "simples") return "Simples";
  if (normalized === "consistente" || normalized === "solida" || normalized === "sólida") return "Solida";
  if (normalized === "sofisticada" || normalized === "refinada") return "Refinada";
  return "Simples";
}

function getStatusLabel(entry) {
  if (entry?.status === "ready") return "pronta";
  if (entry?.status === "unavailable") return "indisponivel";
  if (entry?.status === "pending") return "pendente";
  return "pendente";
}

function getStatusClassName(entry) {
  const label = getStatusLabel(entry);
  if (label === "pronta") return "ready";
  if (label === "indisponivel") return "unavailable";
  if (label === "pendente") return "pending";
  return "ongoing";
}

function getStatusText(entry) {
  if (entry?.status === "ready") return "Leitura pronta";
  if (entry?.status === "unavailable") return "Analise indisponivel";
  if (entry?.status === "pending") return "Analise em processamento";
  return "A leitura sera gerada automaticamente conforme novas rodadas entram.";
}

function toPrettyJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

function renderList(items = [], emptyText = "Nenhum item registrado.") {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) return <div className="participant-analysis-empty-note">{emptyText}</div>;
  return (
    <ul className="participant-analysis-bullet-list">
      {list.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function renderScaleRow(options, selected, variant = "default") {
  const normalizedSelected = normalizeDimensionLevel(selected);
  return (
    <div className={`participant-analysis-scale-row participant-analysis-scale-row-${variant}`}>
      {options.map((option) => {
        const active = option === normalizedSelected;
        return (
          <span
            key={option}
            className={`participant-analysis-scale-chip${active ? " is-active" : ""}`}
          >
            {option}
          </span>
        );
      })}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="participant-analysis-section-title">
      <span className="participant-analysis-section-icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function ParticipantInsightsPanel({ evento, participant = null, compact = false, onClose = null, onRetryParticipantAnalysis }) {
  const dimensionEntries = Object.entries(DIMENSION_LABELS);
  const participants = useMemo(() => getAllParticipantDescriptors(evento), [evento]);
  const [selectedKey, setSelectedKey] = useState("");
  const [activeSection, setActiveSection] = useState("dimensions");

  const selectedParticipant =
    participant ||
    participants.find((item) => item.analysisKey === selectedKey) ||
    participants[0] ||
    null;

  const selectedEntry = selectedParticipant?.analysisEntry || null;
  const payload = selectedEntry?.analysis || null;
  const dimensions = payload?.dimensions || {};
  const historyCount = selectedParticipant?.history?.length || 0;
  const hasMinimumHistory = historyCount >= MIN_PARTICIPANT_ANALYSIS_PROMPTS;
  const unlockedMissionCount = Array.isArray(evento?.missions)
    ? evento.missions.filter((mission) => mission.unlocked).length
    : 0;
  const participantTokens = selectedParticipant?.history?.reduce((sum, item) => sum + (item?.tokens || 0), 0) || 0;
  const participantCost = selectedParticipant?.history?.reduce((sum, item) => sum + (item?.custo || 0), 0) || 0;
  const participantCompletedMissions =
    selectedParticipant && Array.isArray(evento?.missions)
      ? evento.missions.filter((mission) => {
          if (!mission?.unlocked) return false;
          return Boolean(evento?.conclusoes?.[`${selectedParticipant.teamIdx}__${mission.id}`]);
        }).length
      : 0;
  const showRetryAction = Boolean(selectedParticipant?.history.length && selectedEntry?.status === "unavailable");

  if (!selectedParticipant && !participants.length) {
    return <div className="teams-empty">Nenhum historico de participante disponivel ainda.</div>;
  }

  const sectionTabs = [
    { key: "dimensions", label: "Dimensões observadas", icon: Activity },
    { key: "evolution", label: "Evolução observada", icon: TrendingUp },
    { key: "strengths", label: "Forças e oportunidades", icon: Target },
    { key: "recommendations", label: "Recomendações práticas", icon: Lightbulb },
  ];
  const activeSectionMeta = sectionTabs.find((item) => item.key === activeSection) || sectionTabs[0];
  const ActiveSectionIcon = activeSectionMeta.icon;

  return (
    <div className={`participant-analysis-shell${compact ? " is-drawer" : ""}`}>
      {!participant ? (
        <aside className="participant-analysis-sidebar">
        <div className="section-header">
          <span className="section-title section-title-with-icon">
            <span className="section-title-icon" aria-hidden="true">
              <UserRoundSearch size={16} strokeWidth={1.6} />
            </span>
            <span>Leitura por participante</span>
          </span>
          <span className="muted-mini">{participants.length} participante(s)</span>
        </div>

        <div className="participant-analysis-list">
          {participants.map((participant) => {
            const entry = participant.analysisEntry;
            const active = selectedParticipant?.analysisKey === participant.analysisKey;
            return (
              <button
                key={participant.analysisKey}
                type="button"
                className={`participant-analysis-list-item${active ? " is-active" : ""}`}
                onClick={() => setSelectedKey(participant.analysisKey)}
              >
                <div className="participant-analysis-list-head">
                  <strong>{participant.displayName}</strong>
                  <span className={`participant-analysis-status is-${getStatusClassName(entry)}`}>
                    {getStatusLabel(entry)}
                  </span>
                </div>
                <div className="participant-analysis-list-meta">
                  <span>{participant.teamName}</span>
                  {participant.lastActivityAt ? <span>{formatDateTime(participant.lastActivityAt)}</span> : null}
                </div>
              </button>
            );
          })}
        </div>
        </aside>
      ) : null}

      <div className="participant-analysis-main">
        {selectedParticipant ? (
          <>
            {compact ? (
              <div className="participant-insights-drawer-banner">
                <div className="participant-insights-drawer-banner-text">
                  <span>Análise de qualidade do prompt</span>
                  <span className="participant-insights-drawer-banner-separator" aria-hidden="true">|</span>
                  <span>Participante: {selectedParticipant.displayName}</span>
                </div>
                {onClose ? (
                  <button
                    type="button"
                    className="participant-insights-drawer-banner-close"
                    aria-label="Fechar análise de qualidade do prompt"
                    onClick={onClose}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ) : null}
            {!compact || showRetryAction ? (
              <div className="participant-analysis-header-card">
                <div className="participant-analysis-header-main">
                  {!compact ? (
                    <>
                      <div className="participant-analysis-eyebrow">Participante</div>
                      <h3>{selectedParticipant.displayName}</h3>
                    </>
                  ) : null}
                  {!compact ? (
                    <div className="participant-analysis-meta-row">
                      <span>{selectedParticipant.teamName}</span>
                      <span>{historyCount} prompt{historyCount === 1 ? "" : "s"}</span>
                    </div>
                  ) : null}
                </div>
                <div className="participant-analysis-actions">
                  {showRetryAction ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      disabled={!hasMinimumHistory}
                      onClick={() => onRetryParticipantAnalysis?.(selectedParticipant.teamIdx)}
                    >
                      <RefreshCw size={15} strokeWidth={1.6} aria-hidden="true" />
                      Regenerar leitura
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!payload ? (
              <div className="participant-analysis-placeholder">
                <div className="participant-analysis-placeholder-icon" aria-hidden="true">
                  <GraduationCap size={18} strokeWidth={1.5} />
                </div>
                <strong>{hasMinimumHistory ? getStatusText(selectedEntry) : `A análise só acontece a partir de ${MIN_PARTICIPANT_ANALYSIS_PROMPTS} prompts`}</strong>
                <span>
                  {selectedEntry?.errorMessage ||
                    (hasMinimumHistory
                      ? "Assim que houver historico suficiente, o sistema consolida as rodadas e monta a leitura pedagogica."
                      : `Este participante ainda tem ${historyCount} prompt${historyCount === 1 ? "" : "s"}. Quando chegar a ${MIN_PARTICIPANT_ANALYSIS_PROMPTS}, o drawer passa a mostrar a análise de qualidade do prompt.`)}
                </span>
              </div>
            ) : compact ? (
              <div className="participant-analysis-compact-layout">
                <div className="participant-analysis-sticky-stack">
                  <section className="participant-analysis-card participant-analysis-card-wide">
                    <div className="team-admin-metrics participant-analysis-summary-metrics">
                      <div className="team-admin-metric">
                        <span>{evento?.eventMode === "training" ? "Rodadas" : "Missões concluídas"}</span>
                        <strong>
                          {evento?.eventMode === "training"
                            ? historyCount
                            : `${participantCompletedMissions}/${unlockedMissionCount}`}
                        </strong>
                      </div>
                      <div className="team-admin-metric">
                        <span>Prompts</span>
                        <strong>{historyCount}</strong>
                      </div>
                      <div className="team-admin-metric">
                        <span>Tokens</span>
                        <strong>{participantTokens.toLocaleString()}</strong>
                      </div>
                      <div className="team-admin-metric">
                        <span>Custo</span>
                        <strong>${participantCost.toFixed(4)}</strong>
                      </div>
                    </div>
                  </section>

                  <div className="participant-analysis-sticky-section-head">
                    <div className="participant-analysis-folder-tabs" role="tablist" aria-label="Seções da leitura pedagógica">
                      {sectionTabs.map(({ key, label, icon: Icon }) => {
                        const active = activeSection === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`participant-analysis-folder-tab${active ? " is-active" : ""}`}
                            onClick={() => setActiveSection(key)}
                            title={label}
                          >
                            <Icon size={32} strokeWidth={1.9} aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                    <SectionTitle icon={ActiveSectionIcon}>{activeSectionMeta.label}</SectionTitle>
                  </div>
                </div>

                <div className="participant-analysis-compact-content">
                  {activeSection === "dimensions" ? (
                    <div className="participant-analysis-tab-panel">
                      <div
                        className="participant-analysis-dimension-matrix participant-analysis-dimension-matrix-transposed"
                        style={{ gridTemplateColumns: `repeat(${dimensionEntries.length}, minmax(0, 1fr))` }}
                      >
                        {dimensionEntries.map(([key, label], index) => (
                          <div
                            key={`matrix-head-${key}`}
                            className={`participant-analysis-dimension-matrix-head${index === dimensionEntries.length - 1 ? " is-last-col" : ""}`}
                          >
                            {label}
                          </div>
                        ))}
                        {LEVEL_OPTIONS.map((level) => (
                          <Fragment key={`matrix-row-${level}`}>
                            {dimensionEntries.map(([key], index) => {
                              const dimension = dimensions[key] || {};
                              const isActive = normalizeDimensionLevel(dimension.level || "Simples") === level;
                              return (
                                <div
                                  key={`matrix-cell-${level}-${key}`}
                                  className={`participant-analysis-dimension-matrix-cell${isActive ? " is-active" : ""}${index === dimensionEntries.length - 1 ? " is-last-col" : ""}${level === LEVEL_OPTIONS[LEVEL_OPTIONS.length - 1] ? " is-last-row" : ""}`}
                                >
                                  {level}
                                </div>
                              );
                            })}
                          </Fragment>
                        ))}
                      </div>
                      <div className="participant-analysis-dimensions">
                        {dimensionEntries.map(([key, label]) => {
                          const dimension = dimensions[key] || {};
                          return (
                            <article key={key} className="participant-analysis-dimension">
                              <div className="participant-analysis-dimension-head">
                                <strong>{label}</strong>
                              </div>
                              {renderScaleRow(LEVEL_OPTIONS, normalizeDimensionLevel(dimension.level || "Simples"))}
                              <p>{dimension.summary || "Sem resumo consolidado."}</p>
                              {renderList(dimension.evidence, "Sem evidencias especificas registradas.")}
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {activeSection === "evolution" ? (
                    <div className="participant-analysis-tab-panel">
                      {payload.evolution?.summary ? (
                        <div className="participant-analysis-highlight-box">
                          {payload.evolution.summary}
                        </div>
                      ) : null}
                      <div className="participant-analysis-card-subtitle">Competencias que evoluiram</div>
                      {renderList(payload.evolution?.evolved_competencies, "Nenhuma evolucao destacada.")}
                      <div className="participant-analysis-card-subtitle">Padroes constantes</div>
                      {renderList(payload.evolution?.stable_patterns, "Nenhum padrao constante destacado.")}
                      <div className="participant-analysis-card-subtitle">Mudancas no uso da IA</div>
                      {renderList(payload.evolution?.usage_changes, "Nenhuma mudanca significativa destacada.")}
                    </div>
                  ) : null}

                  {activeSection === "strengths" ? (
                    <div className="participant-analysis-tab-panel">
                      <div className="participant-analysis-card-subtitle">Forcas</div>
                      {renderList(payload.strengths, "Nenhuma forca registrada.")}
                      <div className="participant-analysis-card-subtitle">Oportunidades</div>
                      {renderList(payload.opportunities, "Nenhuma oportunidade registrada.")}
                    </div>
                  ) : null}

                  {activeSection === "recommendations" ? (
                    <div className="participant-analysis-tab-panel">
                      {renderList(payload.recommendations, "Nenhuma recomendacao gerada.")}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="participant-analysis-grid">
                <section className="participant-analysis-card participant-analysis-card-wide">
                  <div className="team-admin-metrics participant-analysis-summary-metrics">
                    <div className="team-admin-metric">
                      <span>{evento?.eventMode === "training" ? "Rodadas" : "Missões concluídas"}</span>
                      <strong>
                        {evento?.eventMode === "training"
                          ? historyCount
                          : `${participantCompletedMissions}/${unlockedMissionCount}`}
                      </strong>
                    </div>
                    <div className="team-admin-metric">
                      <span>Prompts</span>
                      <strong>{historyCount}</strong>
                    </div>
                    <div className="team-admin-metric">
                      <span>Tokens</span>
                      <strong>{participantTokens.toLocaleString()}</strong>
                    </div>
                    <div className="team-admin-metric">
                      <span>Custo</span>
                      <strong>${participantCost.toFixed(4)}</strong>
                    </div>
                  </div>
                </section>

                <section className="participant-analysis-card participant-analysis-card-wide">
                  <div className="participant-analysis-folder-tabs" role="tablist" aria-label="Seções da leitura pedagógica">
                    {sectionTabs.map(({ key, label, icon: Icon }) => {
                      const active = activeSection === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          className={`participant-analysis-folder-tab${active ? " is-active" : ""}`}
                          onClick={() => setActiveSection(key)}
                          title={label}
                        >
                          <Icon size={32} strokeWidth={1.9} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>

                  {activeSection === "dimensions" ? (
                    <>
                      <SectionTitle icon={Activity}>Dimensões observadas</SectionTitle>
                      <div
                        className="participant-analysis-dimension-matrix participant-analysis-dimension-matrix-transposed"
                        style={{ gridTemplateColumns: `repeat(${dimensionEntries.length}, minmax(0, 1fr))` }}
                      >
                        {dimensionEntries.map(([key, label], index) => (
                          <div
                            key={`matrix-head-${key}`}
                            className={`participant-analysis-dimension-matrix-head${index === dimensionEntries.length - 1 ? " is-last-col" : ""}`}
                          >
                            {label}
                          </div>
                        ))}
                        {LEVEL_OPTIONS.map((level) => (
                          <Fragment key={`matrix-row-${level}`}>
                            {dimensionEntries.map(([key], index) => {
                              const dimension = dimensions[key] || {};
                              const isActive = normalizeDimensionLevel(dimension.level || "Simples") === level;
                              return (
                                <div
                                  key={`matrix-cell-${level}-${key}`}
                                  className={`participant-analysis-dimension-matrix-cell${isActive ? " is-active" : ""}${index === dimensionEntries.length - 1 ? " is-last-col" : ""}${level === LEVEL_OPTIONS[LEVEL_OPTIONS.length - 1] ? " is-last-row" : ""}`}
                                >
                                  {level}
                                </div>
                              );
                            })}
                          </Fragment>
                        ))}
                      </div>
                      <div className="participant-analysis-dimensions">
                        {dimensionEntries.map(([key, label]) => {
                          const dimension = dimensions[key] || {};
                          return (
                            <article key={key} className="participant-analysis-dimension">
                              <div className="participant-analysis-dimension-head">
                                <strong>{label}</strong>
                              </div>
                              {renderScaleRow(LEVEL_OPTIONS, normalizeDimensionLevel(dimension.level || "Simples"))}
                              <p>{dimension.summary || "Sem resumo consolidado."}</p>
                              {renderList(dimension.evidence, "Sem evidencias especificas registradas.")}
                            </article>
                          );
                        })}
                      </div>
                    </>
                  ) : null}

                  {activeSection === "evolution" ? (
                    <>
                      <SectionTitle icon={TrendingUp}>Evolução observada</SectionTitle>
                      {payload.evolution?.summary ? (
                        <div className="participant-analysis-highlight-box">
                          {payload.evolution.summary}
                        </div>
                      ) : null}
                      <div className="participant-analysis-card-subtitle">Competencias que evoluiram</div>
                      {renderList(payload.evolution?.evolved_competencies, "Nenhuma evolucao destacada.")}
                      <div className="participant-analysis-card-subtitle">Padroes constantes</div>
                      {renderList(payload.evolution?.stable_patterns, "Nenhum padrao constante destacado.")}
                      <div className="participant-analysis-card-subtitle">Mudancas no uso da IA</div>
                      {renderList(payload.evolution?.usage_changes, "Nenhuma mudanca significativa destacada.")}
                    </>
                  ) : null}

                  {activeSection === "strengths" ? (
                    <>
                      <SectionTitle icon={Target}>Forças e oportunidades</SectionTitle>
                      <div className="participant-analysis-card-subtitle">Forcas</div>
                      {renderList(payload.strengths, "Nenhuma forca registrada.")}
                      <div className="participant-analysis-card-subtitle">Oportunidades</div>
                      {renderList(payload.opportunities, "Nenhuma oportunidade registrada.")}
                    </>
                  ) : null}

                  {activeSection === "recommendations" ? (
                    <>
                      <SectionTitle icon={Lightbulb}>Recomendações práticas</SectionTitle>
                      {renderList(payload.recommendations, "Nenhuma recomendacao gerada.")}
                    </>
                  ) : null}
                </section>
              </div>
            )}
            {compact && selectedEntry?.generatedAt ? (
              <div className="participant-analysis-footer-note">
                Leitura atualizada em {formatDateTime(selectedEntry.generatedAt)}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
