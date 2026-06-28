import { useState } from 'react';
import { X, Sparkles, Send, Eye, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils';
import { User, Post } from '../types';
import Markdown from 'react-markdown';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onPostCreated: (post: Post) => void;
}

const AVAILABLE_TAGS = ['prompts', 'best-practices', 'ollama', 'errors', 'general'];

export default function CreatePostModal({ isOpen, onClose, currentUser, onPostCreated }: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['prompts']);
  const [customTag, setCustomTag] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleAddCustomTag = () => {
    const clean = customTag.trim().toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '');
    if (clean) {
      if (!selectedTags.includes(clean)) {
        setSelectedTags([...selectedTags, clean]);
      }
      setCustomTag('');
    }
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
      }
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newPost = await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          tags: selectedTags,
        }),
      });
      onPostCreated(newPost);
      // Reset form
      setTitle('');
      setContent('');
      setSelectedTags(['prompts']);
      setCustomTag('');
      setActiveTab('write');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="create-post-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        id="create-post-container"
        className="relative w-full max-w-2xl bg-[#121214] border border-[#27272a] rounded-2xl glow-blue my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="font-display font-bold text-lg text-zinc-100">Share AI Knowledge</span>
          </div>
          <button
            onClick={onClose}
            id="close-create-post-modal"
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Inputs */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div id="create-post-error" className="p-3 text-xs bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2 font-display">
              Post Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How to bypass rate-limiting with Ollama and key parameters"
              className="w-full px-4 py-2.5 bg-zinc-900/50 border border-[#27272a] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
            />
          </div>

          {/* Markdown Content Section with Write/Preview Tabs */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium text-zinc-400 font-display">
                Content (Markdown supported)
              </label>
              <div className="flex bg-zinc-900/80 border border-[#27272a] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === 'write'
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            <div className="min-h-[200px] border border-[#27272a] bg-zinc-950/40 rounded-xl overflow-hidden">
              {activeTab === 'write' ? (
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="### My Approach&#10;Write down your prompt structures, configurations, or error resolutions here...&#10;&#10;```bash&#10;ollama run deepseek-coder:6.7b&#10;```"
                  className="w-full min-h-[220px] p-4 bg-transparent text-sm text-zinc-300 placeholder-zinc-600 outline-none resize-y"
                />
              ) : (
                <div className="p-5 prose prose-invert max-w-none text-zinc-300 text-sm overflow-y-auto max-h-[300px]">
                  {content.trim() ? (
                    <div className="markdown-body">
                      <Markdown>{content}</Markdown>
                    </div>
                  ) : (
                    <span className="text-zinc-600 italic">Nothing to preview yet. Write some markdown content first!</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-zinc-400 font-display">
                Tags
              </label>
              <span className="text-[10px] text-zinc-500 italic">Select below or add your own</span>
            </div>
            
            {/* Tag suggestions / Active tags list */}
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...AVAILABLE_TAGS, ...selectedTags])).map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`py-1 px-2.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400'
                        : 'bg-[#18181b] border-[#27272a] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2 max-w-xs pt-1">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                placeholder="Type tag (e.g. bobo)"
                className="w-full px-3 py-1.5 bg-zinc-900/50 border border-[#27272a] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-[#27272a] text-xs font-medium text-zinc-300 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-xs font-semibold text-zinc-400 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              id="btn-submit-post"
              className="flex items-center gap-2 py-2 px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white rounded-lg shadow-md transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Publishing...' : 'Publish Post'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
