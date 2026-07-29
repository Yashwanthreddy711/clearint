  import React, { useEffect, useRef, useState } from 'react';
  import { socket } from '../utils/socket';
  import { useMediaState } from '../store/useMediaState';
  import { userRoleState } from '../store/userRoleState';
  import { useAuthStore } from '../store/authStore';
  import { logout as logoutApi } from '../api/auth';
  import { useNavigate } from 'react-router-dom';
  import { Video, VideoOff, Mic, MicOff, Plus, LogIn, Users, ChevronRight, LogOut } from 'lucide-react';
import { log } from '../services/log';
  
  export const Landing = () => {
    const user = useAuthStore((s) => s.user);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const navigate = useNavigate();
    const [roomId, setRoomId] = React.useState('');
    const [name, setName] = useState(user?.username ?? '');
    const [isCamReady, setIsCamReady] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [activeTab, setActiveTab] = useState<'join' | 'queue'>('join');
    const [isQueueWaiting, setIsQueueWaiting] = useState(false);
    const [queueMessage, setQueueMessage] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
      if (user?.username && !name) {
        setName(user.username);
      }
    }, [user?.username]);

    const displayName = name.trim() || user?.username || 'Guest';

    async function handleLogout() {
      try {
        await logoutApi();
      } finally {
        clearAuth();
        navigate('/login', { replace: true });
      }
    }
  
    const localVideoTrack = useRef<MediaStreamTrack | null>(null);
    const localAudioTrack = useRef<MediaStreamTrack | null>(null);
  
    const getCam = async () => {
      try {
        const stream = await window.navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
  
        localVideoTrack.current = videoTrack;
        localAudioTrack.current = audioTrack;
  
        useMediaState.getState().setLocalTracks(videoTrack, audioTrack);
        if (!videoRef.current) return;
        videoRef.current.srcObject = new MediaStream([videoTrack]);
        videoRef.current.play();
        setIsCamReady(true);
      } catch {
        setIsCamReady(false);
      }
    };
  
    useEffect(() => {
      if (videoRef && videoRef.current) {
        getCam();
      }
    }, [videoRef]);
  
    const handleToggleMute = () => {
      if (localAudioTrack.current) {
        localAudioTrack.current.enabled = isMuted;
      }
      setIsMuted((p) => !p);
    };
  
    const handleToggleVideo = () => {
      if (localVideoTrack.current) {
        localVideoTrack.current.enabled = isVideoOff;
      }
      setIsVideoOff((p) => !p);
    };
  
    function handleRoomNavigation(roomId: string) {
      navigate(`/room/${roomId}`);
    }
  
    function handleCreateRoom() {
      userRoleState.getState().setUserState('host');
      socket.emit('room:create', displayName);
      socket.on('room:created', (data: { roomId: string }) => {
        log("SIGNALING", "Room created", { data });
        handleRoomNavigation(data.roomId);
      });
    }
  
    function handleJoinRoom() {
      if (!roomId.trim()) return;
      userRoleState.getState().setUserState('joinee');
      socket.emit('room:join-request', { roomId: roomId.trim(), username: displayName });
      socket.on('room:joined', (data: { roomId: string }) => {
        log("SIGNALING", "User Joined the Room", { roomId });
        handleRoomNavigation(data.roomId);
      });
    }
  
    function handleJoinQueue() {
      log("SIGNALING", "User clicked on join queue");
      setIsQueueWaiting(true);
      setQueueMessage('Looking for a match…');

      socket.emit('webrtc:join-queue-request', { username: displayName });

      socket.once('queue:waiting', (data: { message: string }) => {
        log("SIGNALING", "Waiting in queue", { data });
        setIsQueueWaiting(true);
        setQueueMessage(data.message);
      });

      socket.once('room:joined', (data: { roomId: string; role: string }) => {
        log("SIGNALING", "User Joined the Queue", { roomId: data.roomId });
        setIsQueueWaiting(false);
        userRoleState.getState().setUserState(data.role);
        handleRoomNavigation(data.roomId);
      });
    }

    function handleCancelQueue() {
      setIsQueueWaiting(false);
      setQueueMessage('');
      socket.emit('queue:leave');
      socket.off('queue:waiting');
      socket.off('room:joined');
    }
  
    return (
      <div
        className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6"
        style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
      >
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .fade-up { animation: fadeUp 0.4s ease forwards; }
          .fade-up-1 { animation: fadeUp 0.4s 0.05s ease both; }
          .fade-up-2 { animation: fadeUp 0.4s 0.12s ease both; }
          .fade-up-3 { animation: fadeUp 0.4s 0.20s ease both; }
          .fade-up-4 { animation: fadeUp 0.4s 0.28s ease both; }
        `}</style>
  
        <div className="absolute top-6 right-6 fade-up flex items-center gap-3">
          {user && (
            <span className="text-zinc-400 text-sm hidden sm:inline">{user.email}</span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-zinc-400 hover:text-white text-xs rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>

        <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-center lg:items-start">
  
          {/* ── Left: Video preview ──────────────────────────────────────── */}
          <div className="fade-up-1 flex flex-col items-center gap-4 w-full lg:w-auto">
  
            {/* Camera card */}
            <div className="relative w-full max-w-sm lg:w-80" style={{ aspectRatio: '4/3' }}>
              <div className="w-full h-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/60 flex items-center justify-center">
                {/* Video element always mounted */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isVideoOff || !isCamReady ? 'opacity-0 absolute inset-0' : 'opacity-100'
                  }`}
                />
  
                {/* Avatar fallback */}
                {(isVideoOff || !isCamReady) && (
                  <div className="flex flex-col items-center gap-3 z-10">
                    <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold text-zinc-300 select-none">
                      {name ? name[0].toUpperCase() : '?'}
                    </div>
                    <p className="text-zinc-500 text-xs">
                      {!isCamReady ? 'Camera not available' : 'Camera is off'}
                    </p>
                  </div>
                )}
              </div>
  
              {/* Live indicator */}
              {isCamReady && !isVideoOff && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white text-[10px] font-medium">Preview</span>
                </div>
              )}
            </div>
  
            {/* Mic / Cam toggles */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleMute}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                  isMuted
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                }`}
              >
                {isMuted ? <MicOff size={13} className="text-red-400" /> : <Mic size={13} />}
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={handleToggleVideo}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                  isVideoOff
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                }`}
              >
                {isVideoOff ? <VideoOff size={13} className="text-red-400" /> : <Video size={13} />}
                {isVideoOff ? 'Start Cam' : 'Stop Cam'}
              </button>
            </div>
          </div>
  
          {/* ── Right: Controls ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-6 w-full max-w-sm lg:flex-1">
  
            {/* Header */}
            <div className="fade-up-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Ready to interview?
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                Set up your name, then create or join a session.
              </p>
            </div>
  
            {/* Name input */}
            <div className="fade-up-2 flex flex-col gap-1.5">
              <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Yashwanth"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
  
            {/* Divider */}
            <div className="fade-up-2 w-full h-px bg-zinc-800" />
  
            {/* Create room */}
            <div className="fade-up-3 flex flex-col gap-2">
              <button
                onClick={handleCreateRoom}
                className="w-full flex items-center justify-between px-5 py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-2xl transition-all group shadow-lg shadow-indigo-900/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/50 flex items-center justify-center">
                    <Plus size={16} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-semibold">Create a Room</p>
                    <p className="text-indigo-300 text-[11px]">Start a new interview session</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
  
            {/* Tabs: Join Room / Join Queue */}
            <div className="fade-up-4 flex flex-col gap-3">
              {/* Tab switcher */}
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'join'
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <LogIn size={12} />
                  Join Room
                </button>
                <button
                  onClick={() => setActiveTab('queue')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'queue'
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Users size={12} />
                  Join Queue
                </button>
              </div>
  
              {/* Join Room panel */}
              {activeTab === 'join' && (
                <div className="flex flex-col gap-2">
                  <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                    Room ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                      placeholder="Enter room ID"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors font-mono"
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={!roomId.trim()}
                      className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all border border-zinc-700 hover:border-zinc-600 active:scale-95"
                    >
                      Join
                    </button>
                  </div>
                </div>
              )}
  
              {/* Join Queue panel */}
              {activeTab === 'queue' && (
                <div className="flex flex-col gap-3">
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    You'll be automatically matched with another participant for a mock interview session.
                  </p>
                  {isQueueWaiting ? (
                    <div className="flex flex-col gap-3 px-4 py-4 bg-amber-950/30 border border-amber-800/50 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <p className="text-amber-200 text-sm font-medium">Waiting in queue</p>
                      </div>
                      <p className="text-amber-100/80 text-xs leading-relaxed">
                        {queueMessage ||
                          'No one else is in the queue right now. Please wait for another user to join, or create a room with your friend.'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveTab('join')}
                          className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium transition-colors border border-zinc-700"
                        >
                          Create room with friend
                        </button>
                        <button
                          onClick={handleCancelQueue}
                          className="px-4 py-2.5 text-zinc-400 hover:text-white text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleJoinQueue}
                      className="w-full flex items-center justify-between px-5 py-4 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center">
                          <Users size={15} className="text-zinc-300" />
                        </div>
                        <div className="text-left">
                          <p className="text-white text-sm font-semibold">Join the Queue</p>
                          <p className="text-zinc-500 text-[11px]">Get matched automatically</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };