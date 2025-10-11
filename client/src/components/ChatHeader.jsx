import { X, Phone, Video, MoreVertical } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

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
            <h3 className="font-semibold text-base lg:text-lg text-gray-800 truncate">
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
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group">
            <MoreVertical className="size-4 lg:size-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
          </button>
          <button 
            onClick={() => setSelectedUser(null)}
            className="p-2 hover:bg-red-50 rounded-full transition-colors duration-200 group ml-1"
          >
            <X className="size-4 lg:size-5 text-gray-600 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;