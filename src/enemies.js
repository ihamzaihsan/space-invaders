import { STATE, enemyDeathSound } from './constants.js';
import { setPosition, setSize } from './utils.js';

// Create an enemy
export function createEnemy($container, x, y) {
  const $enemy = document.createElement("img");
  $enemy.src = "img/enemy.png";
  $enemy.className = "enemy";
  $container.appendChild($enemy);
  const enemy_cooldown = Math.floor(Math.random() * 100);
  const enemy = { x, y, $enemy, enemy_cooldown };
  STATE.enemies.push(enemy);
  setSize($enemy, STATE.enemy_width);
  setPosition($enemy, x, y);
}

// Update the enemies' positions and shoot lasers
export function updateEnemies($container) {
  const dx = Math.cos(Date.now() / 1000) * 40;
  const dy = Math.cos(Date.now() / 1000) * 30;
  const enemies = STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    var a = enemy.x + dx;
    var b = enemy.y + dy;
    setPosition(enemy.$enemy, a, b);
    enemy.cooldown = Math.random(0, 100);
    if (enemy.enemy_cooldown == 0) {
      createEnemyLaser($container, a, b);
      enemy.enemy_cooldown = Math.floor(Math.random() * 50) + 100;
    }
    enemy.enemy_cooldown -= 0.5;
  }
}

// Create enemy laser
export function createEnemyLaser($container, x, y) {
  const $enemyLaser = document.createElement("img");
  $enemyLaser.src = "img/enemyLaser.png";
  $enemyLaser.className = "enemyLaser";
  $container.appendChild($enemyLaser);
  const enemyLaser = { x, y, $enemyLaser };
  STATE.enemyLasers.push(enemyLaser);
  setPosition($enemyLaser, x, y);
}

// Update enemy lasers
export function updateEnemyLaser($container) {
  const enemyLasers = STATE.enemyLasers;
  for (let i = 0; i < enemyLasers.length; i++) {
    const enemyLaser = enemyLasers[i];
    enemyLaser.y += 2;
    if (enemyLaser.y > GAME_HEIGHT - 30) {
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
    }
    const enemyLaser_rectangle = enemyLaser.$enemyLaser.getBoundingClientRect();
    const spaceship_rectangle = document.querySelector(".player").getBoundingClientRect();
    if (collideRect(spaceship_rectangle, enemyLaser_rectangle) && STATE.lives <= 0 ) {
      STATE.gameOver = true;
    }else if (collideRect(spaceship_rectangle, enemyLaser_rectangle)) {
      STATE.lives -= 1;
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
    }
    setPosition(enemyLaser.$enemyLaser, enemyLaser.x + STATE.enemy_width / 2, enemyLaser.y + 15);
  }
}
