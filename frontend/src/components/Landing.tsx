import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../utils/socket';
import { useMediaState } from '../store/useMediaState';
import { userRoleState } from '../store/userRoleState';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';

export const Landing = () => {
  const [roomId, setRoomId] = React.useState('');
  const [name, setName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const getCam = async () => {
    const stream = await window.navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    // MediaStream
    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];

    useMediaState.getState().setLocalTracks(videoTrack, audioTrack);
    if (!videoRef.current) {
      return;
    }
    videoRef.current.srcObject = new MediaStream([videoTrack]);
    videoRef.current.play();
    // MediaStream
  };

  useEffect(() => {
    if (videoRef && videoRef.current) {
      getCam();
    }
  }, [videoRef]);

  function handleRoomNavigation(roomId: string) {
    navigate(`/room/${roomId}`);
  }

  function handleCreateRoom() {
    userRoleState.getState().setUserState('host');
    socket.emit('room:create', 'yashwanth');
    socket.on('room:created', (data: { roomId: string }) => {
      handleRoomNavigation(data.roomId);
    });
  }

  function handleJoinRoom() {
    userRoleState.getState().setUserState('joinee');
    socket.emit('room:join-request', { roomId: roomId, username: 'yashwanth' });
    socket.on('room:joined', data => {
      handleRoomNavigation(data.roomId);
    });
  }
  function handleJoinQueue() {
    socket.emit('webrtc:join-queue-request', { username: 'yashwanth' });
    socket.on('room:joined', data => {
      console.log('');
      if (data.role === 'caller') {
        socket.emit('room:ask-to-join', {
          roomId: data.roomId,
          username: 'yashwanth',
        });
      }
      handleRoomNavigation(data.roomId);
    });
  }
  return (
    <div className="flex flex-col gap-6">
      <video className="w-40 h-40" autoPlay ref={videoRef} muted></video>
      <input
        type="text"
        onChange={e => {
          setName(e.target.value);
        }}
      ></input>
      <button className="w-40 bg-green-300" onClick={handleCreateRoom}>
        Create Room
      </button>
      <div className="flex gap-4">
        <input
          onChange={e => setRoomId(e.target.value)}
          className="border-2 border-solid"
        />
        <button onClick={handleJoinRoom}>Join Room</button>
      </div>
      <div>
        <button className="bg-blue-500" onClick={handleJoinQueue}>
          Join queue
        </button>
      </div>
    </div>
  );
};
