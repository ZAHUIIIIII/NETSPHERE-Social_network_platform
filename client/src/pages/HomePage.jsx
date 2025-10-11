import React, { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Send, Image, X, MoreHorizontal, TrendingUp, Bookmark } from 'lucide-react';
import { useAuthStore } from "../store/useAuthStore";
import toast from 'react-hot-toast';
import { getPosts, createPost, uploadPostImages } from "../services/api";
import axiosInstance from "../lib/axios";

// API helper functions
const likePost = async (postId) => {
  const response = await axiosInstance.post(`/posts/${postId}/like`);
  return response.data;
};

const addComment = async (postId, data) => {
  const response = await axiosInstance.post(`/posts/${postId}/comment`, data);
  return response.data;
};

const CreatePostQuick = ({ onPostCreated, user, onExpand }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-fadeIn">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]">
          <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-700 font-medium">{user?.username?.charAt(0) || 'U'}</span>
            )}
          </div>
        </div>
        <div
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={onExpand}
        >
          <p className="text-gray-600">What's on your mind, {user?.username?.split(' ')[0] || 'there'}?</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <button 
          onClick={onExpand}
          className="flex items-center gap-2 px-3 py-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Image className="h-4 w-4" />
          <span className="text-sm font-medium">Photo</span>
        </button>
        <button 
          onClick={onExpand}
          className="flex items-center gap-2 px-3 py-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
        >
          <span className="text-lg">😊</span>
          <span className="text-sm font-medium">Feeling</span>
        </button>
      </div>
    </div>
  );
};

const CreatePostExpanded = ({ onPostCreated, user, onCollapse }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [privacy, setPrivacy] = useState('public');
  const maxImages = 4;
  const maxCharacters = 2000;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > maxImages) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    const newImages = files.slice(0, maxImages - images.length).map(file => ({
      id: Math.random().toString(36).slice(2),
      url: URL.createObjectURL(file),
      file
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast.error('Please add some content or images');
      return;
    }

    setIsPosting(true);
    try {
      let imageUrls = [];

      if (images.length > 0) {
        const imageFiles = images.map(img => img.file).filter(Boolean);
        
        if (imageFiles.length > 0) {
          const uploadResponse = await uploadPostImages(imageFiles);
          if (Array.isArray(uploadResponse)) {
            imageUrls = uploadResponse;
          } else if (uploadResponse && Array.isArray(uploadResponse.images)) {
            imageUrls = uploadResponse.images;
          }
        }
      }

      await createPost({
        content: content.trim(),
        images: imageUrls,
        privacy: privacy
      });

      toast.success('Post created!');
      setContent('');
      setImages([]);
      if (onPostCreated) onPostCreated();
      if (onCollapse) onCollapse();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn"
      onClick={onCollapse}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onCollapse}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold">Create Post</h2>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isPosting || (!content.trim() && images.length === 0)}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-700 font-bold">{user?.username?.charAt(0) || 'U'}</span>
                )}
              </div>
            </div>
            <div>
              <p className="font-semibold">{user?.username || 'User'}</p>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="text-sm text-gray-600 bg-transparent border-none outline-none cursor-pointer"
              >
                <option value="public">🌐 Public</option>
                <option value="friends">👥 Friends</option>
                <option value="private">🔒 Only me</option>
              </select>
            </div>
          </div>

          {/* Content Input */}
          <textarea
            placeholder="What's happening? Share your thoughts, experiences, or moments..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={maxCharacters}
            className="w-full min-h-32 text-lg border-0 resize-none focus:outline-none placeholder:text-gray-400"
          />

          {/* Character Counter */}
          <div className="flex justify-end">
            <span className={`text-sm ${
              content.length > maxCharacters * 0.9 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {content.length} / {maxCharacters}
            </span>
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className={`grid ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
              {images.map((img) => (
                <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Add to your post</p>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-4 py-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors">
                <Image size={20} />
                <span className="text-sm font-medium">Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isPosting || images.length >= maxImages}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, currentUser, onPostUpdate }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setLiked(post.likes?.includes(currentUser?._id));
    setLikeCount(post.likes?.length || 0);
    setComments(post.comments || []);
  }, [post.likes, post.comments, currentUser]);

  const handleLike = async () => {
    try {
      const res = await likePost(post._id);
      setLiked(res.isLiked);
      setLikeCount(res.likes);
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      const res = await addComment(post._id, { content: commentText.trim() });
      setComments([...comments, res.comment]);
      setCommentText('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const author = post.author || post.user;
  const avatarUrl = author?.avatar;
  const userName = author?.username || author?.name || 'Anonymous';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 animate-slideUp">
      {/* Post Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]">
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-700 font-bold">{userName.charAt(0)}</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">{userName}</h3>
            <p className="text-xs text-gray-500">{formatTime(post.createdAt)}</p>
          </div>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreHorizontal size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Post Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className={`${post.images.length === 1 ? '' : 'px-4'}`}>
          {post.images.length === 1 && (
            <img src={post.images[0]} alt="" className="w-full max-h-[500px] object-cover" />
          )}

          {post.images.length === 2 && (
            <div className="grid grid-cols-2 gap-2">
              {post.images.map((img, i) => (
                <img key={i} src={img} alt="" className="w-full h-64 object-cover rounded-lg" />
              ))}
            </div>
          )}

          {post.images.length > 2 && (
            <div className="grid grid-cols-2 gap-2">
              <img src={post.images[0]} alt="" className="w-full h-80 object-cover rounded-lg" />
              <div className="grid gap-2">
                {post.images.slice(1, 4).map((img, i) => (
                  <img key={i} src={img} alt="" className="w-full h-[9.5rem] object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reactions Summary */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          {likeCount > 0 && (
            <>
              <div className="flex -space-x-1">
                <span className="text-lg">❤️</span>
                <span className="text-lg">👍</span>
              </div>
              <span>{likeCount}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>{comments.length} comments</span>
          <span>0 shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
              liked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Heart className={liked ? 'fill-current' : ''} size={20} />
            <span className="font-medium">Like</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="font-medium">Comment</span>
          </button>

          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <Share2 size={20} />
            <span className="font-medium">Share</span>
          </button>

          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2.5 rounded-lg transition-colors ${
              bookmarked ? 'text-yellow-500 bg-yellow-50' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bookmark className={bookmarked ? 'fill-current' : ''} size={20} />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50 animate-slideDown">
          {comments.length > 0 && (
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                    {comment.author?.avatar ? (
                      <img src={comment.author.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium">{comment.author?.username?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="flex-1 bg-white rounded-xl p-3 shadow-sm">
                    <p className="font-semibold text-sm">{comment.author?.username || 'User'}</p>
                    <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(comment.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleComment}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
                disabled={!commentText.trim()}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function HomePage() {
  const { authUser: user, isCheckingAuth: loading } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(false);
  const [showExpandedCreate, setShowExpandedCreate] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = async (skip = 0, limit = 20) => {
    try {
      if (skip === 0) {
        setLoadingPosts(true);
      } else {
        setLoadingMore(true);
      }

      const res = await getPosts(skip, limit);
      
      let postsData = [];
      if (Array.isArray(res)) {
        postsData = res;
      } else if (res && Array.isArray(res.posts)) {
        postsData = res.posts;
      } else if (res && Array.isArray(res.data)) {
        postsData = res.data;
      }

      if (skip === 0) {
        setPosts(postsData);
      } else {
        setPosts(prev => [...prev, ...postsData]);
      }

      setHasMore(postsData.length === limit);
      setError(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (skip === 0) {
        toast.error('Failed to load posts');
        setPosts([]);
        setError(true);
      }
    } finally {
      setLoadingPosts(false);
      setLoadingMore(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const loadMorePosts = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(posts.length, 20);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchPosts();
    }
  }, [loading]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 300) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [posts.length, loadingMore, hasMore]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-lg">Failed to load posts</p>
          <button 
            onClick={() => fetchPosts()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>

      <div className="max-w-6xl mx-auto flex gap-8 p-4">
        {/* Main Feed */}
        <div className="flex-1 max-w-2xl space-y-6">
          {/* Header */}
          <div className="text-center py-6 animate-fadeIn">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              NETSPHERE
            </h1>
            <p className="text-gray-600 mt-2">Share your moments</p>
          </div>

          {/* Create Post */}
          <CreatePostQuick 
            user={user} 
            onPostCreated={() => fetchPosts(0, 20)}
            onExpand={() => setShowExpandedCreate(true)}
          />

          {/* Posts Feed */}
          {loadingPosts ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mx-auto"></div>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  currentUser={user}
                  onPostUpdate={handlePostUpdate}
                />
              ))}

              {/* Load More Indicator */}
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
                </div>
              )}

              {/* End of Feed */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500">🎉 You're all caught up!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-lg">No posts yet. Be the first to share something!</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Trending */}
        <div className="hidden lg:block w-80">
          <div className="sticky top-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-semibold">Trending Now</h2>
              </div>
              <div className="space-y-4">
                {[
                  { rank: 1, tag: 'DesignSystem', posts: '1.2K', hot: true },
                  { rank: 2, tag: 'Photography', posts: '892', hot: true },
                  { rank: 3, tag: 'AI', posts: '2.3K', hot: true },
                  { rank: 4, tag: 'Travel', posts: '1.5K', hot: false },
                  { rank: 5, tag: 'Coding', posts: '987', hot: true }
                ].map((trend) => (
                  <div key={trend.rank} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-medium text-sm w-6">#{trend.rank}</span>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          #{trend.tag}
                        </p>
                        <p className="text-xs text-gray-500">{trend.posts} posts</p>
                      </div>
                    </div>
                    {trend.hot && (
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full font-medium">
                        Hot
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Create Post Modal */}
      {showExpandedCreate && (
        <CreatePostExpanded
          user={user}
          onPostCreated={() => fetchPosts(0, 20)}
          onCollapse={() => setShowExpandedCreate(false)}
        />
      )}
    </div>
  );
}