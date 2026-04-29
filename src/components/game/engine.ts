import type { GameState, Dir, Monster, Vec2 } from './types';

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
  return gs.grid[y][x].type === 'floor';
}

function floatMsg(gs: GameState, text: string, x: number, y: number, color: string) {
  gs.floatMsgs.push({ text, x, y, color, tick: gs.tick });
}

export function movePlayer(gs: GameState, dir: Dir): boolean {
  if (gs.gameOver || gs.levelClear || gs.upgrading) return false;
  if (gs.player.moveCooldown > 0) return false;

  const p = gs.player;
  p.facing = dir;
  const target = adj(p.pos.x, p.pos.y, dir);
  const tx = target.x, ty = target.y;

  const monster = gs.monsters.find(m => !m.dead && m.pos.x === tx && m.pos.y === ty);
  if (monster) {
    if (p.stamina <= 0) {
      floatMsg(gs, 'No Stamina!', p.pos.x, p.pos.y, '#f0b429');
      p.moveCooldown = 150;
      return false;
    }
    p.stamina = Math.max(0, p.stamina - 10);
    const dmg = Math.max(1, p.attack - monster.defense);
    monster.hp -= dmg;
    floatMsg(gs, `-${dmg}`, tx, ty, '#ff4a6c');
    if (monster.hp <= 0) {
      monster.dead = true;
      p.score += 50;
    }
    p.moveCooldown = 150; 
    return true;
  }

  if (!isWalkable(gs, tx, ty)) return false;

  p.pos = { x: tx, y: ty };
  // Smoother movement: even faster response time
  p.moveCooldown = Math.max(60, 140 - (p.speed * 8));

  const mat = gs.materials.find(m => !m.pickedUp && m.pos.x === tx && m.pos.y === ty);
  if (mat) {
    if (p.held === null) {
      mat.pickedUp = true;
      p.held = mat.color;
      p.score += 10;
      floatMsg(gs, `Picked ${mat.color}!`, tx, ty, '#4affa0');
    }
  }

  const rec = gs.receptors.find(r => !r.filled && r.pos.x === tx && r.pos.y === ty);
  if (rec) {
    if (p.held === rec.color) {
      rec.filled = true;
      p.held = null;
      p.score += 100;
      if (gs.receptors.every(r => r.filled)) gs.portal.open = true;
    }
  }

  if (gs.portal.open && tx === gs.portal.pos.x && ty === gs.portal.pos.y) gs.levelClear = true;

  return true;
}

export function tickTimers(gs: GameState, dt: number) {
  if (gs.gameOver || gs.upgrading) return;
  const p = gs.player;
  
  if (p.moveCooldown > 0) p.moveCooldown = Math.max(0, p.moveCooldown - dt);
  if (p.invincible > 0)   p.invincible   = Math.max(0, p.invincible   - dt);

  const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
  const speed = 0.35; // Snappier interpolation
  
  p.drawPos.x = lerp(p.drawPos.x, p.pos.x, speed);
  p.drawPos.y = lerp(p.drawPos.y, p.pos.y, speed);

  for (const m of gs.monsters) {
    m.drawPos.x = lerp(m.drawPos.x, m.pos.x, speed);
    m.drawPos.y = lerp(m.drawPos.y, m.pos.y, speed);
    
    if (!m.dead) {
      if (m.angryTimer > 0) m.angryTimer = Math.max(0, m.angryTimer - dt);

      m.timer += dt;
      // Rage speed: 2.5x faster if player has a gem
      const effectiveSpeed = (gs.player.held ? m.speed * 0.4 : m.speed);
      
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
  if (m.angryTimer > 0) return; // Don't move while angry/frustrated

  const p = gs.player;
  const dToPlayer = dist(m.pos, p.pos);
  const dToHome = dist(p.pos, m.home);

  // Transition to Chase: Player is within 4 tiles of the monster's home
  if (dToHome <= 4) {
    m.state = 'chase';
  } else if (m.state === 'chase') {
    // Transition to Angry: Player just left the 4-tile zone
    m.state = 'angry';
    m.angryTimer = 1500; // Pause for 1.5s
    return;
  } else if (m.angryTimer === 0) {
    m.state = 'patrol';
  }

  // Combat check
  if (dToPlayer === 1 && p.invincible <= 0) {
    const dmg = Math.max(1, m.attack - p.defense);
    p.hp -= dmg;
    p.invincible = 500;
    floatMsg(gs, `-${dmg} HP`, p.pos.x, p.pos.y, '#ff4a6c');
    if (p.hp <= 0) gs.gameOver = true;
    return;
  }

  // Movement logic based on state
  let target: Vec2 | null = null;

  if (m.state === 'chase') {
    // Greedy move towards player
    const options = [
      { x: m.pos.x + 1, y: m.pos.y }, { x: m.pos.x - 1, y: m.pos.y },
      { x: m.pos.x, y: m.pos.y + 1 }, { x: m.pos.x, y: m.pos.y - 1 }
    ].filter(o => isWalkable(gs, o.x, o.y) && (o.x !== p.pos.x || o.y !== p.pos.y));
    
    options.sort((a, b) => dist(a, p.pos) - dist(b, p.pos));
    if (options.length > 0) target = options[0];
  } else {
    // Patrol
    m.patrolIdx = (m.patrolIdx + 1) % m.patrol.length;
    target = m.patrol[m.patrolIdx];
  }

  if (target && isWalkable(gs, target.x, target.y)) {
    m.pos = { ...target };
  }
}
