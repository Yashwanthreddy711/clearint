import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
  name: string;
  socket: Socket;
}

export class UserManager {  
  private queue: any=[];
  private roomManager: RoomManager;

  constructor() {
    this.queue = [];
    this.roomManager = new RoomManager();
  }
  pushUserToQueue(socket:Socket){
   this.queue.push(socket); 
   console.log(socket.id,"pushed to queue");
   const res=this.instantMatchUser(socket);
   return res;
  }
  removeUserFromQueue(socket:Socket){
    this.queue=this.queue.filter((index:Socket) => index.id!==socket.id);
  }
  createRoom(socket: Socket, username: string): string {
    const user: User = { name: username, socket: socket };
    return this.roomManager.createRoomForUser(socket, username);
  }

  joinRoom(roomId: string, socket: Socket, username: string) {
    return this.roomManager.joinRoomForUser(roomId, socket, username);
  }
  getPeerDetails(roomId: string, socket: Socket, username: string) {
    const person1 = socket.id;
    const person2 = this.roomManager.getPeerDetailsWithRoomId(roomId, person1);
    if (person2 === null) {
      return null;
    }
    return person2;
  }
    onIceCandidates(
      sdp: any,
      socketId: string,
      type: "Sender" | "receiver",
      roomId: string,
    ) {
      const peer = this.roomManager.getPeerDetailsWithRoomId(roomId, socketId);
      if (peer) {
        peer.emit('webrtc:add-ice-candidate', { sdp: sdp, type: type });
      }
    } 

    instantMatchUser(socket:Socket){
      if(this.queue.length<2){
        console.log("Not enough to make a match");
        return null;
      }
      const roomId= this.roomManager.createRoomForUser(socket,'');
      let peer = this.findRandomUser();
      while(peer.id==socket.id){
        peer=this.findRandomUser();
      }
      const user=this.roomManager.joinRoomForUser(roomId,peer,'');
      if(user){
        this.removeUserFromQueue(socket);
        this.removeUserFromQueue(peer);
      }
      return {peer:peer,roomid:roomId};
    }

    findRandomUser(){
      return this.queue[Math.floor(Math.random() * this.queue.length)];
    }

    endCall(roomId: string, socket: Socket) {
      const peer = this.getPeerDetails(roomId, socket, "");
      if (peer) {
        peer.emit("room:peer-left");
      }
      this.roomManager.removeRoom(roomId);
    }

    handleDisconnect(socket: Socket) {
      const roomId = this.roomManager.findRoomIdBySocket(socket.id);
      if (!roomId) return;

      const peer = this.roomManager.getPeerDetailsWithRoomId(roomId, socket.id);
      if (peer) {
        peer.emit("room:peer-left");
      }
      this.roomManager.removeRoom(roomId);
    }
}
