import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { randomUUID } from 'crypto';
import db from '../db';
import { generateToken, requireAuth } from '../middleware/auth';
import type { User } from '../types';

const router = Router();

// Configure Google OAuth strategy
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
  },
  (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email from Google profile'));
      }

      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id) as User | undefined;

      if (!user) {
        const id = randomUUID();
        db.prepare(`
          INSERT INTO users (id, google_id, email, name, avatar)
          VALUES (?, ?, ?, ?, ?)
        `).run(id, profile.id, email, profile.displayName, profile.photos?.[0]?.value || null);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User;
      } else {
        // Update name and avatar
        db.prepare('UPDATE users SET name = ?, avatar = ? WHERE id = ?')
          .run(profile.displayName, profile.photos?.[0]?.value || null, user.id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as User;
      }

      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  }
));

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req: Request, res: Response) => {
    const user = req.user as User;
    const token = generateToken(user.id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
);

// Get current user
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    github_username: user.github_username,
  });
});

// Disconnect GitHub
router.delete('/github', requireAuth, (req: Request, res: Response) => {
  db.prepare('UPDATE users SET github_token = NULL, github_username = NULL WHERE id = ?')
    .run(req.user!.id);
  res.json({ success: true });
});

export default router;
