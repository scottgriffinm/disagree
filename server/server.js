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

// API to create a new room
app.post('/api/rooms', (req, res) => {
  const { name, stance } = req.body;

  if (!name || !stance || !stance.party || !stance.percentage) {
    return res.status(400).json({ error: "Invalid room data" });
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
  debatesToday += 1; // Increment debates today
  res.status(201).json(newRoom);
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
  io.emit('stats-update', { usersOnline: activeConnections, activeDebates: rooms.length, debatesToday });

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