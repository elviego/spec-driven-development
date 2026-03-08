import type { Database } from 'better-sqlite3';

export function setupSchema(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      github_token TEXT,
      github_username TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS specs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL DEFAULT '',
      phase TEXT NOT NULL DEFAULT 'research',
      visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private', 'shared', 'public')),
      github_repo TEXT,
      github_branch TEXT DEFAULT 'main',
      public_token TEXT UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS spec_shares (
      id TEXT PRIMARY KEY,
      spec_id TEXT NOT NULL,
      shared_with_email TEXT NOT NULL,
      can_edit INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (spec_id) REFERENCES specs(id) ON DELETE CASCADE,
      UNIQUE(spec_id, shared_with_email)
    );

    CREATE TABLE IF NOT EXISTS generation_jobs (
      id TEXT PRIMARY KEY,
      spec_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
      output_dir TEXT,
      error TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (spec_id) REFERENCES specs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_specs_user_id ON specs(user_id);
    CREATE INDEX IF NOT EXISTS idx_specs_public_token ON specs(public_token);
    CREATE INDEX IF NOT EXISTS idx_spec_shares_spec_id ON spec_shares(spec_id);
    CREATE INDEX IF NOT EXISTS idx_generation_jobs_spec_id ON generation_jobs(spec_id);
  `);
}
