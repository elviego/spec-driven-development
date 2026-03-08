import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen, LayoutDashboard, BookMarked, LogOut, Github,
  User, ChevronDown, Plus
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export default function Layout({ children, title, actions }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/wiki', icon: BookMarked, label: 'SDD Wiki' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-gray-800 bg-gray-950 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">SDD Studio</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => navigate('/specs/new')}
            className="flex items-center gap-2 w-full px-3 py-2 mb-3 rounded-lg
                       bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Spec
          </button>

          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
                  ? 'bg-brand-900/50 text-brand-300 border border-brand-800'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User menu */}
        <div className="p-4 border-t border-gray-800" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium text-gray-200 truncate">{user?.name}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="mt-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              {user?.github_username ? (
                <div className="px-3 py-2.5 flex items-center gap-2 text-xs text-gray-400 border-b border-gray-700">
                  <Github className="w-3.5 h-3.5" />
                  <span>{user.github_username}</span>
                </div>
              ) : null}
              <button
                onClick={logout}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {(title || actions) && (
          <header className="flex items-center justify-between px-8 py-5 border-b border-gray-800 bg-gray-950 shrink-0">
            {title && <h1 className="text-xl font-semibold text-white">{title}</h1>}
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </header>
        )}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
