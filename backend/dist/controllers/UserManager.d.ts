import { Socket } from "socket.io";
export interface User {
    name: string;
    socket: Socket;
}
export declare class UserManager {
    private queue;
    private roomManager;
    constructor();
    pushUserToQueue(socket: Socket): {
        peer: any;
        roomid: string;
    } | null;
    removeUserFromQueue(socket: Socket): void;
    createRoom(socket: Socket, username: string): string;
    joinRoom(roomId: string, socket: Socket, username: string): string | null | undefined;
    getPeerDetails(roomId: string, socket: Socket, username: string): Socket<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any> | null;
    onIceCandidates(sdp: any, socketId: string, type: "Sender" | "receiver", roomId: string): void;
    instantMatchUser(socket: Socket): {
        peer: any;
        roomid: string;
    } | null;
    findRandomUser(): any;
}
//# sourceMappingURL=UserManager.d.ts.map