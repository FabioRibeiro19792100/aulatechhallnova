import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  ExternalLink,
  FileText,
  Maximize2,
  Minus,
  Paperclip,
  Presentation,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import ragDeckHtml from "../../assets/mission-decks/rag-onboarding.html?raw";
import agentDeckHtml from "../../assets/mission-decks/agentes-onboarding.html?raw";
import {
  AGENT_MISSION_ID,
  CORPORATE_DOC_URL,
  FINE_TUNING_CASE,
  GUIDED_DECK_STATUS,
  RAG_MISSION_ID,
  RAG_READABLE_DOCUMENTS,
  getGuidedMissionScript,
  getGuidedMissionStepContent,
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

function extractOptionReply(optionNode) {
  return `${optionNode?.textContent || ""}`.replace(/\s+/g, " ").trim();
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
  onGoToGeneralChat,
}) {
  const threadRef = useRef(null);
  const fileInputRef = useRef(null);
  const [openDoc, setOpenDoc] = useState(null);
  const script = useMemo(() => getGuidedMissionScript(mission.id), [mission.id]);
  const scriptIndex = Math.max(0, Math.min(Number(missionState?.scriptIndex || 0), script.length - 1));
  const currentStep = getGuidedMissionStepContent(mission.id, scriptIndex, missionState, attachments) || script[scriptIndex] || script[0];
  const responses = missionState?.responses || {};
  const isCompleted = Boolean(missionState?.completed || currentStep?.done);
  const isRag = mission.id === RAG_MISSION_ID;
  const deckVisible =
    typeof missionState?.deckVisible === "boolean"
      ? missionState.deckVisible
      : missionState?.deckStatus === GUIDED_DECK_STATUS.NOT_STARTED;
  const deckMode =
    missionState?.deckMode || (missionState?.deckStatus === GUIDED_DECK_STATUS.NOT_STARTED ? "overlay" : "pip");

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

  function patch(nextPartialOrUpdater) {
    onChangeState((currentMissionState = {}) => {
      if (typeof nextPartialOrUpdater === "function") {
        return nextPartialOrUpdater(currentMissionState);
      }
      return {
        ...currentMissionState,
        ...nextPartialOrUpdater,
      };
    });
  }

  function finalizeMission(nextIndex, nextResponses) {
    const finalStep =
      getGuidedMissionStepContent(mission.id, nextIndex, missionState, attachments) ||
      script[nextIndex] ||
      script[script.length - 1];
    const report = extractReport(finalStep?.ai || "") || missionState?.report || "";
    const nowIso = new Date().toISOString();
    const shouldPersist = !missionState?.persistedAt && Boolean(onPersistExecution);
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
      generatedAt: nowIso,
      persistedAt: missionState?.persistedAt || (shouldPersist ? nowIso : null),
    };
    if (shouldPersist) {
      onPersistExecution({
        id: `${mission.id}_${Date.now()}`,
        ts: nowIso,
        aiMode: mission.aiMode,
        acao: "guided_mission",
        input: "INICIAR_MISSAO",
        output: `${stripHtml(finalStep?.ai || "")} ${report ? `\n\n${report}` : ""}`.trim(),
        tokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        custo: 0,
        missionReport: report,
        missionGuidedState: nextState,
        participantName,
        attachments,
      });
    }
    patch(nextState);
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
    const nextStep =
      getGuidedMissionStepContent(mission.id, nextIndex, { ...missionState, responses: nextResponses }, attachments) ||
      script[nextIndex] ||
      currentStep;
    if (nextStep?.done) {
      finalizeMission(nextIndex, nextResponses);
      return;
    }
    patch((currentMissionState = {}) => ({
      ...currentMissionState,
      started: true,
      deckStatus:
        currentMissionState?.deckStatus === GUIDED_DECK_STATUS.NOT_STARTED
          ? GUIDED_DECK_STATUS.COMPLETED
          : currentMissionState?.deckStatus || GUIDED_DECK_STATUS.COMPLETED,
      scriptIndex: nextIndex,
      step: `E${Math.min(nextIndex, 10)}`,
      responses: nextResponses,
    }));
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
    handleAdvance(extractOptionReply(option));
  }

  const transcript = [];
  for (let index = 0; index < script.length; index += 1) {
    const step = script[index];
    if (index < scriptIndex || (isCompleted && index <= scriptIndex)) {
      const renderedStep = getGuidedMissionStepContent(mission.id, index, missionState, attachments) || step;
      transcript.push({ type: "assistant", step: renderedStep, index });
      const reply = responses[index] ?? step.user;
      if (reply && !step.done) {
        transcript.push({ type: "user", reply, index });
      }
      continue;
    }
    if (index === scriptIndex && !isCompleted) {
      const renderedStep = getGuidedMissionStepContent(mission.id, index, missionState, attachments) || step;
      transcript.push({ type: "assistant", step: renderedStep, index, current: true });
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
            patch((currentMissionState = {}) => ({
              ...currentMissionState,
              deckVisible: false,
              deckMode: "pip",
              deckStatus:
                currentMissionState?.deckStatus === GUIDED_DECK_STATUS.NOT_STARTED
                  ? GUIDED_DECK_STATUS.DISMISSED
                  : currentMissionState?.deckStatus,
            }));
          }}
          onComplete={() => {
            patch((currentMissionState = {}) => ({
              ...currentMissionState,
              deckVisible: false,
              deckMode: "pip",
              deckStatus: GUIDED_DECK_STATUS.COMPLETED,
              started: true,
            }));
          }}
          onExpand={() =>
            patch((currentMissionState = {}) => ({
              ...currentMissionState,
              deckVisible: true,
              deckMode: "overlay",
            }))
          }
          onMinimize={() => {
            patch((currentMissionState = {}) => ({
              ...currentMissionState,
              deckVisible: false,
              deckMode: "pip",
            }));
          }}
        />
      ) : null}

      {!deckVisible && missionState?.deckStatus !== GUIDED_DECK_STATUS.NOT_STARTED ? (
        <div className="guided-corner-actions">
          {isRag ? (
            <a
              className="guided-corner-link"
              href={CORPORATE_DOC_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} strokeWidth={1.8} />
              <span>Documento corporativo · Manual de Governança · NexaLog</span>
            </a>
          ) : null}
          <button
            type="button"
            className="guided-deck-launcher"
            onClick={() => {
              patch((currentMissionState = {}) => ({
                ...currentMissionState,
                deckVisible: true,
                deckMode: "pip",
              }));
            }}
          >
            <span className="guided-deck-launcher-icon" aria-hidden="true">
              <Presentation size={16} strokeWidth={1.9} />
            </span>
            <small>{isRag ? "RAG" : "Agente"}</small>
          </button>
        </div>
      ) : null}

      {isRag && openDoc ? (
        <div className="doc-viewer-modal" role="dialog" aria-modal="true" aria-label={`Documento ${openDoc.name}`}>
          <div className="doc-viewer-backdrop" onClick={() => setOpenDoc(null)} />
          <div className="doc-viewer-shell">
            <div className="doc-viewer-head">
              <h3>{openDoc.name}</h3>
              <button type="button" className="doc-viewer-close" onClick={() => setOpenDoc(null)} aria-label="Fechar">
                <X size={16} strokeWidth={1.9} />
              </button>
            </div>
            <pre className={openDoc.kind === "jsonl" ? "doc-viewer-body is-mono" : "doc-viewer-body"}>{openDoc.text}</pre>
          </div>
        </div>
      ) : null}

      <div className="input-card input-card-chat">
        <div className="prompt-composer">
          {isRag ? (
            <div className="guided-docs-strip">
              <span className="guided-docs-strip-label">Base de conhecimento</span>
              {RAG_READABLE_DOCUMENTS.map((doc) => {
                const chipKind = doc.kind === "jsonl" ? "is-jsonl" : "is-md";
                return (
                  <button
                    type="button"
                    key={`pack-${doc.name}`}
                    className={`guided-doc-chip ${chipKind}`}
                    title={doc.name}
                    onClick={() => setOpenDoc({ name: doc.name, text: doc.text, kind: doc.kind || "md" })}
                  >
                    <FileText size={12} strokeWidth={1.9} />
                    <span>{doc.label || doc.name}</span>
                  </button>
                );
              })}
              {attachments
                .filter((attachment) => attachment?.extractedText)
                .map((attachment) => (
                  <button
                    type="button"
                    key={`anexo-${attachment.id}`}
                    className="guided-doc-chip is-anexo"
                    onClick={() =>
                      setOpenDoc({
                        name: attachment.name,
                        text: attachment.extractedText,
                        kind: "anexo",
                      })
                    }
                  >
                    <Paperclip size={12} strokeWidth={1.9} />
                    <span>{attachment.name}</span>
                  </button>
                ))}
            </div>
          ) : null}
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
            {isRag && isCompleted ? (
              <section className="finetuning-panel">
                <div className="finetuning-panel-kicker">Conclusão da experiência</div>
                <h3 className="finetuning-panel-title">{FINE_TUNING_CASE.title}</h3>
                <p className="finetuning-panel-lead">{FINE_TUNING_CASE.intro}</p>
                <p className="finetuning-panel-when">{FINE_TUNING_CASE.whenToUse}</p>
                <div className="finetuning-case">
                  {FINE_TUNING_CASE.caseBlocks.map((block) => (
                    <div className="finetuning-case-block" key={block.label}>
                      <div className="finetuning-case-block-label">{block.label}</div>
                      <p>{block.text}</p>
                    </div>
                  ))}
                </div>
                <div className="finetuning-cta">
                  <p>
                    Pense num caso do seu dia a dia — um documento, um contrato, um relatório, uma decisão — e teste na missão <b>Análise geral</b>.
                  </p>
                  <button
                    type="button"
                    className="finetuning-cta-btn"
                    onClick={() => onGoToGeneralChat?.()}
                  >
                    Ir para Análise geral →
                  </button>
                </div>
              </section>
            ) : null}
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
                    patch((currentMissionState = {}) => ({
                      ...currentMissionState,
                      deckVisible: true,
                      deckMode: "pip",
                    }));
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
