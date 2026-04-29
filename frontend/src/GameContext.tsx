import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
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
  SocketEvents,
  Token,
  TurnTimer,
} from '@shared/types';

type ClientSocket = Socket<SocketEvents, SocketEvents>;

interface GameContextType {
  socket: ClientSocket | null;
  isConnected: boolean;
  connectionError: string;
  identity: ClientIdentity | null;
  room: Room | null;
  currentPlayer: Player | null;
  characters: Map<string, Character>;
  tokens: Map<string, Token>;
  currentTrack: MusicTrack | null;
  music: MusicState | null;
  timer: TurnTimer | null;
  diceRolls: DiceRoll[];
  chatMessages: ChatMessage[];
  isDarkMode: boolean;
  language: 'pt' | 'en';

  createRoom: (name: string, playerName: string) => Promise<Room | null>;
  joinRoom: (code: string, playerName: string) => Promise<Room | null>;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
  rollDice: (sides: number, modifier?: number, isPrivate?: boolean) => void;
  addToken: (token?: Partial<Token>) => void;
  updateToken: (token: Token) => void;
  moveToken: (token: Token) => void;
  removeToken: (tokenId: string) => void;
  updateCharacter: (character: Character) => void;
  addMusicTrack: (track: Pick<MusicTrack, 'name' | 'url' | 'groupId'>) => void;
  playMusic: (trackId: string) => void;
  pauseMusic: () => void;
  setMusicVolume: (volume: number) => void;
  setMusicLoop: (isLooping: boolean) => void;
  removeMusicTrack: (trackId: string) => void;
  renameMusicTrack: (trackId: string, name: string) => void;
  addMusicGroup: (name: string) => void;
  removeMusicGroup: (groupId: string) => void;
  renameMusicGroup: (groupId: string, name: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  nextTurn: () => void;
  extendTimer: (seconds: number) => void;
  setTimerOrder: (order: string[]) => void;
  toggleDarkMode: () => void;
  setLanguage: (lang: 'pt' | 'en') => void;
}

const STORAGE_KEY = 'rpg-virtual-table.identity';
const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<ClientSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [identity, setIdentity] = useState<ClientIdentity | null>(() => readStoredIdentity());
  const [state, setState] = useState<GameState | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');

  useEffect(() => {
    const newSocket: ClientSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectionError('');
    });
    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });
    newSocket.on('connect_error', () => {
      setConnectionError('Servidor offline ou inacessivel.');
    });
    newSocket.on('game:state', setState);
    newSocket.on('error:message', setConnectionError);

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const currentPlayer = useMemo(() => {
    if (!state || !identity) return null;
    return state.room.players.find((player) => player.id === identity.playerId) || null;
  }, [identity, state]);

  const characters = useMemo(() => {
    return new Map((state?.characters || []).map((character) => [character.id, character]));
  }, [state]);

  const tokens = useMemo(() => {
    return new Map((state?.tokens || []).map((token) => [token.id, token]));
  }, [state]);

  const persistIdentity = useCallback((nextIdentity: ClientIdentity) => {
    setIdentity(nextIdentity);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIdentity));
  }, []);

  const createRoom = useCallback(async (name: string, playerName: string): Promise<Room | null> => {
    if (!socket) return null;

    return new Promise((resolve) => {
      socket.emit('room:create', { name, playerName, sessionId: identity?.sessionId }, (response) => {
        if (!response.ok || !response.data) {
          setConnectionError(response.error || 'Erro ao criar sala.');
          resolve(null);
          return;
        }

        persistIdentity(response.data.identity);
        setState(response.data.state);
        resolve(response.data.state.room);
      });
    });
  }, [identity?.sessionId, persistIdentity, socket]);

  const joinRoom = useCallback(async (code: string, playerName: string): Promise<Room | null> => {
    if (!socket) return null;

    return new Promise((resolve) => {
      socket.emit('room:join', { code, playerName, sessionId: identity?.sessionId }, (response) => {
        if (!response.ok || !response.data) {
          setConnectionError(response.error || 'Sala nao encontrada.');
          resolve(null);
          return;
        }

        persistIdentity(response.data.identity);
        setState(response.data.state);
        resolve(response.data.state.room);
      });
    });
  }, [identity?.sessionId, persistIdentity, socket]);

  const leaveRoom = useCallback(() => {
    socket?.emit('room:leave');
    setState(null);
  }, [socket]);

  const emit = useCallback(<K extends keyof SocketEvents>(event: K, ...args: Parameters<SocketEvents[K]>) => {
    if (!socket || !isConnected) {
      setConnectionError('Sem conexao com o servidor.');
      return;
    }
    socket.emit(event, ...args);
  }, [isConnected, socket]);

  const value: GameContextType = {
    socket,
    isConnected,
    connectionError,
    identity,
    room: state?.room || null,
    currentPlayer,
    characters,
    tokens,
    currentTrack: state?.music.currentTrack || null,
    music: state?.music || null,
    timer: state?.timer || null,
    diceRolls: state?.diceRolls || [],
    chatMessages: state?.chatMessages || [],
    isDarkMode,
    language,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage: (message) => emit('chat:message', { message }),
    rollDice: (sides, modifier = 0, isPrivate = false) => emit('dice:roll', { sides, modifier, isPrivate }),
    addToken: (token = {}) => emit('token:add', token),
    updateToken: (token) => emit('token:update', token),
    moveToken: (token) => emit('token:move', token),
    removeToken: (tokenId) => emit('token:remove', tokenId),
    updateCharacter: (character) => emit('character:update', character),
    addMusicTrack: (track) => emit('music:add', track),
    playMusic: (trackId) => emit('music:play', trackId),
    pauseMusic: () => emit('music:pause'),
    setMusicVolume: (volume) => emit('music:volume', volume),
    setMusicLoop: (isLooping) => emit('music:loop', isLooping),
    removeMusicTrack: (trackId) => emit('music:remove', trackId),
    renameMusicTrack: (trackId, name) => emit('music:rename', { trackId, name }),
    addMusicGroup: (name) => emit('music:group:add', name),
    removeMusicGroup: (groupId) => emit('music:group:remove', groupId),
    renameMusicGroup: (groupId, name) => emit('music:group:rename', { groupId, name }),
    startTimer: () => emit('timer:start'),
    pauseTimer: () => emit('timer:pause'),
    resetTimer: () => emit('timer:reset'),
    nextTurn: () => emit('timer:next'),
    extendTimer: (seconds) => emit('timer:extend', seconds),
    setTimerOrder: (order) => emit('timer:setOrder', order),
    toggleDarkMode: () => setIsDarkMode((previous) => !previous),
    setLanguage,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

function readStoredIdentity(): ClientIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as ClientIdentity : null;
  } catch {
    return null;
  }
}
