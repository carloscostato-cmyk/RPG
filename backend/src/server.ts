import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { Server, Socket } from 'socket.io';
import type {
  Character,
  ChatMessage,
  ClientIdentity,
  DiceRoll,
  GameState,
  MusicState,
  MusicTrack,
  Player,
  Room,
  SocketAck,
  SocketEvents,
  Token,
  TurnTimer,
} from '../../shared/types';

dotenv.config();

type ClientSocket = Socket<SocketEvents>;
type PersistedData = { rooms: GameState[] };

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const server = http.createServer(app);
const io = new Server<SocketEvents>(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || 'data');
const dataFile = path.join(dataDir, 'rooms.json');
const rooms = new Map<string, GameState>();
const socketRoom = new Map<string, string>();
const rateBuckets = new Map<string, number[]>();
const timerIntervals = new Map<string, NodeJS.Timeout>();

loadRooms();

app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size, uptime: process.uptime() });
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('room:create', (data, callback) => {
    try {
      if (!checkRate(socket, 'room:create', 5, 60000)) return callback(fail('Muitas tentativas. Aguarde um pouco.'));

      const playerName = cleanText(data.playerName, 30);
      const roomName = cleanText(data.name, 50);
      if (!playerName || !roomName) return callback(fail('Informe nome do jogador e da sala.'));

      const sessionId = data.sessionId || createId('session');
      const code = createUniqueRoomCode();
      const player: Player = {
        id: createId('player'),
        sessionId,
        name: playerName,
        role: 'master',
        isMaster: true,
        connected: true,
        lastSeen: Date.now(),
      };

      const room: Room = {
        id: createId('room'),
        code,
        name: roomName,
        masterId: player.id,
        players: [player],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        gridSize: 50,
        settings: {
          allowPlayersMoveOwnTokens: true,
          defaultTurnSeconds: 60,
        },
      };

      const state = createInitialState(room);
      rooms.set(room.id, state);
      joinSocketToRoom(socket, state.room.id, player.id);
      saveRooms();
      callback(ok({ state, identity: { sessionId, playerId: player.id } }));
    } catch (error) {
      callback(fail(toErrorMessage(error)));
    }
  });

  socket.on('room:join', (data, callback) => {
    try {
      if (!checkRate(socket, 'room:join', 10, 60000)) return callback(fail('Muitas tentativas. Aguarde um pouco.'));

      const playerName = cleanText(data.playerName, 30);
      const code = cleanText(data.code, 10).toUpperCase();
      if (!playerName || !code) return callback(fail('Informe nome do jogador e codigo da sala.'));

      const state = findRoomByCode(code);
      if (!state) return callback(fail('Sala nao encontrada.'));

      const sessionId = data.sessionId || createId('session');
      let player = state.room.players.find((item) => item.sessionId === sessionId);
      if (player) {
        player.name = playerName;
        player.connected = true;
        player.lastSeen = Date.now();
      } else {
        player = {
          id: createId('player'),
          sessionId,
          name: playerName,
          role: 'player',
          isMaster: false,
          connected: true,
          lastSeen: Date.now(),
        };
        state.room.players.push(player);
      }

      state.room.updatedAt = Date.now();
      syncTimerOrder(state);
      joinSocketToRoom(socket, state.room.id, player.id);
      saveAndBroadcast(state);
      callback(ok({ state, identity: { sessionId, playerId: player.id } }));
    } catch (error) {
      callback(fail(toErrorMessage(error)));
    }
  });

  socket.on('room:resume', (data, callback) => {
    try {
      const state = findRoomByCode(cleanText(data.code, 10).toUpperCase());
      const player = state?.room.players.find((item) => item.id === data.playerId && item.sessionId === data.sessionId);
      if (!state || !player) return callback(fail('Sessao expirada. Entre na sala novamente.'));

      player.connected = true;
      player.lastSeen = Date.now();
      joinSocketToRoom(socket, state.room.id, player.id);
      saveAndBroadcast(state);
      callback(ok({ state, identity: { sessionId: player.sessionId, playerId: player.id } }));
    } catch (error) {
      callback(fail(toErrorMessage(error)));
    }
  });

  socket.on('room:leave', () => {
    markDisconnected(socket);
  });

  socket.on('token:add', (partial) => {
    withRoom(socket, (state, player) => {
      if (!player.isMaster) return deny(socket, 'Apenas o mestre pode criar tokens.');

      const token: Token = {
        id: createId('token'),
        roomId: state.room.id,
        ownerId: partial.ownerId,
        name: cleanText(partial.name || 'Novo token', 40) || 'Novo token',
        x: snapNumber(partial.x ?? 100, state.room.gridSize),
        y: snapNumber(partial.y ?? 100, state.room.gridSize),
        width: clampNumber(partial.width ?? state.room.gridSize, 20, 400),
        height: clampNumber(partial.height ?? state.room.gridSize, 20, 400),
        imageUrl: cleanUrl(partial.imageUrl),
        color: partial.color || '#ef4444',
        isVisible: partial.isVisible ?? true,
        layer: partial.layer || 'tokens',
        rotation: 0,
        locked: Boolean(partial.locked),
        updatedAt: Date.now(),
      };

      state.tokens.push(token);
      saveAndBroadcast(state);
    });
  });

  socket.on('token:move', (token) => {
    withRoom(socket, (state, player) => {
      const existing = state.tokens.find((item) => item.id === token.id);
      if (!existing) return;
      if (!canControlToken(player, existing, state)) return deny(socket, 'Voce nao pode mover este token.');

      existing.x = snapNumber(token.x, state.room.gridSize);
      existing.y = snapNumber(token.y, state.room.gridSize);
      existing.updatedAt = Date.now();
      saveAndBroadcast(state);
    });
  });

  socket.on('token:update', (token) => {
    withRoom(socket, (state, player) => {
      const existing = state.tokens.find((item) => item.id === token.id);
      if (!existing) return;
      if (!canControlToken(player, existing, state)) return deny(socket, 'Voce nao pode editar este token.');

      existing.name = cleanText(token.name, 40) || existing.name;
      existing.x = snapNumber(token.x, state.room.gridSize);
      existing.y = snapNumber(token.y, state.room.gridSize);
      existing.width = clampNumber(token.width, 20, 400);
      existing.height = clampNumber(token.height, 20, 400);
      existing.imageUrl = cleanUrl(token.imageUrl);
      existing.color = token.color || existing.color;
      existing.isVisible = Boolean(token.isVisible);
      existing.locked = player.isMaster ? Boolean(token.locked) : existing.locked;
      existing.updatedAt = Date.now();
      saveAndBroadcast(state);
    });
  });

  socket.on('token:remove', (tokenId) => {
    withRoom(socket, (state, player) => {
      if (!player.isMaster) return deny(socket, 'Apenas o mestre pode remover tokens.');
      state.tokens = state.tokens.filter((item) => item.id !== tokenId);
      saveAndBroadcast(state);
    });
  });

  socket.on('character:update', (character) => {
    withRoom(socket, (state, player) => {
      const ownerId = character.ownerId || player.id;
      if (!player.isMaster && ownerId !== player.id) return deny(socket, 'Voce so pode editar sua propria ficha.');

      const existing = state.characters.find((item) => item.id === character.id || item.ownerId === ownerId);
      const next = sanitizeCharacter(character, state.room.id, ownerId, existing?.id);

      if (existing) Object.assign(existing, next);
      else state.characters.push(next);

      const owner = state.room.players.find((item) => item.id === ownerId);
      if (owner) owner.characterId = next.id;

      state.room.updatedAt = Date.now();
      saveAndBroadcast(state);
    });
  });

  socket.on('dice:roll', (data) => {
    withRoom(socket, (state, player) => {
      if (!checkRate(socket, 'dice:roll', 30, 60000)) return deny(socket, 'Muitas rolagens em pouco tempo.');
      const sides = [4, 6, 8, 10, 12, 20, 100].includes(data.sides) ? data.sides : 20;
      const modifier = clampNumber(data.modifier || 0, -99, 99);
      const result = Math.floor(Math.random() * sides) + 1;
      const roll: DiceRoll = {
        id: createId('roll'),
        playerId: player.id,
        playerName: player.name,
        sides,
        modifier,
        result,
        total: result + modifier,
        isPrivate: Boolean(data.isPrivate),
        timestamp: Date.now(),
      };

      state.diceRolls = [...state.diceRolls.slice(-49), roll];
      saveAndBroadcast(state);
      io.to(state.room.id).emit('dice:rolled', roll);
    });
  });

  socket.on('chat:message', (data) => {
    withRoom(socket, (state, player) => {
      if (!checkRate(socket, 'chat:message', 20, 60000)) return deny(socket, 'Muitas mensagens em pouco tempo.');
      const messageText = cleanText(data.message, 300);
      if (!messageText) return;

      const message: ChatMessage = {
        id: createId('chat'),
        playerId: player.id,
        playerName: player.name,
        message: messageText,
        timestamp: Date.now(),
      };

      state.chatMessages = [...state.chatMessages.slice(-99), message];
      saveAndBroadcast(state);
      io.to(state.room.id).emit('chat:new', message);
    });
  });

  socket.on('music:add', (track) => {
    withMaster(socket, (state) => {
      const url = cleanUrl(track.url);
      const name = cleanText(track.name, 60);
      if (!url || !name) return deny(socket, 'Informe nome e URL MP3 valida.');

      state.music.playlist.push({
        id: createId('music'),
        name,
        url,
        volume: state.music.volume,
        isPlaying: false,
        groupId: track.groupId,
      });
      updateMusic(state, { updatedAt: Date.now() });
    });
  });

  socket.on('music:remove', (trackId) => {
    withMaster(socket, (state) => {
      state.music.playlist = state.music.playlist.filter((t) => t.id !== trackId);
      if (state.music.currentTrack?.id === trackId) {
        state.music.currentTrack = null;
        state.music.isPlaying = false;
      }
      updateMusic(state, { updatedAt: Date.now() });
    });
  });

  socket.on('music:rename', (data) => {
    withMaster(socket, (state) => {
      const track = state.music.playlist.find((t) => t.id === data.trackId);
      if (track) {
        track.name = cleanText(data.name, 60);
        if (state.music.currentTrack?.id === data.trackId) {
          state.music.currentTrack.name = track.name;
        }
        updateMusic(state, { updatedAt: Date.now() });
      }
    });
  });

  socket.on('music:group:add', (name) => {
    withMaster(socket, (state) => {
      state.music.groups.push({
        id: createId('group'),
        name: cleanText(name, 50) || 'Novo Grupo',
      });
      updateMusic(state, { updatedAt: Date.now() });
    });
  });

  socket.on('music:group:remove', (groupId) => {
    withMaster(socket, (state) => {
      state.music.groups = state.music.groups.filter((g) => g.id !== groupId);
      // Opcional: Desvincular faixas do grupo removido
      state.music.playlist.forEach((t) => {
        if (t.groupId === groupId) t.groupId = undefined;
      });
      updateMusic(state, { updatedAt: Date.now() });
    });
  });

  socket.on('music:group:rename', (data) => {
    withMaster(socket, (state) => {
      const group = state.music.groups.find((g) => g.id === data.groupId);
      if (group) {
        group.name = cleanText(data.name, 50);
        updateMusic(state, { updatedAt: Date.now() });
      }
    });
  });

  socket.on('music:play', (trackId) => {
    withMaster(socket, (state) => {
      const track = state.music.playlist.find((item) => item.id === trackId) || state.music.currentTrack;
      if (!track) return;
      updateMusic(state, {
        currentTrack: { ...track, isPlaying: true, volume: state.music.volume },
        isPlaying: true,
        updatedAt: Date.now(),
      });
    });
  });

  socket.on('music:pause', () => {
    withMaster(socket, (state) => updateMusic(state, { isPlaying: false, updatedAt: Date.now() }));
  });

  socket.on('music:volume', (volume) => {
    withMaster(socket, (state) => updateMusic(state, { volume: clampNumber(volume, 0, 100), updatedAt: Date.now() }));
  });

  socket.on('music:loop', (isLooping) => {
    withMaster(socket, (state) => updateMusic(state, { isLooping: Boolean(isLooping), updatedAt: Date.now() }));
  });

  socket.on('timer:start', () => withMaster(socket, (state) => startTimer(state)));
  socket.on('timer:pause', () => withMaster(socket, (state) => pauseTimer(state)));
  socket.on('timer:reset', () => withMaster(socket, (state) => resetTimer(state)));
  socket.on('timer:next', () => withMaster(socket, (state) => nextTurn(state)));
  socket.on('timer:extend', (seconds) => {
    withMaster(socket, (state) => {
      state.timer.timeRemaining = clampNumber(state.timer.timeRemaining + clampNumber(seconds, 1, 600), 1, 3600);
      state.timer.updatedAt = Date.now();
      saveAndBroadcast(state);
    });
  });

  socket.on('timer:setOrder', (order) => {
    withMaster(socket, (state) => {
      state.timer.playerOrder = order;
      state.timer.isManualOrder = true;
      state.timer.updatedAt = Date.now();
      saveAndBroadcast(state);
    });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    markDisconnected(socket);
  });
});

setInterval(cleanupInactiveRooms, 15 * 60 * 1000);

const PORT = Number(process.env.PORT || 3001);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS origin: ${allowedOrigin}`);
});

function createInitialState(room: Room): GameState {
  return {
    room,
    characters: [],
    tokens: [],
    music: {
      currentTrack: null,
      playlist: [],
      groups: [],
      volume: 50,
      isPlaying: false,
      isLooping: false,
      updatedAt: Date.now(),
    },
    timer: {
      currentPlayerIndex: 0,
      timeRemaining: room.settings.defaultTurnSeconds,
      isRunning: false,
      playerOrder: room.players.map((player) => player.id),
      isManualOrder: false,
      defaultSeconds: room.settings.defaultTurnSeconds,
      updatedAt: Date.now(),
    },
    diceRolls: [],
    chatMessages: [],
  };
}

function joinSocketToRoom(socket: ClientSocket, roomId: string, playerId: string) {
  const previousRoom = socketRoom.get(socket.id);
  if (previousRoom && previousRoom !== roomId) socket.leave(previousRoom);
  socket.data.playerId = playerId;
  socketRoom.set(socket.id, roomId);
  socket.join(roomId);
}

function withRoom(socket: ClientSocket, handler: (state: GameState, player: Player) => void) {
  const roomId = socketRoom.get(socket.id);
  const state = roomId ? rooms.get(roomId) : undefined;
  const player = state?.room.players.find((item) => item.connected && item.lastSeen && socketRoom.get(socket.id) === state.room.id && item.sessionId);
  const actor = state ? getSocketPlayer(socket, state) : undefined;
  if (!state || !actor) return deny(socket, 'Entre em uma sala antes de jogar.');
  handler(state, actor);
}

function withMaster(socket: ClientSocket, handler: (state: GameState, player: Player) => void) {
  withRoom(socket, (state, player) => {
    if (!player.isMaster) return deny(socket, 'Apenas o mestre pode executar esta acao.');
    handler(state, player);
  });
}

function getSocketPlayer(socket: ClientSocket, state: GameState) {
  return state.room.players.find((player) => player.connected && socket.data?.playerId === player.id);
}

function markDisconnected(socket: ClientSocket) {
  const roomId = socketRoom.get(socket.id);
  const state = roomId ? rooms.get(roomId) : undefined;
  if (!state) return;

  const player = getSocketPlayer(socket, state);
  if (player) {
    player.connected = false;
    player.lastSeen = Date.now();
    pauseTimerIfEmpty(state);
    saveAndBroadcast(state);
    io.to(state.room.id).emit('player:left', player.id);
  }

  if (roomId) socket.leave(roomId);
  socketRoom.delete(socket.id);
}

function saveAndBroadcast(state: GameState) {
  state.room.updatedAt = Date.now();
  syncTimerOrder(state);
  saveRooms();
  io.to(state.room.id).emit('game:state', state);
  io.to(state.room.id).emit('room:update', state.room);
  io.to(state.room.id).emit('timer:update', state.timer);
  io.to(state.room.id).emit('music:update', state.music);
}

function syncTimerOrder(state: GameState) {
  const connectedPlayers = state.room.players.filter((p) => p.connected);
  const connectedIds = connectedPlayers.map((p) => p.id);

  if (!state.timer.isManualOrder) {
    state.timer.playerOrder = connectedIds;
  } else {
    // Se for manual, apenas removemos quem saiu
    state.timer.playerOrder = state.timer.playerOrder.filter((id) => connectedIds.includes(id));
    // E adicionamos quem entrou e não está na lista
    connectedIds.forEach((id) => {
      if (!state.timer.playerOrder.includes(id)) {
        state.timer.playerOrder.push(id);
      }
    });
  }

  if (state.timer.currentPlayerIndex >= state.timer.playerOrder.length) {
    state.timer.currentPlayerIndex = 0;
  }
}

function startTimer(state: GameState) {
  if (state.timer.playerOrder.length === 0) return;
  state.timer.isRunning = true;
  state.timer.updatedAt = Date.now();
  saveAndBroadcast(state);

  if (timerIntervals.has(state.room.id)) return;
  const interval = setInterval(() => {
    const fresh = rooms.get(state.room.id);
    if (!fresh || !fresh.timer.isRunning) return;
    if (fresh.timer.timeRemaining <= 1) nextTurn(fresh);
    else {
      fresh.timer.timeRemaining -= 1;
      fresh.timer.updatedAt = Date.now();
      saveAndBroadcast(fresh);
    }
  }, 1000);
  timerIntervals.set(state.room.id, interval);
}

function pauseTimer(state: GameState) {
  state.timer.isRunning = false;
  state.timer.updatedAt = Date.now();
  const interval = timerIntervals.get(state.room.id);
  if (interval) clearInterval(interval);
  timerIntervals.delete(state.room.id);
  saveAndBroadcast(state);
}

function resetTimer(state: GameState) {
  pauseTimer(state);
  state.timer.timeRemaining = state.timer.defaultSeconds;
  state.timer.currentPlayerIndex = 0;
  state.timer.updatedAt = Date.now();
  saveAndBroadcast(state);
}

function nextTurn(state: GameState) {
  syncTimerOrder(state);
  const totalPlayers = Math.max(state.timer.playerOrder.length, 1);
  state.timer.currentPlayerIndex = (state.timer.currentPlayerIndex + 1) % totalPlayers;
  state.timer.timeRemaining = state.timer.defaultSeconds;
  state.timer.updatedAt = Date.now();
  saveAndBroadcast(state);
}

function pauseTimerIfEmpty(state: GameState) {
  if (state.room.players.some((player) => player.connected)) return;
  pauseTimer(state);
}

function updateMusic(state: GameState, updates: Partial<MusicState>) {
  state.music = { ...state.music, ...updates };
  if (state.music.currentTrack) {
    state.music.currentTrack = {
      ...state.music.currentTrack,
      volume: state.music.volume,
      isPlaying: state.music.isPlaying,
    };
  }
  saveAndBroadcast(state);
}

function canControlToken(player: Player, token: Token, state: GameState) {
  if (player.isMaster) return true;
  if (token.locked) return false;
  return state.room.settings.allowPlayersMoveOwnTokens && token.ownerId === player.id;
}

function sanitizeCharacter(character: Character, roomId: string, ownerId: string, existingId?: string): Character {
  const now = Date.now();
  return {
    id: existingId || character.id || createId('char'),
    roomId,
    ownerId,
    name: cleanText(character.name, 60) || 'Personagem',
    class: cleanText(character.class || '', 40),
    level: clampNumber(character.level || 1, 1, 30),
    currentHp: clampNumber(character.currentHp || 0, 0, 9999),
    maxHp: clampNumber(character.maxHp || 1, 1, 9999),
    avatarUrl: cleanUrl(character.avatarUrl),
    attributes: {
      str: clampNumber(character.attributes?.str || 10, 1, 30),
      dex: clampNumber(character.attributes?.dex || 10, 1, 30),
      con: clampNumber(character.attributes?.con || 10, 1, 30),
      int: clampNumber(character.attributes?.int || 10, 1, 30),
      wis: clampNumber(character.attributes?.wis || 10, 1, 30),
      cha: clampNumber(character.attributes?.cha || 10, 1, 30),
    },
    inventory: (character.inventory || []).slice(0, 50).map((item) => ({
      id: item.id || createId('item'),
      name: cleanText(item.name, 60) || 'Item',
      quantity: clampNumber(item.quantity || 1, 1, 999),
      description: cleanText(item.description || '', 200),
    })),
    spells: (character.spells || []).slice(0, 50).map((spell) => ({
      id: spell.id || createId('spell'),
      name: cleanText(spell.name, 60) || 'Magia',
      level: clampNumber(spell.level || 0, 0, 9),
      description: cleanText(spell.description || '', 300),
    })),
    notes: cleanText(character.notes || '', 5000),
    updatedAt: now,
  };
}

function findRoomByCode(code: string) {
  return Array.from(rooms.values()).find((state) => state.room.code === code);
}

function createUniqueRoomCode() {
  let code = '';
  do {
    code = `RPG-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  } while (findRoomByCode(code));
  return code;
}

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function cleanUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function clampNumber(value: unknown, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function snapNumber(value: unknown, gridSize: number) {
  return Math.round(clampNumber(value, -10000, 10000) / gridSize) * gridSize;
}

function checkRate(socket: ClientSocket, key: string, limit: number, windowMs: number) {
  const bucketKey = `${socket.id}:${key}`;
  const now = Date.now();
  const recent = (rateBuckets.get(bucketKey) || []).filter((timestamp) => now - timestamp < windowMs);
  recent.push(now);
  rateBuckets.set(bucketKey, recent);
  return recent.length <= limit;
}

function deny(socket: ClientSocket, message: string) {
  socket.emit('error:message', message);
}

function ok<T>(data: T): SocketAck<T> {
  return { ok: true, data };
}

function fail<T>(error: string): SocketAck<T> {
  return { ok: false, error };
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado.';
}

function loadRooms() {
  try {
    if (!fs.existsSync(dataFile)) return;
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8')) as PersistedData;
    parsed.rooms.forEach((state) => {
      state.room.players.forEach((player) => {
        player.connected = false;
      });
      state.timer.isRunning = false;
      rooms.set(state.room.id, state);
    });
    console.log(`Loaded ${rooms.size} persisted rooms`);
  } catch (error) {
    console.warn(`Could not load persisted rooms: ${toErrorMessage(error)}`);
  }
}

function saveRooms() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    const data: PersistedData = { rooms: Array.from(rooms.values()) };
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn(`Could not persist rooms: ${toErrorMessage(error)}`);
  }
}

function cleanupInactiveRooms() {
  const now = Date.now();
  const maxAge = Number(process.env.ROOM_TTL_HOURS || 24) * 60 * 60 * 1000;

  rooms.forEach((state, roomId) => {
    const hasConnectedPlayers = state.room.players.some((player) => player.connected);
    if (!hasConnectedPlayers && now - state.room.updatedAt > maxAge) {
      const interval = timerIntervals.get(roomId);
      if (interval) clearInterval(interval);
      timerIntervals.delete(roomId);
      rooms.delete(roomId);
    }
  });

  saveRooms();
}
