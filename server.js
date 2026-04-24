const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

const DATA_BASE = 'https://data-api.polymarket.com';

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'PolySharp proxy running', time: new Date().toISOString() });
});

// Leaderboard — tries multiple endpoint formats for compatibility
// /leaderboard?window=7d&limit=50  (our frontend calls this)
app.get('/leaderboard', async (req, res) => {
  const { window: win, limit = 50 } = req.query;

  // Map our window param to Polymarket's period param
  const periodMap = { '7d': 'week', '30d': 'month', 'all': 'all', 'week': 'week', 'month': 'month' };
  const period = periodMap[win] || 'week';

  // Try the primary endpoint format
  const urls = [
    `${DATA_BASE}/leaderboard?period=${period}&limit=${limit}&order-by=pnl`,
    `${DATA_BASE}/leaderboard?window=${period}&limit=${limit}`,
    `${DATA_BASE}/leaderboard?timewindow=${win}&limit=${limit}`,
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
      });
      if (resp.ok) {
        const data = await resp.json();
        // Normalize response — API may return array or { leaderboard: [] } or { data: [] }
        const list = Array.isArray(data) ? data : (data.leaderboard || data.data || data.results || []);
        if (list.length > 0) {
          return res.json(list);
        }
      }
    } catch (e) {
      console.error('Leaderboard attempt failed:', url, e.message);
    }
  }

  // All attempts failed — return empty with diagnostic info
  res.status(200).json([]);
});

// Positions — /positions?user=0x...
app.get('/positions', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query).toString();
    const resp = await fetch(`${DATA_BASE}/positions?${params}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    if (resp.ok) {
      const data = await resp.json();
      return res.json(data);
    }
    res.status(resp.status).json({ error: `Upstream returned ${resp.status}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Activity — /activity?user=0x...
app.get('/activity', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query).toString();
    const resp = await fetch(`${DATA_BASE}/activity?${params}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    if (resp.ok) {
      const data = await resp.json();
      return res.json(data);
    }
    res.status(resp.status).json({ error: `Upstream returned ${resp.status}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('PolySharp proxy running on port', process.env.PORT || 3000);
});
