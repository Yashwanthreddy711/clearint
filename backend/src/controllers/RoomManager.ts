import { Socket } from "socket.io";

export interface Room {
    user1: string;
    user2: string;
}
let GLOBAL_ROOM_ID = 1;
export class  RoomManager {
    private rooms:Map<string, Room>;
    constructor() {
        this.rooms = new Map<string, Room>();
    }
    createRoomForUser(socket:Socket, username:string):string {
        const roomId = this.generateRoomId().toString();
        this.rooms.set(roomId, {user1:socket.id, user2:""});
        return roomId;
    }
    joinRoomForUser(roomId:string, socket:Socket, username:string):string {
        const room = this.rooms.get(roomId);
        if (room && room.user2 === "") {
            room.user2 = socket.id; 
            this.rooms.set(roomId, room);
            return room.user1;
        }   
        return "Room is full or does not exist";
    }
    generateRoomId(){
        return GLOBAL_ROOM_ID++;
    }
};