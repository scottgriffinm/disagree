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

// Mock database for rooms
// let rooms = Array.from({ length: 55 }, (_, index) => ({
//   id: index + 1,
//   name: `Topic Room ${index + 1}`,
//   stance: {
//     party: index % 2 === 0 ? "Democrat" : "Republican",
//     percentage: Math.floor(Math.random() * 100) + 1,
//   },
//   participants: Math.max(Math.floor(Math.random() * 3), 1),
//   maxParticipants: 2,
//   created: new Date(
//     Date.now() - Math.floor(Math.random() * 1000000)
//   ).toISOString(),
// }));

// Stats tracking
let activeConnections = 0;
let debatesToday = rooms.length;

// Fallback to serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  activeConnections++;
  console.log('A user connected. Total users online:', activeConnections);

  // Emit updated stats on new connection
  io.emit('stats-update', { usersOnline: activeConnections, activeDebates: rooms.length, debatesToday });

  // Handle room creation
  socket.on('create-room', (data, callback) => {
    const { name, stance } = data;
    if (!name || !stance || !stance.party || !stance.percentage) {
      // If invalid data, you might send an error callback
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
      roomCreator: socket.id // store who created the room
    };

    rooms.push(newRoom);
    debatesToday += 1;

    // Make the socket join this room (by room id or a unique namespace)
    const roomId = `room-${newRoom.id}`;
    socket.join(roomId);

    // Send room info back to the client who created it
    if (callback) callback({ room: newRoom });
  });
  
  // Handle joining a room
  socket.on('join-room', (roomId, callback) => {
    // Find the room by ID
    const room = rooms.find(r => r.id === parseInt(roomId));
    if (!room) {
      if (callback) callback({ error: "Room not found" });
      return;
    }

    // Check if there's space
    if (room.participants >= room.maxParticipants) {
      if (callback) callback({ error: "Room is full" });
      return;
    }

    // Join the room
    socket.join(`room-${room.id}`);
    room.participants += 1;

    // If this is the second participant, start the call
    if (room.participants === room.maxParticipants) {
      // Emit an event to all users in that room to start the call
      io.to(`room-${room.id}`).emit('start-call', { room });
    }

    if (callback) callback({ room });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    activeConnections--;
    console.log('A user disconnected. Total users online:', activeConnections);

    // Emit updated stats on disconnection
    io.emit('stats-update', { usersOnline: activeConnections, activeDebates: rooms.length, debatesToday });
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});