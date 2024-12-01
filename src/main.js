// create the moving key
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_RIGHT = 39;
const KEY_LEFT = 37;
const KEY_SPACE = 32;

// create the game window size
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// create the game sound 
const shootSound = new Audio("sounds/shoot.wav");
const enemyDeathSound = new Audio("sounds/enemy-death.wav");

// store key parameter
const STATE = {
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
  time :80,
  lives: 3
};


// create a function to set the position of the element
function setPosition($element, x, y) {
  $element.style.transform = `translate(${x}px, ${y}px)`;
}

// create a function to set the size of the element
function setSize($element, width) {
  $element.style.width = `${width}px`;
  $element.style.height = "auto";
}

// make sure the object is in the game window
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

// Create the Enemy
function createEnemy($container, x, y) {
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

// the function of updating moving the enemy
function updateEnemies($container) {
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

// Create the Player
function createPlayer($container) {
  STATE.x_pos = GAME_WIDTH / 2;
  STATE.y_pos = GAME_HEIGHT - 50;
  const $player = document.createElement("img");
  $player.src = "img/Player.png";
  $player.className = "player";
  $container.appendChild($player);
  setPosition($player, STATE.x_pos, STATE.y_pos);
  setSize($player, STATE.spaceship_width);
}

// the function of updating moving the player
function updatePlayer() {
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

// Player Laser to shoot the bullet
function createLaser($container, x, y) {
  const $laser = document.createElement("img");
  $laser.src = "img/laser.png";
  $laser.className = "laser";
  $container.appendChild($laser);
  const laser = { x, y, $laser };
  STATE.lasers.push(laser);
  setPosition($laser, x, y);
}

// moving the lasers across the screen
function updateLaser($container) {
  const lasers = STATE.lasers;
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    laser.y -= 2;
    if (laser.y < 0) {
      deleteLaser(lasers, laser, laser.$laser);
    }
    setPosition(laser.$laser, laser.x, laser.y);
    const laser_rectangle = laser.$laser.getBoundingClientRect();
    const enemies = STATE.enemies;
    for (let j = 0; j < enemies.length; j++) {
      const enemy = enemies[j];
      const enemy_rectangle = enemy.$enemy.getBoundingClientRect();
      if (collideRect(enemy_rectangle, laser_rectangle)) {
        STATE.score += 10;
        deleteLaser(lasers, laser, laser.$laser);
        const index = enemies.indexOf(enemy);
        enemies.splice(index, 1);
        $container.removeChild(enemy.$enemy);
        enemyDeathSound.play();
      }
    }
  }
}

// Create Enemy Laser to shoot the bullet on the user
function createEnemyLaser($container, x, y) {
  const $enemyLaser = document.createElement("img");
  $enemyLaser.src = "img/enemyLaser.png";
  $enemyLaser.className = "enemyLaser";
  $container.appendChild($enemyLaser);
  const enemyLaser = { x, y, $enemyLaser };
  STATE.enemyLasers.push(enemyLaser);
  setPosition($enemyLaser, x, y);
}

// moving the enemy lasers across the screen
function updateEnemyLaser($container) {
  const enemyLasers = STATE.enemyLasers;
  for (let i = 0; i < enemyLasers.length; i++) {
    const enemyLaser = enemyLasers[i];
    enemyLaser.y += 2;
    if (enemyLaser.y > GAME_HEIGHT - 30) {
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
    }
    const enemyLaser_rectangle = enemyLaser.$enemyLaser.getBoundingClientRect();
    const spaceship_rectangle = document.querySelector(".player").getBoundingClientRect();
    if (collideRect(spaceship_rectangle, enemyLaser_rectangle) && STATE.lives==0) {
      STATE.gameOver = true;
    }else if (collideRect(spaceship_rectangle, enemyLaser_rectangle)) {
      STATE.lives -= 1;
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
    }
    setPosition(enemyLaser.$enemyLaser, enemyLaser.x + STATE.enemy_width / 2, enemyLaser.y + 15);
  }
}

// Delete Laser after it disappears from the screen
function deleteLaser(lasers, laser, $laser) {
  const index = lasers.indexOf(laser);
  lasers.splice(index, 1);
  $container.removeChild($laser);
}

// Key Presses
function KeyPress(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = true;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = true;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = true;
  }
}

// Key Releases
function KeyRelease(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = false;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = false;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = false;
  }
}

// Performance Monitoring
let lastTime = 0;

function monitorPerformance(timestamp) {
  const delta = timestamp - lastTime;

  // If the time difference is too short (less than the interval for 60 FPS), skip the frame
  if (delta < 1000 / 60) {
    window.requestAnimationFrame(monitorPerformance);
    return;
  }

  lastTime = timestamp;

  // Update the game logic
  update();

  // Continue requesting the next frame
  window.requestAnimationFrame(monitorPerformance);
}

function updateHUD() {
  document.getElementById("score").textContent = `Score: ${STATE.score}`;
  document.getElementById("timer").textContent = `Time: ${STATE.time}`;
  document.getElementById("lives").textContent = `Lives: ${STATE.lives}`;
}

// function for updating the time 
function startTimer() {
  const timerInterval = setInterval(() => {
    if (!STATE.paused && !STATE.gameOver) {
      STATE.time -= 1;
      if (STATE.time <= 0) {
        STATE.gameOver = true;
      }
      updateHUD();
    } else if (STATE.gameOver) {
    
    }
  }, 1000); // Decrease every 1 second
}


// Check if the game is over or teh player win 
function checkGameOver() {
  if (STATE.lives <= 0 || STATE.gameOver) {
    document.querySelector(".lose").style.display = "block";
    return true;
  }
  if (STATE.enemies.length === 0) {
    document.querySelector(".win").style.display = "block";
    return true;
  }
  return false;
}

// add pause funtion 
function togglePause() {
  const pauseMenu = document.getElementById("pauseMenu");
  if (STATE.paused) {
    pauseMenu.style.display = "none"; 
    STATE.paused = false;
    window.requestAnimationFrame(monitorPerformance); 
  } else {
    pauseMenu.style.display = "block"; 
    STATE.paused = true;
  }
}

// Bind 'P' Key to Toggle Pause
document.addEventListener("keydown", (event) => {
  if (event.key === "p" || event.key === "P") {
    togglePause();
  }
});

// Restart Game Function
function restartGame() {
  // Reset all game state
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
  STATE.time = 80;
  STATE.lives = 3;

  // Clear the game area
  const $container = document.querySelector(".main");
  $container.innerHTML = ""; 

  // Recreate player and enemies
  createPlayer($container);
  createEnemies($container);
  startTimer();
  updateHUD();
}

// Bind 'R' Key to Restart the Game
document.addEventListener("keydown", (event) => {
  if (event.key === "r" || event.key === "R") {
    restartGame();  
  }
});

// Main Update Function
function update() {
  if (STATE.paused || STATE.gameOver ) return;
  updatePlayer();
  updateEnemies($container);
  updateLaser($container);
  updateEnemyLaser($container);
  updateHUD();
  checkGameOver();
}

// Main animation loop to run at 60 FPS
window.requestAnimationFrame(monitorPerformance);

// create the enemies row
function createEnemies($container) {
  for (var i = 0; i <= STATE.number_of_enemies / 2; i++) {
    createEnemy($container, i * 80, 100);
  }
  for (var i = 0; i <= STATE.number_of_enemies / 2; i++) {
    createEnemy($container, i * 80, 180);
  }
}

// Initialize the Game
const $container = document.querySelector(".main");
createPlayer($container);
createEnemies($container);

startTimer();  

// Key Press Event Listener
window.addEventListener("keydown", KeyPress);
window.addEventListener("keyup", KeyRelease);

// Start the game loop
window.requestAnimationFrame(monitorPerformance);