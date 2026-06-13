"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
let GLOBAL_ROOM_ID = 1;
class RoomManager {
    rooms;
    constructor() {
        this.rooms = new Map();
    }
    createRoomForUser(socket, username) {
        const roomId = this.generateRoomId().toString();
        this.rooms.set(roomId, { user1: socket, user2: null });
        return roomId;
    }
    joinRoomForUser(roomId, socket, username) {
        const room = this.rooms.get(roomId);
        if (room && room?.user2 === null) {
            room.user2 = socket;
            this.rooms.set(roomId, room);
            return room.user1?.id;
        }
        return null;
    }
    getPeerDetailsWithRoomId(roomId, socketId) {
        const room = this.rooms.get(roomId);
        if (room) {
            if (room.user1?.id === socketId) {
                return room.user2;
            }
            else if (room.user2?.id === socketId) {
                return room.user1;
            }
        }
        return null;
    }
    generateRoomId() {
        return GLOBAL_ROOM_ID++;
    }
}
exports.RoomManager = RoomManager;
//# sourceMappingURL=RoomManager.js.map