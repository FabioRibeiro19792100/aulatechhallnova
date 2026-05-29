import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import techHallFooterIcon from "../../../tech_hall_branding/icone_8.png";
import {
  normalizeTechnicalAnalysis,
  normalizeAnalysisItemArray,
  TECHNICAL_FEEDBACK_REASONS,
  ANALYSIS_NOT_APPLICABLE,
  TECHNICAL_PANEL_BLOCKS,
  PERGUNTAS_REFLEXAO,
} from "../../utils.js";
import { Modal } from "../ui/Modals.jsx";

export function GuidedSection({ label, children }) {
  return (
    <div className="guided-section">
      <div className="guided-section-label">{label}</div>
      <div className="guided-section-body">{children}</div>
    </div>
  );
}

export function LearningSlide({ index, kicker, title, subtitle, accent = "blue", children }) {
  return (
    <article className={`learning-slide learning-slide-${accent}`}>
      <div className="learning-slide-head">
        <div className="learning-slide-index">{String(index).padStart(2, "0")}</div>
        <div className="learning-slide-meta">
          <div className="learning-slide-kicker">{kicker}</div>
          <div className="learning-slide-title">{title}</div>
          {subtitle ? <div className="learning-slide-subtitle">{subtitle}</div> : null}
        </div>
      </div>
      <div className="learning-slide-body">{children}</div>
    </article>
  );
}

export function TechnicalReadingList({ items = [] }) {
  const normalizedItems = normalizeAnalysisItemArray(items);
  return (
    <div className="tech-reading-list">
      {normalizedItems.map((item, index) => (
        <div className="tech-reading-item" key={`${item}-${index}`}>
          <span className="tech-reading-item-bullet" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export function TechnicalReadingBlock({ blockKey, children }) {
  const copy = TECHNICAL_PANEL_BLOCKS[blockKey];
  return (
    <section className="tech-reading-structured-block">
      <div className="tech-reading-structured-head">
        <span className="tech-reading-structured-index">{copy.index}</span>
        <div className="tech-reading-structured-copy">
          <div className="tech-reading-structured-title">{copy.title}</div>
          <div className="tech-reading-structured-anchor">{copy.anchor}</div>
        </div>
      </div>
      <div className="tech-reading-structured-body">{children}</div>
    </section>
  );
}

export function GuidedReading({ exec }) {
  const details = exec.reasoningDetails || {};
  let slideIndex = 1;
  const nextSlide = () => slideIndex++;

  return (
    <div className="guided-reading guided-reading-deck">
      <LearningSlide
        index={nextSlide()}
        kicker="Slide 1"
        title="Como a IA operou aqui"
        subtitle="Engenharia reversa do mecanismo que transformou o pedido nesta resposta."
      >
        {details.sourceLabel ? <div className="source-chip">{details.sourceLabel}</div> : null}
        {details.historySignal || exec.historySignal ? (
          <div className="context-banner">{details.historySignal || exec.historySignal}</div>
        ) : null}
        <div className="slide-lead">{details.mechanismSummary || details.summary || exec.reasoningSummary || exec.explicacao}</div>
        <div className="two-col-guided">
          <GuidedSection label="Lógica de seleção">
            <div className="explain-block-text">{details.selectionLogic || details.strategy || exec.explicacao}</div>
          </GuidedSection>
          <GuidedSection label="Input considerado">
            <div className="explain-block-text">{details.consideredInput || exec.input}</div>
          </GuidedSection>
        </div>
        {details.technicalTerms?.length ? (
          <div className="takeaway-list">
            {details.technicalTerms.map((item, index) => (
              <div className="takeaway-item" key={`${item.term}-${index}`}>
                <span className="takeaway-bullet">{index + 1}</span>
                <span>
                  <strong>{item.term}:</strong> {item.meaning}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </LearningSlide>

      <LearningSlide
        index={nextSlide()}
        kicker="Slide 2"
        title="Por que saiu isso e não outra coisa"
        subtitle="Aqui o foco é mostrar por que a IA privilegiou esse caminho de resposta."
        accent="amber"
      >
        <GuidedSection label="Por que essa saída aconteceu">
          <div className="explain-block-text">{details.whyThisAnswer || details.strategy || exec.explicacao}</div>
        </GuidedSection>
        <div className="two-col-guided">
          <GuidedSection label="Influência da ação ou instrução">
            <div className="explain-block-text">{details.actionInfluence || exec.acao || "Sem ação."}</div>
          </GuidedSection>
          <GuidedSection label="Limite ou trade-off">
            <div className="explain-block-text">{details.limitations || "Sem observações adicionais."}</div>
          </GuidedSection>
        </div>
        {details.alternativeAnswerPaths?.length ? (
          <GuidedSection label="Outras respostas plausíveis">
            <div className="takeaway-list">
              {details.alternativeAnswerPaths.map((item, index) => (
                <div className="takeaway-item" key={`${item}-${index}`}>
                  <span className="takeaway-bullet">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </GuidedSection>
        ) : null}
      </LearningSlide>

      <LearningSlide
        index={nextSlide()}
        kicker="Slide 3"
        title="Como perguntar melhor e extrair variações"
        subtitle="Este slide transforma a devolutiva em boa prática operacional."
        accent="green"
      >
        {details.howToAskBetter?.length ? (
          <GuidedSection label="Como pedir outras versões">
            <div className="takeaway-list">
              {details.howToAskBetter.map((item, index) => (
                <div className="takeaway-item" key={`${item}-${index}`}>
                  <span className="takeaway-bullet">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </GuidedSection>
        ) : null}
        {details.bestPractices?.length ? (
          <GuidedSection label="Boas práticas">
            <div className="takeaway-list">
              {details.bestPractices.map((item, index) => (
                <div className="takeaway-item" key={`${item}-${index}`}>
                  <span className="takeaway-bullet">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </GuidedSection>
        ) : null}
        <GuidedSection label="Prompt aplicado">
          <div className="prompt-preview">{exec.promptApplied || details.promptApplied || exec.acao || "Sem ação"}</div>
        </GuidedSection>
      </LearningSlide>
    </div>
  );
}

export function MissionReadingPanel({ exec, onSubmitFeedback, allowFeedback = true }) {
  const details = normalizeTechnicalAnalysis(exec.technicalAnalysis || exec.reasoningDetails || {}, {
    accumulatedGlossary: exec.technicalAnalysis?.glossary?.accumulated || exec.reasoningDetails?.glossary?.accumulated || [],
  });
  const [chainExpanded, setChainExpanded] = useState(false);
  const glossaryItems = details.glossary?.round?.length ? details.glossary.round : [];
  const [feedbackRating, setFeedbackRating] = useState(exec.technicalFeedback?.rating || "");
  const [feedbackReason, setFeedbackReason] = useState(exec.technicalFeedback?.reason || "");
  const [feedbackComment, setFeedbackComment] = useState(exec.technicalFeedback?.comment || "");
  const [feedbackOpen, setFeedbackOpen] = useState((exec.technicalFeedback?.rating || "") === "down");
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  useEffect(() => {
    setFeedbackRating(exec.technicalFeedback?.rating || "");
    setFeedbackReason(exec.technicalFeedback?.reason || "");
    setFeedbackComment(exec.technicalFeedback?.comment || "");
    setFeedbackOpen((exec.technicalFeedback?.rating || "") === "down");
    setFeedbackSaved(Boolean(exec.technicalFeedback?.submittedAt));
  }, [exec.id, exec.technicalFeedback?.rating, exec.technicalFeedback?.reason, exec.technicalFeedback?.comment]);

  function handleThumbSelection(rating) {
    setFeedbackRating(rating);
    setFeedbackSaved(false);
    if (rating === "up") {
      setFeedbackOpen(false);
      setFeedbackReason("");
      setFeedbackComment("");
      onSubmitFeedback?.({ rating: "up", reason: "", comment: "" });
      setFeedbackSaved(true);
      return;
    }
    setFeedbackOpen(true);
  }

  function handleDownReasonChange(reason) {
    setFeedbackReason(reason);
    setFeedbackSaved(false);
  }

  function handleDownCommentChange(comment) {
    setFeedbackComment(comment);
    setFeedbackSaved(false);
  }

  function handleCloseFeedbackCard() {
    setFeedbackOpen(false);
  }

  function handleSubmitNegativeFeedback() {
    onSubmitFeedback?.({
      rating: "down",
      reason: feedbackReason,
      comment: feedbackComment,
    });
    setFeedbackSaved(true);
    setFeedbackOpen(false);
  }

  if (details.pending) {
    return (
      <section className="tech-reading-panel">
        <div className="tech-reading-header">
          <div className="tech-reading-meta">
            <span>Rodada {exec.iterationNumber || "-"}</span>
          </div>
        </div>
        <div className="tech-reading-body">
          <div className="tech-reading-unavailable tech-reading-pending">
            <div className="tech-reading-block-label">Análise em processamento</div>
            <div className="tech-reading-copy">{details.unavailableReason}</div>
            <div className="tech-reading-loader" aria-hidden="true">
              <img className="tech-reading-loader-icon" src={techHallFooterIcon} alt="" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tech-reading-panel">
      <div className="tech-reading-header">
        <div className="tech-reading-meta">
          <span>Rodada {exec.iterationNumber || "-"}</span>
        </div>
        {allowFeedback ? (
          <div className="tech-reading-feedback-strip">
            <span className="tech-reading-feedback-question">Essa leitura foi útil?</span>
            <div className="tech-reading-feedback-actions">
              <button
                className={`tech-reading-feedback-btn${feedbackRating === "up" ? " is-active" : ""}`}
                type="button"
                aria-label="Foi útil"
                onClick={() => handleThumbSelection("up")}
              >
                <ThumbsUp size={16} strokeWidth={1.9} />
              </button>
              <button
                className={`tech-reading-feedback-btn is-negative${feedbackRating === "down" ? " is-active" : ""}`}
                type="button"
                aria-label="Não foi útil"
                onClick={() => handleThumbSelection("down")}
              >
                <ThumbsDown size={16} strokeWidth={1.9} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="tech-reading-body">
        {allowFeedback && feedbackOpen ? (
          <div className="tech-reading-feedback-card">
            <div className="tech-reading-feedback-card-head">
              <div className="tech-reading-feedback-card-title">O que te atrapalhou nesta explicação?</div>
              <button
                className="tech-reading-feedback-dismiss"
                type="button"
                aria-label="Fechar feedback"
                onClick={handleCloseFeedbackCard}
              >
                <X size={14} strokeWidth={1.9} />
              </button>
            </div>
            <div className="tech-reading-feedback-options">
              {TECHNICAL_FEEDBACK_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`tech-reading-feedback-option${feedbackReason === reason ? " is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name={`tech-reading-feedback-${exec.id}`}
                    value={reason}
                    checked={feedbackReason === reason}
                    onChange={() => handleDownReasonChange(reason)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <textarea
              className="tech-reading-feedback-textarea"
              value={feedbackComment}
              onChange={(event) => handleDownCommentChange(event.target.value)}
              placeholder="Se quiser, escreva o que teria tornado essa leitura mais útil para você."
            />
            <div className="tech-reading-feedback-card-actions">
              <button className="tech-reading-feedback-secondary" type="button" onClick={handleCloseFeedbackCard}>
                Cancelar
              </button>
              <button
                className="tech-reading-feedback-primary"
                type="button"
                onClick={handleSubmitNegativeFeedback}
                disabled={!feedbackReason && !feedbackComment.trim()}
              >
                Enviar feedback
              </button>
            </div>
            <div className="tech-reading-feedback-hint">
              {feedbackSaved ? "Feedback salvo." : "Escolha um motivo ou escreva um comentário para enviar."}
            </div>
          </div>
        ) : null}
        {details.unavailable ? (
          <div className="tech-reading-unavailable">
            <div className="tech-reading-block-label">Análise indisponível</div>
            <div className="tech-reading-copy">{details.unavailableReason}</div>
          </div>
        ) : null}

        {!details.unavailable && !details.pending && exec.historySignal ? (
          <div className="tech-reading-banner">{exec.historySignal}</div>
        ) : null}

        <TechnicalReadingBlock blockKey="executiveSummary">
          <div className="tech-reading-highlight">
            <div className="tech-reading-highlight-item">
              <div className="tech-reading-subtitle">Leitura principal</div>
              <div className="tech-reading-highlight-copy">{details.executiveSummary?.takeaway || ANALYSIS_NOT_APPLICABLE}</div>
            </div>
            <div className="tech-reading-highlight-item">
              <div className="tech-reading-subtitle">Ponto de atenção</div>
              <div className="tech-reading-highlight-copy">{details.executiveSummary?.risk || ANALYSIS_NOT_APPLICABLE}</div>
            </div>
            <div className="tech-reading-highlight-item">
              <div className="tech-reading-subtitle">Próximo ajuste</div>
              <div className="tech-reading-highlight-copy">{details.executiveSummary?.nextMove || ANALYSIS_NOT_APPLICABLE}</div>
            </div>
          </div>
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="promptReading">
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">EXPLÍCITO</div>
            <TechnicalReadingList items={details.promptReading?.explicit} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">INFERIDO</div>
            <TechnicalReadingList items={details.promptReading?.inferred} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">ASSUMIDO</div>
            <TechnicalReadingList items={details.promptReading?.assumed} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">AMBIGUIDADES</div>
            <TechnicalReadingList items={details.promptReading?.ambiguities} />
          </div>
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="chainOfThought">
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Contexto considerado</div>
            <TechnicalReadingList items={details.chainOfThought?.contextConsidered} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Estratégia escolhida</div>
            <TechnicalReadingList items={details.chainOfThought?.strategyChosen} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Descartado</div>
            <TechnicalReadingList items={details.chainOfThought?.discarded} />
          </div>
          <button className="tech-reading-expand-btn" type="button" onClick={() => setChainExpanded((value) => !value)}>
            Entender mais {chainExpanded ? "▴" : "▾"}
          </button>
          {chainExpanded ? (
            <div className="tech-reading-expanded-copy">
              {TECHNICAL_PANEL_BLOCKS.chainOfThought.expanded}
              <span>{details.chainOfThought?.expandedExplanation || ANALYSIS_NOT_APPLICABLE}</span>
            </div>
          ) : null}
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="responseConstruction">
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Tom e formato escolhidos</div>
            <TechnicalReadingList items={details.responseConstruction?.toneAndFormat} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Conceitos e terminologias ativados</div>
            <TechnicalReadingList items={details.responseConstruction?.conceptsActivated} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Limitações encontradas durante a geração</div>
            <TechnicalReadingList items={details.responseConstruction?.generationLimitations} />
          </div>
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="outputEvaluation">
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">O que a resposta faz bem</div>
            <TechnicalReadingList items={details.outputEvaluation?.whatWorked} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">O que ficou genérico ou em aberto</div>
            <TechnicalReadingList items={details.outputEvaluation?.whatStayedGeneric} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Gap entre pedido e entrega</div>
            <TechnicalReadingList items={details.outputEvaluation?.gapBetweenRequestAndDelivery} />
          </div>
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="nextStep">
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">Como reformular o prompt para ir mais fundo</div>
            <TechnicalReadingList items={details.nextStep?.howToReformulate} />
          </div>
          <div className="tech-reading-subsection">
            <div className="tech-reading-subtitle">O que vale testar na próxima rodada</div>
            <TechnicalReadingList items={details.nextStep?.whatToTestNext} />
          </div>
        </TechnicalReadingBlock>

        <TechnicalReadingBlock blockKey="glossary">
          {glossaryItems.length ? (
            <div className="tech-reading-glossary-list">
              {glossaryItems.map((item, index) => (
                <div className="tech-reading-glossary-item" key={`${item.term}-${index}`}>
                  <strong>{item.term}</strong>
                  <span>{item.definition}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="tech-reading-copy">Sem termos novos relevantes nesta rodada.</div>
          )}
        </TechnicalReadingBlock>
      </div>
    </section>
  );
}

export function MissionClosurePanel({
  stage,
  reflectionAnswers,
  reflectionComment,
  reflectionError,
  canClose = false,
  onClose,
  onSelectAnswer,
  onChangeComment,
  onSubmitReflection,
}) {
  if (stage !== "questionario_final") return null;
  const answeredCount = PERGUNTAS_REFLEXAO.filter((question) => reflectionAnswers[question.id]).length;
  const allAnswered = answeredCount === PERGUNTAS_REFLEXAO.length;

  return (
    <Modal
      open
      small={false}
      dismissible={canClose}
      onClose={canClose ? onClose : undefined}
      className="mission-closure-modal-shell"
    >
      <section className="reading-panel mission-inline-panel mission-closure-modal">
        <div className="reading-panel-header">
          <div>
            <div className="reading-panel-kicker">Avaliação</div>
            <div className="reading-panel-title">Concluir missão</div>
            <div className="reading-panel-sub">Responda as 3 perguntas para fechar a atividade do time.</div>
          </div>
        </div>
        <div className="mission-inline-panel-body">
          <div className="mission-closure-progress">
            <span>{answeredCount}/{PERGUNTAS_REFLEXAO.length} respondidas</span>
            {!allAnswered ? <strong>Faltam {PERGUNTAS_REFLEXAO.length - answeredCount}</strong> : <strong>Pronto para enviar</strong>}
          </div>
          {PERGUNTAS_REFLEXAO.map((question) => (
            <div className="reflexao-question" key={question.id}>
              <div className="reflexao-q-text">{question.texto}</div>
              <div className="scale-row">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    className={`scale-btn${reflectionAnswers[question.id] === score ? " selected" : ""}`}
                    onClick={() => onSelectAnswer(question.id, score)}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="scale-labels">
                <span>{question.min}</span>
                <span>{question.max}</span>
              </div>
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Observação geral</label>
            <textarea
              value={reflectionComment}
              onChange={(event) => onChangeComment(event.target.value)}
              placeholder="Opcional: registre uma observação geral sobre a missão, a resposta da IA ou o que o time aprendeu."
            />
          </div>
          {reflectionError ? <div className="error-box">{reflectionError}</div> : null}
          <div className="mission-inline-actions">
            <button className="btn btn-green" type="button" disabled={!allAnswered} onClick={onSubmitReflection}>
              Enviar avaliação
            </button>
          </div>
        </div>
      </section>
    </Modal>
  );
}
