import React, { useState } from 'react';
import { formatLastActive } from '../../lib/utils';

const ReportsPanel = ({ reports, resolveReport, dismissReport }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const filtered = reports.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const formatReason = (reason) => {
    return reason.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getReasonColor = (reason) => {
    const colors = {
      spam: 'bg-orange-100 text-orange-700',
      harassment: 'bg-red-100 text-red-700',
      hate_speech: 'bg-red-100 text-red-700',
      violence: 'bg-red-100 text-red-700',
      nudity: 'bg-pink-100 text-pink-700',
      false_information: 'bg-yellow-100 text-yellow-700',
      scam: 'bg-orange-100 text-orange-700',
      terrorism: 'bg-red-100 text-red-700',
      self_harm: 'bg-purple-100 text-purple-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[reason] || colors.other;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">Report Management</h3>
          <p className="text-sm text-gray-500 mt-0.5">Review and handle user reports</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All Reports' },
            { value: 'pending', label: 'Pending' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'dismissed', label: 'Dismissed' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                statusFilter === filter.value
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">No reports found</p>
          </div>
        ) : (
          filtered.map(r => (
            <div key={r._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  {/* Reporter Avatar */}
                  {r.reportedBy?.avatar ? (
                    <img 
                      src={r.reportedBy.avatar} 
                      alt={r.reportedBy.username || 'User'} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {r.reportedBy?.name?.charAt(0) || r.reportedBy?.username?.charAt(0) || '?'}
                    </div>
                  )}
                  
                  {/* Report Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{r.reportedBy?.username || 'Unknown User'}</span>
                      <span className="text-gray-600"> reported a post by </span>
                      <span className="font-semibold">{r.postId?.author?.username || 'Unknown User'}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatLastActive(r.createdAt)}</p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>
                  {r.status}
                </span>
              </div>
              
              {/* Report Details */}
              <div className="mb-3 space-y-2">
                {/* Reason Tags */}
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded font-medium">
                    Post Report
                  </span>
                  <span className={`px-2 py-1 text-xs rounded font-medium ${getReasonColor(r.reason)}`}>
                    {formatReason(r.reason)}
                  </span>
                </div>
                
                {/* Reported Post Content */}
                {r.postId?.content && (
                  <div className="bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">REPORTED POST:</p>
                    <p className="text-sm text-gray-700">{r.postId.content}</p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (window.confirm('Mark this report as resolved?')) {
                        resolveReport(r._id);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Resolve
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Dismiss this report?')) {
                        dismissReport(r._id);
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedReport(r);
                      setShowDetailsModal(true);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    View Details
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Report Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
              {/* Status & Time */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                  {selectedReport.status}
                </span>
                <span className="text-sm text-gray-500">{formatLastActive(selectedReport.createdAt)}</span>
              </div>

              {/* Reporter Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">REPORTER</p>
                <div className="flex items-center gap-3">
                  {selectedReport.reportedBy?.avatar ? (
                    <img 
                      src={selectedReport.reportedBy.avatar} 
                      alt={selectedReport.reportedBy.username} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {selectedReport.reportedBy?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{selectedReport.reportedBy?.username || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{selectedReport.reportedBy?.email || 'No email'}</p>
                  </div>
                </div>
              </div>

              {/* Reported Post Author */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">REPORTED USER</p>
                <div className="flex items-center gap-3">
                  {selectedReport.postId?.author?.avatar ? (
                    <img 
                      src={selectedReport.postId.author.avatar} 
                      alt={selectedReport.postId.author.username} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold">
                      {selectedReport.postId?.author?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{selectedReport.postId?.author?.username || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{selectedReport.postId?.author?.email || 'No email'}</p>
                  </div>
                </div>
              </div>

              {/* Report Reason */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">REASON</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded font-medium">
                    Post Report
                  </span>
                  <span className={`px-2 py-1 text-xs rounded font-medium ${getReasonColor(selectedReport.reason)}`}>
                    {formatReason(selectedReport.reason)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">DESCRIPTION</p>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="text-sm text-gray-700">{selectedReport.description}</p>
                  </div>
                </div>
              )}

              {/* Reported Post Content */}
              {selectedReport.postId?.content && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">REPORTED POST</p>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="text-sm text-gray-700">{selectedReport.postId.content}</p>
                  </div>
                </div>
              )}

              {/* Post Images */}
              {selectedReport.postId?.images && selectedReport.postId.images.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">POST IMAGES</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedReport.postId.images.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt={`Post ${idx + 1}`} 
                        className="w-full h-24 object-cover rounded border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {selectedReport.status === 'pending' && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    if (window.confirm('Mark this report as resolved?')) {
                      resolveReport(selectedReport._id);
                      setShowDetailsModal(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Resolve
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Dismiss this report?')) {
                      dismissReport(selectedReport._id);
                      setShowDetailsModal(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPanel;
