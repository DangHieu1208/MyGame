import type { Player } from './game/types'

interface StatBarProps {
  icon: string; name: string; current: number; max: number; variant: 'hp' | 'sta';
}

function StatBar({ icon, name, current, max, variant }: StatBarProps) {
  const pct = Math.round((current / max) * 100)
  return (
    <div className="stat-bar">
      <div className="stat-bar__header">
        <span className="stat-bar__name">
          <span className="stat-bar__icon">{icon}</span> {name}
        </span>
        <span className="stat-bar__value">{current}/{max}</span>
      </div>
      <div className="stat-bar__track">
        <div className={`stat-bar__fill stat-bar__fill--${variant}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface AttrItemProps {
  icon: string; label: string; value: number | string;
}

function AttrItem({ icon, label, value }: AttrItemProps) {
  return (
    <div className="attr-item">
      <span className="attr-item__icon">{icon}</span>
      <span className="attr-item__label">{label}</span>
      <span className="attr-item__value">{value}</span>
    </div>
  )
}

interface StatsPanelProps {
  player?: Player;
  obstacles?: number;
}

export default function StatsPanel({ player, obstacles }: StatsPanelProps) {
  if (!player) return (
    <aside className="stats-panel"><p className="stats-panel__section-title">No Game Active</p></aside>
  );

  return (
    <aside className="stats-panel">
      <div>
        <p className="stats-panel__section-title">Score</p>
        <div className="score-card">
          <p className="score-card__label">Total Score</p>
          <p className="score-card__value">{player.score.toLocaleString()}</p>
          {player.isImmune && <p style={{color:'#f0b429', fontSize:11, marginTop:4}}>✨ IMMUNITY ACTIVE ✨</p>}
        </div>
      </div>

      <div>
        <p className="stats-panel__section-title">Vitals</p>
        <StatBar icon="❤️" name="Health" current={player.hp} max={player.maxHp} variant="hp" />
        <StatBar icon="⚡" name="Stamina" current={player.stamina} max={player.maxStamina} variant="sta" />
      </div>

      <div>
        <p className="stats-panel__section-title">Equipment</p>
        <div className="attr-item" style={{border: '1px solid #a04aff'}}>
          <span className="attr-item__icon">🧱</span>
          <span className="attr-item__label">Obstacles Left</span>
          <span className="attr-item__value" style={{color: '#a04aff'}}>{obstacles}</span>
        </div>
      </div>

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
