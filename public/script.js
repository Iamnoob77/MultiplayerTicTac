var socket = io();

//* START :- GETTING HTML CONTENT
const gameAndMessage = document.getElementById("gameAndMessage");
const initialScreen = document.getElementById("initialScreen");
const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const gameCodeInput = document.getElementById("gameCodeInput");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");
const playerN = document.getElementById("playerNumber");
const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const restartBtn = document.querySelector("#restartBtn");
//* END :- GETTING HTML CONTENT

//* START :- SOCKETS
socket.on("init", handleInit);

socket.on("gameCode", handleGameCode);
socket.on("unknownCode", handleUnknownCode);
socket.on("tooManyPlayers", handleTooManyPlayers);
socket.on("drawXorO", handleDrawXorO);
socket.on("changePlayer", handleChangePlayer);
socket.on("playerCount", handlePlayerCount);
socket.on("gameRestarted", handleGameRestarted);
socket.on("stillRunning", handleStillRunning);
//* END :- SOCKETS

//* START :- LISTENERS
newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);
//* END :- LISTENERS

//?------------START OF GAME DECLARATION ---------------

let playerTurn = true;
let roomName;

//?-------------END OF GAME DECLARATION----------

//* START :- GAME LOGIC
function newGame() {
  socket.emit("newGame");
  initializeGame();
}
function joinGame() {
  const code = gameCodeInput.value;
  console.log(code);
  if (code !== "") {
    socket.emit("joinGame", code);
    initializeGame();
  } else {
    alert("Please Enter Game Code");
  }
}
let playerNumber;
function initializeGame() {
  initialScreen.style.display = "none";
  gameAndMessage.style.display = "flex";
  playerN.style.display = "block";
  cells.forEach((cell) => {
    cell.addEventListener("click", cellClicked);
  });
  restartBtn.addEventListener("click", restartGame);
}
function cellClicked() {
  console.log(socket.id);
  const cellIndex = this.getAttribute("cellIndex");

  console.log(cellIndex);
  if (playerTurn) socket.emit("cellClicked", cellIndex);
}

function restartGame() {
  socket.emit("restartGame", roomName);
}
function handleGameRestarted(data) {
  console.log("restarted", data);
  for (let i = 0; i < data.options.length; i++) {
    cells[i].textContent = data.options[i];
  }
  playerTurn = true;
  initializeGame();
}

function handleStillRunning() {
  console.log("permission");
  alert("Game is still Running");
}
//* END :- GAME LOGIC

//*NETWORKING
function handleInit(number) {
  playerNumber = number;
}

function handleGameCode(gameCode) {
  roomName = gameCode;
  gameCodeDisplay.innerText = `room name: ${gameCode}`;
}
function handleUnknownCode() {
  restartGame();
  alert("Unknown code");
}
function handleTooManyPlayers() {
  restartGame();
  alert("This game is already in progress");
}
function handleDrawXorO(data) {
  playerTurn = data.playerTurn;

  for (let i = 0; i < data.options.length; i++) {
    cells[i].textContent = data.options[i];
  }
}
function handleChangePlayer(currentPlayer) {
  statusText.textContent = `${currentPlayer}`;
}
function handlePlayerCount(playNum) {
  playerN.textContent = `Total Players: ${playNum}`;
}
