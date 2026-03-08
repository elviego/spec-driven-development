import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import db from '../db';
import { requireAuth, optionalAuth } from '../middleware/auth';
import type { Spec, SpecShare } from '../types';

const router = Router();

// List all specs for authenticated user (own + shared)
router.get('/', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;

  const ownSpecs = db.prepare(`
    SELECT s.*, u.name as owner_name, u.avatar as owner_avatar, NULL as share_can_edit
    FROM specs s
    JOIN users u ON s.user_id = u.id
    WHERE s.user_id = ?
    ORDER BY s.updated_at DESC
  `).all(userId);

  const sharedSpecs = db.prepare(`
    SELECT s.*, u.name as owner_name, u.avatar as owner_avatar, ss.can_edit as share_can_edit
    FROM specs s
    JOIN users u ON s.user_id = u.id
    JOIN spec_shares ss ON ss.spec_id = s.id
    WHERE ss.shared_with_email = ?
    ORDER BY s.updated_at DESC
  `).all(req.user!.email);

  res.json({ specs: [...ownSpecs, ...sharedSpecs] });
});

// Get a single spec by id
router.get('/:id', optionalAuth, (req: Request, res: Response) => {
  const spec = db.prepare(`
    SELECT s.*, u.name as owner_name, u.avatar as owner_avatar
    FROM specs s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(req.params.id) as (Spec & { owner_name: string; owner_avatar: string | null }) | undefined;

  if (!spec) {
    res.status(404).json({ error: 'Spec not found' });
    return;
  }

  const userId = req.user?.id;

  // Check access
  if (spec.visibility === 'public') {
    // Public: anyone can read
  } else if (userId && spec.user_id === userId) {
    // Owner
  } else if (userId) {
    const share = db.prepare(`
      SELECT * FROM spec_shares WHERE spec_id = ? AND shared_with_email = ?
    `).get(spec.id, req.user!.email) as SpecShare | undefined;
    if (!share) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
  } else {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const shares = db.prepare('SELECT * FROM spec_shares WHERE spec_id = ?').all(spec.id);
  res.json({ spec, shares });
});

// Get spec by public token
router.get('/public/:token', (req: Request, res: Response) => {
  const spec = db.prepare(`
    SELECT s.*, u.name as owner_name, u.avatar as owner_avatar
    FROM specs s
    JOIN users u ON s.user_id = u.id
    WHERE s.public_token = ? AND s.visibility = 'public'
  `).get(req.params.token) as (Spec & { owner_name: string }) | undefined;

  if (!spec) {
    res.status(404).json({ error: 'Spec not found or not public' });
    return;
  }

  res.json({ spec });
});

// Create a new spec
router.post('/', requireAuth, (req: Request, res: Response) => {
  const { title, description, content, visibility, phase } = req.body;

  if (!title?.trim()) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const id = randomUUID();
  const publicToken = visibility === 'public' ? randomUUID() : null;

  db.prepare(`
    INSERT INTO specs (id, user_id, title, description, content, phase, visibility, public_token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.user!.id,
    title.trim(),
    description?.trim() || null,
    content || '',
    phase || 'research',
    visibility || 'private',
    publicToken
  );

  const spec = db.prepare('SELECT * FROM specs WHERE id = ?').get(id) as Spec;
  res.status(201).json({ spec });
});

// Update a spec
router.put('/:id', requireAuth, (req: Request, res: Response) => {
  const spec = db.prepare('SELECT * FROM specs WHERE id = ?').get(req.params.id) as Spec | undefined;

  if (!spec) {
    res.status(404).json({ error: 'Spec not found' });
    return;
  }

  // Check write permission
  if (spec.user_id !== req.user!.id) {
    const share = db.prepare(`
      SELECT * FROM spec_shares WHERE spec_id = ? AND shared_with_email = ? AND can_edit = 1
    `).get(spec.id, req.user!.email) as SpecShare | undefined;

    if (!share) {
      res.status(403).json({ error: 'Write access denied' });
      return;
    }
  }

  const { title, description, content, phase, visibility, github_repo, github_branch } = req.body;

  // Handle public_token: generate if becoming public, clear if becoming non-public
  let publicToken = spec.public_token;
  if (visibility === 'public' && !spec.public_token) {
    publicToken = randomUUID();
  } else if (visibility && visibility !== 'public') {
    publicToken = null;
  }

  db.prepare(`
    UPDATE specs
    SET title = ?, description = ?, content = ?, phase = ?, visibility = ?,
        github_repo = ?, github_branch = ?, public_token = ?, updated_at = unixepoch()
    WHERE id = ?
  `).run(
    title ?? spec.title,
    description !== undefined ? description : spec.description,
    content !== undefined ? content : spec.content,
    phase ?? spec.phase,
    visibility ?? spec.visibility,
    github_repo !== undefined ? github_repo : spec.github_repo,
    github_branch ?? spec.github_branch,
    publicToken,
    spec.id
  );

  const updated = db.prepare('SELECT * FROM specs WHERE id = ?').get(spec.id) as Spec;
  res.json({ spec: updated });
});

// Delete a spec
router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const spec = db.prepare('SELECT * FROM specs WHERE id = ?').get(req.params.id) as Spec | undefined;

  if (!spec) {
    res.status(404).json({ error: 'Spec not found' });
    return;
  }

  if (spec.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Only the owner can delete a spec' });
    return;
  }

  db.prepare('DELETE FROM specs WHERE id = ?').run(spec.id);
  res.json({ success: true });
});

// Share a spec with a user by email
router.post('/:id/shares', requireAuth, (req: Request, res: Response) => {
  const spec = db.prepare('SELECT * FROM specs WHERE id = ?').get(req.params.id) as Spec | undefined;

  if (!spec || spec.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const { email, can_edit } = req.body;
  if (!email?.trim()) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  if (email === req.user!.email) {
    res.status(400).json({ error: 'Cannot share with yourself' });
    return;
  }

  const id = randomUUID();
  db.prepare(`
    INSERT OR REPLACE INTO spec_shares (id, spec_id, shared_with_email, can_edit)
    VALUES (?, ?, ?, ?)
  `).run(id, spec.id, email.trim(), can_edit ? 1 : 0);

  // Update visibility to 'shared' if currently private
  if (spec.visibility === 'private') {
    db.prepare('UPDATE specs SET visibility = ?, updated_at = unixepoch() WHERE id = ?')
      .run('shared', spec.id);
  }

  const shares = db.prepare('SELECT * FROM spec_shares WHERE spec_id = ?').all(spec.id);
  res.json({ shares });
});

// Remove a share
router.delete('/:id/shares/:email', requireAuth, (req: Request, res: Response) => {
  const spec = db.prepare('SELECT * FROM specs WHERE id = ?').get(req.params.id) as Spec | undefined;

  if (!spec || spec.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const emailParam = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
  db.prepare('DELETE FROM spec_shares WHERE spec_id = ? AND shared_with_email = ?')
    .run(spec.id, decodeURIComponent(emailParam));

  const shares = db.prepare('SELECT * FROM spec_shares WHERE spec_id = ?').all(spec.id) as SpecShare[];
  if (shares.length === 0 && spec.visibility === 'shared') {
    db.prepare('UPDATE specs SET visibility = ?, updated_at = unixepoch() WHERE id = ?')
      .run('private', spec.id);
  }

  res.json({ success: true, shares });
});

export default router;
