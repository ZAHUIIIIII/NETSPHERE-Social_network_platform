import React, { useState } from 'react';
import { formatLastActive } from '../../lib/utils';

const ReportsPanel = ({ reports, resolveReport, dismissReport }) => {
  const [statusFilter, setStatusFilter] = useState('All Reports');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);

  const filtered = reports.filter(r => {
    if (statusFilter === 'All Reports') return true;
    if (statusFilter === 'Pending') return r.status === 'pending';
    if (statusFilter === 'Reviewing') return r.status === 'reviewing';
    if (statusFilter === 'Resolved') return r.status === 'resolved';
    return true;
  });

  // Helper function to format reason for display
  const formatReason = (reason) => {
    return reason.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Helper function to get reason badge color
  const getReasonColor = (reason) => {
    const colors = {
      spam: 'from-orange-50 to-orange-100 text-orange-700',
      harassment: 'from-red-50 to-red-100 text-red-700',
      hate_speech: 'from-red-50 to-red-100 text-red-700',
      violence: 'from-red-50 to-red-100 text-red-700',
      nudity: 'from-pink-50 to-pink-100 text-pink-700',
      false_information: 'from-yellow-50 to-yellow-100 text-yellow-700',
      scam: 'from-orange-50 to-orange-100 text-orange-700',
      terrorism: 'from-red-50 to-red-100 text-red-700',
      self_harm: 'from-purple-50 to-purple-100 text-purple-700',
      other: 'from-gray-50 to-gray-100 text-gray-700'
    };
    return colors[reason] || colors.other;
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const handleResolveClick = (report) => {
    setSelectedReport(report);
    setShowResolveModal(true);
  };

  const handleDismissClick = (report) => {
    setSelectedReport(report);
    setShowDismissModal(true);
  };

  const confirmResolve = () => {
    if (selectedReport) {
      resolveReport(selectedReport._id);
      setShowResolveModal(false);
      setSelectedReport(null);
    }
  };

  const confirmDismiss = () => {
    if (selectedReport) {
      dismissReport(selectedReport._id);
      setShowDismissModal(false);
      setSelectedReport(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800 dark:to-gray-800/30 rounded-xl p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Report Management
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Review and handle user reports</p>
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
                {['All Reports', 'Pending', 'Reviewing', 'Resolved'].map(option => (
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
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg viewBox="0 0 24 24" className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Reports Found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">There are no reports matching your filter criteria.</p>
          </div>
        ) : (
          filtered.map(r => (
            <div key={r._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {r.reportedBy?.avatar ? (
                    <img 
                      src={r.reportedBy.avatar} 
                      alt={r.reportedBy.username || 'User'} 
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white dark:ring-gray-700">
                      {r.reportedBy?.name?.charAt(0) || r.reportedBy?.username?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 leading-tight">
                      <span className="font-bold">{r.reportedBy?.username || r.reportedBy?.name || 'Unknown User'}</span>
                      <span className="text-gray-600 dark:text-gray-400 font-medium"> reported a post by </span>
                      <span className="font-bold">{r.postId?.author?.username || r.postId?.author?.name || 'Unknown User'}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{formatLastActive(r.createdAt)}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold shadow-sm ${
                  r.status === 'pending' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' :
                  r.status === 'reviewing' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                  r.status === 'resolved' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                  'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                }`}>
                  <svg viewBox="0 0 8 8" className="w-2 h-2" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="4" cy="4" r="4"/>
                  </svg>
                  {r.status}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex gap-2 items-center mb-2">
                  <span className="inline-flex items-center text-xs bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 px-3 py-1 rounded-md font-bold shadow-sm">
                    Post Report
                  </span>
                  <span className={`inline-flex items-center text-xs bg-gradient-to-r px-3 py-1 rounded-md font-bold shadow-sm ${getReasonColor(r.reason)}`}>
                    {formatReason(r.reason)}
                  </span>
                </div>
                {r.postId?.content && (
                  <div className="bg-blue-50/50 dark:bg-blue-900/20 px-3 py-2 rounded-md border border-blue-100/50 dark:border-blue-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase mb-1">REPORTED POST:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">{r.postId.content}</p>
                  </div>
                )}
              </div>
              
              {(r.status === 'pending' || r.status === 'reviewing') && (
                <div className="flex items-center gap-2 pt-2">
                  <button 
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-md hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-sm hover:shadow-md"
                    onClick={() => handleResolveClick(r)}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Resolve
                  </button>
                  <button 
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-600 transition-all font-semibold shadow-sm hover:shadow-md"
                    onClick={() => handleDismissClick(r)}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Dismiss
                  </button>
                  <button 
                    onClick={() => handleViewDetails(r)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all font-semibold shadow-sm hover:shadow-md"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    View Details
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Report Details
                  </h3>
                  <p className="text-blue-100 text-sm">Reported {formatLastActive(selectedReport.createdAt)}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white/80 hover:text-white transition-colors ml-4"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Status Badge */}
              <div className="mb-6">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md ${
                  selectedReport.status === 'pending' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' :
                  selectedReport.status === 'reviewing' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                  selectedReport.status === 'resolved' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                  'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                }`}>
                  <svg viewBox="0 0 8 8" className="w-2 h-2" fill="currentColor">
                    <circle cx="4" cy="4" r="4"/>
                  </svg>
                  Status: {selectedReport.status}
                </span>
              </div>

              {/* Reporter Info */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-3">Reporter Information</h4>
                <div className="flex items-center gap-3">
                  {selectedReport.reportedBy?.avatar ? (
                    <img 
                      src={selectedReport.reportedBy.avatar} 
                      alt={selectedReport.reportedBy.username} 
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-200 dark:ring-blue-800"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-blue-200 dark:ring-blue-800">
                      {selectedReport.reportedBy?.name?.charAt(0) || selectedReport.reportedBy?.username?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{selectedReport.reportedBy?.name || selectedReport.reportedBy?.username || 'Unknown User'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{selectedReport.reportedBy?.username || 'unknown'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{selectedReport.reportedBy?.email || 'No email'}</p>
                  </div>
                </div>
              </div>

              {/* Reported Post Author */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4 border border-red-200 dark:border-red-800/50">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-3">Reported Post Author</h4>
                <div className="flex items-center gap-3">
                  {selectedReport.postId?.author?.avatar ? (
                    <img 
                      src={selectedReport.postId.author.avatar} 
                      alt={selectedReport.postId.author.username} 
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-red-200 dark:ring-red-800"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-red-200 dark:ring-red-800">
                      {selectedReport.postId?.author?.name?.charAt(0) || selectedReport.postId?.author?.username?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{selectedReport.postId?.author?.name || selectedReport.postId?.author?.username || 'Unknown User'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{selectedReport.postId?.author?.username || 'unknown'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{selectedReport.postId?.author?.email || 'No email'}</p>
                  </div>
                </div>
              </div>

              {/* Report Reason */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Report Reason</h4>
                <div className="flex gap-2">
                  <span className="inline-flex items-center text-sm bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-xl font-bold shadow-sm">
                    Post Report
                  </span>
                  <span className={`inline-flex items-center text-sm bg-gradient-to-r px-4 py-2 rounded-xl font-bold shadow-sm ${getReasonColor(selectedReport.reason)}`}>
                    {formatReason(selectedReport.reason)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Description</h4>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedReport.description}</p>
                  </div>
                </div>
              )}

              {/* Reported Post Content */}
              {selectedReport.postId?.content && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Reported Post Content</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800/50">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedReport.postId.content}</p>
                  </div>
                </div>
              )}

              {/* Post Images */}
              {selectedReport.postId?.images && selectedReport.postId.images.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Post Images ({selectedReport.postId.images.length})</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedReport.postId.images.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt={`Post image ${idx + 1}`} 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Post Videos */}
              {selectedReport.postId?.videos && selectedReport.postId.videos.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Post Videos ({selectedReport.postId.videos.length})</h4>
                  <div className="space-y-2">
                    {selectedReport.postId.videos.map((video, idx) => (
                      <div key={idx} className="relative">
                        <video 
                          src={video.url}
                          poster={video.thumbnail}
                          controls
                          className="w-full max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-black"
                        />
                        {video.duration && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Duration: {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {(selectedReport.status === 'pending' || selectedReport.status === 'reviewing') && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleResolveClick(selectedReport);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold shadow-lg hover:shadow-xl"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Resolve Report
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleDismissClick(selectedReport);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all font-bold shadow-lg hover:shadow-xl"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Dismiss Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve Confirmation Modal */}
      {showResolveModal && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Resolve Report</h3>
                  <p className="text-green-50 text-sm">Mark this report as resolved</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                      This will mark the report as resolved. The report will remain in the system but will be marked as handled.
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Summary */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <span className="font-bold">{selectedReport.reportedBy?.name || selectedReport.reportedBy?.username || 'Unknown User'}</span>
                  <span className="text-gray-600 dark:text-gray-400"> reported a post by </span>
                  <span className="font-bold">{selectedReport.postId?.author?.name || selectedReport.postId?.author?.username || 'Unknown User'}</span>
                </p>
                <span className={`inline-flex items-center text-xs bg-gradient-to-r px-3 py-1 rounded-lg font-bold shadow-sm ${getReasonColor(selectedReport.reason)}`}>
                  {formatReason(selectedReport.reason)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResolve}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-lg hover:shadow-xl"
                >
                  Confirm Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Confirmation Modal */}
      {showDismissModal && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Dismiss Report</h3>
                  <p className="text-gray-100 text-sm">Mark this report as dismissed</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">
                      This will dismiss the report. Use this if the report is invalid or doesn't require action.
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Summary */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <span className="font-bold">{selectedReport.reportedBy?.name || selectedReport.reportedBy?.username || 'Unknown User'}</span>
                  <span className="text-gray-600 dark:text-gray-400"> reported a post by </span>
                  <span className="font-bold">{selectedReport.postId?.author?.name || selectedReport.postId?.author?.username || 'Unknown User'}</span>
                </p>
                <span className={`inline-flex items-center text-xs bg-gradient-to-r px-3 py-1 rounded-lg font-bold shadow-sm ${getReasonColor(selectedReport.reason)}`}>
                  {formatReason(selectedReport.reason)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDismissModal(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDismiss}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all font-bold shadow-lg hover:shadow-xl"
                >
                  Confirm Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPanel;
