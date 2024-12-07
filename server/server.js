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

// API to get all rooms
app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

// API to get stats
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

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  activeConnections++;
  console.log('A user connected. Total users online:', activeConnections);

  // Emit updated stats on new connection
  io.emit('stats-update', {
    usersOnline: activeConnections,
    activeDebates: rooms.length,
    debatesToday,
  });

  // Listen for room creation
  socket.on('create-room', ({ name, stance }, callback) => {
    if (!name || !stance || !stance.party || !stance.percentage) {
      callback({ error: 'Invalid room data' });
      return;
    }

    const newRoom = {
      id: rooms.length + 1,
      name,
      stance,
      participants: 1,
      maxParticipants: 2,
      created: new Date().toISOString(),
    };

    rooms.push(newRoom);
    debatesToday++;

    // Notify all clients about the new room
    io.emit('new-room', newRoom);

    // Callback to the client with the created room
    callback({ room: newRoom });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    activeConnections--;
    console.log('A user disconnected. Total users online:', activeConnections);

    // Emit updated stats on disconnection
    io.emit('stats-update', {
      usersOnline: activeConnections,
      activeDebates: rooms.length,
      debatesToday,
    });
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});