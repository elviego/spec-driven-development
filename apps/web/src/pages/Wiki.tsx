import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { wiki as wikiApi } from '../api/client';
import Layout from '../components/Layout';
import type { WikiArticle } from '../types';
import { BookMarked, ChevronRight, ArrowLeft } from 'lucide-react';

interface WikiContent {
  slug: string;
  title: string;
  content: string;
  order: number;
  relatedPhases: string[];
}

export default function Wiki() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [current, setCurrent] = useState<WikiContent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    wikiApi.list().then(d => setArticles(d.articles));
  }, []);

  useEffect(() => {
    const target = slug || (articles[0]?.slug);
    if (!target) return;
    setLoading(true);
    wikiApi.get(target)
      .then(setCurrent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, articles]);

  const currentIndex = articles.findIndex(a => a.slug === current?.slug);

  return (
    <Layout title="SDD Wiki">
      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-gray-800 py-4 overflow-y-auto bg-gray-950">
          <div className="px-4 mb-3 text-xs text-gray-600 font-medium uppercase tracking-wider">
            Framework Docs
          </div>
          {articles.map((a, i) => (
            <Link
              key={a.slug}
              to={`/wiki/${a.slug}`}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
                ${current?.slug === a.slug
                  ? 'bg-brand-900/40 text-brand-300 border-l-2 border-brand-500'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800'
                }`}
            >
              <span className="text-gray-600 text-xs w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
              {a.title}
            </Link>
          ))}

          <div className="px-4 mt-6 mb-3 text-xs text-gray-600 font-medium uppercase tracking-wider">
            Templates & Examples
          </div>
          <button
            onClick={() => navigate('/wiki/spec-template')}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <span className="text-gray-600 text-xs w-5 shrink-0">T1</span>
            Spec Template
          </button>
          <button
            onClick={() => navigate('/wiki/fraud-example')}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <span className="text-gray-600 text-xs w-5 shrink-0">E1</span>
            Fraud Detection Example
          </button>
        </aside>

        {/* Article content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : current ? (
            <div className="max-w-3xl mx-auto px-8 py-10">
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-6">
                <BookMarked className="w-3.5 h-3.5" />
                SDD Wiki
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-400">{current.title}</span>
              </div>

              {current.relatedPhases.length > 0 && (
                <div className="mb-6 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-600">Relevant to phases:</span>
                  {current.relatedPhases.map(p => (
                    <span key={p} className={`badge-${p}`}>{p}</span>
                  ))}
                </div>
              )}

              <div className="prose prose-invert max-w-none
                              prose-headings:text-gray-200 prose-p:text-gray-400 prose-li:text-gray-400
                              prose-code:text-brand-300 prose-code:bg-gray-800 prose-code:rounded prose-code:px-1 prose-code:py-0.5
                              prose-a:text-brand-400 prose-blockquote:border-brand-700 prose-blockquote:text-gray-500
                              prose-table:text-sm prose-th:text-gray-300 prose-th:border-gray-700 prose-td:border-gray-800
                              prose-strong:text-gray-300 prose-hr:border-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{current.content}</ReactMarkdown>
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-12 pt-6 border-t border-gray-800">
                {currentIndex > 0 ? (
                  <Link to={`/wiki/${articles[currentIndex - 1].slug}`} className="btn-secondary">
                    <ArrowLeft className="w-4 h-4" />
                    {articles[currentIndex - 1].title}
                  </Link>
                ) : <div />}
                {currentIndex < articles.length - 1 && (
                  <Link to={`/wiki/${articles[currentIndex + 1].slug}`} className="btn-secondary">
                    {articles[currentIndex + 1].title}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <SpecialWikiPage slug={slug} />
          )}
        </div>
      </div>
    </Layout>
  );
}

function SpecialWikiPage({ slug }: { slug?: string }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    const fetcher = slug === 'spec-template'
      ? wikiApi.specTemplate()
      : slug === 'fraud-example'
        ? wikiApi.example()
        : Promise.reject(new Error('not found'));

    fetcher
      .then(d => setContent(d.content))
      .catch(() => setContent('_Not found._'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <div className="prose prose-invert max-w-none
                      prose-headings:text-gray-200 prose-p:text-gray-400
                      prose-code:text-brand-300 prose-code:bg-gray-800 prose-code:rounded prose-code:px-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
