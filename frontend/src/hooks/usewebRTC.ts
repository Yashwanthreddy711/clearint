import { log } from '../services/log';
import { socket } from '../utils/socket';

export const useWebRTC = () => {
  const createWebRTCConnection = (
    remoteVideoRef: any,
    roomId: string | undefined
  ) => {
    const pc = new RTCPeerConnection();
    pc.ontrack = event => {
      log("MEDIA", "Received remote tracks", { event });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = async event => {
      log("WEBRTC", "on ice-candidates triggered");
      if (event.candidate) {
        //send the candidate to the peer
        log("WEBRTC", "Sending ice candidate from sender", { event });
        socket.emit('webrtc:ice-candidate', {
          candidate: event.candidate,
          roomId: roomId,
        });
      }
      pc.onconnectionstatechange = event => {
        const pc = event.target as RTCPeerConnection;
        log("WEBRTC", "Connection state changed", pc.connectionState);
      };
      pc.oniceconnectionstatechange = event => {
        const pc = event.target as RTCPeerConnection;
        log("WEBRTC", "Ice connection state changed", pc.connectionState);
      };
      pc.onicegatheringstatechange = event => {
        const pc = event.target as RTCPeerConnection;
        log("WEBRTC", "Ice gathering state changed", pc.connectionState);
      };
      pc.onicecandidateerror = event => {
        log("WEBRTC", "Ice candidate error", { event });
      };
    };
    return pc;
  };
  const setUpDataChannel = (
    pc: RTCPeerConnection,
    handleIncomingMessage: any
  ) => {
    const dataChannel = pc.createDataChannel('chat');
    dataChannel.onopen = () => {
      log("DATA", "Data channel is open");
    };
    dataChannel.onerror = error => {
      log("DATA", "Error in Datachannel", { error });
    };
    dataChannel.onclose = () => {
      log("DATA", "Data channel is closed");
    };
    dataChannel.onmessage = event => {
      log("DATA", "Received message", { event });
      handleIncomingMessage(event.data);
    };

    return dataChannel;
  };
  return {
    createWebRTCConnection,
    setUpDataChannel,
  };
};
