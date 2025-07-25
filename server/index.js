const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory data
const threads = [
  // Example: { id: 1, user: 'Budi', language: 'Javanese', text: 'Halo!', replies: [] }
];
const contributions = [
  // Example: { id: 1, user: 'Siti', language: 'Sundanese', text: 'Wilujeng enjing', translation: 'Selamat pagi', upvotes: 0 }
];
const leaderboard = [];

function addPoints(user, points) {
  points = Number(points);
  let entry = leaderboard.find(l => l.user === user);
  if (entry) {
    entry.points += points;
  } else {
    leaderboard.push({ user, points });
  }
  console.log('addPoints called:', user, points, leaderboard);
}

const HF_MODELS = {
  mbart: 'facebook/mbart-large-50-many-to-many-mmt',
  nllb: 'facebook/nllb-200-distilled-600M'
};

app.get('/', (req, res) => {
  res.send('Ngerti.ai backend is running!');
});

// Mock translation endpoint
app.post('/api/translate', async (req, res) => {
  const { text, source_lang, target_lang, model } = req.body;
  const modelId = HF_MODELS[model] || HF_MODELS.mbart; // default to mbart
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            src_lang: source_lang,
            tgt_lang: target_lang
          }
        })
      }
    );
    const data = await response.json();
    // MBART returns translation_text, NLLB returns generated_text
    const translation = data[0]?.translation_text || data[0]?.generated_text || 'No translation';
    res.json({ translation });
  } catch (err) {
    res.status(500).json({ error: 'Translation failed', details: err.message });
  }
});

// Threads endpoints
app.get('/api/threads', (req, res) => {
  res.json(threads);
});
app.post('/api/threads', (req, res) => {
  const { user, language, text } = req.body;
  const newThread = { id: threads.length + 1, user, language, text, replies: [], upvotes: 0, downvotes: 0 };
  threads.push(newThread);
  addPoints(user, 5); // HARUS angka 5, bukan '5' atau 0
  res.json(newThread);
});
app.post('/api/threads/:id/reply', (req, res) => {
  const { id } = req.params;
  const { user, text } = req.body;
  const thread = threads.find(t => t.id == id);
  if (thread) {
    thread.replies.push({ user, text });
    res.json(thread);
  } else {
    res.status(404).json({ error: 'Thread not found' });
  }
});

// Upvote a thread
app.post('/api/threads/:id/upvote', (req, res) => {
  const { id } = req.params;
  const thread = threads.find(t => t.id == id);
  if (thread) {
    thread.upvotes = (thread.upvotes || 0) + 1;
    res.json(thread);
  } else {
    res.status(404).json({ error: 'Thread not found' });
  }
});

// Downvote a thread
app.post('/api/threads/:id/downvote', (req, res) => {
  const { id } = req.params;
  const thread = threads.find(t => t.id == id);
  if (thread) {
    thread.downvotes = (thread.downvotes || 0) + 1;
    res.json(thread);
  } else {
    res.status(404).json({ error: 'Thread not found' });
  }
});

// Contributions endpoints
app.get('/api/contributions', (req, res) => {
  res.json(contributions);
});
app.post('/api/contributions', (req, res) => {
  const { user, language, text, translation } = req.body;
  const newContribution = { id: contributions.length + 1, user, language, text, translation, upvotes: 0 };
  contributions.push(newContribution);
  addPoints(user, 3); // HARUS angka 3
  res.json(newContribution);
});
app.post('/api/contributions/:id/upvote', (req, res) => {
  const { id } = req.params;
  const contribution = contributions.find(c => c.id == id);
  if (contribution) {
    contribution.upvotes++;
    if (contribution.upvotes >= 3) { // Mark as verified after 3 upvotes
      contribution.verified = true;
    }
    res.json(contribution);
  } else {
    res.status(404).json({ error: 'Contribution not found' });
  }
});

// Endpoint to get all verified contributions for LLM training
app.get('/api/training-data', (req, res) => {
  const verified = contributions.filter(c => c.verified);
  res.json(verified);
});

// Leaderboard endpoint
app.get('/api/leaderboard', (req, res) => {
  const sorted = leaderboard.slice().sort((a, b) => b.points - a.points);
  res.json(sorted);
});

// Reset all data
app.post('/api/reset', (req, res) => {
  threads.length = 0;
  contributions.length = 0;
  leaderboard.length = 0;
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

