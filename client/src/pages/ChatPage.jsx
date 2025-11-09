import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/useChatStore';

import Sidebar from '../components/message/Sidebar';
import NoChatSelected from '../components/message/NoChatSelected';
import ChatContainer from '../components/message/ChatContainer';

const ChatPage = () => {
  const { selectedUser, setSelectedUser, getMessages } = useChatStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Clear selected user when component unmounts (navigating away from chat page)
  useEffect(() => {
    return () => {
      setSelectedUser(null);
    };
  }, [setSelectedUser]);

  useEffect(() => {
    const userFromState = location.state?.selectedUser;
    
    if (userFromState && userFromState._id !== selectedUser?._id) {
      // Set the selected user from navigation state
      setSelectedUser(userFromState);
      
      // Fetch messages with this user
      getMessages(userFromState._id);
      
      // Clear the state after handling it
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, selectedUser, setSelectedUser, getMessages, navigate, location.pathname]);

  return (
   <div className='h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800'>
    <div className='flex h-full max-w-7xl mx-auto'>
      <div className='flex h-full w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl rounded-none lg:rounded-xl overflow-hidden border border-white/20 dark:border-gray-700/20'>
        {/* Mobile: Show sidebar (user list) when no chat selected, hide when chat open */}
        {/* Desktop: Always show sidebar */}
        <div className={`${selectedUser ? 'hidden lg:flex' : 'flex w-full lg:w-auto'}`}>
          <Sidebar />
        </div>
        
        {/* Desktop: Show "no chat selected" message when no user selected */}
        {/* Mobile: Hidden, just show sidebar */}
        {!selectedUser && (
          <div className='hidden lg:flex flex-1'>
            <NoChatSelected />
          </div>
        )}
        
        {/* Chat Container: Shows when user is selected */}
        {/* Mobile: Full screen, Desktop: Next to sidebar */}
        {selectedUser && (
          <div className='flex-1 w-full lg:w-auto'>
            <ChatContainer />
          </div>
        )}
      </div>
    </div>
   </div>
  )
}

export default ChatPage
