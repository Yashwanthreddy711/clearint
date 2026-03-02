import { Socket } from 'socket.io-client';
import { log } from '../services/log';

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
      log("MEDIA", "Received remote tracks", { event });
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
      log("WEBRTC", "onnegotiationed triggered");
      const sdp = await pc.createOffer();
      await pc.setLocalDescription(sdp);
      log("WEBRTC", "Sending offer", { sdp });
      socket.emit('webrtc:offer', {
        sdp: sdp,
        roomId: roomId,
      });
    };
  };

  const handleSocketOnOffer = async (data: any,stream: MediaStream) => {
    log("SIGNALING", "Received offer", { data });
    const pc = createWebRTCConnection(remoteVideoRef, roomId);
    pc.ontrack = (event: any) => {
      log("MEDIA", "Received remote tracks", { event });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.ondatachannel = (event: any) => {
      log("DATA", "Received data channel", { event });
      const dataChannel = event.channel;
      dataChannelRef.current = dataChannel;
      dataChannel.onopen = () => log("SIGNALING", "Data channel is Opened");
      dataChannel.onmessage = (event: any) => {
        log("DATA", "Message from datachannel", { event });
        handleIncomingMessage(event.data);
      };
      dataChannel.onerror = (error: any) =>
        log("DATA", "Error in datachannel", { error });
      dataChannel.onclose = () => log("SIGNALING", "Data channel closed");
    };

    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    log("SIGNALING", "Set remote description", { data });

    if (localAudioTrack) {
      pc.addTrack(localAudioTrack, stream);
    }
    if (localVideoTrack) {
      pc.addTrack(localVideoTrack, stream);
    }

    const sdp = await pc?.createAnswer();
    log("SIGNALING", "Created answer", { sdp });
    await pc?.setLocalDescription(sdp);

    socket.emit('webrtc:answer', {
      sdp: sdp,
      roomId: roomId,
    });
  };

  const handleOnSocketAnswer = async (data: any) => {
    log("SIGNALING", "Received answer", { data });
    await pcRef.current?.setRemoteDescription(data.sdp);
  };

  const handleSocketAddIceCandidates = async (data: any) => {
    log("SIGNALING", "Received ice candidates", { data });
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
