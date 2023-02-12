var socket = io();

//* START :- GETTING HTML CONTENT
const gameAndMessage = document.getElementById("gameAndMessage");
const initialScreen = document.getElementById("initialScreen");
const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const gameCodeInput = document.getElementById("gameCodeInput");
const joinRamdomRoomBtn = document.getElementById("joinRandomRoomButton");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");
const playerN = document.getElementById("playerNumber");
const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const game = document.getElementById("game");

const chatForm = document.getElementById("chat-form");
const inputMessage = document.querySelector("#inputMessage");
const sendBtn = document.getElementById("sendBtn");
const chatMessages = document.getElementById("chat-messages");

const gameOverAlert = document.getElementById("customAlert");
const showTime = document.getElementById("showTime");
const restartBtn = document.getElementById("restartBtn");

//* END :- GETTING HTML CONTENT

//* START :- SOCKETS
socket.on("init", handleInit);

socket.on("gameCode", handleGameCode);
socket.on("unknownCode", handleUnknownCode);
socket.on("tooManyPlayers", handleTooManyPlayers);
socket.on("drawXorO", handleDrawXorO);
socket.on("changePlayer", handleChangePlayer);
socket.on("gameRestarted", handleGameRestarted);
socket.on("stillRunning", handleStillRunning);
socket.on("gameOver", handleGameOver);
//message from server
socket.on("message", handleMessage);
//* END :- SOCKETS

//* START :- LISTENERS
newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);
joinRamdomRoomBtn.addEventListener("click", joinRandomRoom);
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = inputMessage.value.trim();

  if (!msg) {
    return false;
  }
  //send message to server
  outputMessage({ sender: "You", msg });
  socket.emit("chatMessage", msg);
  inputMessage.value = "";
  inputMessage.focus();
});
//* END :- LISTENERS

//?------------START OF GAME DECLARATION ---------------

let playerTurn = true;
let roomName;
// let gameOverTimeInterval;

//?-------------END OF GAME DECLARATION----------

//* START :- GAME LOGIC
function newGame() {
  socket.emit("newGame");
  // initializeGame();
  console.log("h", socket.id);
}
function joinGame() {
  const code = gameCodeInput.value;
  console.log(code);
  if (code !== "") {
    socket.emit("joinGame", code);
  } else {
    alert("Please Enter Game Code");
  }
  console.log(socket.id);
}
function joinRandomRoom() {
  socket.emit("joinRandomRoom");
}

let playerNumber;
function initializeGame() {
  initialScreen.style.display = "none";
  gameAndMessage.style.display = "flex";
  playerN.style.display = "block";
  cells.forEach((cell) => {
    cell.addEventListener("click", cellClicked);
  });
  // restartBtn.addEventListener("click", restartGame);
}
function cellClicked() {
  console.log(socket.id);
  const cellIndex = this.getAttribute("cellIndex");

  console.log(cellIndex);
  if (playerTurn) socket.emit("cellClicked", cellIndex);
}

function restartGame() {
  statusText.style.fontSize = "1.5rem";
  statusText.style.color = "black";
  statusText.innerHTML = 'You will be "X" if you move';
  socket.emit("restartGame", roomName);
}
function handleGameRestarted(data) {
  for (let i = 0; i < data.options.length; i++) {
    cells[i].textContent = data.options[i];
  }
  playerTurn = true;
  initializeGame();
}

function handleStillRunning() {
  alert("Game Is Still Running");
}
//* END :- GAME LOGIC

//*NETWORKING
function handleInit() {
  initializeGame();
}

function handleGameCode(gameCode) {
  roomName = gameCode;
  gameCodeDisplay.innerText = `room name: ${gameCode}`;
}
function handleUnknownCode() {
  alert("Unknown code :(");
  // restartGame();
  return;
}
function handleTooManyPlayers() {
  alert("This game is already in progress");
  // restartGame();
}
function handleDrawXorO(data) {
  playerTurn = data.playerTurn;

  for (let i = 0; i < data.options.length; i++) {
    cells[i].textContent = data.options[i];
  }
  console.log(data.playerTurn);
}
function handleChangePlayer(data) {
  statusText.style.fontSize = "2.5rem";
  statusText.style.color = `${data.color}`;
  statusText.textContent = `${data.currentPlayer}`;
  cells.forEach((cell) => {
    cell.style.cursor = `url(${data.cursor}), auto`;
  });
}
function handlePlayerCount(playNum) {
  playerN.textContent = `Total Players: ${playNum}`;
}
//message from server
function handleMessage(data) {
  console.log(data);
  outputMessage(data);
  //scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function handleGameOver(data) {
  showGameOverAlert(data);
}
//* END :- NETWORKING
//output message to DOM
function outputMessage(data) {
  const div = document.createElement("div");
  const p = document.createElement("p");
  const spanName = document.createElement("span");
  const spanMessage = document.createElement("span");

  spanMessage.classList.add("spanMessage");
  p.classList.add("meta");

  spanName.style.fontSize = "1.2rem";
  spanName.style.fontWeight = "bold";
  p.style.marginBottom = "0.5rem";
  if (data.sender === "You") {
    spanName.innerText = "You: ";
    spanName.style.color = "blue";
  } else if (data.sender === "Opponent") {
    spanName.innerText = "Opponent: ";
    spanName.style.color = "orange";
  } else if (data.sender === "playerConnection") {
    spanName.innerText = "Server: ";
    if (data.msg === "New Player Joined!") {
      handlePlayerCount(2);
      spanMessage.style.color = "green";
    } else {
      handlePlayerCount(1);
      restartGame();
      spanMessage.style.color = "red";
    }
    spanMessage.style.fontStyle = "italic";
  }
  spanMessage.innerHTML = `${data.msg}`;
  p.appendChild(spanName);
  p.appendChild(spanMessage);
  div.appendChild(p);

  chatMessages.appendChild(div);
}
function leaveGame() {
  socket.emit("leaveGAme");
  window.location.reload();
}
// POP UP
function showGameOverAlert(message) {
  const alertMessage = document.getElementById("gameOverMessage");
  const overlay = document.getElementById("overlay");
  alertMessage.style.color = "green";
  alertMessage.innerText = message;
  gameOverAlert.style.display = "block";
  gameOverAlert.classList.add("animate__animated", "animate__backInDown");
  overlay.style.display = "block";
  let gameOverSpentTime = 0;
  let gameOverTimeInterval = setInterval(showTimeFunc, 1000);

  function showTimeFunc() {
    console.log(gameOverTimeInterval);
    gameOverSpentTime++;
    // console.log("g", gameOverSpentTime);
    showTime.innerHTML = gameOverSpentTime;
    if (gameOverSpentTime > 15) {
      gameOverSpentTime = 0;
      clearInterval(gameOverTimeInterval);
      leaveGame(); //TODO
    }
  }

  restartBtn.addEventListener("click", () => {
    gameOverAlert.style.display = "none";
    overlay.style.display = "none";
    clearInterval(gameOverTimeInterval);
    gameOverSpentTime = 0;
    restartGame();
  });
}
