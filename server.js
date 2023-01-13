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
// let currentPlayer = "X";
// let running = false;
const gameStates = {};
const clientRooms = {};
// let options = ["", "", "", "", "", "", "", "", ""];
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
  socket.on("disconnect", handleDisconnect);

  socket.on("cellClicked", handleCellClicked);
  socket.on("newGame", handleNewGame);
  socket.on("joinGame", handleJoinGame);
  socket.on("restartGame", handleRestartGame);

  socket.on("chatMessage", handleChatMessage);

  function handleDisconnect() {
    if (clientRooms[socket.id]) {
      socket.broadcast
        .to(clientRooms[socket.id])
        .emit("message", { sender: "playerConnection", msg: "Opponent Left" });
      socket.leave(clientRooms[socket.id]);
    }
  }
  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[socket.id] = roomName;
    socket.emit("gameCode", roomName); //send game code to client
    socket.join(roomName);
    // socket.number = 1;
    // socket.to(roomName).emit("init", 1); //TODO
    if (!gameStates[roomName]) {
      gameStates[roomName] = createNewGame();
    }
    socket.emit("init");
  }
  function handleJoinGame(roomName) {
    // socket.emit("gameCode", roomName);
    let roomSize = 0;
    try {
      roomSize = io.sockets.adapter.rooms.get(roomName).size;
    } catch (e) {
      console.log(e);
      socket.emit("unknownCode");
      return;
    }

    if (roomSize === 0) {
      socket.emit("unknownCode");
      return;
    } else if (roomSize > 1) {
      socket.emit("tooManyPlayers");
      return;
    }

    clientRooms[socket.id] = roomName;
    socket.join(roomName);
    // socket.number = 2;
    // console.log(gameStates[roomName].running);
    io.in(roomName).emit("message", {
      sender: "playerConnection",
      msg: "New Player Joined!",
    });
    socket.emit("gameCode", roomName);
    socket.emit("init");
    gameStates[roomName].running = true;

    // running = true;
  }
  function handleCellClicked(cellIndex) {
    // console.log(cellIndex);
    let roomName = clientRooms[socket.id];
    console.log(gameStates[roomName].running);
    if (
      gameStates[roomName].options[cellIndex] != "" ||
      !gameStates[roomName].running
    ) {
      return;
    }

    updateCell(cellIndex);
    checkWinner(gameStates[roomName].options);
  }
  function handleRestartGame() {
    let roomName = clientRooms[socket.id];

    // if (gameStates[roomName].running) {
    //   socket.emit("stillRunning");
    //   return;
    // }

    gameStates[roomName].options = ["", "", "", "", "", "", "", "", ""];
    gameStates[roomName].currentPlayer = "X";
    gameStates[roomName].running = true;
    io.in(roomName).emit("gameRestarted", {
      options: gameStates[roomName].options,
      currentPlayer: gameStates[roomName].currentPlayer,
    });
  }
  function updateCell(index) {
    console.log("updateCell");

    let roomName = clientRooms[socket.id];
    gameStates[roomName].options[index] = gameStates[roomName].currentPlayer;
    console.log(gameStates);
    console.log(clientRooms);
    // console.log(index);
    gameStates[roomName].playerTurn = false;
    console.log("rooM", roomName);

    //?RESPONSIBLE FOR CHANGING PLAYER
    socket.emit("drawXorO", {
      options: gameStates[roomName].options,
      playerTurn: gameStates[roomName].playerTurn,
      currentPlayer: gameStates[roomName].currentPlayer,
    });
    gameStates[roomName].playerTurn = true;
    socket.broadcast.to(roomName).emit("drawXorO", {
      options: gameStates[roomName].options,
      playerTurn: gameStates[roomName].playerTurn,
      currentPlayer: gameStates[roomName].currentPlayer,
    });
  }
  function handleChatMessage(data) {
    //check if there are two players or not

    socket.broadcast
      .to(clientRooms[socket.id])
      .emit("message", { sender: "Opponent", msg: data });
  }

  //* END :- NETWORKING

  //* START :- GAME LOGIC
  function checkWinner(options) {
    let roomName = clientRooms[socket.id];
    let roundWon = false;
    for (let i = 0; i < winConditions.length; i++) {
      const condition = winConditions[i];
      const cellA = gameStates[roomName].options[condition[0]];
      const cellB = gameStates[roomName].options[condition[1]];
      const cellC = gameStates[roomName].options[condition[2]];

      if (cellA == "" || cellB == "" || cellC == "") {
        continue;
      }
      if (cellA == cellB && cellB == cellC) {
        roundWon = true;
        break;
      }
    }
    if (roundWon) {
      io.in(roomName).emit(
        "gameOver",
        gameStates[roomName].currentPlayer + " Won!"
      );
      gameStates[roomName].running = false;
    } else if (!options.includes("")) {
      io.in(roomName).emit("gameOver", "Draw!");
      gameStates[roomName].running = false;
    } else {
      changePlayer();
    }
  }
  function changePlayer() {
    let roomName = clientRooms[socket.id];
    gameStates[roomName].currentPlayer =
      gameStates[roomName].currentPlayer == "X" ? "O" : "X";
    io.in(roomName).emit(
      "changePlayer",
      gameStates[roomName].currentPlayer + "'s turn"
    );
  }
}
function createNewGame() {
  return {
    options: ["", "", "", "", "", "", "", "", ""],
    currentPlayer: "X",
    running: false,
    playerTurn: true,
  };
}
//*LISTEN TO PORT 5000
server.listen(5000, () => {
  console.log("Listening on port 5000");
});
