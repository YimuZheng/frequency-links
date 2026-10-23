let socket = io();

let leftCircle = document.querySelector("#leftCircle");
let rightCircle = document.querySelector("#rightCircle");
let ball = document.querySelector("#ball");

let leftScore = document.querySelector("#leftScore");
let rightScore = document.querySelector("#rightScore");

let leftGoal = document.querySelector("#leftGoal");
let rightGoal = document.querySelector("#rightGoal");

let rulesOverlay = document.querySelector("#rulesOverlay");
let nameField = document.querySelector("#nameField");
let playerNameInput = document.querySelector("#playerName");
let rulesList = document.querySelector("#rulesList");
let modalTitle = document.querySelector("#modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
let finalScore = document.querySelector("#finalScore");
let finalLeftScore = document.querySelector("#finalLeftScore");
let finalRightScore = document.querySelector("#finalRightScore");
let startButton = document.querySelector("#startButton");

let mySide = null;
let myX = 0.25;
let myY = 0.5;

let currentPhase = null;
let readySent = false;
let gameFull = false;

let previousScores = null;
let previousHitCount = null;
let previousGoalCount = null;


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function moveCircle(circle, x, y) {
  circle.style.left = (x * 100) + "%";
  circle.style.top = (y * 100) + "%";
}


function moveBall(x, y) {
  ball.style.left = (x * 100) + "%";
  ball.style.top = (y * 100) + "%";
}


function getMyCircle() {
  return mySide === "left" ? leftCircle : rightCircle;
}


function updateStartButton() {
  if (gameFull) {
    return;
  }

  if (readySent) {
    startButton.disabled = true;
    startButton.textContent = "Waiting...";
    return;
  }

  startButton.textContent =
    currentPhase === "finished" ? "Play Again" : "Start";

  startButton.disabled =
    mySide === null ||
    playerNameInput.value.trim().length === 0;
}


// Keep the Start button disabled until a valid name is entered.
// This is the only input listener; duplicate listeners are unnecessary.
playerNameInput.addEventListener("input", () => {
  playerNameInput.classList.remove("input-error");

  if (
    (currentPhase === "waiting" || currentPhase === null) &&
    !readySent &&
    !gameFull
  ) {
    updateStartButton();
  }
});


function sendPlayerPosition() {
  if (mySide === null) {
    return;
  }

  socket.emit("playerMove", {
    x: myX,
    y: myY,
    width: window.innerWidth,
    height: window.innerHeight
  });
}


function showRules() {
  modalTitle.textContent = "CoLlide";
  modalTitle.className = "modal-title";

  modalSubtitle.hidden = false;

  nameField.hidden = false;
  playerNameInput.disabled = readySent;

  rulesList.hidden = false;
  finalScore.hidden = true;
  startButton.hidden = false;

  updateStartButton();
  rulesOverlay.classList.remove("is-hidden");
}


function showWinner(state) {
  const winningPlayer = state.players[state.winner];

  const winnerName = winningPlayer && winningPlayer.name
    ? winningPlayer.name
    : (state.winner === "left" ? "Player 1" : "Player 2");

  modalTitle.textContent = winnerName + " Wins 🏆";
  modalTitle.className = state.winner === "left"
    ? "modal-title winner-left"
    : "modal-title winner-right";

  modalSubtitle.hidden = true;

  nameField.hidden = true;
  playerNameInput.disabled = true;

  rulesList.hidden = true;
  finalScore.hidden = false;

  finalLeftScore.textContent = state.scores.left;
  finalRightScore.textContent = state.scores.right;

  startButton.hidden = false;
  startButton.disabled = false;
  startButton.textContent = "Play Again";

  rulesOverlay.classList.remove("is-hidden");
}


function animateScore(element) {
  element.classList.remove("score-pop");
  void element.offsetWidth;
  element.classList.add("score-pop");
}


function flashGoal(side) {
  const goal = side === "left" ? leftGoal : rightGoal;

  goal.classList.remove("goal--scored");
  void goal.offsetWidth;
  goal.classList.add("goal--scored");

  setTimeout(() => {
    goal.classList.remove("goal--scored");
  }, 700);
}


function flashPuck() {
  ball.classList.remove("is-hit");
  void ball.offsetWidth;
  ball.classList.add("is-hit");
}


startButton.addEventListener("click", () => {
  if (mySide === null || readySent || gameFull) {
    return;
  }

  if (currentPhase !== "waiting" && currentPhase !== "finished") {
    return;
  }

  // A rematch uses the same player's name.
  const isRematch = currentPhase === "finished";
  const name = playerNameInput.value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 16);

  if (!isRematch && !name) {
    playerNameInput.classList.add("input-error");
    playerNameInput.focus();
    return;
  }

  readySent = true;

  if (!isRematch) {
    playerNameInput.value = name;
    playerNameInput.disabled = true;
  }

  startButton.disabled = true;
  startButton.textContent = "Waiting...";

  socket.emit("readyToPlay", { name: name });
});


socket.on("playerAssignment", (side) => {
  mySide = side;

  myX = side === "left" ? 0.25 : 0.75;
  myY = 0.5;

  moveCircle(getMyCircle(), myX, myY);
  sendPlayerPosition();

  updateStartButton();
});


document.addEventListener("pointermove", (e) => {
  if (mySide === null || currentPhase !== "playing") {
    return;
  }

  const circle = getMyCircle();
  const rect = circle.getBoundingClientRect();

  let x = e.clientX / window.innerWidth;
  let y = e.clientY / window.innerHeight;

  const radiusX = (rect.width / 2) / window.innerWidth;
  const radiusY = (rect.height / 2) / window.innerHeight;

  y = clamp(y, radiusY, 1 - radiusY);

  if (mySide === "left") {
    x = clamp(x, radiusX, 0.5 - radiusX);
  } else {
    x = clamp(x, 0.5 + radiusX, 1 - radiusX);
  }

  myX = x;
  myY = y;

  // Immediately move the local striker for responsive controls.
  moveCircle(circle, x, y);

  // The server handles the authoritative collision calculation.
  sendPlayerPosition();
});


window.addEventListener("resize", () => {
  if (mySide === null) {
    return;
  }

  const circle = getMyCircle();
  const rect = circle.getBoundingClientRect();

  const radiusX = (rect.width / 2) / window.innerWidth;
  const radiusY = (rect.height / 2) / window.innerHeight;

  myY = clamp(myY, radiusY, 1 - radiusY);

  if (mySide === "left") {
    myX = clamp(myX, radiusX, 0.5 - radiusX);
  } else {
    myX = clamp(myX, 0.5 + radiusX, 1 - radiusX);
  }

  moveCircle(circle, myX, myY);
  sendPlayerPosition();
});


socket.on("gameState", (state) => {
  if (gameFull || !state || !state.ball || !state.players) {
    return;
  }

  const phaseChanged = state.phase !== currentPhase;

  // Render the server's shared positions.
  moveCircle(leftCircle, state.players.left.x, state.players.left.y);
  moveCircle(rightCircle, state.players.right.x, state.players.right.y);
  moveBall(state.ball.x, state.ball.y);

  leftScore.textContent = state.scores.left;
  rightScore.textContent = state.scores.right;

  // Animate score changes.
  if (previousScores !== null) {
    if (state.scores.left > previousScores.left) {
      animateScore(leftScore);
    }

    if (state.scores.right > previousScores.right) {
      animateScore(rightScore);
    }
  }

  // Animate new hits and goals only once.
  if (
    previousHitCount !== null &&
    state.ball.hitCount > previousHitCount
  ) {
    flashPuck();
  }

  if (
    previousGoalCount !== null &&
    state.ball.goalCount > previousGoalCount
  ) {
    flashGoal(state.ball.lastGoalSide);
  }

  previousScores = { ...state.scores };
  previousHitCount = state.ball.hitCount;
  previousGoalCount = state.ball.goalCount;


  // Handle the game phase.
  if (state.phase === "waiting") {
    document.body.classList.remove("game-active");

    if (currentPhase !== "waiting") {
      if (
        currentPhase === "playing" ||
        currentPhase === "goalPause" ||
        currentPhase === "finished"
      ) {
        readySent = false;
        playerNameInput.disabled = false;
      }

      showRules();
    }
  } else if (
    state.phase === "playing" ||
    state.phase === "goalPause"
  ) {
    if (
      currentPhase !== "playing" &&
      currentPhase !== "goalPause"
    ) {
      readySent = false;
      playerNameInput.disabled = true;
    }

    document.body.classList.add("game-active");
    rulesOverlay.classList.add("is-hidden");
  } else if (state.phase === "finished") {
    document.body.classList.remove("game-active");

    if (currentPhase !== "finished") {
      readySent = false;
      showWinner(state);
    } else {
      finalLeftScore.textContent = state.scores.left;
      finalRightScore.textContent = state.scores.right;
    }
  }

  currentPhase = state.phase;

  // Refresh the button after a phase transition so its label reflects the
  // new phase (for example, Start rather than Play Again after a reset).
  if (phaseChanged) {
    updateStartButton();
  }
});


socket.on("playerLeft", () => {
  readySent = false;
  playerNameInput.disabled = false;

  if (currentPhase === "waiting") {
    showRules();
  }
});


socket.on("gameFull", () => {
  gameFull = true;

  modalTitle.textContent = "TABLE FULL";
  modalTitle.className = "modal-title";
  modalSubtitle.hidden = true;

  rulesOverlay.classList.add("is-table-full");
  nameField.hidden = true;
  rulesList.hidden = true;
  finalScore.hidden = true;
  startButton.hidden = true;

  document.body.classList.remove("game-active");
  rulesOverlay.classList.remove("is-hidden");
});


socket.on("disconnect", () => {
  mySide = null;
  readySent = false;

  document.body.classList.remove("game-active");
  playerNameInput.disabled = false;

  if (!gameFull) {
    showRules();
    startButton.disabled = true;
  }
});
