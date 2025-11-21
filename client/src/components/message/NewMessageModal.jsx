import { useState, useEffect } from "react";
import { X, Search, MessageSquare } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";

const NewMessageModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getAllUsersForNewMessage, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (value) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const users = await getAllUsersForNewMessage();
      const filtered = users.filter((user) =>
        user.username?.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Unable to search users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    onClose();
    setSearchTerm("");
    setSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              New Message
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 focus:border-blue-500/30 dark:focus:border-blue-400/40 transition-all"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : !searchTerm ? (
            <div className="text-center py-12 px-4">
              <div className="text-gray-400 dark:text-gray-500 mb-2 text-3xl">🔍</div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Search for users
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Type a username to start searching
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-gray-400 dark:text-gray-500 mb-2 text-3xl">😔</div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                No users found
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Try a different search term
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 group"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.avatar || "/avatar.png"}
                      alt={user.username}
                      className="w-12 h-12 object-cover rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
                    />
                    {onlineUsers.includes(user._id) && (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm">
                      {user.username}
                    </div>
                    {user.bio && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {user.bio}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {onlineUsers.includes(user._id) ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Online
                        </span>
                      ) : (
                        "Offline"
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2 bg-blue-500 dark:bg-blue-600 text-white rounded-full">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewMessageModal;
