'use strict';

const socketIO = require('socket.io');
const express = require('express');
const path = require('path');

const app = module.exports.app = express();
const port = process.env.PORT || 3000;
let ballPos = { x: 0.1, y: 0.5 };
let velocity = { x:0.01, y:0.01 }


setInterval(draw, 100)

function draw() {
  ballPos.x = ballPos.x + velocity.x;
  ballPos.y = ballPos.y + velocity.y;
  if (ballPos.y > 1 || ballPos.y < 0) {velocity.y = velocity.y * -1}
  if (ballPos.x > 1 || ballPos.x < 0) {velocity.x = velocity.x * -1}
  
  io.emit('ballPosition', ballPos)
  console.log('im drawing')
  
}

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});


app.use(express.static(path.join(__dirname, 'public')));


const server = app.listen(port, () => {
  console.log("Listening on port: " + port);
});


const io = socketIO(server);


let leftPlayer = null;
let rightPlayer = null;


io.on("connection", (socket) => {
  console.log("Client connected:");
  console.log(socket.id);
  io.to(socket.id).emit("ballMove", ballPos.x, ballPos.y);


  let side;


  if (leftPlayer === null) {
    leftPlayer = socket.id;
    side = "left";

    console.log("Assigned LEFT to: " + socket.id);
  }

  else if (rightPlayer === null) {
    rightPlayer = socket.id;
    side = "right";

    console.log("Assigned RIGHT to: " + socket.id);
  }

  else {
    console.log("Game full: " + socket.id);

    socket.emit("gameFull");
    return;
  }


  socket.emit("playerAssignment", side);

  socket.on("collided", (data) => {
    velocity.x = velocity.x * -1;
    velocity.y = velocity.y * -1;
    console.log('isColliding')
  })

  socket.on("playerMove", (x, y) => {
    y = Math.max(0, Math.min(1, y));

    if (side === "left") {
      x = Math.max(0, Math.min(0.5, x));
    }

    if (side === "right") {
      x = Math.max(0.5, Math.min(1, x));
    }

    socket.broadcast.emit("playerMove", {
      side: side,
      x: x,
      y: y
    });
  });


  socket.on("ballMove", (x, y) => {
    socket.broadcast.emit("ballMove", x, y);
  });


  socket.on("disconnect", () => {
    console.log("Client disconnected:");
    console.log(socket.id);

    if (socket.id === leftPlayer) {
      leftPlayer = null;
    }

    if (socket.id === rightPlayer) {
      rightPlayer = null;
    }

    socket.broadcast.emit("playerLeft", side);
  });
});