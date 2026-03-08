import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { specs as specsApi, streamAIAssist } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Spec, SpecShare } from '../types';
import { PHASES } from '../types';
import Layout from '../components/Layout';
import WikiPanel from '../components/WikiPanel';
import ShareModal from '../components/ShareModal';
import GitHubModal from '../components/GitHubModal';
import GenerateModal from '../components/GenerateModal';
import {
  Save, Share2, Github, Sparkles, BookOpen, ChevronRight,
  ArrowLeft, Trash2, Eye, EyeOff, MessageSquare, X, Send,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';

type EditorMode = 'editor' | 'preview' | 'split';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export default function SpecEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [spec, setSpec] = useState<Spec | null>(null);
  const [shares, setShares] = useState<SpecShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState('research');
  const [editorMode, setEditorMode] = useState<EditorMode>('editor');

  // Panels
  const [showWiki, setShowWiki] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // AI assistant
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiEndRef = useRef<HTMLDivElement>(null);
  const stopAI = useRef<(() => void) | null>(null);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOwner = spec?.user_id === user?.id;
  const canEdit = isOwner || shares.find(s => s.shared_with_email === user?.email && s.can_edit);

  // Load spec
  useEffect(() => {
    if (!id) return;
    specsApi.get(id)
      .then(d => {
        setSpec(d.spec);
        setShares(d.shares || []);
        setContent(d.spec.content || '');
        setTitle(d.spec.title || '');
        setPhase(d.spec.phase || 'research');
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Auto-save with debounce
  const save = useCallback(async (updates: Partial<Spec>) => {
    if (!spec || !canEdit) return;
    setSaving(true);
    try {
      const data = await specsApi.update(spec.id, updates);
      setSpec(data.spec);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [spec, canEdit]);

  function handleContentChange(val: string) {
    setContent(val);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      save({ content: val });
    }, 1500);
  }

  function handlePhaseChange(newPhase: string) {
    setPhase(newPhase as import('../types').SpecPhase);
    save({ phase: newPhase as import('../types').SpecPhase });
  }

  function handleTitleBlur() {
    if (title !== spec?.title) {
      save({ title });
    }
  }

  async function handleDelete() {
    if (!spec) return;
    try {
      await specsApi.delete(spec.id);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  }

  // AI assistant
  function handleSendAI() {
    if (!aiInput.trim() || aiLoading || !spec || !token) return;

    const userMsg = aiInput.trim();
    setAiInput('');
    setAiLoading(true);

    setAiMessages(prev => [
      ...prev,
      { role: 'user', content: userMsg },
      { role: 'assistant', content: '', streaming: true },
    ]);

    stopAI.current = streamAIAssist({
      spec_id: spec.id,
      phase,
      prompt: userMsg,
      token,
      onText: (text) => {
        setAiMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + text };
          }
          return updated;
        });
      },
      onDone: () => {
        setAiLoading(false);
        setAiMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) {
            updated[updated.length - 1] = { ...last, streaming: false };
          }
          return updated;
        });
      },
      onError: (err) => {
        setAiLoading(false);
        setAiMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) {
            updated[updated.length - 1] = { role: 'assistant', content: `Error: ${err}`, streaming: false };
          }
          return updated;
        });
      },
    });
  }

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const currentPhase = PHASES.find(p => p.id === phase);
  const currentPhaseIndex = PHASES.findIndex(p => p.id === phase);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!spec) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Spec not found</h2>
          <button onClick={() => navigate('/')} className="btn-secondary mt-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-800 bg-gray-950 shrink-0">
          <button onClick={() => navigate('/')} className="btn-ghost p-1.5">
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            className="flex-1 bg-transparent text-lg font-semibold text-white focus:outline-none border-b-2 border-transparent focus:border-brand-500 pb-0.5 transition-colors min-w-0"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            disabled={!canEdit}
            placeholder="Untitled Spec"
          />

          {/* Save status */}
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            {saving && <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />}
            {saveStatus === 'saved' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
            {saveStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            <span className="text-gray-600 hidden sm:inline">
              {saving ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : ''}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <>
                <button onClick={() => save({ content, title, phase: phase as import('../types').SpecPhase })} disabled={saving} className="btn-secondary py-1.5 hidden sm:flex">
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
                <button onClick={() => setShowGenerate(true)} className="btn-primary py-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Generate</span>
                </button>
              </>
            )}
            {isOwner && (
              <button onClick={() => setShowShare(true)} className="btn-secondary py-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            <button onClick={() => setShowGitHub(true)} className="btn-secondary py-1.5 hidden sm:flex">
              <Github className="w-3.5 h-3.5" />
            </button>
            {isOwner && (
              <button onClick={() => setShowDeleteConfirm(true)} className="btn-ghost py-1.5 text-red-500 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Phase progress bar */}
        <div className="flex items-center gap-0 px-6 py-2.5 border-b border-gray-800 bg-gray-950 shrink-0 overflow-x-auto">
          {PHASES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => canEdit && handlePhaseChange(p.id)}
              disabled={!canEdit}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all shrink-0
                ${phase === p.id
                  ? 'bg-brand-900/50 text-brand-300 border border-brand-800 font-medium'
                  : i < currentPhaseIndex
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
              {i < currentPhaseIndex && <CheckCircle className="w-3 h-3 text-green-600" />}
              {i < PHASES.length - 1 && <ChevronRight className="w-3 h-3 text-gray-700 ml-1" />}
            </button>
          ))}
        </div>

        {/* Phase description */}
        {currentPhase && (
          <div className="flex items-center gap-3 px-6 py-2 bg-brand-950/30 border-b border-gray-800 text-xs text-brand-400 shrink-0">
            <span className="font-medium">{currentPhase.icon} {currentPhase.label} phase:</span>
            <span>{currentPhase.description}</span>
            <button
              onClick={() => { setShowAI(true); setAiInput(`Help me with the ${currentPhase.label} phase`); }}
              className="ml-auto flex items-center gap-1 text-brand-500 hover:text-brand-300 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Get AI help
            </button>
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor area */}
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50 shrink-0">
              <div className="flex gap-1">
                {(['editor', 'split', 'preview'] as EditorMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setEditorMode(mode)}
                    className={`px-2.5 py-1 rounded text-xs capitalize transition-colors
                      ${editorMode === mode ? 'bg-gray-700 text-gray-200' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {mode === 'split' ? 'Split' : mode === 'editor' ? (
                      <span className="flex items-center gap-1"><EyeOff className="w-3 h-3" />Edit</span>
                    ) : (
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Preview</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAI(!showAI)}
                  className={`p-1.5 rounded transition-colors ${showAI ? 'text-brand-400 bg-brand-900/40' : 'text-gray-500 hover:text-gray-300'}`}
                  title="AI Assistant"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowWiki(!showWiki)}
                  className={`p-1.5 rounded transition-colors ${showWiki ? 'text-brand-400 bg-brand-900/40' : 'text-gray-500 hover:text-gray-300'}`}
                  title="SDD Wiki"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editor + preview */}
            <div className="flex flex-1 overflow-hidden">
              {(editorMode === 'editor' || editorMode === 'split') && (
                <textarea
                  className={`flex-1 bg-gray-950 text-gray-200 text-sm font-mono p-6
                              resize-none focus:outline-none leading-relaxed
                              ${editorMode === 'split' ? 'w-1/2 border-r border-gray-800' : 'w-full'}`}
                  value={content}
                  onChange={e => handleContentChange(e.target.value)}
                  disabled={!canEdit}
                  placeholder="# Project Title&#10;&#10;Start writing your spec here...&#10;&#10;Use the SDD Wiki panel on the right for guidance."
                  spellCheck={false}
                />
              )}
              {(editorMode === 'preview' || editorMode === 'split') && (
                <div className={`flex-1 overflow-y-auto p-6 bg-gray-950 ${editorMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                  <MarkdownPreview content={content} />
                </div>
              )}
            </div>
          </div>

          {/* AI Assistant panel */}
          {showAI && (
            <div className="w-80 flex flex-col border-l border-gray-800 bg-gray-900 shrink-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  AI Assistant
                </div>
                <button onClick={() => setShowAI(false)} className="p-1 rounded hover:bg-gray-800 text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {aiMessages.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-600 mb-3">
                    Ask Claude for help with the <strong className="text-gray-500">{currentPhase?.label}</strong> phase.
                  </p>
                  <div className="space-y-2">
                    {[
                      `What should I research first?`,
                      `Review my spec for gaps`,
                      `Suggest architecture for this project`,
                      `What edge cases am I missing?`,
                    ].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setAiInput(suggestion)}
                        className="w-full text-left text-xs p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block max-w-full text-xs rounded-xl px-3 py-2 text-left
                      ${msg.role === 'user'
                        ? 'bg-brand-700 text-white'
                        : 'bg-gray-800 text-gray-300'
                      }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-xs max-w-none
                                        prose-p:text-gray-300 prose-code:text-brand-300">
                          <LazyMarkdown content={msg.content} />
                          {msg.streaming && <span className="inline-block w-1 h-3 bg-brand-400 animate-pulse ml-0.5" />}
                        </div>
                      ) : msg.content}
                    </div>
                  </div>
                ))}
                <div ref={aiEndRef} />
              </div>

              <div className="p-3 border-t border-gray-800 shrink-0">
                <div className="flex gap-2">
                  <textarea
                    className="input flex-1 resize-none text-xs min-h-[60px]"
                    placeholder={`Ask about the ${currentPhase?.label} phase…`}
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAI();
                      }
                    }}
                    disabled={aiLoading}
                  />
                  <button
                    onClick={aiLoading ? () => { stopAI.current?.(); setAiLoading(false); } : handleSendAI}
                    disabled={!aiLoading && !aiInput.trim()}
                    className={`p-2 rounded-lg self-end transition-colors ${aiLoading ? 'btn-danger' : 'btn-primary'}`}
                  >
                    {aiLoading ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wiki panel */}
          {showWiki && (
            <div className="w-72 shrink-0 overflow-hidden">
              <WikiPanel phase={phase} onClose={() => setShowWiki(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showShare && (
        <ShareModal
          spec={spec}
          shares={shares}
          onClose={() => setShowShare(false)}
          onUpdate={(s, sh) => { setSpec(s); setShares(sh); }}
        />
      )}
      {showGitHub && (
        <GitHubModal
          spec={spec}
          onClose={() => setShowGitHub(false)}
          onUpdate={setSpec}
        />
      )}
      {showGenerate && (
        <GenerateModal
          spec={spec}
          onClose={() => setShowGenerate(false)}
        />
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-white mb-2">Delete Spec?</h2>
            <p className="text-sm text-gray-400 mb-5">This will permanently delete "{spec.title}" and all its data.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// Lazy markdown component to avoid re-renders on every keystroke in preview
function MarkdownPreview({ content }: { content: string }) {
  return <LazyMarkdown content={content} />;
}

function LazyMarkdown({ content }: { content: string }) {
  const [ReactMarkdown, setReactMarkdown] = useState<typeof import('react-markdown').default | null>(null);
  const [remarkGfm, setRemarkGfm] = useState<unknown>(null);

  useEffect(() => {
    Promise.all([
      import('react-markdown'),
      import('remark-gfm'),
    ]).then(([md, gfm]) => {
      setReactMarkdown(() => md.default);
      setRemarkGfm(() => gfm.default);
    });
  }, []);

  if (!ReactMarkdown || !remarkGfm) {
    return <pre className="text-sm text-gray-400 font-mono whitespace-pre-wrap">{content}</pre>;
  }

  const MD = ReactMarkdown;
  return (
    <MD
      remarkPlugins={[remarkGfm as never]}
      className="prose prose-invert max-w-none
                 prose-headings:text-gray-200 prose-p:text-gray-400 prose-li:text-gray-400
                 prose-code:text-brand-300 prose-code:bg-gray-800 prose-code:rounded prose-code:px-1
                 prose-a:text-brand-400 prose-blockquote:border-brand-700 prose-blockquote:text-gray-500
                 prose-table:text-gray-400 prose-th:text-gray-300 prose-th:border-gray-700 prose-td:border-gray-800"
    >
      {content}
    </MD>
  );
}
