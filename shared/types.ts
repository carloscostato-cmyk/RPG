export interface Room {
  id: string;
  code: string;
  name: string;
  masterId: string;
  players: Player[];
  createdAt: number;
  updatedAt: number;
  mapUrl?: string;
  gridSize: number;
  settings: {
    allowPlayersMoveOwnTokens: boolean;
    defaultTurnSeconds: number;
  };
}

export interface Player {
  id: string;
  sessionId?: string;
  name: string;
  role: 'player' | 'spectator' | 'master';
  isMaster: boolean;
  connected: boolean;
  lastSeen?: number;
  characterId?: string;
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
  notionUrl?: string;
  attributes: Attributes;
  inventory: Item[];
  spells: Spell[];
  notes: string;
  createdAt: number;
  updatedAt?: number;
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
  roomId?: string;
  ownerId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string;
  name: string;
  isVisible: boolean;
  layer: 'map' | 'tokens' | 'effects' | 'fog' | 'gm-hidden';
  rotation: number;
  color?: string;
  locked?: boolean;
  updatedAt?: number;
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
  isManualOrder?: boolean;
}

export interface DiceRoll {
  id: string;
  playerId: string;
  playerName?: string;
  sides?: number;
  modifier?: number;
  result?: number;
  total?: number;
  isPrivate?: boolean;
  timestamp: number;
  notation?: string;
  results?: number[];
  bonus?: number;
}

// Additional types for backend
export interface GameState {
  room: Room;
  characters: Character[];
  tokens: Token[];
  music: MusicState;
  timer: TurnTimer;
  diceRolls: DiceRoll[];
  chatMessages: ChatMessage[];
}

export interface MusicState {
  currentTrack: MusicTrack | null;
  playlist: MusicTrack[];
  groups: MusicGroup[];
  volume: number;
  isPlaying: boolean;
  isLooping: boolean;
  updatedAt: number;
}

export interface MusicGroup {
  id: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface ClientIdentity {
  sessionId: string;
  playerId: string;
}

export type SocketAck<T> = { ok: true; data: T } | { ok: false; error: string };

export type PlayerRole = 'player' | 'spectator' | 'master';

export type SocketEvents = {
  'room:create': (data: { name: string; playerName: string; sessionId?: string }, callback: (response: SocketAck<{ state: GameState; identity: ClientIdentity }>) => void) => void;
  'room:join': (data: { code: string; playerName: string; sessionId?: string }, callback: (response: SocketAck<{ state: GameState; identity: ClientIdentity }>) => void) => void;
  'room:resume': (data: { code: string; playerId: string; sessionId: string }, callback: (response: SocketAck<{ state: GameState; identity: ClientIdentity }>) => void) => void;
  'room:leave': () => void;
  'room:update': (room: Room) => void;

  'token:move': (token: Token) => void;
  'token:add': (token: Partial<Token>) => void;
  'token:remove': (tokenId: string) => void;
  'token:update': (token: Token) => void;

  'character:update': (character: Character) => void;
  'dice:roll': (data: { sides: number; modifier?: number; isPrivate?: boolean }) => void;
  'dice:rolled': (roll: DiceRoll) => void;
  'dice:request': (notation: string) => void;

  'room:update-player-role': (data: { playerId: string; role: 'player' | 'spectator' }) => void;
  'room:set-map': (url: string) => void;

  'music:add': (track: { name: string; url: string; groupId?: string }) => void;
  'music:remove': (trackId: string) => void;
  'music:rename': (data: { trackId: string; name: string }) => void;
  'music:group:add': (name: string) => void;
  'music:group:remove': (groupId: string) => void;
  'music:group:rename': (data: { groupId: string; name: string }) => void;
  'music:play': (trackId?: string) => void;
  'music:pause': () => void;
  'music:volume': (volume: number) => void;
  'music:loop': (isLooping: boolean) => void;
  'music:update': (music: MusicState) => void;

  'timer:start': () => void;
  'timer:pause': () => void;
  'timer:reset': () => void;
  'timer:next': () => void;
  'timer:extend': (seconds: number) => void;
  'timer:setOrder': (order: string[]) => void;
  'timer:update': (timer: TurnTimer) => void;

  'player:joined': (player: Player) => void;
  'player:left': (playerId: string) => void;

  'chat:message': (data: { message: string }) => void;
  'chat:new': (message: ChatMessage) => void;

  'game:state': (state: GameState) => void;
  'error:message': (message: string) => void;
};
