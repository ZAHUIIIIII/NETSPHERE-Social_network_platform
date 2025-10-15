// client/src/components/comment/CommentsSection.jsx
import React, { useEffect, useState } from 'react';
import { MessageCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Comment from './Comment';
import {
  fetchComments,
  addComment as addCommentAPI,
  editComment as editCommentAPI,
  deleteComment as deleteCommentAPI,
  reactToComment as reactToCommentAPI
} from '../../services/api';

const CommentsSection = ({ post, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [sortBy, setSortBy] = useState('relevant');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Load comments on mount and when sort changes
  useEffect(() => {
    loadComments(true);
  }, [sortBy]);

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
      toast.error('Không thể tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const tempId = Date.now().toString();
    const optimisticComment = {
      _id: tempId,
      content: commentText.trim(),
      author: {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar
      },
      createdAt: new Date().toISOString(),
      edited: false,
      likes: [],
      isLiked: false,
      reactions: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
      userReaction: null,
      parentId: null,
      repliesCount: 0
    };

    // Optimistic update
    setComments(prev => [optimisticComment, ...prev]);
    setCommentText('');

    try {
      const res = await addCommentAPI(post._id, { 
        content: commentText.trim(),
        parentId: null
      });

      // Replace optimistic comment with real one
      setComments(prev => prev.map(c => 
        c._id === tempId ? res.comment : c
      ));
      
      toast.success('Đã thêm bình luận!');
    } catch (error) {
      console.error('Error adding comment:', error);
      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => c._id !== tempId));
      toast.error('Không thể thêm bình luận');
    }
  };

  const handleReply = async (parentId, content) => {
    try {
      const res = await addCommentAPI(post._id, { 
        content, 
        parentId 
      });
      
      // Add reply to the appropriate parent comment
      const updateComments = (comments) => {
        return comments.map(comment => {
          if (comment._id === parentId) {
            return {
              ...comment,
              repliesCount: (comment.repliesCount || 0) + 1,
              repliesPreview: [
                ...(comment.repliesPreview || []),
                res.comment
              ]
            };
          }
          return comment;
        });
      };
      
      setComments(updateComments(comments));
      toast.success('Đã thêm phản hồi!');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Không thể thêm phản hồi');
    }
  };

  const handleEdit = async (commentId, content) => {
    // Optimistic update
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

    const previousComments = [...comments];
    setComments(updateContent(comments));

    try {
      await editCommentAPI(post._id, commentId, content);
      toast.success('Đã cập nhật bình luận!');
    } catch (error) {
      console.error('Error editing comment:', error);
      setComments(previousComments); // Rollback
      toast.error('Không thể chỉnh sửa bình luận');
    }
  };

  const handleReact = async (commentId, type) => {
    // Optimistic update
    const updateReaction = (comments) => {
      return comments.map(comment => {
        if (comment._id === commentId) {
          const newReactions = { ...comment.reactions };
          const oldReaction = comment.userReaction;

          // Remove from old reaction
          if (oldReaction) {
            newReactions[oldReaction] = Math.max(0, (newReactions[oldReaction] || 0) - 1);
          }

          // Toggle or add new reaction
          const newUserReaction = oldReaction === type ? null : type;
          if (newUserReaction) {
            newReactions[type] = (newReactions[type] || 0) + 1;
          }

          return {
            ...comment,
            reactions: newReactions,
            userReaction: newUserReaction,
            isLiked: type === 'like' && newUserReaction !== null
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

    const previousComments = [...comments];
    setComments(updateReaction(comments));

    try {
      await reactToCommentAPI(post._id, commentId, type);
    } catch (error) {
      console.error('Error reacting to comment:', error);
      setComments(previousComments); // Rollback
      toast.error('Không thể phản ứng');
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    // Optimistic update
    const previousComments = [...comments];
    const removeComment = (comments) => {
      return comments.filter(comment => {
        if (comment._id === commentId) return false;
        if (comment.repliesPreview) {
          comment.repliesPreview = removeComment(comment.repliesPreview);
        }
        return true;
      });
    };
    
    setComments(removeComment(comments));

    try {
      await deleteCommentAPI(post._id, commentId);
      toast.success('Đã xóa bình luận');
    } catch (error) {
      console.error('Error deleting comment:', error);
      setComments(previousComments); // Rollback
      toast.error('Không thể xóa bình luận');
    }
  };

  const sortOptions = [
    { 
      value: 'relevant', 
      label: 'Phù hợp nhất', 
      desc: 'Hiển thị bình luận của bạn bè và những bình luận có nhiều lượt tương tác nhất trước tiên.' 
    },
    { 
      value: 'newest', 
      label: 'Mới nhất', 
      desc: 'Hiển thị tất cả bình luận, mới nhất trước tiên.' 
    },
    { 
      value: 'all', 
      label: 'Tất cả bình luận', 
      desc: 'Hiển thị tất cả bình luận, bao gồm cả nội dung có thể là spam.' 
    }
  ];

  const currentSort = sortOptions.find(opt => opt.value === sortBy);

  return (
    <div className="bg-gray-50 border-t border-gray-200">
      {/* Sort Dropdown */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-200 bg-white">
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            {currentSort?.label}
            <ChevronDown size={16} className={`transform transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>

          {showSortMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-20 min-w-[320px]">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setShowSortMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={sortBy === option.value}
                      onChange={() => {}}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{option.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Comment Input */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] flex-shrink-0">
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.username} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-xs font-medium text-gray-700">
                  {currentUser?.username?.charAt(0) || 'U'}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
            <input
              type="text"
              placeholder="Viết bình luận..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              className="flex-1 outline-none text-gray-700 placeholder-gray-500 bg-transparent"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold text-sm"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="px-4 pb-4 max-h-[600px] overflow-y-auto">
        {loading && comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Đang tải bình luận...</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-1">
            {comments.map((comment) => (
              <Comment
                key={comment._id}
                comment={comment}
                currentUser={currentUser}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReact={handleReact}
                level={0}
                postId={post._id}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => loadComments(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Đang tải...' : 'Xem thêm bình luận'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
            <p>Chưa có bình luận nào</p>
            <p className="text-sm mt-1">Hãy là người đầu tiên bình luận!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;