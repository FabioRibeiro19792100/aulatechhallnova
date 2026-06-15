import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Maximize2, Minus, Paperclip, RotateCcw, Send, X } from "lucide-react";
import ragDeckHtml from "../../assets/mission-decks/rag-onboarding.html?raw";
import agentDeckHtml from "../../assets/mission-decks/agentes-onboarding.html?raw";
import {
  AGENT_MISSION_ID,
  GUIDED_DECK_STATUS,
  RAG_MISSION_ID,
  getGuidedMissionScript,
} from "../../data/guidedMissions.js";

function stripHtml(html = "") {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const root = document.createElement("div");
  root.innerHTML = html;
  return root.textContent?.replace(/\s+/g, " ").trim() || "";
}

function extractReport(html = "") {
  const blocks = [...html.matchAll(/<pre>([\s\S]*?)<\/pre>/g)].map((match) => match[1].trim());
  return blocks.find((block) => block.includes("RELATORIO DA MISSAO")) || "";
}

function extractStepLabel(step = {}, index = 0) {
  if (step.done) return "Encerramento";
  const match = `${step.tech?.s || ""}`.match(/etapa\s+(\d+)\s+de\s+10\s+·\s+(.+)/i);
  if (match) return `Etapa ${match[1]} · ${match[2]}`;
  return `Etapa ${index + 1}`;
}

function GuidedMissionDeck({ missionId, mode = "overlay", onDismiss, onComplete, onExpand, onMinimize }) {
  const deckHtml = missionId === RAG_MISSION_ID ? ragDeckHtml : agentDeckHtml;

  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === "rag:start" && missionId === RAG_MISSION_ID) onComplete();
      if (event.data?.type === "agentes:start" && missionId === AGENT_MISSION_ID) onComplete();
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [missionId, onComplete]);

  return (
    <div
      className={`guided-deck-overlay guided-deck-overlay-${mode}`}
      role="dialog"
      aria-modal={mode === "overlay" ? "true" : "false"}
      aria-label="Onboarding da missão"
    >
      {mode === "overlay" ? <div className="guided-deck-backdrop" onClick={onDismiss} /> : null}
      <div className={`guided-deck-shell guided-deck-shell-${mode}`}>
        <div className="guided-deck-actions">
          {mode !== "overlay" ? (
            <button type="button" className="guided-deck-control" onClick={onExpand} aria-label="Expandir apresentação">
              <Maximize2 size={16} strokeWidth={1.8} />
            </button>
          ) : null}
          {mode !== "minimized" ? (
            <button type="button" className="guided-deck-control" onClick={onMinimize} aria-label="Minimizar apresentação">
              <Minus size={16} strokeWidth={2.1} />
            </button>
          ) : null}
        </div>
        <button type="button" className="guided-deck-close" onClick={onDismiss} aria-label="Pular apresentação">
          <X size={18} strokeWidth={1.8} />
        </button>
        {mode === "pip" ? (
          <div className="guided-deck-pip-viewport">
            <div className="guided-deck-pip-canvas">
              <iframe className="guided-deck-frame" title="Deck da missão" srcDoc={deckHtml} />
            </div>
          </div>
        ) : (
          <iframe className="guided-deck-frame" title="Deck da missão" srcDoc={deckHtml} />
        )}
      </div>
    </div>
  );
}

export function GuidedMissionPanel({
  mission,
  participantName,
  missionState,
  composerInput,
  attachments = [],
  attachmentLimit = 3,
  attachmentAccept = ".txt,.md,.pdf",
  onInputChange,
  onAttachFiles,
  onRemoveAttachment,
  onChangeState,
  onPersistExecution,
  onCopyReport,
  onResetMission,
}) {
  const threadRef = useRef(null);
  const fileInputRef = useRef(null);
  const [deckVisible, setDeckVisible] = useState(missionState?.deckStatus === GUIDED_DECK_STATUS.NOT_STARTED);
  const [deckMode, setDeckMode] = useState(missionState?.deckStatus === GUIDED_DECK_STATUS.NOT_STARTED ? "overlay" : "pip");
  const script = useMemo(() => getGuidedMissionScript(mission.id), [mission.id]);
  const scriptIndex = Math.max(0, Math.min(Number(missionState?.scriptIndex || 0), script.length - 1));
  const currentStep = script[scriptIndex] || script[0];
  const responses = missionState?.responses || {};
  const isCompleted = Boolean(missionState?.completed || currentStep?.done);
  const isRag = mission.id === RAG_MISSION_ID;

  useEffect(() => {
    if (missionState?.deckStatus === GUIDED_DECK_STATUS.NOT_STARTED) {
      setDeckVisible(true);
      setDeckMode("overlay");
    }
  }, [missionState?.deckStatus]);

  useEffect(() => {
    if (isCompleted) return;
    const suggested = responses[scriptIndex] ?? currentStep?.user ?? "";
    if (suggested && composerInput !== suggested) {
      onInputChange(suggested);
    }
  }, [composerInput, currentStep?.user, isCompleted, onInputChange, responses, scriptIndex]);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  }, [scriptIndex, isCompleted]);

  function patch(nextPartial) {
    onChangeState({
      ...missionState,
      ...nextPartial,
    });
  }

  function finalizeMission(nextIndex, nextResponses) {
    const finalStep = script[nextIndex] || script[script.length - 1];
    const report = extractReport(finalStep?.ai || "") || missionState?.report || "";
    const nextState = {
      ...missionState,
      started: true,
      deckStatus:
        missionState?.deckStatus === GUIDED_DECK_STATUS.NOT_STARTED
          ? GUIDED_DECK_STATUS.COMPLETED
          : missionState?.deckStatus || GUIDED_DECK_STATUS.COMPLETED,
      scriptIndex: nextIndex,
      step: `E${Math.min(nextIndex, 10)}`,
      responses: nextResponses,
      completed: true,
      report,
      generatedAt: new Date().toISOString(),
    };
    patch(nextState);
    if (!missionState?.persistedAt && onPersistExecution) {
      onPersistExecution({
        id: `${mission.id}_${Date.now()}`,
        ts: new Date().toISOString(),
        aiMode: mission.aiMode,
        acao: "guided_mission",
        input: "INICIAR_MISSAO",
        output: `${stripHtml(finalStep?.ai || "")} ${report ? `\n\n${report}` : ""}`.trim(),
        tokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        custo: 0,
        missionReport: report,
        missionGuidedState: {
          ...nextState,
          persistedAt: new Date().toISOString(),
        },
        participantName,
        attachments,
      });
    }
    patch({ ...nextState, persistedAt: new Date().toISOString() });
    onInputChange("");
  }

  function handleAdvance(forcedResponse = null) {
    if (isCompleted) return;
    const response = `${forcedResponse ?? composerInput ?? currentStep?.user ?? ""}`.trim() || `${currentStep?.user || ""}`.trim();
    if (!response) return;
    const nextResponses = {
      ...responses,
      [scriptIndex]: response,
    };
    const nextIndex = Math.min(scriptIndex + 1, script.length - 1);
    const nextStep = script[nextIndex] || currentStep;
    if (nextStep?.done) {
      finalizeMission(nextIndex, nextResponses);
      return;
    }
    patch({
      ...missionState,
      started: true,
      deckStatus:
        missionState?.deckStatus === GUIDED_DECK_STATUS.NOT_STARTED
          ? GUIDED_DECK_STATUS.COMPLETED
          : missionState?.deckStatus || GUIDED_DECK_STATUS.COMPLETED,
      scriptIndex: nextIndex,
      step: `E${Math.min(nextIndex, 10)}`,
      responses: nextResponses,
    });
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAdvance();
    }
  }

  function handleOptionClick(event) {
    const option = event.target.closest(".ops div");
    if (!option || isCompleted) return;
    handleAdvance(currentStep?.user || option.textContent || "");
  }

  const transcript = [];
  for (let index = 0; index < script.length; index += 1) {
    const step = script[index];
    if (index < scriptIndex || (isCompleted && index <= scriptIndex)) {
      transcript.push({ type: "assistant", step, index });
      const reply = responses[index] ?? step.user;
      if (reply && !step.done) {
        transcript.push({ type: "user", reply, index });
      }
      continue;
    }
    if (index === scriptIndex && !isCompleted) {
      transcript.push({ type: "assistant", step, index, current: true });
    }
    break;
  }

  const inputHint = isCompleted
    ? "Missão concluída"
    : currentStep?.user
      ? "Clique em uma opção da IA ou envie a resposta sugerida."
      : "Aguardando próximo passo da missão.";

  return (
    <>
      {deckVisible ? (
        <GuidedMissionDeck
          missionId={mission.id}
          mode={deckMode}
          onDismiss={() => {
            setDeckVisible(false);
            patch({
              ...missionState,
              deckStatus: missionState?.deckStatus === GUIDED_DECK_STATUS.NOT_STARTED ? GUIDED_DECK_STATUS.DISMISSED : missionState?.deckStatus,
            });
          }}
          onComplete={() => {
            setDeckVisible(false);
            patch({
              ...missionState,
              deckStatus: GUIDED_DECK_STATUS.COMPLETED,
              started: true,
            });
          }}
          onExpand={() => setDeckMode("overlay")}
          onMinimize={() => setDeckMode("minimized")}
        />
      ) : null}

      {!deckVisible && missionState?.deckStatus !== GUIDED_DECK_STATUS.NOT_STARTED ? (
        <button
          type="button"
          className="guided-deck-launcher"
          onClick={() => {
            setDeckMode("pip");
            setDeckVisible(true);
          }}
        >
          <span>Apresentação</span>
          <small>{isRag ? "RAG" : "Agente"}</small>
        </button>
      ) : null}

      <div className="input-card input-card-chat">
        <div className="prompt-composer">
          <div className="prompt-thread" ref={threadRef}>
            {transcript.map((entry, entryIndex) =>
              entry.type === "assistant" ? (
                <div className="prompt-thread-turn" key={`assistant-${entry.index}-${entryIndex}`}>
                  <div className="prompt-thread-bubble is-assistant">
                    <div className="prompt-thread-meta">
                      <span>Sistema</span>
                      <span>{extractStepLabel(entry.step, entry.index)}</span>
                    </div>
                    <div className="guided-script-html" onClick={entry.current ? handleOptionClick : undefined} dangerouslySetInnerHTML={{ __html: entry.step.ai }} />
                  </div>
                </div>
              ) : (
                <div className="prompt-thread-turn" key={`user-${entry.index}-${entryIndex}`}>
                  <div className="prompt-thread-bubble is-user">
                    <div className="prompt-thread-meta">
                      <span>{participantName || "Você"}</span>
                      <span>Resposta</span>
                    </div>
                    <div className="guided-user-reply">{entry.reply}</div>
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="prompt-entry-shell">
            {attachments.length ? (
              <div className="composer-attachments">
                {attachments.map((attachment) => (
                  <div className={`composer-attachment-chip is-${attachment.kind}`} key={attachment.id}>
                    <div className="composer-attachment-copy">
                      <span>{attachment.name}</span>
                      <small>{attachment.extractedText ? "texto pronto para uso" : attachment.sizeLabel}</small>
                    </div>
                    <button className="composer-attachment-remove" type="button" onClick={() => onRemoveAttachment(attachment.id)} aria-label={`Remover ${attachment.name}`}>
                      <X size={12} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <textarea
              className="prompt-entry-input"
              value={composerInput}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputHint}
              disabled={isCompleted}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={attachmentAccept}
              multiple={attachmentLimit > 1}
              className="visually-hidden-file-input"
              onChange={onAttachFiles}
            />
            <div className="input-actions input-compose-bar">
              <div className="input-compose-meta">
                {isRag ? (
                  <button
                    className="input-attach-btn"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={attachments.length >= attachmentLimit || isCompleted}
                    title={`Anexar arquivo (${attachmentLimit} por rodada)`}
                  >
                    <Paperclip size={14} strokeWidth={1.8} />
                    <span>Anexar</span>
                  </button>
                ) : null}
                <span className="input-hint">{isRag ? "Missão 3 · RAG" : "Missão 4 · Agente"}</span>
              </div>
              <div className="mission-inline-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setDeckMode("pip");
                    setDeckVisible(true);
                  }}
                >
                  Apresentação
                </button>
                <button type="button" className="btn btn-ghost" onClick={onResetMission}>
                  <RotateCcw size={14} strokeWidth={1.8} />
                  <span>Reiniciar</span>
                </button>
                {missionState?.report ? (
                  <button type="button" className="btn btn-ghost" onClick={onCopyReport}>
                    <Copy size={14} strokeWidth={1.8} />
                    <span>Copiar relatório</span>
                  </button>
                ) : null}
                <button type="button" className="input-send-btn" onClick={() => handleAdvance()} disabled={isCompleted}>
                  <Send size={16} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
