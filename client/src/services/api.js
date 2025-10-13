// client/src/services/api.js
import axiosInstance from '../lib/axios';

export const getPosts = async (skip = 0, limit = 20) => {
  try {
    const response = await axiosInstance.get(`/posts?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Post functions
export const likePost = async (postId) => {
  const response = await axiosInstance.post(`/posts/${postId}/like`);
  return response.data;
};

export const addComment = async (postId, data) => {
  const response = await axiosInstance.post(`/posts/${postId}/comment`, data);
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


// Save/Unsave post
export const savePost = async (postId) => {
  try {
    const response = await axiosInstance.post(`/posts/${postId}/save`);
    return response.data;
  } catch (error) {
    console.error('Error saving post:', error);
    throw error;
  }
};

// Check if post is saved
export const checkPostSaved = async (postId) => {
  try {
    const response = await axiosInstance.get(`/posts/${postId}/saved-status`);
    return response.data;
  } catch (error) {
    console.error('Error checking saved status:', error);
    return { isSaved: false };
  }
};

