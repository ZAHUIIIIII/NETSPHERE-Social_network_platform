import React, { useState } from 'react';
import { Heart, Reply, MoreHorizontal, Edit2, Trash2, Send, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatTime } from '../../lib/utils';

// Main Comment Component
const Comment = ({ 
  comment, 
  currentUser, 
  onReply, 
  onEdit,
  onDelete,
  onReact,
  depth = 0,
  postId
}) => {
  const [showReplies, setShowReplies] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const isOwnComment = currentUser?._id === comment.author._id;
  const canReply = true; // Always allow replies
  
  // Get replies to display
  const replies = comment.repliesPreview || [];
  const totalReplies = comment.repliesCount || 0;
  
  // Only show toggle button at depth 0 (parent comments)
  const showToggleButton = depth === 0 && replies.length > 0;

  const handleReact = (reactionType) => {
    onReact(comment._id, reactionType);
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
        await onReply(comment._id, replyContent.trim());
        setReplyContent('');
        setIsReplying(false);
        setShowReplies(true);
      } catch (error) {
        console.error('Failed to submit reply:', error);
      } finally {
        setIsSubmittingReply(false);
      }
    }
  };

  const handleDelete = () => {
    onDelete(comment._id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`${depth > 0 ? 'ml-10 mt-3 relative' : ''}`}
      >
        {/* Vertical Line and Curved Connector for Replies */}
        {depth > 0 && (
          <>
            {/* Vertical line connecting replies */}
            <div 
              className="absolute left-[-20px] w-[2px] bg-gray-300"
              style={{ 
                top: '-12px',
                height: 'calc(100% + 12px)'
              }}
            />
            
            {/* Curved horizontal line pointing to avatar */}
            <div 
              className="absolute left-[-20px] top-[5px] w-[20px] h-[16px] border-l-2 border-b-2 border-gray-300"
              style={{ 
                borderBottomLeftRadius: '8px',
                borderTopColor: 'transparent',
                borderRightColor: 'transparent'
              }}
            />
          </>
        )}
        
        <div className="flex space-x-2">
          {/* Avatar */}
          <img
            src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.username}&background=random`}
            alt={comment.author.username}
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
                      className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditContent(comment.content);
                        setIsEditing(false);
                      }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-sm text-gray-900 mb-0.5">
                    {comment.author.username}
                    {comment.edited && (
                      <span className="ml-1 text-xs text-gray-500 font-normal">(edited)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">{comment.content}</p>
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
                      handleReact(comment.userReaction); // Toggle off current reaction
                    } else {
                      handleReact('like'); // Default to like on click
                    }
                  }}
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => {
                    setTimeout(() => setShowReactionPicker(false), 3000);
                  }}
                  className={`text-xs font-semibold transition-colors hover:underline ${
                    comment.userReaction === 'like' ? 'text-blue-600' :
                    comment.userReaction === 'love' ? 'text-red-600' :
                    comment.userReaction === 'haha' ? 'text-yellow-600' :
                    comment.userReaction === 'wow' ? 'text-orange-600' :
                    comment.userReaction === 'sad' ? 'text-blue-500' :
                    comment.userReaction === 'angry' ? 'text-red-700' :
                    'text-gray-600'
                  }`}
                >
                  {comment.userReaction === 'like' && 'Like'}
                  {comment.userReaction === 'love' && 'Love'}
                  {comment.userReaction === 'haha' && 'Haha'}
                  {comment.userReaction === 'wow' && 'Wow'}
                  {comment.userReaction === 'sad' && 'Sad'}
                  {comment.userReaction === 'angry' && 'Angry'}
                  {!comment.userReaction && 'Like'}
                </button>

                {/* Reaction Picker */}
                {showReactionPicker && (
                  <div 
                    className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-xl border border-gray-200 px-2 py-2 flex space-x-1 z-30"
                    onMouseEnter={() => setShowReactionPicker(true)}
                    onMouseLeave={() => setShowReactionPicker(false)}
                  >
                    <button
                      onClick={() => { handleReact('like'); setShowReactionPicker(false); }}
                      className="hover:scale-125 transition-transform text-xl p-1 rounded-full hover:bg-gray-100"
                      title="Like"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => { handleReact('love'); setShowReactionPicker(false); }}
                      className="hover:scale-125 transition-transform text-xl p-1 rounded-full hover:bg-gray-100"
                      title="Love"
                    >
                      ❤️
                    </button>
                    <button
                      onClick={() => { handleReact('haha'); setShowReactionPicker(false); }}
                      className="hover:scale-125 transition-transform text-xl p-1 rounded-full hover:bg-gray-100"
                      title="Haha"
                    >
                      😂
                    </button>
                    <button
                      onClick={() => { handleReact('wow'); setShowReactionPicker(false); }}
                      className="hover:scale-125 transition-transform text-xl p-1 rounded-full hover:bg-gray-100"
                      title="Wow"
                    >
                      😮
                    </button>
                    <button
                      onClick={() => { handleReact('sad'); setShowReactionPicker(false); }}
                      className="hover:scale-125 transition-transform text-xl p-1 rounded-full hover:bg-gray-100"
                      title="Sad"
                    >
                      😢
                    </button>
                    <button
                      onClick={() => { handleReact('angry'); setShowReactionPicker(false); }}
                      className="hover:scale-125 transition-transform text-xl p-1 rounded-full hover:bg-gray-100"
                      title="Angry"
                    >
                      😠
                    </button>
                  </div>
                )}
              </div>

              {/* Reaction Count Display */}
              {(() => {
                const total = Object.values(comment.reactions || {}).reduce((sum, count) => sum + (count || 0), 0);
                if (total > 0) {
                  return (
                    <div className="flex items-center space-x-1">
                      {comment.reactions.like > 0 && <span className="text-sm">👍</span>}
                      {comment.reactions.love > 0 && <span className="text-sm">❤️</span>}
                      {comment.reactions.haha > 0 && <span className="text-sm">😂</span>}
                      {comment.reactions.wow > 0 && <span className="text-sm">😮</span>}
                      {comment.reactions.sad > 0 && <span className="text-sm">😢</span>}
                      {comment.reactions.angry > 0 && <span className="text-sm">😠</span>}
                      <span className="text-xs text-gray-600">{total}</span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Dot Separator */}
              <span className="text-xs text-gray-400">·</span>

              {canReply && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-xs text-gray-600 font-semibold transition-colors hover:underline"
                >
                  Reply
                </button>
              )}

              {/* Dot Separator */}
              <span className="text-xs text-gray-400">·</span>

              <span className="text-xs text-gray-500">
                {formatTime(comment.createdAt)}
              </span>

              {isOwnComment && !isEditing && (
                <>
                  {/* Dot Separator */}
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
                        placeholder={`Reply to ${comment.author.username}...`}
                        className="w-full min-h-[44px] max-h-[200px] resize-none p-3 pr-12 bg-gray-100 text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                        autoFocus
                        onKeyDown={(e) => {
                          // Prevent submission during IME composition (Vietnamese, Chinese, Japanese, Korean keyboards)
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

            {/* Replies - Only show toggle at depth 0 */}
            {showToggleButton && (
              <div className="mt-2">
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:underline mb-2"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      <span>Hide replies</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      <span>Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {showReplies && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {replies.map((reply) => (
                        <Comment
                          key={reply._id}
                          postId={postId}
                          comment={reply}
                          currentUser={currentUser}
                          onReply={onReply}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onReact={onReact}
                          depth={1}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Comment</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this comment? This action cannot be undone.
              {replies.length > 0 && (
                <span className="block mt-2 font-medium">
                  This will also delete {replies.length} {replies.length === 1 ? 'reply' : 'replies'}.
                </span>
              )}
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
