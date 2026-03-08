import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Root of the spec-driven-development repository
const REPO_ROOT = path.resolve(__dirname, '../../../../');

const WIKI_FILES: { slug: string; file: string; title: string; order: number }[] = [
  { slug: 'what-is-sdd', file: 'methodology/01-what-is-sdd.md', title: 'What is SDD?', order: 1 },
  { slug: 'core-concepts', file: 'methodology/02-core-concepts.md', title: 'Core Concepts', order: 2 },
  { slug: 'workflow', file: 'methodology/03-workflow.md', title: 'SDD Workflow', order: 3 },
  { slug: 'spec-structure', file: 'methodology/04-spec-structure.md', title: 'Spec Structure', order: 4 },
  { slug: 'working-with-ai', file: 'methodology/05-working-with-ai.md', title: 'Working with AI', order: 5 },
  { slug: 'principles', file: 'methodology/06-principles.md', title: 'Core Principles', order: 6 },
  { slug: 'anti-patterns', file: 'methodology/07-anti-patterns.md', title: 'Anti-Patterns', order: 7 },
];

const PHASE_WIKI_REFS: Record<string, string[]> = {
  research: ['what-is-sdd', 'core-concepts', 'workflow'],
  plan: ['workflow', 'spec-structure', 'core-concepts'],
  draft: ['spec-structure', 'working-with-ai', 'principles'],
  review: ['principles', 'anti-patterns', 'spec-structure'],
  implement: ['working-with-ai', 'anti-patterns', 'workflow'],
};

// List all wiki articles
router.get('/', (_req: Request, res: Response) => {
  const articles = WIKI_FILES.map(({ slug, title, order }) => ({ slug, title, order }));
  res.json({ articles, phaseRefs: PHASE_WIKI_REFS });
});

// Get a specific wiki article by slug
router.get('/:slug', (req: Request, res: Response) => {
  const entry = WIKI_FILES.find(f => f.slug === req.params.slug);

  if (!entry) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }

  const filePath = path.join(REPO_ROOT, entry.file);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Article file not found' });
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const phaseRefs = Object.entries(PHASE_WIKI_REFS)
    .filter(([, slugs]) => slugs.includes(entry.slug))
    .map(([phase]) => phase);

  res.json({
    slug: entry.slug,
    title: entry.title,
    content,
    order: entry.order,
    relatedPhases: phaseRefs,
    phaseRefs: PHASE_WIKI_REFS,
  });
});

// Get the spec template
router.get('/templates/spec', (_req: Request, res: Response) => {
  const filePath = path.join(REPO_ROOT, 'templates/SPEC_TEMPLATE.md');

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  res.json({ content: fs.readFileSync(filePath, 'utf-8') });
});

// Get the agents.md template
router.get('/templates/agents', (_req: Request, res: Response) => {
  const filePath = path.join(REPO_ROOT, 'templates/AGENTS.md');

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  res.json({ content: fs.readFileSync(filePath, 'utf-8') });
});

// Get the example spec
router.get('/examples/payment-fraud', (_req: Request, res: Response) => {
  const filePath = path.join(REPO_ROOT, 'examples/payment-fraud-detection.md');

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Example not found' });
    return;
  }

  res.json({ content: fs.readFileSync(filePath, 'utf-8') });
});

export default router;
