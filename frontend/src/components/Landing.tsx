import React from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';


export const Landing = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = React.useState('');

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
