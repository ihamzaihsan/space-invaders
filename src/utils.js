export function setPosition(entity) {
  entity.element.style.transform = `translate(${entity.x}px, ${entity.y}px)`;
}

export function createSprite(container, className, image, x, y, width, height) {
  const element = document.createElement('img');
  element.src = `static/img/${image}`;
  element.className = className;
  element.alt = '';
  element.draggable = false;
  element.width = width;
  element.height = height;
  const entity = { element, x, y, width, height };
  setPosition(entity);
  container.append(element);
  return entity;
}

// Collisions use game coordinates, independent of viewport scaling.
export function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

export function removeEntity(list, index) {
  list[index].element.remove();
  list.splice(index, 1);
}

const sounds = {
  shoot: new Audio('static/sounds/shoot.wav'),
  hit: new Audio('static/sounds/enemy-death.wav'),
};
export function playSound(name) {
  const sound = sounds[name];
  sound.currentTime = 0;
  sound.play().catch(() => { /* Audio restrictions must never interrupt gameplay. */ });
}

export function formatTime(seconds) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60).toString().padStart(2, '0')}:${(whole % 60).toString().padStart(2, '0')}`;
}
