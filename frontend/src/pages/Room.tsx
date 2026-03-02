import { useParams } from 'react-router-dom';
import { socket } from '../utils/socket';
import { useEffect, useRef, useState } from 'react';
import { useMediaState } from '../store/useMediaState';
import { userRoleState } from '../store/userRoleState';
import { Helper } from '../utils/Helper';
import { useWebRTC } from '../hooks/usewebRTC';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { VideoCard } from '../components/VideoCard';
import { MessageSquare, Clock, Copy, Check } from 'lucide-react';
import { AdmitModal } from '../components/Admitmodal';
import { EndCallModal } from '../components/Endcallmodal';
import { ChatPanel, Message } from '../components/Chatpanel';
import { ControlBar } from '../components/Controlbar';
import { log } from '../services/log';

interface JoinRequest {
  username: string;
}

export const Room = () => {
  const { roomId } = useParams();
  const localAudioTrack = useMediaState(s => s.localAudioTrack);
  const localVideoTrack = useMediaState(s => s.localVideoTrack);
  const userState = userRoleState(s => s.joinState);
  const helper = new Helper();

  // video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // webrtc refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmitted, setIsAdmitted] = useState(false);

  /**
   * peerIsMain: true  → remote video occupies main frame, local is PiP  (DEFAULT)
   *             false → local video occupies main frame, remote is PiP
   */
  const [peerIsMain, setPeerIsMain] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [joinRequest, setJoinRequest] = useState<JoinRequest | null>(null);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [hasSentJoinRequest, setHasSentJoinRequest] = useState(false);
  const [roomIdCopied, setRoomIdCopied] = useState(false);

  // ── session timer ─────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ── WebRTC / socket hooks ─────────────────────────────────────────────────
  function handleIncomingMessage(text: string) {
    const msg: Message = {
      id: crypto.randomUUID(),
      text,
      sender: 'peer',
      time: helper.nowTime(),
    };
    setMessages(prev => [...prev, msg]);
    if (!isChatOpen) setUnreadCount(c => c + 1);
  }

  const { createWebRTCConnection, setUpDataChannel } = useWebRTC();
  const {
    handleSocketRoomJoinRequest,
    handleSocketOnOffer,
    handleOnSocketAnswer,
    handleSocketAddIceCandidates,
  } = useRoomSocket({
    socket,
    roomId,
    createWebRTCConnection,
    setUpDataChannel,
    localAudioTrack,
    localVideoTrack,
    remoteVideoRef,
    handleIncomingMessage,
    pcRef,
    dataChannelRef,
  });

  useEffect(() => {
    const stream = new MediaStream();
    if (localAudioTrack) stream.addTrack(localAudioTrack);
    if (localVideoTrack) stream.addTrack(localVideoTrack);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }

    socket.on('room:join-requested', (data: any) => {
      log("SIGNALING", "Creating Offer", { data });
      setJoinRequest({ username: data.username });
      handleSocketRoomJoinRequest(data.username, stream);
    });
    socket.on('webrtc:offer', (data)=>{
      log("SIGNALING", "Received offer", { data });
      handleSocketOnOffer(data,stream);
    });
    socket.on('webrtc:answer', handleOnSocketAnswer);
    socket.on('webrtc:add-ice-candidate', handleSocketAddIceCandidates);
    // Joinee: host admitted us — clear the waiting pill
    socket.on('room:admitted', () => {
      setIsAdmitted(true);
      setHasSentJoinRequest(false);
    });

    // Instant-match flow: caller asks to join after listeners are ready (with retry)
    let cancelled = false;
    if (userState === 'caller' && roomId && !hasSentJoinRequest) {
      let attempts = 0;
      const tryAsk = () => {
        if (cancelled) return;
        attempts += 1;
        log("SIGNALING", "Asking to join for queue request", { roomId });
        socket.emit(
          'room:ask-to-join',
          { roomId, username: 'yashwanth' },
          (ack?: { ok: boolean }) => {
            if (ack?.ok) {
              setHasSentJoinRequest(true);
              return;
            }
            if (attempts < 10) setTimeout(tryAsk, 250);
          }
        );
      };
      tryAsk();
    }

    return () => {
      cancelled = true;
      socket.off('room:join-requested');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:add-ice-candidate');
      socket.off('room:admitted');
    };
  }, []);

  // ── Control handlers ──────────────────────────────────────────────────────
  const handleToggleMute = () => {
    log("MEDIA", "Toggle mute", { isMuted });
    if (localAudioTrack) localAudioTrack.enabled = isMuted;
    setIsMuted(p => !p);
  };

  const handleToggleVideo = () => {
    log("MEDIA", "Toggle video", { isVideoOff });
    if (localVideoTrack) localVideoTrack.enabled = isVideoOff;
    setIsVideoOff(p => !p);
  };

  const handleToggleScreenShare = async () => {
    log("MEDIA", "Toggle screen share", { isScreenSharing });
    if (isScreenSharing) {
      setIsScreenSharing(false);
      // TODO: revert to camera track in peer connection
      return;
    }
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      // TODO: replace video track in RTCPeerConnection sender
      setIsScreenSharing(true);
      screen.getVideoTracks()[0].onended = () => setIsScreenSharing(false);
    } catch {
      /* user cancelled */
    }
  };

  const handleSendMessage = (text: string) => {
    log("DATA", "Sending message", { text });
    dataChannelRef.current?.send(text);
    const msg: Message = {
      id: crypto.randomUUID(),
      text,
      sender: 'me',
      time: helper.nowTime(),
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleOpenChat = () => {  
    log("DATA", "Opening chat");
    setIsChatOpen(true);
    setUnreadCount(0);
  };

  const handleAskToJoin = () => { 
    log("SIGNALING", "Asking to join", { roomId });
    socket.emit('room:ask-to-join', { roomId, username: 'yashwanth' });
    setHasSentJoinRequest(true);
  };

  const handleCopyRoomId = () => {  
    log("DATA", "Copying room id", { roomId });
    if (roomId) {
      navigator.clipboard.writeText(String(roomId));
      setRoomIdCopied(true);
      setTimeout(() => setRoomIdCopied(false), 2000);
    }
  };

  const handleEndCall = () => { 
    log("SIGNALING", "Ending call", { roomId });
    pcRef.current?.close();
    helper.handleHomeNavigation();
  };

  // ── Derived video layout ──────────────────────────────────────────────────
  // peerIsMain=true  → main=remote, pip=local
  // peerIsMain=false → main=local,  pip=remote
  const mainRef = peerIsMain ? remoteVideoRef : localVideoRef;
  const pipRef = peerIsMain ? localVideoRef : remoteVideoRef;
  const mainLabel = peerIsMain ? 'Peer' : 'You';
  const pipLabel = peerIsMain ? 'You' : 'Peer';
  const mainVideoOff = peerIsMain ? false : isVideoOff;
  const pipVideoOff = peerIsMain ? isVideoOff : false;
  const mainIsMuted = peerIsMain ? false : isMuted;

  return (
    <div
      className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-zinc-950 border-b border-zinc-800/60 flex-shrink-0 z-10">
        {/* Left: status */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-zinc-400 text-xs font-medium tracking-widest uppercase">
            Interview in progress
          </span>
        </div>

        {/* Center: timer */}
        <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
          <Clock size={12} />
          <span className="font-mono tabular-nums">{formatTime(elapsed)}</span>
        </div>

        {/* Right: Room ID + Chat toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700/50 rounded-lg px-2.5 py-1.5">
            <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">
              Room
            </span>
            <code className="text-zinc-200 text-xs font-mono font-semibold">
              {roomId}
            </code>
            <button
              onClick={handleCopyRoomId}
              title="Copy Room ID"
              className="ml-1 text-zinc-500 hover:text-white transition-colors"
            >
              {roomIdCopied ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>

          {/* Chat toggle button */}
          <button
            onClick={isChatOpen ? () => setIsChatOpen(false) : handleOpenChat}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isChatOpen
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <MessageSquare size={13} />
            Chat
            {/* Unread badge */}
            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="relative flex-1 overflow-hidden bg-zinc-950 flex items-center justify-center p-5">
          {/* Wrapper: fills available space while keeping 16/9, with max constraints */}
          <div
            className="relative w-full h-full"
            style={{
              maxWidth: 'min(100%, calc((100vh - 180px) * 16 / 9))',
              maxHeight: 'min(100%, calc((100vw - 40px) * 9 / 16))',
              aspectRatio: '16 / 9',
            }}
          >
            <VideoCard
              videoRef={mainRef}
              label={mainLabel}
              isMuted={mainIsMuted}
              isVideoOff={mainVideoOff}
              isMain
              className="absolute inset-0 w-full h-full rounded-2xl"
            />

            {/* PiP — bottom-right corner of main card */}
            <div className="absolute bottom-4 right-4 z-20 w-40 h-28 rounded-xl overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/10">
              <VideoCard
                videoRef={pipRef}
                label={pipLabel}
                isMuted={!peerIsMain ? false : isMuted}
                isVideoOff={pipVideoOff}
                onClick={() => setPeerIsMain(p => !p)}
                className="w-full h-full rounded-none"
              />
            </div>
          </div>
        </div>

        {/* Chat panel (slides in from right) */}
        {isChatOpen && (
          <ChatPanel
            messages={messages}
            onSend={handleSendMessage}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>

      {/* ── Control bar ──────────────────────────────────────────────────── */}
      <ControlBar
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onEndCall={() => setShowEndCallModal(true)}
      />

      {/* ── Ask to Join (joinee role) ─────────────────────────────────────── */}
      {userState === 'joinee' && !hasSentJoinRequest && !isAdmitted && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={handleAskToJoin}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-semibold shadow-xl shadow-indigo-900/40 transition-all active:scale-95"
          >
            Ask to Join
          </button>
        </div>
      )}
      {userState === 'joinee' && hasSentJoinRequest && !isAdmitted && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-full text-sm font-medium shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Waiting for host to admit you…
          </div>
        </div>
      )}

      {/* ── Admit popup ───────────────────────────────────────────────────── */}
      {joinRequest && (
        <AdmitModal
          username={joinRequest.username}
          onAdmit={() => setJoinRequest(null)}
          onDeny={() => setJoinRequest(null)}
        />
      )}

      {/* ── End call confirmation ─────────────────────────────────────────── */}
      {showEndCallModal && (
        <EndCallModal
          onConfirm={handleEndCall}
          onCancel={() => setShowEndCallModal(false)}
        />
      )}
    </div>
  );
};
