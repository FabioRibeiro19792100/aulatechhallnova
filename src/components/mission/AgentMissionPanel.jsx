import { useCallback, useEffect, useRef } from "react";
import { Mail, Waypoints, X } from "lucide-react";
import { Modal } from "../ui/Modals.jsx";
import {
  AGENT_CAPABILITY_OPTIONS,
  AGENT_COMPOSER_STEPS,
  AGENT_DATA_SOURCE_OPTIONS,
  AGENT_DEFAULT_PERMISSIONS,
  AGENT_OBJECTIVE_OPTIONS,
  AGENT_ONBOARDING_SLIDES,
  AGENT_PERMISSION_LABELS,
  AGENT_TYPE_OPTIONS,
  getAgentCapabilityLabel,
  getAgentDataSourceLabel,
  getAgentObjectiveLabel,
  getAgentPermissionLabel,
  getAgentTypeLabel,
} from "../../data/agentMission.js";

function getComposerStepLabel(step) {
  const labels = {
    type: "Tipo de agente",
    objective: "Objetivo",
    "data-source": "Fonte de dados",
    capabilities: "Capacidades",
    permissions: "Permissões",
    review: "Revisão",
  };
  return labels[step] || step;
}

function buildSlideDiagram(slide) {
  if (slide.visual?.length) {
    return (
      <div className="agent-slide-diagram">
        {slide.visual.map((item, index) => (
          <div className={`agent-slide-diagram-node${item === "↓" ? " is-arrow" : ""}`} key={`${item}-${index}`}>
            {item}
          </div>
        ))}
      </div>
    );
  }

  if (slide.bullets?.length) {
    return (
      <div className="agent-slide-bullets">
        {slide.bullets.map((item) => (
          <div className="agent-slide-bullet" key={item}>
            <span className="agent-slide-bullet-dot" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function AgentOnboardingOverlay({ state, onAdvanceSlide, onBackSlide, onJumpToComposer, onClose }) {
  const activeSlide = AGENT_ONBOARDING_SLIDES[state.slideIndex] || AGENT_ONBOARDING_SLIDES[0];
  return (
    <div className="agent-onboarding-overlay" role="dialog" aria-modal="true" aria-label="Onboarding do ambiente Agente">
      <div className="agent-onboarding-backdrop" />
      <div className={`agent-onboarding-modal is-${activeSlide.accent || "blue"}`}>
        <div className="agent-onboarding-modal-head">
          <div className="agent-onboarding-modal-kicker">Ambiente Agente</div>
          <div className="agent-onboarding-modal-head-actions">
            <div className="agent-onboarding-modal-progress">
              Slide {state.slideIndex + 1} de {AGENT_ONBOARDING_SLIDES.length}
            </div>
            <button type="button" className="agent-onboarding-close" onClick={onClose} aria-label="Fechar onboarding">
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className="agent-onboarding-stage">
          <div className="agent-onboarding-stage-index">{String(state.slideIndex + 1).padStart(2, "0")}</div>
          <div className="agent-onboarding-stage-copy">
            <div className="agent-onboarding-stage-label">{activeSlide.kicker}</div>
            <h2 className="agent-onboarding-stage-title">{activeSlide.title}</h2>
            <p className="agent-onboarding-stage-text">{activeSlide.message}</p>
          </div>
        </div>

        <div className="agent-onboarding-stage-visual">{buildSlideDiagram(activeSlide)}</div>

        <div className="agent-onboarding-modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onBackSlide}
            disabled={state.slideIndex === 0}
          >
            Voltar
          </button>
          <button
            type="button"
            className="btn"
            onClick={state.slideIndex === AGENT_ONBOARDING_SLIDES.length - 1 ? onJumpToComposer : onAdvanceSlide}
          >
            {activeSlide.ctaLabel || "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildComposerTurns(draft, currentStep, completedSteps = []) {
  const completed = new Set(completedSteps);
  const currentStepIndex = AGENT_COMPOSER_STEPS.indexOf(currentStep);
  const highestCompletedIndex = AGENT_COMPOSER_STEPS.reduce((acc, step, index) => (
    completed.has(step) ? index : acc
  ), -1);
  const visibleStepIndex = Math.max(currentStepIndex, highestCompletedIndex + 1);
  const questionByStep = {
    type: {
      label: "Tipo de agente",
      text: "Vamos montar seu primeiro agente por etapas. Primeiro: que atividade você deseja delegar?",
      answer: getAgentTypeLabel(draft.agentType),
    },
    objective: {
      label: "Objetivo",
      text: "Certo. Agora defina o objetivo principal dessa primeira execução.",
      answer: getAgentObjectiveLabel(draft.objective),
    },
    "data-source": {
      label: "Fonte de dados",
      text: "Onde esse agente irá atuar nesta primeira experiência?",
      answer: getAgentDataSourceLabel(draft.dataSource),
    },
    capabilities: {
      label: "Capacidades",
      text: "Agora escolha o que esse agente pode fazer dentro da base simulada.",
      answer: (draft.capabilities || []).map((item) => getAgentCapabilityLabel(item)).join(", "),
    },
    permissions: {
      label: "Permissões",
      text: "Estas serão as permissões dessa versão. O agente poderá ler, classificar, resumir e recomendar, mas não altera sistemas reais.",
      answer: (draft.permissions || AGENT_DEFAULT_PERMISSIONS).map((item) => getAgentPermissionLabel(item)).join(", "),
    },
    review: {
      label: "Revisão",
      text: "Tudo certo. Revise abaixo a configuração do agente antes de executar a demonstração.",
      answer: "Configuração pronta para execução.",
    },
  };

  const turns = [];
  AGENT_COMPOSER_STEPS.slice(0, visibleStepIndex + 1).forEach((step) => {
    const copy = questionByStep[step];
    turns.push({
      role: "assistant",
      title: "Sistema",
      label: copy.label,
      text: copy.text,
      step,
    });
    if (completed.has(step)) {
      turns.push({
        role: "user",
        title: "Você",
        label: "Resposta",
        text: copy.answer,
        step,
      });
    }
  });
  return turns;
}

function ComposerOptionRow({ options, selectedValue, onSelect }) {
  return (
    <div className="inline-choice-row agent-inline-choice-row">
      {options.map((option) => (
        <button
          type="button"
          key={option.id}
          className={`choice-pill${selectedValue === option.id ? " active" : ""}`}
          onClick={() => onSelect(option)}
          disabled={option.available === false}
          title={option.description || option.title}
        >
          {option.title}
        </button>
      ))}
    </div>
  );
}

function AgentReviewCard({ draft }) {
  return (
    <div className="card agent-review-compact">
      <div className="agent-review-row">
        <span>Tipo</span>
        <strong>{getAgentTypeLabel(draft.agentType)}</strong>
      </div>
      <div className="agent-review-row">
        <span>Objetivo</span>
        <strong>{getAgentObjectiveLabel(draft.objective)}</strong>
      </div>
      <div className="agent-review-row">
        <span>Fonte</span>
        <strong>{getAgentDataSourceLabel(draft.dataSource)}</strong>
      </div>
      <div className="agent-review-row is-stack">
        <span>Capacidades</span>
        <div className="concept-pill-row">
          {(draft.capabilities || []).map((capabilityId) => (
            <span className="concept-pill" key={capabilityId}>
              {getAgentCapabilityLabel(capabilityId)}
            </span>
          ))}
        </div>
      </div>
      <div className="agent-review-row is-stack">
        <span>Permissões</span>
        <div className="concept-pill-row">
          {(draft.permissions || AGENT_DEFAULT_PERMISSIONS).map((permissionId) => (
            <span className="concept-pill" key={permissionId}>
              {getAgentPermissionLabel(permissionId)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentComposer({
  state,
  running,
  onUpdateDraft,
  onGoToComposerStep,
  onExecuteAgent,
  onResetAgentMission,
}) {
  const composerStep = Math.max(0, Math.min(AGENT_COMPOSER_STEPS.length - 1, state.composerStep || 0));
  const currentStep = AGENT_COMPOSER_STEPS[composerStep] || AGENT_COMPOSER_STEPS[0];
  const draft = state.agentDraft;
  const completedSteps = Array.isArray(state.completedSteps) ? state.completedSteps : [];
  const turns = buildComposerTurns(draft, currentStep, completedSteps);
  const currentQuestion = turns[turns.length - 1]?.text || "Vamos configurar seu primeiro agente.";
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
  }, [turns.length, currentStep, scrollToBottom]);

  const toggleCapability = (capabilityId) => {
    const active = (draft.capabilities || []).includes(capabilityId);
    onUpdateDraft({
      capabilities: active
        ? (draft.capabilities || []).filter((item) => item !== capabilityId)
        : [...(draft.capabilities || []), capabilityId],
    });
  };

  function renderCurrentOptions() {
    if (currentStep === "type") {
      return (
        <ComposerOptionRow
          options={AGENT_TYPE_OPTIONS}
          selectedValue={draft.agentType}
          onSelect={(option) => {
            if (!option.available) return;
            onUpdateDraft({ agentType: option.id });
            onGoToComposerStep(1);
          }}
        />
      );
    }

    if (currentStep === "objective") {
      return (
        <ComposerOptionRow
          options={AGENT_OBJECTIVE_OPTIONS.map((option) => ({ ...option, description: "" }))}
          selectedValue={draft.objective}
          onSelect={(option) => {
            onUpdateDraft({ objective: option.id });
            onGoToComposerStep(2);
          }}
        />
      );
    }

    if (currentStep === "data-source") {
      return (
        <ComposerOptionRow
          options={AGENT_DATA_SOURCE_OPTIONS}
          selectedValue={draft.dataSource}
          onSelect={(option) => {
            if (!option.available) return;
            onUpdateDraft({ dataSource: option.id });
            onGoToComposerStep(3);
          }}
        />
      );
    }

    if (currentStep === "capabilities") {
      return (
        <div className="agent-inline-option-area">
          <div className="inline-choice-row agent-inline-choice-row">
            {AGENT_CAPABILITY_OPTIONS.map((option) => {
              const active = (draft.capabilities || []).includes(option.id);
              return (
                <button
                  type="button"
                  key={option.id}
                  className={`choice-pill${active ? " active" : ""}`}
                  onClick={() => toggleCapability(option.id)}
                >
                  {option.title}
                </button>
              );
            })}
          </div>
          <button type="button" className="btn agent-inline-continue-btn" onClick={() => onGoToComposerStep(4)}>
            Continuar
          </button>
        </div>
      );
    }

    if (currentStep === "permissions") {
      return (
        <div className="agent-inline-option-area">
          <div className="inline-choice-row agent-inline-choice-row">
            {(draft.permissions || AGENT_DEFAULT_PERMISSIONS).map((permissionId) => (
              <span className="choice-pill active" key={permissionId}>
                {AGENT_PERMISSION_LABELS[permissionId]}
              </span>
            ))}
          </div>
          <button type="button" className="btn agent-inline-continue-btn" onClick={() => onGoToComposerStep(5)}>
            Entendi
          </button>
        </div>
      );
    }

    if (currentStep === "review") {
      return <AgentReviewCard draft={draft} />;
    }

    return null;
  }

  return (
    <div className="input-card input-card-chat">
      <div className="prompt-composer">
        <div className="prompt-thread" ref={threadRef}>
          {turns.map((turn, index) => (
            <div className="prompt-thread-turn" key={`${turn.role}-${index}`}>
              <div className={`prompt-thread-bubble ${turn.role === "assistant" ? "is-assistant" : "is-user"}`}>
                <div className="prompt-thread-meta">
                  <span>{turn.title}</span>
                  <span>{turn.label}</span>
                </div>
                <div className="prompt-thread-text">{turn.text}</div>
                {turn.role === "assistant" && turn.step === currentStep ? (
                  <div className="agent-thread-options">{renderCurrentOptions()}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="prompt-entry-shell">
          <textarea
            value=""
            readOnly
            rows={1}
            aria-label={`Pergunta atual do agente: ${getComposerStepLabel(currentStep)}`}
            placeholder={currentStep === "review" ? "Revise a configuração acima e execute o agente." : currentQuestion}
          />

          <div className="input-actions input-compose-bar">
            <div className="input-compose-meta">
              <span className="input-hint">Etapa atual: {getComposerStepLabel(currentStep)}</span>
            </div>
            <div className="mission-inline-actions">
              <button type="button" className="btn btn-ghost" onClick={onResetAgentMission} disabled={running}>
                Recomeçar
              </button>
              {composerStep > 0 ? (
                <button type="button" className="btn btn-ghost" onClick={() => onGoToComposerStep(Math.max(0, composerStep - 1))} disabled={running}>
                  Voltar
                </button>
              ) : null}
              {currentStep === "review" ? (
                <button type="button" className="btn" onClick={onExecuteAgent} disabled={running}>
                  {running ? "Executando..." : "Executar agente"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentResultSection({ title, items, renderItem }) {
  return (
    <section className="agent-result-section">
      <div className="agent-result-section-title">{title}</div>
      <div className="agent-result-list">
        {items.map((item, index) => (
          <div className="agent-result-item" key={item.id || item.subject || item.theme || item.contact || `${title}-${index}`}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </section>
  );
}

export function AgentMissionPanel({
  missionState,
  running = false,
  onAdvanceSlide,
  onBackSlide,
  onJumpToComposer,
  onUpdateDraft,
  onGoToComposerStep,
  onExecuteAgent,
  onOpenRealConnection,
  onResetAgentMission,
}) {
  const state = missionState;
  const showComposerBehindOverlay =
    state.currentStep === "composer" ||
    state.currentStep === "onboarding" ||
    state.currentStep === "result" ||
    state.currentStep === "connect";

  return (
    <>
      {showComposerBehindOverlay ? (
        <AgentComposer
          state={state}
          running={running}
          onUpdateDraft={onUpdateDraft}
          onGoToComposerStep={onGoToComposerStep}
          onExecuteAgent={onExecuteAgent}
          onResetAgentMission={onResetAgentMission}
        />
      ) : null}

      {state.currentStep === "running" ? (
        <div className="agent-running-shell">
          <div className="agent-running-icon">
            <Waypoints size={18} strokeWidth={1.8} />
          </div>
          <div className="agent-panel-title">Executando em ambiente de demonstração</div>
          <div className="agent-running-copy">
            O agente está lendo a caixa simulada, classificando sinais, agrupando temas e montando recomendações.
          </div>
          <div className="agent-running-steps">
            <div className="agent-running-step is-done">1. Ler mensagens simuladas</div>
            <div className="agent-running-step is-done">2. Identificar temas e pendências</div>
            <div className="agent-running-step is-active">3. Produzir prioridades e recomendações</div>
          </div>
        </div>
      ) : null}

      {state.currentStep === "result" || state.currentStep === "connect" ? (
        <Modal
          open
          onClose={() => onGoToComposerStep(AGENT_COMPOSER_STEPS.length - 1)}
          className="agent-result-modal"
        >
        <div className="agent-result-shell">
          <div className="agent-panel-head">
            <div>
              <div className="agent-panel-kicker">Resultado do agente</div>
              <div className="agent-panel-title">Seu agente observou um ambiente e produziu uma leitura operacional</div>
              <div className="agent-panel-copy">
                O resultado abaixo mostra o que esse agente conseguiu identificar, priorizar e recomendar a partir da configuração que você montou.
              </div>
            </div>
            <div className="agent-result-head-actions">
              <button type="button" className="btn btn-ghost" onClick={() => onGoToComposerStep(AGENT_COMPOSER_STEPS.length - 1)}>
                Revisar configuração
              </button>
              <button type="button" className="btn btn-ghost" onClick={onResetAgentMission}>
                Recomeçar do zero
              </button>
            </div>
          </div>

          {state.agentDemoResult ? (
            <>
              <AgentResultSection
                title="Temas recorrentes"
                items={state.agentDemoResult.recurringThemes || []}
                renderItem={(item) => (
                  <>
                    <strong>{item.theme}</strong>
                    <span>{item.summary}</span>
                  </>
                )}
              />
              <AgentResultSection
                title="Mensagens que merecem atenção"
                items={state.agentDemoResult.attentionMessages || []}
                renderItem={(item) => (
                  <>
                    <strong>{item.subject}</strong>
                    <span>{item.from}</span>
                    <p>{item.reason}</p>
                  </>
                )}
              />
              <AgentResultSection
                title="Contatos mais frequentes"
                items={state.agentDemoResult.frequentContacts || []}
                renderItem={(item) => (
                  <>
                    <strong>{item.contact}</strong>
                    <span>{item.interactions} interações na base simulada</span>
                  </>
                )}
              />
              <AgentResultSection
                title="Possíveis prioridades"
                items={state.agentDemoResult.possiblePriorities || []}
                renderItem={(item) => <span>{item}</span>}
              />
              <AgentResultSection
                title="Recomendações produzidas pelo agente"
                items={state.agentDemoResult.recommendations || []}
                renderItem={(item) => <span>{item}</span>}
              />
            </>
          ) : null}

          <div className="agent-connect-cta">
            <div className="agent-connect-copy">
              Agora que você observou o funcionamento de um agente, você pode conectá-lo a uma conta real e repetir a experiência utilizando seus próprios dados.
            </div>
            <button type="button" className="btn" onClick={onOpenRealConnection}>
              Conectar Gmail
            </button>
          </div>

          {state.currentStep === "connect" ? (
            <div className="agent-gmail-state-card">
              <div className="agent-gmail-state-head">
                <Mail size={16} strokeWidth={1.8} />
                <strong>Conexão Gmail preparada para a próxima etapa</strong>
              </div>
              <div className="agent-gmail-state-copy">
                Nesta entrega, o botão registra o interesse e prepara o caminho para repetir a experiência com dados reais quando a integração OAuth estiver disponível na plataforma.
              </div>
            </div>
          ) : null}

          <div className="agent-closing-note">
            Você configurou um sistema capaz de observar um ambiente, interpretar informações e produzir ações orientadas por um objetivo. Esse é o princípio fundamental por trás dos agentes de IA.
          </div>
        </div>
        </Modal>
      ) : null}

      {state.currentStep === "onboarding" ? (
        <AgentOnboardingOverlay
          state={state}
          onAdvanceSlide={onAdvanceSlide}
          onBackSlide={onBackSlide}
          onJumpToComposer={onJumpToComposer}
          onClose={onJumpToComposer}
        />
      ) : null}
    </>
  );
}
