import { ROUND_SECONDS } from './constants.js';
import { createState } from './state.js';
import { createPlayer, updatePlayer } from './player.js';
import { createEnemies, updateEnemies } from './enemy.js';
import { updateLasers } from './laser.js';
import { setupControls } from './controls.js';
import { formatTime } from './utils.js';

const actors = document.getElementById('actors');
const overlay = document.getElementById('overlay');
const panels = ['intro', 'pause', 'end'];
let state;
let lastTime = null;
const selectedMap = { id: 'frontier', name: 'Blue Frontier' };

document.getElementById('introduction').textContent = 'Clear all 18 invaders before the 45-second countdown expires. Use the arrow keys to move and hold Space to fire.';

function setPhase(phase) {
  state.phase = phase;
  controls.clear();
  lastTime = null;
  overlay.hidden = phase === 'playing';
  for (const panel of panels) document.getElementById(`${panel}-panel`).hidden = panel !== phase;
}

function updateHUD() {
  const values = { score: `Score: ${state.score}`, timer: `Time: ${formatTime(Math.ceil(state.time))}`, lives: `Lives: ${state.lives}` };
  for (const [id, value] of Object.entries(values)) {
    const node = document.getElementById(id);
    if (node.textContent !== value) node.textContent = value;
  }
}

function restart() {
  state = createState(selectedMap.id);
  actors.replaceChildren();
  state.player = createPlayer(actors);
  state.enemies = createEnemies(actors);
  document.getElementById('sector').textContent = selectedMap.name;
  updateHUD();
  setPhase('intro');
}

function start() { if (state.phase === 'intro') setPhase('playing'); }
function pause() {
  if (state.phase === 'playing') setPhase('pause');
  else if (state.phase === 'pause') setPhase('playing');
}
function continueStory() {}

function finish(outcome, reason = '') {
  if (state.phase !== 'playing') return;
  setPhase('end');
  document.getElementById('result-title').textContent = outcome === 'victory' ? 'Mission complete' : 'Game over';
  document.getElementById('conclusion').textContent = outcome === 'victory' ? 'The sector is clear. Well played!' : 'Try again to clear the sector.';
  document.getElementById('result-summary').textContent = `${selectedMap.name} · ${state.score} points · ${formatTime(state.elapsed)} flight time${reason ? ` · ${reason}` : ''}`;
}

function step(dt) {
  updatePlayer(state, controls.keys, actors, dt);
  const invaded = updateEnemies(state, actors, dt);
  updateLasers(state, dt, false);
  updateLasers(state, dt, true);
  if (invaded || state.lives <= 0) finish('defeat', invaded ? 'Invaders reached the fleet' : 'No lives remaining');
  else if (!state.enemies.length) finish('victory');
}

// One animation chain survives pause/restart. Motion is time-based, with small
// bounded steps for collisions; countdown uses active wall time, excluding menus.
function frame(timestamp) {
  if (state.phase === 'playing' && lastTime !== null) {
    const elapsed = Math.max(0, (timestamp - lastTime) / 1000);
    state.elapsed = Math.min(ROUND_SECONDS, state.elapsed + elapsed);
    state.time = Math.max(0, ROUND_SECONDS - state.elapsed);
    if (state.time <= 0) finish('defeat', 'Jump window expired');
    else {
      let remaining = Math.min(elapsed, 0.05);
      while (remaining > 0 && state.phase === 'playing') {
        const dt = Math.min(remaining, 1 / 120);
        step(dt);
        remaining -= dt;
      }
    }
    updateHUD();
  }
  lastTime = state.phase === 'playing' ? timestamp : null;
  requestAnimationFrame(frame);
}

const controls = setupControls({ getPhase: () => state.phase, start, pause, restart, continueStory });
document.getElementById('start-button').addEventListener('click', start);
document.getElementById('continue-button').addEventListener('click', pause);
document.querySelectorAll('.restart-button').forEach(button => button.addEventListener('click', restart));
restart();
requestAnimationFrame(frame);
