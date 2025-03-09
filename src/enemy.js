import { GAME_WIDTH, ENEMY_SPEED } from './constants.js';
import { createSprite, setPosition, overlaps } from './utils.js';
import { createLaser } from './laser.js';

export function createEnemies(container) {
  const enemies = [];
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 9; column++) {
      const enemy = createSprite(container, 'enemy', 'enemy.png', 40 + column * 80, 30 + row * 60, 50, 40);
      enemy.cooldown = 0.8 + Math.random() * 3.2;
      enemies.push(enemy);
    }
  }
  return enemies;
}

export function updateEnemies(state, container, dt) {
  if (!state.enemies.length) return false;
  const left = Math.min(...state.enemies.map(enemy => enemy.x));
  const right = Math.max(...state.enemies.map(enemy => enemy.x + enemy.width));
  let movement = ENEMY_SPEED * dt * state.enemyDirection;
  let drop = 0;
  if ((state.enemyDirection > 0 && right + movement >= GAME_WIDTH) ||
      (state.enemyDirection < 0 && left + movement <= 0)) {
    movement = state.enemyDirection > 0 ? GAME_WIDTH - right : -left;
    state.enemyDirection *= -1;
    drop = 20;
  }
  let invaded = false;
  for (const enemy of state.enemies) {
    enemy.x += movement;
    enemy.y += drop;
    enemy.cooldown -= dt;
    if (enemy.cooldown <= 0) {
      createLaser(state, container, enemy.x + enemy.width / 2 - 3, enemy.y + enemy.height, true);
      enemy.cooldown = 3 + Math.random() * 3;
    }
    if (enemy.y + enemy.height >= state.player.y || overlaps(enemy, state.player)) invaded = true;
    setPosition(enemy);
  }
  return invaded;
}
