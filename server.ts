import express from 'express';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // UPDATED: Cross-platform check endpoint
  app.get('/api/crosscheck/:username', async (req, res) => {
    const { username } = req.params;
    const platforms = {
      github: `https://api.github.com/users/${username}`,
      reddit: `https://www.reddit.com/user/${username}/about.json`,
      twitter: `https://nitter.net/${username}`, // Using nitter as a free alternative to twitter
      instagram: `https://www.instagram.com/${username}/`,
    };

    const results: Record<string, boolean> = {};

    const checkPlatform = async (name: string, url: string) => {
      try {
        const response = await axios.get(url, { 
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        results[name] = response.status === 200;
      } catch (err) {
        results[name] = false;
      }
    };

    await Promise.all(Object.entries(platforms).map(([name, url]) => checkPlatform(name, url)));

    res.json(results);
  });

  // NEW: Signal analysis endpoint
  app.get('/api/analyze/:platform/:username', async (req, res) => {
    const { platform, username } = req.params;
    
    // In a real scenario, we would use a scraper here.
    // For this implementation, we'll return some mock data that would be "scraped"
    // to demonstrate the rule-based logic on the frontend.
    // In a real app, you'd use something like puppeteer or a specialized scraping service.
    
    // Mocking "scraped" data
    const mockData = {
      createdAt: new Date(Date.now() - Math.random() * 1000 * 86400000 * 365).toISOString(),
      postCount: Math.floor(Math.random() * 100),
      followers: Math.floor(Math.random() * 1000),
      following: Math.floor(Math.random() * 1000),
      bio: "Crypto enthusiast. DM me for investment opportunities! Click link for free money.",
      avatar: Math.random() > 0.2 ? "https://picsum.photos/200" : null,
      displayName: username.toUpperCase(),
      likes: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 10),
      posts: Array.from({ length: 10 }, (_, i) => ({
        timestamp: Date.now() - i * 360000, // 10 posts in 1 hour
        content: "Check out this new investment!"
      }))
    };

    res.json(mockData);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
