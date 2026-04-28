import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Room, Player, SocketEvents } from '../../shared/types';
import { setupRoomHandlers } from './sockets/roomHandler';
import { setupGameHandlers } from './sockets/gameHandler';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server<SocketEvents>(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
  console.log(`Client conectado: ${socket.id}`);

  setupRoomHandlers(socket, io, rooms);
  setupGameHandlers(socket, io, rooms);

  socket.on('disconnect', () => {
    console.log(`Client desconectado: ${socket.id}`);
    
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players[playerIndex].connected = false;
        io.to(roomId).emit('player:left', socket.id);
        
        if (room.players.every(p => !p.connected)) {
          setTimeout(() => {
            if (rooms.get(roomId)?.players.every(p => !p.connected)) {
              rooms.delete(roomId);
              console.log(`Sala ${roomId} removida por inatividade`);
            }
          }, 3600000);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🔌 Socket.io ativo`);
});