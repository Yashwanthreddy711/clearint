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
  socket.on("createroom", (username: string) => {
    const roomId = userManager.createRoom(socket, username);
    socket.emit("roomcreated", { roomId: roomId });
  });
  socket.on("joinroom", ({roomId, username}) => {
    const response=userManager.joinRoom(roomId, socket, username);
    console.log("Join room response:", response);
    socket.emit("roomjoined", { roomId: roomId ,peer:response}); // 
  });
  socket.on("asktojoin",({roomId, username})=>{
    let peer:any=null;
     peer=userManager.getPeerDetails(roomId, socket,username);
     console.log("Peer Details:", peer);
     peer.emit("send-offer",{ peerSocket: socket.id });
  });

   socket.on("receive-offer", ({ roomId }) => {
     let peer :any=null;
     peer=userManager.getPeerDetails(roomId,socket,"");
     console.log("checking peer before emitting offer:", peer,typeof peer);
     peer.emit("receive-offer", { roomId:roomId,socketId: socket.id });
  });
  // socket.on("send-offer", ({ peerSocket }) => {
  //   peerSocket.emit("receive-offer", { socket: socket });
  // });



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
