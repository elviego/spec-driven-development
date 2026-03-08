import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import specsRoutes from './routes/specs';
import aiRoutes from './routes/ai';
import githubRoutes from './routes/github';
import wikiRoutes from './routes/wiki';

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet({ crossOriginEmbedderPolicy: false }));

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
}));

// Rate limiting
app.use('/api/ai', rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'Too many AI requests' } }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 200, message: { error: 'Too many requests' } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Passport (no sessions — using JWT)
app.use(passport.initialize());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Routes
app.use('/auth', authRoutes);
app.use('/api/specs', specsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/wiki', wikiRoutes);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 SDD API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
