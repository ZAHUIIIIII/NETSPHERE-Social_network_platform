import React, { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../../store/useCallStore';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';

const VideoCallRoom = () => {
  const { 
    call, callAccepted, callEnded, localStream, remoteStream, 
    endCall, isCalling, calledUser, videoEnabled, audioEnabled,
    toggleVideo, toggleAudio
  } = useCallStore();

  const myVideo = useRef();
  const userVideo = useRef();
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (localStream && myVideo.current) {
      myVideo.current.srcObject = localStream;
    }
  }, [localStream, isMinimized]);

  useEffect(() => {
    if (remoteStream && userVideo.current) {
      if ('srcObject' in userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      } else {
        userVideo.current.src = window.URL.createObjectURL(remoteStream);
      }
    }
  }, [remoteStream, callAccepted, isMinimized]);

  // Don't render if there's no active call
  if (callEnded || (!callAccepted && !isCalling)) return null;

  // Determine the name to show
  const displayName = call?.name || calledUser?.name || calledUser?.username || 'Unknown User';

  // Render Mini Player (Picture-in-Picture mode)
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-6 z-[100] w-[280px] h-[380px] bg-gray-900 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-gray-700 hover:scale-105 transition-transform flex flex-col group">
         {callAccepted && remoteStream ? (
           <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-white bg-gray-800">
             <div className="w-16 h-16 rounded-full border-4 border-[#0084ff] border-t-transparent animate-spin mb-4"></div>
             <p className="text-sm font-medium animate-pulse text-gray-300">Calling...</p>
           </div>
         )}
         
         {/* Overlay controls - visible on hover */}
         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
           <div className="flex justify-end">
             <button onClick={() => setIsMinimized(false)} className="p-2 bg-black/50 hover:bg-black/80 rounded-lg text-white backdrop-blur-sm transition-colors">
               <Maximize2 className="w-4 h-4" />
             </button>
           </div>
           
           <div className="flex justify-center gap-3">
             <button onClick={toggleAudio} className={`p-2.5 rounded-full text-white shadow-lg backdrop-blur-sm ${audioEnabled ? 'bg-gray-800/70 hover:bg-gray-700/90' : 'bg-red-500/90 hover:bg-red-600'}`}>
               {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
             </button>
             <button onClick={toggleVideo} className={`p-2.5 rounded-full text-white shadow-lg backdrop-blur-sm ${videoEnabled ? 'bg-gray-800/70 hover:bg-gray-700/90' : 'bg-red-500/90 hover:bg-red-600'}`}>
               {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
             </button>
             <button onClick={endCall} className="p-2.5 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg">
               <PhoneOff className="w-4 h-4" />
             </button>
           </div>
         </div>
      </div>
    );
  }

  // Render Full Room
  return (
    <div className="fixed inset-0 z-[100] bg-[#111] flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="h-20 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-8 absolute top-0 left-0 right-0 z-20 w-full">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <h2 className="text-white font-semibold text-xl tracking-wide">{displayName}</h2>
        </div>
        <button onClick={() => setIsMinimized(true)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
          <Minimize2 className="w-6 h-6" />
        </button>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {callAccepted && remoteStream ? (
          <video 
            playsInline 
            ref={userVideo} 
            autoPlay 
            className="w-full h-full object-cover sm:object-contain" 
          />
        ) : (
           <div className="flex flex-col items-center justify-center text-white z-10">
             {calledUser?.avatar ? (
                <div className="relative mb-8">
                  <img src={calledUser.avatar} alt="Avatar" className="w-40 h-40 rounded-full border-[6px] border-[#0084ff] shadow-[0_0_50px_rgba(0,132,255,0.6)] object-cover relative z-10" />
                  <div className="absolute inset-0 border-[6px] border-[#0084ff] rounded-full animate-ping opacity-50"></div>
                </div>
             ) : (
                <div className="relative mb-8">
                  <div className="w-40 h-40 rounded-full bg-[#0084ff] flex items-center justify-center text-6xl font-bold border-4 border-white relative z-10 shadow-[0_0_50px_rgba(0,132,255,0.6)]">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute inset-0 border-4 border-white rounded-full animate-ping opacity-50"></div>
                </div>
             )}
             <p className="text-3xl font-light mb-3 tracking-wide">{isCalling ? 'Dialing...' : 'Connecting...'}</p>
             <p className="text-gray-400 text-lg">{displayName}</p>
             <div className="mt-8 flex gap-2">
               <div className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce"></div>
               <div className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
               <div className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
           </div>
        )}

        {/* Picture-in-Picture (Local Video) */}
        {localStream && (
          <div className={`absolute bottom-32 right-8 w-36 h-48 md:w-56 md:h-72 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 transition-colors ${videoEnabled ? 'border-gray-600' : 'border-red-500'} z-20`}>
            {videoEnabled ? (
              <video 
                playsInline 
                muted 
                ref={myVideo} 
                autoPlay 
                className="w-full h-full object-cover transform -scale-x-100" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 border-2 border-red-500/50">
                 <VideoOff className="w-10 h-10 text-red-400 mb-2" />
                 <span className="text-gray-400 text-sm">Camera Off</span>
              </div>
            )}
            {!audioEnabled && (
              <div className="absolute top-3 right-3 bg-red-500 p-1.5 rounded-full shadow-lg">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="h-28 bg-gradient-to-t from-black to-transparent absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 px-6 z-30">
        <button 
          onClick={toggleAudio}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 ${audioEnabled ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md' : 'bg-red-500 hover:bg-red-600'}`}
          title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
        >
          {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        
        <button 
          onClick={endCall}
          className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all hover:scale-110"
          title="End Call"
        >
          <PhoneOff className="w-8 h-8" strokeWidth={2.5} />
        </button>
        
        <button 
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 ${videoEnabled ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md' : 'bg-red-500 hover:bg-red-600'}`}
          title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
        >
          {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
};

export default VideoCallRoom;
