import { ROUND_SECONDS } from './constants.js';

export function createState(mapId) {
  return {
    mapId, phase: 'intro', score: 0,
    elapsed: 0, time: ROUND_SECONDS, lives: 3, enemyDirection: 1,
    cooldown: 0,
    player: null, enemies: [], lasers: [], enemyLasers: [], tiles: [],
  };
}
