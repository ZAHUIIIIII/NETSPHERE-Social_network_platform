import axiosInstance from '../lib/axios';

const API_BASE = '/posts'; // Unlimited nesting comment system (standard path)

// ==================== CREATE COMMENT ====================

export const createComment = async (postId, data) => {
  const response = await axiosInstance.post(`${API_BASE}/${postId}/comments`, data);
  return response.data;
};

// ==================== LIST ROOT COMMENTS ====================

export const listRootComments = async (postId, { limit = 20, after } = {}) => {
  const params = { limit };
  if (after) params.after = after;
  
  const response = await axiosInstance.get(`${API_BASE}/${postId}/comments`, { params });
  return response.data; // { items: Comment[], nextCursor: string | null }
};

// ==================== LIST THREAD REPLIES ====================

export const listThreadReplies = async (postId, rootId, { limit = 50, after } = {}) => {
  const params = { limit };
  if (after) params.after = after;
  
  const response = await axiosInstance.get(
    `${API_BASE}/${postId}/comments/${rootId}/thread`,
    { params }
  );
  return response.data; // { root: Comment, replies: Comment[], nextCursor: string | null }
};

// ==================== EDIT COMMENT ====================

export const editComment = async (commentId, content) => {
  const response = await axiosInstance.patch(`${API_BASE}/comments/${commentId}`, { content });
  return response.data;
};

// ==================== DELETE COMMENT ====================

export const deleteComment = async (commentId) => {
  const response = await axiosInstance.delete(`${API_BASE}/comments/${commentId}`);
  return response.data;
};

// ==================== REACT TO COMMENT ====================

export const reactToComment = async (commentId, type = 'like') => {
  const response = await axiosInstance.post(`${API_BASE}/comments/${commentId}/reactions`, { type });
  return response.data; // { userReaction: string | null, reactions: { like: 0, love: 0, ... } }
};

// ==================== COUNT TOTAL COMMENTS ====================

export const countTotalComments = (rootComments) => {
  // Count root comments + their total descendants
  return rootComments.reduce((total, comment) => {
    return total + 1 + (comment.totalDescendants || 0);
  }, 0);
};
