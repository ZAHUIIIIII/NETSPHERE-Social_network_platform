import React, { useEffect, useState, useRef } from 'react';
import { MessageCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Comment from './Comment';
import { countTotalComments } from '../../lib/utils';
import {
  fetchComments,
  addComment as addCommentAPI,
  editComment as editCommentAPI,
  deleteComment as deleteCommentAPI,
  reactToComment as reactToCommentAPI
} from '../../services/api';

const generateTempId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const CommentsSection = ({ post, currentUser, onCommentCountChange }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [sortBy, setSortBy] = useState('relevant');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    loadComments(true);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [sortBy]);

  // Notify parent of comment count changes using shared utility
  useEffect(() => {
    if (onCommentCountChange) {
      const totalCount = countTotalComments(comments);
      onCommentCountChange(totalCount);
    }
  }, [comments, onCommentCountChange]);

  const loadComments = async (reset = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const result = await fetchComments(post._id, {
        sort: sortBy,
        limit: 20,
        cursor: reset ? '' : cursor
      });

      if (reset) {
        setComments(result.items);
      } else {
        setComments(prev => [...prev, ...result.items]);
      }

      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    const currentText = inputRef.current?.value || '';
    if (!currentText.trim() || submitting) return;

    const savedCommentText = currentText.trim();
    
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setCommentText('');
    setSubmitting(true);

    const tempId = generateTempId();
    const optimisticComment = {
      _id: tempId,
      content: savedCommentText,
      author: {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar
      },
      createdAt: new Date().toISOString(),
      edited: false,
      reactions: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
      userReaction: null,
      parentId: null,
      repliesCount: 0,
      repliesPreview: [],
      isOptimistic: true
    };

    // Add new comment at the bottom
    setComments(prev => [...prev, optimisticComment]);

    try {
      const res = await addCommentAPI(post._id, { 
        content: savedCommentText,
        parentId: null
      });

      // Replace optimistic comment with real one at the bottom
      setComments(prev => {
        const withoutTemp = prev.filter(c => c._id !== tempId);
        return [...withoutTemp, res.comment];
      });
      
      // Scroll to bottom to show new comment
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
      
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      setComments(prev => prev.filter(c => c._id !== tempId));
      setCommentText(savedCommentText);
      if (inputRef.current) {
        inputRef.current.value = savedCommentText;
      }
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId, content) => {
    if (replyingTo === parentId) {
      throw new Error('Reply already in progress');
    }
    
    setReplyingTo(parentId);
    
    // Save old state for rollback
    const oldComments = comments;
    
    try {
      const res = await addCommentAPI(post._id, { content, parentId });
      
      const updateCommentWithReply = (comments) => {
        return comments.map(comment => {
          // If this is the direct parent, add the reply
          if (comment._id === parentId) {
            const replyExists = (comment.repliesPreview || []).some(
              r => r._id === res.comment._id
            );
            if (replyExists) return comment;
            
            return {
              ...comment,
              repliesCount: (comment.repliesCount || 0) + 1,
              repliesPreview: [
                ...(comment.repliesPreview || []),
                res.comment
              ]
            };
          }
          
          // If this comment has replies, search in them recursively
          if (comment.repliesPreview && comment.repliesPreview.length > 0) {
            const updatedReplies = updateCommentWithReply(comment.repliesPreview);
            
            // Only update if the replies actually changed
            if (updatedReplies !== comment.repliesPreview) {
              return {
                ...comment,
                repliesPreview: updatedReplies
              };
            }
          }
          
          return comment;
        });
      };
      
      setComments(prev => updateCommentWithReply(prev));
      toast.success('Reply added!');
    } catch (error) {
      console.error('Error adding reply:', error);
      // Rollback to old state instead of reloading
      setComments(oldComments);
      toast.error('Failed to add reply');
      throw error; // Re-throw so child component knows it failed
    } finally {
      setReplyingTo(null);
    }
  };

  const handleEdit = async (commentId, content) => {
    // Save old state for rollback
    const oldComments = comments;
    
    const updateContent = (comments) => {
      return comments.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            content,
            edited: true,
            editedAt: new Date().toISOString()
          };
        }
        if (comment.repliesPreview) {
          return {
            ...comment,
            repliesPreview: updateContent(comment.repliesPreview)
          };
        }
        return comment;
      });
    };

    // Optimistic update
    setComments(prev => updateContent(prev));

    try {
      await editCommentAPI(post._id, commentId, content);
      toast.success('Comment updated!');
    } catch (error) {
      console.error('Error editing comment:', error);
      // Rollback to old state instead of reloading
      setComments(oldComments);
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async (commentId) => {
    const removeComment = (comments) => {
      return comments
        .filter(c => c._id !== commentId)
        .map(comment => ({
          ...comment,
          repliesPreview: comment.repliesPreview 
            ? removeComment(comment.repliesPreview)
            : []
        }));
    };

    const oldComments = comments;
    setComments(prev => removeComment(prev));

    try {
      await deleteCommentAPI(post._id, commentId);
      toast.success('Comment deleted!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      setComments(oldComments);
      toast.error('Failed to delete comment');
    }
  };

  const handleReact = async (commentId, reactionType) => {
    // Save old state for rollback
    const oldComments = comments;
    
    const updateReaction = (comments) => {
      return comments.map(comment => {
        if (comment._id === commentId) {
          const oldReaction = comment.userReaction;
          const newReactions = { ...comment.reactions };

          if (oldReaction) {
            newReactions[oldReaction] = Math.max(0, (newReactions[oldReaction] || 0) - 1);
          }

          if (oldReaction !== reactionType) {
            newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
          }

          return {
            ...comment,
            reactions: newReactions,
            userReaction: oldReaction === reactionType ? null : reactionType
          };
        }
        if (comment.repliesPreview) {
          return {
            ...comment,
            repliesPreview: updateReaction(comment.repliesPreview)
          };
        }
        return comment;
      });
    };

    // Optimistic update
    setComments(prev => updateReaction(prev));

    try {
      await reactToCommentAPI(post._id, commentId, { reactionType });
    } catch (error) {
      console.error('Error reacting to comment:', error);
      // Rollback to old state instead of reloading everything
      setComments(oldComments);
      toast.error('Failed to add reaction');
    }
  };

  return (
    <div className="bg-white overflow-hidden">
      {/* Sort Menu */}
      <div className="flex items-center justify-between px-3">
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors font-medium"
          >
            <span>Sort: {sortBy === 'relevant' ? 'Most Relevant' : sortBy === 'newest' ? 'Newest' : 'Oldest'}</span>
            <ChevronDown size={16} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>

          {showSortMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowSortMenu(false)}
              />
              <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[180px]">
                <button
                  onClick={() => {
                    setSortBy('relevant');
                    setShowSortMenu(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    sortBy === 'relevant' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Most Relevant
                </button>
                <button
                  onClick={() => {
                    setSortBy('newest');
                    setShowSortMenu(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    sortBy === 'newest' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => {
                    setSortBy('oldest');
                    setShowSortMenu(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    sortBy === 'oldest' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Oldest First
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div ref={containerRef} className="max-h-[450px] overflow-y-auto">
        <div className="px-6 pt-1 pb-0">
          {loading && comments.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No comments yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to comment!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {comments.map(comment => (
                  <Comment
                    key={comment._id}
                    postId={post._id}
                    comment={comment}
                    currentUser={currentUser}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReact={handleReact}
                    depth={0}
                  />
                ))}
              </div>
              
              {hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => loadComments(false)}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More Comments'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Comment Input */}
      <div className="px-6 py-3 border-t border-gray-200 bg-white">
        <div className="flex gap-3 items-center">
          <img 
            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.username}&background=random`}
            alt={currentUser?.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 flex items-center gap-2">
            <textarea
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                // Prevent submission during IME composition (Vietnamese, Chinese, Japanese, Korean keyboards)
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              placeholder="Write a comment..."
              className="flex-1 p-3 pr-3 text-sm text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white resize-none transition-all placeholder:text-gray-400"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || submitting}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex-shrink-0"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;
