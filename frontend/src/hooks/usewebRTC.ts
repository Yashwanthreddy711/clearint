import { socket } from '../utils/socket';

export const useWebRTC = () => {
  const createWebRTCConnection = (
    remoteVideoRef: any,
    roomId: string | undefined
  ) => {
    const pc = new RTCPeerConnection();
    pc.ontrack = event => {
      console.log('Received remote tracks', remoteVideoRef);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = async event => {
      console.log("on ice-candidates triggered");
      if (event.candidate) {
        //send the candidate to the peer
        console.log('sending ice candidate from sender', event.candidate.type);
        socket.emit('webrtc:ice-candidate', {
          candidate: event.candidate,
          roomId: roomId,
        });
      }
    };
    return pc;
  };
  const setUpDataChannel = (
    pc: RTCPeerConnection,
    handleIncomingMessage: any
  ) => {
    const dataChannel = pc.createDataChannel('chat');
    dataChannel.onopen = () => {
      console.log('Data channel is open');
    };
    dataChannel.onerror = error => {
      console.log('Error in Datachannel', error);
    };
    dataChannel.onclose = () => {
      console.log('Data channel is closed');
    };
    dataChannel.onmessage = event => {
      console.log('Received message', event.data);
      handleIncomingMessage(event.data);
    };

    return dataChannel;
  };
  return {
    createWebRTCConnection,
    setUpDataChannel,
  };
};
