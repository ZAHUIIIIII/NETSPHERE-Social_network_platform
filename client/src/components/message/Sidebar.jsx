import { useEffect, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import NewMessageModal from "./NewMessageModal";
import { Users, Search, BellOff, MessageSquarePlus } from "lucide-react";

// Helper function to format time
const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (diffInHours < 168) { // Less than a week
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const matchesOnlineFilter = showOnlineOnly ? onlineUsers.includes(user._id) : true;
    return matchesSearch && matchesOnlineFilter;
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      <NewMessageModal 
        isOpen={isNewMessageModalOpen} 
        onClose={() => setIsNewMessageModalOpen(false)} 
      />
      
      <aside className="h-full w-full lg:w-80 border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col transition-all duration-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        {/* Header */}
        <div className="border-b border-gray-200/50 dark:border-gray-700/50 w-full p-3 lg:p-3 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                <Users className="size-5 lg:size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-100 text-base lg:text-sm">Messages</span>
            </div>
            
            {/* New Message Button */}
            <button
              onClick={() => setIsNewMessageModalOpen(true)}
              className="p-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
              title="New Message"
            >
              <MessageSquarePlus className="size-4" />
            </button>
          </div>
        
        {/* Search Bar */}
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 size-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 lg:py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm lg:text-xs text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 focus:border-blue-500/30 dark:focus:border-blue-400/40 transition-all"
            />
          </div>
        </div>

        {/* Online filter toggle */}
        <div className="mt-3 flex items-center justify-between">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Online only</span>
          </label>
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
            {onlineUsers.length - 1} online
          </span>
        </div>
      </div>

      {/* Users List */}
      <div className="overflow-y-auto w-full py-2 flex-1">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-2 lg:p-3 flex items-center gap-2 lg:gap-3
              hover:bg-blue-50/80 dark:hover:bg-gray-700/50 transition-all duration-200
              border-l-4 ${selectedUser?._id === user._id 
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-blue-500 dark:border-l-blue-400 shadow-sm" 
                : "border-l-transparent hover:border-l-blue-200 dark:hover:border-l-blue-600"}
            `}
          >
            <div className="relative flex-shrink-0">
              <img
                src={user.avatar || "/avatar.png"}
                alt={user.username || "User"}
                className="size-12 lg:size-11 object-cover rounded-full border-2 border-white shadow-sm"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute -bottom-1 -right-1 size-3 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
              )}
            </div>

            {/* User info - visible on all screens */}
            <div className="text-left min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm">{user.username || "Unknown User"}</div>
                  {user.isMuted && (
                    <BellOff className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" title="Muted" />
                  )}
                </div>
                {user.unreadCount > 0 && (
                  <span className="bg-blue-500 dark:bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 ml-2">
                    {user.unreadCount > 99 ? '99+' : user.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {user.lastMessage ? (
                  <div className="flex items-center justify-between min-w-0 flex-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                      {user.lastMessage.isFromMe ? "You: " : ""}
                      {user.lastMessage.image ? "📷 Photo" : 
                        user.lastMessage.text.length > 30 ? 
                        user.lastMessage.text.substring(0, 30) + "..." : 
                        user.lastMessage.text
                      }
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(user.lastMessage.createdAt)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-6 px-3">
            <div className="text-gray-400 dark:text-gray-500 mb-2">🔍</div>
            <div className="text-sm font-medium dark:text-gray-300">No conversations found</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm ? "Try a different search term" : "Click 'New Message' to start chatting"}
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  );
};
export default Sidebar;