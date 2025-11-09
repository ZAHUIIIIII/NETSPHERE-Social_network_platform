import { useChatStore } from "../../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../../store/useAuthStore";
import { formatMessageTime } from '../../lib/utils';


const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser?._id, getMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Safety check for required data
  if (!selectedUser || !authUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50/30 to-white/30 dark:from-gray-800/30 dark:to-gray-900/30">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
        <ChatHeader />
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <MessageSkeleton />
        </div>
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-gray-50/30 to-white/30 dark:from-gray-800/30 dark:to-gray-900/30">
      {/* Fixed Header at Top */}
      <ChatHeader />

      {/* Scrollable Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 bg-gradient-to-b from-blue-50/10 via-white/30 to-gray-50/10 dark:from-blue-900/10 dark:via-gray-800/30 dark:to-gray-900/10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Start a conversation</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
              Send your first message to {selectedUser?.username || "this user"} to get the conversation started!
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            // Handle both populated and non-populated senderId
            const messageSenderId = typeof message.senderId === 'object' 
              ? message.senderId._id 
              : message.senderId;
            
            const isMyMessage = messageSenderId === authUser._id;
            
            // Check if we should show avatar based on previous message sender
            const prevMessageSenderId = index > 0 
              ? (typeof messages[index - 1].senderId === 'object' 
                  ? messages[index - 1].senderId._id 
                  : messages[index - 1].senderId)
              : null;
            
            const showAvatar = index === 0 || prevMessageSenderId !== messageSenderId;
            
            return (
              <div
                key={message._id}
                className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
              >
                {/* Message time - positioned above the message */}
                {showAvatar && (
                  <div className={`text-xs text-gray-400 dark:text-gray-500 mb-2 px-2 ${
                    isMyMessage ? "text-right" : "text-left"
                  }`}>
                    {formatMessageTime(message.createdAt)}
                  </div>
                )}

                {/* Message container with avatar and bubble */}
                <div className={`flex items-end gap-3 max-w-[85%] ${isMyMessage ? "justify-end" : "justify-start"}`}>
                  {/* Avatar for received messages */}
                  {!isMyMessage && (
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <div className="relative">
                          <img
                            src={selectedUser?.avatar || "/avatar.png"}
                            alt={selectedUser?.username || "User"}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-sm object-cover"
                            onError={(e) => {
                              e.target.src = "/avatar.png";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8" />
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`relative max-w-md ${
                      isMyMessage
                        ? "bg-blue-500 dark:bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 shadow-sm"
                    } rounded-2xl px-4 py-3`}
                  >
                    {/* Message content */}
                    <div className="space-y-2">
                      {message.image && (
                        <div className="rounded-xl overflow-hidden">
                          <img
                            src={message.image}
                            alt="Attachment"
                            className="max-w-full h-auto rounded-xl"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {message.text && (
                        <p className="text-sm leading-relaxed break-words word-break overflow-wrap-anywhere">
                          {message.text}
                        </p>
                      )}
                    </div>

                    {/* Message tail */}
                    <div
                      className={`absolute bottom-3 w-3 h-3 ${
                        isMyMessage
                          ? "-right-1 bg-blue-500 dark:bg-blue-600 transform rotate-45"
                          : "-left-1 bg-white dark:bg-gray-700 border-l border-b border-gray-100 dark:border-gray-600 transform rotate-45"
                      }`}
                    />
                  </div>

                  {/* Avatar for sent messages */}
                  {isMyMessage && (
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <div className="relative">
                          <img
                            src={authUser?.avatar || "/avatar.png"}
                            alt={authUser?.username || "You"}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-sm object-cover"
                            onError={(e) => {
                              e.target.src = "/avatar.png";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Fixed Input - Always visible at bottom */}
      <MessageInput />
    </div>
  );
};
export default ChatContainer;