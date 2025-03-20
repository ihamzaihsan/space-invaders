const COLUMNS = 20;
const ROWS = 15;
const SIZE = 40;

// Hand-authored grids: 0 = space, 1 = barrier, 2 = beacon, 3 = deck.
// Every tile samples a 40px section of the same SVG atlas; no editor or canvas.
const layouts = [
  { id: 'frontier', name: 'Blue Frontier', description: 'Three compact defensive bunkers.', barriers: [[3, 10], [4, 10], [5, 10], [3, 11], [5, 11], [9, 10], [10, 10], [11, 10], [9, 11], [11, 11], [15, 10], [16, 10], [17, 10], [15, 11], [17, 11]], beacons: [1, 18] },
  { id: 'relay', name: 'Relay Station', description: 'Four narrow shields with wide firing lanes.', barriers: [[2, 10], [2, 11], [6, 10], [6, 11], [13, 10], [13, 11], [17, 10], [17, 11]], beacons: [4, 9, 15] },
  { id: 'outpost', name: 'Last Outpost', description: 'Two broad barriers shelter the outer lanes.', barriers: [[1, 10], [2, 10], [3, 10], [4, 10], [1, 11], [4, 11], [15, 10], [16, 10], [17, 10], [18, 10], [15, 11], [18, 11]], beacons: [6, 10, 13] },
];

export const maps = layouts.map(layout => {
  const tiles = Array(COLUMNS * ROWS).fill(0);
  for (const [column, row] of layout.barriers) tiles[row * COLUMNS + column] = 1;
  for (const column of layout.beacons) tiles[column] = 2;
  for (let column = 0; column < COLUMNS; column++) tiles[(ROWS - 1) * COLUMNS + column] = 3;
  return { id: layout.id, name: layout.name, description: layout.description,
    columns: COLUMNS, rows: ROWS, size: SIZE, tiles,
    getTile(column, row) { return this.tiles[row * this.columns + column]; },
  };
});

export function renderMap(container, map) {
  const fragment = document.createDocumentFragment();
  const entities = [];
  for (let row = 0; row < map.rows; row++) {
    for (let column = 0; column < map.columns; column++) {
      const tile = map.getTile(column, row);
      if (!tile) continue;
      const element = document.createElement('div');
      element.className = 'tile';
      element.style.left = `${column * map.size}px`;
      element.style.top = `${row * map.size}px`;
      element.style.backgroundPosition = `${-(tile - 1) * map.size}px 0`;
      fragment.append(element);
      entities.push({ element, x: column * map.size, y: row * map.size,
        width: map.size, height: map.size, solid: tile === 1 });
    }
  }
  container.replaceChildren(fragment);
  return entities;
}
