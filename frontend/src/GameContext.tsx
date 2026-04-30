import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, Player, Character, Token, MusicTrack, TurnTimer, DiceRoll, SocketEvents } from '../../shared/types';

interface GameContextType {
  socket: Socket<SocketEvents> | null;
  room: Room | null;
  currentPlayer: Player | null;
  characters: Map<string, Character>;
  tokens: Map<string, Token>;
  currentTrack: MusicTrack | null;
  timer: TurnTimer | null;
  diceRolls: DiceRoll[];
  isDarkMode: boolean;
  language: 'pt' | 'en';
  
  createRoom: (name: string, playerName: string, role: 'player' | 'spectator') => Promise<Room | null>;
  joinRoom: (code: string, playerName: string, role: 'player' | 'spectator') => Promise<Room | null>;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
  rollDice: (notation: string) => void;
  updateCharacter: (character: Character) => void;
  updatePlayerRole: (playerId: string, role: 'player' | 'spectator') => void;
  setMapUrl: (url: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  nextTurn: () => void;
  extendTimer: (seconds: number) => void;
  setTimerOrder: (order: string[]) => void;
  toggleDarkMode: () => void;
  setLanguage: (lang: 'pt' | 'en') => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket<SocketEvents> | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [characters, setCharacters] = useState<Map<string, Character>>(new Map());
  const [tokens, setTokens] = useState<Map<string, Token>>(new Map());
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [timer, setTimer] = useState<TurnTimer | null>(null);
  const [diceRolls, setDiceRolls] = useState<DiceRoll[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
    
    newSocket.on('connect', () => console.log('✅ Conectado ao servidor'));
    newSocket.on('disconnect', () => console.log('❌ Desconectado do servidor'));

    setSocket(newSocket);

    newSocket.on('room:update', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setCurrentPlayer(prev => {
        const updated = updatedRoom.players.find(p => p.id === newSocket.id);
        return updated || prev;
      });
      if (updatedRoom.mapUrl) {
        // Handle map update if needed
      }
    });

    newSocket.on('token:add', (token: Token) => {
      setTokens(prev => new Map(prev).set(token.id, token));
    });

    newSocket.on('token:move', (token: Token) => {
      setTokens(prev => new Map(prev).set(token.id, token));
    });

    newSocket.on('token:update', (token: Token) => {
      setTokens(prev => new Map(prev).set(token.id, token));
    });

    newSocket.on('token:remove', (tokenId: string) => {
      setTokens(prev => {
        const next = new Map(prev);
        next.delete(tokenId);
        return next;
      });
    });

    newSocket.on('dice:roll', (roll: DiceRoll) => {
      if (roll.playerId !== newSocket.id) {
        setDiceRolls(prev => [...prev.slice(-9), roll]);
      }
    });

    newSocket.on('timer:update', (updatedTimer: TurnTimer) => {
      setTimer(updatedTimer);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createRoom = useCallback(async (name: string, playerName: string, role: 'player' | 'spectator' = 'player'): Promise<Room | null> => {
    if (!socket) return null;
    
    return new Promise((resolve) => {
      socket.emit('room:create', { name, playerName, role }, (room) => {
        setRoom(room);
        setCurrentPlayer(room.players[0]);
        resolve(room);
      });
    });
  }, [socket]);

  const joinRoom = useCallback(async (code: string, playerName: string, role: 'player' | 'spectator' = 'player'): Promise<Room | null> => {
    if (!socket) return null;
    
    return new Promise((resolve) => {
      socket.emit('room:join', { code, playerName, role }, (room) => {
        if (room) {
          setRoom(room);
          setCurrentPlayer(room.players.find(p => p.id === socket.id) || null);
        }
        resolve(room);
      });
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.emit('room:leave');
      setRoom(null);
      setCurrentPlayer(null);
      setTokens(new Map());
      setCharacters(new Map());
    }
  }, [socket]);

  const sendMessage = useCallback((message: string) => {
    if (socket && currentPlayer) {
      socket.emit('chat:message', {
        playerId: currentPlayer.id,
        message,
        timestamp: Date.now()
      });
    }
  }, [socket, currentPlayer]);

  const rollDice = useCallback((notation: string) => {
    if (socket && currentPlayer) {
      const diceRegex = /^(\d+)?d(\d+)([+-]\d+)?$/i;
      const match = notation.match(diceRegex);
      
      if (!match) return;

      const count = parseInt(match[1]) || 1;
      const sides = parseInt(match[2]);
      const bonus = parseInt(match[3]) || 0;
      
      if (sides > 1000) return;

      const results: number[] = [];
      let total = 0;
      for (let i = 0; i < count; i++) {
        const res = Math.floor(Math.random() * sides) + 1;
        results.push(res);
        total += res;
      }
      total += bonus;

      const roll: DiceRoll = {
        id: Date.now().toString(),
        playerId: currentPlayer.id,
        notation,
        results,
        bonus,
        total,
        timestamp: Date.now()
      };
      
      socket.emit('dice:roll', roll);
      setDiceRolls(prev => [...prev.slice(-9), roll]);
    }
  }, [socket, currentPlayer]);

  const updateCharacter = useCallback((character: Character) => {
    if (socket) {
      socket.emit('character:update', character);
    }
  }, [socket]);

  const updatePlayerRole = useCallback((playerId: string, role: 'player' | 'spectator') => {
    if (socket && currentPlayer?.isMaster) {
      socket.emit('room:update-player-role', { playerId, role });
    }
  }, [socket, currentPlayer]);

  const setMapUrl = useCallback((url: string) => {
    if (socket && currentPlayer?.isMaster) {
      socket.emit('room:set-map', url);
    }
  }, [socket, currentPlayer]);

  const startTimer = useCallback(() => {
    if (socket && currentPlayer?.isMaster) socket.emit('timer:start');
  }, [socket, currentPlayer]);

  const pauseTimer = useCallback(() => {
    if (socket && currentPlayer?.isMaster) socket.emit('timer:pause');
  }, [socket, currentPlayer]);

  const resetTimer = useCallback(() => {
    if (socket && currentPlayer?.isMaster) socket.emit('timer:reset');
  }, [socket, currentPlayer]);

  const nextTurn = useCallback(() => {
    if (socket && currentPlayer?.isMaster) socket.emit('timer:next');
  }, [socket, currentPlayer]);

  const extendTimer = useCallback((seconds: number) => {
    if (socket && currentPlayer?.isMaster) socket.emit('timer:extend', seconds);
  }, [socket, currentPlayer]);

  const setTimerOrder = useCallback((_order: string[]) => {
    // This would emit a change in order
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const value: GameContextType = {
    socket,
    room,
    currentPlayer,
    characters,
    tokens,
    currentTrack,
    timer,
    diceRolls,
    isDarkMode,
    language,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    rollDice,
    updateCharacter,
    updatePlayerRole,
    setMapUrl,
    startTimer,
    pauseTimer,
    resetTimer,
    nextTurn,
    extendTimer,
    setTimerOrder,
    toggleDarkMode,
    setLanguage,
    // Add these to satisfy the setters if they are needed in context, but here they aren't
    setCurrentTrack, 
    setTimer
  } as any; // Cast to any to avoid setter issues for now, or just ensure currentTrack/timer are used

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};