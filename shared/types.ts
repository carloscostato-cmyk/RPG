export interface Room {
  id: string;
  code: string;
  name: string;
  masterId: string;
  players: Player[];
  createdAt: number;
  mapUrl?: string;
  gridSize: number;
}

export interface Player {
  id: string;
  name: string;
  isMaster: boolean;
  connected: boolean;
  characterId?: string;
  role: 'player' | 'spectator';
}

export interface Character {
  id: string;
  roomId: string;
  ownerId: string;
  name: string;
  class?: string;
  level: number;
  currentHp: number;
  maxHp: number;
  avatarUrl?: string;
  attributes: Attributes;
  inventory: Item[];
  spells: Spell[];
  notes: string;
}

export interface Attributes {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  description?: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  description?: string;
}

export interface Token {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string;
  name: string;
  isVisible: boolean;
  layer: 'map' | 'tokens' | 'effects' | 'fog';
  rotation: number;
  color?: string;
}

export interface MusicTrack {
  id: string;
  name: string;
  url: string;
  volume: number;
  isPlaying: boolean;
}

export interface TurnTimer {
  currentPlayerIndex: number;
  timeRemaining: number;
  isRunning: boolean;
  playerOrder: string[];
}

export interface DiceRoll {
  id: string;
  playerId: string;
  notation: string;
  results: number[];
  bonus: number;
  total: number;
  timestamp: number;
}

export type SocketEvents = {
  'room:create': (data: { name: string; playerName: string }, callback: (room: Room) => void) => void;
  'room:join': (data: { code: string; playerName: string }, callback: (room: Room | null) => void) => void;
  'room:leave': () => void;
  'room:update': (room: Room) => void;

  'token:move': (token: Token) => void;
  'token:add': (token: Token) => void;
  'token:remove': (tokenId: string) => void;
  'token:update': (token: Token) => void;

  'character:update': (character: Character) => void;
  'dice:roll': (roll: DiceRoll) => void;
  'dice:request': (notation: string) => void;

  'room:update-player-role': (data: { playerId: string; role: 'player' | 'spectator' }) => void;
  'room:set-map': (url: string) => void;

  'music:play': (track: MusicTrack) => void;
  'music:pause': () => void;
  'music:volume': (volume: number) => void;

  'timer:start': () => void;
  'timer:pause': () => void;
  'timer:reset': () => void;
  'timer:next': () => void;
  'timer:extend': (seconds: number) => void;
  'timer:update': (timer: TurnTimer) => void;

  'player:joined': (player: Player) => void;
  'player:left': (playerId: string) => void;

  'chat:message': (data: { playerId: string; message: string; timestamp: number }) => void;
};