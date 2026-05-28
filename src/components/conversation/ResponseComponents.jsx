import { forwardRef, useState, useEffect, useRef, useCallback, useImperativeHandle } from "react";
import MarkdownMessage from "../../MarkdownMessage.jsx";

export function ProcessingPipeline({ processingSteps }) {
  return (
    <div className="processing-pipeline">
      {processingSteps.map((step) => (
        <div className={`processing-step ${step.status}`} key={step.key}>
          <span className="processing-dot" />
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

export function TransparencyPanel({ exec, open, onToggle, forceOpen = false }) {
  const details = exec.reasoningDetails || null;
  const promptText = exec.promptApplied || details?.promptApplied || exec.acao || "Sem ação";

  if (!details && !exec.explicacao) return null;

  return (
    <div className="explain-section">
      {!forceOpen ? (
        <button className="explain-toggle" onClick={onToggle}>
          Como a IA pensou esta missão {open ? "▴" : "▾"}
        </button>
      ) : null}
      {open ? (
        <div className="explain-body open">
          {details?.sourceLabel ? (
            <div className="source-chip">{details.sourceLabel}</div>
          ) : null}
          {details?.historySignal || exec.historySignal ? (
            <div className="context-banner">{details?.historySignal || exec.historySignal}</div>
          ) : null}
          <div>
            <div className="explain-block-label">Como a IA operou aqui</div>
            <div className="explain-block-text">{details?.mechanismSummary || details?.summary || exec.reasoningSummary || exec.explicacao}</div>
          </div>
          {details?.technicalTerms?.length ? (
            <div>
              <div className="explain-block-label">Termos técnicos usados</div>
              <div className="concept-pill-row">
                {details.technicalTerms.map((item, index) => (
                  <span className="concept-pill" key={`${item.term}-${index}`}>
                    {item.term}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <div className="explain-block-label">Por que saiu essa resposta</div>
            <div className="explain-block-text">{details?.whyThisAnswer || details?.strategy || exec.explicacao}</div>
          </div>
          <div>
            <div className="explain-block-label">O que guiou a selecao</div>
            <div className="explain-block-text">{details?.selectionLogic || details?.actionInfluence || exec.acao || "Sem ação."}</div>
          </div>
          {details?.alternativeAnswerPaths?.length ? (
            <div>
              <div className="explain-block-label">Outras respostas plausíveis</div>
              <div className="takeaway-list">
                {details.alternativeAnswerPaths.map((item, index) => (
                  <div className="takeaway-item" key={`${item}-${index}`}>
                    <span className="takeaway-bullet">{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {details?.howToAskBetter?.length ? (
            <div>
              <div className="explain-block-label">Como pedir melhor</div>
              <div className="takeaway-list">
                {details.howToAskBetter.map((item, index) => (
                  <div className="takeaway-item" key={`${item}-${index}`}>
                    <span className="takeaway-bullet">{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <div className="explain-block-label">Limites e suposições</div>
            <div className="explain-block-text">{details?.limitations || "Sem observações adicionais."}</div>
          </div>
          <div>
            <div className="explain-block-label">Prompt aplicado</div>
            <div className="prompt-preview">{promptText}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ReasoningPanel({ text, live = false }) {
  const [open, setOpen] = useState(live);
  const [userToggled, setUserToggled] = useState(false);

  useEffect(() => {
    if (!userToggled) setOpen(live);
  }, [live, userToggled]);

  if (!text) return null;

  return (
    <div className={`reasoning-panel${live ? " is-live" : ""}`}>
      <button
        type="button"
        className="reasoning-toggle"
        onClick={() => {
          setUserToggled(true);
          setOpen((value) => !value);
        }}
      >
        {live ? (
          <span className="thinking-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : null}
        <span className="reasoning-toggle-label">{live ? "Pensando" : "Raciocínio"}</span>
        <span className="reasoning-toggle-caret">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div className="reasoning-body">
          <MarkdownMessage text={text} />
        </div>
      ) : null}
    </div>
  );
}

export function ThinkingIndicator({ label = "Pensando" }) {
  return (
    <div className="thinking-indicator" role="status" aria-live="polite">
      <span className="thinking-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="thinking-label">{label}</span>
    </div>
  );
}

export function LiveRunCard({ runState }) {
  return (
    <div className="output-card live-run-card">
      <div className="output-header">
        <div className="output-label">{runState.simulationMode === "openai-live" ? "OpenAI em execução" : "IA simulada em execução"}</div>
        <span className="muted-mini">
          {runState.simulationMode === "openai-live" ? "chamada real em andamento" : "simulação local com streaming"}
        </span>
      </div>
      <div className="output-body">
        <ProcessingPipeline processingSteps={runState.processingSteps} />
        {runState.usedHistory ? <div className="context-banner">Esta nova resposta está considerando o histórico anterior desta missão.</div> : null}
        <div className="output-text output-text-live">
          {runState.displayedOutput || (runState.simulationMode === "openai-live" ? "Aguardando retorno da OpenAI..." : "Preparando resposta da IA...")}
          <span className="streaming-cursor" />
        </div>
      </div>
    </div>
  );
}

export function AttachmentList({ attachments = [] }) {
  if (!attachments.length) return null;
  return (
    <div className="prompt-attachment-list">
      {attachments.map((attachment) => (
        <div className={`prompt-attachment-chip is-${attachment.kind}`} key={attachment.id}>
          <span>{attachment.name}</span>
          <small>{attachment.sizeLabel}</small>
        </div>
      ))}
    </div>
  );
}

export const LiveAnswer = forwardRef(function LiveAnswer({ simulationMode, onUpdate }, ref) {
  const [answer, setAnswer] = useState("");
  const [reasoning, setReasoning] = useState("");

  useImperativeHandle(
    ref,
    () => ({
      pushAnswer: (text) => setAnswer(text),
      pushReasoning: (text) => setReasoning(text),
      reset: () => {
        setAnswer("");
        setReasoning("");
      },
    }),
    [],
  );

  useEffect(() => {
    onUpdate?.();
  }, [answer, reasoning, onUpdate]);

  return (
    <>
      {reasoning ? <ReasoningPanel text={reasoning} live={!answer} /> : null}
      {answer ? (
        <>
          <MarkdownMessage text={answer} />
          <span className="streaming-cursor" />
        </>
      ) : !reasoning ? (
        <ThinkingIndicator label={simulationMode === "openai-live" ? "Pensando" : "Preparando resposta"} />
      ) : null}
    </>
  );
});

export function ComposerResponseInline({ exec, runState, onOpenExplanation }) {
  const isRunning = Boolean(runState);
  const responseContent = isRunning ? (runState?.displayedOutput || "") : (exec?.output || "");
  const reasoningText = isRunning ? (runState?.reasoningText || "") : (exec?.reasoningText || "");
  const thinkingLabel = runState?.simulationMode === "openai-live" ? "Pensando" : "Preparando resposta";

  if (!isRunning && !exec) return null;

  return (
    <div className="prompt-composer-response">
      <div className="prompt-composer-response-head">
        <div className="output-label">{isRunning ? "Resposta em andamento" : "Resposta desta rodada"}</div>
        <span className="muted-mini">
          {isRunning
            ? runState?.simulationMode === "openai-live"
              ? "OpenAI em execução"
              : "IA simulada em execução"
            : `${exec?.acao || "-"} · ${exec?.tokens?.toLocaleString() || 0} tokens`}
        </span>
      </div>
      <div className="prompt-composer-response-body">
        {isRunning && runState?.processingSteps?.length ? <ProcessingPipeline processingSteps={runState.processingSteps} /> : null}
        {(runState?.usedHistory || exec?.historySignal) ? (
          <div className="context-banner">
            {isRunning && runState?.usedHistory ? "Esta nova resposta está considerando o histórico anterior desta missão." : exec?.historySignal}
          </div>
        ) : null}
        {reasoningText ? <ReasoningPanel text={reasoningText} live={isRunning && !responseContent} /> : null}
        <div className={`output-text${isRunning ? " output-text-live" : ""}`}>
          {responseContent ? (
            <>
              <MarkdownMessage text={responseContent} />
              {isRunning ? <span className="streaming-cursor" /> : null}
            </>
          ) : (
            isRunning && !reasoningText ? <ThinkingIndicator label={thinkingLabel} /> : null
          )}
        </div>
        {!isRunning && exec && onOpenExplanation ? (
          <div className="prompt-composer-response-actions">
            <button className="btn btn-primary btn-sm" onClick={onOpenExplanation}>
              Abrir explicação técnica
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
