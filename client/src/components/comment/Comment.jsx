// client/src/components/comment/Comment.jsx
import React, { useEffect, useState, useRef } from 'react';
import { 
  MoreHorizontal, ChevronDown, ChevronUp, 
  Edit2, Check, X
} from 'lucide-react';
import { fetchReplies } from '../../services/api';
import toast from 'react-hot-toast';

// Reaction picker component
const ReactionPicker = ({ onSelect, show }) => {
  const reactions = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'haha', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😠', label: 'Angry' }
  ];

  if (!show) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-2xl border border-gray-200 px-2 py-1.5 flex gap-1 z-20 animate-scaleIn">
      {reactions.map(({ type, emoji, label }) => (
        <button
          key={type}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(type);
          }}
          className="hover:scale-125 transition-transform p-1.5 rounded-full hover:bg-gray-100"
          title={label}
        >
          <span className="text-xl">{emoji}</span>
        </button>
      ))}
    </div>
  );
};

// Reaction display component
const ReactionDisplay = ({ reactions, userReaction }) => {
  const reactionEmojis = {
    like: '👍', love: '❤️', haha: '😂', 
    wow: '😮', sad: '😢', angry: '😠'
  };

  const totalReactions = Object.values(reactions || {}).reduce((sum, count) => sum + count, 0);
  if (totalReactions === 0) return null;

  // Get top 3 reactions
  const sortedReactions = Object.entries(reactions || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="absolute -bottom-2 -right-2 flex items-center gap-0.5 bg-white rounded-full shadow-md px-1.5 py-0.5 border border-gray-200">
      {sortedReactions.map(([type]) => (
        <span key={type} className="text-xs">{reactionEmojis[type]}</span>
      ))}
      <span className="text-[10px] font-semibold text-gray-600 ml-0.5">{totalReactions}</span>
    </div>
  );
};

// Enhanced Comment Component
const Comment = ({ 
  comment, 
  currentUser, 
  onReply, 
  onEdit,
  onDelete, 
  onReact,
  level = 0,
  postId 
}) => {
  const [showReplies, setShowReplies] = useState(true);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [replies, setReplies] = useState(comment.repliesPreview || []);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesCursor, setRepliesCursor] = useState(null);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  
  const replyInputRef = useRef(null);
  const editInputRef = useRef(null);

  const maxLevel = 5;
  const totalReplies = comment.repliesCount || 0;
  const hiddenRepliesCount = totalReplies - replies.length;

  useEffect(() => {
    if (showReplyInput && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [showReplyInput]);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    
    await onReply(comment._id, replyText.trim());
    setReplyText('');
    setShowReplyInput(false);
    setShowReplies(true);
  };

  const handleEditSave = async () => {
    if (!editText.trim() || editText === comment.content) {
      setIsEditing(false);
      return;
    }

    await onEdit(comment._id, editText.trim());
    setIsEditing(false);
    setShowOptions(false);
  };

  const handleReact = async (type) => {
    setShowReactionPicker(false);
    await onReact(comment._id, type);
  };

  const loadMoreReplies = async () => {
    if (loadingReplies) return;

    setLoadingReplies(true);
    try {
      const result = await fetchReplies(postId, comment._id, { 
        limit: 10, 
        cursor: repliesCursor || '' 
      });
      
      setReplies(prev => [...prev, ...result.items]);
      setRepliesCursor(result.nextCursor);
      setHasMoreReplies(!!result.nextCursor);
    } catch (error) {
      console.error('Error loading replies:', error);
      toast.error('Failed to load replies');
    } finally {
      setLoadingReplies(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);

    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày`;
    return new Date(date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  };

  const getReactionLabel = () => {
    if (!comment.userReaction) return 'Like';
    const labels = {
      like: 'Like', love: 'Love', haha: 'Haha',
      wow: 'Wow', sad: 'Sad', angry: 'Angry'
    };
    return labels[comment.userReaction] || 'Like';
  };

  const getReactionColor = () => {
    if (!comment.userReaction) return 'text-gray-600';
    const colors = {
      like: 'text-blue-600',
      love: 'text-red-600',
      haha: 'text-yellow-600',
      wow: 'text-purple-600',
      sad: 'text-gray-600',
      angry: 'text-orange-600'
    };
    return colors[comment.userReaction] || 'text-gray-600';
  };

  // Collapsible text (>6 lines)
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongText = comment.content.split('\n').length > 6 || comment.content.length > 300;
  const displayContent = isLongText && !isExpanded && !isEditing
    ? comment.content.slice(0, 300) + '...'
    : comment.content;

  return (
    <div className={`${level > 0 ? 'ml-10' : ''} mt-4`}>
      <div className="flex gap-2 group">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
          {comment.author?.avatar ? (
            <img 
              src={comment.author.avatar} 
              alt={comment.author.username} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-xs font-medium text-white">
              {comment.author?.username?.charAt(0) || 'U'}
            </span>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="relative bg-gray-100 rounded-2xl px-4 py-2.5 inline-block max-w-full">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">
                  {comment.author?.username || 'User'}
                </p>
                
                {!isEditing ? (
                  <div>
                    <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap break-words">
                      {displayContent}
                    </p>
                    {isLongText && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs text-blue-600 hover:underline mt-1 font-medium"
                      >
                        {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    <textarea
                      ref={editInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEditSave();
                        }
                        if (e.key === 'Escape') {
                          setIsEditing(false);
                          setEditText(comment.content);
                        }
                      }}
                      className="w-full min-h-[60px] p-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleEditSave}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Check size={12} /> Lưu
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditText(comment.content);
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Options Menu */}
              {comment.author?._id === currentUser?._id && !isEditing && (
                <div className="relative">
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                  >
                    <MoreHorizontal size={14} className="text-gray-600" />
                  </button>
                  
                  {showOptions && (
                    <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[120px]">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowOptions(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2"
                      >
                        <Edit2 size={14} /> Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          onDelete(comment._id);
                          setShowOptions(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reaction Display */}
            <ReactionDisplay 
              reactions={comment.reactions} 
              userReaction={comment.userReaction}
            />
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-1 ml-3">
              <div className="relative">
                <button 
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => setTimeout(() => setShowReactionPicker(false), 200)}
                  onClick={() => handleReact('like')}
                  className={`text-xs font-semibold transition-colors ${getReactionColor()} hover:underline`}
                >
                  {getReactionLabel()}
                </button>
                
                <div
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => setShowReactionPicker(false)}
                >
                  <ReactionPicker 
                    show={showReactionPicker}
                    onSelect={handleReact}
                  />
                </div>
              </div>
              
              {level < maxLevel && (
                <button 
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="text-xs text-gray-600 hover:text-gray-900 font-semibold"
                >
                  Trả lời
                </button>
              )}
              
              <span className="text-xs text-gray-500">
                {formatTime(comment.createdAt)}
                {comment.edited && (
                  <span className="ml-1 italic" title={`Đã chỉnh sửa ${new Date(comment.editedAt).toLocaleString('vi-VN')}`}>
                    · Đã chỉnh sửa
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Reply Input */}
          {showReplyInput && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {currentUser?.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.username} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-xs font-medium text-white">
                    {currentUser?.username?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                <input
                  ref={replyInputRef}
                  type="text"
                  placeholder={`Trả lời ${comment.author?.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReplySubmit();
                    }
                    if (e.key === 'Escape') {
                      setShowReplyInput(false);
                      setReplyText('');
                    }
                  }}
                  className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-500 bg-transparent"
                />
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim()}
                  className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-semibold"
                >
                  Gửi
                </button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {totalReplies > 0 && (
            <div className="mt-2">
              {/* Toggle Replies Button */}
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 ml-3 mb-2"
              >
                {showReplies ? (
                  <>
                    <ChevronUp size={14} />
                    Ẩn {totalReplies} phản hồi
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    Xem tất cả {totalReplies} phản hồi
                  </>
                )}
              </button>

              {/* Render Nested Replies */}
              {showReplies && (
                <div className="border-l-2 border-gray-200 pl-2">
                  {replies.map((reply) => (
                    <Comment
                      key={reply._id}
                      comment={reply}
                      currentUser={currentUser}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onReact={onReact}
                      level={level + 1}
                      postId={postId}
                    />
                  ))}

                  {/* Load More Replies */}
                  {hiddenRepliesCount > 0 && (
                    <button
                      onClick={loadMoreReplies}
                      disabled={loadingReplies}
                      className="ml-3 mt-2 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {loadingReplies 
                        ? 'Đang tải...' 
                        : `Xem thêm ${hiddenRepliesCount} phản hồi`
                      }
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment;