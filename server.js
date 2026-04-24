const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

const BASE = 'https://data-api.polymarket.com/v1';

// Health check — visit your Railway URL to confirm it's alive
app.get('/', (req, res) => {
  res.json({ status: 'PolySharp proxy running', time: new Date().toISOString() });
});

// Leaderboard
// Called with: /leaderboard?window=7d&limit=50
// Polymarket v1 API uses timePeriod=WEEK / MONTH / ALL
app.get('/leaderboard', async (req, res) => {
  const { window: win, limit = 50 } = req.query;

  const periodMap = {
    '7d':    'WEEK',
    'week':  'WEEK',
    '30d':   'MONTH',
    'month': 'MONTH',
    'all':   'ALL',
  };
  const timePeriod = periodMap[win] || 'WEEK';

  try {
    const url = `${BASE}/leaderboard?timePeriod=${timePeriod}&limit=${limit}`;
    console.log('Fetching leaderboard:', url);
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await resp.json();
    const list = Array.isArray(data) ? data : (data.leaderboard || data.data || []);
    res.json(list);
  } catch (e) {
    console.error('Leaderboard error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Positions
// Called with: /positions?user=0x...&sizeThreshold=1&limit=20
app.get('/positions', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query).toString();
    const url = `https://data-api.polymarket.com/positions?${params}`;
    console.log('Fetching positions:', url);
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    console.error('Positions error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Activity
app.get('/activity', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query).toString();
    const resp = await fetch(`https://data-api.polymarket.com/activity?${params}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('PolySharp proxy running on port', process.env.PORT || 3000);
});
