import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Layers, Sparkles, GitBranch } from 'lucide-react';

const FEATURES = [
  { icon: Layers, title: 'Phase-guided spec editor', desc: 'Walk through Research → Plan → Draft → Review → Implement with AI assistance' },
  { icon: Sparkles, title: 'AI code generation', desc: 'Generate a complete codebase from your finished specification using Claude' },
  { icon: GitBranch, title: 'GitHub integration', desc: 'Link specs to repos, push spec files, and track implementation progress' },
  { icon: BookOpen, title: 'SDD Wiki', desc: 'Inline documentation and references to the methodology while you write' },
];

export default function Login() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-gray-950 via-brand-950 to-gray-950 border-r border-gray-800">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SDD Studio</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Build software with<br />
            <span className="text-brand-400">intent and structure</span>
          </h1>
          <p className="text-gray-400 text-lg mb-12">
            Stop "vibe coding". Write a spec first, build with purpose.
          </p>

          <div className="space-y-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-900/50 border border-brand-800 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-200 mb-0.5">{title}</div>
                  <div className="text-sm text-gray-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-600">
          Based on the <span className="text-gray-500">Spec-Driven Development</span> methodology · v1.0
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SDD Studio</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">Sign in to continue to your workspace</p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
              Authentication failed. Please try again.
            </div>
          )}

          <a
            href="/auth/google"
            className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl
                       bg-white hover:bg-gray-100 text-gray-900 font-medium transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </a>

          <p className="mt-6 text-center text-xs text-gray-600">
            By signing in, you agree to use this tool responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}
