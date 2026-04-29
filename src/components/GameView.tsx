import { useEffect, useRef } from 'react';
import type { GameState, Dir } from './game/types';
import { render, TILE } from './game/renderer';

const MAT_COLORS: Record<string, string> = {
  red: '#ff4a6c', blue: '#4a6cff', green: '#4affa0', yellow: '#f0b429',
};

interface GameViewProps {
  gs: GameState | null;
  onStart: (level?: number, prevScore?: number) => void;
  onMove: (dir: Dir) => void;
  onUpgrade: (stat: 'hp' | 'atk' | 'def' | 'spd') => void;
}

function useGameCanvas(gs: GameState | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!gs || gs.upgrading || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const p = gs.player;
    const cw = canvasRef.current.clientWidth;
    const ch = canvasRef.current.clientHeight;
    // Camera uses drawPos for smooth tracking
    const camX = p.drawPos.x * TILE + TILE / 2 - cw / 2;
    const camY = p.drawPos.y * TILE + TILE / 2 - ch / 2;
    render(ctx, gs, camX, camY);
  });
  return canvasRef;
}

export default function GameView({ gs, onStart, onMove, onUpgrade }: GameViewProps) {
  useEffect(() => {
    const DIR_MAP: Record<string, Dir> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };
    const onKey = (e: KeyboardEvent) => {
      const dir = DIR_MAP[e.key];
      if (!dir || !gs) return;
      e.preventDefault();
      onMove(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gs !== null, onMove]);

  const canvasRef = useGameCanvas(gs);

  if (!gs) {
    return (
      <main className="game-view">
        <div className="game-view__canvas">
          <div className="game-placeholder">
            <div className="game-placeholder__icon">⚔️</div>
            <h1 className="game-placeholder__title">Maze Runner</h1>
            <p className="game-placeholder__sub">Now with Smooth Movement & Upgrades!</p>
            <button className="game-start-btn" onClick={() => onStart(1)}>Start Game</button>
          </div>
        </div>
      </main>
    );
  }

  // ── Upgrade Screen ─────────────────────────────────────────────────────────
  if (gs.upgrading) {
    return (
      <main className="game-view">
        <div className="game-view__canvas">
          <div className="game-placeholder">
            <div className="game-placeholder__icon">✨</div>
            <h1 className="game-placeholder__title">Level {gs.level} Clear!</h1>
            <p className="game-placeholder__sub">Choose an attribute to upgrade for Level {gs.level + 1}:</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
              <button className="game-start-btn" style={{margin:0}} onClick={() => onUpgrade('hp')}>❤️ +10 Max HP</button>
              <button className="game-start-btn" style={{margin:0}} onClick={() => onUpgrade('atk')}>⚔️ +2 Attack</button>
              <button className="game-start-btn" style={{margin:0}} onClick={() => onUpgrade('def')}>🛡️ +1 Defense</button>
              <button className="game-start-btn" style={{margin:0}} onClick={() => onUpgrade('spd')}>💨 +1 Speed</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (gs.gameOver) {
    return (
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
  }

  const p = gs.player;
  return (
    <main className="game-view">
      <div className="game-view__canvas">
        <canvas
          ref={canvasRef}
          width={gs.width * TILE}
          height={gs.height * TILE}
          style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }}
        />
      </div>
      <div className="game-view__hud">
        <div className="hud-item">Level {gs.level}</div>
        <div className="hud-item">
          {p.held ? <span style={{ color: MAT_COLORS[p.held] }}>Holding {p.held}</span> : 'Hands empty'}
        </div>
        <div className="hud-item">Enemies: {gs.monsters.filter(m => !m.dead).length}</div>
      </div>
    </main>
  );
}
