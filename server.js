'use strict';

const socketIO = require('socket.io');
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(port, () => {
  console.log('Listening on port: ' + port);
});

const io = socketIO(server);


// Game settings
const TICK_RATE = 1000 / 60;
const WINNING_SCORE = 5;
const GOAL_HEIGHT_RATIO = 0.48;
const MAX_PLAYER_SPEED = 1800;
const MAX_PUCK_SPEED = 900;

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;


// Utility functions
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getStrikerDiameter(width, height) {
  return clamp(Math.min(width, height) * 0.11, 76, 112);
}

function getPuckDiameter(width, height) {
  return clamp(Math.min(width, height) * 0.03, 22, 30);
}

function createPlayer(side) {
  return {
    id: null,
    ready: false,
    name: '',
    x: side === 'left' ? 0.25 : 0.75,
    y: 0.5,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    hasViewport: false,
    vx: 0,
    vy: 0,
    lastInputAt: 0
  };
}


// Shared game state
const players = {
  left: createPlayer('left'),
  right: createPlayer('right')
};

const ballPos = { x: 0.5, y: 0.5 };
const velocity = { x: 0, y: 0 };

let scores = { left: 0, right: 0 };
let phase = 'waiting';
let winner = null;

let hitCount = 0;
let goalCount = 0;
let lastHitSide = null;
let lastGoalSide = null;
let lastScorerSide = null;

let goalResumeAt = 0;
let nextServeSide = 'right';


// Determine which viewport sizes are currently in use.
function getActiveViewports() {
  const viewports = Object.values(players)
    .filter(player => player.id && player.hasViewport)
    .map(player => ({
      width: player.width,
      height: player.height
    }));

  return viewports.length
    ? viewports
    : [{ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }];
}


// Keep the puck inside the physical screen boundaries.
function getBallBounds() {
  const viewports = getActiveViewports();

  const xInsets = viewports.map(({ width, height }) =>
    (getPuckDiameter(width, height) / 2) / width
  );

  const yInsets = viewports.map(({ width, height }) =>
    (getPuckDiameter(width, height) / 2) / height
  );

  const insetX = Math.max(...xInsets);
  const insetY = Math.max(...yInsets);

  return {
    minX: insetX,
    maxX: 1 - insetX,
    minY: insetY,
    maxY: 1 - insetY
  };
}


// The goal opening matches the CSS goal height.
function getGoalBounds() {
  const viewports = getActiveViewports();

  const puckInsets = viewports.map(({ width, height }) =>
    (getPuckDiameter(width, height) / 2) / height
  );

  const insetY = Math.max(...puckInsets);
  const halfGoal = GOAL_HEIGHT_RATIO / 2;

  return {
    minY: 0.5 - halfGoal + insetY,
    maxY: 0.5 + halfGoal - insetY
  };
}


// A single authoritative game state is sent to both clients.
function getGameState() {
  return {
    phase: phase,
    winner: winner,
    scores: { ...scores },

    ball: {
      x: ballPos.x,
      y: ballPos.y,
      hitCount: hitCount,
      goalCount: goalCount,
      lastHitSide: lastHitSide,
      lastGoalSide: lastGoalSide,
      lastScorerSide: lastScorerSide
    },

    players: {
      left: {
        x: players.left.x,
        y: players.left.y,
        name: players.left.name,
        connected: Boolean(players.left.id)
      },

      right: {
        x: players.right.x,
        y: players.right.y,
        name: players.right.name,
        connected: Boolean(players.right.id)
      }
    }
  };
}


// Serve the puck toward a selected side.
function serveToward(side) {
  velocity.x = side === 'left' ? -0.32 : 0.32;

  const verticalDirection = Math.random() < 0.5 ? -1 : 1;
  velocity.y = verticalDirection * (0.06 + Math.random() * 0.12);
}


// Start a new match or rematch.
function startMatch() {
  scores = { left: 0, right: 0 };
  winner = null;

  hitCount = 0;
  goalCount = 0;
  lastHitSide = null;
  lastGoalSide = null;
  lastScorerSide = null;

  ballPos.x = 0.5;
  ballPos.y = 0.5;

  goalResumeAt = 0;
  phase = 'playing';

  for (const player of Object.values(players)) {
    player.ready = false;
    player.vx = 0;
    player.vy = 0;
  }

  serveToward(Math.random() < 0.5 ? 'left' : 'right');

  console.log('Match started.');
}


// Reset the match when a player disconnects.
function resetToWaiting() {
  phase = 'waiting';
  winner = null;
  scores = { left: 0, right: 0 };

  ballPos.x = 0.5;
  ballPos.y = 0.5;
  velocity.x = 0;
  velocity.y = 0;

  hitCount = 0;
  goalCount = 0;
  lastHitSide = null;
  lastGoalSide = null;
  lastScorerSide = null;
  goalResumeAt = 0;

  for (const player of Object.values(players)) {
    player.ready = false;
    player.vx = 0;
    player.vy = 0;
    player.lastInputAt = 0;
  }
}


// Score when the puck enters a goal.
function scoreGoal(goalSide, now) {
  const scorerSide = goalSide === 'left' ? 'right' : 'left';

  scores[scorerSide] += 1;
  goalCount += 1;

  lastGoalSide = goalSide;
  lastScorerSide = scorerSide;

  ballPos.x = 0.5;
  ballPos.y = 0.5;
  velocity.x = 0;
  velocity.y = 0;

  console.log(scorerSide + ' scored: ' + scores[scorerSide]);

  if (scores[scorerSide] >= WINNING_SCORE) {
    winner = scorerSide;
    phase = 'finished';
    goalResumeAt = 0;
  } else {
    phase = 'goalPause';
    goalResumeAt = now + 850;

    // Serve toward the side that conceded the goal.
    nextServeSide = goalSide;
  }
}


// Detect and resolve a circular collision.
// Returns true when a collision changes the puck's velocity.
function resolveCollision(side) {
  const player = players[side];

  if (!player.id || !player.hasViewport) {
    return false;
  }

  const width = player.width;
  const height = player.height;

  // Center-to-center displacement in viewport pixels.
  const dx = (ballPos.x - player.x) * width;
  const dy = (ballPos.y - player.y) * height;

  const distance = Math.hypot(dx, dy);

  const playerRadius = getStrikerDiameter(width, height) / 2;
  const puckRadius = getPuckDiameter(width, height) / 2;
  const minDistance = playerRadius + puckRadius;

  if (distance > minDistance) {
    return false;
  }

  // Collision normal: from striker center toward puck center.
  let nx;
  let ny;

  if (distance < 0.001) {
    nx = side === 'left' ? 1 : -1;
    ny = 0;
  } else {
    nx = dx / distance;
    ny = dy / distance;
  }

  // Separate overlapping circles so they do not remain stuck.
  const penetration = minDistance - distance;
  const separation = penetration + 0.5;

  ballPos.x += nx * separation / width;
  ballPos.y += ny * separation / height;

  // Express both velocities in pixels per second.
  const puckVX = velocity.x * width;
  const puckVY = velocity.y * height;

  const relativeVX = puckVX - player.vx;
  const relativeVY = puckVY - player.vy;

  const normalVelocity = relativeVX * nx + relativeVY * ny;

  // The circles were separated above, but an already-separating puck should
  // not reflect again. Returning false also allows the other striker to be
  // checked during this tick.
  if (normalVelocity >= 0) {
    return false;
  }

  // Reflect relative velocity across the collision normal.
  let newVX = relativeVX - 2 * normalVelocity * nx + player.vx;
  let newVY = relativeVY - 2 * normalVelocity * ny + player.vy;

  // Limit extreme speeds from fast pointer movements.
  const speed = Math.hypot(newVX, newVY);

  if (speed > MAX_PUCK_SPEED) {
    const scale = MAX_PUCK_SPEED / speed;
    newVX *= scale;
    newVY *= scale;
  }

  // Convert back to normalized velocity.
  velocity.x = newVX / width;
  velocity.y = newVY / height;

  hitCount += 1;
  lastHitSide = side;

  console.log('Puck hit by ' + side + ' player.');

  return true;
}


// Client connections and events.
io.on('connection', (socket) => {
  console.log('Client connected: ' + socket.id);

  let side;

  if (players.left.id === null) {
    side = 'left';
  } else if (players.right.id === null) {
    side = 'right';
  } else {
    socket.emit('gameFull');
    return;
  }

  players[side] = createPlayer(side);
  players[side].id = socket.id;

  console.log('Assigned ' + side + ': ' + socket.id);

  socket.emit('playerAssignment', side);
  socket.emit('gameState', getGameState());


  // Receive the player's name and ready signal.
  socket.on('readyToPlay', (data = {}) => {
    const player = players[side];

    if (!player || player.id !== socket.id) {
      return;
    }

    if (phase === 'playing' || phase === 'goalPause') {
      return;
    }

    const submittedName = typeof data.name === 'string' ? data.name : '';

    const cleanedName = submittedName
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 16);

    player.name = cleanedName || (side === 'left' ? 'Player 1' : 'Player 2');
    player.ready = true;

    if (
      players.left.id &&
      players.right.id &&
      players.left.ready &&
      players.right.ready
    ) {
      startMatch();
    }

    io.emit('gameState', getGameState());
  });


  // Receive a player's normalized position.
  socket.on('playerMove', (data) => {
    const player = players[side];

    if (!player || player.id !== socket.id || !data) {
      return;
    }

    const rawX = Number(data.x);
    const rawY = Number(data.y);
    const rawWidth = Number(data.width);
    const rawHeight = Number(data.height);

    if (
      !Number.isFinite(rawX) ||
      !Number.isFinite(rawY) ||
      !Number.isFinite(rawWidth) ||
      !Number.isFinite(rawHeight) ||
      rawWidth < 100 ||
      rawHeight < 100
    ) {
      return;
    }

    const width = clamp(rawWidth, 100, 10000);
    const height = clamp(rawHeight, 100, 10000);

    const radiusX = (getStrikerDiameter(width, height) / 2) / width;
    const radiusY = (getStrikerDiameter(width, height) / 2) / height;

    const minX = side === 'left' ? radiusX : 0.5 + radiusX;
    const maxX = side === 'left' ? 0.5 - radiusX : 1 - radiusX;

    const x = clamp(rawX, minX, maxX);
    const y = clamp(rawY, radiusY, 1 - radiusY);

    const now = Date.now();

    // Estimate striker velocity from recent pointer positions.
    if (player.hasViewport && player.lastInputAt > 0) {
      const elapsed = clamp((now - player.lastInputAt) / 1000, 1 / 240, 0.1);

      player.vx = clamp(
        (x - player.x) * width / elapsed,
        -MAX_PLAYER_SPEED,
        MAX_PLAYER_SPEED
      );

      player.vy = clamp(
        (y - player.y) * height / elapsed,
        -MAX_PLAYER_SPEED,
        MAX_PLAYER_SPEED
      );
    } else {
      player.vx = 0;
      player.vy = 0;
    }

    player.x = x;
    player.y = y;
    player.width = width;
    player.height = height;
    player.hasViewport = true;
    player.lastInputAt = now;
  });


  socket.on('disconnect', () => {
    console.log('Client disconnected: ' + socket.id);

    if (side && players[side].id === socket.id) {
      players[side] = createPlayer(side);

      resetToWaiting();

      io.emit('playerLeft', side);
      io.emit('gameState', getGameState());
    }
  });
});


// Authoritative game loop.
let previousTick = Date.now();

setInterval(() => {
  const now = Date.now();
  const dt = Math.min((now - previousTick) / 1000, 0.05);
  previousTick = now;

  if (phase === 'playing') {
    // Stop treating a stationary striker as moving.
    for (const player of Object.values(players)) {
      if (!player.lastInputAt || now - player.lastInputAt > 120) {
        player.vx = 0;
        player.vy = 0;
      }
    }

    ballPos.x += velocity.x * dt;
    ballPos.y += velocity.y * dt;

    const bounds = getBallBounds();
    const goalBounds = getGoalBounds();

    // Top and bottom edges always bounce.
    if (ballPos.y <= bounds.minY) {
      ballPos.y = bounds.minY;
      velocity.y = Math.abs(velocity.y);
    } else if (ballPos.y >= bounds.maxY) {
      ballPos.y = bounds.maxY;
      velocity.y = -Math.abs(velocity.y);
    }

    let goalScored = false;

    // Left goal.
    if (ballPos.x <= bounds.minX) {
      if (ballPos.y >= goalBounds.minY && ballPos.y <= goalBounds.maxY) {
        scoreGoal('left', now);
        goalScored = true;
      } else {
        ballPos.x = bounds.minX;
        velocity.x = Math.abs(velocity.x);
      }
    }

    // Right goal.
    if (!goalScored && ballPos.x >= bounds.maxX) {
      if (ballPos.y >= goalBounds.minY && ballPos.y <= goalBounds.maxY) {
        scoreGoal('right', now);
        goalScored = true;
      } else {
        ballPos.x = bounds.maxX;
        velocity.x = -Math.abs(velocity.x);
      }
    }

    if (!goalScored && phase === 'playing') {
      const hitLeft = resolveCollision('left');

      if (!hitLeft) {
        resolveCollision('right');
      }
    }
  } else if (phase === 'goalPause' && now >= goalResumeAt) {
    phase = 'playing';
    goalResumeAt = 0;
    serveToward(nextServeSide);
  }

  io.emit('gameState', getGameState());
}, TICK_RATE);
