import { X, Phone, Video, MoreVertical, Search, BellOff, Bell, Trash2, UserX, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useCallStore } from "../../store/useCallStore";
import { useState, useEffect } from "react";
import { blockUser, checkBlockStatus, toggleMuteConversation, checkConversationMuteStatus, deleteConversation } from "../../services/api";
import toast from "react-hot-toast";
import PortalDropdown from "../common/PortalDropdown";

const ChatHeader = () => {
  const navigate = useNavigate();
  const { selectedUser, setSelectedUser, messages, getUsers, searchInConversation, setSearchInConversation } = useChatStore();
  const { startCall } = useCallStore();
  const { onlineUsers } = useAuthStore();
  
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showSearchInConversation, setShowSearchInConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matchingMessages, setMatchingMessages] = useState([]);
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

  // Update matching messages when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const matches = messages
        .map((msg, index) => ({ ...msg, originalIndex: index }))
        .filter(msg => msg.text?.toLowerCase().includes(searchQuery.toLowerCase()));
      setMatchingMessages(matches);
      setCurrentMatchIndex(0);
      
      // Update store with search info for highlighting
      setSearchInConversation({
        query: searchQuery,
        currentMatchId: matches[0]?._id || null,
      });
    } else {
      setMatchingMessages([]);
      setCurrentMatchIndex(0);
      setSearchInConversation(null);
    }
  }, [searchQuery, messages, setSearchInConversation]);

  const handleSearchInConversation = () => {
    setShowOptionsMenu(false);
    setShowSearchInConversation(!showSearchInConversation);
    if (showSearchInConversation) {
      setSearchQuery("");
      setSearchInConversation(null);
    }
  };

  const handleNextMatch = () => {
    if (matchingMessages.length === 0) return;
    const newIndex = (currentMatchIndex + 1) % matchingMessages.length;
    setCurrentMatchIndex(newIndex);
    setSearchInConversation({
      query: searchQuery,
      currentMatchId: matchingMessages[newIndex]._id,
    });
  };

  const handlePreviousMatch = () => {
    if (matchingMessages.length === 0) return;
    const newIndex = currentMatchIndex === 0 ? matchingMessages.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(newIndex);
    setSearchInConversation({
      query: searchQuery,
      currentMatchId: matchingMessages[newIndex]._id,
    });
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
      toast.error('Unable to update settings. Please try again.');
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
      toast.error('Unable to delete conversation. Please try again.');
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
      toast.error('Unable to block user. Please try again.');
    }
  };

  // Safety check
  if (!selectedUser) {
    return null;
  }

  return (
    <div className="flex-shrink-0 p-3 lg:p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Back button (mobile only) */}
          <button 
            onClick={() => setSelectedUser(null)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full relative overflow-hidden border-2 border-white dark:border-gray-700 shadow-md">
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
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm animate-pulse" />
            )}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <h3 
              onClick={() => navigate(`/profile/${selectedUser?.username}`)}
              className="font-semibold text-sm sm:text-base lg:text-lg text-gray-800 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
            >
              {selectedUser?.username || "User"}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              {onlineUsers.includes(selectedUser?._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          <button onClick={() => startCall(selectedUser)} className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 group">
            <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </button>
          <button onClick={() => startCall(selectedUser)} className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 group">
            <Video className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </button>
          
          {/* Options Dropdown */}
          <PortalDropdown
            isOpen={showOptionsMenu}
            onClose={() => setShowOptionsMenu(false)}
            width="w-[240px]"
            align="right"
            trigger={
              <button 
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 group"
              >
                <MoreVertical className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </button>
            }
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
              <button
                onClick={handleSearchInConversation}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
              >
                <Search className="w-4 h-4" />
                <span>Search in conversation</span>
              </button>
              
              <button
                onClick={handleToggleMute}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
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
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete conversation</span>
              </button>
              
              <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
              
              <button
                onClick={handleBlockUser}
                disabled={isBlocked}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserX className="w-4 h-4" />
                <span>Block {selectedUser.username}</span>
              </button>
            </div>
          </PortalDropdown>
          
          {/* Close button (desktop only, mobile uses back button) */}
          <button 
            onClick={() => setSelectedUser(null)}
            className="hidden lg:flex p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors duration-200 group ml-1"
          >
            <X className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* Search in Conversation Bar */}
      {showSearchInConversation && (
        <div className="px-3 py-2 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                autoFocus
              />
            </div>
            
            {/* Navigation buttons */}
            {matchingMessages.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                  {currentMatchIndex + 1}/{matchingMessages.length}
                </div>
                <button
                  onClick={handlePreviousMatch}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Previous match"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNextMatch}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Next match"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            
            <button
              onClick={() => {
                setShowSearchInConversation(false);
                setSearchQuery("");
                setSearchInConversation(null);
              }}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {searchQuery && matchingMessages.length === 0 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              No messages found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ChatHeader;