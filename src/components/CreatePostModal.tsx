import { useState } from 'react';
import { X, Sparkles, HelpCircle, Eye, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { apiFetch } from '../utils';
import { Post, User } from '../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onPostCreated: (post: Post) => void;
}

const AVAILABLE_TAGS = ['prompts', 'best-practices', 'ollama', 'errors', 'general'];

export default function CreatePostModal({
  isOpen,
  onClose,
  currentUser,
  onPostCreated,
}: CreatePostModalProps) {
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
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError('Please fill in the title and content');
      return;
    }

    setLoading(true);

    const resolvedUserId = currentUser?.id || 
                           (currentUser as any)?.userId || 
                           (currentUser as any)?._id || 
                           localStorage.getItem('ia_notes_user_id') || 
                           '';

    try {
      const newPost = await apiFetch<Post>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          tags: selectedTags,
          userId: resolvedUserId,
        }),
      });
      onPostCreated(newPost);
      // Reset
      setTitle('');
      setContent('');
      setSelectedTags(['prompts']);
      setActiveTab('write');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving note');
    } finally {
      setLoading(false);
    }
  };  return (
    <div id="create-post-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        id="create-post-container"
        className="relative w-full max-w-2xl bg-[#121214] border border-[#27272a] rounded-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="font-display font-bold text-lg text-zinc-100">Create New Note or Prompt</span>
          </div>
          <button
            onClick={onClose}
            id="close-create-post"
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div id="create-post-error" className="p-3 text-xs bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-display">
              Descriptive Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ultra-efficient System Prompt to translate COBOL to Rust"
              className="w-full px-4 py-2.5 bg-zinc-900/50 border border-[#27272a] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
            />
          </div>

          {/* Editor & Preview Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-zinc-400 font-display">
                Content (Supports Full Markdown)
              </label>
              <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    activeTab === 'write'
                      ? 'bg-zinc-850 text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-zinc-850 text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {activeTab === 'write' ? (
              <div className="relative">
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Describe your note or write your prompt block. You can use bold, lists, and code blocks, for example:\n\n### My Prompt:\n\`\`\`markdown\nAct as an expert in...\n\`\`\``}
                  className="w-full p-4 bg-zinc-900/50 border border-[#27272a] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors font-mono resize-y"
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-1 text-[10px] text-zinc-600 font-mono pointer-events-none">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Markdown enabled</span>
                </div>
              </div>
            ) : (
              <div className="w-full min-h-[200px] max-h-[350px] p-4 bg-zinc-900/30 border border-[#27272a]/80 rounded-lg overflow-y-auto prose-custom">
                {content.trim() ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p className="text-zinc-600 text-sm font-mono italic">
                    Nothing to preview yet. Type some text or code...
                  </p>
                )}
              </div>
            )}
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
                    className={`py-1.5 px-3.5 rounded-lg border text-xs font-display font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/5'
                        : 'bg-zinc-900/50 border-[#27272a] text-zinc-400 hover:border-zinc-750 hover:text-zinc-300'
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
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-sm font-medium text-zinc-300 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-semibold text-white rounded-lg shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer font-sans"
            >
              {loading ? 'Publishing...' : 'Publish Note'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
