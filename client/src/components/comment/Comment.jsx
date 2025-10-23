import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2, Send, X, Reply } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { shortTimeLabel } from '../../lib/utils';

const REACTION_EMOJIS = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠'
};

const REACTION_COLORS = {
  like: 'text-blue-600',
  love: 'text-red-600',
  haha: 'text-yellow-600',
  wow: 'text-orange-600',
  sad: 'text-blue-500',
  angry: 'text-red-700'
};

const Comment = ({ 
  comment, 
  currentUser, 
  isReplying = false,
  onToggleReply,
  onReply, 
  onEdit,
  onDelete,
  onReact,
  level = 0 // 0 = root, 1 = reply (visual only, can be nested infinitely in data)
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for textareas
  const editTextareaRef = useRef(null);
  const replyTextareaRef = useRef(null);

  const isOwnComment = currentUser?._id === comment.author?._id;

  // Set cursor to end when editing starts
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      const textarea = editTextareaRef.current;
      // Focus the textarea
      textarea.focus();
      // Set cursor to the end
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    }
  }, [isEditing]);

  // Set cursor to end when replying starts and clear content when closing
  useEffect(() => {
    if (isReplying && replyTextareaRef.current) {
      const textarea = replyTextareaRef.current;
      textarea.focus();
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    } else if (!isReplying) {
      // Clear reply content when reply form is closed
      setReplyContent('');
    }
  }, [isReplying]);

  // ==================== HANDLERS ====================

  const handleReact = (reactionType) => {
    onReact(comment._id, reactionType);
    setShowReactionPicker(false);
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onEdit(comment._id, editContent.trim());
      setIsEditing(false);
      toast.success('Comment updated');
    } catch (error) {
      toast.error('Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReply(replyContent.trim());
      setReplyContent('');
      onToggleReply?.(); // Close the reply form
      toast.success('Reply posted');
    } catch (error) {
      toast.error('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onDelete(comment._id);
      setShowDeleteDialog(false);
      toast.success('Comment deleted');level === 0
    } catch (error) {
      toast.error('Failed to delete comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== REACTION SUMMARY ====================

  const totalReactions = Object.values(comment.reactions || {}).reduce((sum, count) => sum + count, 0);
  const topReactions = Object.entries(comment.reactions || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type]) => type);

  // ==================== RENDER ====================

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative"
    >
      <div className="flex gap-2">
        {/* Avatar */}
        <Link to={`/profile/${comment.author?.username}`} className="flex-shrink-0">
          <img
            src={comment.author?.avatar || '/avatar-placeholder.png'}
            alt={comment.author?.username || 'Unknown'}
            className="w-8 h-8 rounded-full object-cover"
          />
        </Link>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Comment Bubble */}
          <div className="inline-block max-w-full relative">
            <div className="rounded-2xl px-3 py-2 bg-[#f0f2f5] relative">
              {/* Content */}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    ref={editTextareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (editContent.trim() && !isSubmitting) {
                          handleEdit();
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 resize-none text-sm"
                    rows="3"
                    disabled={isSubmitting}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEdit}
                      disabled={isSubmitting || !editContent.trim()}
                      className="px-3.5 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(comment.content);
                      }}
                      disabled={isSubmitting}
                      className="px-3.5 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Username and Three Dots Menu Row */}
                  <div className="flex items-center justify-between mb-0.5">
                    <Link 
                      to={`/profile/${comment.author?.username}`}
                      className="font-semibold text-sm hover:underline text-gray-900"
                    >
                      {comment.author?.username || 'Unknown'}
                    </Link>
                    
                    {/* Three dots menu - aligned with username */}
                    {isOwnComment && !comment.isDeleted && (
                      <div className="relative group">
                        <button className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200/50">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          <button
                            onClick={() => setIsEditing(true)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setShowDeleteDialog(true)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Comment text */}
                  <p className="text-sm whitespace-pre-wrap break-words text-gray-900">
                    {comment.isDeleted ? (
                      <span className="italic text-gray-500">
                        (comment deleted)
                      </span>
                    ) : (
                      <>
                        {/* Reply To User - Inline like Facebook */}
                        {comment.replyToSnapshot && (
                          <>
                            <Link 
                              to={`/profile/${comment.replyToSnapshot.username}`}
                              className="font-bold hover:underline text-gray-900"
                            >
                              {comment.replyToSnapshot.username}
                            </Link>
                            {' '}
                          </>
                        )}
                        {comment.content}
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Reaction Summary - Bottom Right Corner of Bubble */}
            {totalReactions > 0 && !isEditing && (
              <div className="absolute -bottom-2 -right-1 flex items-center gap-1 bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-gray-200">
                <div className="flex items-center -space-x-0.5">
                  {topReactions.map((type) => (
                    <span 
                      key={type} 
                      className="text-xs"
                    >
                      {REACTION_EMOJIS[type]}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-700 font-medium">
                  {totalReactions}
                </span>
              </div>
            )}
          </div>

          {/* Actions Bar - Time · Like · Reply */}
          {!isEditing && !comment.isDeleted && (
            <div className="flex items-center gap-2 mt-1 ml-3 text-xs">
              {/* Time */}
              <span className="text-gray-500 font-medium">
                {shortTimeLabel(new Date(comment.createdAt))}
              </span>

              <span className="text-gray-400">·</span>

              {/* Reaction Button */}
              <div className="relative">
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className={`font-semibold hover:underline ${
                    comment.userReaction
                      ? REACTION_COLORS[comment.userReaction]
                      : 'text-gray-600'
                  }`}
                >
                  {comment.userReaction ? REACTION_EMOJIS[comment.userReaction] : 'Like'}
                </button>

                {/* Reaction Picker */}
                {showReactionPicker && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowReactionPicker(false)}
                    />
                    <div className="absolute left-0 bottom-full mb-2 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1.5 flex gap-1 z-20">
                      {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                        <button
                          key={type}
                          onClick={() => handleReact(type)}
                          className="hover:scale-125 transition-transform text-lg p-1"
                          title={type}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <span className="text-gray-400">·</span>

              {/* Reply Button */}
              <button
                onClick={onToggleReply}
                className="font-semibold text-gray-600 hover:underline"
              >
                Reply
              </button>
            </div>
          )}

          {/* Reply Input */}
          {isReplying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex gap-2"
            >
              <img
                src={currentUser?.avatar || '/avatar-placeholder.png'}
                alt={currentUser?.username || 'You'}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 space-y-2">
                <div className="relative">
                  <textarea
                    ref={replyTextareaRef}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (replyContent.trim() && !isSubmitting) {
                          handleReply();
                        }
                      }
                    }}
                    placeholder={`Reply to ${comment.author?.username || 'this comment'}...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-[#f0f2f5] resize-none text-sm"
                    rows="2"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleReply}
                    disabled={isSubmitting || !replyContent.trim()}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Posting...' : 'Reply'}
                  </button>
                  <button
                    onClick={() => {
                      onToggleReply?.();
                      setReplyContent('');
                    }}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-bold mb-2 text-gray-900">Delete Comment?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. Your comment will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Comment;
