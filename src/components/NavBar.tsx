import { useState } from 'react'

const NAV_ITEMS = ['Play', 'Inventory', 'Map', 'Shop', 'Settings']

export default function NavBar() {
  const [active, setActive] = useState('Play')

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <a className="navbar__brand" href="#" aria-label="Game home">
        <div className="navbar__logo" aria-hidden="true">⚔️</div>
        <span className="navbar__title">MyGame</span>
      </a>

      {/* Navigation links */}
      <div className="navbar__nav" role="menubar">
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            id={`nav-btn-${item.toLowerCase()}`}
            role="menuitem"
            className={`navbar__nav-btn${active === item ? ' active' : ''}`}
            onClick={() => setActive(item)}
            aria-current={active === item ? 'page' : undefined}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Right-side actions */}
      <div className="navbar__actions">
        <div className="navbar__badge" aria-label="Current gold">
          <span aria-hidden="true">🪙</span>
          <span>4,250</span>
        </div>
        <div
          className="navbar__avatar"
          role="button"
          tabIndex={0}
          aria-label="Player profile"
          title="Player profile"
        >
          P
        </div>
      </div>
    </nav>
  )
}
