let lastTime = 0;

function monitorPerformance(timestamp) {
  const delta = timestamp - lastTime;

  if (delta < 1000 / 60) {
    window.requestAnimationFrame(monitorPerformance);
    return;
  }

  lastTime = timestamp;
  update();
  window.requestAnimationFrame(monitorPerformance);
}

function startTimer() {
  if (window.timerInterval) {
    clearInterval(window.timerInterval);
  }

  window.timerInterval = setInterval(() => {
    if (!STATE.paused && !STATE.gameOver) {
      STATE.time = Math.max(0, STATE.time - 1);
      if (STATE.time <= 0) {
        STATE.gameOver = true;
        checkGameOver();
        clearInterval(window.timerInterval);
      }
      document.getElementById("timer").textContent = `Time: ${STATE.time}`;
    } else if (STATE.gameOver) {
      clearInterval(window.timerInterval);
      checkGameOver();
    }
  }, 1000);
}

function checkGameOver() {
  const mainElement = document.querySelector(".main");
  if (STATE.lives <= 0 || STATE.gameOver || STATE.time <= 0) {
    document.querySelector(".lose").style.display = "block";
    mainElement.classList.add("stopped");
    STATE.gameOver = true;
    return true;
  }
  if (STATE.enemies.length === 0) {
    document.querySelector(".win").style.display = "block";
    mainElement.classList.add("stopped");
    STATE.gameOver = true;
    return true;
  }
  return false;
}

function togglePause() {
  const pauseMenu = document.getElementById("pauseMenu");
  const mainElement = document.querySelector(".main");
  if (STATE.paused) {
    pauseMenu.style.display = "none";
    STATE.paused = false;
    mainElement.classList.remove("stopped");
    window.requestAnimationFrame(monitorPerformance);
  } else {
    pauseMenu.style.display = "block";
    STATE.paused = true;
    mainElement.classList.add("stopped");
  }
}

function restartGame() {
  if (window.timerInterval) {
    clearInterval(window.timerInterval);
  }

  const mainElement = document.querySelector(".main");
  STATE.x_pos = GAME_WIDTH / 2;
  STATE.y_pos = GAME_HEIGHT - 50;
  STATE.move_right = false;
  STATE.move_left = false;
  STATE.shoot = false;
  STATE.lasers = [];
  STATE.enemyLasers = [];
  STATE.enemies = [];
  STATE.cooldown = 0;
  STATE.enemy_cooldown = 0;
  STATE.gameOver = false;
  STATE.paused = false;
  STATE.score = 0;
  STATE.time = 45;
  STATE.lives = 3;

  mainElement.classList.remove("stopped");
  document.getElementById("pauseMenu").style.display = "none";
  document.querySelector(".lose").style.display = "none";
  document.querySelector(".win").style.display = "none";

  const $container = document.querySelector(".main");
  $container.innerHTML = "";

  createPlayer($container);
  createEnemies($container);
  startTimer();
  updateHUD();
}

function update() {
  if (STATE.paused || STATE.gameOver) return;
  updatePlayer();
  updateEnemies($container);
  updateLaser($container);
  updateEnemyLaser($container);
  updateHUD();
  checkGameOver();
}

// Initialize zoom control
document.body.style.zoom = "100%";

// Prevent zoom controls
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

// Initialize the Game
const $container = document.querySelector(".main");
createPlayer($container);
createEnemies($container);
startTimer();

// Start the game loop
window.requestAnimationFrame(monitorPerformance);
