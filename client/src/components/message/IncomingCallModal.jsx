import React from 'react';
import { useCallStore } from '../../store/useCallStore';
import { Phone, PhoneOff } from 'lucide-react';

const IncomingCallModal = () => {
  const { call, callAccepted, answerCall, rejectCall } = useCallStore();

  if (!call || !call.isReceivingCall || callAccepted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#242526] p-8 rounded-2xl shadow-2xl flex flex-col items-center w-80 transform transition-all scale-100">
        <div className="w-24 h-24 mb-4 rounded-full overflow-hidden border-4 border-[#0084ff] shadow-[0_0_20px_rgba(0,132,255,0.4)] relative">
          <img 
            src={call.avatar || "/avatar.png"} 
            alt={call.name} 
            className="w-full h-full object-cover relative z-10"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{call.name}</h2>
        <p className="text-[#0084ff] dark:text-[#2d9cdb] font-medium mb-8 animate-pulse text-sm tracking-wide uppercase">Incoming Video Call...</p>
        
        <div className="flex w-full justify-between px-2">
          <button 
            onClick={rejectCall}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-red-500 group-hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
              <PhoneOff strokeWidth={2.5} className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-red-500 transition-colors">Decline</span>
          </button>
          
          <button 
            onClick={answerCall}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-green-500 group-hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse hover:animate-none transition-transform group-hover:scale-110">
              <Phone strokeWidth={2.5} className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-green-500 transition-colors">Answer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
