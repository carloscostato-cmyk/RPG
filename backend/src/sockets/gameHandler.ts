import { Socket, Server } from 'socket.io';
import { Room, Token, Character, DiceRoll, MusicTrack, TurnTimer } from '../../../shared/types';

export function setupGameHandlers(
  socket: Socket, 
  io: Server, 
  rooms: Map<string, Room>
) {

  socket.on('token:move', (token) => {
    const room = getRoomBySocketId(socket.id, rooms);
    if (room) {
      io.to(room.id).emit('token:move', token);
    }
  });

  socket.on('token:add', (token) => {
    const room = getRoomBySocketId(socket.id, rooms);
    if (room) {
      io.to(room.id).emit('token:add', token);
    }
  });

  socket.on('token:remove', (tokenId) => {
    const room = getRoomBySocketId(socket.id, rooms);
    if (room) {
      io.to(room.id).emit('token:remove', tokenId);
    }
  });

  socket.on('token:update', (token) => {
    const room = getRoomBySocketId(socket.id, rooms);
    if (room) {
      io.to(room.id).emit('token:update', token);
    }
  });

  socket.on('character:update', (character) => {
    const room = getRoomBySocketId(socket.id, rooms);
    if (room) {
      io.to(room.id).emit('character:update', character);
    }
  });

  socket.on('dice:roll', (roll) => {
    const room = getRoomBySocketId(socket.id, rooms);
    if (room) {
      io.to(room.id).emit('dice:roll', roll);
    }
  });

  socket.on('music:play', (track) => {
    const room = getRoomBySocketId(socket.id, rooms);
    if (room && isMaster(socket.id, room)) {
      io.to(room.id).emit('music:play', track);
    }
  });

  socket.on('music:pause', () => {
    const room = getRoomBySocketId(socket.id, rooms);
    if (room && isMaster(socket.id, room)) {
      io.to(room.id).emit('music:pause');
    }
  });

  socket.on('music:volume', (volume) => {
    const room = getRoomBySocketId(socket.id, rooms);
    if (room && isMaster(socket.id, room)) {
      io.to(room.id).emit('music:volume', volume);
    }
  });

  socket.on('timer:update', (timer) => {
    const room = getRoomBySocketId(socket.id, rooms);
    if (room) {
      io.to(room.id).emit('timer:update', timer);
    }
  });

  socket.on('chat:message', (data) => {
    const room = getRoomBySocketId(socket.id, rooms);
    if (room) {
      io.to(room.id).emit('chat:message', data);
    }
  });
}

function getRoomBySocketId(socketId: string, rooms: Map<string, Room>): Room | undefined {
  return Array.from(rooms.values()).find(room => 
    room.players.some(p => p.id === socketId)
  );
}

function isMaster(socketId: string, room: Room): boolean {
  return room.masterId === socketId;
}