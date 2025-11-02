import React, { useState, useEffect } from 'react';
import { BellOff, Bell } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import toast from 'react-hot-toast';

const MuteUserButton = ({ userId, username, className = '', showLabel = true }) => {
  const { toggleUserMute, notificationSettings, fetchNotificationSettings } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    fetchNotificationSettings();
  }, [fetchNotificationSettings]);

  useEffect(() => {
    setIsMuted(notificationSettings.mutedUsers?.includes(userId) || false);
  }, [notificationSettings.mutedUsers, userId]);

  const handleToggle = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsLoading(true);
    try {
      const result = await toggleUserMute(userId);
      const nowMuted = result.settings.mutedUsers.includes(userId);
      setIsMuted(nowMuted);
      
      toast.success(
        nowMuted 
          ? `Muted notifications from @${username}` 
          : `Unmuted notifications from @${username}`
      );
    } catch (error) {
      toast.error('Failed to update mute settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        isMuted 
          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={isMuted ? `Unmute @${username}` : `Mute @${username}`}
    >
      {isMuted ? (
        <>
          <Bell className="w-4 h-4" />
          {showLabel && <span className="text-sm font-medium">Unmute</span>}
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4" />
          {showLabel && <span className="text-sm font-medium">Mute</span>}
        </>
      )}
    </button>
  );
};

export default MuteUserButton;
