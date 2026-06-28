import { Sparkles, LogIn, LogOut, PlusCircle, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onAuthTrigger: () => void;
  onLogout: () => void;
  onCreatePostTrigger: () => void;
  onLogoClick: () => void;
}

export default function Navbar({
  currentUser,
  onAuthTrigger,
  onLogout,
  onCreatePostTrigger,
  onLogoClick,
}: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-[#27272a]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand logo */}
        <div
          onClick={onLogoClick}
          id="brand-logo-trigger"
          className="flex items-center gap-2 cursor-pointer group transition-transform active:scale-[0.98]"
        >
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/10 group-hover:shadow-blue-500/20 transition-all">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-lg text-zinc-100 tracking-tight group-hover:text-blue-300 transition-colors">
              AI Notes
            </span>
            <span className="text-[9px] font-mono font-medium text-blue-400 tracking-wider -mt-1">
              PROMPTFORGE
            </span>
          </div>
        </div>

        {/* User context & actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              {/* Write note trigger button */}
              <button
                onClick={onCreatePostTrigger}
                id="navbar-cta-create"
                className="flex items-center gap-2 py-1.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-lg shadow-sm shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer font-sans"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">New Note</span>
              </button>

              {/* User profile capsule */}
              <div className="flex items-center gap-2 py-1 px-2.5 bg-zinc-900 border border-[#27272a] rounded-lg">
                <img
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.name)}`}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full bg-zinc-800 object-cover border border-[#27272a]"
                />
                <span className="text-xs font-medium text-zinc-300 max-w-[110px] truncate hidden sm:inline">
                  {currentUser.name.split(' ')[0]}
                </span>
                {currentUser.role === 'admin' ? (
                  <span className="text-[8px] font-mono font-bold tracking-wider py-0.5 px-1 bg-rose-500/15 text-rose-300 border border-rose-500/20 rounded uppercase">
                    Admin
                  </span>
                ) : (
                  <span className="text-[8px] font-mono py-0.5 px-1 bg-zinc-800 text-zinc-400 border border-[#27272a] rounded">
                    User
                  </span>
                )}
              </div>

              {/* Log out */}
              <button
                onClick={onLogout}
                id="navbar-logout"
                title="Log out"
                className="p-2 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 border border-[#27272a] rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-zinc-500 font-mono hidden md:inline">
                Explorer Mode (Read-Only)
              </span>
              <button
                onClick={onAuthTrigger}
                id="navbar-login"
                className="flex items-center gap-1.5 py-1.5 px-4 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-200 border border-[#27272a] rounded-lg transition-all cursor-pointer font-sans"
              >
                <LogIn className="w-4 h-4 text-blue-450" />
                <span>Log In</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
