import { useState } from 'react';
import { specs as specsApi } from '../api/client';
import type { Spec, SpecShare } from '../types';
import { X, Copy, Check, Users, Globe, Lock, Mail, Trash2 } from 'lucide-react';

interface ShareModalProps {
  spec: Spec;
  shares: SpecShare[];
  onClose: () => void;
  onUpdate: (spec: Spec, shares: SpecShare[]) => void;
}

export default function ShareModal({ spec, shares, onClose, onUpdate }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [visibility, setVisibility] = useState(spec.visibility);
  const [savingVisibility, setSavingVisibility] = useState(false);

  async function handleShare() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await specsApi.share(spec.id, email.trim(), canEdit);
      onUpdate({ ...spec, visibility: 'shared' }, data.shares);
      setEmail('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to share';
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveShare(shareEmail: string) {
    try {
      const data = await specsApi.removeShare(spec.id, shareEmail);
      onUpdate(data.shares.length === 0 ? { ...spec, visibility: 'private' } : spec, data.shares);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleVisibilityChange(v: Spec['visibility']) {
    setVisibility(v);
    setSavingVisibility(true);
    try {
      const data = await specsApi.update(spec.id, { visibility: v });
      onUpdate(data.spec, shares);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingVisibility(false);
    }
  }

  function copyPublicLink() {
    const url = `${window.location.origin}/s/${spec.public_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Share "{spec.title}"</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-800 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visibility */}
        <div className="mb-6">
          <label className="label">Visibility</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: 'private', icon: Lock, label: 'Private' },
              { v: 'shared', icon: Users, label: 'Shared' },
              { v: 'public', icon: Globe, label: 'Public' },
            ] as const).map(({ v, icon: Icon, label }) => (
              <button
                key={v}
                onClick={() => handleVisibilityChange(v)}
                disabled={savingVisibility}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-sm transition-all
                  ${visibility === v
                    ? 'bg-brand-900/40 border-brand-700 text-brand-300'
                    : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Public link */}
        {spec.public_token && (
          <div className="mb-6 p-3 bg-green-900/20 border border-green-800 rounded-lg">
            <div className="text-xs text-green-400 mb-2 font-medium">Public link</div>
            <div className="flex gap-2">
              <input
                readOnly
                className="input text-xs py-1.5 font-mono"
                value={`${window.location.origin}/s/${spec.public_token}`}
              />
              <button onClick={copyPublicLink} className="btn-secondary shrink-0 py-1.5">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Add share by email */}
        <div className="mb-6">
          <label className="label">Share with user</label>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleShare()}
              type="email"
            />
            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                <input type="checkbox" checked={canEdit} onChange={e => setCanEdit(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-800" />
                Edit
              </label>
              <button onClick={handleShare} disabled={!email.trim() || loading} className="btn-primary py-2">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Mail className="w-4 h-4" />}
                Share
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
        </div>

        {/* Current shares */}
        {shares.length > 0 && (
          <div>
            <label className="label">Shared with</label>
            <div className="space-y-2">
              {shares.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-200">{s.shared_with_email}</div>
                    <div className="text-xs text-gray-500">{s.can_edit ? 'Can edit' : 'View only'}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveShare(s.shared_with_email)}
                    className="p-1.5 rounded hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
