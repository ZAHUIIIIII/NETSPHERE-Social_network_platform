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
   <div className='h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'>
    <div className='flex h-full max-w-7xl mx-auto'>
      <div className='flex h-full w-full bg-white/80 backdrop-blur-sm shadow-2xl rounded-none lg:rounded-xl overflow-hidden border border-white/20'>
        <Sidebar />
        {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
      </div>
    </div>
   </div>
  )
}

export default ChatPage
