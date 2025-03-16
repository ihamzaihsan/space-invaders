import { formatTime } from './utils.js';

const PAGE_SIZE = 5;
export class Scoreboard {
  constructor() {
    this.rows = document.getElementById('score-rows');
    this.status = document.getElementById('board-status');
    this.feedback = document.getElementById('score-status');
    this.form = document.getElementById('score-form');
    this.input = document.getElementById('player-name');
    this.save = document.getElementById('save-button');
    this.previous = document.getElementById('previous-page');
    this.next = document.getElementById('next-page');
    this.retry = document.getElementById('retry-board');
    this.generation = 0;
    this.previous.addEventListener('click', () => { this.page--; this.render(); });
    this.next.addEventListener('click', () => { this.page++; this.render(); });
    this.retry.addEventListener('click', () => this.load());
    this.form.addEventListener('submit', event => { event.preventDefault(); this.submit(); });
    this.reset();
  }

  reset() {
    this.generation++;
    this.controller?.abort();
    this.controller = new AbortController();
    this.result = null;
    this.scores = [];
    this.page = 0;
    this.submittedId = null;
    this.pending = false;
    this.form.hidden = false;
    this.input.value = '';
    this.save.disabled = false;
    this.feedback.textContent = '';
    this.status.textContent = '';
    this.retry.hidden = true;
    this.render();
  }

  show(result) {
    this.reset();
    this.result = Object.freeze({ ...result });
    this.load();
  }

  async request(options = {}) {
    const response = await fetch('/api/scores', { ...options,
      signal: AbortSignal.any([this.controller.signal, AbortSignal.timeout(10000)]) });
    let data;
    try { data = await response.json(); }
    catch { throw new Error('The score service returned an invalid response. Start the Go server and retry.'); }
    if (!response.ok) throw new Error(data.error || 'Score service unavailable.');
    return data;
  }

  async load() {
    const generation = this.generation;
    this.status.textContent = 'Loading scores…';
    this.retry.hidden = true;
    try {
      const data = await this.request();
      if (generation !== this.generation) return;
      this.scores = data.scores;
      this.render();
      this.status.textContent = this.scores.length ? '' : 'No scores yet. Be the first pilot on the board.';
    } catch (error) {
      if (generation !== this.generation) return;
      this.status.textContent = `Could not load scores. ${error.message}`;
      this.retry.hidden = false;
    }
  }

  async submit() {
    if (this.pending || !this.result || this.submittedId) return;
    const name = this.input.value.trim();
    if (!name || [...name].length > 24 || /[\p{Cc}\p{Cf}]/u.test(name)) {
      this.feedback.textContent = 'Enter a name of 1–24 characters without control characters.';
      this.input.focus();
      return;
    }
    const generation = this.generation;
    this.pending = true;
    this.save.disabled = true;
    this.feedback.textContent = 'Saving score…';
    try {
      const data = await this.request({ method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...this.result, name }) });
      if (generation !== this.generation) return;
      this.submittedId = data.score.id;
      this.form.hidden = true;
      this.feedback.textContent = `${data.score.name}, you are in the top ${data.percentile}% — position ${data.rank} of ${data.total}.`;
      this.page = 0;
      await this.load();
    } catch (error) {
      if (generation !== this.generation) return;
      this.feedback.textContent = `Could not confirm score save. ${error.message} Try again; retries cannot duplicate this result.`;
    } finally {
      if (generation === this.generation) { this.pending = false; this.save.disabled = false; }
    }
  }

  render() {
    const pages = Math.max(1, Math.ceil(this.scores.length / PAGE_SIZE));
    this.page = Math.max(0, Math.min(this.page, pages - 1));
    this.rows.replaceChildren();
    this.scores.slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE).forEach((score, index) => {
      const row = document.createElement('tr');
      row.classList.toggle('submitted', score.id === this.submittedId);
      for (const value of [this.page * PAGE_SIZE + index + 1, score.name, score.score, formatTime(score.time)]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      this.rows.append(row);
    });
    document.getElementById('page-label').textContent = `Page ${this.page + 1}/${pages}`;
    this.previous.disabled = this.page === 0;
    this.next.disabled = this.page === pages - 1;
  }
}
