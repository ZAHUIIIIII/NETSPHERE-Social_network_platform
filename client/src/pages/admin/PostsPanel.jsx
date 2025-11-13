import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../lib/axios';
import toast from 'react-hot-toast';
import PortalDropdown from '../../components/common/PortalDropdown';

const PostsPanel = ({ posts, removePost, restorePost, deletePost }) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('All Posts');
  const [filterOpen, setFilterOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [postReports, setPostReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const filtered = posts.filter(p => {
    if (statusFilter === 'All Posts') return true;
    if (statusFilter === 'Published') return p.status === 'published';
    if (statusFilter === 'Flagged') return p.status === 'flagged';
    if (statusFilter === 'Removed') return p.status === 'removed';
    return true;
  });

  // Format date to show time before date (HH:MM, DD/MM/YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateOnly = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${time}, ${dateOnly}`;
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setShowViewModal(true);
    setOpenDropdown(null);
  };

  const handleRemovePost = (post) => {
    setSelectedPost(post);
    setShowRemoveModal(true);
    setOpenDropdown(null);
  };

  const confirmRemove = async () => {
    await removePost(selectedPost._id || selectedPost.id);
    setShowRemoveModal(false);
    setSelectedPost(null);
  };

  const handleRestorePost = async (post) => {
    await restorePost(post._id || post.id);
    setOpenDropdown(null);
  };

  const handleDeletePost = (post) => {
    setSelectedPost(post);
    setShowDeleteModal(true);
    setDeleteConfirmText('');
    setOpenDropdown(null);
  };

  const confirmDelete = async () => {
    if (deleteConfirmText === 'DELETE') {
      await deletePost(selectedPost._id || selectedPost.id);
      setShowDeleteModal(false);
      setSelectedPost(null);
      setDeleteConfirmText('');
    }
  };

  const openPostInNewTab = (postId) => {
    window.open(`/post/${postId}`, '_blank');
  };

  const handleViewReports = async (post) => {
    setSelectedPost(post);
    setShowReportsModal(true);
    setLoadingReports(true);
    setPostReports([]);

    try {
      // Fetch reports for this specific post
      const response = await axiosInstance.get(`/admin/reports?postId=${post._id}`);
      setPostReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
      setPostReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800 dark:to-gray-800/30 rounded-xl p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-lg overflow-visible">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor"/>
            </svg>
            Post Management
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monitor and moderate platform content</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center gap-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 min-w-[140px] justify-between shadow-sm transition-all"
          >
            <span className="text-gray-700 dark:text-gray-300">{statusFilter}</span>
            <svg viewBox="0 0 24 24" className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {filterOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setFilterOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-40">
                {['All Posts', 'Published', 'Flagged', 'Removed'].map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setStatusFilter(option);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-between ${
                      statusFilter === option ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-900/30' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{option}</span>
                    {statusFilter === option && (
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-visible rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
            <tr>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Author</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">Content</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">Engagement</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">Status</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">Reports</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Created</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="relative divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((p, index) => (
              <tr key={p._id || p.id} className="hover:bg-blue-50/30 dark:hover:bg-gray-700/50 transition-all duration-150 group">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {p.author?.avatar ? (
                      <img 
                        src={p.author.avatar} 
                        alt={p.author.username || 'User'} 
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-300 transition-all"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-300 transition-all shadow-sm">
                        {(p.author?.name || p.author?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{p.author?.name || p.author?.username || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{p.author?.email || 'No email'}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleViewPost(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/50 dark:hover:to-blue-900/50 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      View Details
                    </button>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-2 items-center">
                    <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-500 dark:text-red-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span className="font-bold">{p.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-bold">{p.commentsCount || 0}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm ${
                      p.status === 'published' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                      p.status === 'flagged' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800' :
                      'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                    }`}>
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {p.status === 'published' ? (
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        ) : p.status === 'flagged' ? (
                          <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" fill="currentColor"/>
                        ) : (
                          <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        )}
                      </svg>
                      {p.status}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-center">
                    {p.reportsCount > 0 ? (
                      <button
                        onClick={() => handleViewReports(p)}
                        className="inline-flex items-center justify-center min-w-[32px] h-7 px-2.5 rounded-md bg-gradient-to-r from-red-100 to-orange-100 text-red-700 text-xs font-bold hover:from-red-200 hover:to-orange-200 transition-all shadow-sm hover:shadow-md cursor-pointer"
                        title="Click to view reports"
                      >
                        {p.reportsCount}
                      </button>
                    ) : (
                      <span className="text-gray-400 font-medium text-sm">-</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-xs text-gray-700 whitespace-nowrap font-medium">{formatDate(p.createdAt)}</td>
                <td className="py-4 px-4 text-right">
                  <PortalDropdown
                    isOpen={openDropdown === (p._id || p.id)}
                    onClose={() => setOpenDropdown(null)}
                    width="w-52"
                    trigger={
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === (p._id || p.id) ? null : (p._id || p.id));
                        }}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="1" fill="currentColor"/>
                          <circle cx="12" cy="5" r="1" fill="currentColor"/>
                          <circle cx="12" cy="19" r="1" fill="currentColor"/>
                        </svg>
                      </button>
                    }
                    className="overflow-hidden"
                  >
                          <div className="px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</span>
                          </div>
                          
                          <div className="py-1.5">
                            <button
                              onClick={() => handleViewPost(p)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-3 transition-all group"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2"/>
                                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              <span className="font-medium">View Details</span>
                            </button>

                            <button
                              onClick={() => {
                                openPostInNewTab(p._id || p.id);
                                setOpenDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-3 transition-all group"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="font-medium">Open in New Tab</span>
                            </button>
                            
                            {p.status !== 'removed' ? (
                              <button
                                onClick={() => handleRemovePost(p)}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-400 flex items-center gap-3 transition-all group"
                              >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-orange-600 dark:group-hover:text-orange-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                  <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span className="font-medium">Remove Post</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRestorePost(p)}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 flex items-center gap-3 transition-all group"
                              >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-500 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="font-medium">Activate Post</span>
                              </button>
                            )}
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-700" />
                          
                          <div className="py-1.5">
                            <button
                              onClick={() => handleDeletePost(p)}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-all font-semibold group"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span>Delete Post</span>
                            </button>
                          </div>
                  </PortalDropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Post Modal */}
      {showViewModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Post Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Author Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                {selectedPost.author?.avatar ? (
                  <img 
                    src={selectedPost.author.avatar} 
                    alt={selectedPost.author.username} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {(selectedPost.author?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">{selectedPost.author?.name || selectedPost.author?.username || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">{selectedPost.author?.email || 'No email'}</div>
                  <div className="text-xs text-gray-400">{formatDate(selectedPost.createdAt)}</div>
                </div>
              </div>

              {/* Post Content */}
              {selectedPost.content && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Content</h4>
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedPost.content}</p>
                </div>
              )}

              {/* Post Images */}
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Images ({selectedPost.images.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPost.images.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt={`Post image ${idx + 1}`} 
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Post Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 border border-red-100">
                  <div className="text-sm text-gray-600 mb-1">Reactions</div>
                  <div className="text-2xl font-bold text-red-600">{selectedPost.likes || 0}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                  <div className="text-sm text-gray-600 mb-1">Comments</div>
                  <div className="text-2xl font-bold text-blue-600">{selectedPost.commentsCount || 0}</div>
                </div>
              </div>

              {/* Status & Reports */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Status</h4>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    selectedPost.status === 'published' ? 'bg-blue-100 text-blue-700' :
                    selectedPost.status === 'flagged' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedPost.status}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Reports</h4>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                    selectedPost.reportsCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {selectedPost.reportsCount || 0} {selectedPost.reportsCount === 1 ? 'report' : 'reports'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <button
                onClick={() => {
                  openPostInNewTab(selectedPost._id || selectedPost.id);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <ExternalLink size={16} />
                Open in Web
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Post Modal */}
      {showRemoveModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">🚫 Remove Post</h3>
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setSelectedPost(null);
                }}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-orange-800 font-semibold mb-1">Are you sure you want to remove this post?</p>
                <p className="text-orange-700 text-sm">
                  This post will be hidden from public view but can be restored later.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Post Author:</h4>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {selectedPost.author?.avatar ? (
                    <img 
                      src={selectedPost.author.avatar} 
                      alt={selectedPost.author.username} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {(selectedPost.author?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">{selectedPost.author?.name || selectedPost.author?.username || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{selectedPost.author?.email || 'No email'}</div>
                  </div>
                </div>
              </div>

              {selectedPost.content && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Post Content:</h4>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 line-clamp-3">{selectedPost.content}</p>
                  </div>
                </div>
              )}

              {/* Post Statistics */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Post Statistics:</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-3 border border-red-100">
                    <div className="text-xs text-gray-600 mb-1">Reactions</div>
                    <div className="text-xl font-bold text-red-600">{selectedPost.likes || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                    <div className="text-xs text-gray-600 mb-1">Comments</div>
                    <div className="text-xl font-bold text-blue-600">{selectedPost.commentsCount || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-3 border border-orange-100">
                    <div className="text-xs text-gray-600 mb-1">Reports</div>
                    <div className="text-xl font-bold text-orange-600">{selectedPost.reportsCount || 0}</div>
                  </div>
                </div>
              </div>

              {/* Post Details */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Post Details:</h4>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedPost.createdAt)}</span>
                  </div>
                  {selectedPost.images && selectedPost.images.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Images:</span>
                      <span className="font-medium text-gray-900">{selectedPost.images.length} image{selectedPost.images.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Current Status:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedPost.status === 'published' ? 'bg-blue-100 text-blue-700' :
                      selectedPost.status === 'flagged' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedPost.status || 'published'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmRemove}
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                >
                  Remove Post
                </button>
                <button
                  onClick={() => {
                    setShowRemoveModal(false);
                    setSelectedPost(null);
                  }}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">📋 Post Reports</h3>
                <p className="text-sm text-white/90 mt-0.5">
                  {selectedPost.reportsCount || 0} {selectedPost.reportsCount === 1 ? 'report' : 'reports'} for this post
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReportsModal(false);
                  setSelectedPost(null);
                  setPostReports([]);
                }}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Post Info */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Reported Post:</h4>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {selectedPost.author?.avatar ? (
                    <img 
                      src={selectedPost.author.avatar} 
                      alt={selectedPost.author.username} 
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {(selectedPost.author?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{selectedPost.author?.name || selectedPost.author?.username || 'Unknown'}</div>
                    {selectedPost.content && (
                      <p className="text-sm text-gray-700 line-clamp-2 mt-1">{selectedPost.content}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reports List */}
              {loadingReports ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
              ) : postReports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No reports found for this post</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {postReports.map((report, index) => (
                    <div key={report._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-gray-900">
                              {report.reportedBy?.name || report.reportedBy?.username || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(report.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          report.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                          report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {report.status}
                        </span>
                      </div>

                      <div className="ml-8">
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Reason:</span>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              report.reason === 'spam' ? 'bg-orange-100 text-orange-700' :
                              report.reason === 'harassment' ? 'bg-red-100 text-red-700' :
                              report.reason === 'hate_speech' ? 'bg-red-100 text-red-700' :
                              report.reason === 'violence' ? 'bg-red-100 text-red-700' :
                              report.reason === 'nudity' ? 'bg-pink-100 text-pink-700' :
                              report.reason === 'false_information' ? 'bg-yellow-100 text-yellow-700' :
                              report.reason === 'scam' ? 'bg-orange-100 text-orange-700' :
                              report.reason === 'terrorism' ? 'bg-red-100 text-red-700' :
                              report.reason === 'self_harm' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {report.reason === 'hate_speech' ? 'Hate Speech' :
                               report.reason === 'false_information' ? 'False Information' :
                               report.reason === 'self_harm' ? 'Self-Harm' :
                               report.reason.charAt(0).toUpperCase() + report.reason.slice(1)}
                            </span>
                          </div>
                        </div>

                        {report.description && (
                          <div>
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description:</span>
                            <p className="text-sm text-gray-700 mt-1 bg-white p-2 rounded border border-gray-200">
                              {report.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Total Reports: <span className="font-bold text-red-600">{postReports.length}</span>
              </div>
              <button
                onClick={() => {
                  setShowReportsModal(false);
                  setSelectedPost(null);
                  setPostReports([]);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">⚠️ Delete Post Permanently</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-red-800 dark:text-red-300 font-semibold mb-1">⚠️ Warning: This action cannot be undone!</p>
                <p className="text-red-700 dark:text-red-400 text-sm">
                  All associated data including comments and reactions will be permanently deleted.
                </p>
              </div>

              {/* Post Author */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Post Author:</h4>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {selectedPost.author?.avatar ? (
                    <img 
                      src={selectedPost.author.avatar} 
                      alt={selectedPost.author.username} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {(selectedPost.author?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedPost.author?.name || selectedPost.author?.username || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{selectedPost.author?.email || 'No email'}</div>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              {selectedPost.content && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Post Content:</h4>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{selectedPost.content}</p>
                  </div>
                </div>
              )}

              {/* Data That Will Be Lost */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Data That Will Be Permanently Deleted:</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Reactions</div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">{selectedPost.likes || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Comments</div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">{selectedPost.commentsCount || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Images</div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">{selectedPost.images?.length || 0}</div>
                  </div>
                </div>
              </div>

              {/* Post Details */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Post Information:</h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(selectedPost.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Reports:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{selectedPost.reportsCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedPost.status === 'published' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                      selectedPost.status === 'flagged' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {selectedPost.status || 'published'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Type <span className="text-red-600 dark:text-red-400 font-mono bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                    deleteConfirmText === 'DELETE'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Delete Permanently
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PostsPanel;
