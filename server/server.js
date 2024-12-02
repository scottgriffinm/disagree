const express = require('express');
const path = require('path');
const app = express();

// Serve React app
app.use(express.static(path.join(__dirname, '../build')));

// API to provide topic room data
app.get('/api/rooms', (req, res) => {
  const rooms = Array.from({ length: 55 }, (_, index) => ({
    id: index + 1,
    name: `Topic Room ${index + 1}`,
    stance: {
      party: index % 2 === 0 ? "Democrat" : "Republican",
      percentage: Math.floor(Math.random() * 100) + 1,
    },
    participants: Math.max(Math.floor(Math.random() * 3), 1),
    maxParticipants: 2,
    created: new Date(
      Date.now() - Math.floor(Math.random() * 1000000000)
    ).toISOString(),
  }));

  res.json(rooms);
});

// Fallback to serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});