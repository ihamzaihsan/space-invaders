function KeyPress(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = true;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = true;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = true;
  }
}

function KeyRelease(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = false;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = false;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = false;
  }
}

// Event Listeners
window.addEventListener("keydown", KeyPress);
window.addEventListener("keyup", KeyRelease);

document.addEventListener("keydown", (event) => {
  if (event.key === "p" || event.key === "P") {
    togglePause();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "r" || event.key === "R") {
    restartGame();
  }
});

document.addEventListener("keydown", function(e) {
  if (e.ctrlKey && (e.key === "+" || e.key === "-" || e.key === "=")) {
    e.preventDefault();
  }
});

document.addEventListener('wheel', function(e) {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, {passive: false});
