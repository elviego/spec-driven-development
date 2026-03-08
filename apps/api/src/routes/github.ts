import { Router, Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import db from '../db';
import { requireAuth } from '../middleware/auth';
import type { Spec } from '../types';

const router = Router();

// Connect GitHub account via Personal Access Token
router.post('/connect', requireAuth, async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token?.trim()) {
    res.status(400).json({ error: 'GitHub token is required' });
    return;
  }

  try {
    const octokit = new Octokit({ auth: token });
    const { data: ghUser } = await octokit.users.getAuthenticated();

    db.prepare('UPDATE users SET github_token = ?, github_username = ? WHERE id = ?')
      .run(token.trim(), ghUser.login, req.user!.id);

    res.json({ username: ghUser.login, avatar: ghUser.avatar_url });
  } catch {
    res.status(400).json({ error: 'Invalid GitHub token or insufficient permissions' });
  }
});

// List user's GitHub repositories
router.get('/repos', requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;

  if (!user.github_token) {
    res.status(400).json({ error: 'GitHub account not connected' });
    return;
  }

  try {
    const octokit = new Octokit({ auth: user.github_token });
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
      type: 'all',
    });

    res.json({
      repos: repos.map(r => ({
        full_name: r.full_name,
        name: r.name,
        description: r.description,
        private: r.private,
        default_branch: r.default_branch,
        html_url: r.html_url,
      }))
    });
  } catch {
    res.status(400).json({ error: 'Failed to fetch repositories' });
  }
});

// Link a spec to a GitHub repository
router.post('/link', requireAuth, (req: Request, res: Response) => {
  const { spec_id, repo, branch } = req.body;

  if (!spec_id || !repo) {
    res.status(400).json({ error: 'spec_id and repo are required' });
    return;
  }

  const spec = db.prepare('SELECT * FROM specs WHERE id = ? AND user_id = ?')
    .get(spec_id, req.user!.id) as Spec | undefined;

  if (!spec) {
    res.status(404).json({ error: 'Spec not found' });
    return;
  }

  db.prepare('UPDATE specs SET github_repo = ?, github_branch = ?, updated_at = unixepoch() WHERE id = ?')
    .run(repo, branch || 'main', spec.id);

  res.json({ success: true, repo, branch: branch || 'main' });
});

// Push spec as a file to GitHub
router.post('/push-spec', requireAuth, async (req: Request, res: Response) => {
  const { spec_id } = req.body;
  const user = req.user!;

  if (!user.github_token) {
    res.status(400).json({ error: 'GitHub account not connected' });
    return;
  }

  const spec = db.prepare('SELECT * FROM specs WHERE id = ? AND user_id = ?')
    .get(spec_id, user.id) as Spec | undefined;

  if (!spec || !spec.github_repo) {
    res.status(400).json({ error: 'Spec not found or no GitHub repo linked' });
    return;
  }

  try {
    const octokit = new Octokit({ auth: user.github_token });
    const [owner, repo] = spec.github_repo.split('/');
    const filePath = `specs/${spec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const content = Buffer.from(spec.content).toString('base64');

    // Check if file exists to get SHA for update
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path: filePath, ref: spec.github_branch });
      if (!Array.isArray(data)) sha = data.sha;
    } catch {
      // File doesn't exist yet, that's fine
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `Update spec: ${spec.title}`,
      content,
      branch: spec.github_branch,
      ...(sha ? { sha } : {}),
    });

    res.json({
      success: true,
      url: `https://github.com/${spec.github_repo}/blob/${spec.github_branch}/${filePath}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GitHub push failed';
    res.status(400).json({ error: message });
  }
});

export default router;
