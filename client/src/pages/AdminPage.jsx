import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as adminApi from '../services/adminApi';
import { useAuthStore } from '../store/useAuthStore';

import StatsCards from './admin/StatsCards';
import TabNav from './admin/TabNav';
import Overview from './admin/Overview';
import UsersPanel from './admin/UsersPanel';
import PostsPanel from './admin/PostsPanel';
import ReportsPanel from './admin/ReportsPanel';
import Analytics from './admin/Analytics';

const AdminPage = ({ onBack } = {}) => {
  const { authUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Real data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    bannedUsers: 0,
    totalPosts: 0,
    publishedPosts: 0,
    flaggedPosts: 0,
    removedPosts: 0,
    storageUsed: 0,
    storageLimit: 0,
    storagePercent: 0,
    dailyActiveUsers: 0,
    changes: {
      users: '+0.0%',
      posts: '+0.0%',
      storage: '0.0%',
      dau: '+0.0%'
    }
  });
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [activityDistribution, setActivityDistribution] = useState({});

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch users when Users tab is active
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  // Fetch posts when Posts tab is active
  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    }
  }, [activeTab]);

  // Fetch reports when Reports tab is active
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activitiesData] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentActivities(10)
      ]);

      setStats({
        totalUsers: statsData.stats.totalUsers,
        activeUsers: statsData.stats.activeUsers,
        suspendedUsers: statsData.stats.suspendedUsers,
        bannedUsers: statsData.stats.bannedUsers,
        totalPosts: statsData.stats.totalPosts,
        publishedPosts: statsData.stats.publishedPosts,
        flaggedPosts: statsData.stats.flaggedPosts,
        removedPosts: statsData.stats.removedPosts,
        storageUsed: statsData.stats.storageUsed,
        storageLimit: statsData.stats.storageLimit,
        storagePercent: statsData.stats.storagePercent,
        dailyActiveUsers: statsData.stats.dailyActiveUsers,
        changes: statsData.stats.changes || {
          users: '+0.0%',
          posts: '+0.0%',
          storage: '0.0%',
          dau: '+0.0%'
        }
      });

      setUserGrowth(statsData.userGrowth || []);
      setActivityDistribution(statsData.activityDistribution || {});
      setRecentActivities(activitiesData.activities || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await adminApi.getAllUsers({ search: searchQuery });
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchPosts = async () => {
    try {
      const data = await adminApi.getAllPosts();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    }
  };

  const fetchReports = async () => {
    try {
      const data = await adminApi.getAllReports();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    }
  };

  const suspendUser = async (id, duration = 7) => {
    // Prevent admin from suspending themselves
    if (authUser?._id === id) {
      return toast.error('You cannot suspend your own account');
    }
    
    try {
      await adminApi.suspendUser(id, duration);
      // Update user in state with suspension info
      setUsers(prev => prev.map(u => {
        if (u._id === id) {
          const suspendedUntil = duration > 0 
            ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) 
            : null;
          return { ...u, status: 'suspended', suspendedUntil };
        }
        return u;
      }));
      toast.success(`User suspended${duration > 0 ? ` for ${duration} day${duration > 1 ? 's' : ''}` : ' indefinitely'}`);
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error(error.response?.data?.message || 'Failed to suspend user');
    }
  };

  const activateUser = async (id) => {
    try {
      await adminApi.activateUser(id);
      // Clear ban reason and suspendedUntil when activating/unbanning user
      setUsers(prev => prev.map(u => u._id === id ? { ...u, status: 'active', banReason: '', suspendedUntil: null } : u));
      toast.success('User activated successfully');
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error(error.response?.data?.message || 'Failed to activate user');
    }
  };

  const banUser = async (id) => {
    // Prevent admin from banning themselves
    if (authUser?._id === id) {
      return toast.error('You cannot ban your own account');
    }
    
    if (!banReason || !banReason.trim()) {
      return toast.error('Please provide a reason to ban the user');
    }
    
    if (!id || id === 'undefined') {
      return toast.error('Invalid user ID');
    }
    
    try {
      await adminApi.banUser(id, banReason);
      setUsers(prev => prev.map(u => (u._id === id || u.id === id) ? { ...u, status: 'banned', banReason } : u));
      setSelectedUser(null);
      setBanReason('');
      toast.success('User banned successfully');
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error(error.response?.data?.message || 'Failed to ban user');
    }
  };

  const deleteUser = async (id) => {
    // Prevent admin from deleting themselves
    if (authUser?._id === id) {
      return toast.error('You cannot delete your own account');
    }
    
    try {
      await adminApi.deleteUser(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const removePost = async (id) => {
    try {
      await adminApi.removePost(id);
      setPosts(prev => prev.map(p => p._id === id ? { ...p, status: 'removed' } : p));
      toast.success('Post removed');
    } catch (error) {
      toast.error('Failed to remove post');
    }
  };

  const restorePost = async (id) => {
    try {
      await adminApi.restorePost(id);
      setPosts(prev => prev.map(p => p._id === id ? { ...p, status: 'published' } : p));
      toast.success('Post restored');
    } catch (error) {
      toast.error('Failed to restore post');
    }
  };

  const deletePost = async (id) => {
    try {
      await adminApi.deletePost(id);
      setPosts(prev => prev.filter(p => p._id !== id));
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const resolveReport = async (id) => {
    try {
      await adminApi.resolveReport(id);
      setReports(prev => prev.map(r => r._id === id ? { ...r, status: 'resolved' } : r));
      toast.success('Report resolved');
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
    }
  };

  const dismissReport = async (id) => {
    try {
      await adminApi.dismissReport(id);
      setReports(prev => prev.map(r => r._id === id ? { ...r, status: 'dismissed' } : r));
      toast.success('Report dismissed');
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast.error('Failed to dismiss report');
    }
  };

  const filteredUsers = users.filter(u => 
    `${u.name} ${u.username} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statsData = [
    { 
      title: 'Total Users', 
      value: `${stats.activeUsers.toLocaleString()} / ${stats.totalUsers.toLocaleString()}`, 
      change: stats.changes?.users || '+0.0%' 
    },
    { 
      title: 'Total Posts', 
      value: `${stats.publishedPosts.toLocaleString()} / ${stats.totalPosts.toLocaleString()}`, 
      change: stats.changes?.posts || '+0.0%' 
    },
    { 
      title: 'Storage Usage', 
      value: `${stats.storageUsed.toFixed(1)} / ${stats.storageLimit} MB`, 
      change: stats.changes?.storage || '0.0%' 
    },
    { title: 'Daily Active Users', value: stats.dailyActiveUsers.toLocaleString(), change: stats.changes?.dau || '+0.0%' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="p-2 rounded-md hover:bg-gray-100">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15 5L12 8L9 5L12 2Z" fill="currentColor"/>
                  <path d="M12 8V14M8 14C8 16.2091 9.79086 18 12 18C14.2091 18 16 16.2091 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="20" r="2" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Manage users, content, and platform analytics</p>
              </div>
            </div>
          </div>

                    <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-700" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="text-sm font-medium text-gray-700">Export Data</span>
            </button>

            <button className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-700" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="text-sm font-medium text-gray-700">Settings</span>
            </button>
          </div>
        </div>

        <StatsCards stats={statsData} />
        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'overview' && (
          <Overview 
            recentActivities={recentActivities} 
            users={users}
            posts={posts}
            reports={reports}
            userGrowth={userGrowth}
            activityDistribution={activityDistribution}
          />
        )}

        {activeTab === 'users' && (
          <UsersPanel users={filteredUsers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} suspendUser={suspendUser} activateUser={activateUser} setSelectedUser={(u) => { setSelectedUser(u); setBanReason(''); }} deleteUser={deleteUser} />
        )}

        {activeTab === 'posts' && (
          <PostsPanel posts={posts} removePost={removePost} restorePost={restorePost} deletePost={deletePost} />
        )}

        {activeTab === 'reports' && (
          <ReportsPanel reports={reports} resolveReport={resolveReport} dismissReport={dismissReport} />
        )}

        {activeTab === 'analytics' && (
          <Analytics />
        )}

                {/* Enhanced ban modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-slideUp">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-t-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Ban User</h3>
                    <p className="text-orange-50 text-sm">{selectedUser.username} • {selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setBanReason('');
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-orange-900 mb-1">Permanent Action</p>
                      <p className="text-xs text-orange-700">This user will be permanently banned and unable to access the platform. This action cannot be undone automatically.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Common Reasons Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Quick Select
                      <span className="ml-2 text-xs font-normal text-gray-500">(Optional)</span>
                    </label>
                    <div className="relative">
                      <select 
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm appearance-none cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                        onChange={(e) => {
                          if (e.target.value) {
                            setBanReason(e.target.value);
                          }
                        }}
                        value=""
                      >
                        <option value="">Select a common reason...</option>
                        <option value="Spam or advertising">🚫 Spam or advertising</option>
                        <option value="Harassment or bullying">😡 Harassment or bullying</option>
                        <option value="Hate speech or discrimination">⚠️ Hate speech or discrimination</option>
                        <option value="Posting inappropriate content">🔞 Posting inappropriate content</option>
                        <option value="Impersonation">👤 Impersonation</option>
                        <option value="Sharing false information">📰 Sharing false information</option>
                        <option value="Multiple accounts or ban evasion">🔄 Multiple accounts or ban evasion</option>
                        <option value="Violating terms of service">📋 Violating terms of service</option>
                        <option value="Illegal activity">🚨 Illegal activity</option>
                        <option value="Account security concerns">🔒 Account security concerns</option>
                      </select>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Ban Reason Textarea */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Ban Reason
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <textarea 
                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all" 
                        rows={4} 
                        value={banReason} 
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Describe why this user is being banned..."
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {banReason.length}/500
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      This reason will be shown to the user when they try to log in
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 rounded-b-2xl px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                <button 
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm" 
                  onClick={() => {
                    setSelectedUser(null);
                    setBanReason('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2" 
                  onClick={() => { 
                    banUser(selectedUser._id || selectedUser.id); 
                    setSelectedUser(null); 
                  }}
                  disabled={!banReason.trim()}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Ban User Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
