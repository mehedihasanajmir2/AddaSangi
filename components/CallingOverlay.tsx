
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface CallingOverlayProps {
  onClose: () => void;
  initialType?: 'audio' | 'video';
  targetUser: User;
  isIncoming?: boolean;
  currentUser: User;
}

const CALLING_TONE_URL = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"; 
const INCOMING_TONE_URL = "https://assets.mixkit.co/active_storage/sfx/1352/1352-preview.mp3";

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const CallingOverlay: React.FC<CallingOverlayProps> = ({ onClose, initialType = 'video', targetUser, isIncoming = false, currentUser }) => {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const toneRef = useRef<HTMLAudioElement | null>(null);

  // Initialize WebRTC Peer Connection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage({ type: 'candidate', candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log("Remote track received:", event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(e => console.error("Auto-play failed:", e));
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const sendSignalingMessage = (payload: any) => {
    const channel = supabase.channel(`calls:${targetUser.id}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'webrtc_signal',
          payload: { ...payload, from: currentUser.id }
        });
      }
    });
  };

  useEffect(() => {
    toneRef.current = new Audio(isIncoming ? INCOMING_TONE_URL : CALLING_TONE_URL);
    toneRef.current.loop = true;
    toneRef.current.play().catch(() => console.log("Audio blocked"));

    const pc = createPeerConnection();

    const channel = supabase.channel(`calls:${currentUser.id}`)
      .on('broadcast', { event: 'call_accepted' }, () => {
        setCallStatus('connected'); // কলারের জন্য স্ট্যাটাস আপডেট
      })
      .on('broadcast', { event: 'call_ended' }, () => {
        handleEndCall();
      })
      .on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
        if (!pcRef.current) return;
        
        try {
          if (payload.type === 'offer') {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const stream = await navigator.mediaDevices.getUserMedia({ video: initialType === 'video', audio: true });
            streamRef.current = stream;
            stream.getTracks().forEach(track => pcRef.current?.addTrack(track, stream));
            
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            sendSignalingMessage({ type: 'answer', answer });
          } else if (payload.type === 'answer') {
            // যখন কলার অন্য প্রান্ত থেকে Answer পাবে, তখন কল কানেক্টেড হবে
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
            setCallStatus('connected'); 
          } else if (payload.type === 'candidate') {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        } catch (e) {
          console.error("Signaling Error:", e);
        }
      })
      .subscribe();

    const startCallAsCaller = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: initialType === 'video', 
          audio: true 
        });
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignalingMessage({ type: 'offer', offer });
      } catch (err: any) {
        setMediaError("মাইক্রোফোন বা ক্যামেরা পারমিশন নেই।");
      }
    };

    if (!isIncoming) startCallAsCaller();

    return () => {
      supabase.removeChannel(channel);
      stopMedia();
    };
  }, [initialType, isIncoming, currentUser.id]);

  useEffect(() => {
    let timer: any;
    if (callStatus === 'connected') {
      if (toneRef.current) toneRef.current.pause();
      timer = setInterval(() => setCallTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const stopMedia = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (pcRef.current) pcRef.current.close();
    if (toneRef.current) { toneRef.current.pause(); toneRef.current = null; }
  };

  const handleAccept = async () => {
    setCallStatus('connected');
    const channel = supabase.channel(`calls:${targetUser.id}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'call_accepted',
          payload: { from: currentUser.id }
        });
      }
    });
  };

  const handleEndCall = () => {
    stopMedia();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[500] bg-gray-950 text-white flex flex-col animate-in fade-in duration-300 overflow-hidden">
      <video 
        ref={remoteVideoRef} 
        autoPlay 
        playsInline 
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${callStatus === 'connected' ? 'opacity-100' : 'opacity-0'}`} 
      />

      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm transition-all duration-500 z-10 ${callStatus === 'connected' ? 'bg-transparent backdrop-blur-0' : ''}`}>
        <div className="flex flex-col items-center gap-6">
          <div className={`w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden border-4 transition-all duration-500 ${callStatus === 'connected' ? 'scale-0 opacity-0' : 'border-red-500 shadow-2xl animate-pulse'}`}>
            <img src={targetUser.avatar} className="w-full h-full object-cover" alt="" />
          </div>
          <div className={`text-center transition-all ${callStatus === 'connected' ? 'fixed top-12 inset-x-0' : ''}`}>
            <h2 className={`font-black drop-shadow-lg transition-all ${callStatus === 'connected' ? 'text-lg' : 'text-3xl mb-1'}`}>{targetUser.username}</h2>
            {mediaError ? (
               <span className="text-yellow-500 font-bold text-xs bg-black/40 px-4 py-1 rounded-full">{mediaError}</span>
            ) : callStatus === 'ringing' ? (
              <span className="text-red-500 font-bold uppercase tracking-widest text-xs animate-pulse">
                {isIncoming ? 'Incoming Call...' : 'Calling...'}
              </span>
            ) : (
              <span className="text-green-500 font-mono text-xl font-bold drop-shadow-md">{formatTime(callTime)}</span>
            )}
          </div>
        </div>
      </div>

      {initialType === 'video' && (
        <div className={`absolute transition-all duration-500 overflow-hidden border-2 border-white/20 shadow-2xl z-20 ${callStatus === 'connected' ? 'top-6 right-6 w-28 aspect-[3/4] rounded-2xl' : 'bottom-32 inset-x-10 h-0 opacity-0'}`}>
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
        </div>
      )}

      <div className="absolute bottom-12 inset-x-0 flex justify-center items-center gap-6 z-30 px-6">
        {isIncoming && callStatus === 'ringing' ? (
          <>
            <button onClick={handleEndCall} className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg active:scale-90">
              <i className="fa-solid fa-phone-slash text-2xl text-white"></i>
            </button>
            <button onClick={handleAccept} className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-600/50 animate-bounce active:scale-90">
              <i className="fa-solid fa-phone text-3xl text-white"></i>
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => {
                const track = streamRef.current?.getAudioTracks()[0];
                if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
              }} 
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 backdrop-blur-md border border-white/20'}`}
            >
              <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
            </button>
            <button onClick={handleEndCall} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl active:scale-90">
              <i className="fa-solid fa-phone-slash text-3xl text-white"></i>
            </button>
            <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
              <i className="fa-solid fa-volume-high text-xl text-white"></i>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CallingOverlay;
