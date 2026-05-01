import type { GameState, MatColor } from './types';

export const TILE = 28;

const MAT_COLORS: Record<MatColor, string> = {
  red:    '#ff4a6c',
  blue:   '#4a6cff',
  green:  '#4affa0',
  yellow: '#f0b429',
};

const SKINS: Record<string, string[]> = {
  original: ['#a0b4ff', '#4a6cff'],
  gold:     ['#f0b429', '#8a6500'],
  emerald:  ['#4affa0', '#00703c'],
  void:     ['#a04aff', '#3a008a'],
};

export function render(ctx: CanvasRenderingContext2D, gs: GameState, camX: number, camY: number) {
  const { width: W, height: H } = gs;
  const time = Date.now();
  
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.translate(-camX, -camY);

  // ── 1. Grid ──────────────────────────────────────────────────────────────
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x * TILE, py = y * TILE;
      const tile = gs.grid[y][x];

      if (tile.type === 'wall') {
        ctx.fillStyle = '#0d1020';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#1c2136';
        ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      } else if (tile.type === 'gem_floor') {
        const color = tile.color ? MAT_COLORS[tile.color] : '#4a6cff';
        // Base floor
        ctx.fillStyle = '#121626';
        ctx.fillRect(px, py, TILE, TILE);
        
        // Gem glow pattern
        ctx.fillStyle = color + '11';
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        
        // Crystalline accents
        ctx.strokeStyle = color + '33';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 4, py + 4); ctx.lineTo(px + TILE - 4, py + TILE - 4);
        ctx.moveTo(px + TILE - 4, py + 4); ctx.lineTo(px + 4, py + TILE - 4);
        ctx.stroke();
      } else if (tile.type === 'monster_floor') {
        // Dark, dangerous floor
        ctx.fillStyle = '#0a0c14';
        ctx.fillRect(px, py, TILE, TILE);
        
        // Menacing red highlights
        ctx.fillStyle = '#ff003308';
        ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        
        // Scratch marks
        ctx.strokeStyle = '#ff4a6c22';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 2; i++) {
          const sx = px + 4 + Math.random() * (TILE - 8);
          const sy = py + 4 + Math.random() * (TILE - 8);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + 4, sy + 4);
          ctx.stroke();
        }
      } else if (tile.type === 'bridge_floor') {
        // Wooden/Path bridge style
        ctx.fillStyle = '#1c2136';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = '#2a3050';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
        // Horizontal planks
        ctx.beginPath();
        for (let i = 4; i < TILE; i += 8) {
            ctx.moveTo(px + 4, py + i); ctx.lineTo(px + TILE - 4, py + i);
        }
        ctx.stroke();
      } else {
        // Normal path
        ctx.fillStyle = '#10131f';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = '#1c2136';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, TILE, TILE);
      }
    }
  }

  // ── 2. Obstacles ──────────────────────────────────────────────────────────
  for (const obs of gs.obstacles) {
    const px = obs.pos.x * TILE + 4, py = obs.pos.y * TILE + 4;
    const s = TILE - 8;
    const pulse = (Math.sin(time / 200) + 1) / 2;
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, s, s);
    ctx.fillStyle = `rgba(160, 74, 255, ${0.3 + pulse * 0.2})`;
    ctx.fillRect(px, py, s, s);

    if (obs.breakProgress > 0) {
      const barW = TILE - 4;
      const barX = obs.pos.x * TILE + 2;
      const barY = obs.pos.y * TILE - 6;
      ctx.fillStyle = '#330011';
      ctx.fillRect(barX, barY, barW, 4);
      ctx.fillStyle = '#ff4a6c';
      ctx.fillRect(barX, barY, barW * (obs.breakProgress / 10), 4);
    }
  }

  // ── 3. Portal (RESTORED VORTEX) ──────────────────────────────────────────
  {
    const { pos, open } = gs.portal;
    const px = pos.x * TILE + TILE / 2, py = pos.y * TILE + TILE / 2;
    if (open) {
      const angle = (time / 500) % (Math.PI * 2);
      for (let i = 0; i < 3; i++) {
        const pulse = (Math.sin(time / 300 + i) + 1) / 2;
        const r = 8 + pulse * 6 + i * 2;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle * (i % 2 === 0 ? 1 : -1));
        ctx.strokeStyle = i === 0 ? '#fff' : (i === 1 ? '#7a96ff' : '#4a6cff44');
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 1.5); ctx.stroke();
        ctx.restore();
      }
    } else {
      ctx.fillStyle = '#2a3050';
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ── 4. Receptors ──────────────────────────────────────────────────────────
  for (const rec of gs.receptors) {
    const px = rec.pos.x * TILE + 2, py = rec.pos.y * TILE + 2;
    ctx.strokeStyle = MAT_COLORS[rec.color];
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, TILE - 4, TILE - 4);
    if (rec.filled) {
      ctx.fillStyle = MAT_COLORS[rec.color] + '88';
      ctx.fillRect(px, py, TILE - 4, TILE - 4);
    }
  }

  // ── 5. Materials (RESTORED FLOATING GEMS) ────────────────────────────────
  for (const mat of gs.materials) {
    if (mat.pickedUp) continue;
    const px = mat.pos.x * TILE + TILE / 2;
    const floatY = Math.sin(time / 400 + mat.id) * 4;
    const py = mat.pos.y * TILE + TILE / 2 + floatY;
    const r = 7 + (Math.sin(time / 600) + 1) * 1;
    ctx.shadowBlur = 10; ctx.shadowColor = MAT_COLORS[mat.color];
    ctx.fillStyle = MAT_COLORS[mat.color];
    ctx.beginPath(); ctx.moveTo(px, py - r); ctx.lineTo(px + r, py); ctx.lineTo(px, py + r); ctx.lineTo(px - r, py);
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  }

  // ── 6. Monsters (RESTORED FULL ANIMATIONS) ───────────────────────────────
  for (const m of gs.monsters) {
    if (m.dead) continue;
    const px = m.drawPos.x * TILE + TILE / 2;
    const py = m.drawPos.y * TILE + TILE / 2;
    const isMoving = Math.abs(m.drawPos.x - m.pos.x) > 0.01 || Math.abs(m.drawPos.y - m.pos.y) > 0.01;
    const bob = isMoving ? Math.abs(Math.sin(time / 150)) * 4 : 0;
    const rageShake = gs.player.held ? (Math.random() - 0.5) * 2 : 0;
    const angryPulse = m.angryTimer > 0 ? (Math.sin(time / 100) + 1) * 2 : 0;

    ctx.save();
    ctx.translate(px + rageShake, py - bob + rageShake);
    const scaleY = 1 + (bob / 20) + (angryPulse / 20);
    const scaleX = 1 - (bob / 40);
    ctx.scale(scaleX, scaleY);

    if (m.state === 'rage' || gs.player.held) {
      const pulse = (Math.sin(time / 150) + 1) / 2;
      ctx.fillStyle = `rgba(255, 0, 0, ${m.state === 'rage' ? 0.4 + pulse * 0.4 : 0.2 + pulse * 0.3})`;
      ctx.beginPath(); ctx.arc(0, 0, m.state === 'rage' ? 22 : 18, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = (m.state === 'chase' || gs.player.held) ? '#ff0033' : '#cc3344';
    ctx.beginPath(); ctx.arc(0, 2, 8, 0, Math.PI * 2); ctx.fill();
    
    if (!(m.angryTimer > 0 && Math.floor(time / 200) % 2 === 0)) {
      ctx.fillStyle = (m.state === 'chase' || gs.player.held) ? '#fff' : '#ffeeaa';
      ctx.beginPath(); ctx.arc(-3, -1, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(3, -1, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    if (m.angryTimer > 0) {
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('💢', px, py - 20 - angryPulse);
    }
    const barW = TILE - 6; ctx.fillStyle = '#330011'; ctx.fillRect(px - barW / 2, py - 13, barW, 4);
    ctx.fillStyle = '#ff4a6c'; ctx.fillRect(px - barW / 2, py - 13, barW * (m.hp / m.maxHp), 4);
  }

  // ── 7. Player (SMOOTH BOUNCE) ────────────────────────────────────────────
  {
    const p = gs.player;
    const px = p.drawPos.x * TILE + TILE / 2, py = p.drawPos.y * TILE + TILE / 2;
    const isMoving = Math.abs(p.drawPos.x - p.pos.x) > 0.05 || Math.abs(p.drawPos.y - p.pos.y) > 0.05;
    const bobY = isMoving ? Math.sin(time / 250) * 2 : 0;
    const blink = (p.invincible > 0 && Math.floor(time / 80) % 2 === 0) || (p.isImmune && p.immunityTimer < 2000 && Math.floor(time / 150) % 2 === 0);
    if (!blink) {
      ctx.save(); ctx.translate(px, py + bobY);
      if (p.isImmune) { ctx.shadowBlur = 15; ctx.shadowColor = '#f0b429'; }
      const colors = SKINS[p.skin] || SKINS.original;
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 10);
      grad.addColorStop(0, colors[0]); grad.addColorStop(1, colors[1]);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (p.held) { ctx.fillStyle = MAT_COLORS[p.held]; ctx.beginPath(); ctx.arc(8, -8, 5, 0, Math.PI * 2); ctx.fill(); }
      if (p.isImmune) { ctx.fillStyle = '#f0b429'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${(p.immunityTimer / 1000).toFixed(1)}s`, 0, -14); }
      ctx.restore();
    }
  }

  // ── 8. Float Messages ─────────────────────────────────────────────────────
  for (const msg of gs.floatMsgs) {
    const age = gs.tick - msg.tick;
    const alpha = 1 - age / 1000;
    const py = msg.y * TILE - (age / 1000) * 24;
    ctx.globalAlpha = Math.max(0, alpha); ctx.fillStyle = msg.color; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(msg.text, msg.x * TILE + TILE / 2, py); ctx.globalAlpha = 1;
  }
  ctx.restore();
}
