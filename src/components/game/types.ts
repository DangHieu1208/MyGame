export type TileType = 'wall' | 'floor';
export type MatColor = 'red' | 'blue' | 'green' | 'yellow';
export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Vec2 { x: number; y: number; }
export interface Tile { type: TileType; }

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
}

export type MonsterState = 'patrol' | 'chase' | 'angry' | 'rage';

export interface Monster {
  id: number;
  pos: Vec2;
  drawPos: Vec2;
  home: Vec2; // Center of their 4x4 zone
  hp: number; maxHp: number;
  attack: number;
  defense: number;
  speed: number; 
  timer: number; 
  patrol: Vec2[];
  patrolIdx: number;
  dead: boolean;
  state: MonsterState;
  angryTimer: number; // ms remaining for angry emotion
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
  level: number;
  tick: number;
  gameOver: boolean;
  levelClear: boolean;
  upgrading: boolean;
  floatMsgs: FloatMsg[];
}
