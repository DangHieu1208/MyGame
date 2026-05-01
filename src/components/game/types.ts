export type TileType = 'wall' | 'floor' | 'gem_floor' | 'monster_floor' | 'bridge_floor';
export type MatColor = 'red' | 'blue' | 'green' | 'yellow';
export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Vec2 { x: number; y: number; }
export interface Tile { type: TileType; color?: MatColor; }

export interface Player {
  pos: Vec2;
  drawPos: Vec2;
  hp: number; maxHp: number;
  stamina: number; maxStamina: number;
  attack: number;
  defense: number;
  speed: number;       
  level: number;
  score: number;
  held: MatColor | null;
  moveCooldown: number;
  invincible: number;
  facing: Dir;
  isImmune: boolean;
  immunityTimer: number;
  skin: string;
}

export interface Obstacle {
  pos: Vec2;
  breakProgress: number; // 0 to 10
}

export type MonsterState = 'patrol' | 'chase' | 'angry' | 'rage' | 'returning';

export interface Monster {
  id: number;
  pos: Vec2;
  drawPos: Vec2;
  home: Vec2;
  hp: number; maxHp: number;
  attack: number;
  defense: number;
  speed: number; 
  timer: number; 
  patrol: Vec2[];
  patrolIdx: number;
  dead: boolean;
  state: MonsterState;
  angryTimer: number;
  color?: MatColor;
}

export interface MaterialItem {
  id: number;
  pos: Vec2;
  color: MatColor;
  pickedUp: boolean;
}

export interface Receptor {
  id: number;
  pos: Vec2;
  color: MatColor;
  filled: boolean;
}

export interface Portal { pos: Vec2; open: boolean; }

export interface FloatMsg {
  text: string; x: number; y: number;
  tick: number; color: string;
}

export interface GameState {
  grid: Tile[][];
  width: number; height: number;
  player: Player;
  monsters: Monster[];
  materials: MaterialItem[];
  receptors: Receptor[];
  portal: Portal;
  obstacles: Obstacle[];
  maxObstacles: number;
  killsThisLevel: number;
  level: number;
  tick: number;
  gameOver: boolean;
  levelClear: boolean;
  upgrading: boolean;
  showingSettings: boolean;
  volume: number;
  floatMsgs: FloatMsg[];
}
