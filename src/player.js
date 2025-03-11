import { GAME_WIDTH, GAME_HEIGHT, PLAYER_SPEED } from './constants.js';
import { createSprite, setPosition, playSound } from './utils.js';
import { createLaser } from './laser.js';

export function createPlayer(container) {
  return createSprite(container, 'player', 'Player.png', (GAME_WIDTH - 40) / 2, GAME_HEIGHT - 60, 40, 40);
}

export function updatePlayer(state, keys, container, dt) {
  const player = state.player;
  const direction = Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'));
  player.x = Math.max(0, Math.min(GAME_WIDTH - player.width, player.x + direction * PLAYER_SPEED * dt));
  state.cooldown = Math.max(0, state.cooldown - dt);
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  player.element.classList.toggle('invulnerable', state.invulnerable > 0);
  if (keys.has('Space') && state.cooldown <= 0) {
    createLaser(state, container, player.x + player.width / 2 - 3, player.y - 25, false);
    state.cooldown = 0.28;
    playSound('shoot');
  }
  setPosition(player);
}
