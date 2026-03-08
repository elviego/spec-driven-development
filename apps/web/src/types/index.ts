export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  github_username: string | null;
}

export interface Spec {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content: string;
  phase: SpecPhase;
  visibility: 'private' | 'shared' | 'public';
  github_repo: string | null;
  github_branch: string;
  public_token: string | null;
  created_at: number;
  updated_at: number;
  owner_name?: string;
  owner_avatar?: string | null;
  share_can_edit?: number | null;
}

export interface SpecShare {
  id: string;
  spec_id: string;
  shared_with_email: string;
  can_edit: number;
  created_at: number;
}

export type SpecPhase = 'research' | 'plan' | 'draft' | 'review' | 'implement';

export interface WikiArticle {
  slug: string;
  title: string;
  order: number;
}

export interface GenerationJob {
  id: string;
  spec_id: string;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output_dir: string | null;
  error: string | null;
  created_at: number;
  updated_at: number;
}

export const PHASES: { id: SpecPhase; label: string; description: string; icon: string }[] = [
  { id: 'research', label: 'Research', description: 'Understand the domain, constraints, and requirements', icon: '🔍' },
  { id: 'plan', label: 'Plan', description: 'Break into sub-projects, define phases and dependencies', icon: '🗺️' },
  { id: 'draft', label: 'Draft Spec', description: 'Write the comprehensive specification document', icon: '✍️' },
  { id: 'review', label: 'Review Spec', description: 'Review for gaps, ambiguities, and edge cases', icon: '🔬' },
  { id: 'implement', label: 'Implement', description: 'AI-assisted implementation with feedback loop', icon: '⚡' },
];
