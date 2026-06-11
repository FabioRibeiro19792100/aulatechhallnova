import { Fragment, useMemo, useRef, useState } from "react";
import { Activity, FileStack, GraduationCap, Lightbulb, Printer, RefreshCw, Share2, Target, TrendingUp, UserRoundSearch } from "lucide-react";
import { formatDateTime, TRAINING_THREAD_ID } from "../../utils.js";
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

function isEntryTrusted({ participant, entry }) {
  if (!participant || !entry) return false;
  if (entry.status !== "ready") return false;
  if (entry.historySignature !== participant.historySignature) return false;
  return Boolean(entry.analysis);
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

function getPromptLogMeta(evento, item) {
  const missionId = item?.missionId;
  if (missionId === TRAINING_THREAD_ID || missionId === "__training__") {
    return {
      scope: "Treino",
      mode: item?.aiMode === "coding" ? "Coding" : "Chat",
    };
  }
  const mission = Array.isArray(evento?.missions)
    ? evento.missions.find((entry) => entry.id === missionId)
    : null;
  return {
    scope: mission ? `${mission.num}. ${mission.name}` : "Missão",
    mode: item?.aiMode === "coding" ? "Coding" : "Chat",
  };
}

function buildParticipantAnalysisShareText({ participant, payload, historyCount, trainingPromptCount }) {
  const dimensions = payload?.dimensions || {};
  const dimensionLines = Object.entries(DIMENSION_LABELS)
    .map(([key, label]) => {
      const dimension = dimensions[key];
      if (!dimension?.level) return null;
      return `- ${label}: ${normalizeDimensionLevel(dimension.level)}`;
    })
    .filter(Boolean);

  return [
    `Análise de qualidade do prompt`,
    `Participante: ${participant.displayName}`,
    `Prompts considerados: ${historyCount}`,
    trainingPromptCount ? `Prompts de treino incluídos: ${trainingPromptCount}` : null,
    "",
    payload?.evolution?.summary || "",
    "",
    dimensionLines.length ? "Dimensões observadas:" : null,
    ...dimensionLines,
    "",
    Array.isArray(payload?.recommendations) && payload.recommendations.length
      ? "Recomendações práticas:"
      : null,
    ...(Array.isArray(payload?.recommendations) ? payload.recommendations.map((item) => `- ${item}`) : []),
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}

function buildParticipantAnalysisPrintHtml({ participant, payload, historyCount, participantTokens, participantCost, trainingPromptCount }) {
  const dimensions = Object.entries(DIMENSION_LABELS)
    .map(([key, label]) => {
      const dimension = payload?.dimensions?.[key] || {};
      return `
        <tr>
          <td>${label}</td>
          <td>${normalizeDimensionLevel(dimension.level || "Simples")}</td>
          <td>${dimension.summary || ""}</td>
        </tr>
      `;
    })
    .join("");

  const renderItems = (items = []) =>
    Array.isArray(items) && items.length
      ? `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`
      : `<p>Nenhum item registrado.</p>`;

  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Análise de qualidade do prompt - ${participant.displayName}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#0f172a;margin:32px;line-height:1.5}
        h1{font-size:28px;margin:0 0 8px}
        h2{font-size:18px;margin:28px 0 10px}
        .meta{color:#475569;margin-bottom:24px}
        .summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #cbd5e1}
        .summary div{padding:14px 16px;border-right:1px solid #cbd5e1}
        .summary div:last-child{border-right:none}
        .summary span{display:block;color:#64748b;font-size:12px;margin-bottom:8px}
        .summary strong{font-size:24px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #cbd5e1;padding:10px 12px;text-align:left;vertical-align:top}
        th{background:#f8fafc}
        ul{margin:0;padding-left:18px}
        p{margin:0}
      </style>
    </head>
    <body>
      <h1>Análise de qualidade do prompt</h1>
      <div class="meta">Participante: ${participant.displayName}</div>
      <div class="summary">
        <div><span>Prompts</span><strong>${historyCount}</strong></div>
        <div><span>Treino</span><strong>${trainingPromptCount}</strong></div>
        <div><span>Tokens</span><strong>${participantTokens.toLocaleString("pt-BR")}</strong></div>
        <div><span>Custo</span><strong>$${participantCost.toFixed(4)}</strong></div>
      </div>
      <h2>Dimensões observadas</h2>
      <table>
        <thead>
          <tr>
            <th>Dimensão</th>
            <th>Nível</th>
            <th>Resumo</th>
          </tr>
        </thead>
        <tbody>${dimensions}</tbody>
      </table>
      <h2>Evolução observada</h2>
      <p>${payload?.evolution?.summary || "Sem resumo consolidado."}</p>
      <h2>Forças</h2>
      ${renderItems(payload?.strengths)}
      <h2>Oportunidades</h2>
      ${renderItems(payload?.opportunities)}
      <h2>Recomendações práticas</h2>
      ${renderItems(payload?.recommendations)}
    </body>
  </html>`;
}

export function ParticipantInsightsPanel({ evento, participant = null, compact = false, onClose = null, onRetryParticipantAnalysis }) {
  const dimensionEntries = Object.entries(DIMENSION_LABELS);
  const participants = useMemo(() => getAllParticipantDescriptors(evento), [evento]);
  const [selectedKey, setSelectedKey] = useState("");
  const [activeSection, setActiveSection] = useState("dimensions");
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const printReportRef = useRef(null);
  const selectedParticipant =
    participant ||
    participants.find((item) => item.analysisKey === selectedKey) ||
    participants[0] ||
    null;

  const selectedEntry = selectedParticipant?.analysisEntry || null;
  const historyCount = selectedParticipant?.history?.length || 0;
  const hasMinimumHistory = historyCount >= MIN_PARTICIPANT_ANALYSIS_PROMPTS;
  const displayHistoryCount = historyCount;
  const trustedEntry = isEntryTrusted({
    participant: selectedParticipant,
    entry: selectedEntry,
  });
  const payload = trustedEntry ? selectedEntry?.analysis || null : null;
  const dimensions = payload?.dimensions || {};
  const unlockedMissionCount = Array.isArray(evento?.missions)
    ? evento.missions.filter((mission) => mission.unlocked).length
    : 0;
  const participantTokens = (selectedParticipant?.history || []).reduce((sum, item) => sum + (item?.tokens || 0), 0) || 0;
  const participantCost = (selectedParticipant?.history || []).reduce((sum, item) => sum + (item?.custo || 0), 0) || 0;
  const trainingPromptCount = (selectedParticipant?.history || []).filter(
    (item) => item?.missionId === TRAINING_THREAD_ID || item?.missionId === "__training__",
  ).length;
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
    { key: "logs", label: "Logs de prompts", icon: FileStack },
  ];
  const activeSectionMeta = sectionTabs.find((item) => item.key === activeSection) || sectionTabs[0];
  const ActiveSectionIcon = activeSectionMeta.icon;
  const promptLogItems = selectedParticipant?.history || [];
  const shareText = payload && selectedParticipant
    ? buildParticipantAnalysisShareText({
        participant: selectedParticipant,
        payload,
        historyCount: displayHistoryCount,
        trainingPromptCount,
      })
    : "";

  async function handleShareAnalysis() {
    if (!shareText) return;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setShareMenuOpen(false);
  }

  function handlePrintAnalysis() {
    if (!payload || !selectedParticipant) return;
    const reportHtml = printReportRef.current?.innerHTML;
    if (!reportHtml) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(`<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Análise de qualidade do prompt - ${selectedParticipant.displayName}</title>
          <style>
            body{font-family:Arial,sans-serif;color:#0f172a;margin:32px;line-height:1.5}
            .participant-analysis-print-report{display:block !important}
            .participant-analysis-print-title{font-size:28px;font-weight:700;margin:0 0 8px}
            .participant-analysis-print-meta{color:#475569;margin-bottom:24px}
            .participant-analysis-print-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #cbd5e1;margin-bottom:28px}
            .participant-analysis-print-grid-item{padding:14px 16px;border-right:1px solid #cbd5e1}
            .participant-analysis-print-grid-item:last-child{border-right:none}
            .participant-analysis-print-grid-item span{display:block;color:#64748b;font-size:12px;margin-bottom:8px}
            .participant-analysis-print-grid-item strong{font-size:24px}
            .participant-analysis-print-section{margin-top:28px}
            .participant-analysis-print-section h2{font-size:18px;margin:0 0 12px}
            .participant-analysis-print-dimension{border:1px solid #cbd5e1;padding:12px 14px;margin-bottom:12px}
            .participant-analysis-print-dimension strong{display:block;margin-bottom:8px}
            .participant-analysis-print-dimension p{margin:10px 0 0}
            .participant-analysis-print-list{margin:0;padding-left:18px}
            .participant-analysis-print-log{border:1px solid #cbd5e1;padding:12px 14px;margin-bottom:12px}
            .participant-analysis-print-log-head{display:flex;flex-wrap:wrap;gap:8px 12px;color:#64748b;font-size:13px;margin-bottom:8px}
            .participant-analysis-print-log p{margin:0;white-space:pre-wrap}
          </style>
        </head>
        <body>${reportHtml}</body>
      </html>`);
    doc.close();

    const runPrint = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1500);
    };

    if (iframe.contentWindow.document.readyState === "complete") {
      window.setTimeout(runPrint, 150);
    } else {
      iframe.onload = () => window.setTimeout(runPrint, 150);
    }
    setShareMenuOpen(false);
  }

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
                {payload ? (
                  <div className="participant-insights-drawer-banner-actions">
                    <button
                      type="button"
                      className="participant-insights-drawer-banner-share"
                      aria-label="Compartilhar análise"
                      onClick={() => setShareMenuOpen((current) => !current)}
                    >
                      <Share2 size={16} strokeWidth={1.9} />
                    </button>
                    {shareMenuOpen ? (
                      <div className="participant-insights-drawer-share-menu">
                        <button type="button" onClick={() => void handleShareAnalysis()}>
                          <Share2 size={14} strokeWidth={1.8} />
                          WhatsApp
                        </button>
                        <button type="button" onClick={handlePrintAnalysis}>
                          <Printer size={14} strokeWidth={1.8} />
                          Imprimir / PDF
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
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
                      <span>{displayHistoryCount} prompt{displayHistoryCount === 1 ? "" : "s"}</span>
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
                {hasMinimumHistory && selectedEntry?.status === "pending" ? (
                  <div className="participant-analysis-loading-state">
                    <div className="participant-analysis-loading-icon" aria-hidden="true">
                      <RefreshCw size={20} strokeWidth={1.8} />
                    </div>
                    <strong>Análise em processamento</strong>
                    <span>Consolidando o histórico rastreável deste participante.</span>
                  </div>
                ) : (
                  <>
                    <div className="participant-analysis-placeholder-icon" aria-hidden="true">
                      <GraduationCap size={18} strokeWidth={1.5} />
                    </div>
                    <strong>{hasMinimumHistory ? getStatusText(selectedEntry) : `A análise só acontece a partir de ${MIN_PARTICIPANT_ANALYSIS_PROMPTS} prompts`}</strong>
                    <span>
                      {hasMinimumHistory
                        ? selectedEntry?.errorMessage || "Assim que houver historico suficiente, o sistema consolida as rodadas e monta a leitura pedagogica."
                        : `Este participante ainda tem ${historyCount} prompt${historyCount === 1 ? "" : "s"}.`}
                    </span>
                  </>
                )}
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
                            ? displayHistoryCount
                            : `${participantCompletedMissions}/${unlockedMissionCount}`}
                        </strong>
                      </div>
                      <div className="team-admin-metric">
                        <span>Prompts</span>
                        <strong>{displayHistoryCount}</strong>
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
                  <div className="participant-analysis-summary-note">
                      {trainingPromptCount > 0
                        ? `Esta análise considera ${displayHistoryCount} prompts rastreáveis deste participante no evento, incluindo ${trainingPromptCount} prompt${trainingPromptCount === 1 ? "" : "s"} de treino.`
                        : `Esta análise considera ${displayHistoryCount} prompts rastreáveis deste participante no evento.`}
                    </div>
                  </section>

                  <div className="participant-analysis-sticky-section-head">
                    <div className="participant-analysis-sticky-tools">
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

                  {activeSection === "logs" ? (
                    <div className="participant-analysis-tab-panel">
                      <div className="participant-analysis-log-list">
                        {promptLogItems.map((item, index) => {
                          const meta = getPromptLogMeta(evento, item);
                          return (
                            <article key={item.id || `${item.ts}-${index}`} className="participant-analysis-log-item">
                              <div className="participant-analysis-log-head">
                                <strong>{formatDateTime(item.ts)}</strong>
                                <span>{meta.scope}</span>
                                <span>{meta.mode}</span>
                              </div>
                              <p>{item.input || "Prompt não registrado."}</p>
                            </article>
                          );
                        })}
                      </div>
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
                          ? displayHistoryCount
                          : `${participantCompletedMissions}/${unlockedMissionCount}`}
                      </strong>
                    </div>
                    <div className="team-admin-metric">
                      <span>Prompts</span>
                      <strong>{displayHistoryCount}</strong>
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
                  <div className="participant-analysis-summary-note">
                    {trainingPromptCount > 0
                      ? `Esta análise considera ${displayHistoryCount} prompts rastreáveis deste participante no evento, incluindo ${trainingPromptCount} prompt${trainingPromptCount === 1 ? "" : "s"} de treino.`
                      : `Esta análise considera ${displayHistoryCount} prompts rastreáveis deste participante no evento.`}
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

                  {activeSection === "logs" ? (
                    <>
                      <SectionTitle icon={FileStack}>Logs de prompts</SectionTitle>
                      <div className="participant-analysis-log-list">
                        {promptLogItems.map((item, index) => {
                          const meta = getPromptLogMeta(evento, item);
                          return (
                            <article key={item.id || `${item.ts}-${index}`} className="participant-analysis-log-item">
                              <div className="participant-analysis-log-head">
                                <strong>{formatDateTime(item.ts)}</strong>
                                <span>{meta.scope}</span>
                                <span>{meta.mode}</span>
                              </div>
                              <p>{item.input || "Prompt não registrado."}</p>
                            </article>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </section>
              </div>
            )}
            {payload ? (
              <div className="participant-analysis-print-report" ref={printReportRef} aria-hidden="true">
                <div className="participant-analysis-print-title">Análise de qualidade do prompt</div>
                <div className="participant-analysis-print-meta">Participante: {selectedParticipant.displayName}</div>
                <div className="participant-analysis-print-grid">
                  <div className="participant-analysis-print-grid-item"><span>Prompts</span><strong>{displayHistoryCount}</strong></div>
                  <div className="participant-analysis-print-grid-item"><span>Treino</span><strong>{trainingPromptCount}</strong></div>
                  <div className="participant-analysis-print-grid-item"><span>Tokens</span><strong>{participantTokens.toLocaleString("pt-BR")}</strong></div>
                  <div className="participant-analysis-print-grid-item"><span>Custo</span><strong>${participantCost.toFixed(4)}</strong></div>
                </div>

                <section className="participant-analysis-print-section">
                  <h2>Dimensões observadas</h2>
                  {dimensionEntries.map(([key, label]) => {
                    const dimension = dimensions[key] || {};
                    return (
                      <div key={`print-${key}`} className="participant-analysis-print-dimension">
                        <strong>{label}</strong>
                        <div>{normalizeDimensionLevel(dimension.level || "Simples")}</div>
                        <p>{dimension.summary || "Sem resumo consolidado."}</p>
                        {Array.isArray(dimension.evidence) && dimension.evidence.length ? (
                          <ul className="participant-analysis-print-list">
                            {dimension.evidence.map((item, index) => (
                              <li key={`print-evidence-${key}-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    );
                  })}
                </section>

                <section className="participant-analysis-print-section">
                  <h2>Evolução observada</h2>
                  <p>{payload.evolution?.summary || "Sem resumo consolidado."}</p>
                  {Array.isArray(payload.evolution?.evolved_competencies) && payload.evolution.evolved_competencies.length ? (
                    <ul className="participant-analysis-print-list">
                      {payload.evolution.evolved_competencies.map((item, index) => (
                        <li key={`print-evolved-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {Array.isArray(payload.evolution?.stable_patterns) && payload.evolution.stable_patterns.length ? (
                    <ul className="participant-analysis-print-list">
                      {payload.evolution.stable_patterns.map((item, index) => (
                        <li key={`print-stable-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {Array.isArray(payload.evolution?.usage_changes) && payload.evolution.usage_changes.length ? (
                    <ul className="participant-analysis-print-list">
                      {payload.evolution.usage_changes.map((item, index) => (
                        <li key={`print-usage-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>

                <section className="participant-analysis-print-section">
                  <h2>Forças e oportunidades</h2>
                  {Array.isArray(payload.strengths) && payload.strengths.length ? (
                    <ul className="participant-analysis-print-list">
                      {payload.strengths.map((item, index) => (
                        <li key={`print-strength-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {Array.isArray(payload.opportunities) && payload.opportunities.length ? (
                    <ul className="participant-analysis-print-list">
                      {payload.opportunities.map((item, index) => (
                        <li key={`print-opportunity-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>

                <section className="participant-analysis-print-section">
                  <h2>Recomendações práticas</h2>
                  {Array.isArray(payload.recommendations) && payload.recommendations.length ? (
                    <ul className="participant-analysis-print-list">
                      {payload.recommendations.map((item, index) => (
                        <li key={`print-recommendation-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>

              </div>
            ) : null}
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
