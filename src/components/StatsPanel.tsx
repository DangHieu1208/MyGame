import type { Player } from './game/types'

interface StatBarProps {
  icon: string
  name: string
  current: number
  max: number
  variant: 'hp' | 'sta'
}

function StatBar({ icon, name, current, max, variant }: StatBarProps) {
  const pct = Math.round((current / max) * 100)
  return (
    <div className="stat-bar">
      <div className="stat-bar__header">
        <span className="stat-bar__name">
          <span className="stat-bar__icon" aria-hidden="true">{icon}</span>
          {name}
        </span>
        <span className="stat-bar__value">{current}/{max}</span>
      </div>
      <div className="stat-bar__track" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={max} aria-label={name}>
        <div
          className={`stat-bar__fill stat-bar__fill--${variant}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

interface AttrItemProps {
  icon: string
  label: string
  value: number | string
}

function AttrItem({ icon, label, value }: AttrItemProps) {
  return (
    <div className="attr-item">
      <span className="attr-item__icon" aria-hidden="true">{icon}</span>
      <span className="attr-item__label">{label}</span>
      <span className="attr-item__value">{value}</span>
    </div>
  )
}

interface StatsPanelProps {
  player?: Player
}

export default function StatsPanel({ player }: StatsPanelProps) {
  if (!player) {
    return (
      <aside className="stats-panel" aria-label="Character statistics">
        <p className="stats-panel__section-title">No Character Active</p>
      </aside>
    )
  }

  return (
    <aside className="stats-panel" aria-label="Character statistics">
      {/* Score */}
      <div>
        <p className="stats-panel__section-title">Score</p>
        <div className="score-card">
          <p className="score-card__label">Total Score</p>
          <p className="score-card__value" aria-label={`${player.score} points`}>{player.score.toLocaleString()}</p>
        </div>
      </div>

      {/* Vitals */}
      <div>
        <p className="stats-panel__section-title">Vitals</p>
        <StatBar icon="❤️" name="Health" current={player.hp} max={player.maxHp} variant="hp" />
        <StatBar icon="⚡" name="Stamina" current={player.stamina} max={player.maxStamina} variant="sta" />
      </div>

      {/* Attributes */}
      <div>
        <p className="stats-panel__section-title">Attributes</p>
        <div className="attr-grid">
          <AttrItem icon="⚔️" label="Attack" value={player.attack} />
          <AttrItem icon="🛡️" label="Defense" value={player.defense} />
          <AttrItem icon="💨" label="Speed" value={player.speed} />
          <AttrItem icon="💎" label="Level" value={player.level} />
        </div>
      </div>
    </aside>
  )
}
