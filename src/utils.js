function setPosition($element, x, y) {
  $element.style.transform = `translate(${x}px, ${y}px)`;
}

function setSize($element, width) {
  $element.style.width = `${width}px`;
  $element.style.height = "auto";
}

function bound(x) {
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

function collideRect(rect1, rect2) {
  return !(rect2.left > rect1.right ||
    rect2.right < rect1.left ||
    rect2.top > rect1.bottom ||
    rect2.bottom < rect1.top);
}

function deleteLaser(lasers, laser, $laser) {
  const index = lasers.indexOf(laser);
  lasers.splice(index, 1);
  $container.removeChild($laser);
}

function updateHUD() {
  document.getElementById("score").textContent = `Score: ${STATE.score}`;
  document.getElementById("timer").textContent = `Time: ${STATE.time}`;
  document.getElementById("lives").textContent = `Lives: ${STATE.lives}`;
}
