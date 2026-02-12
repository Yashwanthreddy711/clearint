import { Socket } from "socket.io";
import express from "express";
import { UserManager } from "./controllers/UserManager";
import cors from "cors";
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const userManager = new UserManager();

io.on("connection", (socket: Socket) => {
  console.log("user connected:", socket.id);
  socket.on("room:create", (username: string) => {
    const roomId = userManager.createRoom(socket, username);
    socket.emit("room:created", { roomId: roomId });
  });
  socket.on("room:join-request", ({ roomId, username }) => {
    const response = userManager.joinRoom(roomId, socket, username);
    socket.emit("room:joined", { roomId: roomId, peer: response }); // for now the user has to ask to join the room and has to wait till the peer accepts the request
  });
  socket.on("room:ask-to-join", ({ roomId, username }) => {
    let peer: any = null;
    peer = userManager.getPeerDetails(roomId, socket, username);
    peer.emit("room:join-requested", { peerSocket: socket.id, username });
  });
 

  socket.on("webrtc:offer", ({ sdp, roomId }) => {
    let peer: any = null;
    peer = userManager.getPeerDetails(roomId, socket, "yashwanth");
    peer.emit("webrtc:offer", { sdp: sdp });
  });

  socket.on("webrtc:ice-candidate", ({ candidate, type, roomId }) => {
    userManager.onIceCandidates(candidate, socket.id, type, roomId);
  });

  socket.on("webrtc:answer", ({ sdp, roomId }) => {
    let peer: any = null;
    peer = userManager.getPeerDetails(roomId, socket, "");
    peer.emit("webrtc:answer", { sdp: sdp, roomId: roomId });
  });

  

  socket.on("instantmatch", (username: string) => {
    // Implement instant match logic here
  });
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Server is running on port 3000");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
