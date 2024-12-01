import { STATE, shootSound, enemyDeathSound } from './constants.js';
import { updatePlayer, createLaser } from './player.js';
import { updateEnemies, createEnemyLaser, updateEnemyLaser } from './enemies.js';
import { setPosition } from './utils.js';

// Game Logic
export function update() {
  if (STATE.paused || STATE.gameOver) return;
  updatePlayer();
  updateEnemies($container);
  updateLaser($container);
  updateEnemyLaser($container);
  updateHUD();
  checkGameOver();
}

// Pause function
export function togglePause() {
  const pauseMenu = document.getElementById("pauseMenu");
  if (STATE.paused) {
    pauseMenu.style.display = "none";
    STATE.paused = false;
    window.requestAnimationFrame(monitorPerformance);
  } else {
    pauseMenu.style.display = "block";
    STATE.paused = true;
  }
}

// Game Over Check
export function checkGameOver() {
  if (STATE.lives <= 0 || STATE.gameOver) {
    document.querySelector(".lose").style.display = "block";
    return true;
  }
  if (STATE.enemies.length === 0) {
    document.querySelector(".win").style.display = "block";
    return true;
  }
  return false;
}
