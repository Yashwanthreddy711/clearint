"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const RoomManager_1 = require("./RoomManager");
class UserManager {
    queue = [];
    roomManager;
    constructor() {
        this.queue = [];
        this.roomManager = new RoomManager_1.RoomManager();
    }
    pushUserToQueue(socket) {
        this.queue.push(socket);
        console.log(socket.id, "pushed to queue");
        const res = this.instantMatchUser(socket);
        return res;
    }
    removeUserFromQueue(socket) {
        this.queue = this.queue.filter((index) => index.id !== socket.id);
    }
    createRoom(socket, username) {
        const user = { name: username, socket: socket };
        return this.roomManager.createRoomForUser(socket, username);
    }
    joinRoom(roomId, socket, username) {
        return this.roomManager.joinRoomForUser(roomId, socket, username);
    }
    getPeerDetails(roomId, socket, username) {
        const person1 = socket.id;
        const person2 = this.roomManager.getPeerDetailsWithRoomId(roomId, person1);
        if (person2 === null) {
            return null;
        }
        return person2;
    }
    onIceCandidates(sdp, socketId, type, roomId) {
        const peer = this.roomManager.getPeerDetailsWithRoomId(roomId, socketId);
        if (peer) {
            peer.emit('webrtc:add-ice-candidate', { sdp: sdp, type: type });
        }
    }
    instantMatchUser(socket) {
        if (this.queue.length < 2) {
            console.log("Not enough to make a match");
            return null;
        }
        const roomId = this.roomManager.createRoomForUser(socket, '');
        let peer = this.findRandomUser();
        while (peer.id == socket.id) {
            peer = this.findRandomUser();
        }
        const user = this.roomManager.joinRoomForUser(roomId, peer, '');
        if (user) {
            this.removeUserFromQueue(socket);
            this.removeUserFromQueue(peer);
        }
        return { peer: peer, roomid: roomId };
    }
    findRandomUser() {
        return this.queue[Math.floor(Math.random() * this.queue.length)];
    }
}
exports.UserManager = UserManager;
//# sourceMappingURL=UserManager.js.map