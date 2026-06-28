import { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Sparkles, AlertCircle, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../utils';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const response = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        onSuccess(response.user);
        onClose();
      } else {
        const response = await apiFetch('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        });
        onSuccess(response.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setLoading(true);

    // Simulate OAuth connection latency
    setTimeout(() => {
      const mockGoogleUser: User = {
        id: 'u-google-' + Date.now(),
        email: email || 'google.user@gmail.com',
        name: name || 'Google Explorer',
        role: 'user',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        createdAt: new Date().toISOString()
      };
      onSuccess(mockGoogleUser);
      setLoading(false);
      onClose();
    }, 1000);
  };

  const handleQuickFill = (role: 'admin' | 'privileged' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@ianotes.com');
      setPassword('admin123');
      setName('Admin AI Notes');
    } else if (role === 'privileged') {
      setEmail('privileged@ianotes.com');
      setPassword('privileged123');
      setName('Alex Expert');
    } else {
      setEmail('user@ianotes.com');
      setPassword('user123');
      setName('Santi PromptForge');
    }
  };

  return (
    <div id="auth-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        id="auth-modal-container"
        className="relative w-full max-w-md overflow-hidden bg-[#121214] border border-[#27272a] rounded-2xl glow-blue"
      >
        {/* Background mesh effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="font-display font-bold text-lg text-zinc-100">
              {isLogin ? 'Log In' : 'Create Account'}
            </span>
          </div>
          <button
            onClick={onClose}
            id="close-auth-modal"
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div id="auth-error-alert" className="flex items-start gap-2 p-3 mb-4 text-xs bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* OAuth button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            id="btn-google-auth"
            className="flex items-center justify-center gap-3 w-full py-2.5 px-4 bg-[#18181b] hover:bg-zinc-800 text-sm font-semibold text-zinc-200 border border-[#27272a] rounded-lg transition-colors cursor-pointer"
          >
            <Chrome className="w-4 h-4 text-rose-400" />
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-[#27272a]" />
            <span className="px-3 text-xs text-zinc-600 font-mono">OR WITH YOUR EMAIL</span>
            <div className="flex-1 border-t border-[#27272a]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-display">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Jane Doe"
                    className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 border border-[#27272a] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-display">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 border border-[#27272a] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-zinc-400 font-display">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 border border-[#27272a] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="btn-auth-submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold text-white rounded-lg shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.99] transition-all cursor-pointer mt-2"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Quick Fills */}
          <div className="mt-6 pt-5 border-t border-[#27272a]">
            <span className="block text-[10px] font-mono text-zinc-500 tracking-wider uppercase mb-2">Quick Demo Access</span>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                id="quick-fill-admin"
                className="flex-1 py-1.5 px-2 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] rounded text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold text-zinc-300 font-display">Admin</div>
                <div className="text-[10px] text-zinc-500 font-mono">admin@ianotes.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('privileged')}
                id="quick-fill-privileged"
                className="flex-1 py-1.5 px-2 bg-blue-950/20 hover:bg-blue-950/40 border border-blue-900/30 hover:border-blue-700/40 rounded text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold text-blue-300 font-display flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Privileged</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">privileged@ianotes.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('user')}
                id="quick-fill-user"
                className="flex-1 py-1.5 px-2 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] rounded text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold text-zinc-300 font-display">Regular User</div>
                <div className="text-[10px] text-zinc-500 font-mono">user@ianotes.com</div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              id="toggle-auth-mode"
              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors cursor-pointer font-sans"
            >
              {isLogin ? "Don't have an account? Sign up for free" : 'Already have an account? Log in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
