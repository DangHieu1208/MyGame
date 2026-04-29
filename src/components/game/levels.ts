import type { GameState, Tile, Monster, MaterialItem, Receptor, MatColor, Vec2 } from './types';

const W = 'wall' as const;
const F = 'floor' as const;

function wall(): Tile { return { type: W }; }
function floor(): Tile { return { type: F }; }

function makeGrid(w: number, h: number): Tile[][] {
  return Array.from({ length: h }, () => Array.from({ length: w }, wall));
}

function carveH(grid: Tile[][], y: number, x1: number, x2: number) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
    if (grid[y]?.[x]) grid[y][x] = floor();
}

function carveV(grid: Tile[][], x: number, y1: number, y2: number) {
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
    if (grid[y]?.[x]) grid[y][x] = floor();
}

interface RoomDef {
  rx: number; ry: number;
  entrance: 'top' | 'bottom' | 'left' | 'right';
  color: MatColor;
}

function placeRoom(grid: Tile[][], r: RoomDef): Vec2 {
  const { rx, ry } = r;
  for (let dy = 0; dy < 5; dy++)
    for (let dx = 0; dx < 5; dx++)
      if (grid[ry+dy]?.[rx+dx]) grid[ry+dy][rx+dx] = wall();
  for (let dy = 1; dy <= 3; dy++)
    for (let dx = 1; dx <= 3; dx++)
      if (grid[ry+dy]?.[rx+dx]) grid[ry+dy][rx+dx] = floor();

  let ePos: Vec2 = { x: 0, y: 0 };
  const mid = 2;
  if (r.entrance === 'bottom') { grid[ry+4][rx+mid] = floor(); ePos = { x: rx+mid, y: ry+5 }; }
  else if (r.entrance === 'top') { grid[ry][rx+mid] = floor(); ePos = { x: rx+mid, y: ry-1 }; }
  else if (r.entrance === 'left') { grid[ry+mid][rx] = floor(); ePos = { x: rx-1, y: ry+mid }; }
  else { grid[ry+mid][rx+4] = floor(); ePos = { x: rx+5, y: ry+mid }; }
  return ePos;
}

function makeCircularPatrol(center: Vec2, radius: number): Vec2[] {
  const path: Vec2[] = [];
  for (let x = center.x - radius; x <= center.x + radius; x++) path.push({ x, y: center.y - radius });
  for (let y = center.y - radius + 1; y <= center.y + radius; y++) path.push({ x: center.x + radius, y });
  for (let x = center.x + radius - 1; x >= center.x - radius; x--) path.push({ x, y: center.y + radius });
  for (let y = center.y + radius - 1; y > center.y - radius; y--) path.push({ x: center.x - radius, y });
  return path;
}

let nextId = 1;
function uid() { return nextId++; }

export function buildLevel(level: number, prevScore = 0): GameState {
  nextId = 1;
  const width = 30 + level * 5;
  const height = 20 + level * 2;
  const grid = makeGrid(width, height);

  const hubX = Math.floor(width / 2);
  const hubY = Math.floor(height / 2);
  carveH(grid, hubY, hubX - 5, hubX + 5);
  carveV(grid, hubX, hubY - 5, hubY + 5);

  const colors: MatColor[] = (['red', 'blue', 'green', 'yellow'] as MatColor[]).slice(0, Math.min(4, level + 1));
  const materials: MaterialItem[] = [];
  const monsters: Monster[] = [];
  const receptors: Receptor[] = [];

  const roomPositions = [
    { x: 5, y: 3, ent: 'bottom' as const },
    { x: width - 10, y: 3, ent: 'bottom' as const },
    { x: 5, y: height - 8, ent: 'top' as const },
    { x: width - 10, y: height - 8, ent: 'top' as const },
  ];

  colors.forEach((color, i) => {
    const pos = roomPositions[i];
    const r: RoomDef = { rx: pos.x, ry: pos.y, entrance: pos.ent, color };
    const ef = placeRoom(grid, r);
    
    carveV(grid, ef.x, ef.y, hubY);
    carveH(grid, hubY, ef.x, hubX);

    materials.push({ id: uid(), pos: { x: r.rx + 2, y: r.ry + 2 }, color, pickedUp: false });

    // Monster Patterns
    const mHp = 3 + level * 2;
    const mAtk = 2 + level;
    const mSpd = Math.max(250, 600 - level * 100);

    const patrol = makeCircularPatrol(ef, 2);
    patrol.forEach(p => { if (grid[p.y]?.[p.x]) grid[p.y][p.x] = floor(); });
    
    monsters.push({
      id: uid(), pos: { ...patrol[0] }, drawPos: { ...patrol[0] }, home: { ...ef },
      hp: mHp, maxHp: mHp, attack: mAtk, defense: level, speed: mSpd, timer: 0,
      patrol, patrolIdx: 0, dead: false, state: 'patrol', angryTimer: 0
    });

    const rx = hubX - 2 + i;
    const ry = hubY;
    receptors.push({ id: uid(), pos: { x: rx, y: ry }, color, filled: false });
    grid[ry][rx] = floor();
  });

  const portalPos = { x: hubX, y: hubY - 4 };
  grid[portalPos.y][portalPos.x] = floor();

  return {
    grid, width, height,
    player: {
      pos: { x: hubX, y: hubY }, drawPos: { x: hubX, y: hubY },
      hp: 20, maxHp: 20, stamina: 30, maxStamina: 30,
      attack: 5, defense: 1, speed: 3, level, score: prevScore,
      held: null, moveCooldown: 0, invincible: 0, facing: 'right',
    },
    monsters, materials, receptors,
    portal: { pos: portalPos, open: false },
    level, tick: 0,
    gameOver: false, levelClear: false, upgrading: false,
    floatMsgs: [],
  };
}
