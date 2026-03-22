const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DB_FILE = path.join(__dirname, 'games.json');

function readGames() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function writeGames(games) {
  fs.writeFileSync(DB_FILE, JSON.stringify(games, null, 2));
}

function scoreGuess(guess, actual) {
  if (!guess?.trim()) return 0;
  const g = guess.toLowerCase();
  const a = (actual || '').toLowerCase();
  if (!a) return 500;
  if (g.includes(a) || a.includes(g)) return 5000;
  const aWords = a.split(/\s+/).filter(w => w.length > 3);
  const gWords = g.split(/\s+/);
  const matches = aWords.filter(w => gWords.some(gw => gw.includes(w) || w.includes(gw)));
  if (matches.length >= 2) return 3500;
  if (matches.length === 1) return 2000;
  const cats = ['restaurant','hotel','bar','cafe','coffee','airport','mall','park','beach','gym','lounge','club','building','tower','stadium','museum'];
  const ac = cats.find(c => a.includes(c));
  const gc = cats.find(c => g.includes(c));
  if (ac && gc && ac === gc) return 1500;
  if (ac && gc) return 800;
  return 200;
}

// ── Friend Games ──────────────────────────────────────────
app.post('/api/games', (req, res) => {
  const games = readGames();
  const id = 'g_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
  games[id] = { ...req.body, id, createdAt: Date.now(), status: 'pending' };
  writeGames(games);
  res.json({ id, game: games[id] });
});

app.get('/api/games/:id', (req, res) => {
  const games = readGames();
  const game = games[req.params.id];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const { actualPlace, ...safeGame } = game;
  res.json({ game: safeGame, hasAnswer: !!actualPlace });
});

app.post('/api/games/:id/photo', (req, res) => {
  const games = readGames();
  if (!games[req.params.id]) return res.status(404).json({ error: 'Not found' });
  games[req.params.id].photo = req.body.photo;
  writeGames(games);
  res.json({ ok: true });
});

app.post('/api/games/:id/guess', (req, res) => {
  const games = readGames();
  const game = games[req.params.id];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const { guessText } = req.body;
  games[req.params.id] = { ...game, guessText, status: 'waiting_approval', guessedAt: Date.now() };
  writeGames(games);
  res.json({ ok: true });
});

app.post('/api/games/:id/approve', (req, res) => {
  const games = readGames();
  if (!games[req.params.id]) return res.status(404).json({ error: 'Not found' });
  const score = req.body.approved ? 5000 : 0;
  games[req.params.id] = { ...games[req.params.id], approvedByCreator: req.body.approved, score, status: 'done' };
  writeGames(games);
  res.json({ ok: true });
});

// ── Daily Challenge ───────────────────────────────────────
const DAILY = [
  {
    "id": "day_001",
    "photo": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
    "hint": "The Crossroads of the World",
    "riddle": "A million people watch a ball drop here every New Year's Eve. Neon signs everywhere. Where am I?",
    "answer": "Times Square, New York City",
    "difficulty": "easy"
  },
  {
    "id": "day_002",
    "photo": "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80",
    "hint": "Built for love",
    "riddle": "A king built me from white marble for his wife. Millions visit me in India every year. Where am I?",
    "answer": "Taj Mahal, Agra, India",
    "difficulty": "easy"
  },
  {
    "id": "day_003",
    "photo": "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&q=80",
    "hint": "Iron Lady of Europe",
    "riddle": "Parisians hated me when I was built. Now I'm their most famous landmark. Where am I?",
    "answer": "Eiffel Tower, Paris, France",
    "difficulty": "easy"
  },
  {
    "id": "day_004",
    "photo": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
    "hint": "Are you not entertained?",
    "riddle": "Gladiators fought here 2,000 years ago. 80,000 screaming fans. Italy. Where am I?",
    "answer": "The Colosseum, Rome, Italy",
    "difficulty": "easy"
  },
  {
    "id": "day_005",
    "photo": "https://images.unsplash.com/photo-1489447068241-b3490214e879?w=800&q=80",
    "hint": "Two countries, one roar",
    "riddle": "I straddle the US and Canada. 3,000 tons of water rush over me every second. Where am I?",
    "answer": "Niagara Falls",
    "difficulty": "easy"
  },
  {
    "id": "day_006",
    "photo": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80",
    "hint": "Sails on a harbour",
    "riddle": "My roof looks like sails or shells. I sit on a sparkling harbour in Australia. Where am I?",
    "answer": "Sydney Opera House, Australia",
    "difficulty": "easy"
  },
  {
    "id": "day_007",
    "photo": "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
    "hint": "Nature's masterpiece",
    "riddle": "A mile deep, 277 miles long. The Colorado River carved me over millions of years. Where am I?",
    "answer": "Grand Canyon, Arizona",
    "difficulty": "easy"
  },
  {
    "id": "day_008",
    "photo": "https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=800&q=80",
    "hint": "King Kong climbed me",
    "riddle": "I was the world's tallest building for 40 years. I light up NYC every night. Where am I?",
    "answer": "Empire State Building, New York City",
    "difficulty": "easy"
  },
  {
    "id": "day_009",
    "photo": "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800&q=80",
    "hint": "Red buses, Big Ben nearby",
    "riddle": "A famous bridge in London. Opens in the middle to let tall ships through. Where am I?",
    "answer": "Tower Bridge, London",
    "difficulty": "medium"
  },
  {
    "id": "day_010",
    "photo": "https://images.unsplash.com/photo-1543716091-a840c05249ec?w=800&q=80",
    "hint": "Frozen in time",
    "riddle": "A city buried by a volcanic eruption in 79 AD. Near Naples, Italy. Where am I?",
    "answer": "Pompeii, Italy",
    "difficulty": "medium"
  },
  {
    "id": "day_011",
    "photo": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80",
    "hint": "Blue and white everywhere",
    "riddle": "Famous for blue-domed churches on a cliff overlooking the Aegean Sea. Greece. Where am I?",
    "answer": "Santorini, Greece",
    "difficulty": "medium"
  },
  {
    "id": "day_012",
    "photo": "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80",
    "hint": "The floating city",
    "riddle": "A city built on water. No cars, only canals and gondolas. Northern Italy. Where am I?",
    "answer": "Venice, Italy",
    "difficulty": "easy"
  },
  {
    "id": "day_013",
    "photo": "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
    "hint": "Desert skyline",
    "riddle": "The world's tallest building rises from the desert. This city rose from sand in 30 years. Where am I?",
    "answer": "Dubai, UAE",
    "difficulty": "easy"
  },
  {
    "id": "day_014",
    "photo": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    "hint": "Temples and rice fields",
    "riddle": "The Island of the Gods. Famous for rice terraces, temples, and surf. Indonesia. Where am I?",
    "answer": "Bali, Indonesia",
    "difficulty": "medium"
  }
];

app.get('/api/daily', (req, res) => {
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const challenge = DAILY[daysSinceEpoch % DAILY.length];
  const { answer, ...safe } = challenge;
  res.json({ challenge: safe, date: new Date().toISOString().split('T')[0] });
});

app.post('/api/daily/guess', (req, res) => {
  const { challengeId, guessText } = req.body;
  const challenge = DAILY.find(c => c.id === challengeId);
  if (!challenge) return res.status(404).json({ error: 'Not found' });
  const score = scoreGuess(guessText, challenge.answer);
  res.json({ answer: challenge.answer, guessText, score });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log('PinDrop backend on port ' + PORT));

// Keep-alive endpoint
app.get('/ping', (req, res) => res.json({ ok: true, time: Date.now() }));
