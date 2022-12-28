const express = require("express");
const socket = require("socket.io");
const makeid = require("./utils");
const http = require("http");
const { Server } = require("socket.io");

//* APP SETUP
const app = express();
const server = http.createServer(app);
/*
------------DECLARATION----------
*/
let playerTurn;
let currentPlayer = "X";
let running = false;
const state = {};
const clientRooms = {};
let options = ["", "", "", "", "", "", "", "", ""];
const winConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// *STATIC FILES
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// *SOCKET SETUP AND PASS SERVER
const io = new Server(server);

//*CONNECTION
io.on("connection", connected);

//* START :- NETWORKING
function connected(socket) {
  console.log("Client Connected with id ", socket.id);

  socket.on("cellClicked", handleCellClicked);
  socket.on("newGame", handleNewGame);
  socket.on("joinGame", handleJoinGame);
  socket.on("restartGame", handleRestartGame);
  function handleCellClicked(cellIndex) {
    // console.log(cellIndex);
    console.log(running);
    if (options[cellIndex] != "" || !running) {
      return;
    }

    updateCell(cellIndex);
    checkWinner(options);
  }
  function handleJoinGame(roomName) {
    socket.emit("gameCode", roomName);
    let numClients = 0;
    try {
      numClients = io.sockets.adapter.rooms.get(roomName).size;
    } catch (e) {
      console.log(e);
      socket.emit("unknownCode");
      return;
    }

    if (numClients === 0) {
      socket.emit("unknownCode");
      return;
    } else if (numClients > 1) {
      socket.emit("tooManyPlayers");
      return;
    }

    clientRooms[socket.id] = roomName;
    socket.join(roomName);
    socket.number = 2;
    player2 = socket.id;
    io.in(roomName).emit("playerCount", 2);
    running = true;
  }

  function handleNewGame() {
    player1 = socket.id;
    let roomName = makeid(5);
    clientRooms[socket.id] = roomName;
    socket.emit("gameCode", roomName);

    // state[roomName] = initGame();//!TODO

    socket.join(roomName);
    socket.number = 1;
    socket.to(roomName).emit("init", 1);
  }
  function handleRestartGame() {
    if (running) {
      socket.emit("stillRunning");
      return;
    }

    options = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = "X";
    running = true;
    io.in(clientRooms[socket.id]).emit("gameRestarted", {
      options,
      currentPlayer,
    });
  }
  function updateCell(index) {
    options[index] = currentPlayer;
    console.log(options);
    console.log(index);
    playerTurn = false;
    socket.emit("drawXorO", { options, playerTurn, currentPlayer });
    playerTurn = true;
    socket.broadcast.emit("drawXorO", { options, playerTurn });
  }

  //* END :- NETWORKING

  //* START :- GAME LOGIC
  function checkWinner(options) {
    let roundWon = false;
    for (let i = 0; i < winConditions.length; i++) {
      const condition = winConditions[i];
      const cellA = options[condition[0]];
      const cellB = options[condition[1]];
      const cellC = options[condition[2]];

      if (cellA == "" || cellB == "" || cellC == "") {
        continue;
      }
      if (cellA == cellB && cellB == cellC) {
        roundWon = true;
        break;
      }
    }
    if (roundWon) {
      io.in(clientRooms[socket.id]).emit(
        "changePlayer",
        currentPlayer + " wins!"
      );
      running = false;
    } else if (!options.includes("")) {
      io.in(clientRooms[socket.id]).emit("changePlayer", "Draw!");
      running = false;
    } else {
      changePlayer();
    }
  }
  function changePlayer() {
    currentPlayer = currentPlayer == "X" ? "O" : "X";
    io.in(clientRooms[socket.id]).emit(
      "changePlayer",
      currentPlayer + "'s turn"
    );
  }
}
//*LISTEN TO PORT 5000
server.listen(5000, () => {
  console.log("Listening on port 5000");
});
