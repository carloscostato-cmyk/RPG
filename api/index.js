const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = createServer(app);

// CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Socket.io
const io = new Server(server, {
  cors: { origin: true, methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling']
});

// In-memory storage (for Vercel compatibility)
const rooms = new Map();
const socketRoom = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, rooms: rooms.size, uptime: process.uptime() });
});

// Socket.io handlers
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('room:create', (data, callback) => {
    try {
      const { playerName, name } = data;
      const code = generateRoomCode();
      const player = {
        id: generateId('player'),
        name: playerName,
        role: 'master',
        isMaster: true,
        connected: true,
        lastSeen: Date.now()
      };

      const room = {
        id: generateId('room'),
        code,
        name,
        masterId: player.id,
        players: [player],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        gridSize: 50,
        settings: { allowPlayersMoveOwnTokens: true, defaultTurnSeconds: 60 }
      };

      const state = createInitialState(room);
      rooms.set(room.id, state);
      socketRoom.set(socket.id, room.id);
      
      callback({ ok: true, data: { state, identity: { sessionId: generateId('session'), playerId: player.id } } });
      io.to(room.id).emit('room:update', room);
    } catch (error) {
      callback({ ok: false, error: error.message });
    }
  });

  socket.on('room:join', (data, callback) => {
    try {
      const { playerName, code } = data;
      const state = findRoomByCode(code.toUpperCase());
      if (!state) return callback({ ok: false, error: 'Sala não encontrada.' });

      const player = {
        id: generateId('player'),
        name: playerName,
        role: 'player',
        isMaster: false,
        connected: true,
        lastSeen: Date.now()
      };

      state.room.players.push(player);
      state.room.updatedAt = Date.now();
      socketRoom.set(socket.id, state.room.id);
      
      callback({ ok: true, data: { state, identity: { sessionId: generateId('session'), playerId: player.id } } });
      io.to(state.room.id).emit('room:update', state.room);
      io.to(state.room.id).emit('game:state', state);
    } catch (error) {
      callback({ ok: false, error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const roomId = socketRoom.get(socket.id);
    if (roomId) {
      socket.leave(roomId);
      socketRoom.delete(socket.id);
    }
  });
});

// Helper functions
function generateRoomCode() {
  return `RPG-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function findRoomByCode(code) {
  return Array.from(rooms.values()).find(state => state.room.code === code);
}

function createInitialState(room) {
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
      updatedAt: Date.now()
    },
    timer: {
      currentPlayerIndex: 0,
      timeRemaining: room.settings.defaultTurnSeconds,
      isRunning: false,
      playerOrder: room.players.map(p => p.id),
      isManualOrder: false,
      defaultSeconds: room.settings.defaultTurnSeconds,
      updatedAt: Date.now()
    },
    diceRolls: [],
    chatMessages: []
  };
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for Vercel
module.exports = app;
