import { useState } from "react";
import MarkdownMessage from "../../MarkdownMessage.jsx";
import {
  getActionLabel,
  formatTokenLimitLabel,
  formatDateTime,
  getReflectionTopicLabel,
} from "../../utils.js";
import { ProcessingPipeline, ReasoningPanel, TransparencyPanel } from "../conversation/ResponseComponents.jsx";
import { GeneratedArtifactsPanel } from "../conversation/ArtifactComponents.jsx";

export function OutputCard({ exec, compact = false }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`output-card${compact ? " output-card-compact" : ""}`}>
      <div className="output-header">
        <div className="output-label">{compact ? "Resposta desta rodada" : "Última resposta"}</div>
        <span className="muted-mini">
          {exec.acao || "-"} · {exec.tokens?.toLocaleString() || 0} tokens
        </span>
      </div>
      <div className="output-body">
        {exec.processingSteps?.length ? <ProcessingPipeline processingSteps={exec.processingSteps} /> : null}
        {exec.historySignal ? <div className="context-banner">{exec.historySignal}</div> : null}
        {exec.reasoningText ? <ReasoningPanel text={exec.reasoningText} /> : null}
        <MarkdownMessage text={exec.output} />
        <GeneratedArtifactsPanel exec={exec} compact={compact} />
      </div>
      {!compact ? <TransparencyPanel exec={exec} open={open} onToggle={() => setOpen((value) => !value)} /> : null}
    </div>
  );
}

export function HistorySection({ execs, open, onToggle }) {
  const [openItems, setOpenItems] = useState({});

  return (
    <div className="history-section">
      <button className="history-toggle" onClick={onToggle}>
        <span>Ver histórico da missão ({execs.length} execuções)</span>
        <span>{open ? "▴" : "▾"}</span>
      </button>
      {open ? [...execs].reverse().map((exec, index) => {
        const key = exec.id || `${exec.ts}-${index}`;
        const itemOpen = openItems[key];
        return (
          <div className="history-item" key={key}>
            <button className="history-item-header" onClick={() => setOpenItems((current) => ({ ...current, [key]: !itemOpen }))}>
              <span>
                Execucao {execs.length - index} · {exec.isFreeInstruction ? "Instrucao livre" : getActionLabel(exec.acao)} · {(exec.tokens || 0).toLocaleString()} tokens · $
                {(exec.custo || 0).toFixed(4)}
              </span>
              <span>{itemOpen ? "▴" : "▾"}</span>
            </button>
            {itemOpen ? (
              <div className="history-item-body open">
                <div className="mini-label">Input</div>
                <div className="history-text muted-body">{exec.input}</div>
                <div className="mini-label">Resposta</div>
                <MarkdownMessage text={exec.output} />
                {exec.historySignal ? (
                  <>
                    <div className="mini-label">Contexto usado</div>
                    <div className="history-text muted-body">{exec.historySignal}</div>
                  </>
                ) : null}
                {exec.reasoningSummary || exec.explicacao ? (
                  <>
                    <div className="mini-label">Raciocínio técnico</div>
                    <div className="history-text muted-body">{exec.reasoningSummary || exec.explicacao}</div>
                  </>
                ) : null}
                <div className="mini-label">Modo da rodada</div>
                <div className="history-text muted-body">{exec.isFreeInstruction ? "Instrução livre" : getActionLabel(exec.acao)}</div>
                {exec.promptApplied ? (
                  <>
                    <div className="mini-label">Prompt aplicado</div>
                    <div className="history-text muted-body">{exec.promptApplied}</div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      }) : (
        <div className="history-collapsed-hint">Registro de execuções, contexto usado e raciocínio técnico da missão.</div>
      )}
    </div>
  );
}

export function MissionTokenRail({ execs, runState, flowStage, model, preservedUsage, tokenBudget, operationalLogs }) {
  const totals = execs.reduce(
    (acc, exec) => ({
      responseTotal: acc.responseTotal + (exec.tokens || 0),
      responseInput: acc.responseInput + (exec.inputTokens || 0),
      responseOutput: acc.responseOutput + (exec.outputTokens || 0),
      responseCost: acc.responseCost + (exec.custo || 0),
      analysisTotal: acc.analysisTotal + (exec.technicalAnalysisUsage?.totalTokens || 0),
      analysisInput: acc.analysisInput + (exec.technicalAnalysisUsage?.inputTokens || 0),
      analysisOutput: acc.analysisOutput + (exec.technicalAnalysisUsage?.outputTokens || 0),
      analysisCost: acc.analysisCost + (exec.technicalAnalysisUsage?.cost || 0),
    }),
    { responseTotal: 0, responseInput: 0, responseOutput: 0, responseCost: 0, analysisTotal: 0, analysisInput: 0, analysisOutput: 0, analysisCost: 0 },
  );
  const liveOutput = runState?.displayedOutput || "";
  const liveOutputTokens = liveOutput ? Math.max(0, Math.round(liveOutput.length / 3.8)) : 0;
  const currentRun = runState
    ? {
        responseInput: runState.inputTokens || 0,
        responseOutput: runState.outputTokens || liveOutputTokens,
        responseTotal: (runState.inputTokens || 0) + (runState.outputTokens || liveOutputTokens),
        responseCost: runState.custo || 0,
        analysisInput: 0,
        analysisOutput: 0,
        analysisTotal: 0,
        analysisCost: 0,
      }
    : execs.length
      ? {
          responseInput: execs[execs.length - 1].inputTokens || 0,
          responseOutput: execs[execs.length - 1].outputTokens || 0,
          responseTotal: execs[execs.length - 1].tokens || 0,
          responseCost: execs[execs.length - 1].custo || 0,
          analysisInput: execs[execs.length - 1].technicalAnalysisUsage?.inputTokens || 0,
          analysisOutput: execs[execs.length - 1].technicalAnalysisUsage?.outputTokens || 0,
          analysisTotal: execs[execs.length - 1].technicalAnalysisUsage?.totalTokens || 0,
          analysisCost: execs[execs.length - 1].technicalAnalysisUsage?.cost || 0,
        }
      : { responseInput: 0, responseOutput: 0, responseTotal: 0, responseCost: 0, analysisInput: 0, analysisOutput: 0, analysisTotal: 0, analysisCost: 0 };
  const combinedTotals = {
    responseTotal: totals.responseTotal + (preservedUsage?.total || 0),
    responseInput: totals.responseInput + (preservedUsage?.input || 0),
    responseOutput: totals.responseOutput + (preservedUsage?.output || 0),
    responseCost: totals.responseCost + (preservedUsage?.cost || 0),
    analysisTotal: totals.analysisTotal + (preservedUsage?.explanationTotal || 0),
    analysisInput: totals.analysisInput + (preservedUsage?.explanationInput || 0),
    analysisOutput: totals.analysisOutput + (preservedUsage?.explanationOutput || 0),
    analysisCost: totals.analysisCost + (preservedUsage?.explanationCost || 0),
  };
  const grandTotalTokens = combinedTotals.responseTotal + combinedTotals.analysisTotal;
  const grandTotalCost = combinedTotals.responseCost + combinedTotals.analysisCost;

  return (
    <aside className="token-rail">
      <div className="tokens-panel token-rail-panel">
        <div className="tokens-panel-header">
          <div className="tokens-panel-title">Uso de tokens</div>
          <div className="muted-mini">{execs.length} execuções</div>
        </div>
        <div className="token-rail-status">
          <div className="token-rail-stage">{flowStage.replaceAll("_", " ")}</div>
          <div className="token-rail-model">{model}</div>
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Limite da missão</div>
          <div className="token-rail-summary">
            <div className="token-summary-item token-summary-primary">
              <span>Uso do participante</span>
              <strong>{tokenBudget?.usage.totalTokens?.toLocaleString?.("pt-BR") || "0"} tok</strong>
            </div>
            <div className="token-summary-item">
              <span>Limite efetivo</span>
              <strong>{formatTokenLimitLabel(tokenBudget?.effectiveLimit ?? null)}</strong>
            </div>
            <div className="token-summary-item">
              <span>Tokens liberados</span>
              <strong>{(tokenBudget?.extraTokens || 0).toLocaleString("pt-BR")} tok</strong>
            </div>
          </div>
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Totais acumulados</div>
          <div className="token-rail-summary">
            <div className="token-summary-item token-summary-primary">
              <span>Total geral</span>
              <strong>{grandTotalTokens.toLocaleString()} tok</strong>
            </div>
            <div className="token-summary-item">
              <span>Resposta principal</span>
              <strong>{combinedTotals.responseTotal.toLocaleString()} tok</strong>
            </div>
            <div className="token-summary-item">
              <span>Explicação técnica</span>
              <strong>{combinedTotals.analysisTotal.toLocaleString()} tok</strong>
            </div>
            <div className="token-summary-item token-summary-cost">
              <span>Custo total</span>
              <strong>${grandTotalCost.toFixed(4)}</strong>
            </div>
          </div>
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Última rodada</div>
          <div className="token-rail-summary">
            <div className="token-summary-item">
              <span>Resposta principal</span>
              <strong>{currentRun.responseTotal.toLocaleString()} tok · ${currentRun.responseCost.toFixed(4)}</strong>
            </div>
            <div className="token-summary-item">
              <span>Explicação técnica</span>
              <strong>{currentRun.analysisTotal.toLocaleString()} tok · ${currentRun.analysisCost.toFixed(4)}</strong>
            </div>
          </div>
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Histórico operacional</div>
          {operationalLogs?.length ? (
            <div className="token-log-list">
              {[...operationalLogs].reverse().map((log) => (
                <div className="token-log-item" key={log.id}>
                  <div className="token-log-head">
                    <strong>{log.message}</strong>
                    <span>{formatDateTime(log.createdAt)}</span>
                  </div>
                  {log.detail ? <div className="token-log-meta"><span>{log.detail}</span></div> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="muted-body">Nenhum registro operacional ainda.</div>
          )}
        </div>
        <div className="token-rail-block">
          <div className="token-rail-label">Log de execuções</div>
          {execs.length ? (
            <div className="token-log-list">
              {[...execs].reverse().map((exec, index) => (
                <div className="token-log-item" key={exec.id || `${exec.ts}-${index}`}>
                  <div className="token-log-head">
                    <strong>Rodada {exec.iterationNumber || execs.length - index}</strong>
                    <span>{exec.isFreeInstruction ? "Instrução livre" : getActionLabel(exec.acao)}</span>
                  </div>
                  <div className="token-log-meta">
                    <span>resposta {(exec.tokens || 0).toLocaleString()} tok</span>
                    <span>in {(exec.inputTokens || 0).toLocaleString()}</span>
                    <span>out {(exec.outputTokens || 0).toLocaleString()}</span>
                    <span>${(exec.custo || 0).toFixed(4)}</span>
                  </div>
                  <div className="token-log-meta">
                    <span>explicação {(exec.technicalAnalysisUsage?.totalTokens || 0).toLocaleString()} tok</span>
                    <span>in {(exec.technicalAnalysisUsage?.inputTokens || 0).toLocaleString()}</span>
                    <span>out {(exec.technicalAnalysisUsage?.outputTokens || 0).toLocaleString()}</span>
                    <span>${(exec.technicalAnalysisUsage?.cost || 0).toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted-body">Nenhuma execução ainda.</div>
          )}
        </div>
      </div>
    </aside>
  );
}

export function ReflectionSummary({ reflexao }) {
  return (
    <div className="card reflection-summary">
      <div className="reflection-summary-title">Reflexao enviada</div>
      {reflexao.missionName ? <div className="reflection-summary-mission">{reflexao.missionName}</div> : null}
      {Object.entries(reflexao.respostas || {}).map(([key, value]) => (
        <div className="reflection-row" key={key}>
          <span className="muted-body">{getReflectionTopicLabel(key)}</span>
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map((score) => (
              <span className="star" key={score}>
                {score <= value ? "✦" : "✧"}
              </span>
            ))}
          </div>
        </div>
      ))}
      {reflexao.comment ? (
        <div className="reflection-comment">
          <div className="mini-label">Observação geral</div>
          <div className="muted-body">{reflexao.comment}</div>
        </div>
      ) : null}
    </div>
  );
}
