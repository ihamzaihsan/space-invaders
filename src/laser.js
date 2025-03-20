import { GAME_HEIGHT, LASER_SPEED, ENEMY_LASER_SPEED, POINTS_PER_ENEMY } from './constants.js';
import { createSprite, setPosition, overlaps, removeEntity, playSound } from './utils.js';

export function createLaser(state, container, x, y, hostile) {
  const laser = createSprite(container, hostile ? 'enemyLaser' : 'laser',
    hostile ? 'enemyLaser.png' : 'laser.png', x, y, 6, hostile ? 20 : 25);
  (hostile ? state.enemyLasers : state.lasers).push(laser);
}

export function updateLasers(state, dt, hostile) {
  const lasers = hostile ? state.enemyLasers : state.lasers;
  // Reverse iteration permits safe removal; each shot has at most one impact.
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    laser.y += (hostile ? ENEMY_LASER_SPEED : -LASER_SPEED) * dt;
    if (laser.y + laser.height < 0 || laser.y > GAME_HEIGHT) {
      removeEntity(lasers, i);
      continue;
    }
    const tileIndex = state.tiles.findIndex(tile => tile.solid && overlaps(laser, tile));
    if (tileIndex >= 0) {
      removeEntity(state.tiles, tileIndex);
      removeEntity(lasers, i);
      continue;
    }
    if (hostile && overlaps(laser, state.player)) {
      if (state.invulnerable <= 0) {
        state.lives = Math.max(0, state.lives - 1);
        state.invulnerable = 0.9;
      }
      removeEntity(lasers, i);
      continue;
    }
    if (!hostile) {
      const enemyIndex = state.enemies.findIndex(enemy => overlaps(laser, enemy));
      if (enemyIndex >= 0) {
        removeEntity(state.enemies, enemyIndex);
        removeEntity(lasers, i);
        state.score += POINTS_PER_ENEMY;
        playSound('hit');
        continue;
      }
    }
    setPosition(laser);
  }
}
