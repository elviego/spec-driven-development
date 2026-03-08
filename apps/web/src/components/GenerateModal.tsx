import { useState } from 'react';
import { streamAIGenerate } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Spec } from '../types';
import { X, Sparkles, FolderOpen, FileCode, AlertCircle, Check } from 'lucide-react';

interface GenerateModalProps {
  spec: Spec;
  onClose: () => void;
}

export default function GenerateModal({ spec, onClose }: GenerateModalProps) {
  const { token } = useAuth();
  const [outputDir, setOutputDir] = useState('');
  const [techPrefs, setTechPrefs] = useState('');
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState<{ path: string; size: number }[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [stopGeneration, setStopGeneration] = useState<(() => void) | null>(null);

  function handleGenerate() {
    if (!outputDir.trim() || !token) return;
    setGenerating(true);
    setOutput('');
    setGeneratedFiles([]);
    setDone(false);
    setError('');

    const stop = streamAIGenerate({
      spec_id: spec.id,
      output_dir: outputDir.trim(),
      tech_preferences: techPrefs.trim() || undefined,
      token,
      onText: (text) => setOutput(prev => prev + text),
      onFile: (path, size) => setGeneratedFiles(prev => [...prev, { path, size }]),
      onDone: () => { setDone(true); setGenerating(false); },
      onError: (err) => { setError(err); setGenerating(false); },
    });

    setStopGeneration(() => stop);
  }

  function handleStop() {
    stopGeneration?.();
    setGenerating(false);
    setStopGeneration(null);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Sparkles className="w-5 h-5 text-brand-400" />
            Generate Project
          </div>
          <button onClick={onClose} disabled={generating} className="p-1.5 rounded hover:bg-gray-800 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!generating && !done && !output && (
            <div className="p-6 space-y-5">
              <div className="p-4 bg-brand-900/20 border border-brand-800 rounded-lg text-sm text-brand-300">
                <p className="font-medium mb-1">Claude will generate a complete codebase</p>
                <p className="text-brand-400/70">Based on your spec, Claude Opus 4.6 will create all project files, configuration, tests, and documentation.</p>
              </div>

              <div>
                <label className="label">Output Directory *</label>
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    className="input pl-9 font-mono text-sm"
                    placeholder="/path/to/project or ~/projects/my-app"
                    value={outputDir}
                    onChange={e => setOutputDir(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">This directory will be created if it doesn't exist</p>
              </div>

              <div>
                <label className="label">Technology Preferences (optional)</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  placeholder="e.g. TypeScript, React, Postgres, Prisma. Keep it minimal — Claude will choose the best stack if not specified."
                  value={techPrefs}
                  onChange={e => setTechPrefs(e.target.value)}
                />
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <div>Spec: <span className="text-gray-400">{spec.title}</span></div>
                <div>Phase: <span className="text-gray-400">{spec.phase}</span></div>
                <div>Content length: <span className="text-gray-400">{spec.content.length} chars</span></div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {(generating || output) && (
            <div className="p-6 space-y-4">
              {/* Generated files list */}
              {generatedFiles.length > 0 && (
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5" />
                    Generated files ({generatedFiles.length})
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {generatedFiles.map((f, i) => (
                      <div key={i} className="text-xs font-mono text-green-400 flex items-center gap-1.5">
                        <Check className="w-3 h-3 shrink-0" />
                        {f.path}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stream output */}
              <div className="bg-gray-800 rounded-lg p-4 font-mono text-xs text-gray-300 max-h-64 overflow-y-auto whitespace-pre-wrap">
                {output || <span className="text-gray-500 animate-pulse">Generating…</span>}
              </div>

              {done && (
                <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-300 text-sm">
                  <Check className="w-4 h-4" />
                  Generation complete! {generatedFiles.length} files generated to <code className="font-mono">{outputDir}</code>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-800 shrink-0 flex gap-3">
          {!generating && !done && (
            <>
              <button
                onClick={handleGenerate}
                disabled={!outputDir.trim()}
                className="btn-primary flex-1"
              >
                <Sparkles className="w-4 h-4" />
                Generate with Claude
              </button>
              <button onClick={onClose} className="btn-secondary">Cancel</button>
            </>
          )}
          {generating && (
            <button onClick={handleStop} className="btn-danger flex-1">
              Stop Generation
            </button>
          )}
          {done && (
            <button onClick={onClose} className="btn-primary flex-1">
              <Check className="w-4 h-4" />
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
