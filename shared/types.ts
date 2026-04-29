export type PlayerRole = 'master' | 'player';

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
  settings: RoomSettings;
}

export interface RoomSettings {
  allowPlayersMoveOwnTokens: boolean;
  defaultTurnSeconds: number;
  timerEnabled: boolean;
}

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  role: PlayerRole;
  isMaster: boolean;
  connected: boolean;
  characterId?: string;
  lastSeen: number;
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
  notionUrl?: string;
  updatedAt: number;
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
  roomId: string;
  ownerId?: string;
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
  locked: boolean;
  updatedAt: number;
}

export interface MusicTrack {
  id: string;
  name: string;
  url: string;
  volume: number;
  isPlaying: boolean;
  groupId?: string; // NOVO: Relacionamento com grupo
}

export interface MusicGroup {
  id: string;
  name: string;
}

export interface MusicState {
  currentTrack: MusicTrack | null;
  playlist: MusicTrack[];
  groups: MusicGroup[]; // NOVO: Lista de grupos (Locais/Etapas)
  volume: number;
  isPlaying: boolean;
  isLooping: boolean;
  updatedAt: number;
}

export interface TurnTimer {
  currentPlayerIndex: number;
  timeRemaining: number;
  isRunning: boolean;
  playerOrder: string[];
  isManualOrder: boolean; // NOVO: Se o mestre definiu a ordem manualmente
  defaultSeconds: number;
  updatedAt: number;
}

export interface DiceRoll {
  id: string;
  playerId: string;
  playerName: string;
  sides: number;
  modifier: number;
  result: number;
  total: number;
  isPrivate: boolean;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface GameState {
  room: Room;
  characters: Character[];
  tokens: Token[];
  timer: TurnTimer;
  music: MusicState;
  diceRolls: DiceRoll[];
  chatMessages: ChatMessage[];
}

export interface ClientIdentity {
  sessionId: string;
  playerId: string;
}

export interface SocketAck<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export type SocketEvents = {
  'room:create': (
    data: { name: string; playerName: string; sessionId?: string },
    callback: (response: SocketAck<{ state: GameState; identity: ClientIdentity }>) => void
  ) => void;
  'room:join': (
    data: { code: string; playerName: string; sessionId?: string },
    callback: (response: SocketAck<{ state: GameState; identity: ClientIdentity }>) => void
  ) => void;
  'room:resume': (
    data: { code: string; sessionId: string; playerId: string },
    callback: (response: SocketAck<{ state: GameState; identity: ClientIdentity }>) => void
  ) => void;
  'room:leave': () => void;
  'room:update': (room: Partial<Room>) => void;
  'game:state': (state: GameState) => void;

  'token:move': (token: Token) => void;
  'token:add': (token: Partial<Token>) => void;
  'token:remove': (tokenId: string) => void;
  'token:update': (token: Token) => void;

  'character:update': (character: Character) => void;
  'dice:roll': (roll: { sides: number; modifier?: number; isPrivate?: boolean }) => void;
  'dice:rolled': (roll: DiceRoll) => void;

  'music:add': (track: Pick<MusicTrack, 'name' | 'url' | 'groupId'>) => void;
  'music:play': (trackId: string) => void;
  'music:pause': () => void;
  'music:volume': (volume: number) => void;
  'music:loop': (isLooping: boolean) => void;
  'music:update': (music: MusicState) => void;
  'music:remove': (trackId: string) => void; // NOVO
  'music:rename': (data: { trackId: string; name: string }) => void; // NOVO
  'music:group:add': (name: string) => void; // NOVO
  'music:group:remove': (groupId: string) => void; // NOVO
  'music:group:rename': (data: { groupId: string; name: string }) => void; // NOVO

  'timer:start': () => void;
  'timer:pause': () => void;
  'timer:reset': () => void;
  'timer:next': () => void;
  'timer:extend': (seconds: number) => void;
  'timer:setOrder': (playerOrder: string[]) => void; // NOVO
  'timer:update': (timer: TurnTimer) => void;

  'player:joined': (player: Player) => void;
  'player:left': (playerId: string) => void;

  'chat:message': (data: { message: string }) => void;
  'chat:new': (message: ChatMessage) => void;
  'error:message': (message: string) => void;
};

