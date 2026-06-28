import { Heart, MessageSquare, Trash2, Star, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Post, User } from '../types';
import { formatRelativeTime, getTagStyles } from '../utils';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onClick: () => void;
  onLikeToggle: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleFeature: (e: React.MouseEvent) => void;
}

export default function PostCard({
  post,
  currentUser,
  onClick,
  onLikeToggle,
  onDelete,
  onToggleFeature,
}: PostCardProps) {
  const isOwner = currentUser?.id === post.userId;
  const isAdmin = currentUser?.role === 'admin';
  const canDelete = isOwner || isAdmin;
  const liked = currentUser ? post.likedByUserIds.includes(currentUser.id) : false;

  // Simple snippet of content to show in feed card
  const getSnippet = (text: string) => {
    // strip out markdown formatting for clean snippet text
    const clean = text
      .replace(/[#*`_\[\]()]/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();
    if (clean.length > 140) {
      return clean.slice(0, 140) + '...';
    }
    return clean || 'Click to read the full prompt...';
  };

  return (
    <motion.article
      layout
      onClick={onClick}
      id={`post-card-${post.id}`}
      className={`relative flex flex-col justify-between p-5 md:p-6 bg-[#121214] hover:bg-[#18181b] border ${
        post.isFeatured
          ? 'border-amber-500/30 shadow-md shadow-amber-500/5 bg-gradient-to-br from-[#121214] via-[#121214] to-amber-950/10'
          : 'border-[#27272a] hover:border-zinc-700'
      } rounded-2xl cursor-pointer group transition-all duration-350`}
    >
      {post.isFeatured && (
        <div className="absolute top-0 right-6 -translate-y-1/2 flex items-center gap-1 py-0.5 px-2 bg-amber-500 text-black rounded-full text-[9px] font-mono font-bold tracking-wider uppercase shadow-md shadow-amber-500/20">
          <Sparkles className="w-2.5 h-2.5 fill-black" />
          <span>Featured</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Author info & Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src={post.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(post.user.name)}`}
              alt={post.user.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full bg-zinc-900 border border-[#27272a] shrink-0 object-cover"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-semibold text-xs text-zinc-300">
                  {post.user.name}
                </span>
                {post.user.role === 'admin' && (
                  <span className="text-[9px] font-mono py-0.2 px-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded">
                    Admin
                  </span>
                )}
                {post.user.role === 'privileged' && (
                  <span className="text-[9px] font-mono py-0.2 px-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-blue-400 fill-blue-400" />
                    <span>Privilegiado</span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
          </div>

          {/* Quick moderation buttons if relevant */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {isAdmin && (
              <button
                onClick={onToggleFeature}
                title={post.isFeatured ? 'Remove feature flag' : 'Feature note'}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  post.isFeatured
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    : 'bg-zinc-900/50 border-[#27272a] text-zinc-600 hover:text-amber-500 hover:border-zinc-750'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${post.isFeatured ? 'fill-amber-400' : ''}`} />
              </button>
            )}

            {canDelete && (
              <button
                onClick={onDelete}
                title="Delete note"
                className="p-1.5 bg-zinc-900/50 border border-[#27272a] hover:border-rose-500/30 text-zinc-600 hover:text-rose-400 rounded-lg cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Post Heading & Snippet */}
        <div className="space-y-2">
          <h2 className="font-display font-bold text-base md:text-lg text-zinc-100 group-hover:text-blue-400 transition-colors leading-snug">
            {post.title}
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm leading-relaxed line-clamp-3">
            {getSnippet(post.content)}
          </p>
        </div>
      </div>

      {/* Footer tags and like counter */}
      <div className="flex items-center justify-between gap-4 mt-5 pt-4 border-t border-[#27272a]">
        <div className="flex flex-wrap gap-1">
          {post.tags.map((tag) => {
            const colors = getTagStyles(tag);
            return (
              <span
                key={tag}
                className={`py-0.5 px-2 rounded-md border text-[9px] font-mono tracking-wide ${colors.bg} ${colors.text} ${colors.border}`}
              >
                #{tag}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {post.averageRating !== undefined && post.averageRating > 0 && (
            <div className="flex items-center gap-1 text-xs font-mono text-amber-400" title={`${post.ratingsCount} valoraciones`}>
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span>{post.averageRating}</span>
              <span className="text-[10px] text-zinc-600">({post.ratingsCount})</span>
            </div>
          )}
          {post.averagePrivilegedRating !== undefined && post.averagePrivilegedRating > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono py-0.5 px-1.5 rounded bg-blue-950/25 border border-blue-900/30 text-blue-400" title="Valoración promedio de usuarios privilegiados">
              <Sparkles className="w-2.5 h-2.5 text-blue-400 fill-blue-400 animate-pulse" />
              <span>Expert: {post.averagePrivilegedRating}</span>
            </div>
          )}
          <button
            onClick={onLikeToggle}
            className={`flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
              liked ? 'text-rose-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-500 stroke-rose-400' : ''}`} />
            <span>{post.likesCount}</span>
          </button>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.id ? 'View' : '0'}</span>
          </span>
        </div>
      </div>
    </motion.article>
  );
}
