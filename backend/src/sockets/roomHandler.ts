import { Socket, Server } from 'socket.io';
import { Room, Player } from '../../../shared/types';

export function setupRoomHandlers(
  socket: Socket, 
  io: Server, 
  rooms: Map<string, Room>
) {

  socket.on('room:create', (data, callback) => {
    const code = 'RPG' + Math.random().toString(36).substring(2, 5).toUpperCase();
    
    const player: Player = {
      id: socket.id,
      name: data.playerName,
      isMaster: true,
      connected: true,
      role: data.role || 'player'
    };

    const room: Room = {
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
    
    console.log(`Sala criada: ${code} por ${data.playerName}`);
    callback(room);
  });

  socket.on('room:join', (data, callback) => {
    const foundRoom = Array.from(rooms.values()).find(r => r.code === data.code.toUpperCase());
    
    if (!foundRoom) {
      callback(null);
      return;
    }

    const player: Player = {
      id: socket.id,
      name: data.playerName,
      isMaster: false,
      connected: true,
      role: data.role || 'player'
    };

    foundRoom.players.push(player);
    socket.join(foundRoom.id);

    io.to(foundRoom.id).emit('player:joined', player);
    io.to(foundRoom.id).emit('room:update', foundRoom);
    
    console.log(`Jogador ${data.playerName} entrou na sala ${data.code} como ${player.role}`);
    callback(foundRoom);
  });

  socket.on('room:update-player-role', (data) => {
    const room = Array.from(rooms.values()).find(r => r.players.some(p => p.id === socket.id));
    if (room && room.masterId === socket.id) {
      const player = room.players.find(p => p.id === data.playerId);
      if (player) {
        player.role = data.role;
        io.to(room.id).emit('room:update', room);
      }
    }
  });

  socket.on('room:set-map', (url) => {
    const room = Array.from(rooms.values()).find(r => r.players.some(p => p.id === socket.id));
    if (room && room.masterId === socket.id) {
      room.mapUrl = url;
      io.to(room.id).emit('room:update', room);
    }
  });

  socket.on('room:leave', () => {
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        socket.leave(roomId);
        room.players.splice(playerIndex, 1);
        io.to(roomId).emit('player:left', socket.id);
        io.to(roomId).emit('room:update', room);
      }
    });
  });
}