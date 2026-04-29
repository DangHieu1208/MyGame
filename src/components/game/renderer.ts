import type { GameState, MatColor } from './types';

export const TILE = 28;

const MAT_COLORS: Record<MatColor, string> = {
  red:    '#ff4a6c',
  blue:   '#4a6cff',
  green:  '#4affa0',
  yellow: '#f0b429',
};

export function render(ctx: CanvasRenderingContext2D, gs: GameState, camX: number, camY: number) {
  const { width: W, height: H } = gs;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.translate(-camX, -camY);

  // ── Grid ──────────────────────────────────────────────────────────────────
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x * TILE, py = y * TILE;
      if (gs.grid[y][x].type === 'wall') {
        ctx.fillStyle = '#0d1020';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#1c2136';
        ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      } else {
        ctx.fillStyle = '#10131f';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = '#1c2136';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, TILE, TILE);
      }
    }
  }

  // ── Portal ─────────────────────────────────────────────────────────────────
  {
    const { pos, open } = gs.portal;
    const px = pos.x * TILE + TILE / 2, py = pos.y * TILE + TILE / 2;
    if (open) {
      const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
      const r = 10 + pulse * 4;
      const grd = ctx.createRadialGradient(px, py, 1, px, py, r);
      grd.addColorStop(0, '#fff');
      grd.addColorStop(0.4, '#7a96ff');
      grd.addColorStop(1, '#4a6cff00');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ── Receptors ──────────────────────────────────────────────────────────────
  for (const rec of gs.receptors) {
    const px = rec.pos.x * TILE + 2, py = rec.pos.y * TILE + 2;
    ctx.strokeStyle = MAT_COLORS[rec.color];
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, TILE - 4, TILE - 4);
    if (rec.filled) {
      ctx.fillStyle = MAT_COLORS[rec.color] + '55';
      ctx.fillRect(px, py, TILE - 4, TILE - 4);
    }
  }

  // ── Materials ─────────────────────────────────────────────────────────────
  for (const mat of gs.materials) {
    if (mat.pickedUp) continue;
    const px = mat.pos.x * TILE + TILE / 2, py = mat.pos.y * TILE + TILE / 2;
    const r = 7 + (Math.sin(Date.now() / 500) + 1) * 1.5;
    ctx.fillStyle = MAT_COLORS[mat.color];
    ctx.beginPath();
    ctx.moveTo(px, py - r); ctx.lineTo(px + r, py);
    ctx.lineTo(px, py + r); ctx.lineTo(px - r, py);
    ctx.closePath(); ctx.fill();
  }

  // ── Monsters ──────────────────────────────────────────────────────────────
  for (const m of gs.monsters) {
    if (m.dead) continue;
    const px = m.drawPos.x * TILE + TILE / 2, py = m.drawPos.y * TILE + TILE / 2;
    
    // Draw rage glow
    if (gs.player.held) {
      const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
      ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + pulse * 0.2})`;
      ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fill();
    }

    // Body color changes based on state
    ctx.fillStyle = (m.state === 'chase' || gs.player.held) ? '#ff0033' : '#cc3344';
    ctx.beginPath(); ctx.arc(px, py + 2, 8, 0, Math.PI * 2); ctx.fill();
    
    // Eyes
    ctx.fillStyle = (m.state === 'chase') ? '#ff0000' : '#ffeeaa';
    ctx.beginPath(); ctx.arc(px - 3, py - 1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 3, py - 1, 2.5, 0, Math.PI * 2); ctx.fill();

    // Angry/Emotion Bubble
    if (m.angryTimer > 0) {
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💢', px, py - 18);
    }

    // HP bar
    const barW = TILE - 6;
    ctx.fillStyle = '#330011';
    ctx.fillRect(px - barW / 2, py - 13, barW, 4);
    ctx.fillStyle = '#ff4a6c';
    ctx.fillRect(px - barW / 2, py - 13, barW * (m.hp / m.maxHp), 4);
  }

  // ── Player ────────────────────────────────────────────────────────────────
  {
    const p = gs.player;
    const px = p.drawPos.x * TILE + TILE / 2, py = p.drawPos.y * TILE + TILE / 2;
    const blink = p.invincible > 0 && Math.floor(Date.now() / 80) % 2 === 0;
    if (!blink) {
      const grad = ctx.createRadialGradient(px, py, 1, px, py, 10);
      grad.addColorStop(0, '#a0b4ff');
      grad.addColorStop(1, '#4a6cff');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill();
      if (p.held) {
        ctx.fillStyle = MAT_COLORS[p.held];
        ctx.beginPath(); ctx.arc(px + 8, py - 8, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // ── Float Messages ────────────────────────────────────────────────────────
  for (const msg of gs.floatMsgs) {
    const age = gs.tick - msg.tick;
    const alpha = 1 - age / 1000;
    const py = msg.y * TILE - (age / 1000) * 24;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = msg.color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(msg.text, msg.x * TILE + TILE / 2, py);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
