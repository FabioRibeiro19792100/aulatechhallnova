import { useState, useRef, useEffect } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import {
  FileText, SlidersHorizontal, Users, Code2, LayoutDashboard, BookOpen, MessageSquareText,
  Monitor, Map, Coins, Sparkles, CircleAlert, ArrowLeft, X,
} from "lucide-react";
import {
  getScreenShareState,
  fetchLiveKitToken,
  getEventStudentOptions,
  isPresenceLive,
  formatDateTime,
  formatCountdown,
  normalizeMission,
  getMissionTokenPolicy,
  getMissionTokenBaseLimit,
  formatTokenLimitInput,
  parseTokenLimitInput,
  FACILITATOR_TOOL_VIEWS,
  TOKEN_MISSION_TRAINING_ID,
  TOKEN_POLICY_MODE_UNLIMITED,
  TOKEN_POLICY_MODE_DEFAULT,
  TOKEN_POLICY_MODE_CUSTOM,
  DEFAULT_MISSION_TOKEN_LIMIT,
} from "../../utils.js";

export function EventCardSectionLabel({ icon, children }) {
  const Icon =
    icon === "summary"
      ? FileText
      : icon === "mode"
        ? SlidersHorizontal
        : icon === "teams"
          ? Users
          : icon === "code"
            ? Code2
            : null;
  return (
    <div className="mini-label event-card-label">
      <span className="event-card-label-icon" aria-hidden="true">
        {Icon ? <Icon strokeWidth={1.6} /> : null}
      </span>
      <span className="event-card-label-text">{children}</span>
    </div>
  );
}

export function FacilitatorTabLabel({ tab }) {
  const Icon =
    tab === "dashboard"
      ? LayoutDashboard
      : tab === "missoes"
        ? BookOpen
        : tab === "anamnese"
          ? FileText
          : MessageSquareText;
  return (
    <>
      <span className="tab-icon" aria-hidden="true">
        <Icon strokeWidth={1.6} />
      </span>
      <span>
        {tab === "dashboard" ? "Dashboard" : tab === "missoes" ? "Missões" : tab === "anamnese" ? "Anamnese" : "Prompts"}
      </span>
    </>
  );
}

function useFacilitatorScreenSharePresenter(event, screenShare, onPublishState) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const roomRef = useRef(null);
  const tracksRef = useRef([]);

  useEffect(() => {
    return () => {
      tracksRef.current.forEach((track) => {
        try {
          roomRef.current?.localParticipant?.unpublishTrack(track);
        } catch {}
        track.stop();
      });
      tracksRef.current = [];
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  async function stopShare(markEnded = true) {
    tracksRef.current.forEach((track) => {
      try {
        roomRef.current?.localParticipant?.unpublishTrack(track);
      } catch {}
      track.stop();
    });
    tracksRef.current = [];
    roomRef.current?.disconnect();
    roomRef.current = null;
    setStatus("idle");
    if (markEnded && event) {
      onPublishState({
        active: false,
        endedAt: new Date().toISOString(),
      });
    }
  }

  async function startShare() {
    if (!event) return;
    const roomName = `event-${event.id}-screen`;
    const identity = `facilitador-${event.id}`;
    setStatus("connecting");
    setError("");

    try {
      const { token, url } = await fetchLiveKitToken({
        roomName,
        identity,
        name: `${event.name} - Facilitador`,
        canPublish: true,
      });

      const room = new Room();
      roomRef.current = room;
      await room.connect(url, token);
      const tracks = await room.localParticipant.createScreenTracks({
        audio: false,
      });
      tracksRef.current = tracks;

      for (const track of tracks) {
        await room.localParticipant.publishTrack(track, {
          source: track.kind === Track.Kind.Video ? Track.Source.ScreenShare : Track.Source.ScreenShareAudio,
        });
      }

      const videoTrack = tracks.find((track) => track.kind === Track.Kind.Video);
      if (videoTrack?.mediaStreamTrack) {
        videoTrack.mediaStreamTrack.onended = () => {
          stopShare(true);
        };
      }

      onPublishState({
        active: true,
        roomName,
        presenterId: identity,
        startedAt: new Date().toISOString(),
        endedAt: null,
        provider: "livekit",
      });
      setStatus("live");
    } catch (err) {
      console.error(err);
      await stopShare(false);
      setStatus("error");
      setError("Não foi possível iniciar o compartilhamento. Verifique o servidor LiveKit e as credenciais.");
    }
  }

  const effectiveStatus = status === "live" || screenShare.active ? "live" : status;
  return { status, error, effectiveStatus, startShare, stopShare };
}

export function FacilitatorScreenShareButton({ event, screenShare, onPublishState, iconOnly = false }) {
  const shareState = screenShare || getScreenShareState({});
  const { status, error, effectiveStatus, startShare, stopShare } = useFacilitatorScreenSharePresenter(
    event,
    shareState,
    onPublishState,
  );
  const disabled = !event || status === "connecting";

  return (
    <button
      className={`btn btn-sm topbar-screen-share-btn${shareState.active ? " is-live" : ""}${iconOnly ? " is-icon" : ""}`}
      disabled={disabled}
      title={
        !event
          ? "Selecione um evento para projetar"
          : error
            ? error
            : effectiveStatus === "live"
              ? shareState.startedAt
                ? `Ao vivo desde ${formatDateTime(shareState.startedAt)}`
                : "Transmissão ao vivo"
              : effectiveStatus === "connecting"
                ? "Conectando apresentação"
                : "Projetar sua tela para os times"
      }
      onClick={() => (shareState.active ? stopShare(true) : startShare())}
    >
      <Monitor size={15} strokeWidth={1.8} aria-hidden="true" />
      {iconOnly ? (
        <span className="sr-only">
          {status === "connecting"
            ? "Conectando projeção"
            : shareState.active
              ? "Encerrar projeção"
              : "Projetar tela"}
        </span>
      ) : status === "connecting" ? (
        "Conectando..."
      ) : shareState.active ? (
        "Encerrar projeção"
      ) : (
        "Projetar tela"
      )}
    </button>
  );
}

export function FacilitatorScreenSharePanel({ event, screenShare, onPublishState }) {
  const { status, error, effectiveStatus, startShare, stopShare } = useFacilitatorScreenSharePresenter(
    event,
    screenShare,
    onPublishState,
  );

  return (
    <div className={`screen-share-panel${screenShare.active ? " is-live" : ""}`}>
      <div className="section-header">
        <span className="section-title">
          Apresentação ao vivo
          {screenShare.active ? <span className="help-badge">ao vivo</span> : null}
        </span>
      </div>
      <div className="screen-share-row">
        <div>
          <div className="screen-share-title">
            {screenShare.active ? "Você está apresentando sua tela" : "Projetar tela"}
          </div>
          <div className="screen-share-meta">
            <span>Status: {effectiveStatus === "live" ? "ao vivo" : effectiveStatus === "connecting" ? "conectando" : "inativo"}</span>
            {screenShare.startedAt ? (
              <>
                <span>·</span>
                <span>Iniciado em {formatDateTime(screenShare.startedAt)}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="header-actions">
          {!screenShare.active ? (
            <button className="btn btn-primary" disabled={status === "connecting"} onClick={startShare}>
              {status === "connecting" ? "Conectando..." : "Apresentar agora"}
            </button>
          ) : (
            <button className="btn presenter-stop-btn" onClick={() => stopShare(true)}>
              Encerrar apresentação
            </button>
          )}
        </div>
      </div>
      {error ? <div className="error-box top-gap-sm">{error}</div> : null}
    </div>
  );
}

export function TeamScreenShareViewer({ event, screenShare, team, onDismiss }) {
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const roomRef = useRef(null);
  const currentTrackRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function connectViewer() {
      setStatus("connecting");
      setError("");
      try {
        const identity = `team-${event.id}-${team?.name?.replace(/\s+/g, "-").toLowerCase() || "viewer"}-${Date.now()}`;
        const { token, url } = await fetchLiveKitToken({
          roomName: screenShare.roomName,
          identity,
          name: team?.name || "Time",
          canPublish: false,
        });
        const room = new Room();
        roomRef.current = room;

        const attachTrack = (track, publication) => {
          if (!mounted) return;
          if (publication?.source !== Track.Source.ScreenShare || track.kind !== Track.Kind.Video) return;
          currentTrackRef.current?.detach();
          currentTrackRef.current = track;
          if (videoRef.current) {
            track.attach(videoRef.current);
          }
          setStatus("watching");
        };

        room
          .on(RoomEvent.TrackSubscribed, (track, publication) => {
            attachTrack(track, publication);
          })
          .on(RoomEvent.TrackUnsubscribed, (track) => {
            track.detach();
            if (currentTrackRef.current === track) {
              currentTrackRef.current = null;
              setStatus("waiting");
            }
          })
          .on(RoomEvent.Disconnected, () => {
            if (!mounted) return;
            setStatus("ended");
          });

        await room.connect(url, token);

        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.track) {
              attachTrack(publication.track, publication);
            }
          });
        });

        if (!currentTrackRef.current) {
          setStatus("waiting");
        }
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setStatus("error");
        setError("Não foi possível assistir à transmissão ao vivo.");
      }
    }

    if (screenShare.active && screenShare.roomName) {
      connectViewer();
    }

    return () => {
      mounted = false;
      currentTrackRef.current?.detach();
      currentTrackRef.current = null;
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [event.id, screenShare.active, screenShare.roomName, team?.name]);

  return (
    <div className="live-viewer-card">
      <button
        type="button"
        className="live-viewer-close"
        onClick={onDismiss}
        aria-label="Fechar projeção"
        title="Não quero ver a projeção agora"
      >
        <X size={18} strokeWidth={1.9} aria-hidden="true" />
      </button>
      <div className="reading-panel-header live-viewer-header">
        <div>
          <div className="reading-panel-kicker">Apresentação ao vivo</div>
          <div className="reading-panel-title">Você está assistindo a tela do facilitador</div>
          <div className="reading-panel-sub">
            Sua equipe está vendo a tela do facilitador em tempo real. A interação da missão fica pausada enquanto a apresentação estiver ativa.
          </div>
        </div>
        <div className="live-viewer-badges">
          <div className="source-chip">{status === "watching" ? "ao vivo" : status}</div>
          <div className="source-chip viewer-team-chip">{team?.name || "Time"}</div>
        </div>
      </div>
      <div className="live-viewer-stage">
        <video ref={videoRef} className="live-viewer-video" autoPlay playsInline muted={false} />
        {status !== "watching" ? (
          <div className="live-viewer-overlay">
            <div className="live-viewer-overlay-title">
              {status === "connecting"
                ? "Conectando na transmissão..."
                : status === "waiting"
                  ? "Aguardando a tela do facilitador aparecer..."
                  : status === "ended"
                    ? "A transmissão foi encerrada."
                    : "Falha ao abrir a transmissão."}
            </div>
            {error ? <div className="live-viewer-overlay-text">{error}</div> : null}
          </div>
        ) : null}
      </div>
      <div className="live-viewer-foot">
        <span>Evento: {event.name}</span>
        <span>·</span>
        <span>Time: {team?.name || "Time"}</span>
        <span>·</span>
        <span>Apresentação iniciada em {formatDateTime(screenShare.startedAt)}</span>
      </div>
    </div>
  );
}

export function RoomMapPanel({ event }) {
  const studentOptions = getEventStudentOptions(event);
  const presenceMap = event?.presenceMap || {};
  const liveStudentIds = new Set();
  const livePresenceByTeam = new globalThis.Map();

  const optionsByTeam = studentOptions.reduce((accumulator, student) => {
    const list = accumulator.get(student.teamIdx) || [];
    list.push(student);
    accumulator.set(student.teamIdx, list);
    return accumulator;
  }, new globalThis.Map());

  optionsByTeam.forEach((students, teamIdx) => {
    const presence = presenceMap?.[teamIdx];
    if (!isPresenceLive(presence)) return;
    const connectedName = presence?.memberName ? presence.memberName.replace(/\s+/g, " ").trim() : "";
    const exactMatch = students.find((student) => student.name.replace(/\s+/g, " ").trim() === connectedName);
    const fallbackStudent = exactMatch || students[0];
    if (fallbackStudent?.id) {
      liveStudentIds.add(fallbackStudent.id);
      livePresenceByTeam.set(teamIdx, connectedName || fallbackStudent.name);
    }
  });

  return (
    <div className="room-map-sheet-body">
      <div className="room-map-sheet-event">{event?.name || "Evento"}</div>
      {!studentOptions.length ? (
        <div className="teams-empty">Ainda não há nomes disponíveis neste evento.</div>
      ) : (
        <div className="room-map-grid">
          {studentOptions.map((student) => {
            const isLive = liveStudentIds.has(student.id);
            const connectedName = livePresenceByTeam.get(student.teamIdx) || "";
            return (
              <div className={`room-map-card${isLive ? " is-live" : ""}`} key={student.id}>
                <div className="room-map-card-icon-wrap">
                  <div className="room-map-card-icon" aria-hidden="true">
                    <Monitor strokeWidth={1.6} />
                  </div>
                  <span className={`room-map-presence-dot${isLive ? " is-live" : ""}`} aria-hidden="true" />
                </div>
                <div className="room-map-card-name">{student.name}</div>
                {student.showTeamName ? <div className="room-map-card-team">{student.teamName}</div> : null}
                {isLive && connectedName ? <div className="room-map-card-live-name">Conectado: {connectedName}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TokenManagementPanel({
  event,
  selectedMissionId,
  onSelectMission,
  customLimitInput,
  onChangeCustomLimitInput,
  onSavePolicy,
}) {
  if (!event) return <div className="teams-empty">Selecione um evento para gerir os tokens.</div>;

  const missionOptions = [
    { id: TOKEN_MISSION_TRAINING_ID, name: "Treino" },
    ...(event.missions || []).map((mission) => ({ id: mission.id, name: normalizeMission(mission).name })),
  ];
  const activeMissionId = selectedMissionId || missionOptions[0]?.id || "";
  const activePolicy = getMissionTokenPolicy(event, activeMissionId, { isTraining: activeMissionId === TOKEN_MISSION_TRAINING_ID });
  const activeBaseLimit = getMissionTokenBaseLimit(activePolicy);

  return (
    <section className="fac-tools-section">
      <div className="fac-tools-head">
        <div className="fac-tools-title">Gestão de tokens</div>
        <div className="fac-tools-meta">Configuração por fluxo</div>
      </div>

      <div className="token-management-panel token-management-panel-compact">
        <div className="mini-label">Fluxos</div>
        <div className="token-mission-pill-row">
          {missionOptions.map((mission) => (
            <button
              key={mission.id}
              type="button"
              className={`choice-pill${mission.id === activeMissionId ? " active" : ""}`}
              onClick={() => onSelectMission(mission.id)}
            >
              {mission.name}
            </button>
          ))}
        </div>

        <div className="mini-label">Defina limites</div>
        <div className="token-mode-list">
          <button
            className={`token-mode-row${activePolicy.mode === TOKEN_POLICY_MODE_UNLIMITED ? " is-active" : ""}`}
            type="button"
            onClick={() => onSavePolicy(activeMissionId, { mode: TOKEN_POLICY_MODE_UNLIMITED, customLimit: 0 })}
          >
            <span className="token-mode-row-main">
              <strong>Ilimitado</strong>
              <small>Sem limite de tokens</small>
            </span>
          </button>
          <button
            className={`token-mode-row${activePolicy.mode === TOKEN_POLICY_MODE_DEFAULT ? " is-active" : ""}`}
            type="button"
            onClick={() => onSavePolicy(activeMissionId, { mode: TOKEN_POLICY_MODE_DEFAULT, customLimit: DEFAULT_MISSION_TOKEN_LIMIT })}
          >
            <span className="token-mode-row-main">
              <strong>Padrão</strong>
              <span className="token-mode-row-value">
                <b>{DEFAULT_MISSION_TOKEN_LIMIT.toLocaleString("pt-BR")}</b>
                <small>tokens</small>
              </span>
            </span>
          </button>
          <div className={`token-mode-row token-mode-row-custom${activePolicy.mode === TOKEN_POLICY_MODE_CUSTOM ? " is-active" : ""}`}>
            <div className="token-mode-row-main">
              <strong>Personalizado</strong>
            </div>
            <div className="fac-timer-input-row token-policy-custom-row">
              <div className="token-policy-custom-input-wrap">
                <input
                type="text"
                inputMode="numeric"
                min="1"
                value={customLimitInput}
                onChange={(event) => onChangeCustomLimitInput(formatTokenLimitInput(event.target.value))}
                placeholder="15000"
              />
                <span className="token-policy-custom-suffix">tokens</span>
              </div>
              <button
                className="btn btn-sm topbar-roommap-btn"
                type="button"
                onClick={() =>
                  onSavePolicy(activeMissionId, {
                    mode: TOKEN_POLICY_MODE_CUSTOM,
                    customLimit: Math.max(1, parseTokenLimitInput(customLimitInput) || DEFAULT_MISSION_TOKEN_LIMIT),
                  })
                }
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FacilitatorToolsDrawer({
  event,
  activeView,
  apiConfigured,
  announcement,
  announcementCount,
  timer,
  timerRunning,
  timerRemainingMs,
  timerNotice,
  timerMinutesInput,
  onChangeTimerMinutes,
  onChangeView,
  onClose,
  onOpenConfig,
  onOpenBroadcast,
  onStartTimer,
  onAddTimer,
  onClearTimer,
  onDismissTimerNotice,
  onPublishScreenShare,
  screenShare,
  tokenGrantTargetMissionId,
  onChangeTokenGrantTargetMissionId,
  tokenPolicyCustomInput,
  onChangeTokenPolicyCustomInput,
  onSaveMissionTokenPolicy,
}) {
  const toolCards = [
    {
      id: FACILITATOR_TOOL_VIEWS.CONFIG,
      title: "Configuração da IA",
      meta: apiConfigured ? "API ligada" : "API não configurada",
      icon: Sparkles,
    },
    {
      id: FACILITATOR_TOOL_VIEWS.BROADCAST,
      title: "Mensagem para a turma",
      meta: announcementCount ? `${announcementCount} mensagem(ns)` : "Nenhum aviso ativo",
      icon: MessageSquareText,
    },
    {
      id: FACILITATOR_TOOL_VIEWS.TIMER,
      title: "Cronômetro",
      meta: timerRunning ? formatCountdown(timerRemainingMs) : "Nenhum cronômetro ativo",
      icon: CircleAlert,
    },
    {
      id: FACILITATOR_TOOL_VIEWS.ROOM_MAP,
      title: "Mapa da sala",
      meta: event ? `${getEventStudentOptions(event).length} posições` : "Selecione um evento",
      icon: Map,
    },
    {
      id: FACILITATOR_TOOL_VIEWS.TOKENS,
      title: "Gestão de tokens",
      meta: event ? "Configurar limite por missão" : "Selecione um evento",
      icon: Coins,
    },
  ];
  const viewingMenu = activeView === FACILITATOR_TOOL_VIEWS.MENU;
  const activeCard = toolCards.find((item) => item.id === activeView);
  return (
    <div className="side-sheet-backdrop" onClick={onClose}>
      <aside className="side-sheet side-sheet-right" onClick={(ev) => ev.stopPropagation()}>
        <div className="side-sheet-header">
          <div>
            <div className="side-sheet-kicker">Facilitador</div>
            <div className="side-sheet-title">{viewingMenu ? "Ferramentas do facilitador" : activeCard?.title}</div>
          </div>
          <button className="side-sheet-close" aria-label="Fechar ferramentas do facilitador" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="side-sheet-body facilitator-tools-body">
          {viewingMenu ? (
            <div className="fac-tools-menu">
              {toolCards.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} className="fac-tool-entry" onClick={() => onChangeView(item.id)}>
                    <span className="fac-tool-entry-icon" aria-hidden="true">
                      <Icon size={18} strokeWidth={1.7} />
                    </span>
                    <span className="fac-tool-entry-copy">
                      <span className="fac-tool-entry-title">{item.title}</span>
                      <span className="fac-tool-entry-meta">{item.meta}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <button className="fac-tools-back" aria-label="Voltar para ferramentas" onClick={() => onChangeView(FACILITATOR_TOOL_VIEWS.MENU)}>
                <ArrowLeft size={16} strokeWidth={1.9} aria-hidden="true" />
              </button>

              {activeView === FACILITATOR_TOOL_VIEWS.CONFIG ? (
                <section className="fac-tools-section">
                  <div className="fac-tools-head">
                    <div className="fac-tools-title">Configuração da IA</div>
                    <div className="fac-tools-meta">{apiConfigured ? "API ligada" : "API não configurada"}</div>
                  </div>
                  <div className="fac-tools-inline-copy">
                    {apiConfigured
                      ? "A conexão com a OpenAI já está ativa para este laboratório."
                      : "Conecte a API para liberar respostas reais, análise técnica e modo coding."}
                  </div>
                  <button className={`btn btn-sm topbar-api-btn${apiConfigured ? " is-connected" : ""}`} onClick={onOpenConfig}>
                    {apiConfigured ? "Ver configuração" : "Configurar IA"}
                  </button>
                </section>
              ) : null}

              {activeView === FACILITATOR_TOOL_VIEWS.BROADCAST ? (
                <section className="fac-tools-section">
                  <div className="fac-tools-head">
                    <div className="fac-tools-title">Mensagem para a turma</div>
                    <div className="fac-tools-meta">{announcementCount ? `${announcementCount} mensagem(ns)` : "Nenhum aviso ativo"}</div>
                  </div>
                  {announcement ? <div className="fac-tools-inline-copy">{announcement.message}</div> : null}
                  <button className={`btn btn-sm topbar-roommap-btn${announcementCount ? " is-active" : ""}`} disabled={!event} onClick={onOpenBroadcast}>
                    <MessageSquareText size={14} strokeWidth={1.7} aria-hidden="true" />
                    {announcementCount ? "Nova mensagem" : "Criar mensagem"}
                  </button>
                </section>
              ) : null}

              {activeView === FACILITATOR_TOOL_VIEWS.TIMER ? (
                <section className="fac-tools-section">
                  <div className="fac-tools-head">
                    <div className="fac-tools-title">Cronômetro</div>
                    <div className="fac-tools-meta">
                      {timerRunning ? `Rodando · ${formatCountdown(timerRemainingMs)}` : "Nenhum cronômetro ativo"}
                    </div>
                  </div>
                  {timerNotice ? (
                    <div className="fac-tools-inline-copy">
                      {timerNotice.message}
                    </div>
                  ) : null}
                  <div className="fac-timer-controls">
                    <div className="fac-timer-input-row">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={timerMinutesInput}
                        onChange={(event) => onChangeTimerMinutes(event.target.value)}
                        placeholder="00:00"
                      />
                      {!timerRunning ? (
                        <button className="btn btn-sm btn-primary" disabled={!event} onClick={onStartTimer}>
                          Iniciar
                        </button>
                      ) : (
                        <button className="btn btn-sm topbar-roommap-btn" disabled={!event} onClick={() => onAddTimer()}>
                          Acrescentar
                        </button>
                      )}
                      {timerRunning ? (
                        <button className="btn btn-sm btn-ghost btn-danger" disabled={!event} onClick={onClearTimer}>
                          Encerrar
                        </button>
                      ) : null}
                    </div>
                    <div className="fac-timer-quick-row">
                      {timerNotice ? (
                        <button className="btn btn-sm topbar-roommap-btn" disabled={!event} onClick={onDismissTimerNotice}>
                          Ocultar aviso
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>
              ) : null}

              {activeView === FACILITATOR_TOOL_VIEWS.ROOM_MAP ? (
                <section className="fac-tools-section">
                  <div className="fac-tools-head">
                    <div className="fac-tools-title">Mapa da sala</div>
                    <div className="fac-tools-meta">{event ? `${getEventStudentOptions(event).length} posições` : "Selecione um evento"}</div>
                  </div>
                  {event ? <RoomMapPanel event={event} /> : <div className="teams-empty">Selecione um evento para ver quem está logado.</div>}
                </section>
              ) : null}

              {activeView === FACILITATOR_TOOL_VIEWS.TOKENS ? (
                <TokenManagementPanel
                  event={event}
                  selectedMissionId={tokenGrantTargetMissionId}
                  onSelectMission={onChangeTokenGrantTargetMissionId}
                  customLimitInput={tokenPolicyCustomInput}
                  onChangeCustomLimitInput={onChangeTokenPolicyCustomInput}
                  onSavePolicy={onSaveMissionTokenPolicy}
                />
              ) : null}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
