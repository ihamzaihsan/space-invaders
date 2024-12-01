// Key codes
export const KEY_UP = 38;
export const KEY_DOWN = 40;
export const KEY_RIGHT = 39;
export const KEY_LEFT = 37;
export const KEY_SPACE = 32;

// Game window size
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// Game sounds
export const shootSound = new Audio("sounds/shoot.wav");
export const enemyDeathSound = new Audio("sounds/enemy-death.wav");

// Game state
export const STATE = {
  x_pos: 0,
  y_pos: 0,
  move_right: false,
  move_left: false,
  shoot: false,
  lasers: [],
  enemyLasers: [],
  enemies: [],
  spaceship_width: 40,
  enemy_width: 50,
  cooldown: 0,
  number_of_enemies: 16,
  enemy_cooldown: 0,
  gameOver: false,
  paused: false,
  score: 0,
  time: 80,
  lives: 3
};
