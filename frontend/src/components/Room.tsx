import { useParams } from 'react-router-dom';
import { socket } from '../utils/socket';
import { useEffect, useRef, useState } from 'react';
import { useMediaState } from '../utils/store/useMediaState';

export const Room = () => {
  const { roomId } = useParams();
  const localAudioTrack = useMediaState(state => state.localAudioTrack);
  const localVideoTrack = useMediaState(state => state.localVideoTrack);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef=useRef<HTMLVideoElement>(null);
  const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
  const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
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
    socket.on('send-offer', (data: any) => {
      console.log('Sending offer to the requested peer:', data);
      const pc = new RTCPeerConnection();
      setSendingPc(pc);
      if (localAudioTrack) {
        pc.addTrack(localAudioTrack, stream);
      }
      if (localVideoTrack) {
        pc.addTrack(localVideoTrack, stream);
      }

      pc.onicecandidate = async event => {
        if (event.candidate) {
          //send the candidate to the peer
          console.log("sending ice candidate from sender");
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            roomId: roomId,
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        const sdp = await pc.createOffer();
        await pc.setLocalDescription(sdp);  
        console.log("Sending offer SDP:", sdp);
        socket.emit('offer', {
          sdp: sdp,
          roomId: roomId,
        });
      }
    });

    socket.on('offer', async (data: any) => {
      console.log('Received offer:', data);
      const pc = new RTCPeerConnection();
      await pc?.setRemoteDescription(data.sdp);
      const sdp = await pc?.createAnswer();
      await pc?.setLocalDescription(sdp);
      const stream = new MediaStream();
      remoteVideoRef.current!.srcObject = stream;
      setReceivingPc(pc);
      setRemoteStream(stream);
        pc.ontrack = (e) => {
                alert("ontrack");
                console.error("inside ontrack");
                const {track, type} = e;
                if (type == 'audio') {
                    setRemoteAudioTrack(track);
                    // @ts-ignore
                    remoteVideoRef.current.srcObject.addTrack(track)
                } else {
                    setRemoteVideoTrack(track);
                    // @ts-ignore
                    remoteVideoRef.current.srcObject.addTrack(track)
                }
                //@ts-ignore
                remoteVideoRef.current.play();
            }

            pc.onicecandidate = async (event) => {
      if (event.candidate) {
        //send the candidate to the peer
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          type: 'receiver',
          roomId: roomId,
        });
      } 
    };

    console.log("Sending answer SDP:", sdp);
      socket.emit('answer', {
        sdp: sdp,
        roomId: roomId,
      });
      setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track
                console.log(track1);
                if (track1.kind === "video") {
                    setRemoteAudioTrack(track2)
                    setRemoteVideoTrack(track1)
                } else {
                    setRemoteAudioTrack(track1)
                    setRemoteVideoTrack(track2)
                }
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track1)
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track2)
                //@ts-ignore
                remoteVideoRef.current.play();
                // if (type == 'audio') {
                //     // setRemoteAudioTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // } else {
                //     // setRemoteVideoTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // }
                // //@ts-ignore
            }, 5000)
    });

    socket.on('answer', async (data: any) => {
      console.log('Received answer:', data);
       setSendingPc(pc => {
                pc?.setRemoteDescription(data.sdp)
                return pc;
            });
    }); 

    socket.on('add-ice-candidate', async (data: any) => {
      console.log('Received ICE candidate:', data);
      try {
        await receivingPc?.addIceCandidate(new RTCIceCandidate(data.sdp));
      } catch (error) {
        console.error('Error adding received ICE candidate', error);
      }
    });
  }, []);
  function handleAsktoJoin() {
    console.log("Asking to join room:", roomId);
    socket.emit('asktojoin', { roomId: roomId, username: 'yashwanth' });
  }
  return (
    <div className="flex flex-col gap-8">
      <video className="w-40 h-40" autoPlay ref={videoRef} muted></video>
      <button onClick={handleHomeNavigation} className="bg-blue-400 w-28 ">
        Go Home
      </button>
      <div>Room ID: {roomId}</div>
      <button onClick={handleAsktoJoin} className="w-40 bg-green-400">
        Ask to Join
      </button>
      <video className="w-40 h-40" autoPlay ref={remoteVideoRef}></video>
    </div>
  );
};
