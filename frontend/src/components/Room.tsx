import { useParams } from "react-router-dom";
import { socket } from "../utils/socket";
import { useEffect } from "react";

export const Room = () => {
    const { roomId } = useParams();
  function handleHomeNavigation() {
    window.location.href = '/';
  }

  useEffect(()=>{
      socket.on('send-offer', (data:any) => {
        console.log("Offer sent to peer socket:", data);
        socket.emit('receive-offer', { roomId:roomId});
    });

     socket.on('receive-offer', (data:any) => {
        console.log("Offer received from peer socket:", data);
    });
  },[])

  function handleAsktoJoin(){
    console.log("Asking to join room:", roomId);
    socket.emit('asktojoin', { roomId: roomId, username: 'yashwanth'});
    console.log("Ask to join emitted");
  }
  return (
    <div className="flex flex-col gap-8">
      <button onClick={handleHomeNavigation} className="bg-blue-400 w-28 ">Go Home</button>
      <div>Room ID: {roomId}</div>
      <button onClick={handleAsktoJoin} className="w-40 bg-green-400">Ask to Join</button>
    </div>
  );
};
