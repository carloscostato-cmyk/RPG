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
      connected: true
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
      connected: true
    };

    foundRoom.players.push(player);
    socket.join(foundRoom.id);

    io.to(foundRoom.id).emit('player:joined', player);
    io.to(foundRoom.id).emit('room:update', foundRoom);
    
    console.log(`Jogador ${data.playerName} entrou na sala ${data.code}`);
    callback(foundRoom);
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