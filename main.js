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
const shootSound = new Audio("static/sounds/shoot.wav");
const enemyDeathSound = new Audio("static/sounds/enemy-death.wav");

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
  time :45,
  lives: 3,
  enemyDirection: 1,  
  dropEnemies: false,
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
  $enemy.src = "static/img/enemy.png";
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
  const ENEMY_SPEED = 1;
  const ENEMY_DROP = 20;
  const PLAYER_Y_POSITION = GAME_HEIGHT - 90; 

  // Get the leftmost and rightmost enemy positions
  let leftMostX = GAME_WIDTH;
  let rightMostX = 0;

  STATE.enemies.forEach(enemy => {
    leftMostX = Math.min(leftMostX, enemy.x);
    rightMostX = Math.max(rightMostX, enemy.x);
  });

  // Check if enemies hit the boundaries
  if (rightMostX + STATE.enemy_width >= GAME_WIDTH-40) {
    STATE.enemyDirection = -1;
    STATE.dropEnemies = true;
  } else if (leftMostX <= 0) {
    STATE.enemyDirection = 1;
    STATE.dropEnemies = true;
  }

  // Update each enemy position
  STATE.enemies.forEach(enemy => {
    if (STATE.dropEnemies) {
      enemy.y += ENEMY_DROP;
    }
    enemy.x += ENEMY_SPEED * (STATE.enemyDirection || 1);

    // Check if enemy reaches player's line
    if (enemy.y >= PLAYER_Y_POSITION) {
      STATE.gameOver = true;
      STATE.lives = 0;
      return;
    }

    // Update enemy position
    setPosition(enemy.$enemy, enemy.x, enemy.y);

    // Handle enemy shooting
    if (enemy.enemy_cooldown <= 0) {
      createEnemyLaser($container, enemy.x, enemy.y);
      enemy.enemy_cooldown = Math.floor(Math.random() * 50) + 100;
    }
    enemy.enemy_cooldown -= 0.5;
  });

  const $player = document.querySelector(".player");
  const player_rectangle = $player.getBoundingClientRect();

  for (let enemy of STATE.enemies) {
    const enemy_rectangle = enemy.$enemy.getBoundingClientRect();
    if (collideRect(enemy_rectangle, player_rectangle)) {
      STATE.gameOver = true;
      STATE.lives = 0;
      return true;
    }
  }

  // Reset drop flag
  STATE.dropEnemies = false;
}


// Create the Player
function createPlayer($container) {
  STATE.x_pos = GAME_WIDTH / 2;
  STATE.y_pos = GAME_HEIGHT - 50;
  const $player = document.createElement("img");
  $player.src = "static/img/Player.png";
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
    STATE.cooldown = 1;
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
  $laser.src = "static/img/laser.png";
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
  $enemyLaser.src = "static/img/enemyLaser.png";
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
    if (collideRect(spaceship_rectangle, enemyLaser_rectangle) && STATE.lives <= 0 ) {
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
    // Clear any existing timer first
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
        // Only update the HUD timer display
        document.getElementById("timer").textContent = `Time: ${STATE.time}`;
      } else if (STATE.gameOver) {
        clearInterval(window.timerInterval);
        checkGameOver();
      }
    }, 1000);
  }
  

// Check if the game is over or teh player win 
function checkGameOver() {
  const mainElement = document.querySelector(".main");
  if (STATE.lives <= 0 || STATE.gameOver || STATE.time<=0) {
    console.log(STATE.time)
    document.querySelector(".lose").style.display = "block";
    mainElement.classList.add("stopped")
    STATE.gameOver = true;
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

// Bind 'P' Key to Toggle Pause
document.addEventListener("keydown", (event) => {
  if (event.key === "p" || event.key === "P") {
    togglePause();
  }
});

// Restart Game Function
function restartGame() {
  if (window.timerInterval) {
    clearInterval(window.timerInterval);
  }

  const mainElement = document.querySelector(".main");
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
  STATE.time = 45;
  STATE.lives = 3;
  
  mainElement.classList.remove("stopped");
  document.getElementById("pauseMenu").style.display = "none";

  document.querySelector(".lose").style.display = "none";
   document.querySelector(".win").style.display = "none";

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


document.addEventListener("keydown", function(e){
  if(e.ctrlKey && (e.key ==="+" || e.key ==="-" || e.key === "=")){
    e.preventDefault();
  }
});

document.body.style.zoom = "100%";

document.addEventListener('wheel', function(e) {
  if(e.ctrlKey){
    e.preventDefault();
  }
},{passive: false});

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
    createEnemy($container, i * 80, 10);
  }
  for (var i = 0; i <= STATE.number_of_enemies / 2; i++) {
    createEnemy($container, i * 80, 70);
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