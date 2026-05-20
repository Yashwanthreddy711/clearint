import { Socket } from "socket.io";
export interface Room {
    user1: Socket | null;
    user2: Socket | null;
}
export declare class RoomManager {
    private rooms;
    constructor();
    createRoomForUser(socket: Socket, username: string): string;
    joinRoomForUser(roomId: string, socket: Socket, username: string): string | null | undefined;
    getPeerDetailsWithRoomId(roomId: string, socketId: string): Socket | null;
    generateRoomId(): number;
}
//# sourceMappingURL=RoomManager.d.ts.map