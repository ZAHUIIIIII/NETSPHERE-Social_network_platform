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

//post functions
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


// Search functions
export const searchAll = async (query, filters = {}) => {
  try {
    const params = new URLSearchParams({
      q: query,
      ...filters
    });
    const response = await axiosInstance.get(`/search?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error searching:', error);
    throw error;
  }
};


// Fetch trending topics and search suggestions
export const getTrending = async () => {
  try {
    const response = await axiosInstance.get('/search/trending');
    return response.data;
  } catch (error) {
    console.error('Error getting trending:', error);
    throw error;
  }
};

export const getSearchSuggestions = async (query) => {
  try {
    const response = await axiosInstance.get(`/search/suggestions?q=${query}`);
    return response.data;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    throw error;
  }
};

