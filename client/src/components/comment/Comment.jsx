import React, { useState } from 'react';
import { MoreHorizontal, Edit2, Trash2, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  onReply, 
  onEdit,
  onDelete,
  onReact,
  depth = 0
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const isOwnComment = currentUser?._id === comment.user?._id;
  const isRootComment = depth === 0;

  const handleReact = (reactionType) => {
    onReact(comment._id, reactionType);
    setShowReactionPicker(false);
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment._id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleReply = async () => {
    if (replyContent.trim() && !isSubmittingReply) {
      setIsSubmittingReply(true);
      try {
        // Pass target comment info for reply metadata
        await onReply({
          parentId: comment.parentId || comment._id, // Always point to root
          replyToUserId: comment.user._id,
          replyToCommentId: comment._id,
          content: replyContent.trim()
        });
        setReplyContent('');
        setIsReplying(false);
      } catch (error) {
        console.error('Failed to submit reply:', error);
        toast.error('Failed to post reply');
      } finally {
        setIsSubmittingReply(false);
      }
    }
  };

  const handleDelete = () => {
    onDelete(comment._id);
    setShowDeleteDialog(false);
  };

  // Calculate total reactions
  const totalReactions = Object.values(comment.reactions || {}).reduce((sum, count) => sum + count, 0);

  // Get top 2 reaction types for display
  const topReactions = Object.entries(comment.reactions || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type]) => type);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`${depth > 0 ? 'ml-10 mt-3' : ''}`}
      >
        <div className="flex space-x-2">
          {/* Avatar */}
          <img
            src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${comment.user?.name}&background=random`}
            alt={comment.user?.name}
            className="h-8 w-8 rounded-full object-cover flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            {/* Comment bubble */}
            <div className="inline-block bg-gray-100 rounded-2xl px-3 py-2 max-w-full">
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[60px] p-2 bg-white text-gray-900 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEdit}
                      className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditContent(comment.content);
                        setIsEditing(false);
                      }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-sm text-gray-900 mb-0.5">
                    {comment.user?.name}
                    {comment.isEdited && (
                      <span className="ml-1 text-xs text-gray-500 font-normal">(edited)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                    {/* Show "Replying to" inline with comment text for Level 2 */}
                    {comment.replyToSnapshot && (
                      <>
                        <a 
                          href={`/profile/${comment.replyToSnapshot.username || comment.replyToSnapshot.name}`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/profile/${comment.replyToSnapshot.username || comment.replyToSnapshot.name}`;
                          }}
                          className="font-semibold text-gray-900 hover:underline cursor-pointer"
                        >
                          {comment.replyToSnapshot.name}
                        </a>
                        {' '}
                      </>
                    )}
                    {comment.content}
                  </p>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 mt-1 px-3">
              {/* Reaction Button with Picker */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (comment.userReaction) {
                      handleReact(comment.userReaction); // Toggle off
                    } else {
                      handleReact('like'); // Default like
                    }
                  }}
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => setTimeout(() => setShowReactionPicker(false), 200)}
                  className={`text-xs font-semibold transition-colors hover:underline ${
                    comment.userReaction ? REACTION_COLORS[comment.userReaction] : 'text-gray-600'
                  }`}
                >
                  {comment.userReaction ? comment.userReaction.charAt(0).toUpperCase() + comment.userReaction.slice(1) : 'Like'}
                </button>

                {/* Reaction Picker */}
                {showReactionPicker && (
                  <div 
                    className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-xl border border-gray-200 px-2 py-2 flex space-x-1 z-30"
                    onMouseEnter={() => setShowReactionPicker(true)}
                    onMouseLeave={() => setShowReactionPicker(false)}
                  >
                    {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                      <button
                        key={type}
                        onClick={() => handleReact(type)}
                        className="hover:scale-125 transition-transform text-xl p-1 rounded-full hover:bg-gray-100"
                        title={type.charAt(0).toUpperCase() + type.slice(1)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reaction Summary */}
              {totalReactions > 0 && (
                <div className="flex items-center space-x-1">
                  {topReactions.map(type => (
                    <span key={type} className="text-sm">{REACTION_EMOJIS[type]}</span>
                  ))}
                  <span className="text-xs text-gray-600">{totalReactions}</span>
                </div>
              )}

              <span className="text-xs text-gray-400">·</span>

              {/* Reply button - only show if not at max depth */}
              {depth < 1 && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-xs text-gray-600 font-semibold hover:underline"
                >
                  Reply
                </button>
              )}

              <span className="text-xs text-gray-400">·</span>

              {/* Time label (no hover tooltip) */}
              <span className="text-xs text-gray-500">
                {shortTimeLabel(comment.createdAt)}
              </span>

              {/* Edit/Delete menu for own comments */}
              {isOwnComment && !isEditing && (
                <>
                  <span className="text-xs text-gray-400">·</span>
                  <div className="relative group">
                    <button className="text-gray-500 hover:text-gray-700 transition-colors">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute right-0 bottom-full mb-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
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
                </>
              )}
            </div>

            {/* Reply Input */}
            {isReplying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className="flex space-x-2 items-start">
                  <img
                    src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.username}&background=random`}
                    alt={currentUser?.username}
                    className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 flex items-start space-x-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Reply to ${comment.user?.name}...`}
                        className="w-full min-h-[44px] max-h-[200px] resize-none p-3 pr-12 bg-gray-100 text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            handleReply();
                          }
                        }}
                        rows={1}
                      />
                    </div>
                    <button
                      onClick={handleReply}
                      disabled={!replyContent.trim() || isSubmittingReply}
                      className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      title="Send reply"
                    >
                      {isSubmittingReply ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsReplying(false);
                        setReplyContent('');
                      }}
                      className="p-2.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Comment</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Comment;