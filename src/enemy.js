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

function updateEnemies($container) {
  const ENEMY_SPEED = 1;
  const ENEMY_DROP = 20;
  const PLAYER_Y_POSITION = GAME_HEIGHT - 90;

  let leftMostX = GAME_WIDTH;
  let rightMostX = 0;

  STATE.enemies.forEach(enemy => {
    leftMostX = Math.min(leftMostX, enemy.x);
    rightMostX = Math.max(rightMostX, enemy.x);
  });

  if (rightMostX + STATE.enemy_width >= GAME_WIDTH-40) {
    STATE.enemyDirection = -1;
    STATE.dropEnemies = true;
  } else if (leftMostX <= 0) {
    STATE.enemyDirection = 1;
    STATE.dropEnemies = true;
  }

  STATE.enemies.forEach(enemy => {
    if (STATE.dropEnemies) {
      enemy.y += ENEMY_DROP;
    }
    enemy.x += ENEMY_SPEED * (STATE.enemyDirection || 1);

    if (enemy.y >= PLAYER_Y_POSITION) {
      STATE.gameOver = true;
      STATE.lives = 0;
      return;
    }

    setPosition(enemy.$enemy, enemy.x, enemy.y);

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

  STATE.dropEnemies = false;
}

function createEnemies($container) {
  for (var i = 0; i <= STATE.number_of_enemies / 2; i++) {
    createEnemy($container, i * 80, 10);
  }
  for (var i = 0; i <= STATE.number_of_enemies / 2; i++) {
    createEnemy($container, i * 80, 70);
  }
}
