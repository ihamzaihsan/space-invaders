import { GAME_WIDTH, STATE } from './constants.js';

// Set position of the element
export function setPosition($element, x, y) {
  $element.style.transform = `translate(${x}px, ${y}px)`;
}

// Set size of the element
export function setSize($element, width) {
  $element.style.width = `${width}px`;
  $element.style.height = "auto";
}

// Ensure the object is within game bounds
export function bound(x) {
  if (x >= GAME_WIDTH - STATE.spaceship_width) {
    STATE.x_pos = GAME_WIDTH - STATE.spaceship_width;
    return GAME_WIDTH - STATE.spaceship_width;
  } if (x <= 0) {
    STATE.x_pos = 0;
    return 0;
  } else {
    return x;
  }
}

// Check collision between two rectangles
export function collideRect(rect1, rect2) {
  return !(rect2.left > rect1.right ||
    rect2.right < rect1.left ||
    rect2.top > rect1.bottom ||
    rect2.bottom < rect1.top);
}
