import { Socket } from "socket.io";

export interface Room {
  user1: Socket | null;
  user2: Socket | null;
}
let GLOBAL_ROOM_ID = 1;
export class RoomManager {
  private rooms: Map<string, Room>;
  constructor() {
    this.rooms = new Map<string, Room>();
  }
  createRoomForUser(socket: Socket, username: string): string {
    const roomId = this.generateRoomId().toString();
    this.rooms.set(roomId, { user1: socket, user2: null });
    return roomId;
  }
  joinRoomForUser(roomId: string, socket: Socket, username: string) {
    const room = this.rooms.get(roomId);
    if (room && room?.user2 === null) {
      room.user2 = socket;
      this.rooms.set(roomId, room);
      return room.user1?.id;
    }
    return "Room is full or does not exist";
  }
  getPeerDetailsWithRoomId(roomId: string, socketId: string): Socket | null {
    const room = this.rooms.get(roomId);
    if (room) {
      if (room.user1?.id === socketId) {
        return room.user2;
      } else if (room.user2?.id === socketId) {
        return room.user1;
      }
    }
    return null;
  }
  generateRoomId() {
    return GLOBAL_ROOM_ID++;
  }
}
