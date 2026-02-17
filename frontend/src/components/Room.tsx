import { useParams } from 'react-router-dom';
import { socket } from '../utils/socket';
import { useEffect, useRef, useState } from 'react';
import { useMediaState } from '../store/useMediaState';
import { userRoleState } from '../store/userRoleState';
import { Helper } from '../utils/Helper';

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
    if (!videoRef.current) {
      return;
    }

    videoRef.current!.srcObject = stream;
    videoRef.current!.play();
    socket.on('room:join-requested', ({ username }) => {
      alert(`${username},is waiting in the lobby,Do you want to admit?`); //create a popup for the host to approve or reject the joinee's request
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const dataChannel = pc.createDataChannel('chat');

      pcRef.current = pc;

      dataChannel.onopen = () => {
        console.log('Data channel is open');
      };
      dataChannel.onmessage = event => {
        console.log('Received message', event.data);
        handleIncomingMessage(event.data);
      };
      dataChannel.onerror = error => {
        console.log('Error in Datachannel', error);
      };
      dataChannel.onclose = () => {
        console.log('Data channel is closed');
      };

      dataChannelRef.current = dataChannel;

      pc.ontrack = event => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      if (localAudioTrack) {
        pc.addTrack(localAudioTrack, stream);
      }
      if (localVideoTrack) {
        pc.addTrack(localVideoTrack, stream);
      }

      pc.onicecandidate = async event => {
        if (event.candidate) {
          //send the candidate to the peer
          console.log(
            'sending ice candidate from sender',
            event.candidate.type
          );
          socket.emit('webrtc:ice-candidate', {
            candidate: event.candidate,
            roomId: roomId,
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        const sdp = await pc.createOffer();
        await pc.setLocalDescription(sdp);
        socket.emit('webrtc:offer', {
          sdp: sdp,
          roomId: roomId,
        });
      };
    });

    socket.on('webrtc:offer', async (data: any) => {
      const pc = new RTCPeerConnection();
      pc.ontrack = event => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.ondatachannel = event => {
        const dataChannel = event.channel;
        dataChannelRef.current = dataChannel;
        dataChannel.onopen = () => console.log('Data channel is Opened');
        dataChannel.onmessage = event => {
          console.log('Message from datachannel', event.data);
          handleIncomingMessage(event.data);
        };
        dataChannel.onerror = error =>
          console.log('Error in datachannel', error);
        dataChannel.onclose = () => console.log('Data channel closed');
      };

      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      const sdp = await pc?.createAnswer();
      await pc?.setLocalDescription(sdp);

      pc.onicecandidate = async event => {
        if (event.candidate) {
          socket.emit('webrtc:ice-candidate', {
            candidate: event.candidate,
            type: 'receiver',
            roomId: roomId,
          });
        }
      };
      socket.emit('webrtc:answer', {
        sdp: sdp,
        roomId: roomId,
      });
    });

    socket.on('webrtc:answer', async (data: any) => {
      await pcRef.current?.setRemoteDescription(data.sdp);
    });

    socket.on('webrtc:add-ice-candidate', async (data: any) => {
      const candidate = new RTCIceCandidate(data.sdp);
      await pcRef.current?.addIceCandidate(candidate);
    });
  }, []);
  function handleAsktoJoin() {
    socket.emit('room:ask-to-join', { roomId: roomId, username: 'yashwanth' });
  }
  return (
    <div className="flex flex-col gap-8">
      <div className='flex'>
      <video className="w-40 h-40" autoPlay ref={videoRef} muted></video>
      <video className='w-40 h-40' ref={remoteVideoRef} muted autoPlay playsInline controls={false} />
      </div>
      <button onClick={helper.handleHomeNavigation} className="bg-blue-400 w-28 ">
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
