// SERVIDOR SIMPLIFICADO PARA TESTE RÁPIDO
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('✅ Cliente conectado:', socket.id);

  socket.on('room:create', (data, callback) => {
    const code = 'RPG' + Math.random().toString(36).substring(2, 5).toUpperCase();
    
    const player = {
      id: socket.id,
      name: data.playerName,
      isMaster: true,
      connected: true
    };

    const room = {
      id: socket.id + Date.now(),
      code,
      name: data.name,
      masterId: socket.id,
      players: [player],
      createdAt: Date.now(),
      gridSize: 50
    };

    rooms.set(room.id, room);
    socket.join(room.id);
    
    console.log('✅ Sala criada:', code);
    callback(room);
  });

  socket.on('room:join', (data, callback) => {
    const foundRoom = Array.from(rooms.values()).find(r => r.code === data.code.toUpperCase());
    
    if (!foundRoom) {
      callback(null);
      return;
    }

    const player = {
      id: socket.id,
      name: data.playerName,
      isMaster: false,
      connected: true
    };

    foundRoom.players.push(player);
    socket.join(foundRoom.id);

    io.to(foundRoom.id).emit('player:joined', player);
    io.to(foundRoom.id).emit('room:update', foundRoom);
    
    console.log('✅ Jogador entrou:', data.playerName);
    callback(foundRoom);
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log('=================================');
  console.log('✅ SERVIDOR RODANDO NA PORTA 3001');
  console.log('✅ Socket.io funcionando');
  console.log('=================================');
});