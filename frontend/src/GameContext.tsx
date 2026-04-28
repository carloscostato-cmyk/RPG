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
  
  createRoom: (name: string, playerName: string) => Promise<Room | null>;
  joinRoom: (code: string, playerName: string) => Promise<Room | null>;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
  rollDice: (sides: number) => void;
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

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createRoom = useCallback(async (name: string, playerName: string): Promise<Room | null> => {
    if (!socket) return null;
    
    return new Promise((resolve) => {
      socket.emit('room:create', { name, playerName }, (room) => {
        setRoom(room);
        setCurrentPlayer(room.players[0]);
        resolve(room);
      });
    });
  }, [socket]);

  const joinRoom = useCallback(async (code: string, playerName: string): Promise<Room | null> => {
    if (!socket) return null;
    
    return new Promise((resolve) => {
      socket.emit('room:join', { code, playerName }, (room) => {
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

  const rollDice = useCallback((sides: number) => {
    if (socket && currentPlayer) {
      const result = Math.floor(Math.random() * sides) + 1;
      const roll: DiceRoll = {
        id: Date.now().toString(),
        playerId: currentPlayer.id,
        sides,
        result,
        timestamp: Date.now()
      };
      socket.emit('dice:roll', roll);
      setDiceRolls(prev => [...prev.slice(-9), roll]);
    }
  }, [socket, currentPlayer]);

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
    toggleDarkMode,
    setLanguage
  };

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