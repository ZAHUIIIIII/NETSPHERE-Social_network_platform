import React from 'react'
import { useChatStore } from '../store/useChatStore';

import Sidebar from '../components/Sidebar';
import NoChatSelected from '../components/NoChatSelected';
import ChatContainer from '../components/ChatContainer';

const ChatPage = () => {
  const { selectedUser } = useChatStore();

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
