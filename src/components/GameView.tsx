import { useEffect, useRef } from 'react';
import type { GameState, Dir } from './game/types';
import { render, TILE } from './game/renderer';

interface GameViewProps {
  gs: GameState | null;
  onStart: (level?: number, prevScore?: number) => void;
  onMove: (dir: Dir) => void;
  onUpgrade: (stat: 'hp' | 'atk' | 'def' | 'spd') => void;
  onUpdateSettings: (volume?: number, skin?: string) => void;
}

function useGameCanvas(gs: GameState | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!gs || gs.upgrading || gs.showingSettings || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const p = gs.player;
    const cw = canvasRef.current.clientWidth;
    const ch = canvasRef.current.clientHeight;
    const camX = p.drawPos.x * TILE + TILE / 2 - cw / 2;
    const camY = p.drawPos.y * TILE + TILE / 2 - ch / 2;
    render(ctx, gs, camX, camY);
  });
  return canvasRef;
}

export default function GameView({ gs, onStart, onUpgrade, onUpdateSettings }: GameViewProps) {
  const canvasRef = useGameCanvas(gs);

  if (!gs) return (
    <main className="game-view">
      <div className="game-view__canvas">
        <div className="game-placeholder">
          <div className="game-placeholder__icon">⚔️</div>
          <h1 className="game-placeholder__title">Maze Runner</h1>
          <button className="game-start-btn" onClick={() => onStart(1)}>Start Game</button>
        </div>
      </div>
    </main>
  );

  // ── Settings Screen ────────────────────────────────────────────────────────
  if (gs.showingSettings) {
    return (
      <main className="game-view">
        <div className="game-view__canvas">
          <div className="game-placeholder">
            <h1 className="game-placeholder__title">Settings</h1>
            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#8892b0' }}>Master Volume</label>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={gs.volume} 
                  onChange={(e) => onUpdateSettings(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#8892b0' }}>Character Skin</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {['original', 'gold', 'emerald', 'void'].map(s => (
                    <button 
                      key={s} 
                      className="game-start-btn" 
                      style={{ margin: 0, padding: '8px', fontSize: '12px', opacity: gs.player.skin === s ? 1 : 0.5 }}
                      onClick={() => onUpdateSettings(undefined, s)}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#4a5270', marginTop: '10px' }}>
                Tip: Press [Space] during game to place obstacles.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (gs.upgrading) return (
    <main className="game-view">
      <div className="game-view__canvas">
        <div className="game-placeholder">
          <div className="game-placeholder__icon">✨</div>
          <h1 className="game-placeholder__title">Level {gs.level} Clear!</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
            <button className="game-start-btn" style={{margin:0}} onClick={() => onUpgrade('hp')}>❤️ +10 HP</button>
            <button className="game-start-btn" style={{margin:0}} onClick={() => onUpgrade('atk')}>⚔️ +2 ATK</button>
            <button className="game-start-btn" style={{margin:0}} onClick={() => onUpgrade('def')}>🛡️ +1 DEF</button>
            <button className="game-start-btn" style={{margin:0}} onClick={() => onUpgrade('spd')}>💨 +1 SPD</button>
          </div>
        </div>
      </div>
    </main>
  );

  if (gs.gameOver) return (
    <main className="game-view">
      <div className="game-view__canvas">
        <div className="game-placeholder">
          <div className="game-placeholder__icon">💀</div>
          <h1 className="game-placeholder__title">Game Over</h1>
          <button className="game-start-btn" onClick={() => onStart(1, 0)}>Try Again</button>
        </div>
      </div>
    </main>
  );

  return (
    <main className="game-view">
      <div className="game-view__canvas">
        <canvas ref={canvasRef} width={gs.width * TILE} height={gs.height * TILE} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }} />
      </div>
      <div className="game-view__hud">
        <div className="hud-item">Level {gs.level}</div>
        <div className="hud-item">Obstacles: {gs.maxObstacles - gs.obstacles.length} / {gs.maxObstacles} [SPACE]</div>
        <div className="hud-item">{gs.player.isImmune ? <span style={{color:'#f0b429'}}>✨ IMMUNE</span> : `Kills: ${gs.killsThisLevel}/2`}</div>
      </div>
    </main>
  );
}
