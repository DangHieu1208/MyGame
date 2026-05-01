import type { GameState, Tile, Monster, MaterialItem, Receptor, MatColor, Vec2 } from './types';

const W = 'wall' as const;
const F = 'floor' as const;

function wall(): Tile { return { type: W }; }
function floor(): Tile { return { type: F }; }
function gemFloor(color: MatColor): Tile { return { type: 'gem_floor', color }; }
function monsterFloor(): Tile { return { type: 'monster_floor' }; }
function bridgeFloor(): Tile { return { type: 'bridge_floor' }; }

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

function carveBridge(grid: Tile[][], y: number, x1: number, x2: number) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
    if (grid[y]?.[x]) grid[y][x] = bridgeFloor();
}

interface RoomDef {
  rx: number; ry: number;
  entrance: 'top' | 'bottom' | 'left' | 'right';
  color?: MatColor;
}

function placeRoom(grid: Tile[][], r: RoomDef, size = 3): Vec2 {
  const { rx, ry } = r;
  const ext = size + 2;
  for (let dy = 0; dy < ext; dy++)
    for (let dx = 0; dx < ext; dx++)
      if (grid[ry + dy]?.[rx + dx]) grid[ry + dy][rx + dx] = wall();
  for (let dy = 1; dy <= size; dy++)
    for (let dx = 1; dx <= size; dx++)
      if (grid[ry + dy]?.[rx + dx]) {
        grid[ry + dy][rx + dx] = r.color ? gemFloor(r.color) : monsterFloor();
      }

  let ePos: Vec2 = { x: 0, y: 0 };
  const mid = Math.floor(ext / 2);
  if (r.entrance === 'bottom') { grid[ry + ext - 1][rx + mid] = floor(); ePos = { x: rx + mid, y: ry + ext }; }
  else if (r.entrance === 'top') { grid[ry][rx + mid] = floor(); ePos = { x: rx + mid, y: ry - 1 }; }
  else if (r.entrance === 'left') { grid[ry + mid][rx] = floor(); ePos = { x: rx - 1, y: ry + mid }; }
  else { grid[ry + mid][rx + ext - 1] = floor(); ePos = { x: rx + ext, y: ry + mid }; }
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
  const width = 50 + level * 5;
  const height = 35 + level * 2;
  const grid = makeGrid(width, height);

  const hubX = Math.floor(width / 2);
  const hubY = Math.floor(height / 2);
  carveH(grid, hubY, hubX - 5, hubX + 5);
  carveV(grid, hubX, hubY - 5, hubY + 5);

  const colors: MatColor[] = ['red', 'blue', 'green', 'yellow'];
  const materials: MaterialItem[] = [];
  const monsters: Monster[] = [];
  const receptors: Receptor[] = [];

  const complexPositions = [
    { x: 2, y: 2, dir: 'right' as const },
    { x: width - 18, y: 2, dir: 'left' as const },
    { x: 2, y: height - 10, dir: 'right' as const },
    { x: width - 18, y: height - 10, dir: 'left' as const },
  ];

  colors.forEach((color, i) => {
    const pos = complexPositions[i];
    const M_SIZE = 5; // Monster room interior (7x7 exterior)
    const G_SIZE = 3; // Gem room interior (5x5 exterior)

    // Offset calculation for exactly 3-block total bridge (including doors):
    // If Monster is first (7 wide): Wall at +6, Gap at +7, Gem Wall at +8. OFFSET = 8.
    // If Gem is first (5 wide): Wall at +4, Gap at +5, Monster Wall at +6. OFFSET = 6.
    const OFFSET = pos.dir === 'right' ? 8 : 6;

    // 1. Monster Room
    const mRoom: RoomDef = { rx: pos.x + (pos.dir === 'left' ? OFFSET : 0), ry: pos.y, entrance: pos.y < height / 2 ? 'bottom' : 'top' };
    const ef = placeRoom(grid, mRoom, M_SIZE);

    // Add two 2x1 walls in monster room (tactical obstacles)
    const mx = mRoom.rx;
    const my = mRoom.ry;
    // Wall 1: (2,2) and (3,2) relative to interior
    grid[my + 2][mx + 2] = wall();
    grid[my + 2][mx + 3] = wall();
    grid[my + 2][mx + 4] = wall();
    // Wall 2: (2,4) and (3,4) relative to interior
    grid[my + 4][mx + 2] = wall();
    grid[my + 4][mx + 3] = wall();
    grid[my + 4][mx + 4] = wall();

    carveV(grid, ef.x, ef.y, hubY);
    carveH(grid, hubY, ef.x, hubX);

    // 2. Gem Room
    const gRoom: RoomDef = { rx: pos.x + (pos.dir === 'left' ? 0 : OFFSET), ry: pos.y + 1, entrance: pos.dir === 'left' ? 'right' : 'left', color };
    placeRoom(grid, gRoom, G_SIZE);

    // 3. Bridge (Exactly 3 wooden blocks)
    const bridgeY = pos.y + 3;
    if (pos.dir === 'right') {
      // Monster at pos.x (wall +6), Gem at pos.x+8 (wall +8). Carve 6, 7, 8.
      carveBridge(grid, bridgeY, pos.x + 6, pos.x + 8);
    } else {
      // Gem at pos.x (wall +4), Monster at pos.x+6 (wall +6). Carve 4, 5, 6.
      carveBridge(grid, bridgeY, pos.x + 4, pos.x + 6);
    }

    materials.push({ id: uid(), pos: { x: gRoom.rx + 2, y: gRoom.ry + 2 }, color, pickedUp: false });

    const mHp = 5 + level * 3;
    const mAtk = 4 + level * 2;
    const mSpd = Math.max(200, 500 - level * 50);
    const mCenter = { x: mRoom.rx + 3, y: mRoom.ry + 3 };
    const patrol = makeCircularPatrol(mCenter, 2); // Patrol the edge of the 5x5 interior

    monsters.push({
      id: uid(), pos: mCenter, drawPos: { ...mCenter }, home: mCenter,
      hp: mHp, maxHp: mHp, attack: mAtk, defense: level, speed: mSpd, timer: 0,
      patrol, patrolIdx: 0, dead: false, state: 'patrol', angryTimer: 0,
      color
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
      isImmune: false, immunityTimer: 0, skin: 'original'
    },
    monsters, materials, receptors,
    portal: { pos: portalPos, open: false },
    obstacles: [],
    maxObstacles: 3,
    obstaclesLeft: 3,
    killsThisLevel: 0,
    level, tick: 0,
    gameOver: false, levelClear: false, upgrading: false,
    showingSettings: false, volume: 0.5,
    floatMsgs: [],
  };
}
