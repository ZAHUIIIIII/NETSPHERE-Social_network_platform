import { useEffect, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, BellOff } from "lucide-react";

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
    <aside className="h-full w-20 lg:w-80 border-r border-gray-200/50 flex flex-col transition-all duration-200 bg-white/50 backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-gray-200/50 w-full p-3 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Users className="size-4 text-blue-600" />
          </div>
          <span className="font-semibold text-gray-800 hidden lg:block text-sm">Messages</span>
        </div>
        
        {/* Search Bar */}
        <div className="mt-3 hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-3" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/80 border border-gray-200/50 rounded-lg text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
            />
          </div>
        </div>

        {/* Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center justify-between">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-600 font-medium">Online only</span>
          </label>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
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
              hover:bg-blue-50/80 transition-all duration-200
              border-l-4 ${selectedUser?._id === user._id 
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-blue-500 shadow-sm" 
                : "border-l-transparent hover:border-l-blue-200"}
            `}
          >
            <div className="relative mx-auto lg:mx-0 flex-shrink-0">
              <img
                src={user.avatar || "/avatar.png"}
                alt={user.username || "User"}
                className="size-10 lg:size-11 object-cover rounded-full border-2 border-white shadow-sm"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute -bottom-1 -right-1 size-3 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
              )}
              {/* Unread badge for mobile */}
              {user.unreadCount > 0 && (
                <span className="lg:hidden absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 border-2 border-white">
                  {user.unreadCount > 9 ? '9+' : user.unreadCount}
                </span>
              )}
            </div>

            {/* User info - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className="font-semibold text-gray-800 truncate text-sm">{user.username || "Unknown User"}</div>
                  {user.isMuted && (
                    <BellOff className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" title="Muted" />
                  )}
                </div>
                {user.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 ml-2">
                    {user.unreadCount > 99 ? '99+' : user.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {user.lastMessage ? (
                  <div className="flex items-center justify-between min-w-0 flex-1">
                    <span className="text-xs text-gray-500 truncate flex-1">
                      {user.lastMessage.isFromMe ? "You: " : ""}
                      {user.lastMessage.image ? "📷 Photo" : 
                        user.lastMessage.text.length > 30 ? 
                        user.lastMessage.text.substring(0, 30) + "..." : 
                        user.lastMessage.text
                      }
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(user.lastMessage.createdAt)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 font-medium">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-gray-500 py-6 px-3">
            <div className="text-gray-400 mb-2">🔍</div>
            <div className="text-sm font-medium">No conversations found</div>
            <div className="text-xs text-gray-400 mt-1">
              {searchTerm ? "Try a different search term" : "No users match your filter"}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;