import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';
import db from '../db';
import { requireAuth } from '../middleware/auth';
import type { Spec, GenerationJob } from '../types';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// AI-assisted spec improvement for a specific phase
router.post('/assist', requireAuth, async (req: Request, res: Response) => {
  const { spec_id, phase, prompt } = req.body;

  if (!spec_id || !phase) {
    res.status(400).json({ error: 'spec_id and phase are required' });
    return;
  }

  const spec = db.prepare('SELECT * FROM specs WHERE id = ? AND user_id = ?')
    .get(spec_id, req.user!.id) as Spec | undefined;

  if (!spec) {
    res.status(404).json({ error: 'Spec not found' });
    return;
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const phaseGuides: Record<string, string> = {
    research: 'The user is in the Research phase. Help them understand the domain, identify constraints, and list what they need to learn before building.',
    plan: 'The user is in the Plan phase. Help them break the project into sub-projects, define phases, identify dependencies, and estimate scope.',
    draft: 'The user is in the Draft Spec phase. Help them write a comprehensive specification covering goals, requirements, architecture, API design, data models, and edge cases.',
    review: 'The user is in the Review Spec phase. Act as a critical reviewer. Identify gaps, ambiguities, missing error cases, scalability concerns, and security issues.',
    implement: 'The user is in the Implement & Feedback phase. Help them refine the spec based on implementation learnings and suggest updates to reflect reality.',
  };

  const systemPrompt = `You are an expert software architect and technical writer specializing in the Spec-Driven Development (SDD) methodology.

${phaseGuides[phase] || 'Help the user with their specification.'}

Current spec title: ${spec.title}
Current spec content:
${spec.content || '(empty - help them get started)'}

Guidelines:
- Be specific and actionable
- Use markdown formatting
- Reference concrete technical details
- Keep suggestions scoped to the current phase
- If the user has started writing, build on their work`;

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      // @ts-expect-error thinking is supported in claude-opus-4-6 but not yet in all SDK type defs
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt || `Help me with the ${phase} phase of my spec.` }],
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
    });

    await stream.finalMessage();
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
    res.end();
  }
});

// Generate code from a complete spec
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  const { spec_id, output_dir, tech_preferences } = req.body;

  if (!spec_id || !output_dir) {
    res.status(400).json({ error: 'spec_id and output_dir are required' });
    return;
  }

  const spec = db.prepare('SELECT * FROM specs WHERE id = ? AND user_id = ?')
    .get(spec_id, req.user!.id) as Spec | undefined;

  if (!spec) {
    res.status(404).json({ error: 'Spec not found' });
    return;
  }

  if (!spec.content?.trim()) {
    res.status(400).json({ error: 'Spec has no content to generate from' });
    return;
  }

  // Create generation job
  const jobId = randomUUID();
  db.prepare(`
    INSERT INTO generation_jobs (id, spec_id, user_id, status, output_dir)
    VALUES (?, ?, ?, 'running', ?)
  `).run(jobId, spec.id, req.user!.id, output_dir);

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'job_started', job_id: jobId })}\n\n`);

  const systemPrompt = `You are an expert software engineer. You will receive a detailed project specification and must generate a complete, production-ready codebase.

Tech preferences: ${tech_preferences || 'Use modern best practices for the most appropriate tech stack based on the spec.'}

Output directory: ${output_dir}

Instructions:
1. Analyze the spec thoroughly
2. Plan the file structure
3. Generate each file with complete, working code
4. Include a README.md with setup instructions
5. Include package.json / requirements.txt / etc. as appropriate
6. Add appropriate configuration files (.env.example, tsconfig.json, etc.)
7. Write clean, well-commented code
8. Include basic tests where appropriate

For each file you create, output it in this exact format:
<file path="relative/path/to/file">
[complete file contents]
</file>

Start with the project structure overview, then generate each file.`;

  try {
    let buffer = '';
    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 32768,
      // @ts-expect-error thinking is supported in claude-opus-4-6 but not yet in all SDK type defs
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate a complete codebase from this specification:\n\n${spec.content}`
      }],
    });

    stream.on('text', (text) => {
      buffer += text;
      res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);

      // Parse and emit file events when we detect complete <file> blocks
      const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
      let match;
      while ((match = fileRegex.exec(buffer)) !== null) {
        res.write(`data: ${JSON.stringify({ type: 'file', path: match[1], size: match[2].length })}\n\n`);
      }
    });

    await stream.finalMessage();

    // Update job status
    db.prepare('UPDATE generation_jobs SET status = ?, updated_at = unixepoch() WHERE id = ?')
      .run('completed', jobId);

    res.write(`data: ${JSON.stringify({ type: 'done', job_id: jobId })}\n\n`);
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    db.prepare('UPDATE generation_jobs SET status = ?, error = ?, updated_at = unixepoch() WHERE id = ?')
      .run('failed', message, jobId);
    res.write(`data: ${JSON.stringify({ type: 'error', message, job_id: jobId })}\n\n`);
    res.end();
  }
});

// Get generation job status
router.get('/jobs/:id', requireAuth, (req: Request, res: Response) => {
  const job = db.prepare('SELECT * FROM generation_jobs WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user!.id) as GenerationJob | undefined;

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json({ job });
});

// List generation jobs for a spec
router.get('/jobs', requireAuth, (req: Request, res: Response) => {
  const { spec_id } = req.query;
  const jobs = db.prepare(`
    SELECT * FROM generation_jobs
    WHERE user_id = ? ${spec_id ? 'AND spec_id = ?' : ''}
    ORDER BY created_at DESC LIMIT 20
  `).all(...(spec_id ? [req.user!.id, spec_id] : [req.user!.id])) as GenerationJob[];

  res.json({ jobs });
});

export default router;
