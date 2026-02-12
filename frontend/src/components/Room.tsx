import { useParams } from 'react-router-dom';
import { socket } from '../utils/socket';
import { useEffect, useRef, useState } from 'react';
import { useMediaState } from '../utils/store/useMediaState';
import { userRoleState } from '../utils/store/userRoleState';

export const Room = () => {
  const { roomId } = useParams();
  const localAudioTrack = useMediaState(state => state.localAudioTrack);
  const localVideoTrack = useMediaState(state => state.localVideoTrack);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const sendingPcRef = useRef<RTCPeerConnection | null>(null);
  const receivingPcRef = useRef<RTCPeerConnection | null>(null);
  const userState = userRoleState(state => state.joinState);

  function handleHomeNavigation() {
    window.location.href = '/';
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
      console.log('Host approved joinee request');
      const pc = new RTCPeerConnection();
      console.log('Created peer connection');
      // setSendingPc(pc);
      pc.ontrack=(event)=>{
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
      sendingPcRef.current = pc;
      if (localAudioTrack) {
        console.log('Added local audio track to the pc');
        pc.addTrack(localAudioTrack, stream);
      }
      if (localVideoTrack) {
        console.log('Added video local track to the Pc');
        pc.addTrack(localVideoTrack, stream);
      }

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE state:', pc.iceConnectionState);
      };

      pc.onicecandidate = async event => {
        console.log('on-ice-candidate triggered');

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
        console.log('on negotiation triggered');
        const sdp = await pc.createOffer();
        await pc.setLocalDescription(sdp);
        console.log('Sending offer SDP:', sdp);
        console.log('inputs of the webrtc offer ', roomId);
        socket.emit('webrtc:offer', {
          sdp: sdp,
          roomId: roomId,
        });
      };
    });

    socket.on('webrtc:offer', async (data: any) => {
      console.log('Received webrtc offer from the peer :', data);
      const pc = new RTCPeerConnection();

      pc.ontrack = event => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      console.log('Checking remote video ref', remoteVideoRef);

      console.log('Setting remote description');
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    

      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      const sdp = await pc?.createAnswer();
      console.log('checking answer for remote description', sdp);
      await pc?.setLocalDescription(sdp);
    

      pc.onicecandidate = async event => {
        console.log('on-ice-candidates triggered');
        if (event.candidate) {
          //send the candidate to the peer
          socket.emit('webrtc:ice-candidate', {
            candidate: event.candidate,
            type: 'receiver',
            roomId: roomId,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE state:', pc.iceConnectionState);
      };

      socket.emit('webrtc:answer', {
        sdp: sdp,
        roomId: roomId,
      });
    });

    socket.on('webrtc:answer', async (data: any) => {
      console.log('Received answer:', data);
      await sendingPcRef.current?.setRemoteDescription(data.sdp);

     
    });

    socket.on('webrtc:add-ice-candidate', async (data: any) => {
      const candidate = new RTCIceCandidate(data.sdp);
      await sendingPcRef.current?.addIceCandidate(candidate);
      await receivingPcRef.current?.addIceCandidate(candidate);
    });
  }, []);
  function handleAsktoJoin() {
    socket.emit('room:ask-to-join', { roomId: roomId, username: 'yashwanth' });
  }
  return (
    <div className="flex flex-col gap-8">
      {userState}
      <video className="w-40 h-40" autoPlay ref={videoRef} muted></video>
      <button onClick={handleHomeNavigation} className="bg-blue-400 w-28 ">
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
      <video ref={remoteVideoRef} muted autoPlay playsInline controls={false} />
    </div>
  );
};
