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
  { id: 'day_001', photo: 'https://live.staticflickr.com/65535/53344058440_1b0c8d43d9_b.jpg', hint: 'The Crossroads of the World', riddle: "A million people watch a ball drop here every New Year's Eve. Where am I?", answer: 'Times Square, New York City', difficulty: 'easy' },
  { id: 'day_002', photo: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Taj_Mahal_Sunset.jpg', hint: 'Built for love', riddle: 'A king built me from white marble for his wife. Millions visit me in India. Where am I?', answer: 'Taj Mahal, Agra, India', difficulty: 'medium' },
  { id: 'day_003', photo: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Smiley.svg', hint: 'Iron Lady', riddle: "Parisians hated me when I was built. Now I'm their most famous landmark. Where am I?", answer: 'Eiffel Tower, Paris, France', difficulty: 'easy' },
  { id: 'day_004', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/1024px-Colosseo_2020.jpg', hint: 'Are you not entertained?', riddle: 'Gladiators fought here 2,000 years ago in front of 80,000 fans. Where am I?', answer: 'The Colosseum, Rome, Italy', difficulty: 'easy' },
  { id: 'day_005', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Wrigley_field_from_the_bleachers.jpg/1024px-Wrigley_field_from_the_bleachers.jpg', hint: 'The Friendly Confines', riddle: 'Ivy on the outfield walls. Chicago Cubs baseball. No lights until 1988. Where am I?', answer: 'Wrigley Field, Chicago', difficulty: 'medium' },
  { id: 'day_006', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Niagara_falls_from_the_canadian_side.jpg/1024px-Niagara_falls_from_the_canadian_side.jpg', hint: 'Powerful and loud', riddle: 'Straddles two countries. 3,000 tons of water rush over me every second. Where am I?', answer: 'Niagara Falls', difficulty: 'easy' },
  { id: 'day_007', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sydney_Australia._(21339175489).jpg/1024px-Sydney_Australia._(21339175489).jpg', hint: 'Down Under icon', riddle: 'My roof looks like sails. I sit on a harbour in Australia. Where am I?', answer: 'Sydney Opera House, Australia', difficulty: 'easy' },
  { id: 'day_008', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Grand_Canyon_view_from_Pima_Point_2010.jpg/1024px-Grand_Canyon_view_from_Pima_Point_2010.jpg', hint: 'Nature carved me', riddle: 'A mile deep, 277 miles long. The Colorado River made me. Where am I?', answer: 'Grand Canyon, Arizona', difficulty: 'easy' },
  { id: 'day_009', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/800px-Empire_State_Building_%28aerial_view%29.jpg', hint: 'King Kong climbed me', riddle: 'I was the tallest building in the world for 40 years. NYC icon. Where am I?', answer: 'Empire State Building, New York City', difficulty: 'easy' },
  { id: 'day_010', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/New_york_times_square-terabass.jpg/800px-New_york_times_square-terabass.jpg', hint: 'Neon never sleeps', riddle: 'Bright lights, Broadway shows, and yellow cabs. The city that never sleeps. Where am I?', answer: 'Times Square, New York City', difficulty: 'easy' },
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
