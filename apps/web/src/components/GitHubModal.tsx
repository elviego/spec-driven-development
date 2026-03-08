import { useState, useEffect } from 'react';
import { github as githubApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Spec } from '../types';
import { X, Github, Link2, Upload, Check, AlertCircle } from 'lucide-react';

interface Repo {
  full_name: string;
  name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  html_url: string;
}

interface GitHubModalProps {
  spec: Spec;
  onClose: () => void;
  onUpdate: (spec: Spec) => void;
}

export default function GitHubModal({ spec, onClose, onUpdate }: GitHubModalProps) {
  const { user, refresh } = useAuth();
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(spec.github_repo || '');
  const [branch, setBranch] = useState(spec.github_branch || 'main');
  const [linking, setLinking] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushSuccess, setPushSuccess] = useState('');
  const [error, setError] = useState('');

  const isConnected = !!user?.github_username;

  useEffect(() => {
    if (isConnected) {
      setLoadingRepos(true);
      githubApi.repos()
        .then(d => setRepos(d.repos))
        .catch(() => setError('Failed to load repos'))
        .finally(() => setLoadingRepos(false));
    }
  }, [isConnected]);

  async function handleConnect() {
    if (!token.trim()) return;
    setConnecting(true);
    setError('');
    try {
      await githubApi.connect(token.trim());
      await refresh();
    } catch {
      setError('Invalid token. Make sure it has repo scope.');
    } finally {
      setConnecting(false);
    }
  }

  async function handleLink() {
    if (!selectedRepo) return;
    setLinking(true);
    try {
      await githubApi.link(spec.id, selectedRepo, branch);
      onUpdate({ ...spec, github_repo: selectedRepo, github_branch: branch });
    } catch {
      setError('Failed to link repository');
    } finally {
      setLinking(false);
    }
  }

  async function handlePushSpec() {
    setPushing(true);
    setPushSuccess('');
    setError('');
    try {
      const data = await githubApi.pushSpec(spec.id);
      setPushSuccess(data.url);
    } catch {
      setError('Failed to push spec to GitHub');
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Github className="w-5 h-5" />
            GitHub Integration
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-800 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!isConnected ? (
          /* Connect GitHub */
          <div>
            <p className="text-sm text-gray-400 mb-4">
              Connect your GitHub account using a Personal Access Token with <code className="text-brand-300 bg-gray-800 px-1 rounded">repo</code> scope.
            </p>
            <div className="space-y-3">
              <div>
                <label className="label">Personal Access Token</label>
                <input
                  className="input font-mono text-sm"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  type="password"
                />
              </div>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=SDD+Studio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-400 hover:text-brand-300"
              >
                → Generate a new token on GitHub ↗
              </a>
            </div>
            <button
              onClick={handleConnect}
              disabled={!token.trim() || connecting}
              className="btn-primary w-full mt-4"
            >
              {connecting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : <Github className="w-4 h-4" />}
              Connect GitHub
            </button>
          </div>
        ) : (
          /* Link repo + push */
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-green-400">
              <Check className="w-4 h-4" />
              Connected as <strong>{user?.github_username}</strong>
            </div>

            <div>
              <label className="label">Repository</label>
              {loadingRepos ? (
                <div className="input flex items-center gap-2 text-gray-500">
                  <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  Loading repos…
                </div>
              ) : (
                <select
                  className="input"
                  value={selectedRepo}
                  onChange={e => {
                    setSelectedRepo(e.target.value);
                    const repo = repos.find(r => r.full_name === e.target.value);
                    if (repo) setBranch(repo.default_branch);
                  }}
                >
                  <option value="">Select a repository…</option>
                  {repos.map(r => (
                    <option key={r.full_name} value={r.full_name}>
                      {r.full_name} {r.private ? '🔒' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="label">Branch</label>
              <input
                className="input"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                placeholder="main"
              />
            </div>

            <button
              onClick={handleLink}
              disabled={!selectedRepo || linking}
              className="btn-secondary w-full"
            >
              {linking ? (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : <Link2 className="w-4 h-4" />}
              Link Repository
            </button>

            {spec.github_repo && (
              <div className="border-t border-gray-800 pt-4">
                <div className="text-xs text-gray-500 mb-3">
                  Linked to: <span className="text-gray-300">{spec.github_repo}</span> ({spec.github_branch})
                </div>
                <button
                  onClick={handlePushSpec}
                  disabled={pushing}
                  className="btn-primary w-full"
                >
                  {pushing ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : <Upload className="w-4 h-4" />}
                  Push Spec to GitHub
                </button>
                {pushSuccess && (
                  <a
                    href={pushSuccess}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Pushed! View on GitHub ↗
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
