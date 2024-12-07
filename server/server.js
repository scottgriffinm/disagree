// server/server.js

const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

let rooms = [];
let activeConnections = 0;
let debatesToday = rooms.length;

// Maps socket.id to { roomId, isOwner: boolean }
let socketToRoom = {};

// Restore the API endpoints for rooms and stats here
app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

app.get('/api/stats', (req, res) => {
  res.json({
    usersOnline: activeConnections,
    activeDebates: rooms.length,
    debatesToday,
  });
});

// Fallback to serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

io.on('connection', (socket) => {
  activeConnections++;
  console.log('A user connected. Total users online:', activeConnections);

  io.emit('stats-update', {
    usersOnline: activeConnections,
    activeDebates: rooms.length,
    debatesToday,
  });

  // Handle room creation
  socket.on('create-room', (data, callback) => {
    const { name, stance } = data;
    if (!name || !stance || !stance.party || !stance.percentage) {
      if (callback) callback({ error: "Invalid room data" });
      return;
    }

    const newRoom = {
      id: rooms.length + 1,
      name,
      stance,
      participants: 1,
      maxParticipants: 2,
      created: new Date().toISOString(),
      roomCreator: socket.id,
    };

    rooms.push(newRoom);
    debatesToday += 1;
    const roomId = `room-${newRoom.id}`;
    socket.join(roomId);

    // Track that this socket is the owner of this room
    socketToRoom[socket.id] = { roomId: newRoom.id, isOwner: true };

    if (callback) callback({ room: newRoom });
  });

  // Handle joining a room
  socket.on('join-room', (roomId, callback) => {
    const room = rooms.find((r) => r.id === parseInt(roomId));
    if (!room) {
      if (callback) callback({ error: "Room not found" });
      return;
    }

    if (room.participants >= room.maxParticipants) {
      if (callback) callback({ error: "Room is full" });
      return;
    }

    socket.join(`room-${room.id}`);
    room.participants += 1;

    // This user is not the owner
    socketToRoom[socket.id] = { roomId: room.id, isOwner: false };

    // If second participant joined, start the call immediately
    if (room.participants === room.maxParticipants) {
      io.to(`room-${room.id}`).emit('start-call', { room });
    }

    if (callback) callback({ room });
  });
  
  
  // Handle "new-partner" request
socket.on('new-partner', (callback) => {
  const userInfo = socketToRoom[socket.id];
  if (!userInfo) return; // User is not in a room
  
  const { roomId, isOwner } = userInfo;
  if (!isOwner) return; // Only owners can trigger this action

  const room = rooms.find((r) => r.id === roomId);
  if (!room) return; // Room not found

  // Send the non-owner to the home page
  const participants = Array.from(io.sockets.adapter.rooms.get(`room-${roomId}`) || []);
  const nonOwnerSocketId = participants.find((id) => id !== socket.id);

  if (nonOwnerSocketId) {
    // Emit redirect event for the non-owner
    io.to(nonOwnerSocketId).emit('redirect-home');
    // Remove the non-owner from the room
    io.sockets.sockets.get(nonOwnerSocketId)?.leave(`room-${roomId}`);
    delete socketToRoom[nonOwnerSocketId];
  }

  // Update room participant count
  room.participants = 1;

  // Emit redirect event for the owner
  if (callback) callback({ success: true });
  socket.emit('redirect-waiting', { room });
});


  // Handle disconnection
  socket.on('disconnect', () => {
    activeConnections--;
    console.log('A user disconnected. Total users online:', activeConnections);
    io.emit('stats-update', {
      usersOnline: activeConnections,
      activeDebates: rooms.length,
      debatesToday,
    });

    const userInfo = socketToRoom[socket.id];
    if (!userInfo) {
      // This user was not in any room
      return;
    }

    const { roomId, isOwner } = userInfo;
    const room = rooms.find((r) => r.id === roomId);

    if (!room) return; // Room might have been removed

    // Remove this user from tracking
    delete socketToRoom[socket.id];

    room.participants -= 1;
    if (isOwner) {
      // Owner left: if there was another participant, send them home
      io.to(`room-${room.id}`).emit('redirect-home');
      // Remove the room from the list as it's closed now
      rooms = rooms.filter((r) => r.id !== room.id);
    } else {
      // A participant (not owner) left:
      // Send the owner (if still connected) back to waiting
      const ownerSocketId = room.roomCreator;
      // Emit only if the owner is still connected
      // Check if the owner is connected. The owner should be in socketToRoom if still online
      if (io.sockets.sockets.get(ownerSocketId)) {
        io.to(ownerSocketId).emit('redirect-waiting', { room });
      }
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});