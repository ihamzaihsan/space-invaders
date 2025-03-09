export function setupControls({ getPhase, start, pause, restart, continueStory }) {
  const keys = new Set();
  const clear = () => keys.clear();
  window.addEventListener('keydown', event => {
    if (event.target.closest('input, select, textarea') || event.ctrlKey || event.metaKey || event.altKey) return;
    if (['ArrowLeft', 'ArrowRight', 'Space'].includes(event.code) && getPhase() === 'playing') {
      event.preventDefault();
      keys.add(event.code);
    }
    if (event.repeat) return;
    if (event.code === 'KeyP' || event.code === 'Escape') {
      event.preventDefault();
      pause();
    } else if (event.code === 'KeyR') {
      event.preventDefault();
      restart();
    } else if (event.code === 'Enter' && !event.target.closest('button')) {
      if (getPhase() === 'intro') start();
      else if (getPhase() === 'story') continueStory();
    }
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  return { keys, clear };
}
