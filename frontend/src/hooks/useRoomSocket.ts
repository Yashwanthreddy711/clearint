import { Socket } from 'socket.io-client';

interface UseRoomSocketProps {
  socket: Socket;
  roomId: string | undefined;
  createWebRTCConnection: any;
  setUpDataChannel: any;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  handleIncomingMessage: (msg: string) => void;
  pcRef: React.MutableRefObject<RTCPeerConnection | null>;
  dataChannelRef: React.MutableRefObject<RTCDataChannel | null>;
}
export const useRoomSocket = ({
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
}: UseRoomSocketProps) => {
  const handleSocketRoomJoinRequest = (
    username: string,
    stream: MediaStream
  ) => {
    const pc = createWebRTCConnection(remoteVideoRef, roomId);
    pcRef.current = pc;
    const dataChannel = setUpDataChannel(pc, handleIncomingMessage);
    pcRef.current = pc;
    dataChannelRef.current = dataChannel;

    pc.ontrack = (event: any) => {
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

    pc.onnegotiationneeded = async () => {
      console.log("onnegotiationed triggered");
      const sdp = await pc.createOffer();
      await pc.setLocalDescription(sdp);
      socket.emit('webrtc:offer', {
        sdp: sdp,
        roomId: roomId,
      });
    };
  };

  const handleSocketOnOffer = async (data: any) => {
    const pc = createWebRTCConnection(remoteVideoRef, roomId);
    pc.ontrack = (event: any) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.ondatachannel = (event: any) => {
      const dataChannel = event.channel;
      dataChannelRef.current = dataChannel;
      dataChannel.onopen = () => console.log('Data channel is Opened');
      dataChannel.onmessage = (event: any) => {
        console.log('Message from datachannel', event.data);
        handleIncomingMessage(event.data);
      };
      dataChannel.onerror = (error: any) =>
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

    socket.emit('webrtc:answer', {
      sdp: sdp,
      roomId: roomId,
    });
  };

  const handleOnSocketAnswer = async (data: any) => {
    await pcRef.current?.setRemoteDescription(data.sdp);
  };

  const handleSocketAddIceCandidates = async (data: any) => {
    const candidate = new RTCIceCandidate(data.sdp);
    await pcRef.current?.addIceCandidate(candidate);
  };
  return {
    handleSocketRoomJoinRequest,
    handleSocketOnOffer,
    handleOnSocketAnswer,
    handleSocketAddIceCandidates,
  };
};
