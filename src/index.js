import { createPlayer } from './player.js';
import { update } from './game.js';
import { createEnemy } from './enemies.js';
import { STATE } from './constants.js';

// Initialize game
const $container = document.getElementById("game");
createPlayer($container);
for (let i = 0; i < STATE.number_of_enemies; i++) {
  createEnemy($container, Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT);
}

function startGame() {
  window.requestAnimationFrame(startGame);
  update();
}

window.requestAnimationFrame(startGame);
