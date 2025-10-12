// client/src/services/profileApi.js
import axiosInstance from '../lib/axios';

// Get user profile by username
export const getUserProfile = async (username) => {
  try {
    const response = await axiosInstance.get(`/users/profile/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Get user posts
export const getUserPosts = async (userId, skip = 0, limit = 20) => {
  try {
    const response = await axiosInstance.get(`/posts/user/${userId}?skip=${skip}&limit=${limit}`);
    return response.data.posts || response.data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
};

// Follow user
export const followUser = async (userId) => {
  try {
    const response = await axiosInstance.post(`/users/${userId}/follow`);
    return response.data;
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

// Unfollow user
export const unfollowUser = async (userId) => {
  try {
    const response = await axiosInstance.post(`/users/${userId}/unfollow`);
    return response.data;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

// Get followers
export const getFollowers = async (userId) => {
  try {
    const response = await axiosInstance.get(`/users/${userId}/followers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching followers:', error);
    throw error;
  }
};

// Get following
export const getFollowing = async (userId) => {
  try {
    const response = await axiosInstance.get(`/users/${userId}/following`);
    return response.data;
  } catch (error) {
    console.error('Error fetching following:', error);
    throw error;
  }
};

// Update profile
export const updateUserProfile = async (data) => {
  try {
    const response = await axiosInstance.put('/auth/update-profile', data);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    
    const response = await axiosInstance.post('/users/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

// Get saved posts
export const getSavedPosts = async (userId) => {
  try {
    const response = await axiosInstance.get(`/posts/saved`);
    return response.data.posts || response.data;
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    throw error;
  }
};