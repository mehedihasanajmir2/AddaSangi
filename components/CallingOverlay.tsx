
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

const CallingOverlay: React.FC<CallingOverlayProps> = ({ onClose, initialType = 'video', targetUser, isIncoming = false, currentUser }) => {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [hasCamera, setHasCamera] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const toneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // রিংটোন সেটআপ
    toneRef.current = new Audio(isIncoming ? INCOMING_TONE_URL : CALLING_TONE_URL);
    toneRef.current.loop = true;
    toneRef.current.play().catch(() => console.log("Audio play blocked"));

    // সিগন্যালিং লিসেনার (এক্সেপ্ট বা রিজেক্ট শোনার জন্য)
    const channel = supabase.channel(`calls:${currentUser.id}`)
      .on('broadcast', { event: 'call_accepted' }, () => {
        setCallStatus('connected');
      })
      .on('broadcast', { event: 'call_ended' }, () => {
        handleEndCall();
      })
      .subscribe();

    const startMedia = async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: initialType === 'video', 
            audio: true 
          });
        } catch (err: any) {
          console.warn("Media failed, falling back to audio only");
          setHasCamera(false);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        streamRef.current = stream;
        if (videoRef.current && initialType === 'video' && stream.getVideoTracks().length > 0) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Critical Media Error:", err);
        setMediaError("ক্যামেরা/মাইক্রোফোন পারমিশন প্রয়োজন।");
      }
    };

    if (!isIncoming) {
      startMedia();
    }

    return () => {
      supabase.removeChannel(channel);
      stopMedia();
    };
  }, [initialType, isIncoming, currentUser.id]);

  useEffect(() => {
    let timer: any;
    if (callStatus === 'connected') {
      if (toneRef.current) {
        toneRef.current.pause();
        toneRef.current.currentTime = 0;
      }
      timer = setInterval(() => setCallTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (toneRef.current) {
      toneRef.current.pause();
      toneRef.current = null;
    }
  };

  const handleAccept = async () => {
    // ১. আগে স্ট্যাটাস এবং সিগন্যাল আপডেট করা (যাতে কল না কাটে)
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

    // ২. তারপর ক্যামেরা অন করার চেষ্টা করা
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: initialType === 'video', audio: true });
      } catch {
        setHasCamera(false);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;
      if (videoRef.current && initialType === 'video' && stream.getVideoTracks().length > 0) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn("Media could not be initialized after accept", e);
      setMediaError("ডিভাইস অ্যাক্সেস করা সম্ভব হচ্ছে না, শুধু চ্যাট চলবে।");
      // কল কাটবে না, শুধু চ্যাট মোড বা অডিও ছাড়াই কানেক্ট থাকবে।
    }
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

  if (isMinimized) {
    return (
      <div onClick={() => setIsMinimized(false)} className="fixed bottom-20 right-4 z-[500] bg-gray-900 p-2 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-500 cursor-pointer animate-in slide-in-from-right-10">
        <img src={targetUser.avatar} className="w-12 h-12 rounded-full border-2 border-green-500" alt="" />
        <div className="pr-2">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{callStatus === 'connected' ? 'In Call' : 'Calling'}</p>
          <p className="text-white font-mono font-bold">{formatTime(callTime)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] bg-gray-950 text-white flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden">
      <div className="absolute top-6 left-6 z-50">
        <button onClick={() => setIsMinimized(true)} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
          <i className="fa-solid fa-minimize"></i>
        </button>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className={`w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden border-4 ${callStatus === 'connected' ? 'border-green-500 shadow-2xl shadow-green-500/20' : 'border-red-500 animate-pulse'}`}>
                <img src={targetUser.avatar} className="w-full h-full object-cover" alt="" />
            </div>
            {isIncoming && callStatus === 'ringing' && (
              <div className="absolute -top-2 -right-2 bg-red-600 px-3 py-1 rounded-full text-[10px] font-black animate-bounce">
                INCOMING
              </div>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-black mb-1 drop-shadow-lg">{targetUser.username}</h2>
            {mediaError ? (
               <span className="text-yellow-500 font-bold text-xs bg-yellow-950/50 px-4 py-1.5 rounded-full border border-yellow-500/30">{mediaError}</span>
            ) : callStatus === 'ringing' ? (
              <span className="text-red-500 font-bold uppercase tracking-widest text-xs animate-pulse">
                {isIncoming ? 'Incoming Call...' : 'Calling...'}
              </span>
            ) : (
              <span className="text-green-500 font-mono text-xl font-bold tracking-widest">{formatTime(callTime)}</span>
            )}
          </div>
        </div>
      </div>

      {initialType === 'video' && hasCamera && callStatus === 'connected' && (
        <div className="absolute top-12 right-6 w-28 aspect-[3/4] rounded-2xl bg-black overflow-hidden border-2 border-white/20 shadow-2xl z-20">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
        </div>
      )}

      <div className="absolute bottom-12 inset-x-0 flex justify-center items-center gap-6 z-30 px-6">
        {isIncoming && callStatus === 'ringing' ? (
          <>
            <button 
              onClick={handleEndCall} 
              className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg active:scale-90"
            >
              <i className="fa-solid fa-phone-slash text-2xl text-white"></i>
            </button>
            <button 
              onClick={handleAccept} 
              className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-600/50 animate-bounce active:scale-90"
            >
              <i className="fa-solid fa-phone text-3xl text-white"></i>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setIsMuted(!isMuted)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 border border-white/20 hover:bg-white/20'}`}>
              <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
            </button>
            <button onClick={handleEndCall} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/50 active:scale-90 hover:bg-red-700 transition-all border-4 border-white/10">
              <i className="fa-solid fa-phone-slash text-3xl text-white"></i>
            </button>
            <button className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all">
              <i className="fa-solid fa-volume-high text-xl"></i>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CallingOverlay;
