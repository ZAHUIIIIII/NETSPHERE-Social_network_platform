import React, { useEffect, useState, useRef } from 'react';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Comment from './Comment';
import { shortTimeLabel, countTotalComments } from '../../lib/utils';
import axiosInstance from '../../lib/axios'; // ✅ Use existing axios instance

// ==================== API FUNCTIONS ====================

const fetchComments = async (postId, { sort = 'newest', limit = 20, cursor = '' }) => {
  try {
    const response = await axiosInstance.get(
      `/posts/${postId}/comments?sort=${sort}&limit=${limit}&cursor=${encodeURIComponent(cursor)}`
    );
    return response.data; // { items: [...], nextCursor: '...' }
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

const fetchReplies = async (postId, rootCommentId, { limit = 10, cursor = '' }) => {
  try {
    const response = await axiosInstance.get(
      `/posts/${postId}/comments/${rootCommentId}/replies?limit=${limit}&cursor=${encodeURIComponent(cursor)}`
    );
    return response.data; // { items: [...], nextCursor: '...' }
  } catch (error) {
    console.error('Error fetching replies:', error);
    throw error;
  }
};

const addCommentAPI = async (postId, body) => {
  try {
    const response = await axiosInstance.post(`/posts/${postId}/comment`, body);
    return response.data; // Returns the comment object directly
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

const editCommentAPI = async (postId, commentId, content) => {
  try {
    const response = await axiosInstance.patch(
      `/posts/${postId}/comment/${commentId}`, 
      { content }
    );
    return response.data;
  } catch (error) {
    console.error('Error editing comment:', error);
    throw error;
  }
};

const deleteCommentAPI = async (postId, commentId) => {
  try {
    const response = await axiosInstance.delete(`/posts/${postId}/comment/${commentId}`);
    return response.data; // { ok: true }
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

const reactToCommentAPI = async (postId, commentId, type) => {
  try {
    const response = await axiosInstance.post(
      `/posts/${postId}/comment/${commentId}/react`, 
      { type }
    );
    return response.data; // { userReaction, reactions }
  } catch (error) {
    console.error('Error reacting to comment:', error);
    throw error;
  }
};

// ==================== COMPONENT ====================

const CommentsSection = ({ post, currentUser, onCommentCountChange }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    loadComments(true);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [sortBy, post._id]); // Add post._id dependency

  // Count total comments including replies
  useEffect(() => {
    if (onCommentCountChange) {
      const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replyCount || 0), 0);
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
        setComments(result.items || []);
        setExpandedReplies({}); //  Reset expanded state on sort change
      } else {
        setComments(prev => [...prev, ...(result.items || [])]);
      }

      setCursor(result.nextCursor || null);
      setHasMore(!!result.nextCursor);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error(error.response?.data?.message || 'Failed to load comments');
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

    try {
      const response = await addCommentAPI(post._id, { 
        content: savedCommentText,
        parentId: null
      });

      // Backend returns { comment: {...} }, extract the comment
      const newComment = response.comment || response;
      
      // Initialize empty replies array for new root comments
      if (!newComment.replies) {
        newComment.replies = [];
      }

      // ✅ Add new comment at the top (newest first)
      setComments(prev => [newComment, ...prev]);
      
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentText(savedCommentText);
      if (inputRef.current) {
        inputRef.current.value = savedCommentText;
      }
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (replyData) => {
    const { parentId, replyToUserId, replyToCommentId, content } = replyData;
    
    try {
      const response = await addCommentAPI(post._id, {
        content,
        parentId, // Always points to root
        replyToUserId,
        replyToCommentId
      });

      // Backend returns { comment: {...} }, extract the comment
      const newReply = response.comment || response;

      // ✅ Add reply to the replies array
      setComments(prev => prev.map(comment => {
        if (comment._id === parentId) {
          return {
            ...comment,
            replyCount: (comment.replyCount || 0) + 1,
            replies: [...(comment.replies || []), newReply]
          };
        }
        return comment;
      }));

      // Ensure replies are expanded for the parent
      setExpandedReplies(prev => ({ ...prev, [parentId]: true }));

      toast.success('Reply added!');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error(error.response?.data?.message || 'Failed to add reply');
      throw error;
    }
  };

  const toggleReplies = async (rootCommentId) => {
    const comment = comments.find(c => c._id === rootCommentId);
    const isCurrentlyExpanded = expandedReplies[rootCommentId] || comment?.replies?.length > 0;
    
    if (isCurrentlyExpanded) {
      // Collapse - just update the expanded state
      setExpandedReplies(prev => ({ ...prev, [rootCommentId]: false }));
    } else {
      // Expand - fetch replies if not already loaded
      if (!comment.replies || comment.replies.length === 0) {
        try {
          const result = await fetchReplies(post._id, rootCommentId, { limit: 100 });
          
          setComments(prev => prev.map(c => 
            c._id === rootCommentId ? { ...c, replies: result.items || [] } : c
          ));
        } catch (error) {
          console.error('Error loading replies:', error);
          toast.error(error.response?.data?.message || 'Failed to load replies');
          return;
        }
      }
      
      setExpandedReplies(prev => ({ ...prev, [rootCommentId]: true }));
    }
  };

  const handleEdit = async (commentId, content) => {
    const oldComments = [...comments]; // ✅ Deep copy for rollback
    
    const updateContent = (commentsList) => {
      return commentsList.map(comment => {
        if (comment._id === commentId) {
          return { ...comment, content, isEdited: true };
        }
        if (comment.replies) {
          return { ...comment, replies: updateContent(comment.replies) };
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
      setComments(oldComments); // Rollback
      toast.error(error.response?.data?.message || 'Failed to update comment');
    }
  };

  const handleDelete = async (commentId) => {
    const oldComments = [...comments]; // Deep copy for rollback
    
    const markDeleted = (commentsList) => {
      return commentsList.map(comment => {
        if (comment._id === commentId) {
          return { 
            ...comment, 
            isDeleted: true, 
            content: "This comment was deleted." 
          };
        }
        if (comment.replies) {
          return { ...comment, replies: markDeleted(comment.replies) };
        }
        return comment;
      });
    };

    // Optimistic update
    setComments(prev => markDeleted(prev));

    try {
      await deleteCommentAPI(post._id, commentId);
      toast.success('Comment deleted!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      setComments(oldComments); // Rollback
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleReact = async (commentId, reactionType) => {
    const oldComments = [...comments]; // ✅ Deep copy for rollback
    
    const updateReaction = (commentsList) => {
      return commentsList.map(comment => {
        if (comment._id === commentId) {
          const oldReaction = comment.userReaction;
          const newReactions = { ...comment.reactions };

          // Remove from old reaction
          if (oldReaction) {
            newReactions[oldReaction] = Math.max(0, (newReactions[oldReaction] || 0) - 1);
          }

          // Add to new reaction (toggle behavior)
          if (oldReaction !== reactionType) {
            newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
          }

          return {
            ...comment,
            reactions: newReactions,
            userReaction: oldReaction === reactionType ? null : reactionType
          };
        }
        if (comment.replies) {
          return { ...comment, replies: updateReaction(comment.replies) };
        }
        return comment;
      });
    };

    // Optimistic update
    setComments(prev => updateReaction(prev));

    try {
      await reactToCommentAPI(post._id, commentId, reactionType);
    } catch (error) {
      console.error('Error reacting to comment:', error);
      setComments(oldComments); // Rollback
      toast.error(error.response?.data?.message || 'Failed to add reaction');
    }
  };

  return (
    <div className="bg-white overflow-hidden">
      {/* Sort Menu */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors font-medium"
          >
            <span>Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Most Relevant'}</span>
            <ChevronDown size={16} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>

          {showSortMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowSortMenu(false)}
              />
              <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[180px]">
                {['newest', 'oldest', 'relevant'].map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      sortBy === option ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option === 'newest' ? 'Newest First' : option === 'oldest' ? 'Oldest First' : 'Most Relevant'}
                  </button>
                ))}
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
                  <div key={comment._id}>
                    {/* Root Comment */}
                    <Comment
                      comment={comment}
                      currentUser={currentUser}
                      onReply={handleReply}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onReact={handleReact}
                      depth={0}
                    />

                    {/* Show/Hide Replies Button */}
                    {comment.replyCount > 0 && (
                      <button
                        onClick={() => toggleReplies(comment._id)}
                        className="ml-10 mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                      >
                        {(expandedReplies[comment._id] !== false) && comment.replies?.length > 0 ? (
                          <>
                            <ChevronUp size={14} />
                            <span>Hide {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            <span>View {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Replies - Show if expanded OR if replies already loaded from backend */}
                    {(expandedReplies[comment._id] !== false) && comment.replies && comment.replies.length > 0 && (
                      <div className="space-y-3 mt-2">
                        {comment.replies.map(reply => (
                          <Comment
                            key={reply._id}
                            comment={reply}
                            currentUser={currentUser}
                            onReply={handleReply}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onReact={handleReact}
                            depth={1}
                          />
                        ))}
                      </div>
                    )}
                  </div>
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
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              placeholder="Write a comment..."
              className="flex-1 p-3 text-sm text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white resize-none transition-all placeholder:text-gray-400"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || submitting}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex-shrink-0"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;