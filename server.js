// 'use strict';

// const socketIO = require('socket.io');
// const express = require('express');
// const path = require('path');
// const app = module.exports.app = express();
// const port = process.env.PORT || 3000;

// app.get('/', function(req, res) {
//   res.sendFile(path.join(__dirname, '/index.html'));
// });

// app.use(express.static(path.join(__dirname, 'public')));

// const server = app.listen(port, () => {
//   console.log("Listening on port: " + port);
// });

// const io = socketIO(server);

// io.on('connection', (socket) => {
//   console.log('Client connected');
//   console.log(socket.id);
  
//   //receives the frequency emitter from Client
//   socket.on("rotation", (arg) => {
//     console.log(arg); 
//     io.emit('freqResponse', arg);
//   });

//   //receives the name emitter from Client
//   socket.on("name", (arg) => {
//     //console.log(arg);
//     io.emit('response', arg);
//   });

//   socket.on('disconnect', () => console.log('Client disconnected'));
// });

'use strict';

const socketIO = require('socket.io');
const express = require('express');
const path = require('path');
const app = module.exports.app = express();
const port = process.env.PORT || 3000;

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(port, () => {
  console.log("Listening on port: " + port);
});

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  console.log(socket.id);
  
  //receives the rotation emitter from Client
  // socket.on("rotation", (arg) => {
  //   console.log(arg); 
  //   io.emit('rotationResponse', arg);
  // });

  socket.on('disconnect', () => console.log('Client disconnected'));
});

// Version 1.00.00
// express: when clients request, send them html, css, js(sketch.js) (listener to port:3000)
// no idea what the code is...

//socket.io: whole server as a socket object listening to new clients coming in(outter: io.on("connections", (socket) => {} ), receiving clients' new movements (inner: socket.on()) and send (socket.broadcast.emit()) the changes to other clients
// io.on("connections", (socket) => {
//   socket.on("mouseMove", mouseX, mouseY);
//   socket.broadcast.emit("mouseMove", mouseX, mouseY);
// })

// Version 2.00.00
// Listen to new client coming in (connection), receive their new data about their mouse coordinates, broadcast these new data to other clients

io.on("connection", (socket) => {
  socket.on("mouseMove", (x, y) => {
    socket.broadcast.emit("mouseMove", x, y);
  });
});