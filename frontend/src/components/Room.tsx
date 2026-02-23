import { useParams } from 'react-router-dom';
import { socket } from '../utils/socket';
import { useEffect, useRef, useState } from 'react';
import { useMediaState } from '../store/useMediaState';
import { userRoleState } from '../store/userRoleState';
import { Helper } from '../utils/Helper';
import { useWebRTC } from '../hooks/usewebRTC';
import { useRoomSocket } from '../hooks/useRoomSocket';

export const Room = () => {
  const { roomId } = useParams();
  const localAudioTrack = useMediaState(state => state.localAudioTrack);
  const localVideoTrack = useMediaState(state => state.localVideoTrack);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [incomingMessage, setIncomingMessage] = useState('');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const userState = userRoleState(state => state.joinState);
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
  const helper = new Helper();
  function handleChat(e: any) {
    setChatMessage(e.target.value);
  }
  function handleSendMessage() {
    dataChannelRef.current?.send(chatMessage);
  }
  function handleIncomingMessage(e: any) {
    setIncomingMessage(e);
  }

  useEffect(() => {
    const stream = new MediaStream();
    if (localAudioTrack) {
      stream.addTrack(localAudioTrack);
    }
    if (localVideoTrack) {
      stream.addTrack(localVideoTrack);
    }
    videoRef.current!.srcObject = stream;
    videoRef.current!.play();
    socket.on('room:join-requested', ({ username }) => {
      handleSocketRoomJoinRequest(username, stream);
    });
    socket.on('webrtc:offer', handleSocketOnOffer);
    socket.on('webrtc:answer', handleOnSocketAnswer);
    socket.on('webrtc:add-ice-candidate', handleSocketAddIceCandidates);
  }, []);
  function handleAsktoJoin() {
    socket.emit('room:ask-to-join', { roomId: roomId, username: 'yashwanth' });
  }
  return (
    <div className="flex flex-col gap-8">
      <div className="flex">
        <video className="w-40 h-40" autoPlay ref={videoRef} muted></video>
        <video
          className="w-40 h-40"
          ref={remoteVideoRef}
          muted
          autoPlay
          playsInline
          controls={false}
        />
      </div>
      <button
        onClick={helper.handleHomeNavigation}
        className="bg-blue-400 w-28 "
      >
        Go Home
      </button>
      <div>Room ID: {roomId}</div>
      {userState === 'joinee' ? (
        <button onClick={handleAsktoJoin} className="w-40 bg-green-400">
          Ask to Join
        </button>
      ) : (
        ''
      )}
      <div>
        <input onChange={handleChat} placeholder="enter message" />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <div>
        <h1>{incomingMessage}</h1>
      </div>
    </div>
  );
};
