export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  avatar: string | null;
  github_token: string | null;
  github_username: string | null;
  created_at: number;
}

// Augment Express to use our User type on req.user
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User {
      id: string;
      google_id: string;
      email: string;
      name: string;
      avatar: string | null;
      github_token: string | null;
      github_username: string | null;
      created_at: number;
    }
  }
}

export interface Spec {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content: string;
  phase: string;
  visibility: 'private' | 'shared' | 'public';
  github_repo: string | null;
  github_branch: string;
  public_token: string | null;
  created_at: number;
  updated_at: number;
}

export interface SpecShare {
  id: string;
  spec_id: string;
  shared_with_email: string;
  can_edit: number;
  created_at: number;
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

