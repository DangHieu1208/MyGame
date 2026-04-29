interface NavBarProps {
  onSettingsToggle: () => void;
  activeTab: 'Play' | 'Settings';
}

export default function NavBar({ onSettingsToggle, activeTab }: NavBarProps) {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar__brand">
        <div className="navbar__logo" aria-hidden="true">⚔️</div>
        <span className="navbar__title">Maze Runner</span>
      </div>

      <div className="navbar__nav" role="menubar">
        <button
          role="menuitem"
          className={`navbar__nav-btn${activeTab === 'Play' ? ' active' : ''}`}
          onClick={() => activeTab === 'Settings' && onSettingsToggle()}
        >
          Play
        </button>
        <button
          role="menuitem"
          className={`navbar__nav-btn${activeTab === 'Settings' ? ' active' : ''}`}
          onClick={() => activeTab === 'Play' && onSettingsToggle()}
        >
          Settings
        </button>
      </div>

      <div className="navbar__actions">
        <div className="navbar__avatar" title="Player Profile">P</div>
      </div>
    </nav>
  )
}
