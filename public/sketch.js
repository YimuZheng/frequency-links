let socket = io();

//target slider
// let slider = document.querySelector('#rotationSlider')

//listen for slider input and do something with the input
// slider.addEventListener("input", function (e) {
//   socket.emit("rotation", this.value);
// });

// socket.on('rotationResponse', (data) => {
//     //transform = "rotate(90deg)"
//     document.querySelector("#square").style.transform = `rotate(${data}deg)`
//     console.log(("someone changed the rotation to " + data));
// });

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

let myCircle = document.querySelector("#myCircle");
let otherCircle = document.querySelector("#otherCircle");


document.addEventListener("mousemove", (e) => {
  myCircle.style.left = e.clientX + "px";
  myCircle.style.top = e.clientY + "px";

  socket.emit("mouseMove", e.clientX, e.clientY)
})
// To achieve 2: receive other clients' changing mouse coordinates from the server, draw circle based on these coordinates
socket.on("mouseMove", (x, y) => {
  otherCircle.style.left = x + "px";
  otherCircle.style.top = y + "px";
})




















// let socket = io();
// let playing = false;


// //
// let slider = document.querySelector('#rotationSlider')



// slider.addEventListener ("input", function (e) {
//     console.log(this.value);
//     socket.emit("rotation", this.value);
// });


// // function preload() {
// //     img = loadImage('holdinghands.png');
// // }

// // function sendFreq(){
// //     const data = [nameField.value(), freqInput.value()]
// //     socket.emit("frequency", data);
// //     console.log(data);
// // }

// socket.on('freqResponse', (data) => {
//     console.log(data);
//     freqState.html(data[0] + " changed the frequency to " + data[1]);
//     oscillator.freq(data[1], 0.250);
// });

//log new users as they come into the room
// socket.on('rrotationResponse', (data) => {
//     console.log(data);
//     freqState.html(data + " joined the room");
// });

// socket.on('trigger', (data) => {
//     console.log(data[0]);
//     console.log(data[1]); 
// });

// function submit() {
//     socket.emit("name", nameField.value());
//     freqState.html('idle...');
//     oscillator.start();
//     playing = true;
// }

// async function setup() {
//     cnv = createCanvas(400, 400);
//     cnv.parent('main');
//     background(255, 255, 255, 0);
//     imageMode(CENTER);
//     image(img, width / 2, height / 2, 400, 400);
//     noStroke();
//     //create name field and button
//     //create instruction text
//     // instruction = createP('enter your handle to begin');
//     // instruction.id('instruction');
//     // instruction.parent('main');
//     // instruction.position(10, 170);
//     // nameField = createInput();
//     // nameField.id('name');
//     // nameField.attribute('placeholder', 'enter your handle');
//     // nameField.position(10, 10);
//     // submitButton = createButton('submit');
//     // submitButton.id('submit');
//     // submitButton.position(nameField.x + nameField.width + 10, 10);
//     // submitButton.mousePressed(submit);

//     //create inputStuff section
//     inputStuff = createDiv();
//     inputStuff.id('inputStuff');
//     inputStuff.parent('main');
//     inputStuff.position(10, 250);
//     //create frequency input and button
//     freqInput = createInput();
//     freqInput.id('frequency');
//     freqInput.attribute('placeholder', 'enter a frequency');
//     freqInput.position(10, 50);
//     sendButton = createButton('send');
//     sendButton.id('send');
//     sendButton.position(freqInput.x + freqInput.width + 10, 50);
//     sendButton.mousePressed(sendFreq);
//     //create play button
//     buttonEl = createButton('stop');
//     buttonEl.mousePressed(play);
//     buttonEl.id('buttonText');
//     buttonEl.position(10, 90);
//     //create frequency state text
//     freqState = createP('idle...');
//     freqState.class('freqState');
//     freqState.style('width', '400px');
//     freqState.position(10, 120);

//     //create name stuff section
//     nameStuff = createDiv();
//     nameStuff.id('nameStuff');
//     nameStuff.parent('main');
//     nameStuff.position(10, 210);
//     nameStuff.child(nameField);
//     nameStuff.child(submitButton);
//     //create input stuff section
//     inputStuff.child(buttonEl);
//     inputStuff.child(freqState);
//     inputStuff.child(freqInput);
//     inputStuff.child(sendButton);
//     //create title
//     title = createElement('h1', 'frequency links');
//     title.parent('main');
//     title.position(10, -10);
//     title.class('title');
//     //create subtitle
//     subtitle = createElement('p', 'a multi-person audio work');
//     subtitle.parent('main');
//     subtitle.position(10, 25);
//     subtitle.class('subtitle');
//     //attribution
//     attribution = createElement('p', 'by Tommy (2023)');
//     attribution.parent('main');
//     attribution.position(10, 35);
//     attribution.class('attribution');
//     //create a p5 sound oscillator
//     oscillator = new p5.Oscillator(440, "square");
//     oscillator.amp(0.33);
//     del = new p5.Delay(0.210, 0.66);
//     oscillator.disconnect();
//     oscillator.connect(del);
// }

// function play() {
//     if (!playing) {
//         oscillator.start();
//         playing = true;
//         buttonEl.html('stop');
//     } else {
//         oscillator.stop();
//         playing = false;
//         buttonEl.html('play');
//     }
// }
