import axiosInstance from '../lib/axios';

// ==================== DASHBOARD ====================
export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getRecentActivities = async (limit = 10) => {
  try {
    const response = await axiosInstance.get(`/admin/activities?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
};

// ==================== USER MANAGEMENT ====================
export const getAllUsers = async ({ search = '', status = '', skip = 0, limit = 50 } = {}) => {
  try {
    const response = await axiosInstance.get('/admin/users', {
      params: { search, status, skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const suspendUser = async (userId, duration = 7) => {
  try {
    const response = await axiosInstance.put(`/admin/users/${userId}/suspend`, { duration });
    return response.data;
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

export const activateUser = async (userId) => {
  try {
    const response = await axiosInstance.put(`/admin/users/${userId}/activate`);
    return response.data;
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};

export const banUser = async (userId, reason) => {
  try {
    const response = await axiosInstance.put(`/admin/users/${userId}/ban`, { reason });
    return response.data;
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// ==================== POST MANAGEMENT ====================
export const getAllPosts = async ({ status = '', skip = 0, limit = 50 } = {}) => {
  try {
    const response = await axiosInstance.get('/admin/posts', {
      params: { status, skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

export const removePost = async (postId) => {
  try {
    const response = await axiosInstance.put(`/admin/posts/${postId}/remove`);
    return response.data;
  } catch (error) {
    console.error('Error removing post:', error);
    throw error;
  }
};

export const restorePost = async (postId) => {
  try {
    const response = await axiosInstance.put(`/admin/posts/${postId}/restore`);
    return response.data;
  } catch (error) {
    console.error('Error restoring post:', error);
    throw error;
  }
};

export const deletePost = async (postId) => {
  try {
    const response = await axiosInstance.delete(`/admin/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// ==================== REPORT MANAGEMENT ====================
export const getAllReports = async ({ status = '', postId = '', skip = 0, limit = 50 } = {}) => {
  try {
    const response = await axiosInstance.get('/admin/reports', {
      params: { status, postId, skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const resolveReport = async (reportId) => {
  try {
    const response = await axiosInstance.put(`/admin/reports/${reportId}/resolve`);
    return response.data;
  } catch (error) {
    console.error('Error resolving report:', error);
    throw error;
  }
};

export const dismissReport = async (reportId) => {
  try {
    const response = await axiosInstance.put(`/admin/reports/${reportId}/dismiss`);
    return response.data;
  } catch (error) {
    console.error('Error dismissing report:', error);
    throw error;
  }
};
