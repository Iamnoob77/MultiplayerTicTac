const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Server } = require("socket.io");

//* APP SETUP
const app = express();
const server = http.createServer(app);
/*
------------DECLARATION----------
*/
let clientNo = 0;
let roomNo;

// *STATIC FILES
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// *SOCKET SETUP AND PASS SERVER
const io = new Server(server);

//*CONNECTION
io.on("connection", connected);

function connected(socket) {
  clientNo++;
  console.log("Client Connected with id ", socket.id);
  console.log("No. of client :", clientNo);

  //?Calculating room number according to client number
  roomNo = Math.round(clientNo / 2);

  //?Server puts client in a room with the room number as its name
  socket.join(roomNo);

  //?Server emits to the client its client number and room number
  socket.emit("serverMsg", { clientNo: clientNo, roomNo: roomNo });

  //?GET DATA FROM USER
  socket.on("dataChanged", (data) => {
    console.log(data);
  });
}

//*LISTEN TO PORT 5000
server.listen(5000, () => {
  console.log("Listening on port 5000");
});
