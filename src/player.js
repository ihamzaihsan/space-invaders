import { STATE, shootSound } from './constants.js';
import { setPosition, setSize } from './utils.js';

// Create player
export function createPlayer($container) {
  STATE.x_pos = GAME_WIDTH / 2;
  STATE.y_pos = GAME_HEIGHT - 50;
  const $player = document.createElement("img");
  $player.src = "img/Player.png";
  $player.className = "player";
  $container.appendChild($player);
  setPosition($player, STATE.x_pos, STATE.y_pos);
  setSize($player, STATE.spaceship_width);
}

// Update player position
export function updatePlayer() {
  if (STATE.move_left) {
    STATE.x_pos -= 3;
  } if (STATE.move_right) {
    STATE.x_pos += 3;
  } if (STATE.shoot && STATE.cooldown == 0) {
    createLaser($container, STATE.x_pos - STATE.spaceship_width / 2, STATE.y_pos);
    STATE.cooldown = 30;
    shootSound.play();
  }
  const $player = document.querySelector(".player");
  setPosition($player, bound(STATE.x_pos), STATE.y_pos - 10);
  if (STATE.cooldown > 0) {
    STATE.cooldown -= 0.5;
  }
}

// Create laser shot by the player
export function createLaser($container, x, y) {
  const $laser = document.createElement("img");
  $laser.src = "img/laser.png";
  $laser.className = "laser";
  $container.appendChild($laser);
  const laser = { x, y, $laser };
  STATE.lasers.push(laser);
  setPosition($laser, x, y);
}
