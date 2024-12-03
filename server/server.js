const express = require('express');
const path = require('path');
const app = express();

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.static(path.join(__dirname, '../build')));

// Mock database for rooms
let rooms = Array.from({ length: 55 }, (_, index) => ({
  id: index + 1,
  name: `Topic Room ${index + 1}`,
  stance: {
    party: index % 2 === 0 ? "Democrat" : "Republican",
    percentage: Math.floor(Math.random() * 100) + 1,
  },
  participants: Math.max(Math.floor(Math.random() * 3), 1),
  maxParticipants: 2,
  created: new Date(
    Date.now() - Math.floor(Math.random() * 1000000)
  ).toISOString(),
}));

// API to get all rooms
app.get('/api/rooms', (req, res) => {
  res.json(rooms);
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
  res.status(201).json(newRoom);
});

// Fallback to serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});