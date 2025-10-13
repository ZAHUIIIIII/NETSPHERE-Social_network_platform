// client/src/components/common/SaveButton.jsx
import React, { useState, useEffect } from 'react';
import { Bookmark, Loader } from 'lucide-react';
import { savePost, checkPostSaved } from '../../services/api';
import toast from 'react-hot-toast';

const SaveButton = ({ postId, variant = 'icon', className = '' }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSavedStatus();
  }, [postId]);

  const checkSavedStatus = async () => {
    try {
      const result = await checkPostSaved(postId);
      setIsSaved(result.isSaved || false);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await savePost(postId);
      setIsSaved(result.isSaved);
      toast.success(result.isSaved ? 'Post saved!' : 'Removed from saved', {
        icon: result.isSaved ? '🔖' : '📌',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to save post');
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleToggleSave}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all disabled:opacity-50 ${
          isSaved
            ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
        } ${className}`}
      >
        {isLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Bookmark className={isSaved ? 'fill-current' : ''} size={16} />
        )}
        <span className="text-sm font-medium">
          {isSaved ? 'Saved' : 'Save'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={isLoading}
      aria-label={isSaved ? 'Unsave post' : 'Save post'}
      className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${
        isSaved
          ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
          : 'text-gray-600 hover:bg-gray-50'
      } ${className}`}
    >
      {isLoading ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        <Bookmark className={isSaved ? 'fill-current' : ''} size={16} />
      )}
    </button>
  );
};

export default SaveButton;