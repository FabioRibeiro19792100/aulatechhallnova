import { useRef, useCallback, useEffect } from "react";
import { Copy } from "lucide-react";
import MarkdownMessage from "../../MarkdownMessage.jsx";
import { getActionLabel } from "../../utils.js";
import { AttachmentList, ReasoningPanel, ProcessingPipeline, LiveAnswer, OperationalStepsPanel, SourceListPanel } from "./ResponseComponents.jsx";
import { GeneratedArtifactsPanel } from "./ArtifactComponents.jsx";

export function PromptConversation({ execs, pendingPrompt, pendingAttachments = [], runState, liveAnswerRef, onCopyResponse, planningApproval, onApprovePlanning, onAdjustPlanning }) {
  const hasHistory = execs.length > 0;
  const hasPending = Boolean(runState && (pendingPrompt.trim() || pendingAttachments.length));
  const threadRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    const node = threadRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [execs.length, hasPending, planningApproval?.open, scrollToBottom]);

  return (
    <div className={`prompt-thread${!hasHistory && !hasPending ? " is-empty" : ""}`} ref={threadRef}>
      {execs.map((exec, index) => {
        const key = exec.id || exec.ts || `exec-${index}`;
        const guidedCodex = exec.aiMode === "coding" && Boolean(exec.behaviorOptions?.guidedMode);
        return (
          <div className="prompt-thread-turn" key={key}>
            <div className="prompt-thread-bubble is-user">
              <div className="prompt-thread-meta">
                <span>Você</span>
                <span>{exec.isFreeInstruction ? "Instrução livre" : getActionLabel(exec.acao)}</span>
              </div>
              {exec.input ? <div className="prompt-thread-text">{exec.input}</div> : null}
              <AttachmentList attachments={exec.attachments || []} />
            </div>
            <div className="prompt-thread-bubble is-assistant">
              <div className="prompt-thread-meta">
                <span>IA</span>
                <span>{exec.tokens?.toLocaleString() || 0} tokens</span>
              </div>
              {exec.historySignal ? <div className="context-banner">{exec.historySignal}</div> : null}
              {guidedCodex ? (
                <OperationalStepsPanel text={exec.reasoningText} />
              ) : exec.reasoningText ? (
                <ReasoningPanel text={exec.reasoningText} />
              ) : null}
              <MarkdownMessage text={exec.output} />
              {exec.webSearchUsed || exec.citations?.length ? (
                <SourceListPanel citations={exec.citations || []} used={Boolean(exec.webSearchUsed)} />
              ) : null}
              <GeneratedArtifactsPanel exec={exec} compact />
              <div className="prompt-thread-response-actions">
                <button
                  className="icon-copy-btn prompt-thread-copy-btn"
                  type="button"
                  aria-label="Copiar resposta"
                  title="Copiar resposta"
                  onClick={() => onCopyResponse?.(exec.output || "")}
                >
                  <Copy size={13} strokeWidth={1.9} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {hasPending ? (
        <div className="prompt-thread-turn is-pending">
          <div className="prompt-thread-bubble is-user">
            <div className="prompt-thread-meta">
              <span>Você</span>
              <span>{runState?.selectedActionLabel || "Nova rodada"}</span>
            </div>
            {pendingPrompt.trim() ? <div className="prompt-thread-text">{pendingPrompt}</div> : null}
            <AttachmentList attachments={pendingAttachments} />
          </div>
          <div className="prompt-thread-bubble is-assistant">
            <div className="prompt-thread-meta">
              <span>IA</span>
              <span>{runState?.simulationMode === "openai-live" ? "OpenAI em execução" : "IA simulada em execução"}</span>
            </div>
            {runState?.simulationMode !== "openai-live" && runState?.processingSteps?.length ? (
              <ProcessingPipeline processingSteps={runState.processingSteps} />
            ) : null}
            {runState?.usedHistory ? (
              <div className="context-banner">Esta nova resposta está considerando o histórico anterior desta missão.</div>
            ) : null}
            {runState?.aiMode === "coding" && runState?.behaviorOptions?.guidedMode ? (
              <OperationalStepsPanel text={runState?.reasoningText || ""} live />
            ) : null}
            <div className="prompt-thread-text is-live">
              <LiveAnswer
                ref={liveAnswerRef}
                simulationMode={runState?.simulationMode}
                onUpdate={scrollToBottom}
                showReasoningPanel={!(runState?.aiMode === "coding" && runState?.behaviorOptions?.guidedMode)}
              />
            </div>
          </div>
        </div>
      ) : null}

      {planningApproval?.open ? (
        <div className="planning-approval-card">
          <div className="planning-approval-header">
            <span className="planning-approval-badge">Plano pronto</span>
            <span className="planning-approval-desc">
              Revise o plano acima e escolha como prosseguir.
            </span>
          </div>
          <div className="planning-approval-actions">
            <button className="btn planning-approval-btn-adjust" type="button" onClick={onAdjustPlanning}>
              Reformular pedido
            </button>
            <button className="btn btn-primary planning-approval-btn-accept" type="button" onClick={onApprovePlanning}>
              Aceitar e executar
            </button>
          </div>
        </div>
      ) : null}

      {!hasHistory && !hasPending ? <div className="prompt-thread-empty-spacer" aria-hidden="true" /> : null}
    </div>
  );
}
