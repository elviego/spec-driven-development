import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { wiki as wikiApi } from '../api/client';
import { BookMarked, X, ChevronRight, ExternalLink } from 'lucide-react';
import type { WikiArticle } from '../types';

interface WikiPanelProps {
  phase: string;
  onClose?: () => void;
}

export default function WikiPanel({ phase, onClose }: WikiPanelProps) {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [phaseRefs, setPhaseRefs] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    wikiApi.list().then(d => {
      setArticles(d.articles);
      setPhaseRefs(d.phaseRefs);
    });
  }, []);

  useEffect(() => {
    const refs = phaseRefs[phase] || [];
    if (refs.length > 0 && !selected) {
      setSelected(refs[0]);
    }
  }, [phase, phaseRefs, selected]);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    wikiApi.get(selected)
      .then(d => setContent(d.content))
      .catch(() => setContent('_Article not found._'))
      .finally(() => setLoading(false));
  }, [selected]);

  const relevantSlugs = phaseRefs[phase] || [];
  const relevantArticles = articles.filter(a => relevantSlugs.includes(a.slug));
  const otherArticles = articles.filter(a => !relevantSlugs.includes(a.slug));

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <BookMarked className="w-4 h-4 text-brand-400" />
          SDD Wiki
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/wiki"
            target="_blank"
            className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
            title="Open wiki"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Article list + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: article list */}
        <div className="w-40 shrink-0 overflow-y-auto border-r border-gray-800 py-2">
          {relevantArticles.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs text-brand-500 font-medium uppercase tracking-wider">
                This phase
              </div>
              {relevantArticles.map(a => (
                <button
                  key={a.slug}
                  onClick={() => setSelected(a.slug)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-1
                    ${selected === a.slug
                      ? 'bg-brand-900/40 text-brand-300'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                >
                  {selected === a.slug && <ChevronRight className="w-3 h-3 shrink-0" />}
                  <span className="truncate">{a.title}</span>
                </button>
              ))}
            </>
          )}
          {otherArticles.length > 0 && (
            <>
              <div className="px-3 py-1 mt-2 text-xs text-gray-600 font-medium uppercase tracking-wider">
                All
              </div>
              {otherArticles.map(a => (
                <button
                  key={a.slug}
                  onClick={() => setSelected(a.slug)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-1
                    ${selected === a.slug
                      ? 'bg-brand-900/40 text-brand-300'
                      : 'text-gray-600 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                >
                  {selected === a.slug && <ChevronRight className="w-3 h-3 shrink-0" />}
                  <span className="truncate">{a.title}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : content ? (
            <div className="prose prose-invert prose-sm max-w-none
                            prose-headings:text-gray-200 prose-p:text-gray-400 prose-li:text-gray-400
                            prose-code:text-brand-300 prose-code:bg-gray-800 prose-code:rounded prose-code:px-1
                            prose-a:text-brand-400 prose-blockquote:border-brand-700 prose-blockquote:text-gray-500">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-8">Select an article</p>
          )}
        </div>
      </div>
    </div>
  );
}
