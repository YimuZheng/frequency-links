let socket = io();

let leftCircle = document.querySelector("#leftCircle");
let rightCircle = document.querySelector("#rightCircle");
let ball = document.querySelector("#ball");

let mySide = null;


function moveCircle(circle, x, y) {
  circle.style.left = (x * 100) + "%";
  circle.style.top = (y * 100) + "%";
}


function isColliding(circle, ball) {
  let circleRect = circle.getBoundingClientRect();
  let ballRect = ball.getBoundingClientRect();

  let circleX = circleRect.left + circleRect.width / 2;
  let circleY = circleRect.top + circleRect.height / 2;

  let ballX = ballRect.left + ballRect.width / 2;
  let ballY = ballRect.top + ballRect.height / 2;

  let dx = ballX - circleX;
  let dy = ballY - circleY;

  let distance = Math.sqrt(dx * dx + dy * dy);

  let circleRadius = circleRect.width / 2;
  let ballRadius = ballRect.width / 2;

  return distance <= circleRadius + ballRadius;
}


function moveBall(amount) {
  let ballRect = ball.getBoundingClientRect();

  let x = (ballRect.left + ballRect.width / 2) / window.innerWidth;
  let y = (ballRect.top + ballRect.height / 2) / window.innerHeight;

  x = x + amount;

  let ballRadiusX = (ballRect.width / 2) / window.innerWidth;
  x = Math.max(ballRadiusX, Math.min(1 - ballRadiusX, x));

  ball.style.left = (x * 100) + "%";
  ball.style.top = (y * 100) + "%";

  socket.emit("ballMove", x, y);
}


socket.on("playerAssignment", (side) => {
  mySide = side;

  console.log("I am the " + mySide + " player.");
});


document.addEventListener("pointermove", (e) => {
  if (mySide === null) {
    return;
  }

  let x = e.clientX / window.innerWidth;
  let y = e.clientY / window.innerHeight;

  let radiusX = (leftCircle.offsetWidth / 2) / window.innerWidth;
  let radiusY = (leftCircle.offsetHeight / 2) / window.innerHeight;

  y = Math.max(radiusY, Math.min(1 - radiusY, y));

  if (mySide === "left") {
    x = Math.max(radiusX, Math.min(0.5 - radiusX, x));

    moveCircle(leftCircle, x, y);

    if (isColliding(leftCircle, ball)) {
      moveBall(0.05);
    }
  }

  if (mySide === "right") {
    x = Math.max(0.5 + radiusX, Math.min(1 - radiusX, x));

    moveCircle(rightCircle, x, y);

    if (isColliding(rightCircle, ball)) {
      moveBall(-0.05);
    }
  }

  socket.emit("playerMove", x, y);
});


socket.on("playerMove", (data) => {
  if (data.side === "left") {
    moveCircle(leftCircle, data.x, data.y);
  }

  if (data.side === "right") {
    moveCircle(rightCircle, data.x, data.y);
  }
});


socket.on("ballMove", (x, y) => {
  ball.style.left = (x * 100) + "%";
  ball.style.top = (y * 100) + "%";
});


socket.on("playerLeft", (side) => {
  console.log(side + " player disconnected.");
});


socket.on("gameFull", () => {
  console.log("The game already has two players.");
});

















// Version 1.00.00
// client side: 1. a moving circle of their own, 
//              2. moving circles of other clients'



// funcion: draw a circle after browser notices mouse moving (p5js prewritten mousemove event?)
// mouse = document.querySelector("#myCircle")
// mouse.addEventListener("mousemove", () => {console.log(mouseX, mouseY)})
// draw(background(255); circle(mouseX, mouseY, 200))

// create a client side socket object
// socket = io();

// add an event listener here: when mouseMove event (event created ourselves) happens, their mouse coordinates will be emiited as new data with this event to server(emitted via socket.io)
// socket.emit("mouseMove", mouseX, mouseY)

// receive (socket.on()) other clients' mouse coordinates'data and draw circles based on these data received
// socket.on("mouseMove" (mouseX, mouseY) => draw(background(255); circle(mouseX, mouseY, 200)))


// Version 2.00.00
// client side: 1.Users move their own mouse, a circle moves along with this user's mouse
//              2.Users can see other users' moving circles

// To achieve 1: Browser detects the mouse moving, get the mouse's coordinates, apply these coordinates to the circle CSS position

