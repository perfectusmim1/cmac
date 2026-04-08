import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());

// ─── In-memory cache ───
const sofaCache = new Map();

// Helper: fetch JSON from Sofascore API via axios (no Puppeteer needed)
const fetchSofascoreJson = async (apiPath) => {
  const url = `https://api.sofascore.com/api/v1/${apiPath}`;
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.sofascore.com/',
      'Origin': 'https://www.sofascore.com',
      'Cache-Control': 'no-cache'
    },
    timeout: 10000
  });
  return data;
};

// ─── Sofascore: Search event by name ───
app.get('/api/sofascore/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query required' });

  const cleanQuery = query.replace(/\s*HD\d*$/i, '').trim();
  
  if (sofaCache.has(cleanQuery)) {
    return res.json(sofaCache.get(cleanQuery));
  }

  try {
    const data = await fetchSofascoreJson(`search/events?q=${encodeURIComponent(cleanQuery)}&page=0`);
    if (data.results && data.results.length > 0) {
      const event = data.results[0].entity;
      const result = {
        id: event.id,
        slug: event.slug,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        homeScore: event.homeScore,
        awayScore: event.awayScore,
        status: event.status,
        startTimestamp: event.startTimestamp,
        tournament: event.tournament
      };
      sofaCache.set(cleanQuery, result);
      return res.json(result);
    }
    sofaCache.set(cleanQuery, { id: null });
    return res.json({ id: null });
  } catch (err) {
    console.error('Sofascore search error:', err.message);
    return res.status(500).json({ error: 'Sofascore search failed' });
  }
});

// ─── Sofascore: Event details ───
app.get('/api/sofascore/event/:id', async (req, res) => {
  try {
    const data = await fetchSofascoreJson(`event/${req.params.id}`);
    res.json(data);
  } catch (err) {
    console.error('Sofascore event error:', err.message);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// ─── Sofascore: Statistics ───
app.get('/api/sofascore/event/:id/statistics', async (req, res) => {
  try {
    const data = await fetchSofascoreJson(`event/${req.params.id}/statistics`);
    res.json(data);
  } catch (err) {
    console.error('Sofascore stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ─── Sofascore: Graph (Attack Momentum) ───
app.get('/api/sofascore/event/:id/graph', async (req, res) => {
  try {
    const data = await fetchSofascoreJson(`event/${req.params.id}/graph`);
    res.json(data);
  } catch (err) {
    console.error('Sofascore graph error:', err.message);
    res.status(500).json({ error: 'Failed to fetch graph' });
  }
});

// ─── Sofascore: Lineups ───
app.get('/api/sofascore/event/:id/lineups', async (req, res) => {
  try {
    const data = await fetchSofascoreJson(`event/${req.params.id}/lineups`);
    res.json(data);
  } catch (err) {
    console.error('Sofascore lineups error:', err.message);
    res.status(500).json({ error: 'Failed to fetch lineups' });
  }
});

// ─── Sofascore: Standings ───
app.get('/api/sofascore/event/:id/standings', async (req, res) => {
  try {
    const eventData = await fetchSofascoreJson(`event/${req.params.id}`);
    const tournamentId = eventData.event?.tournament?.uniqueTournament?.id;
    const seasonId = eventData.event?.season?.id;
    if (!tournamentId || !seasonId) {
      return res.json({ error: 'No standings available' });
    }
    const data = await fetchSofascoreJson(`unique-tournament/${tournamentId}/season/${seasonId}/standings/total`);
    res.json(data);
  } catch (err) {
    console.error('Sofascore standings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

// ─── Player Proxy (inject CSS to hide native controls/ads) ───
app.get('/api/player/proxy', async (req, res) => {
  const targetUrl = req.query.targetUrl;
  if (!targetUrl) return res.status(400).send('targetUrl required');

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.selcuksportshd0d664c64c3.xyz/'
      }
    });
    let html = response.data;

    const urlObj = new URL(targetUrl);
    const baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
    html = html.replace('<head>', `<head><base href="${baseUrl}">`);

    const injectedCode = `
      <style>
        .media-control[data-media-control],
        .clappr-watermark,
        [data-free-banner],
        [data-text-overlay],
        [data-overlay-banner],
        [data-advertisement],
        [data-advertisement-link],
        [data-overlay-close] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        body, html { background: #000 !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
        video { object-fit: contain !important; cursor: default !important; }
        #player-container { cursor: default !important; }
      </style>
      <script>
        window.addEventListener('message', function(event) {
          var action = event.data && event.data.action;
          var video = document.querySelector('video');
          if (!video) return;
          if (action === 'play') video.play();
          if (action === 'pause') video.pause();
          if (action === 'mute') video.muted = true;
          if (action === 'unmute') video.muted = false;
          if (action === 'getState') {
            window.parent.postMessage({
              type: 'playerState',
              playing: !video.paused,
              muted: video.muted,
              volume: video.volume
            }, '*');
          }
        });
        setInterval(function() {
          document.querySelectorAll('[data-free-close], [data-overlay-close], [data-text-close]').forEach(function(el) { el.click(); });
          document.querySelectorAll('[data-free-banner], [data-text-overlay], [data-overlay-banner], [data-advertisement], [data-advertisement-link]').forEach(function(el) { el.remove(); });
        }, 1000);
      </script>
    `;
    html = html.replace('</head>', `${injectedCode}</head>`);

    res.send(html);
  } catch (e) {
    console.error('Proxy error:', e.message);
    res.status(500).send('Error loading player');
  }
});

// ─── Match Scraping ───
app.get('/api/matches', async (req, res) => {
  try {
    const targetUrl = 'https://www.selcuksportshd0d664c64c3.xyz/';
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.google.com/'
      }
    });

    const html = response.data;
    const matches = [];

    const tab1Start = html.indexOf('id="tab1"');
    if (tab1Start === -1) return res.json([]);

    const tab2Start = html.indexOf('id="tab2"');
    const tab1Html = html.substring(tab1Start, tab2Start !== -1 ? tab2Start : html.length);

    const matchRegex = /<a[^>]+data-url="([^"]+)"[^>]*>[\s\S]*?<div[^>]*class="name"[^>]*>([^<]+)<\/div>[\s\S]*?<time[^>]*>([^<]+)<\/time>/g;
    let match;

    while ((match = matchRegex.exec(tab1Html)) !== null) {
      matches.push({
        url: match[1],
        name: match[2].trim(),
        time: match[3].trim()
      });
    }

    let baseStreamUrl = '';
    if (matches.length > 0) {
      try {
        const firstUrl = matches[0].url.startsWith('/') ? 'https://main.uxsyplayer0e0c6aba22.click' + matches[0].url : matches[0].url;
        const playerRes = await axios.get(firstUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.selcuksportshd0d664c64c3.xyz/' }
        });
        const streamMatch = playerRes.data.match(/this\.baseStreamUrl\s*=\s*'([^']+)'/);
        if (streamMatch) baseStreamUrl = streamMatch[1];
      } catch (e) {
        console.error('Stream URL extraction failed:', e.message);
      }
    }

    const processedMatches = matches.map(m => {
      let directUrl = '';
      const idMatch = m.url.match(/[?&]id=([^&#]+)/);
      if (idMatch && baseStreamUrl) {
        directUrl = `${baseStreamUrl}${idMatch[1]}/playlist.m3u8`;
      }
      const slug = m.name
        .toLowerCase()
        .replace(/\s*hd\d*$/i, '')
        .replace(/[^a-z0-9öüçğışÖÜÇĞİŞ\s-]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      return { ...m, directUrl, slug };
    });

    res.json(processedMatches);
  } catch (error) {
    console.error('Scraping error:', error.message);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Start local server if not on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless
export default app;
