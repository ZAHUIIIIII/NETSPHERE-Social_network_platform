import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useCallStore } from '../../store/useCallStore';
import { MessageCircle, X, Maximize2, Edit, Phone, Video, Minus, Image as ImageIcon, Smile, Send, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const FloatingWidget = () => {
  const { 
    floatingWidgetState, setFloatingWidgetState, floatingChatUser, 
    closeFloatingChat, openFloatingChat, users, getUsers,
    messages, sendMessage 
  } = useChatStore();
  const { startCall } = useCallStore();
  const { authUser, onlineUsers } = useAuthStore();
  const navigate = useNavigate();

  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authUser) {
      getUsers();
    }
  }, [authUser, getUsers]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (floatingWidgetState === 'chat' && messageEndRef.current) {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, floatingWidgetState]);

  if (!authUser) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isLoading) return;

    setIsLoading(true);
    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      }, floatingChatUser._id);

      setText("");
      removeImage();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. COLLAPSED STATE
  if (floatingWidgetState === 'collapsed') {
    const recentUsers = users.slice(0, 3);
    return (
      <div 
        onClick={() => setFloatingWidgetState('list')}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white dark:bg-[#242526] text-gray-900 dark:text-white px-5 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-[#3A3B3C] transition-colors border border-gray-200 dark:border-gray-700 hover:scale-105 transform duration-200"
      >
        <div className="flex items-center gap-2 font-semibold">
          <MessageCircle className="w-5 h-5" />
          <span>Messages</span>
        </div>
        {recentUsers.length > 0 && (
          <div className="flex -space-x-2 pl-3 border-l border-gray-300 dark:border-gray-600">
            {recentUsers.map((u, i) => (
              <img 
                key={u._id} 
                src={u.avatar || "/avatar.png"} 
                alt={u.username} 
                className="w-8 h-8 rounded-full border-2 border-white dark:border-[#242526] object-cover" 
                style={{ zIndex: 3 - i }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. LIST STATE
  if (floatingWidgetState === 'list') {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-[340px] bg-white dark:bg-[#242526] text-gray-900 dark:text-[#e4e6eb] rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.15)] dark:shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-gray-700 flex flex-col h-[550px] overflow-hidden transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-xl">Messages</h3>
          <div className="flex items-center gap-2">
            <button 
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full text-gray-500 dark:text-gray-400 transition-colors"
              onClick={() => navigate('/messages')}
              title="Open Full Messenger"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full text-gray-500 dark:text-gray-400 transition-colors"
              onClick={() => setFloatingWidgetState('collapsed')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {users.length === 0 ? (
            <p className="text-center text-gray-500 mt-10 text-sm">No recent messages</p>
          ) : (
            users.map(u => {
              const isOnline = onlineUsers.includes(u._id);
              return (
                <div 
                  key={u._id}
                  onClick={() => openFloatingChat(u)}
                  className="flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-[#3A3B3C] rounded-lg cursor-pointer transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <img src={u.avatar || "/avatar.png"} alt={u.username} className="w-12 h-12 rounded-full object-cover" />
                    {isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#242526] rounded-full"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] truncate">{u.name || u.username}</p>
                    <p className="text-[13px] text-gray-500 dark:text-[#b0b3b8] truncate">
                      {u.lastMessage ? (
                        <span>
                          {u.lastMessage.isFromMe ? "You: " : ""}
                          {u.lastMessage.text?.startsWith('CALL_ENDED:') ?
                            (u.lastMessage.text.includes(':video:') ? "📹 Cuộc gọi video" : "📞 Cuộc gọi thoại") :
                           u.lastMessage.text || "Sent an image"
                          }
                        </span>
                      ) : (
                        "Tap to message"
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="absolute bottom-4 right-4">
          <button 
            className="p-3 bg-blue-600 dark:bg-gray-700 hover:bg-blue-700 dark:hover:bg-gray-600 rounded-full text-white shadow-lg transition-colors border border-transparent dark:border-gray-600"
            onClick={() => navigate('/messages')}
          >
            <Edit className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // 3. CHAT STATE
  if (floatingWidgetState === 'chat' && floatingChatUser) {
    const isOnline = onlineUsers.includes(floatingChatUser._id);
    
    // Filter global messages for this specific conversation
    const chatMessages = messages.filter(m => {
      const senderId = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
      const receiverId = typeof m.receiverId === 'object' ? m.receiverId._id : m.receiverId;
      
      return (senderId === floatingChatUser._id && receiverId === authUser._id) || 
             (receiverId === floatingChatUser._id && senderId === authUser._id);
    });

    return (
      <div className="fixed bottom-6 right-6 z-50 w-[340px] bg-white dark:bg-[#242526] rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.15)] dark:shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-gray-700 flex flex-col h-[500px] overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] shadow-sm z-10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/profile/${floatingChatUser.username}`)}>
            <div className="relative flex-shrink-0">
              <img src={floatingChatUser.avatar || "/avatar.png"} alt={floatingChatUser.username} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-none" />
              {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#242526]"></span>}
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 truncate">{floatingChatUser.name || floatingChatUser.username}</h3>
              <p className="text-[12px] text-gray-500 dark:text-gray-400">{isOnline ? 'Active now' : 'Offline'}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 text-[#0084ff] dark:text-[#b0b3b8]">
            <button onClick={() => startCall(floatingChatUser, 'audio')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full transition-colors"><Phone className="w-[18px] h-[18px]" /></button>
            <button onClick={() => startCall(floatingChatUser, 'video')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full transition-colors"><Video className="w-[20px] h-[20px]" /></button>
            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full transition-colors" onClick={() => setFloatingWidgetState('collapsed')}><Minus className="w-[20px] h-[20px]" /></button>
            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full transition-colors" title="Back to list" onClick={() => closeFloatingChat()}><X className="w-[20px] h-[20px]" /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white dark:bg-[#18191A] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {chatMessages.length === 0 ? (
            <div className="text-center text-sm text-gray-500 mt-10">Start a conversation</div>
          ) : (
            chatMessages.map((message) => {
              const isMyMessage = (typeof message.senderId === 'object' ? message.senderId._id : message.senderId) === authUser._id;
              return (
                <div key={message._id} className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-[20px] px-3.5 py-2 text-[15px] leading-[1.35] shadow-sm ${isMyMessage ? "bg-[#0084ff] text-white" : "bg-[#f0f2f5] dark:bg-[#3E4042] text-gray-900 dark:text-[#e4e6eb]"}`}>
                    {message.image && <img src={message.image} alt="Attachment" className="max-w-full rounded-xl mb-1 object-cover" />}
                    {message.text && message.text.startsWith('CALL_ENDED:') ? (
                        <div className="flex items-center gap-3 py-1 pr-2">
                          <div className={`w-9 h-9 rounded-full ${isMyMessage ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'} flex items-center justify-center flex-shrink-0`}>
                            {message.text.includes(':video:') ? <Video className="w-[18px] h-[18px]" /> : <PhoneCall className="w-[18px] h-[18px]" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-[14px]">
                              {message.text.includes(':video:') ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}
                            </span>
                            <span className="text-[12px] opacity-80">{message.text.split(':').pop()}</span>
                          </div>
                        </div>
                    ) : message.text ? (
                       <p className="break-words font-normal">{message.text}</p>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
          
          {/* Image Preview Area */}
          {imagePreview && (
            <div className="flex justify-end">
              <div className="relative group max-w-[50%]">
                 <img src={imagePreview} alt="Preview" className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 object-cover" />
                 <button onClick={removeImage} className="absolute -top-2 -right-2 bg-gray-800 text-white p-1 rounded-full opacity-100 shadow-md">
                   <X className="w-3 h-3" />
                 </button>
              </div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Input */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526]">
          <form onSubmit={handleSendMessage} className="flex items-center gap-1">
            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
            
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-[#0084ff] hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full transition-colors flex-shrink-0">
              <ImageIcon className="w-[20px] h-[20px]" />
            </button>
            <button type="button" className="p-1.5 text-[#0084ff] hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full transition-colors flex-shrink-0">
              <Smile className="w-[20px] h-[20px]" />
            </button>
            
            <input
              type="text"
              placeholder="Aa"
              className="flex-1 bg-[#f0f2f5] dark:bg-[#3A3B3C] border-none rounded-full px-3.5 py-1.5 text-[15px] focus:outline-none dark:text-[#e4e6eb] placeholder-[#65676b] dark:placeholder-[#b0b3b8] min-w-0"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            <button 
              type="submit" 
              disabled={(!text.trim() && !imagePreview) || isLoading}
              className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${(!text.trim() && !imagePreview) || isLoading ? 'text-blue-300 dark:text-gray-500 cursor-not-allowed' : 'text-[#0084ff] hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'}`}
            >
              <Send className="w-[20px] h-[20px]" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default FloatingWidget;
