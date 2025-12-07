import { Socket } from "socket.io";
import { RoomManager } from './RoomManager';

export interface User{
    name:string;
    socket:Socket
}

export class UserManager {  
  private users: User[];
  private queue: string[];
  private roomManager: RoomManager;

  constructor() {
    this.users = [];
    this.queue = [];
    this.roomManager = new RoomManager();
  }


  createRoom(socket:Socket, username: string): string {
    const user: User = { name: username, socket: socket };
    this.users.push(user);
    // Logic to create a room using RoomManager
    return this.roomManager.createRoomForUser(socket,username);
  }

  joinRoom(roomId: string,socket:Socket, username: string): string {
    // Logic to join a room using RoomManager
    return this.roomManager.joinRoomForUser(roomId, socket, username);
  }

    
}