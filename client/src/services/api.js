import axiosInstance from '../lib/axios';

// ==================== POSTS ====================
export const getPosts = async (skip = 0, limit = 20) => {
  try {
    const response = await axiosInstance.get(`/posts?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

export const likePost = async (postId) => {
  const response = await axiosInstance.post(`/posts/${postId}/like`);
  return response.data;
};

export const createPost = async (postData) => {
  try {
    const response = await axiosInstance.post('/posts', postData);
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const updatePost = async (postId, postData) => {
  try {
    const response = await axiosInstance.put(`/posts/${postId}`, postData);
    // Backend returns { post }, extract the post
    return response.data.post || response.data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

export const uploadPostImages = async (files, onProgress) => {
  try {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    const response = await axiosInstance.post('/posts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

export const savePost = async (postId) => {
  try {
    const response = await axiosInstance.post(`/posts/${postId}/save`);
    return response.data;
  } catch (error) {
    console.error('Error saving post:', error);
    throw error;
  }
};

export const reactToPost = async (postId, reactionType) => {
  try {
    const response = await axiosInstance.post(`/posts/${postId}/react`, { type: reactionType });
    return response.data;
  } catch (error) {
    console.error('Error reacting to post:', error);
    throw error;
  }
};

export const repostPost = async (postId) => {
  try {
    const response = await axiosInstance.post(`/posts/${postId}/repost`);
    return response.data;
  } catch (error) {
    console.error('Error reposting:', error);
    throw error;
  }
};

export const getUserReposts = async (userId) => {
  try {
    const response = await axiosInstance.get(`/posts/reposts/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching reposts:', error);
    throw error;
  }
};

export const checkPostSaved = async (postId) => {
  try {
    const response = await axiosInstance.get(`/posts/${postId}/saved-status`);
    return response.data;
  } catch (error) {
    console.error('Error checking saved status:', error);
    return { isSaved: false };
  }
};

// ==================== COMMENTS - LISTING & PAGINATION ====================
export const fetchComments = async (postId, { sort = 'relevant', limit = 20, cursor = '' } = {}) => {
  const url = `/posts/${postId}/comments?sort=${sort}&limit=${limit}&cursor=${encodeURIComponent(cursor)}`;
  const { data } = await axiosInstance.get(url);
  return data; // { items, nextCursor }
};

export const fetchReplies = async (postId, commentId, { limit = 10, cursor = '' } = {}) => {
  const url = `/posts/${postId}/comments/${commentId}/replies?limit=${limit}&cursor=${encodeURIComponent(cursor)}`;
  const { data } = await axiosInstance.get(url);
  return data; // { items, nextCursor }
};

// ==================== COMMENTS - CRUD ====================
export const addComment = async (postId, { content, parentId = null }) => {
  const { data } = await axiosInstance.post(`/posts/${postId}/comment`, { content, parentId });
  return data; // { comment }
};

export const editComment = async (postId, commentId, content) => {
  const { data } = await axiosInstance.patch(`/posts/${postId}/comment/${commentId}`, { content });
  return data; // { comment }
};

export const deleteComment = async (postId, commentId) => {
  const { data } = await axiosInstance.delete(`/posts/${postId}/comment/${commentId}`);
  return data; // { ok: true }
};

// ==================== COMMENTS - REACTIONS ====================
export const reactToComment = async (postId, commentId, type = 'like') => {
  const { data } = await axiosInstance.post(`/posts/${postId}/comment/${commentId}/react`, { type });
  return data; // { userReaction, reactions, likes, isLiked }
};

// Legacy like mapping – keep compatibility
export const likeComment = async (postId, commentId) => {
  const { data } = await axiosInstance.post(`/posts/${postId}/comment/${commentId}/like`);
  return data;
};

// ==================== COMMENTS - PIN ====================
export const pinComment = async (postId, commentId) => {
  const { data } = await axiosInstance.post(`/posts/${postId}/comment/${commentId}/pin`);
  return data; // { ok: true, isPinned: boolean, message }
};

// ==================== SEARCH ====================
export const searchAll = async (query, filters = {}) => {
  try {
    const params = new URLSearchParams({
      q: query.trim(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });
    
    const response = await axiosInstance.get(`/search?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error searching:', error);
    throw error;
  }
};

// Get trending with caching
let trendingCache = null;
let trendingCacheTime = 0;
const TRENDING_CACHE_DURATION = 5 * 60 * 1000;

export const getTrending = async () => {
  try {
    const now = Date.now();
    if (trendingCache && (now - trendingCacheTime) < TRENDING_CACHE_DURATION) {
      return trendingCache;
    }

    const response = await axiosInstance.get('/search/trending');
    trendingCache = response.data;
    trendingCacheTime = now;
    return response.data;
  } catch (error) {
    console.error('Error getting trending:', error);
    throw error;
  }
};

let suggestionAbortController = null;

export const getSearchSuggestions = async (query) => {
  try {
    if (suggestionAbortController) {
      suggestionAbortController.abort();
    }

    suggestionAbortController = new AbortController();

    const response = await axiosInstance.get(`/search/suggestions?q=${encodeURIComponent(query)}`, {
      signal: suggestionAbortController.signal
    });
    
    return response.data;
  } catch (error) {
    if (error.name === 'CanceledError') {
      return { suggestions: { users: [], hashtags: [] } };
    }
    console.error('Error getting suggestions:', error);
    throw error;
  }
};

export const getPopularSearches = async () => {
  try {
    const response = await axiosInstance.get('/search/popular');
    return response.data;
  } catch (error) {
    console.error('Error getting popular searches:', error);
    throw error;
  }
};

// ==================== NOTIFICATIONS ====================
export const getNotificationSettings = async () => {
  try {
    const response = await axiosInstance.get('/notifications/settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    throw error;
  }
};

export const toggleMuteAllNotifications = async () => {
  try {
    const response = await axiosInstance.post('/notifications/settings/mute-all/toggle');
    return response.data;
  } catch (error) {
    console.error('Error toggling mute all notifications:', error);
    throw error;
  }
};

export const toggleMutePost = async (postId) => {
  try {
    const response = await axiosInstance.post(`/notifications/settings/mute-post/${postId}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Error toggling mute post:', error);
    throw error;
  }
};

export const toggleMuteUser = async (userId) => {
  try {
    const response = await axiosInstance.post(`/notifications/settings/mute-user/${userId}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Error toggling mute user:', error);
    throw error;
  }
};

export const checkPostMuteStatus = async (postId) => {
  try {
    const response = await axiosInstance.get(`/notifications/settings/mute-post/${postId}/status`);
    return response.data;
  } catch (error) {
    console.error('Error checking post mute status:', error);
    throw error;
  }
};

export const checkUserMuteStatus = async (userId) => {
  try {
    const response = await axiosInstance.get(`/notifications/settings/mute-user/${userId}/status`);
    return response.data;
  } catch (error) {
    console.error('Error checking user mute status:', error);
    throw error;
  }
};

export const updateNotificationPreference = async (type, enabled) => {
  try {
    const response = await axiosInstance.post('/notifications/settings/preference', {
      type,
      enabled
    });
    return response.data;
  } catch (error) {
    console.error('Error updating notification preference:', error);
    throw error;
  }
};

// ==================== CONVERSATION MUTE (MESSAGES) ====================
export const toggleMuteConversation = async (userId) => {
  try {
    const response = await axiosInstance.post(`/messages/conversation/${userId}/mute/toggle`);
    return response.data;
  } catch (error) {
    console.error('Error toggling mute conversation:', error);
    throw error;
  }
};

export const checkConversationMuteStatus = async (userId) => {
  try {
    const response = await axiosInstance.get(`/messages/conversation/${userId}/mute/status`);
    return response.data;
  } catch (error) {
    console.error('Error checking conversation mute status:', error);
    throw error;
  }
};

export const deleteConversation = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/messages/conversation/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

// ==================== BLOCK USER ====================
export const blockUser = async (userId) => {
  try {
    const response = await axiosInstance.post(`/users/${userId}/block`);
    return response.data;
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

export const unblockUser = async (userId) => {
  try {
    const response = await axiosInstance.post(`/users/${userId}/unblock`);
    return response.data;
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

export const getBlockedUsers = async () => {
  try {
    const response = await axiosInstance.get('/users/blocked-users');
    return response.data;
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    throw error;
  }
};

export const checkBlockStatus = async (userId) => {
  try {
    const response = await axiosInstance.get(`/users/${userId}/block-status`);
    return response.data;
  } catch (error) {
    console.error('Error checking block status:', error);
    throw error;
  }
};