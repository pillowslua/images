const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Basic rate limiting for API routes (500 requests/hour)
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Proxy to Groq Chat Completions
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing GROQ_API_KEY in server environment' });
    }

    const { model, messages, max_tokens, temperature, top_p, stream } = req.body || {};

    if (!model || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: model and messages are required' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: typeof max_tokens === 'number' ? max_tokens : 1024,
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        top_p: typeof top_p === 'number' ? top_p : 0.95,
        stream: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid API key for Groq' });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded at Groq' });
      }
      if (response.status === 402) {
        return res.status(402).json({ error: 'Quota exceeded at Groq' });
      }
      return res.status(response.status).json({ error: `Groq error ${response.status}: ${text}` });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files
app.use(express.static('public'));

// Fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(require('path').join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`TwiskGPT Pro server listening on http://localhost:${PORT}`);
});