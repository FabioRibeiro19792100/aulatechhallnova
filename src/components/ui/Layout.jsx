import techHallLogoDark from "../../../tech_hall_branding/tech_hall_preto.png";
import techHallFooterIcon from "../../../tech_hall_branding/icone_8.png";

export function Topbar({ onLogoClick, right, roleBadge, leftMeta = null }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="logo" onClick={onLogoClick}>
          <img src={techHallLogoDark} alt="Tech Hall" className="brand-wordmark topbar-wordmark" />
          {roleBadge ? <span className="badge-role">{roleBadge}</span> : null}
        </button>
        {leftMeta ? <div className="topbar-left-meta">{leftMeta}</div> : null}
      </div>
      <div className="topbar-right">{right}</div>
    </div>
  );
}

export function AppFooter({ compact = false }) {
  return (
    <footer className={`app-footer${compact ? " is-compact" : ""}`}>
      <div className="app-footer-inner">
        <div className="app-footer-copy-block">
          <div className="app-footer-brand">
            <span className="app-footer-title app-footer-title-brand">Tech Hall AI Lab</span>
          </div>
          <div className="app-footer-copy">Laboratório de prática com IA para times</div>
        </div>
        <img className="app-footer-corner-icon" src={techHallFooterIcon} alt="" aria-hidden="true" />
      </div>
    </footer>
  );
}

export function DevQuickSwitch({
  events,
  currentEventId,
  currentTeamIdx,
  currentScreen,
  selectedEvent,
  onPickEvent,
  onPickTeam,
  onOpenFacilitador,
  onOpenEntrada,
  onOpenTeamSelection,
  onOpenWorkspace,
}) {
  return (
    <div className="dev-switch">
      <span className="dev-switch-label">Dev</span>
      <select value={currentEventId} onChange={(event) => onPickEvent(event.target.value)}>
        <option value="">Evento</option>
        {events.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <select
        value={currentTeamIdx}
        onChange={(event) => onPickTeam(event.target.value)}
        disabled={!selectedEvent?.teams?.length}
      >
        <option value="">Time</option>
        {(selectedEvent?.teams || []).map((teamItem, index) => (
          <option key={`${teamItem.name}-${index}`} value={index}>
            {teamItem.name}
          </option>
        ))}
      </select>
      <div className="dev-switch-actions">
        <button className={`dev-chip${currentScreen === "facilitador" ? " active" : ""}`} onClick={onOpenFacilitador}>
          Fac
        </button>
        <button className={`dev-chip${currentScreen === "entry" ? " active" : ""}`} onClick={onOpenEntrada}>
          Código
        </button>
        <button className={`dev-chip${currentScreen === "team" ? " active" : ""}`} onClick={onOpenTeamSelection}>
          Times
        </button>
        <button className={`dev-chip${currentScreen === "workspace" ? " active" : ""}`} onClick={onOpenWorkspace}>
          WS
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-sub">{sub}</div>
    </div>
  );
}
