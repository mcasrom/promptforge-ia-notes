import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Cpu, 
  Terminal, 
  FileText, 
  Filter, 
  Check, 
  ChevronsUpDown, 
  Share2, 
  GitBranch, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import Navbar from './components/Navbar';
import PostCard from './components/PostCard';
import PostDetailsModal from './components/PostDetailsModal';
import CreatePostModal from './components/CreatePostModal';
import AuthModal from './components/AuthModal';
import { apiFetch } from './utils';
import { Post, User } from './types';

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation / Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'discussed'>('latest');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);

  // App metrics
  const [metrics, setMetrics] = useState({
    totalPrompts: 0,
    totalLikes: 0,
    totalContributors: 0
  });

  // Fetch initial system data
  useEffect(() => {
    async function loadData() {
      try {
        const [postsData, userResponse] = await Promise.all([
          apiFetch('/api/posts'),
          apiFetch('/api/auth/me').catch(() => null)
        ]);
        setPosts(postsData);
        if (userResponse?.user) {
          setCurrentUser(userResponse.user);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute metrics from current posts
  useEffect(() => {
    if (posts.length === 0) return;
    const totalLikes = posts.reduce((sum, post) => sum + (post.likedByUserIds?.length || 0), 0);
    const uniqueUsers = new Set(posts.map((p) => p.user.id));
    setMetrics({
      totalPrompts: posts.length,
      totalLikes,
      totalContributors: uniqueUsers.size
    });
  }, [posts]);

  // Handle post interactions
  const handleLike = async (postId: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const updatedPost = await apiFetch(`/api/posts/${postId}/like`, { method: 'POST' });
      // Update local posts list state
      setPosts(posts.map((post) => post.id === postId ? updatedPost : post));
      
      // Update details modal if currently open for this post
      if (activePost && activePost.id === postId) {
        setActivePost(updatedPost);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const response = await apiFetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      
      // The endpoint returns the newly created comment object
      const updatedPosts = posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), response.comment]
          };
        }
        return post;
      });
      setPosts(updatedPosts);

      // Keep current active post in sync
      if (activePost && activePost.id === postId) {
        setActivePost({
          ...activePost,
          comments: [...(activePost.comments || []), response.comment]
        });
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
      setPosts(posts.filter((post) => post.id !== postId));
      if (activePost?.id === postId) {
        setActivePost(null);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  // Filter & Sort Logic
  const filteredPosts = posts
    .filter((post) => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTag === 'all' || post.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.likedByUserIds?.length || 0) - (a.likedByUserIds?.length || 0);
      }
      if (sortBy === 'discussed') {
        return (b.comments?.length || 0) - (a.comments?.length || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-100">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

      <Navbar 
        currentUser={currentUser} 
        onAuthClick={() => setIsAuthOpen(true)}
        onSignOut={() => setCurrentUser(null)}
      />

      {/* Hero Banner Grid / Stats */}
      <header className="relative w-full border-b border-[#1f1f23] bg-zinc-950/20 pt-14 pb-12 sm:pt-16 sm:pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Title & Slogan */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] sm:text-xs font-mono font-medium text-blue-300">Prompt Engineering & Local LLMs</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 leading-[1.1]">
                IA Notes Repository
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 max-w-xl font-sans leading-relaxed">
                Unlock prompt engineering patterns, error diagnostics, and configurations for local execution with Ollama. Share, test, and discuss AI concepts.
              </p>
              
              {/* Primary CTA controls */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (!currentUser) setIsAuthOpen(true);
                    else setIsCreateOpen(true);
                  }}
                  id="btn-main-share"
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99] rounded-xl text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/15 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Share Knowledge Note</span>
                </button>
                <a
                  href="#explorer"
                  className="px-4 py-2.5 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] rounded-xl text-xs sm:text-sm font-medium text-zinc-300 transition-colors"
                >
                  Explore Prompts
                </a>
              </div>
            </div>

            {/* Quick Metrics display */}
            <div className="lg:col-span-5 grid grid-cols-3 gap-3 md:gap-4">
              {[
                { label: 'Prompt Notes', value: loading ? '...' : metrics.totalPrompts, icon: FileText, color: 'text-blue-400' },
                { label: 'Total Appreciations', value: loading ? '...' : metrics.totalLikes, icon: Sparkles, color: 'text-indigo-400' },
                { label: 'Experts Active', value: loading ? '...' : metrics.totalContributors, icon: Cpu, color: 'text-emerald-400' }
              ].map((metric, i) => (
                <div 
                  key={i} 
                  className="p-4 rounded-2xl bg-[#0f0f11] border border-[#27272a]/80 flex flex-col justify-between h-28 sm:h-32 transition-all hover:border-[#38383e]"
                >
                  <div className="flex justify-between items-start">
                    <div className="p-1.5 rounded-lg bg-zinc-900">
                      <metric.icon className={`w-4 h-4 ${metric.color}`} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-display font-black text-zinc-100">{metric.value}</div>
                    <div className="text-[10px] text-zinc-500 font-medium font-mono uppercase tracking-wider">{metric.label}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </header>

      {/* Filter and Content section */}
      <main id="explorer" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        
        {/* Navigation, Search and Tag Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-3 border-b border-[#1f1f23]">
          
          {/* Tags filter slider */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <Filter className="w-4 h-4 text-zinc-600 shrink-0 hidden sm:inline" />
            <div className="flex gap-1.5 shrink-0">
              {(() => {
                const defaultTags = ['prompts', 'best-practices', 'ollama', 'errors'];
                const postsTags = posts.flatMap((p) => p.tags || []);
                const uniqueTags = Array.from(new Set([...defaultTags, ...postsTags])).filter(Boolean);
                const filterOptions = [
                  { id: 'all', label: 'All' },
                  ...uniqueTags.map((tag) => ({ id: tag, label: `#${tag}` })),
                ];
                return filterOptions.map((tag) => (
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
                ));
              })()}
            </div>
          </div>

          {/* Search bar & Sorting Selector */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompt, model configs..."
                className="w-full pl-9 pr-4 py-2 bg-[#101012] border border-[#27272a] focus:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-300 placeholder-zinc-600 outline-none transition-colors"
              />
            </div>

            {/* Sort Dropdown Selector */}
            <div className="flex items-center gap-1.5 bg-[#101012] border border-[#27272a] rounded-xl p-1 shrink-0 self-end sm:self-auto">
              {[
                { id: 'latest', label: 'Latest' },
                { id: 'popular', label: 'Popular' },
                { id: 'discussed', label: 'Discussed' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as any)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    sortBy === opt.id
                      ? 'bg-[#1e1e22] text-zinc-200 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Dynamic Post Cards List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="h-64 rounded-2xl bg-[#0f0f11]/60 border border-[#27272a]/60 animate-pulse flex flex-col justify-between p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-zinc-800 rounded w-1/3" />
                  <div className="h-6 bg-zinc-800 rounded w-5/6" />
                  <div className="h-4 bg-zinc-800 rounded w-full" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-800" />
                  <div className="h-4 bg-zinc-800 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser}
                onLike={handleLike}
                onOpenDetails={setActivePost}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#0f0f11]/30 border border-[#27272a]/40 rounded-3xl">
            <HelpCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-300 font-display">No Knowledge Notes Found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Try adjusting category filters or search for different keywords.
            </p>
          </div>
        )}

      </main>

      {/* Floating Plus CTA on Mobile when logged in */}
      {currentUser && (
        <div className="fixed bottom-6 right-6 sm:hidden z-40">
          <button
            onClick={() => setIsCreateOpen(true)}
            id="mobile-fab-create-post"
            className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-[#1f1f23] bg-zinc-950/40 py-8 mt-12 text-zinc-600 text-xs text-center font-mono space-y-2">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-600" />
            <span>IA Notes platform • Powered by Deepseek & Ollama patterns</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-zinc-300 cursor-help">Documentation</span>
            <span className="hover:text-zinc-300 cursor-pointer">API Specs</span>
            <span className="hover:text-zinc-300 cursor-pointer flex items-center gap-1">
              <span>Local Setup</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </footer>

      {/* Modal overlays using AnimatePresence */}
      <AnimatePresence>
        {isCreateOpen && (
          <CreatePostModal 
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            currentUser={currentUser}
            onPostCreated={(newPost) => {
              setPosts([newPost, ...posts]);
            }}
          />
        )}

        {activePost && (
          <PostDetailsModal 
            post={activePost}
            isOpen={!!activePost}
            onClose={() => setActivePost(null)}
            currentUser={currentUser}
            onLike={handleLike}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
          />
        )}

        {isAuthOpen && (
          <AuthModal 
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onSuccess={(user) => {
              setCurrentUser(user);
              setIsAuthOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}