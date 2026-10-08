import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');

function replaceRequired(source, pattern, replacement) {
  const result = source.replace(pattern, replacement);
  if (result === source) throw new Error(`Static build could not find ${pattern}`);
  return result;
}

// Keep the local Go-backed game intact; publish only the playable static demo.
let html = await readFile(path.join(root, 'index.html'), 'utf8');
html = replaceRequired(html, 'story, tile maps, and a persistent scoreboard.', 'story, three sectors, and destructible shields.');
html = replaceRequired(html, /          <form id="score-form">[\s\S]*?(?=          <button class="restart-button secondary">)/, '');
html = replaceRequired(html, '<p class="muted">Save before restarting to keep this result.</p>', '');

let entry = await readFile(path.join(root, 'src/index.js'), 'utf8');
entry = replaceRequired(entry, /^import \{ Scoreboard \}.*\r?\n/m, '');
entry = replaceRequired(entry, /^const board = new Scoreboard\(\);\r?\n/m, '');
entry = replaceRequired(entry, /^  board\.reset\(\);\r?\n/m, '');
entry = replaceRequired(entry, /^  board\.show\(.*\r?\n/m, '');
entry = replaceRequired(entry, "end: 'player-name'", "end: 'restart-button'");
html = replaceRequired(html, '<button class="restart-button secondary">', '<button id="restart-button" class="restart-button secondary">');

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'src'), { recursive: true });
await cp(path.join(root, 'static'), path.join(output, 'static'), { recursive: true });
for (const file of await readdir(path.join(root, 'src'))) {
  if (file !== 'index.js' && file !== 'scoreboard.js') {
    await cp(path.join(root, 'src', file), path.join(output, 'src', file));
  }
}
await writeFile(path.join(output, 'index.html'), html);
await writeFile(path.join(output, 'src/index.js'), entry);
console.log('Built gameplay-only demo in dist/');
