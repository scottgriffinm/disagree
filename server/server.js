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

// API endpoints
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

// Serve React app for any other routes
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
    socketToRoom[socket.id] = { roomId: room.id, isOwner: false };

    if (room.participants === room.maxParticipants) {
      io.to(`room-${room.id}`).emit('start-call', { room });
    }

    if (callback) callback({ room });
  });

  // WebRTC signaling
  socket.on('signal', (data) => {
    const { target, description } = data;
    io.to(target).emit('signal', { sender: socket.id, description });
  });

  // Handle new partner request
  socket.on('new-partner', (callback) => {
    const userInfo = socketToRoom[socket.id];
    if (!userInfo) return;

    const { roomId, isOwner } = userInfo;
    if (!isOwner) return;

    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    const participants = Array.from(io.sockets.adapter.rooms.get(`room-${roomId}`) || []);
    const nonOwnerSocketId = participants.find((id) => id !== socket.id);

    if (nonOwnerSocketId) {
      io.to(nonOwnerSocketId).emit('redirect-home');
      io.sockets.sockets.get(nonOwnerSocketId)?.leave(`room-${roomId}`);
      delete socketToRoom[nonOwnerSocketId];
    }

    room.participants = 1;

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
    if (!userInfo) return;

    const { roomId, isOwner } = userInfo;
    const room = rooms.find((r) => r.id === roomId);

    if (!room) return;

    delete socketToRoom[socket.id];
    room.participants -= 1;

    if (isOwner) {
      io.to(`room-${room.id}`).emit('redirect-home');
      rooms = rooms.filter((r) => r.id !== room.id);
    } else {
      const ownerSocketId = room.roomCreator;
      if (io.sockets.sockets.get(ownerSocketId)) {
        io.to(ownerSocketId).emit('redirect-waiting', { room });
      }
    }
  });

  // Handle user leaving a room
  socket.on('leave-room', (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    socket.leave(`room-${roomId}`);
    room.participants--;

    if (room.participants === 0) {
      rooms = rooms.filter((r) => r.id !== roomId);
    } else {
      io.to(`room-${roomId}`).emit('user-left', socket.id);
    }

    delete socketToRoom[socket.id];
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});