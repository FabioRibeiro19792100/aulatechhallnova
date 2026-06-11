import { useMemo, useRef, useState } from "react";
import { Activity, BrainCircuit, Cpu, ListChecks, Share2, Sparkles, X } from "lucide-react";
import { formatDateTime, TRAINING_THREAD_ID } from "../../utils.js";
import {
  MIN_PARTICIPANT_ANALYSIS_PROMPTS,
  PROMPT_QUALITY_MODEL_2,
  getAllParticipantDescriptors,
  getParticipantAnalysisEntry,
} from "./participantAnalysisUtils.js";
import {
  PROMPT_QUALITY_LAB_CLARITY_LEVELS,
  PROMPT_QUALITY_LAB_EFFICIENCY_LEVELS,
  PROMPT_QUALITY_LAB_MODEL_LEVELS,
  buildPromptQualityModel2Analysis,
} from "./promptQualityModel2Utils.js";

const PROMPT_QUALITY_LAB_LEVEL_HELP = {
  clarity: {
    "Chain-of-thought":
      "Pedidos mais estruturados, com encadeamento explícito do raciocínio, etapas ou critérios para chegar ao resultado.",
    "Few-shot":
      "Pedidos que usam exemplos, referências ou demonstrações curtas para orientar a resposta esperada.",
    "Zero-shot":
      "Pedidos diretos, sem exemplos prévios, que dependem mais da formulação bruta da instrução.",
  },
  efficiency: {
    Subfornecido:
      "Há pouca informação ou contexto para a tarefa. O prompt tende a deixar lacunas importantes para a IA preencher sozinha.",
    Calibrado:
      "A quantidade de contexto, restrições e detalhes está bem ajustada para a tarefa, sem excesso nem falta relevante.",
    Superfornecido:
      "Há mais informação, repetição ou detalhamento do que a tarefa realmente precisa, o que pode aumentar custo e dispersão.",
  },
  modelFit: {
    Trial:
      "Uso ainda experimental do modelo, com escolhas pouco consistentes entre tipo de tarefa, profundidade e recurso acionado.",
    Consciente:
      "Há escolhas razoáveis de modelo e modo de uso, com alguma adequação ao tipo de tarefa proposta.",
    Estratégico:
      "As escolhas de modelo, modo e formulação parecem intencionais e bem alinhadas ao tipo de tarefa e ao resultado buscado.",
  },
};

function buildWhatsappText(participant, analysis) {
  return [
    "Análise de qualidade do prompt · Modelo 2",
    `Participante: ${participant.displayName}`,
    `Quadrante: ${analysis.quadrant}`,
    `Prompts: ${analysis.stats.prompts}`,
    `Treino: ${analysis.stats.treino}`,
    `Tokens: ${analysis.stats.tokens.toLocaleString("pt-BR")}`,
    `Custo: ${analysis.stats.custo}`,
    "",
    "Visão geral",
    analysis.tabs.geral.text,
    "",
    "Próximos passos",
    ...analysis.tabs.geral.nextSteps.map((item) => `- ${item}`),
  ].join("\n");
}

function openPrintWindow(html) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  };
}

function buildPrintHtml(participant, analysis, generatedAt) {
  const triadRows = [
    { label: "Clareza do prompt", options: PROMPT_QUALITY_LAB_CLARITY_LEVELS, active: analysis.triad.clarity },
    { label: "Eficiência de tokens", options: PROMPT_QUALITY_LAB_EFFICIENCY_LEVELS, active: analysis.triad.efficiency },
    { label: "Adequação do modelo", options: PROMPT_QUALITY_LAB_MODEL_LEVELS, active: analysis.triad.modelFit },
  ];
  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Prompt Quality Lab - ${participant.displayName}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#0f172a;margin:28px;line-height:1.55}
        h1{font-size:28px;margin:0 0 6px}
        h2{font-size:18px;margin:22px 0 10px}
        .meta{color:#64748b;margin-bottom:18px}
        .stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid #cbd5e1}
        .stats div{padding:12px 14px;border-right:1px solid #cbd5e1}
        .stats div:last-child{border-right:none}
        .stats span{display:block;font-size:12px;color:#64748b;margin-bottom:6px}
        .stats strong{font-size:24px}
        .triad-row{margin:0 0 12px}
        .triad-row strong{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;color:#64748b}
        .triad-pills{display:flex;gap:6px}
        .triad-pill{padding:6px 10px;border:1px solid #cbd5e1;font-size:12px}
        .triad-pill.active{background:#eef3ff;border-color:#2563eb;color:#2563eb;font-weight:700}
        .finding{padding:10px 12px;border-left:3px solid #cbd5e1;background:#f8fafc;margin-bottom:8px}
        .finding.ok{border-left-color:#16a34a;background:#f0fdf4}
        .finding.warn{border-left-color:#d97706;background:#fffbeb}
        .finding.crit{border-left-color:#dc2626;background:#fef2f2}
        ul{margin:0;padding-left:18px}
      </style>
    </head>
    <body>
      <h1>Prompt Quality Lab</h1>
      <div class="meta">Participante: ${participant.displayName} · Quadrante: ${analysis.quadrant} · Atualizado em ${generatedAt}</div>
      <div class="stats">
        <div><span>Prompts totais</span><strong>${analysis.stats.prompts}</strong></div>
        <div><span>Prompts treino</span><strong>${analysis.stats.treino}</strong></div>
        <div><span>Prompts missão</span><strong>${analysis.stats.promptsMissao}</strong></div>
        <div><span>Tokens</span><strong>${analysis.stats.tokens.toLocaleString("pt-BR")}</strong></div>
        <div><span>Custo</span><strong>${analysis.stats.custo}</strong></div>
      </div>
      <h2>Visão geral</h2>
      <p>${analysis.tabs.geral.text}</p>
      <h2>Tríade</h2>
      ${triadRows
        .map(
          (row) => `<div class="triad-row"><strong>${row.label}</strong><div class="triad-pills">${row.options
            .map((option, index) => `<span class="triad-pill${row.active === index ? " active" : ""}">${option}</span>`)
            .join("")}</div></div>`,
        )
        .join("")}
      <h2>Clareza</h2>
      <p>${analysis.tabs.clareza.text}</p>
      ${analysis.tabs.clareza.findings.map((item) => `<div class="finding ${item.type}">${item.text}</div>`).join("")}
      <h2>Eficiência</h2>
      <p>${analysis.tabs.eficiencia.text}</p>
      ${analysis.tabs.eficiencia.findings.map((item) => `<div class="finding ${item.type}">${item.text}</div>`).join("")}
      <h2>Modelo</h2>
      <p>${analysis.tabs.modelo.text}</p>
      ${analysis.tabs.modelo.findings.map((item) => `<div class="finding ${item.type}">${item.text}</div>`).join("")}
      <h2>Próximos passos</h2>
      <ul>${analysis.tabs.geral.nextSteps.map((item) => `<li>${item}</li>`).join("")}</ul>
    </body>
  </html>`;
}

function renderTriadMatrix(selectedAnalysis) {
  const rows = [
    {
      label: "Clareza do prompt",
      options: PROMPT_QUALITY_LAB_CLARITY_LEVELS,
      activeIndex: selectedAnalysis.triad.clarity,
      helpKey: "clarity",
      variant: "default",
    },
    {
      label: "Eficiência de tokens",
      options: PROMPT_QUALITY_LAB_EFFICIENCY_LEVELS,
      activeIndex: selectedAnalysis.triad.efficiency,
      helpKey: "efficiency",
      variant: "efficiency",
    },
    {
      label: "Adequação do modelo",
      options: PROMPT_QUALITY_LAB_MODEL_LEVELS,
      activeIndex: selectedAnalysis.triad.modelFit,
      helpKey: "modelFit",
      variant: "default",
    },
  ];

  return (
    <div className="pql-triad-matrix" role="table" aria-label="Matriz da análise">
      {rows.map((row) => (
        <div key={row.label} className="pql-triad-matrix-row" role="row">
          <div className="pql-triad-matrix-label" role="rowheader">
            {row.label}
          </div>
          <div className="pql-triad-matrix-options" role="cell">
            {row.options.map((option, index) => {
              const isActive = row.activeIndex === index;
              const isDeviation = row.variant === "efficiency" && index !== 1 && isActive;
              const isIdealMarker = row.variant === "efficiency" && index === 1 && !isActive;
              const helpText = row.helpKey ? PROMPT_QUALITY_LAB_LEVEL_HELP[row.helpKey]?.[option] : "";
              return (
                <span
                  key={option}
                  className={`pql-triad-pill${isActive ? " is-active" : ""}${isDeviation ? " is-deviation" : ""}${isIdealMarker ? " is-ideal-marker" : ""}`}
                  data-help={helpText || null}
                >
                  {option}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderFindings(items = []) {
  return (
    <div className="pql-findings">
      {items.map((item, index) => (
        <div key={`${item.text}-${index}`} className={`pql-finding pql-finding-${item.type || "warn"}`}>
          <span className="pql-finding-icon">{item.type === "ok" ? "OK" : item.type === "crit" ? "!" : "•"}</span>
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="pql-section-label">
      {Icon ? <Icon size={14} strokeWidth={1.65} /> : null}
      <span>{children}</span>
    </div>
  );
}

export function PromptQualityLabPanel({
  evento,
  participant = null,
  onClose,
  onSelectParticipant = null,
  onRetryParticipantAnalysis = null,
}) {
  const [activeTab, setActiveTab] = useState("geral");
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const participants = useMemo(() => getAllParticipantDescriptors(evento), [evento]);
  const previewEntries = useMemo(
    () =>
      participants.map((entry) => ({
        participant: entry,
        analysis:
          entry.history.length >= MIN_PARTICIPANT_ANALYSIS_PROMPTS
            ? buildPromptQualityModel2Analysis({
                participant: entry,
                eventName: evento?.name || "",
                missions: evento?.missions || [],
              })
            : null,
      })),
    [participants, evento],
  );

  const selectedParticipant =
    participant ||
    previewEntries.find((item) => item.participant.analysisKey === participant?.analysisKey)?.participant ||
    previewEntries[0]?.participant ||
    null;

  const cachedModel2Entry = selectedParticipant
    ? getParticipantAnalysisEntry(evento, selectedParticipant.analysisKey, PROMPT_QUALITY_MODEL_2)
    : null;
  const computedAnalysis = selectedParticipant
    ? buildPromptQualityModel2Analysis({
        participant: selectedParticipant,
        eventName: evento?.name || "",
        missions: evento?.missions || [],
      })
    : null;
  const selectedAnalysis =
    cachedModel2Entry?.status === "ready" && cachedModel2Entry?.historySignature === selectedParticipant?.historySignature
      ? cachedModel2Entry.analysis
      : computedAnalysis;
  const canAnalyze = (selectedParticipant?.history?.length || 0) >= MIN_PARTICIPANT_ANALYSIS_PROMPTS;
  const generatedAt = formatDateTime(cachedModel2Entry?.updatedAt || new Date().toISOString());
  const selectedLabel = selectedParticipant?.displayName || "";
  const activeTabContent = selectedAnalysis?.tabs?.[activeTab] || null;
  const printHtml = canAnalyze && selectedParticipant && selectedAnalysis
    ? buildPrintHtml(selectedParticipant, selectedAnalysis, generatedAt)
    : "";
  const shareText = canAnalyze && selectedParticipant && selectedAnalysis
    ? buildWhatsappText(selectedParticipant, selectedAnalysis)
    : "";
  const tabItems = [
    { key: "geral", label: "Visão Geral", icon: Activity },
    { key: "clareza", label: "Clareza", icon: BrainCircuit },
    { key: "eficiencia", label: "Eficiência", icon: Activity },
    { key: "modelo", label: "Modelo", icon: Cpu },
  ];
  const summaryStats = selectedAnalysis?.stats || null;
  const selectedPreviewPoint = selectedAnalysis
    ? {
        left: `${selectedAnalysis.qx}%`,
        top: `${selectedAnalysis.qy}%`,
      }
    : null;
  const printReportRef = useRef(null);

  function handleShare() {
    if (!shareText) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
    setShareMenuOpen(false);
  }

  function handlePrint() {
    if (!printHtml) return;
    openPrintWindow(printHtml);
    setShareMenuOpen(false);
  }

  return (
    <div className="prompt-quality-lab-shell">
      <div className="prompt-quality-lab-header">
        <div className="prompt-quality-lab-title-wrap">
          <div className="prompt-quality-lab-title">Análise de qualidade do prompt</div>
          <div className="prompt-quality-lab-subtitle">
            {evento?.name || "Evento"} <span>|</span> Modelo 2
          </div>
        </div>
        <div className="prompt-quality-lab-actions">
          <div className="prompt-quality-lab-share-wrap">
            <button type="button" className="prompt-quality-lab-action-btn" onClick={() => setShareMenuOpen((value) => !value)}>
              <Share2 size={17} strokeWidth={1.8} />
            </button>
            {shareMenuOpen ? (
              <div className="prompt-quality-lab-share-menu">
                <button type="button" onClick={handleShare}>Compartilhar no WhatsApp</button>
                <button type="button" onClick={handlePrint}>Imprimir / PDF</button>
              </div>
            ) : null}
          </div>
          <button type="button" className="prompt-quality-lab-action-btn" onClick={onClose}>
            <X size={18} strokeWidth={1.9} />
          </button>
        </div>
      </div>

      <div className="prompt-quality-lab-main">
        <section className="prompt-quality-lab-left">
          <div className="pql-eyebrow">Mapa de perfis</div>
          <div className="pql-grid-shell">
            <div className="pql-y-axis">
              <span>Prompts claros</span>
              <strong>Qualidade do prompt</strong>
              <span>Prompts vagos</span>
            </div>
            <div className="pql-grid-wrap">
              <div className="pql-grid">
                <div className="pql-quadrant pql-quadrant-tl">
                  <strong>Econômico Impreciso</strong>
                  <p>Prompts vagos com contexto insuficiente.</p>
                </div>
                <div className="pql-quadrant pql-quadrant-tr">
                  <strong>Avançado</strong>
                  <p>Clareza alta com uso calibrado de recursos.</p>
                </div>
                <div className="pql-quadrant pql-quadrant-bl">
                  <strong>Iniciante</strong>
                  <p>Prompts frágeis com escolhas operacionais ainda instáveis.</p>
                </div>
                <div className="pql-quadrant pql-quadrant-br">
                  <strong>Eloquente Desperdiçador</strong>
                  <p>Boa articulação, mas com excesso de recursos.</p>
                </div>
                <div className="pql-dots-layer">
                  {previewEntries.map(({ participant: item, analysis }) => {
                    if (!analysis) return null;
                    const isActive = item.analysisKey === selectedParticipant?.analysisKey;
                    return (
                      <button
                        key={item.analysisKey}
                        type="button"
                        className={`pql-dot${isActive ? " is-active" : ""}`}
                        style={{ left: `${analysis.qx}%`, top: `${analysis.qy}%` }}
                        title={item.displayName}
                        onClick={() => {
                          setActiveTab("geral");
                          onSelectParticipant?.(item.teamIdx);
                          onRetryParticipantAnalysis?.(item.teamIdx);
                        }}
                      >
                        <span>{item.displayName.slice(0, 1).toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pql-x-axis">
                <span>Subfornecido</span>
                <strong>Eficiência de recursos</strong>
                <span>Superfornecido</span>
              </div>
            </div>
          </div>
        </section>

        <section className="prompt-quality-lab-right">
          {!selectedParticipant ? (
            <div className="pql-placeholder">Nenhum participante disponível.</div>
          ) : !canAnalyze ? (
            <div className="pql-placeholder">
              <strong>A análise só acontece a partir de {MIN_PARTICIPANT_ANALYSIS_PROMPTS} prompts.</strong>
              <span>Este participante ainda não tem base suficiente para entrar no modelo 2.</span>
            </div>
          ) : (
            <>
              <div className="pql-profile-head">
                <div>
                  <div className="pql-profile-name">{selectedLabel}</div>
                  <div className="pql-profile-quadrant">{selectedAnalysis.quadrant}</div>
                </div>
                {selectedPreviewPoint ? (
                  <div className="pql-profile-meta">
                    Atualizado em {generatedAt}
                  </div>
                ) : null}
              </div>

              <div className="pql-tab-bar">
                {tabItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`pql-tab-btn${activeTab === item.key ? " is-active" : ""}`}
                      onClick={() => setActiveTab(item.key)}
                    >
                      <Icon size={15} strokeWidth={1.8} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pql-tab-panel">
                {activeTab === "geral" ? (
                  <>
                    <div className="pql-stats-strip">
                      <div className="pql-stat-box">
                        <span>Prompts totais</span>
                        <strong>{summaryStats.prompts}</strong>
                      </div>
                      <div className="pql-stat-box">
                        <span>Prompts treino</span>
                        <strong>{summaryStats.treino}</strong>
                      </div>
                      <div className="pql-stat-box">
                        <span>Prompts missão</span>
                        <strong>{summaryStats.promptsMissao}</strong>
                      </div>
                      <div className="pql-stat-box">
                        <span>Tokens</span>
                        <strong>{summaryStats.tokens.toLocaleString("pt-BR")}</strong>
                      </div>
                      <div className="pql-stat-box">
                        <span>Custo</span>
                        <strong>{summaryStats.custo}</strong>
                      </div>
                    </div>

                    {renderTriadMatrix(selectedAnalysis)}
                  </>
                ) : null}

                <div className="pql-tab-text">{activeTabContent?.text}</div>
                {(activeTabContent?.findings || []).length ? (
                  <div className="pql-section-block">
                    <SectionLabel icon={ListChecks}>Sinais observados neste recorte</SectionLabel>
                    {renderFindings(activeTabContent?.findings || [])}
                  </div>
                ) : null}
                {activeTab === "geral" ? (
                  <div className="pql-section-block">
                    <SectionLabel icon={Sparkles}>Próximos movimentos sugeridos</SectionLabel>
                    <div className="pql-next-steps">
                      {activeTabContent?.nextSteps?.map((step, index) => (
                        <div key={`${step}-${index}`} className="pql-next-step">
                          <span>{index + 1}</span>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pql-section-block">
                    <SectionLabel icon={Activity}>Como ler este eixo</SectionLabel>
                    <div className="pql-tip-box">
                      <strong>{activeTabContent?.tip?.label}</strong>
                      <p>{activeTabContent?.tip?.text}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <div ref={printReportRef} className="pql-print-source" aria-hidden="true" />
    </div>
  );
}
