import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../lib/axios';

const ReportPostModal = ({ isOpen, onClose, postId, postAuthor }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: '', label: 'Select a reason...', disabled: true },
    { value: 'spam', label: '🚫 Spam or Misleading' },
    { value: 'harassment', label: '😠 Harassment or Bullying' },
    { value: 'hate_speech', label: '⚠️ Hate Speech' },
    { value: 'violence', label: '🔪 Violence or Dangerous' },
    { value: 'nudity', label: '🔞 Nudity or Sexual Content' },
    { value: 'false_information', label: '📰 False Information' },
    { value: 'scam', label: '💰 Scam or Fraud' },
    { value: 'terrorism', label: '☠️ Terrorism or Extremism' },
    { value: 'self_harm', label: '⚕️ Self-Harm or Suicide' },
    { value: 'other', label: '🔧 Other (Please specify)' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      toast.error('Please specify the reason for "Other"');
      return;
    }

    setIsSubmitting(true);
    try {
      // If "other" is selected, use customReason as description
      const finalDescription = selectedReason === 'other' 
        ? `${customReason.trim()}${description.trim() ? ' | ' + description.trim() : ''}`
        : description.trim();

      await axiosInstance.post(`/reports/posts/${postId}`, {
        reason: selectedReason,
        description: finalDescription
      });

      toast.success('Report submitted successfully. We will review it shortly.');
      onClose();
      setSelectedReason('');
      setCustomReason('');
      setDescription('');
    } catch (error) {
      if (error.response?.data?.message === 'You have already reported this post') {
        toast.error('You have already reported this post');
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit report');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSelectedReason('');
      setCustomReason('');
      setDescription('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-5">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <h2 className="text-xl font-bold">Report Post</h2>
                <p className="text-sm text-white/90">Help us keep the community safe</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white/90 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Post Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You are reporting a post by <span className="font-semibold text-gray-900 dark:text-gray-100">{postAuthor}</span>
            </p>
          </div>

          {/* Warning Banner */}
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800/50 rounded-xl">
            <div className="flex items-start gap-3">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">Important Notice</p>
                <p>False reports may result in action against your account. Please only report content that violates our community guidelines.</p>
              </div>
            </div>
          </div>

          {/* Reason Selection - Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Why are you reporting this post? <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value);
                if (e.target.value !== 'other') {
                  setCustomReason('');
                }
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-gray-100 font-medium bg-white dark:bg-gray-900 cursor-pointer transition-all"
              required
            >
              {reportReasons.map((reason) => (
                <option 
                  key={reason.value} 
                  value={reason.value}
                  disabled={reason.disabled}
                  className="py-2"
                >
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason Input (shown only when "Other" is selected) */}
          {selectedReason === 'other' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Please specify the reason <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter your reason for reporting..."
                maxLength={100}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {customReason.length}/100 characters
              </p>
            </div>
          )}

          {/* Additional Details */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Additional Details <span className="text-gray-500 dark:text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about why you're reporting this post..."
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Help us understand the issue better</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">{description.length}/500</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedReason}
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportPostModal;
