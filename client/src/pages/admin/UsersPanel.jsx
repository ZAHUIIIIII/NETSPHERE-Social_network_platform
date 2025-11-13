import React, { useState } from 'react';
import { formatLastActive } from '../../lib/utils';
import PortalDropdown from '../../components/common/PortalDropdown';

const UsersPanel = ({ users, searchQuery, setSearchQuery, suspendUser, activateUser, setSelectedUser, deleteUser }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All Users');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(null);
  const [suspendDuration, setSuspendDuration] = useState(7); // default 7 days
  const [confirmationInput, setConfirmationInput] = useState('');
  
  const filtered = users.filter(u => {
    const matchesSearch = `${u.name} ${u.username} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'All Users' || 
                          (statusFilter === 'Active' && u.status === 'active') ||
                          (statusFilter === 'Suspended' && u.status === 'suspended') ||
                          (statusFilter === 'Banned' && u.status === 'banned');
    return matchesSearch && matchesFilter;
  });

  const handleConfirmAction = () => {
    if (confirmAction && selectedUserForAction) {
      // Check if confirmation is required
      if (confirmAction.requiresConfirmation) {
        if (confirmationInput !== confirmAction.confirmationText) {
          return; // Don't proceed if confirmation text doesn't match
        }
      }
      confirmAction.action(selectedUserForAction._id || selectedUserForAction.id);
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setSelectedUserForAction(null);
      setConfirmationInput('');
    }
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
    setSelectedUserForAction(null);
    setConfirmationInput('');
  };

  const openConfirmDialog = (user, action) => {
    setSelectedUserForAction(user);
    setConfirmAction(action);
    setShowConfirmDialog(true);
    setOpenDropdown(null);
  };

  const handleSuspendClick = (user) => {
    setSelectedUserForAction(user);
    setShowSuspendModal(true);
    setOpenDropdown(null);
  };

  const handleConfirmSuspend = () => {
    if (selectedUserForAction) {
      suspendUser(selectedUserForAction._id || selectedUserForAction.id, suspendDuration);
      setShowSuspendModal(false);
      setSelectedUserForAction(null);
      setSuspendDuration(7); // reset to default
    }
  };

  const handleCancelSuspend = () => {
    setShowSuspendModal(false);
    setSelectedUserForAction(null);
    setSuspendDuration(7); // reset to default
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800 dark:to-gray-800/30 rounded-xl p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-lg overflow-visible">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            User Management
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View and manage all platform users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              className="border border-gray-300 dark:border-gray-600 pl-9 pr-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-56 bg-white dark:bg-gray-700 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-sm"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                  {['All Users', 'Active', 'Suspended', 'Banned'].map(option => (
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
      </div>

      <div className="overflow-x-auto overflow-y-visible rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
            <tr>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">User</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">Status</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Join Date</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">Posts</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">Followers</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">Following</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Active</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="relative divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((u, index) => (
              <tr key={u._id || u.id} className="hover:bg-blue-50/30 dark:hover:bg-gray-700/50 transition-all duration-150 group">{/* Check if this is one of the last 2 rows */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {u.avatar ? (
                      <img 
                        src={u.avatar} 
                        alt={u.username || 'User'} 
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-300 transition-all"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-300 transition-all shadow-sm">
                        {u.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{u.username || 'Unknown'}</span>
                        {u.verified && (
                          <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{u.email || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-1 items-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm ${
                      (u.status || 'active') === 'active' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                      (u.status || 'active') === 'suspended' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' :
                      'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        (u.status || 'active') === 'active' ? 'bg-blue-600' :
                        (u.status || 'active') === 'suspended' ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}></span>
                      {u.status || 'active'}
                    </span>
                    {u.status === 'suspended' && u.suspendedUntil && (
                      <span className="text-xs text-gray-600 dark:text-gray-400 text-center font-medium">
                        Until {new Date(u.suspendedUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-700 dark:text-gray-300 text-sm font-medium">{u.joinDate || 'N/A'}</td>
                <td className="py-4 px-4 text-gray-800 dark:text-gray-200 text-sm text-center font-bold">
                  <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-md bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/30 text-purple-700 dark:text-purple-400">
                    {u.postCount || u.posts || 0}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-800 dark:text-gray-200 text-sm text-center font-bold">
                  <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-md bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/30 text-green-700 dark:text-green-400">
                    {u.followersCount || u.followers?.toLocaleString() || 0}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-800 dark:text-gray-200 text-sm text-center font-bold">
                  <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-md bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-900/30 text-cyan-700 dark:text-cyan-400">
                    {u.followingCount || u.following?.toLocaleString() || 0}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-700 dark:text-gray-300 text-sm font-medium">{formatLastActive(u.lastActive)}</td>
                <td className="py-4 px-4 text-right">
                  <PortalDropdown
                    isOpen={openDropdown === (u._id || u.id)}
                    onClose={() => setOpenDropdown(null)}
                    width="w-52"
                    trigger={
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === (u._id || u.id) ? null : (u._id || u.id));
                        }}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group-hover:bg-blue-50 dark:group-hover:bg-gray-700"
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
                              onClick={() => {
                                setShowDetailsModal(u);
                                setOpenDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-3 transition-all group"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2"/>
                                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              <span className="font-medium">View Details</span>
                            </button>
                            
                            {u.status === 'active' ? (
                              <button
                                onClick={() => handleSuspendClick(u)}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:text-yellow-700 dark:hover:text-yellow-400 flex items-center gap-3 transition-all group"
                              >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                  <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span className="font-medium">Suspend User</span>
                              </button>
                            ) : u.status === 'suspended' ? (
                              <button
                                onClick={() => openConfirmDialog(u, {
                                  action: activateUser,
                                  title: 'Activate User',
                                  message: `Are you sure you want to activate ${u.username}? They will regain access to the platform.`,
                                  confirmText: 'Activate',
                                  confirmClass: 'bg-green-600 hover:bg-green-700'
                                })}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 flex items-center gap-3 transition-all group"
                              >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-500 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="font-medium">Activate</span>
                              </button>
                            ) : u.status === 'banned' ? (
                              <button
                                onClick={() => openConfirmDialog(u, {
                                  action: activateUser,
                                  title: 'Unban User',
                                  message: `Are you sure you want to unban ${u.username}?\n\nOriginal ban reason: "${u.banReason || 'No reason provided'}"\n\nThis will clear the ban and allow them full access to the platform.`,
                                  confirmText: 'Unban User',
                                  confirmClass: 'bg-green-600 hover:bg-green-700'
                                })}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 flex items-center gap-3 transition-all group"
                              >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-500 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="font-medium">Unban User</span>
                              </button>
                            ) : null}
                            
                            <button
                              onClick={() => {
                                setOpenDropdown(null);
                                setSelectedUser(u);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-400 flex items-center gap-3 transition-all group"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4 text-orange-500 dark:text-orange-400 group-hover:text-orange-600 dark:group-hover:text-orange-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              <span className="font-medium">Ban User</span>
                            </button>
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-700" />
                          
                          <div className="py-1.5">
                            <button
                              onClick={() => openConfirmDialog(u, {
                                action: deleteUser,
                                title: '⚠️ Permanent Deletion Warning',
                                message: `You are about to permanently delete @${u.username}. This action is IRREVERSIBLE and will:\n\n• Delete all of their posts\n• Delete all of their comments\n• Delete all notifications involving them\n• Remove them from all follower/following lists\n• Permanently erase their account data\n\nType "${u.username}" below to confirm this destructive action.`,
                                confirmText: 'Delete Forever',
                                confirmClass: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
                                requiresConfirmation: true,
                                confirmationText: u.username
                              })}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-all font-semibold group"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span>Delete User</span>
                            </button>
                          </div>
                  </PortalDropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && selectedUserForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
            {/* Warning Header */}
            <div className={`px-6 py-5 ${confirmAction.requiresConfirmation ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}>
              <div className="flex items-center gap-3 text-white">
                <div className="flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">
                  {confirmAction.title}
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {confirmAction.requiresConfirmation && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Critical Action: Data Cannot Be Recovered
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed whitespace-pre-line">
                {confirmAction.message}
              </p>

              {/* Confirmation Input */}
              {confirmAction.requiresConfirmation && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm by typing: <span className="font-bold text-red-600 dark:text-red-400">{confirmAction.confirmationText}</span>
                  </label>
                  <input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder={confirmAction.confirmationText}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors font-medium placeholder-gray-400 dark:placeholder-gray-500"
                    autoFocus
                  />
                  {confirmationInput && confirmationInput !== confirmAction.confirmationText && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Username does not match
                    </p>
                  )}
                  {confirmationInput === confirmAction.confirmationText && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Confirmed
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelAction}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={confirmAction.requiresConfirmation && confirmationInput !== confirmAction.confirmationText}
                  className={`px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all shadow-lg ${confirmAction.confirmClass} ${
                    confirmAction.requiresConfirmation && confirmationInput !== confirmAction.confirmationText
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {confirmAction.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* User Profile Section */}
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
                {showDetailsModal.avatar ? (
                  <img 
                    src={showDetailsModal.avatar} 
                    alt={showDetailsModal.username} 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                    {showDetailsModal.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-1">{showDetailsModal.username}</h4>
                  <p className="text-sm text-gray-600 mb-2">{showDetailsModal.email}</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    (showDetailsModal.status || 'active') === 'active' ? 'bg-blue-100 text-blue-700' :
                    (showDetailsModal.status || 'active') === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      (showDetailsModal.status || 'active') === 'active' ? 'bg-blue-500' :
                      (showDetailsModal.status || 'active') === 'suspended' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></span>
                    {(showDetailsModal.status || 'active').charAt(0).toUpperCase() + (showDetailsModal.status || 'active').slice(1)}
                  </span>
                </div>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">User ID</div>
                  <div className="text-sm font-medium text-gray-900 break-all">{showDetailsModal._id || showDetailsModal.id}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Join Date</div>
                  <div className="text-sm font-medium text-gray-900">{showDetailsModal.joinDate || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Last Active</div>
                  <div className="text-sm font-medium text-gray-900">{formatLastActive(showDetailsModal.lastActive)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Role</div>
                  <div className="text-sm font-medium text-gray-900">{(showDetailsModal.role || 'user').toUpperCase()}</div>
                </div>
              </div>

              {/* Statistics */}
              <div className="mb-6">
                <h5 className="text-sm font-semibold text-gray-900 mb-3">Statistics</h5>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{showDetailsModal.postCount || 0}</div>
                    <div className="text-xs text-gray-600">Posts</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{showDetailsModal.followersCount || 0}</div>
                    <div className="text-xs text-gray-600">Followers</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-pink-600 mb-1">{showDetailsModal.followingCount || 0}</div>
                    <div className="text-xs text-gray-600">Following</div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {showDetailsModal.bio && (
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">Bio</h5>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">{showDetailsModal.bio}</p>
                </div>
              )}

              {/* Ban Reason if applicable */}
              {showDetailsModal.status === 'banned' && showDetailsModal.banReason && (
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">Ban Reason</h5>
                  <p className="text-sm text-red-700 bg-red-50 rounded-lg p-4">{showDetailsModal.banReason}</p>
                </div>
              )}

              {/* Additional Info */}
              {(showDetailsModal.website || showDetailsModal.location || showDetailsModal.work) && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h5>
                  <div className="space-y-2">
                    {showDetailsModal.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <a href={showDetailsModal.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{showDetailsModal.website}</a>
                      </div>
                    )}
                    {showDetailsModal.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>{showDetailsModal.location}</span>
                      </div>
                    )}
                    {showDetailsModal.work && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>{showDetailsModal.work}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspend Duration Modal */}
      {showSuspendModal && selectedUserForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-yellow-600" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Suspend User: {selectedUserForAction.username}
                </h3>
                <p className="text-sm text-gray-600">
                  Choose how long this user should be suspended. They will be automatically reactivated when the suspension expires.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Suspension Duration</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 1, label: '1 Day' },
                  { value: 3, label: '3 Days' },
                  { value: 7, label: '7 Days' },
                  { value: 14, label: '14 Days' },
                  { value: 30, label: '30 Days' },
                  { value: 0, label: 'Indefinite' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSuspendDuration(option.value)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                      suspendDuration === option.value
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {suspendDuration > 0 && (
                <p className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Will expire on: {new Date(Date.now() + suspendDuration * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelSuspend}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPanel;
