import { useState, useEffect } from 'react';
import { X, Heart, MessageSquare, Trash2, Reply, Send, CornerDownRight, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { apiFetch, formatRelativeTime, getTagStyles } from '../utils';
import { Post, Comment, User } from '../types';

interface PostDetailsModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLikeToggle: (postId: string, liked: boolean, count: number) => void;
  onDeletePost: (postId: string) => void;
  onRatePost?: (
    postId: string,
    ratings: { [userId: string]: number },
    averageRating: number,
    ratingsCount: number,
    averagePrivilegedRating: number
  ) => void;
}

export default function PostDetailsModal({
  post,
  isOpen,
  onClose,
  currentUser,
  onLikeToggle,
  onDeletePost,
  onRatePost,
}: PostDetailsModalProps) {
  const getUserId = () => currentUser?.id || 
                          (currentUser as any)?.userId || 
                          (currentUser as any)?._id || 
                          localStorage.getItem('ia_notes_user_id') || 
                          '';

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [loadingComments, setLoadingComments] = useState(false);

  // Ratings States
  const [avgRating, setAvgRating] = useState(post.averageRating || 0);
  const [rateCount, setRateCount] = useState(post.ratingsCount || 0);
  const [avgPrivilegedRating, setAvgPrivilegedRating] = useState(post.averagePrivilegedRating || 0);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  // Sync state
  useEffect(() => {
    const currentId = getUserId();
    if (currentUser || currentId) {
      setLiked(post.likedByUserIds.includes(currentId));
      if (post.ratings && post.ratings[currentId]) {
        setUserRating(post.ratings[currentId]);
      } else {
        setUserRating(0);
      }
    } else {
      setLiked(false);
      setUserRating(0);
    }
    setLikesCount(post.likesCount);
    setAvgRating(post.averageRating || 0);
    setRateCount(post.ratingsCount || 0);
    setAvgPrivilegedRating(post.averagePrivilegedRating || 0);
  }, [post, currentUser]);

  // Load comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const data = await apiFetch<Comment[]>(`/api/posts/${post.id}/comments`);
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [post.id, isOpen]);

  if (!isOpen) return null;

  // Handle Post Like Toggle
  const handleLike = async () => {
    const currentId = getUserId();
    if (!currentUser && !currentId) {
      alert('You must log in to like this note');
      return;
    }
    try {
      const data = await apiFetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentId }),
      });
      setLiked(!liked);
      setLikesCount(data.likesCount);
      onLikeToggle(post.id, !liked, data.likesCount);
    } catch (err) {
      console.error('Error liking post', err);
    }
  };

  // Handle Post Rating
  const handleRate = async (score: number) => {
    const currentId = getUserId();
    if (!currentUser && !currentId) {
      alert('You must log in to rate this prompt');
      return;
    }
    setIsRatingLoading(true);
    try {
      const data = await apiFetch<any>(`/api/posts/${post.id}/rate`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentId, score }),
      });
      setUserRating(score);
      setAvgRating(data.averageRating);
      setRateCount(data.ratingsCount);
      setAvgPrivilegedRating(data.averagePrivilegedRating);
      
      if (onRatePost) {
        onRatePost(post.id, data.ratings, data.averageRating, data.ratingsCount, data.averagePrivilegedRating);
      }
    } catch (err) {
      console.error('Error rating post', err);
    } finally {
      setIsRatingLoading(false);
    }
  };

  // Handle Comment creation
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentId = getUserId();
    if (!currentUser && !currentId) {
      alert('You must log in to comment');
      return;
    }
    if (!commentContent.trim()) return;

    try {
      const newComment = await apiFetch<Comment>(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: commentContent,
          userId: currentId,
        }),
      });
      setComments([...comments, newComment]);
      setCommentContent('');
    } catch (err) {
      console.error('Error creating comment', err);
    }
  };

  // Handle Reply creation
  const handleAddReply = async (parentId: string) => {
    const currentId = getUserId();
    if (!currentUser && !currentId) {
      alert('You must log in to reply');
      return;
    }
    if (!replyContent.trim()) return;

    try {
      const newReply = await apiFetch<Comment>(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: replyContent,
          userId: currentId,
          parentId,
        }),
      });

      // Insert new reply into the comments tree locally
      const insertReply = (list: Comment[]): Comment[] => {
        return list.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newReply],
            };
          } else if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: insertReply(c.replies),
            };
          }
          return c;
        });
      };

      setComments(insertReply(comments));
      setReplyContent('');
      setReplyingToId(null);
    } catch (err) {
      console.error('Error adding reply', err);
    }
  };

  // Handle Comment/Reply Deletion
  const handleDeleteComment = async (commentId: string) => {
    const currentId = getUserId();
    if (!currentUser && !currentId) return;
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiFetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: currentId }),
      });

      // Remove comment from tree locally
      const filterComment = (list: Comment[]): Comment[] => {
        return list
          .filter((c) => c.id !== commentId)
          .map((c) => {
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: filterComment(c.replies),
              };
            }
            return c;
          });
      };

      setComments(filterComment(comments));
    } catch (err: any) {
      alert(err.message || 'Error deleting comment');
    }
  };

  // Recursive Comment Renderer
  const renderComment = (comment: Comment, depth = 0) => {
    const currentId = getUserId();
    const isOwner = currentId === comment.userId;
    const isAdmin = currentUser?.role === 'admin';
    const canDelete = isOwner || isAdmin;
    const isReplying = replyingToId === comment.id;

    return (
      <div key={comment.id} className="mt-4" id={`comment-${comment.id}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          <img
            src={comment.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(comment.user.name)}`}
            alt={comment.user.name}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full bg-zinc-850 border border-[#27272a] shrink-0 object-cover"
          />

          <div className="flex-1 min-w-0 bg-[#18181b]/35 hover:bg-[#18181b]/60 border border-[#27272a] rounded-xl p-3.5 transition-colors">
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-xs text-zinc-200">
                  {comment.user.name}
                </span>
                {comment.user.role === 'admin' && (
                  <span className="text-[9px] font-mono py-0.5 px-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded">
                    Admin
                  </span>
                )}
                {comment.userId === post.userId && (
                  <span className="text-[9px] font-mono py-0.5 px-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded">
                    Author
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>

            {/* Comment Body */}
            <p className="text-sm text-zinc-300 break-words whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>

            {/* Actions Bar */}
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#27272a]/60">
              <button
                onClick={() => {
                  if (!currentUser) {
                    alert('Please log in to reply');
                    return;
                  }
                  setReplyingToId(isReplying ? null : comment.id);
                  setReplyContent('');
                }}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors"
              >
                <Reply className="w-3 h-3 text-blue-400" />
                <span>Reply</span>
              </button>

              {canDelete && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="flex items-center gap-1.5 text-xs text-rose-500/70 hover:text-rose-400 cursor-pointer transition-colors ml-auto"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            {/* Reply Input Form inside comment item */}
            <AnimatePresence>
              {isReplying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-[#27272a]/85 overflow-hidden"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder={`Reply to ${comment.user.name}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddReply(comment.id);
                      }}
                      className="flex-1 bg-zinc-950 border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50 transition-colors"
                    />
                    <button
                      onClick={() => handleAddReply(comment.id)}
                      className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Render child replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="pl-6 md:pl-10 mt-2 border-l border-[#27272a] space-y-1">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="post-details-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        id="post-details-container"
        className="relative w-full max-w-3xl h-[85vh] bg-[#121214] border border-[#27272a] rounded-2xl flex flex-col overflow-hidden shadow-2xl glow-blue"
      >
        {/* Background glow mesh */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={post.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(post.user.name)}`}
              alt={post.user.name}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full bg-zinc-850 border border-[#27272a] object-cover"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-semibold text-xs text-zinc-100">
                  {post.user.name}
                </span>
                {post.user.role === 'admin' && (
                  <span className="text-[9px] font-mono py-0.2 px-1 bg-rose-500/15 text-rose-300 border border-rose-500/20 rounded">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block">
                Published {formatRelativeTime(post.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {post.isFeatured && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-medium py-1 px-2.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Featured
              </span>
            )}
            <button
              onClick={onClose}
              id="close-post-details"
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Post Heading & Tags */}
          <div className="space-y-3">
            <h1 className="font-display font-bold text-xl md:text-2xl text-zinc-100 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => {
                const colors = getTagStyles(tag);
                return (
                  <span
                    key={tag}
                    className={`py-0.5 px-2.5 rounded-md border text-[10px] font-mono tracking-wide ${colors.bg} ${colors.text} ${colors.border}`}
                  >
                    #{tag}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Render Markdown Content */}
          <div className="prose-custom border-b border-[#27272a] pb-6">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Post Ratings Section */}
          <div className="bg-[#18181b]/45 border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="block font-display font-bold text-sm text-zinc-200">
                Valoración de la Comunidad
              </span>
              {avgPrivilegedRating > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] py-1 px-2.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                  <Sparkles className="w-3 h-3 text-blue-400 fill-blue-400 animate-pulse" />
                  <span>Sello de Calidad Experta</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Average Stats */}
              <div className="bg-[#121214] border border-[#27272a]/60 rounded-lg p-3.5 flex flex-col justify-center items-center text-center">
                <span className="text-xs font-mono text-zinc-500 mb-1">Puntuación Media</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-amber-400 font-display">
                    {avgRating > 0 ? avgRating : "N/A"}
                  </span>
                  <span className="text-xs text-zinc-500">/ 5</span>
                </div>
                <div className="flex gap-0.5 mt-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= Math.round(avgRating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-zinc-500 mt-2">
                  {rateCount} {rateCount === 1 ? "voto" : "votos"}
                </span>
              </div>

              {/* Expert Stats */}
              <div className="bg-[#121214] border border-[#27272a]/60 rounded-lg p-3.5 flex flex-col justify-center items-center text-center">
                <span className="text-xs font-mono text-zinc-500 mb-1">Criterio Experto</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-blue-400 font-display">
                    {avgPrivilegedRating > 0 ? avgPrivilegedRating : "N/A"}
                  </span>
                  <span className="text-xs text-zinc-500">/ 5</span>
                </div>
                <div className="flex gap-0.5 mt-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= Math.round(avgPrivilegedRating)
                          ? "text-blue-400 fill-blue-400"
                          : "text-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-zinc-500 mt-2 text-center leading-normal max-w-[140px]">
                  {avgPrivilegedRating > 0 ? "Revisado por usuarios distinguidos" : "Sin revisión experta aún"}
                </span>
              </div>

              {/* User rating interaction */}
              <div className="bg-[#121214] border border-[#27272a]/60 rounded-lg p-3.5 flex flex-col justify-center items-center text-center">
                <span className="text-xs font-mono text-zinc-500 mb-1">Tu Valoración</span>
                {currentUser ? (
                  <>
                    <div className="text-xs text-zinc-400 mb-2 font-medium">
                      {userRating > 0 ? `Valoraste con ${userRating} ★` : "Haz clic para valorar"}
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          disabled={isRatingLoading}
                          onClick={() => handleRate(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer disabled:opacity-50"
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${
                              star <= (hoverRating ?? userRating)
                                ? "text-amber-400 fill-amber-400 stroke-amber-400"
                                : "text-zinc-600 hover:text-amber-400/80"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 mt-2">
                      {userRating > 0 ? "Puedes cambiar tu voto" : "Sincronizado"}
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-1">
                    <p className="text-[11px] text-zinc-500 italic max-w-[140px] leading-normal mb-1">
                      Inicia sesión para valorar este prompt.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Likes & Interactions Bar */}
          <div className="flex items-center gap-6 py-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 py-1.5 px-3.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                liked
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:border-zinc-750 hover:text-zinc-200'
              }`}
            >
              <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-rose-500 stroke-rose-400 scale-110' : ''}`} />
              <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
            </button>

            <span className="flex items-center gap-2 text-sm text-zinc-500">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              <span>{comments.length} Comments</span>
            </span>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-4 border-t border-[#27272a]">
            <span className="block font-display font-bold text-sm text-zinc-200">
              Comments
            </span>

            {/* Write comment box */}
            {currentUser ? (
              <form onSubmit={handleAddComment} className="flex gap-3">
                <img
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.name)}`}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full bg-zinc-850 border border-[#27272a] shrink-0 object-cover"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Write your feedback or suggestion for this prompt..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="flex-1 bg-zinc-900/50 border border-[#27272a] focus:border-blue-500/50 rounded-lg px-4 py-2 text-sm text-zinc-200 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer shrink-0 font-sans"
                  >
                    Comment
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 text-center bg-zinc-900/30 border border-[#27272a] rounded-xl">
                <p className="text-xs text-zinc-500">
                  You must sign in to join the discussion and write replies.
                </p>
              </div>
            )}

            {/* Comments list */}
            {loadingComments ? (
              <div className="text-center py-4 text-xs text-zinc-500 font-mono">
                Loading discussion threads...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-1 divide-y divide-zinc-900/30">
                {comments.map((comment) => renderComment(comment))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-zinc-600 font-mono italic">
                No comments yet. Be the first to share your thoughts!
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
