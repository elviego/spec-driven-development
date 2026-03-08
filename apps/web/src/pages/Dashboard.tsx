import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { specs as specsApi, wiki } from '../api/client';
import type { Spec } from '../types';
import { PHASES } from '../types';
import {
  Plus, Search, Lock, Globe, Users, Clock, FileText,
  Github, ChevronRight, Sparkles
} from 'lucide-react';

function SpecCard({ spec, onClick }: { spec: Spec & { owner_name?: string }; onClick: () => void }) {
  const phase = PHASES.find(p => p.id === spec.phase);
  const isOwner = !spec.share_can_edit && spec.share_can_edit !== 0;

  return (
    <button
      onClick={onClick}
      className="card p-5 text-left hover:border-gray-700 hover:bg-gray-850 transition-all group w-full"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge-${spec.visibility}`}>
            {spec.visibility === 'private' && <Lock className="w-3 h-3 mr-1" />}
            {spec.visibility === 'public' && <Globe className="w-3 h-3 mr-1" />}
            {spec.visibility === 'shared' && <Users className="w-3 h-3 mr-1" />}
            {spec.visibility}
          </span>
          <span className={`badge-${spec.phase}`}>
            {phase?.icon} {phase?.label}
          </span>
          {!isOwner && (
            <span className="badge bg-gray-800 text-gray-500">
              Shared {spec.share_can_edit ? '(edit)' : '(view)'}
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 mt-0.5" />
      </div>

      <h3 className="font-semibold text-gray-100 mb-1 group-hover:text-white transition-colors">
        {spec.title}
      </h3>
      {spec.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{spec.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-600 mt-3">
        {spec.github_repo && (
          <span className="flex items-center gap-1">
            <Github className="w-3 h-3" />
            {spec.github_repo}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(spec.updated_at * 1000).toLocaleDateString()}
        </span>
        {spec.owner_name && !isOwner && (
          <span className="text-gray-600">by {spec.owner_name}</span>
        )}
      </div>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [allSpecs, setAllSpecs] = useState<Spec[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPhase, setFilterPhase] = useState('all');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [templateLoading, setTemplateLoading] = useState(false);

  useEffect(() => {
    specsApi.list()
      .then(d => setAllSpecs(d.specs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = allSpecs.filter(s => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase());
    const matchPhase = filterPhase === 'all' || s.phase === filterPhase;
    return matchSearch && matchPhase;
  });

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setTemplateLoading(true);
    try {
      const [specData, templateData] = await Promise.all([
        specsApi.create({ title: newTitle.trim(), description: newDesc.trim() || undefined }),
        wiki.specTemplate().catch(() => ({ content: '' })),
      ]);
      // Pre-fill with template
      if (templateData.content) {
        await specsApi.update(specData.spec.id, { content: templateData.content });
      }
      navigate(`/specs/${specData.spec.id}`);
    } catch (err) {
      console.error(err);
      setTemplateLoading(false);
    }
  }

  const ownSpecs = filtered.filter(s => s.share_can_edit === null || s.share_can_edit === undefined);
  const sharedSpecs = filtered.filter(s => s.share_can_edit !== null && s.share_can_edit !== undefined);

  return (
    <Layout
      title="My Specs"
      actions={
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Spec
        </button>
      }
    >
      <div className="p-8">
        {/* Search + filter */}
        <div className="flex gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="input pl-9"
              placeholder="Search specs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-40"
            value={filterPhase}
            onChange={e => setFilterPhase(e.target.value)}
          >
            <option value="all">All phases</option>
            {PHASES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
          </select>
        </div>

        {/* Create modal */}
        {creating && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-white mb-5">Create New Spec</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Project Title *</label>
                  <input
                    className="input"
                    placeholder="e.g. Payment Fraud Detection Service"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Short Description</label>
                  <input
                    className="input"
                    placeholder="What are you building?"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  The spec template will be pre-filled automatically
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || templateLoading}
                  className="btn-primary flex-1"
                >
                  {templateLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : <Sparkles className="w-4 h-4" />}
                  Create & Start Writing
                </button>
                <button onClick={() => { setCreating(false); setNewTitle(''); setNewDesc(''); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allSpecs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-brand-900/30 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-brand-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No specs yet</h2>
            <p className="text-gray-500 mb-6 max-w-sm">
              Start your first spec to begin the Spec-Driven Development journey.
            </p>
            <button onClick={() => setCreating(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Create First Spec
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {ownSpecs.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  My Specs ({ownSpecs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {ownSpecs.map(s => (
                    <SpecCard key={s.id} spec={s} onClick={() => navigate(`/specs/${s.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {sharedSpecs.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Shared with me ({sharedSpecs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sharedSpecs.map(s => (
                    <SpecCard key={s.id} spec={s} onClick={() => navigate(`/specs/${s.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-10">No specs match your search.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
