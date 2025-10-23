import React, { useEffect, useState, useRef } from 'react';
import { MessageCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { shortTimeLabel } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';
import { joinPostRoom, leavePostRoom, subscribeToCommentEvents } from '../../lib/socket';
import {
  listRootComments,
  listThreadReplies,
  createComment,
  editComment,
  deleteComment,
  reactToComment,
  countTotalComments
} from '../../services/commentApi';
import Comment from './Comment';

const CommentsSection = ({ post, onCommentCountChange }) => {
  const { authUser, socket } = useAuthStore();
  const [rootComments, setRootComments] = useState([]);
  const [expandedThreads, setExpandedThreads] = useState({});
  const [threadReplies, setThreadReplies] = useState({});
  const [threadCursors, setThreadCursors] = useState({});
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rootCursor, setRootCursor] = useState(null);
  const [hasMoreRoots, setHasMoreRoots] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null); // Track which comment has open reply form
  const inputRef = useRef(null);

  // ==================== LOAD ROOT COMMENTS ====================

  const loadRootComments = async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const data = await listRootComments(post._id, {
        limit: 20,
        after: reset ? null : rootCursor
      });

      if (reset) {
        setRootComments(data.items);
      } else {
        setRootComments(prev => [...prev, ...data.items]);
      }

      setRootCursor(data.nextCursor);
      setHasMoreRoots(!!data.nextCursor);

      // Update total count based on ALL loaded comments, not just the current page
      if (onCommentCountChange) {
        const allComments = reset ? data.items : [...rootComments, ...data.items];
        const totalCount = countTotalComments(allComments);
        onCommentCountChange(totalCount);
      }
    } catch (error) {
      console.error('Error loading root comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // ==================== LOAD THREAD REPLIES ====================

  const loadThreadReplies = async (rootId, reset = false) => {
    try {
      const cursor = reset ? null : threadCursors[rootId];
      const data = await listThreadReplies(post._id, rootId, {
        limit: 50,
        after: cursor
      });

      setThreadReplies(prev => ({
        ...prev,
        [rootId]: reset ? data.replies : [...(prev[rootId] || []), ...data.replies]
      }));

      setThreadCursors(prev => ({
        ...prev,
        [rootId]: data.nextCursor
      }));

      if (!expandedThreads[rootId]) {
        setExpandedThreads(prev => ({ ...prev, [rootId]: true }));
      }
    } catch (error) {
      console.error('Error loading thread replies:', error);
      toast.error('Failed to load replies');
    }
  };

  // ==================== CREATE COMMENT ====================

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const newComment = await createComment(post._id, {
        content: commentText.trim()
      });

      // Optimistically add to root comments
      setRootComments(prev => [newComment, ...prev]);
      setCommentText('');
      
      // Update count
      if (onCommentCountChange) {
        onCommentCountChange(countTotalComments([newComment, ...rootComments]));
      }

      toast.success('Comment added!');
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== TOGGLE THREAD ====================

  const toggleThread = async (rootId, directReplies) => {
    if (expandedThreads[rootId]) {
      // Collapse
      setExpandedThreads(prev => ({ ...prev, [rootId]: false }));
    } else {
      // Expand - load if not loaded
      if (!threadReplies[rootId] || threadReplies[rootId].length === 0) {
        if (directReplies > 0) {
          await loadThreadReplies(rootId, true);
        }
      } else {
        setExpandedThreads(prev => ({ ...prev, [rootId]: true }));
      }
    }
  };

  // ==================== HANDLE REPLY SUBMIT ====================

  const handleReplySubmit = async (rootId, immediateParent, content) => {
    try {
      const newReply = await createComment(post._id, {
        content: content.trim(),
        immediateParent
      });

      // Add to thread replies
      setThreadReplies(prev => ({
        ...prev,
        [rootId]: [...(prev[rootId] || []), newReply]
      }));

      // Update root comment's reply count
      setRootComments(prev => {
        const updated = prev.map(c =>
          c._id === rootId
            ? { ...c, directReplies: c.directReplies + 1, totalDescendants: c.totalDescendants + 1 }
            : c
        );
        
        // Update total count when reply is added
        if (onCommentCountChange) {
          onCommentCountChange(countTotalComments(updated));
        }
        
        return updated;
      });

      toast.success('Reply added!');
      return newReply;
    } catch (error) {
      console.error('Error creating reply:', error);
      toast.error('Failed to add reply');
      throw error;
    }
  };

  // ==================== REAL-TIME EVENTS ====================

  useEffect(() => {
    if (!socket || !post._id) return;

    // Join post room
    joinPostRoom(socket, post._id);

    // Subscribe to comment events
    const cleanup = subscribeToCommentEvents(socket, {
      onNewComment: (comment) => {
        console.log('🆕 New comment received:', comment);
        
        // Skip if this comment was created by current user (already added optimistically)
        if (comment.author?._id === authUser?._id) {
          console.log('⏭️ Skipping own comment (already added optimistically)');
          return;
        }
        
        // If root comment, add to root list
        if (!comment.rootId) {
          setRootComments(prev => {
            // Avoid duplicates
            if (prev.some(c => c._id === comment._id)) return prev;
            const updated = [comment, ...prev];
            
            // Update count for new root comment
            if (onCommentCountChange) {
              onCommentCountChange(countTotalComments(updated));
            }
            
            return updated;
          });
        } else {
          // If reply, add to thread
          setThreadReplies(prev => {
            const existing = prev[comment.rootId] || [];
            // Avoid duplicates
            if (existing.some(c => c._id === comment._id)) return prev;
            return {
              ...prev,
              [comment.rootId]: [...existing, comment]
            };
          });

          // Update root comment counters
          setRootComments(prev => {
            const updated = prev.map(c =>
              c._id === comment.rootId
                ? { ...c, directReplies: c.directReplies + 1, totalDescendants: c.totalDescendants + 1 }
                : c
            );
            
            // Update count for new reply
            if (onCommentCountChange) {
              onCommentCountChange(countTotalComments(updated));
            }
            
            return updated;
          });
        }
      },

      onCommentUpdated: (updated) => {
        console.log('✏️ Comment updated:', updated);
        
        // Update in root comments
        setRootComments(prev =>
          prev.map(c => c._id === updated._id ? { ...c, ...updated } : c)
        );

        // Update in thread replies
        if (updated.rootId) {
          setThreadReplies(prev => ({
            ...prev,
            [updated.rootId]: (prev[updated.rootId] || []).map(r =>
              r._id === updated._id ? { ...r, ...updated } : r
            )
          }));
        }
      },

      onCommentDeleted: ({ commentId, postId }) => {
        console.log('🗑️ Comment deleted:', commentId);
        
        // Remove from root comments
        setRootComments(prev => {
          const updated = prev.filter(c => c._id !== commentId);
          
          // Update count after deletion
          if (onCommentCountChange) {
            onCommentCountChange(countTotalComments(updated));
          }
          
          return updated;
        });

        // Remove from all threads
        setThreadReplies(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(rootId => {
            updated[rootId] = updated[rootId].filter(r => r._id !== commentId);
          });
          return updated;
        });
      },

      onCommentReacted: ({ commentId, reactions, userReaction }) => {
        console.log('❤️ Comment reacted:', commentId);
        
        // Update in root comments
        setRootComments(prev =>
          prev.map(c =>
            c._id === commentId
              ? { ...c, reactions, userReaction }
              : c
          )
        );

        // Update in thread replies
        setThreadReplies(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(rootId => {
            updated[rootId] = updated[rootId].map(r =>
              r._id === commentId
                ? { ...r, reactions, userReaction }
                : r
            );
          });
          return updated;
        });
      }
    });

    // Cleanup on unmount
    return () => {
      leavePostRoom(socket, post._id);
      cleanup();
    };
  }, [socket, post._id]);

  // ==================== INITIAL LOAD ====================

  useEffect(() => {
    loadRootComments(true);
  }, [post._id]);

  // ==================== RENDER ====================

  return (
    <div className="space-y-4">
      {/* Add Comment Form */}
      {authUser && (
        <form onSubmit={handleSubmitComment} className="px-3 flex gap-2 items-center">
          <img
            src={authUser.avatar || '/avatar-placeholder.png'}
            alt={authUser.username}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 flex gap-1">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (commentText.trim() && !submitting) {
                    handleSubmitComment(e);
                  }
                }
              }}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f0f2f5]"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4 max-h-[450px] overflow-y-auto px-4">
        {rootComments.map((comment) => (
          <div key={comment._id} className="space-y-2">
            {/* Root Comment */}
            <Comment
              comment={comment}
              currentUser={authUser}
              isReplying={activeReplyId === comment._id}
              onToggleReply={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}
              onReply={(content) => handleReplySubmit(comment._id, comment._id, content)}
              onEdit={async (commentId, content) => {
                const updated = await editComment(commentId, content);
                setRootComments(prev =>
                  prev.map(c => c._id === commentId ? { ...c, ...updated } : c)
                );
              }}
              onDelete={async (commentId) => {
                await deleteComment(commentId);
                setRootComments(prev => {
                  const updated = prev.filter(c => c._id !== commentId);
                  // Update count after deleting root comment
                  if (onCommentCountChange) {
                    onCommentCountChange(countTotalComments(updated));
                  }
                  return updated;
                });
              }}
              onReact={async (commentId, type) => {
                const { reactions, userReaction } = await reactToComment(commentId, type);
                setRootComments(prev =>
                  prev.map(c =>
                    c._id === commentId ? { ...c, reactions, userReaction } : c
                  )
                );
              }}
              level={0}
            />

            {/* Show Replies Button */}
            {comment.directReplies > 0 && (
              <button
                onClick={() => toggleThread(comment._id, comment.directReplies)}
                className="ml-14 text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                {expandedThreads[comment._id] ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide {comment.totalDescendants} {comment.totalDescendants === 1 ? 'reply' : 'replies'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show {comment.totalDescendants} {comment.totalDescendants === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </button>
            )}

            {/* Thread Replies */}
            {expandedThreads[comment._id] && threadReplies[comment._id] && (
              <div className="ml-12 space-y-2 border-l-2 border-gray-300 pl-6">
                {threadReplies[comment._id].map((reply) => (
                  <Comment
                    key={reply._id}
                    comment={reply}
                    currentUser={authUser}
                    isReplying={activeReplyId === reply._id}
                    onToggleReply={() => setActiveReplyId(activeReplyId === reply._id ? null : reply._id)}
                    onReply={(content) => handleReplySubmit(comment._id, reply._id, content)}
                    onEdit={async (commentId, content) => {
                      const updated = await editComment(commentId, content);
                      setThreadReplies(prev => ({
                        ...prev,
                        [comment._id]: prev[comment._id].map(r =>
                          r._id === commentId ? { ...r, ...updated } : r
                        )
                      }));
                    }}
                    onDelete={async (commentId) => {
                      await deleteComment(commentId);
                      
                      // Update thread replies
                      setThreadReplies(prev => ({
                        ...prev,
                        [comment._id]: prev[comment._id].filter(r => r._id !== commentId)
                      }));
                      
                      // Update root comment's descendant count
                      setRootComments(prev => {
                        const updated = prev.map(c =>
                          c._id === comment._id
                            ? { ...c, totalDescendants: Math.max(0, c.totalDescendants - 1) }
                            : c
                        );
                        
                        // Update total count
                        if (onCommentCountChange) {
                          onCommentCountChange(countTotalComments(updated));
                        }
                        
                        return updated;
                      });
                    }}
                    onReact={async (commentId, type) => {
                      const { reactions, userReaction } = await reactToComment(commentId, type);
                      setThreadReplies(prev => ({
                        ...prev,
                        [comment._id]: prev[comment._id].map(r =>
                          r._id === commentId ? { ...r, reactions, userReaction } : r
                        )
                      }));
                    }}
                    level={1}
                  />
                ))}

                {/* Load More Replies */}
                {threadCursors[comment._id] && (
                  <button
                    onClick={() => loadThreadReplies(comment._id, false)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Load more replies...
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Load More Root Comments */}
        {hasMoreRoots && (
          <button
            onClick={() => loadRootComments(false)}
            disabled={loading}
            className="w-full py-2 text-blue-500 hover:text-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more comments'}
          </button>
        )}

        {/* Empty State */}
        {!loading && rootComments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
