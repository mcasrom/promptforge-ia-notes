import { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, SlidersHorizontal, ArrowUpRight, Code, MessageCircle, Mail, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PostCard from './components/PostCard';
import PostDetailsModal from './components/PostDetailsModal';
import CreatePostModal from './components/CreatePostModal';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';

// Utils / Types
import { apiFetch } from './utils';
import { Post, User } from './types';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // PWA installation states
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Posts Feed states
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals visibility
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);

  // App-level Toast messages
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastType(type);
    setToastMessage(msg);
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedUserId = localStorage.getItem('ia_notes_user_id');
      if (storedUserId) {
        try {
          const res = await apiFetch('/api/auth/me', {
            method: 'POST',
            body: JSON.stringify({ userId: storedUserId }),
          });
          setCurrentUser(res.user);
        } catch (err) {
          console.warn('Session expired or user deleted:', err);
          localStorage.removeItem('ia_notes_user_id');
        }
      }
      setAuthLoading(false);
    };

    checkSession();
  }, []);

  // Listen for PWA installation prompts
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      triggerToast('AI Notes successfully installed as a standalone application!', 'success');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          triggerToast('Thank you for installing AI Notes!', 'success');
        }
      } catch (err) {
        console.error('Error triggering PWA install:', err);
      }
      setDeferredPrompt(null);
    } else {
      if (isInstalled) {
        triggerToast('AI Notes is already installed and active as an app!', 'info');
      } else {
        triggerToast('To install, use your browser\'s standard menu (e.g., "Add to Home Screen" or "Install").', 'info');
      }
    }
  };

  // Fetch posts from backend api based on selectedTag and searchQuery
  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTag && selectedTag !== 'all') params.append('tag', selectedTag);
      if (searchQuery.trim()) params.append('search', searchQuery);

      const url = `/api/posts?${params.toString()}`;
      const data = await apiFetch<Post[]>(url);
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      triggerToast('Error loading notes', 'error');
    } finally {
      setPostsLoading(false);
    }
  };

  // Run fetch whenever tag, search query or user changes
  useEffect(() => {
    fetchPosts();
  }, [selectedTag, searchQuery, currentUser]);

  // Handle Login success
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ia_notes_user_id', user.id);
    triggerToast(`Welcome back, ${user.name}!`, 'success');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ia_notes_user_id');
    triggerToast('Successfully logged out', 'info');
  };

  // Handle New Post creation
  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts]);
    triggerToast('Note published successfully!', 'success');
  };

  // Handle Like Toggle
  const handleLikeLocalUpdate = (postId: string, liked: boolean, count: number) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          // Update local likes state
          const updatedLikedUserIds = liked
            ? [...post.likedByUserIds, currentUser?.id || '']
            : post.likedByUserIds.filter((id) => id !== currentUser?.id);

          return {
            ...post,
            likesCount: count,
            likedByUserIds: updatedLikedUserIds,
          };
        }
        return post;
      })
    );
  };

  // Handle Toggle Featured status (Admin Only)
  const handleToggleFeature = async (postId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    try {
      const res = await apiFetch(`/api/posts/${postId}/feature`, {
        method: 'PUT',
        body: JSON.stringify({ userId: currentUser.id }),
      });

      setPosts(
        posts.map((post) => {
          if (post.id === postId) {
            return { ...post, isFeatured: res.isFeatured };
          }
          return post;
        })
      );

      triggerToast(
        res.isFeatured ? 'Note featured successfully' : 'Note removed from featured',
        'success'
      );
    } catch (err) {
      console.error('Error highlighting post', err);
      triggerToast('Could not modify featured status', 'error');
    }
  };

  // Handle Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to permanently delete this note and all its comments?')) return;

    try {
      await apiFetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: currentUser.id }),
      });

      setPosts(posts.filter((post) => post.id !== postId));
      triggerToast('Note deleted successfully', 'success');

      // If viewing the deleted post, close details modal
      if (activePost?.id === postId) {
        setActivePost(null);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error deleting note', 'error');
    }
  };

  const handleLogoClick = () => {
    setSelectedTag('all');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 flex flex-col relative">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onAuthTrigger={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onCreatePostTrigger={() => setIsCreateOpen(true)}
        onLogoClick={handleLogoClick}
      />

      {/* Hero Banner (Shows for unauthenticated or on clean explore views) */}
      {!currentUser && (
        <Hero
          onCtaClick={() => setIsAuthOpen(true)}
          onExploreClick={() => {
            const feedElement = document.getElementById('feed-section');
            if (feedElement) {
              feedElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        />
      )}

      {/* Main Feed Container */}
      <main id="feed-section" className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 mt-16 space-y-8 relative z-10">
        
        {/* Custom logged in Workspace Greeting */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 md:p-6 bg-gradient-to-r from-[#18181b] to-blue-950/10 border border-[#27272a] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h2 className="font-display font-bold text-lg md:text-xl text-zinc-100">
                Hello, {currentUser.name}! 👋
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                You are logged in as <span className="text-blue-400 font-mono font-semibold">{currentUser.role}</span>. You can create notes, write prompts, interact with other members, and refine your instructions.
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer font-sans"
            >
              Forge New Prompt
            </button>
          </motion.div>
        )}

        {/* Filters and Search row */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search prompts, tags, or errors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#121214] border border-[#27272a] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 font-mono"
                >
                  clear
                </button>
              )}
            </div>

            {/* Tags filter slider */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <Filter className="w-4 h-4 text-zinc-600 shrink-0 hidden sm:inline" />
              <div className="flex gap-1.5 shrink-0">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'prompts', label: '#prompts' },
                  { id: 'best-practices', label: '#best-practices' },
                  { id: 'ollama', label: '#ollama' },
                  { id: 'errors', label: '#errors' },
                ].map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(tag.id)}
                    className={`py-1.5 px-3.5 rounded-lg text-xs font-display font-medium cursor-pointer transition-all ${
                      selectedTag === tag.id
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : 'bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-750'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Posts Grid Feed */}
        {postsLoading ? (
          <div className="text-center py-20 space-y-3">
            <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-500 font-mono">Buscando notas del gremio...</p>
          </div>
        ) : posts.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onClick={() => setActivePost(post)}
                  onLikeToggle={(e) => {
                    e.stopPropagation();
                    // trigger like action directly
                    if (!currentUser) {
                      triggerToast('You must log in to like this note', 'info');
                      setIsAuthOpen(true);
                      return;
                    }
                    // Optimistic update done in PostCard, here we sync
                    const liked = post.likedByUserIds.includes(currentUser.id);
                    const newCount = liked ? post.likesCount - 1 : post.likesCount + 1;
                    handleLikeLocalUpdate(post.id, !liked, newCount);

                    // Sync silently with server
                    apiFetch(`/api/posts/${post.id}/like`, {
                      method: 'POST',
                      body: JSON.stringify({ userId: currentUser.id }),
                    }).catch(err => console.error("Error toggling like", err));
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    handleDeletePost(post.id);
                  }}
                  onToggleFeature={(e) => {
                    e.stopPropagation();
                    handleToggleFeature(post.id);
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-16 border border-dashed border-zinc-900 rounded-3xl space-y-3">
            <Code className="w-8 h-8 text-zinc-700 mx-auto" />
            <p className="text-sm text-zinc-400 font-display">No matching notes found</p>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto">
              Try adjusting category filters or search for different keywords.
            </p>
            {currentUser && (
              <button
                onClick={() => {
                  setSelectedTag('all');
                  setSearchQuery('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline font-mono cursor-pointer"
              >
                Reset search
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="mt-auto border-t border-zinc-950 bg-black py-12 relative z-10 text-xs text-zinc-500 font-sans">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Left Column: About Me */}
          <div className="space-y-4 text-left">
            <h3 className="font-display font-semibold text-sm text-zinc-100 tracking-wide uppercase">About Me</h3>
            <p className="text-zinc-400 leading-relaxed max-w-sm">
              I'm an AI Architect and Developer dedicated to exploring agile systems, prompt engineering, and clean code paradigms. I build high-performance tools to help developers optimize their day-to-day workflow with language models.
            </p>
            <div className="flex items-center gap-3 text-zinc-500 font-mono text-[10px]">
              <span>Agile Developer</span>
              <span>•</span>
              <span>Prompt Engineer</span>
            </div>
          </div>

          {/* Center Column: Contact & Support */}
          <div className="space-y-4 text-left">
            <h3 className="font-display font-semibold text-sm text-zinc-100 tracking-wide uppercase">Get in Touch</h3>
            <p className="text-zinc-400 leading-relaxed">
              Have questions about system instructions, custom fine-tuning, or agile architectures? Send me an email directly.
            </p>
            <div className="pt-1">
              <a 
                href="mailto:mcasrom@gmail.com"
                className="inline-flex items-center gap-2.5 py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-[#27272a] hover:border-zinc-700 font-semibold transition-all cursor-pointer text-xs"
              >
                <Mail className="w-4 h-4 text-blue-400" />
                <span>mcasrom@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Right Column: Progressive Web App */}
          <div className="space-y-4 text-left">
            <h3 className="font-display font-semibold text-sm text-zinc-100 tracking-wide uppercase">Install PWA</h3>
            <p className="text-zinc-400 leading-relaxed">
              Access AI Notes (PromptForge) straight from your device home screen with full offline support and lightning-fast loading speeds.
            </p>
            <div className="pt-1">
              {isInstalled ? (
                <div className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold text-xs">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>App Installed & Active</span>
                </div>
              ) : (
                <button
                  onClick={handleInstallApp}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] cursor-pointer text-xs font-sans"
                >
                  <PlusCircle className="w-4 h-4 text-white" />
                  <span>Install Web App</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Bottom copyright alignment */}
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-600 font-mono text-[11px]">
          <span>© 2026 AI Notes (PromptForge) - Agile Community. All rights reserved.</span>
          <div className="flex gap-4 items-center">
            <span className="hover:text-zinc-400 transition-colors">Vercel Ready</span>
            <span>•</span>
            <span className="hover:text-zinc-400 transition-colors">PWA Enabled</span>
          </div>
        </div>
      </footer>

      {/* Modals & Portal Overlays */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onSuccess={handleLoginSuccess}
          />
        )}

        {isCreateOpen && (
          <CreatePostModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            currentUser={currentUser}
            onPostCreated={handlePostCreated}
          />
        )}

        {activePost && (
          <PostDetailsModal
            post={activePost}
            isOpen={!!activePost}
            onClose={() => setActivePost(null)}
            currentUser={currentUser}
            onLikeToggle={(postId, liked, count) => {
              handleLikeLocalUpdate(postId, liked, count);
              // also sync activePost state
              setActivePost({
                ...activePost,
                likesCount: count,
                likedByUserIds: liked
                  ? [...activePost.likedByUserIds, currentUser?.id || '']
                  : activePost.likedByUserIds.filter((id) => id !== currentUser?.id),
              });
            }}
            onDeletePost={handleDeletePost}
            onRatePost={(postId, ratings, avg, count, avgPrivileged) => {
              // Update posts list in state
              setPosts((prevPosts) =>
                prevPosts.map((p) =>
                  p.id === postId
                    ? {
                        ...p,
                        ratings,
                        averageRating: avg,
                        ratingsCount: count,
                        averagePrivilegedRating: avgPrivileged,
                      }
                    : p
                )
              );
              // Update activePost state to keep detail view fully synced
              setActivePost({
                ...activePost,
                ratings,
                averageRating: avg,
                ratingsCount: count,
                averagePrivilegedRating: avgPrivileged,
              });
              triggerToast('¡Valoración registrada con éxito!', 'success');
            }}
          />
        )}
      </AnimatePresence>

      {/* Global Slide-In Toast alerts */}
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
