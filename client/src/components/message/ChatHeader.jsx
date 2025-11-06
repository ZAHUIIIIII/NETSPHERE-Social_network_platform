import { X, Phone, Video, MoreVertical, Search, BellOff, Bell, Trash2, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useState, useEffect } from "react";
import { blockUser, checkBlockStatus, toggleMuteConversation, checkConversationMuteStatus, deleteConversation } from "../../services/api";
import toast from "react-hot-toast";
import PortalDropdown from "../common/PortalDropdown";

const ChatHeader = () => {
  const navigate = useNavigate();
  const { selectedUser, setSelectedUser, messages, getUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();
  
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showSearchInConversation, setShowSearchInConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConversationMuted, setIsConversationMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Check if conversation is muted
  useEffect(() => {
    const checkMuteStatus = async () => {
      if (selectedUser?._id) {
        try {
          const response = await checkConversationMuteStatus(selectedUser._id);
          setIsConversationMuted(response.isMuted);
        } catch (error) {
          console.error('Error checking conversation mute status:', error);
        }
      }
    };
    checkMuteStatus();
  }, [selectedUser?._id]);

  // Check if user is blocked
  useEffect(() => {
    const checkBlocked = async () => {
      if (selectedUser?._id) {
        try {
          const response = await checkBlockStatus(selectedUser._id);
          setIsBlocked(response.isBlocked);
        } catch (error) {
          console.error('Error checking block status:', error);
        }
      }
    };
    checkBlocked();
  }, [selectedUser?._id]);

  const handleSearchInConversation = () => {
    setShowOptionsMenu(false);
    setShowSearchInConversation(!showSearchInConversation);
  };

  const handleToggleMute = async () => {
    try {
      setShowOptionsMenu(false);
      const response = await toggleMuteConversation(selectedUser._id);
      setIsConversationMuted(response.isMuted);
      toast.success(response.isMuted 
        ? `Muted conversation with ${selectedUser.username}` 
        : `Unmuted conversation with ${selectedUser.username}`
      );
      await getUsers(); // Refresh the users list to update sidebar with new mute status and unread count
    } catch (error) {
      console.error('Error toggling conversation mute:', error);
      toast.error('Failed to update conversation settings');
    }
  };

  const handleDeleteConversation = async () => {
    try {
      if (!window.confirm(`Are you sure you want to delete this conversation with ${selectedUser.username}? This will only delete the messages for you. This action cannot be undone.`)) {
        return;
      }
      setShowOptionsMenu(false);
      await deleteConversation(selectedUser._id);
      toast.success('Conversation deleted successfully');
      setSelectedUser(null); // Close the chat after deletion
      await getUsers(); // Refresh the users list to update sidebar
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleBlockUser = async () => {
    try {
      if (!window.confirm(`Are you sure you want to block ${selectedUser.username}? You will no longer see their posts and messages.`)) {
        return;
      }
      setShowOptionsMenu(false);
      await blockUser(selectedUser._id);
      setIsBlocked(true);
      toast.success(`Blocked ${selectedUser.username}`);
      setSelectedUser(null); // Close the chat
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  };

  // Safety check
  if (!selectedUser) {
    return null;
  }

  return (
    <div className="p-3 lg:p-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="size-10 lg:size-11 rounded-full relative overflow-hidden border-2 border-white shadow-md">
              <img 
                src={selectedUser?.avatar || "/avatar.png"} 
                alt={selectedUser?.username || "User"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/avatar.png";
                }}
              />
            </div>
            {onlineUsers.includes(selectedUser._id) && (
              <span className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
            )}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <h3 
              onClick={() => navigate(`/profile/${selectedUser?.username}`)}
              className="font-semibold text-base lg:text-lg text-gray-800 truncate hover:text-blue-600 cursor-pointer transition-colors"
            >
              {selectedUser?.username || "User"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {/* <div className={`w-2 h-2 rounded-full ${
                onlineUsers.includes(selectedUser._id) ? 'bg-green-500' : 'bg-gray-400'
              }`} /> */}
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                {onlineUsers.includes(selectedUser?._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group">
            <Phone className="size-4 lg:size-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group">
            <Video className="size-4 lg:size-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
          </button>
          
          {/* Options Dropdown */}
          <PortalDropdown
            isOpen={showOptionsMenu}
            onClose={() => setShowOptionsMenu(false)}
            trigger={
              <button 
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group"
              >
                <MoreVertical className="size-4 lg:size-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </button>
            }
          >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[240px]">
              <button
                onClick={handleSearchInConversation}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <Search className="w-4 h-4" />
                <span>Search in conversation</span>
              </button>
              
              <button
                onClick={handleToggleMute}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                {isConversationMuted ? (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Unmute conversation</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span>Mute conversation</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleDeleteConversation}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete conversation</span>
              </button>
              
              <div className="border-t border-gray-100 my-1"></div>
              
              <button
                onClick={handleBlockUser}
                disabled={isBlocked}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserX className="w-4 h-4" />
                <span>Block {selectedUser.username}</span>
              </button>
            </div>
          </PortalDropdown>
          
          <button 
            onClick={() => setSelectedUser(null)}
            className="p-2 hover:bg-red-50 rounded-full transition-colors duration-200 group ml-1"
          >
            <X className="size-4 lg:size-5 text-gray-600 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Search in Conversation Bar */}
      {showSearchInConversation && (
        <div className="px-3 py-2 border-t border-gray-200/50 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <button
              onClick={() => {
                setShowSearchInConversation(false);
                setSearchQuery("");
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {searchQuery && (
            <div className="mt-2 text-xs text-gray-500">
              {messages.filter(msg => 
                msg.text?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length} message(s) found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ChatHeader;