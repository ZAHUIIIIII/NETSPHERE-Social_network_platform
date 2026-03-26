import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import SimplePeer from 'simple-peer/simplepeer.min.js';
import toast from 'react-hot-toast';

export const useCallStore = create((set, get) => ({
  localStream: null,
  remoteStream: null,
  call: null, // { isReceivingCall: boolean, from: string, name: string, signal: object, avatar: string }
  callAccepted: false,
  callEnded: false,
  isCalling: false, // Represents when current user is dialing out
  calledUser: null, // Track who we are dialing out to
  callStartTime: null, // Track when the call was accepted
  connectionRef: null,
  videoEnabled: true,
  audioEnabled: true,

  startCall: async (userToCall) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      set({ 
        localStream: stream, 
        isCalling: true, 
        callEnded: false, 
        calledUser: userToCall,
        videoEnabled: true,
        audioEnabled: true
      });

      const socket = useAuthStore.getState().socket;
      const authUser = useAuthStore.getState().authUser;

      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on('signal', (data) => {
        socket.emit('callUser', {
          userToCall: userToCall._id,
          signalData: data,
          from: authUser._id,
          name: authUser.username,
          avatar: authUser.avatar || ""
        });
      });

      peer.on('stream', (currentStream) => {
        set({ remoteStream: currentStream });
      });

      // Clear any previous listeners
      socket.off('callAccepted');
      socket.off('callRejected');

      socket.on('callAccepted', (signal) => {
        set({ callAccepted: true, isCalling: false, callStartTime: Date.now() });
        peer.signal(signal);
      });

      socket.on('callRejected', () => {
        set({ isCalling: false, callEnded: true, calledUser: null });
        toast.error('Call declined or unanswered');
        peer.destroy();
        get().endCallLocal();
      });

      peer.on('close', () => {
        socket.off('callAccepted');
        socket.off('callRejected');
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
      });

      set({ connectionRef: peer });

    } catch (err) {
      console.error("Camera error:", err);
      toast.error('Could not access camera/microphone');
    }
  },

  answerCall: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      set({ 
        localStream: stream, 
        callAccepted: true,
        callStartTime: Date.now(),
        videoEnabled: true,
        audioEnabled: true
      });
      
      const { call } = get();
      const socket = useAuthStore.getState().socket;

      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream,
      });

      peer.on('signal', (data) => {
        socket.emit('answerCall', { signal: data, to: call.from });
      });

      peer.on('stream', (currentStream) => {
        set({ remoteStream: currentStream });
      });

      peer.signal(call.signal);
      set({ connectionRef: peer });

    } catch (err) {
      console.error(err);
      toast.error('Could not access camera/microphone');
      get().rejectCall(); // Automatically reject since no devices
    }
  },

  rejectCall: () => {
    const { call } = get();
    const socket = useAuthStore.getState().socket;
    if (call?.from) {
      socket.emit('rejectCall', { to: call.from });
    }
    set({ call: null });
  },

  stopMediaTracks: () => {
    const { localStream } = get();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
  },

  endCallLocal: () => {
    get().stopMediaTracks();
    const { connectionRef, callStartTime, isCalling, calledUser } = get();
    
    // Calculate duration and send message if this was a connected call
    if (callStartTime && calledUser) {
      const durationSeconds = Math.floor((Date.now() - callStartTime) / 1000);
      const m = Math.floor(durationSeconds / 60);
      const s = durationSeconds % 60;
      const durationStr = m > 0 ? `${m}m ${s}s` : `${s}s`;
      
      // Send chat message
      import('./useChatStore').then(({ useChatStore }) => {
        useChatStore.getState().sendMessage({
          text: `CALL_ENDED:${durationStr}`
        }, calledUser._id).catch(console.error);
      });
    } else if (callStartTime && !calledUser) {
      // For the receiver, just show a toast duration
      const durationSeconds = Math.floor((Date.now() - callStartTime) / 1000);
      const m = Math.floor(durationSeconds / 60);
      const s = durationSeconds % 60;
      const durationStr = m > 0 ? `${m}m ${s}s` : `${s}s`;
      toast(`Call ended • ${durationStr}`);
    }

    if (connectionRef) {
      connectionRef.destroy();
    }
    set({
      localStream: null,
      remoteStream: null,
      call: null,
      callAccepted: false,
      callEnded: true,
      isCalling: false,
      connectionRef: null,
      calledUser: null,
      callStartTime: null
    });
  },

  endCall: () => {
    const { call, calledUser, callAccepted, isCalling } = get();
    const socket = useAuthStore.getState().socket;
    
    let otherId = null;
    if (call && call.from) otherId = call.from;
    else if (calledUser) otherId = calledUser._id;

    if (otherId) {
      if (isCalling && !callAccepted) {
        // If we were dialing and cancelled before they answered
        socket.emit('endCall', { to: otherId });
      } else {
        socket.emit('endCall', { to: otherId });
      }
    }
    get().endCallLocal();
  },

  toggleVideo: () => {
    const { localStream, videoEnabled } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        set({ videoEnabled: !videoEnabled });
      }
    }
  },

  toggleAudio: () => {
    const { localStream, audioEnabled } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        set({ audioEnabled: !audioEnabled });
      }
    }
  },

  subscribeToCalls: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    // Cleanup any existing before adding new
    socket.off('callUser');
    socket.off('callEnded');
    
    socket.on('callUser', ({ from, name, avatar, signal }) => {
      set({ call: { isReceivingCall: true, from, name, avatar, signal }, callEnded: false });
      
      // OPTIONAL: Auto-timeout ringing after 30 seconds
      setTimeout(() => {
        const currentCall = get().call;
        if (currentCall && !get().callAccepted) {
          get().rejectCall();
        }
      }, 30000);
    });
    
    socket.on('callEnded', () => {
      const { callAccepted, isCalling, call } = get();
      if (callAccepted || isCalling || call) {
        toast('Call ended');
        get().endCallLocal();
      }
    });
  },

  unsubscribeFromCalls: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off('callUser');
    socket.off('callEnded');
    socket.off('callAccepted');
    socket.off('callRejected');
  }
}));
