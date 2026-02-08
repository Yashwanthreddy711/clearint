import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';
import { useMediaState } from '../utils/store/useMediaState';


export const Landing = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = React.useState('');
  const [name, setName] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        // MediaStream
        const audioTrack = stream.getAudioTracks()[0]
        const videoTrack = stream.getVideoTracks()[0]
    
        useMediaState.getState().setLocalTracks(videoTrack, audioTrack);
        if (!videoRef.current) {
            return;
        }
        videoRef.current.srcObject = new MediaStream([videoTrack])
        videoRef.current.play();
        // MediaStream
    }

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getCam()
        }
    }, [videoRef]);

  function handleRoomNavigation(roomId: string) {
    navigate(`/room/${roomId}`);
  }

  function handleCreateRoom() {
    socket.emit('createroom', 'yashwanth');
    socket.on('roomcreated', (data: { roomId: string }) => {
      console.log('Room Created with ID:', data.roomId);
      handleRoomNavigation(data.roomId);
    });
  }

  function handleJoinRoom() {
    socket.emit('joinroom', { roomId: roomId, username: 'yashwanth' });
    socket.on('roomjoined', data => {
      console.log('Joined Room with ID:', data.roomId);
      console.log('Other user joined:', data.peer);
      handleRoomNavigation(roomId);
    });
  }
  return (
    <div className="flex flex-col gap-6">
       <video className='w-40 h-40'  autoPlay ref={videoRef} muted></video>
            <input type="text" onChange={(e) => {
                setName(e.target.value);
            }}>
            </input>
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
    </div>
  );
};
