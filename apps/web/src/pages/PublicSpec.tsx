import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { specs as specsApi } from '../api/client';
import type { Spec } from '../types';
import { PHASES } from '../types';
import { BookOpen, Clock, User, Lock } from 'lucide-react';

export default function PublicSpec() {
  const { token } = useParams<{ token: string }>();
  const [spec, setSpec] = useState<Spec & { owner_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    specsApi.getPublic(token)
      .then(d => setSpec(d.spec))
      .catch(() => setError('Spec not found or no longer public'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !spec) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center p-8">
      <Lock className="w-12 h-12 text-gray-600 mb-4" />
      <h1 className="text-xl font-semibold text-white mb-2">Spec not available</h1>
      <p className="text-gray-500 mb-6">{error || 'This spec may have been made private.'}</p>
      <Link to="/login" className="btn-primary">Open SDD Studio</Link>
    </div>
  );

  const phase = PHASES.find(p => p.id === spec.phase);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2 text-brand-400 hover:text-brand-300">
            <BookOpen className="w-5 h-5" />
            <span className="font-semibold">SDD Studio</span>
          </Link>
          <span className="badge bg-gray-800 text-gray-400">Public Spec</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Meta */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">{spec.title}</h1>
          {spec.description && <p className="text-lg text-gray-400 mb-4">{spec.description}</p>}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {spec.owner_name && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {spec.owner_name}
              </span>
            )}
            {phase && (
              <span className={`badge-${spec.phase}`}>
                {phase.icon} {phase.label}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {new Date(spec.updated_at * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none
                        prose-headings:text-gray-200 prose-p:text-gray-400 prose-li:text-gray-400
                        prose-code:text-brand-300 prose-code:bg-gray-800 prose-code:rounded prose-code:px-1
                        prose-a:text-brand-400 prose-blockquote:border-brand-700 prose-blockquote:text-gray-500
                        prose-table:text-sm prose-th:text-gray-300 prose-td:text-gray-400
                        prose-strong:text-gray-300 prose-hr:border-gray-800">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{spec.content || '*No content yet.*'}</ReactMarkdown>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 mb-4">Want to create your own project specifications?</p>
          <Link to="/login" className="btn-primary">
            <BookOpen className="w-4 h-4" />
            Get started with SDD Studio
          </Link>
        </div>
      </main>
    </div>
  );
}
