import type { GameState, Dir, Monster, Vec2 } from './types';
import { sounds } from './SoundManager';

function adj(x: number, y: number, dir: Dir) {
  if (dir === 'up')    return { x, y: y - 1 };
  if (dir === 'down')  return { x, y: y + 1 };
  if (dir === 'left')  return { x: x - 1, y };
  return { x: x + 1, y };
}

function dist(a: Vec2, b: Vec2) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function isWalkable(gs: GameState, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= gs.width || y >= gs.height) return false;
  if (gs.grid[y][x].type === 'wall') return false;
  if (gs.obstacles.some(o => o.pos.x === x && o.pos.y === y)) return false;
  return true;
}

function floatMsg(gs: GameState, text: string, x: number, y: number, color: string) {
  gs.floatMsgs.push({ text, x, y, color, tick: gs.tick });
}

export function handleSpaceAction(gs: GameState) {
  const p = gs.player;
  const target = adj(p.pos.x, p.pos.y, p.facing);
  
  // 1. Check if we are facing an obstacle to BREAK it
  const obstacleToBreak = gs.obstacles.find(o => o.pos.x === target.x && o.pos.y === target.y);
  if (obstacleToBreak) {
    obstacleToBreak.breakProgress++;
    sounds.playAttack(); // Using attack sound for breaking
    if (obstacleToBreak.breakProgress >= 10) {
      gs.obstacles = gs.obstacles.filter(o => o !== obstacleToBreak);
      sounds.playDeath(); // Use death sound for shattering
      floatMsg(gs, 'Shattered!', target.x, target.y, '#ff4a6c');
    }
    return;
  }

  // 2. Otherwise, check if we can PLACE an obstacle at current position
  if (gs.obstacles.length >= gs.maxObstacles) {
    floatMsg(gs, 'Out of obstacles!', p.pos.x, p.pos.y, '#f0b429');
    return;
  }

  const currentPos = { ...p.pos };
  if (!gs.obstacles.some(o => o.pos.x === currentPos.x && o.pos.y === currentPos.y)) {
    gs.obstacles.push({ pos: currentPos, breakProgress: 0 });
    sounds.playPlace();
    floatMsg(gs, 'Barrier dropped!', currentPos.x, currentPos.y, '#7a96ff');
  }
}

export function movePlayer(gs: GameState, dir: Dir): boolean {
  if (gs.gameOver || gs.levelClear || gs.upgrading || gs.showingSettings) return false;
  if (gs.player.moveCooldown > 0) return false;

  const p = gs.player;
  p.facing = dir;
  const target = adj(p.pos.x, p.pos.y, dir);
  const tx = target.x, ty = target.y;

  const monster = gs.monsters.find(m => !m.dead && m.pos.x === tx && m.pos.y === ty);
  
  if (monster && !p.isImmune) {
    if (p.stamina <= 0) {
      floatMsg(gs, 'No Stamina!', p.pos.x, p.pos.y, '#f0b429');
      p.moveCooldown = 150;
      return false;
    }
    p.stamina = Math.max(0, p.stamina - 10);
    const dmg = Math.max(1, p.attack - monster.defense);
    monster.hp -= dmg;
    sounds.playAttack();
    floatMsg(gs, `-${dmg}`, tx, ty, '#ff4a6c');
    if (monster.hp <= 0) {
      monster.dead = true;
      p.score += 50;
      gs.killsThisLevel++;
      sounds.playDeath();
      if (gs.killsThisLevel === 2) {
        p.isImmune = true;
        p.immunityTimer = 8000;
      }
    }
    p.moveCooldown = 150; 
    return true;
  }

  if (!isWalkable(gs, tx, ty)) return false;

  p.pos = { x: tx, y: ty };
  p.moveCooldown = Math.max(60, 140 - (p.speed * 8));
  sounds.playMove();

  const mat = gs.materials.find(m => !m.pickedUp && m.pos.x === tx && m.pos.y === ty);
  if (mat) {
    if (p.held === null) {
      mat.pickedUp = true;
      p.held = mat.color;
      p.score += 10;
      sounds.playPick();
      floatMsg(gs, `Picked ${mat.color}!`, tx, ty, '#4affa0');
    }
  }

  const rec = gs.receptors.find(r => !r.filled && r.pos.x === tx && r.pos.y === ty);
  if (rec) {
    if (p.held === rec.color) {
      rec.filled = true;
      p.held = null;
      p.score += 100;
      sounds.playPlace();
      if (gs.receptors.every(r => r.filled)) {
        gs.portal.open = true;
        sounds.playUpgrade();
      }
    }
  }

  if (gs.portal.open && tx === gs.portal.pos.x && ty === gs.portal.pos.y) {
    gs.levelClear = true;
    sounds.playUpgrade();
  }

  return true;
}

export function tickTimers(gs: GameState, dt: number) {
  if (gs.gameOver || gs.upgrading || gs.showingSettings) return;
  const p = gs.player;
  
  if (p.moveCooldown > 0) p.moveCooldown = Math.max(0, p.moveCooldown - dt);
  if (p.invincible > 0)   p.invincible   = Math.max(0, p.invincible   - dt);
  
  if (p.isImmune) {
    p.immunityTimer = Math.max(0, p.immunityTimer - dt);
    if (p.immunityTimer === 0) {
      p.isImmune = false;
      floatMsg(gs, 'ETHEREAL FADED!', p.pos.x, p.pos.y, '#ff4a6c');
    }
  }

  const speed = 0.35;
  const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
  p.drawPos.x = lerp(p.drawPos.x, p.pos.x, speed);
  p.drawPos.y = lerp(p.drawPos.y, p.pos.y, speed);

  for (const m of gs.monsters) {
    m.drawPos.x = lerp(m.drawPos.x, m.pos.x, speed);
    m.drawPos.y = lerp(m.drawPos.y, m.pos.y, speed);
    if (!m.dead) {
      if (m.angryTimer > 0) m.angryTimer = Math.max(0, m.angryTimer - dt);
      m.timer += dt;
      const monsterBaseSpeed = m.speed * 1.15; 
      const effectiveSpeed = (gs.player.held ? monsterBaseSpeed * 0.45 : monsterBaseSpeed);
      if (m.timer >= effectiveSpeed) {
        m.timer = 0;
        stepMonsterAI(gs, m);
      }
    }
  }

  gs.tick += dt;
  if (gs.tick % 1000 < dt + 16) p.stamina = Math.min(p.maxStamina, p.stamina + 3);
  gs.floatMsgs = gs.floatMsgs.filter(m => gs.tick - m.tick < 1000);
}

function stepMonsterAI(gs: GameState, m: Monster) {
  if (m.angryTimer > 0) return;
  const p = gs.player;
  const dToPlayer = dist(m.pos, p.pos);
  const dToHome = dist(p.pos, m.home);

  if (dToHome <= 4) {
    m.state = 'chase';
  } else if (m.state === 'chase') {
    m.state = 'angry';
    m.angryTimer = 1500;
    return;
  } else if (m.angryTimer === 0) {
    m.state = 'patrol';
  }

  if (dToPlayer === 1 && p.invincible <= 0 && !p.isImmune) {
    const dmg = Math.max(1, m.attack - p.defense);
    p.hp -= dmg;
    p.invincible = 500;
    sounds.playHurt();
    floatMsg(gs, `-${dmg} HP`, p.pos.x, p.pos.y, '#ff4a6c');
    if (p.hp <= 0) gs.gameOver = true;
    return;
  }

  let target: Vec2 | null = null;
  if (m.state === 'chase') {
    const options = [
      { x: m.pos.x + 1, y: m.pos.y }, { x: m.pos.x - 1, y: m.pos.y },
      { x: m.pos.x, y: m.pos.y + 1 }, { x: m.pos.x, y: m.pos.y - 1 }
    ].filter(o => isWalkable(gs, o.x, o.y) && (o.x !== p.pos.x || o.y !== p.pos.y));
    options.sort((a, b) => dist(a, p.pos) - dist(b, p.pos));
    if (options.length > 0) target = options[0];
  } else {
    m.patrolIdx = (m.patrolIdx + 1) % m.patrol.length;
    target = m.patrol[m.patrolIdx];
  }
  if (target && isWalkable(gs, target.x, target.y)) m.pos = { ...target };
}
