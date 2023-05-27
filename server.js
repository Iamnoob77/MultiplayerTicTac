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

const gameStates = {};
const clientRooms = {};
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
  socket.on("joinRandomRoom", handleJoinRandomRoom);
  socket.on("restartGame", handleRestartGame);
  socket.on("leaveGame", handleDisconnect);
  socket.on("chatMessage", handleChatMessage);
  function handleDisconnect() {
    let roomName = clientRooms[socket.id];
    let room = io.sockets.adapter.rooms.get(roomName);
    if (clientRooms[socket.id]) {
      if (room && room.size === 1) {
        socket.broadcast.to(clientRooms[socket.id]).emit("message", {
          sender: "playerConnection",
          msg: "Opponent Left",
        });
        socket.leave(clientRooms[socket.id]);
        delete clientRooms[socket.id];
      } else {
        delete clientRooms[socket.id];
        delete gameStates[clientRooms[socket.id]];
      }
    }
  }
  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[socket.id] = roomName;
    socket.emit("gameCode", roomName); //send game code to client
    socket.join(roomName);
    if (!gameStates[roomName]) {
      gameStates[roomName] = createNewGame();
    }
    socket.emit("init");
  }
  function handleJoinGame(roomName) {
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

    io.in(roomName).emit("message", {
      sender: "playerConnection",
      msg: "Player Joined!",
    });
    socket.emit("gameCode", roomName);
    socket.emit("init");
    gameStates[roomName].running = true;
  }
  function handleJoinRandomRoom() {
    const rooms = [...io.sockets.adapter.rooms.keys()];
    console.log(rooms);
    let oneSocketRooms = rooms.filter(function (room) {
      return io.sockets.adapter.rooms.get(room).size === 1 && room.length === 5;
    });
    let randomRoomName =
      oneSocketRooms[Math.floor(Math.random() * oneSocketRooms.length)];
    console.log(randomRoomName);
    if (!randomRoomName) {
      socket.emit("noRooms");
      return;
    }
    handleJoinGame(randomRoomName);
  }
  function handleCellClicked(cellIndex) {
    try {
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
    } catch (e) {
      console.log(e);
    }
  }
  function handleRestartGame() {
    try {
      let roomName = clientRooms[socket.id];
      gameStates[roomName].options = ["", "", "", "", "", "", "", "", ""];
      gameStates[roomName].currentPlayer = "X";
      if (io.sockets.adapter.rooms.get(roomName).size === 1) {
        gameStates[roomName].running = false;
      } else gameStates[roomName].running = true;
      io.in(roomName).emit("gameRestarted", {
        options: gameStates[roomName].options,
        currentPlayer: gameStates[roomName].currentPlayer,
      });
    } catch (e) {
      console.log(e);
    }
  }
  function updateCell(index) {
    console.log("updateCell");

    let roomName = clientRooms[socket.id];
    gameStates[roomName].options[index] = gameStates[roomName].currentPlayer;
    // console.log(gameStates);
    console.log(clientRooms);
    // console.log(index);
    gameStates[roomName].playerTurn = false;
    // console.log("rooM", roomName);

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
      socket.emit("gameOver", "You Won!");
      socket.broadcast.to(roomName).emit("gameOver", "You Lose!");
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
    socket.emit("changePlayer", {
      currentPlayer: `Opponent's turn(${gameStates[roomName].currentPlayer})`,
      color: "red",
      cursor: "disabled.png",
    });
    socket.broadcast.to(roomName).emit("changePlayer", {
      currentPlayer: "Your turn",
      color: "blue",
      cursor: `${gameStates[roomName].currentPlayer}.png`,
    });
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
