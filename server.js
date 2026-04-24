const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

const BASE = 'https://data-api.polymarket.com';

// Leaderboard: /leaderboard?window=7d&limit=50
app.get('/leaderboard', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query).toString();
    const resp = await fetch(`${BASE}/leaderboard?${params}`);
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Positions: /positions?user=0x...
app.get('/positions', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query).toString();
    const resp = await fetch(`${BASE}/positions?${params}`);
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('PolySharp proxy running');
});
