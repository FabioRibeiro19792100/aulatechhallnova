import { MessageSquareText } from "lucide-react";
import { getActionLabel, TRAINING_THREAD_ID } from "../../utils.js";

const TRAINING_MODE_EVENT = "training";

const TRAINING_MISSION = {
  id: TRAINING_THREAD_ID,
  num: 0,
  name: "Modo treino",
  category: "livre",
};

function getEventMode(evento) {
  return evento?.eventMode || "missions";
}

function extractPromptFeatures(text) {
  const prompt = (text || "").trim();
  const normalized = prompt.toLowerCase();
  return {
    prompt,
    tooShort: prompt.length < 50,
    hasStructure: /[\n:;-]/.test(prompt),
    hasGoalVerb: /(resuma|analise|classifique|gere|crie|compare|liste|explique|avalie|descreva|organize|reescreva|priorize|sugira)/i.test(prompt),
    hasContext: /(contexto|empresa|cliente|time|dados|tabela|documento|sistema|reuni[aã]o|cen[aá]rio|objetivo|problema)/i.test(prompt),
    asksFormat: /(em t[oó]picos|em tabela|formato|em lista|passo a passo|bullet|markdown|colunas|json)/i.test(prompt),
    mixedRequests: /\be\b.*\be\b/i.test(normalized) || /,.*?,.*?,/.test(prompt),
    vague: !/(quem|para|com base|use|considere|objetivo|formato|crit[eé]rio|limite)/i.test(prompt),
  };
}

function analyzePromptQuality({ exec, mission }) {
  const features = extractPromptFeatures(exec.input);
  const strengths = [];
  const watchouts = [];

  if (features.hasGoalVerb) strengths.push("deixou claro o que a IA deveria fazer");
  else watchouts.push("o pedido não explicita bem a operação esperada");

  if (features.hasContext) strengths.push("trouxe contexto suficiente para orientar a resposta");
  else watchouts.push("faltou contexto para a IA entender o cenário");

  if (features.asksFormat) strengths.push("definiu um formato de saída útil");
  else watchouts.push("não definiu como a resposta deveria voltar");

  if (features.hasStructure) strengths.push("organizou o pedido de forma legível");
  else watchouts.push("o prompt pode ficar mais estruturado visualmente");

  if (features.tooShort) watchouts.push("o prompt está curto demais para reduzir ambiguidades");
  if (features.mixedRequests) watchouts.push("misturou objetivos demais numa única instrução");
  if (features.vague) watchouts.push("há termos vagos que deixam a intenção aberta");

  const actionHint = exec.isFreeInstruction ? "objetivo" : `ação (${getActionLabel(exec.acao)})`;
  const rewriteSuggestion = [
    `Contexto: ${features.hasContext ? "use o contexto central já citado" : "descreva rapidamente o cenário e o material disponível"}.`,
    `Pedido: explicite o ${actionHint}.`,
    `Saída: ${features.asksFormat ? "mantenha o formato pedido" : "diga em que formato a resposta deve vir"}.`,
  ].join(" ");

  const teachingNote = strengths.length
    ? "Quando o prompt define contexto, tarefa e formato, a resposta tende a ficar mais aproveitável."
    : "Antes de buscar uma resposta melhor, vale tornar o pedido mais concreto e menos ambíguo.";

  return {
    strengths: strengths.slice(0, 3),
    watchouts: watchouts.slice(0, 3),
    rewriteSuggestion,
    teachingNote,
  };
}

function getPromptInsightEntries(evento) {
  if (getEventMode(evento) === TRAINING_MODE_EVENT) {
    const entries = [];
    Object.entries(evento.trainingRuns || {}).forEach(([teamIdxRaw, execs]) => {
      const teamIdx = Number(teamIdxRaw);
      const team = evento.teams?.[teamIdx];
      (execs || []).forEach((exec, index) => {
        entries.push({
          id: `training-${teamIdxRaw}-${exec.id || exec.ts || index}`,
          key: `training__${teamIdxRaw}`,
          teamIdx,
          teamName: team?.name || `Time ${teamIdx + 1}`,
          missionId: TRAINING_THREAD_ID,
          missionName: TRAINING_MISSION.name,
          missionNum: null,
          actionLabel: getActionLabel(exec.acao),
          ts: exec.ts,
          prompt: exec.input || "",
          output: exec.output || "",
          analysis: analyzePromptQuality({ exec, mission: TRAINING_MISSION }),
        });
      });
    });
    return entries.sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
  }

  const entries = [];
  Object.entries(evento.execucoes || {}).forEach(([key, execs]) => {
    const [teamIdxRaw, missionId] = key.split("__");
    const teamIdx = Number(teamIdxRaw);
    const team = evento.teams?.[teamIdx];
    const mission = evento.missions?.find((item) => item.id === missionId);
    (execs || []).forEach((exec, index) => {
      entries.push({
        id: `${key}-${exec.ts || index}`,
        key,
        teamIdx,
        teamName: team?.name || `Time ${teamIdx + 1}`,
        missionId,
        missionName: mission?.name || missionId,
        missionNum: mission?.num || null,
        actionLabel: getActionLabel(exec.acao),
        ts: exec.ts,
        prompt: exec.input || "",
        output: exec.output || "",
        analysis: analyzePromptQuality({ exec, mission }),
      });
    });
  });
  return entries.sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
}

function truncatePromptSnippet(text, max = 140) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Sem prompt registrado.";
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}...`;
}

function groupPromptInsightsByObservation(entries, side) {
  const grouped = new globalThis.Map();
  entries.forEach((entry) => {
    (entry.analysis?.[side] || []).forEach((item) => {
      if (!grouped.has(item)) {
        grouped.set(item, new globalThis.Map());
      }
      const participants = grouped.get(item);
      if (!participants.has(entry.teamName)) {
        participants.set(entry.teamName, {
          id: entry.teamName,
          teamName: entry.teamName,
          actionLabel: entry.actionLabel,
          prompt: truncatePromptSnippet(entry.prompt, 84),
        });
      }
    });
  });
  return [...grouped.entries()].map(([text, participants]) => ({
    text,
    participants: [...participants.values()],
  }));
}

export function PromptInsightsPanel({ evento }) {
  const entries = getPromptInsightEntries(evento);
  if (!entries.length) {
    return <div className="teams-empty">Nenhum prompt executado ainda.</div>;
  }

  if (getEventMode(evento) === TRAINING_MODE_EVENT) {
    const byTeam = evento.teams
      .map((teamItem, teamIdx) => ({
        teamName: teamItem.name,
        entries: entries.filter((entry) => entry.teamIdx === teamIdx),
      }))
      .filter((group) => group.entries.length);

    return (
      <div className="prompt-insights-shell">
        <div className="section-header">
          <span className="section-title section-title-with-icon">
            <span className="section-title-icon" aria-hidden="true">
              <MessageSquareText size={16} strokeWidth={1.6} />
            </span>
            <span>Leitura pedagógica dos prompts</span>
          </span>
          <span className="muted-mini">{entries.length} rodada(s) livres analisadas</span>
        </div>

        <div className="prompt-insight-group-list">
          {byTeam.map(({ teamName, entries: teamEntries }) => (
            <section className="prompt-insight-group editorial" key={`training-${teamName}`}>
              <div className="prompt-insight-group-head">
                <div>
                  <div className="prompt-insight-group-title">{teamName}</div>
                  <div className="prompt-insight-group-sub">{teamEntries.length} prompt(s) livres neste time</div>
                </div>
              </div>

              <div className="prompt-insight-columns editorial">
                <div className="prompt-insight-column editorial is-good">
                  <div className="prompt-insight-column-head">
                    <div className="prompt-insight-column-title">
                      <span className="prompt-insight-column-icon" aria-hidden="true">✓</span>
                      <span>Funcionou bem</span>
                    </div>
                  </div>
                  <div className="prompt-insight-open-list">
                    {teamEntries.some((entry) => entry.analysis?.strengths?.length) ? (
                      teamEntries.map((entry) => (
                        <article className="prompt-insight-open-item" key={`${entry.id}-good`}>
                          <div className="prompt-insight-open-note prompt-insight-observation">"{truncatePromptSnippet(entry.prompt, 120)}"</div>
                          <div className="prompt-insight-chip-row">
                            {(entry.analysis?.strengths || []).map((item) => (
                              <span className="prompt-insight-person-chip" key={`${entry.id}-${item}`}>{item}</span>
                            ))}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="prompt-insight-empty">Ainda não apareceu um caso forte de acerto neste time.</div>
                    )}
                  </div>
                </div>

                <div className="prompt-insight-column editorial is-watchout">
                  <div className="prompt-insight-column-head">
                    <div className="prompt-insight-column-title">
                      <span className="prompt-insight-column-icon" aria-hidden="true">!</span>
                      <span>A observar</span>
                    </div>
                  </div>
                  <div className="prompt-insight-open-list">
                    {teamEntries.some((entry) => entry.analysis?.watchouts?.length) ? (
                      teamEntries.map((entry) => (
                        <article className="prompt-insight-open-item" key={`${entry.id}-watch`}>
                          <div className="prompt-insight-open-note prompt-insight-observation">"{truncatePromptSnippet(entry.prompt, 120)}"</div>
                          <div className="prompt-insight-chip-row">
                            {(entry.analysis?.watchouts || []).map((item) => (
                              <span className="prompt-insight-person-chip" key={`${entry.id}-${item}`}>{item}</span>
                            ))}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="prompt-insight-empty">Nenhum ponto crítico recorrente apareceu neste time.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  const byMission = evento.missions
    .filter((mission) => entries.some((entry) => entry.missionId === mission.id))
    .map((mission) => ({
      mission,
      entries: entries.filter((entry) => entry.missionId === mission.id),
    }));

  return (
    <div className="prompt-insights-shell">
      <div className="section-header">
        <span className="section-title">Leitura pedagógica dos prompts</span>
        <span className="muted-mini">{byMission.length} missão(ões) com prompts analisados</span>
      </div>

      <div className="prompt-insight-group-list">
        {byMission.map(({ mission, entries: missionEntries }) => (
          <section className="prompt-insight-group editorial" key={`mission-${mission.id}`}>
            {(() => {
              const strengthGroups = groupPromptInsightsByObservation(missionEntries, "strengths");
              const watchoutGroups = groupPromptInsightsByObservation(missionEntries, "watchouts");
              const participantCount = new Set(missionEntries.map((entry) => entry.teamName)).size;

              return (
                <>
              <div className="prompt-insight-group-head">
                <div>
                  <div className="prompt-insight-group-title">
                    {mission.num ? `${mission.num}. ` : ""}
                    {mission.name}
                  </div>
                  <div className="prompt-insight-group-sub">
                    {missionEntries.length} prompt(s) · {participantCount} pessoa(s) nesta missão
                  </div>
                </div>
              </div>

              <div className="prompt-insight-columns editorial">
                <div className="prompt-insight-column editorial is-good">
                  <div className="prompt-insight-column-head">
                    <div className="prompt-insight-column-title">
                      <span className="prompt-insight-column-icon" aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="none">
                          <path d="M4.5 10.5l3.2 3.2 7.8-7.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>Funcionou bem</span>
                    </div>
                  </div>
                  <div className="prompt-insight-open-list">
                    {strengthGroups.length ? (
                      strengthGroups.map((group) => (
                        <article className="prompt-insight-open-item" key={`strength-group-${group.text}`}>
                          <div className="prompt-insight-open-note prompt-insight-observation">{group.text}</div>
                          <div className="prompt-insight-chip-row">
                            {group.participants.map((participant) => (
                              <span className="prompt-insight-person-chip" key={`${group.text}-${participant.id}`}>
                                {participant.teamName}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="prompt-insight-empty">
                        <strong>Ainda não apareceu um caso forte de acerto.</strong>
                        <span>Procure próximos prompts com objetivo claro, contexto suficiente e formato de saída definido.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="prompt-insight-column editorial is-watchout">
                  <div className="prompt-insight-column-head">
                    <div className="prompt-insight-column-title">
                      <span className="prompt-insight-column-icon" aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="none">
                          <path d="M10 4.5v6.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                          <circle cx="10" cy="13.9" r="0.9" fill="currentColor" />
                          <path d="M10 2.8l7 12.1a1 1 0 0 1-.86 1.5H3.86a1 1 0 0 1-.86-1.5l7-12.1a1 1 0 0 1 1.72 0Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>A observar</span>
                    </div>
                  </div>
                  <div className="prompt-insight-open-list">
                    {watchoutGroups.length ? (
                      watchoutGroups.map((group) => (
                        <article className="prompt-insight-open-item" key={`watchout-group-${group.text}`}>
                          <div className="prompt-insight-open-note prompt-insight-observation">{group.text}</div>
                          <div className="prompt-insight-chip-row">
                            {group.participants.map((participant) => (
                              <span className="prompt-insight-person-chip" key={`${group.text}-${participant.id}`}>
                                {participant.teamName}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="prompt-insight-empty">Nenhum ponto crítico recorrente apareceu nesta missão.</div>
                    )}
                  </div>
                </div>
              </div>
                </>
              );
            })()}
          </section>
        ))}
      </div>
    </div>
  );
}
