import { ROUND_SECONDS, STORY_SCORE } from './constants.js';
import { createState } from './state.js';
import { createPlayer, updatePlayer } from './player.js';
import { createEnemies, updateEnemies } from './enemy.js';
import { updateLasers } from './laser.js';
import { setupControls } from './controls.js';
import { formatTime } from './utils.js';
import { maps, renderMap } from './maps.js';
import { story } from './story.js';
import { Scoreboard } from './scoreboard.js';

const actors = document.getElementById('actors');
const mapLayer = document.getElementById('map-layer');
const mapSelect = document.getElementById('map-select');
const overlay = document.getElementById('overlay');
const panels = ['intro', 'pause', 'story', 'end'];
const board = new Scoreboard();
let state;
let lastTime = null;
let selectedMap = maps[0];

for (const map of maps) {
  const option = document.createElement('option');
  option.value = map.id;
  option.textContent = map.name;
  mapSelect.append(option);
}
document.getElementById('introduction').textContent = story.introduction;
document.getElementById('development').textContent = story.development;

function setPhase(phase) {
  state.phase = phase;
  controls.clear();
  lastTime = null;
  overlay.hidden = phase === 'playing';
  for (const panel of panels) document.getElementById(`${panel}-panel`).hidden = panel !== phase;
  // Move focus out of hidden menus so held Space cannot activate an old button.
  if (phase === 'playing') document.activeElement?.blur();
  else {
    const target = { intro: 'start-button', pause: 'continue-button', story: 'story-button', end: 'player-name' }[phase];
    document.getElementById(target)?.focus({ preventScroll: true });
    overlay.scrollTop = 0;
  }
}

function updateHUD() {
  const values = { score: `Score: ${state.score}`, timer: `Time: ${formatTime(Math.ceil(state.time))}`, lives: `Lives: ${state.lives}` };
  for (const [id, value] of Object.entries(values)) {
    const node = document.getElementById(id);
    if (node.textContent !== value) node.textContent = value;
  }
}

function restart() {
  board.reset();
  state = createState(selectedMap.id);
  actors.replaceChildren();
  state.tiles = renderMap(mapLayer, selectedMap);
  state.player = createPlayer(actors);
  state.enemies = createEnemies(actors);
  document.getElementById('sector').textContent = selectedMap.name;
  document.getElementById('map-description').textContent = selectedMap.description;
  updateHUD();
  setPhase('intro');
}

function start() { if (state.phase === 'intro') setPhase('playing'); }
function pause() {
  if (state.phase === 'playing') setPhase('pause');
  else if (state.phase === 'pause') setPhase('playing');
}
function continueStory() { if (state.phase === 'story') setPhase('playing'); }

function finish(outcome, reason = '') {
  if (state.phase !== 'playing') return;
  setPhase('end');
  document.getElementById('result-title').textContent = outcome === 'victory' ? 'Mission complete' : 'Game over';
  document.getElementById('conclusion').textContent = story[outcome];
  document.getElementById('result-summary').textContent = `${selectedMap.name} · ${state.score} points · ${formatTime(state.elapsed)} flight time${reason ? ` · ${reason}` : ''}`;
  board.show({ id: state.runId, score: state.score, time: Number(state.elapsed.toFixed(3)), map: state.mapId, outcome });
}

function step(dt) {
  updatePlayer(state, controls.keys, actors, dt);
  const invaded = updateEnemies(state, actors, dt);
  updateLasers(state, dt, false);
  updateLasers(state, dt, true);
  if (invaded || state.lives <= 0) finish('defeat', invaded ? 'Invaders reached the fleet' : 'No lives remaining');
  else if (!state.enemies.length) finish('victory');
  else if (!state.storyShown && state.score >= STORY_SCORE) {
    state.storyShown = true;
    setPhase('story');
  }
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
document.getElementById('story-button').addEventListener('click', continueStory);
document.querySelectorAll('.restart-button').forEach(button => button.addEventListener('click', restart));
document.getElementById('change-map-button').addEventListener('click', restart);
mapSelect.addEventListener('change', () => {
  selectedMap = maps.find(map => map.id === mapSelect.value) || maps[0];
  restart();
});
const wrapper = document.querySelector('.game-wrapper');
new ResizeObserver(() => {
  document.querySelector('.main').style.transform = `scale(${wrapper.clientWidth / 800})`;
}).observe(wrapper);
restart();
requestAnimationFrame(frame);
