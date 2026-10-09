// recorder.js
// Keeps a recording in memory, saves it to IndexedDB every few seconds so a crash or
// refresh doesn't lose data, and exports CSV in the same column layout as `muselsl record`
// (timestamps, TP9, AF7, AF8, TP10).

import { CHANNELS, SAMPLE_RATE } from './muse2-ble.js';

const DB_NAME = 'brainwaves-eeg';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('sessions', { keyPath: 'id' });
      const chunks = db.createObjectStore('chunks', { autoIncrement: true });
      chunks.createIndex('sessionId', 'sessionId');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, stores, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    const result = fn(t);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export class Recorder {
  constructor({ persist = true, flushMs = 2000 } = {}) {
    this.persist = persist;
    this.flushMs = flushMs;
    this.db = null;
    this.session = null;
    this.rows = [];         // Float64Array(5) each
    this.markers = [];      // { t, label }
    this._unsaved = [];
    this._timer = null;
  }

  get isRecording() { return !!this.session && this.session.status === 'recording'; }
  get sampleCount() { return this.rows.length; }
  get durationSec() { return this.rows.length / SAMPLE_RATE; }

  async _db() {
    if (!this.persist) return null;
    if (!this.db) { try { this.db = await openDb(); } catch { this.persist = false; return null; } }
    return this.db;
  }

  async start(meta = {}) {
    const id = `eeg-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    this.rows = [];
    this.markers = [];
    this._unsaved = [];
    this.session = {
      id,
      status: 'recording',
      startedAt: new Date().toISOString(),
      endedAt: null,
      sampleRate: SAMPLE_RATE,
      channels: [...CHANNELS],
      ...meta,
    };
    const db = await this._db();
    if (db) await tx(db, ['sessions'], 'readwrite', (t) => t.objectStore('sessions').put(this.session));
    this._timer = setInterval(() => this._flush(), this.flushMs);
    return this.session;
  }

  addRows(rows) {
    if (!this.isRecording) return;
    for (const r of rows) { this.rows.push(r); this._unsaved.push(r); }
  }

  /** Marks the current moment (e.g. "Q3_start"). Returns the marker. */
  addMarker(label, t = Date.now() / 1000) {
    if (!this.isRecording) return null;
    const m = { t, label: String(label).replace(/[\r\n,]/g, ' ').trim() };
    this.markers.push(m);
    this._flush();
    return m;
  }

  async _flush() {
    const db = await this._db();
    if (!db || !this.session) return;
    const rows = this._unsaved.splice(0);
    const session = { ...this.session, markers: this.markers, samples: this.rows.length };
    await tx(db, ['sessions', 'chunks'], 'readwrite', (t) => {
      t.objectStore('sessions').put(session);
      if (rows.length) {
        const flat = new Float64Array(rows.length * 5);
        rows.forEach((r, i) => flat.set(r, i * 5));
        t.objectStore('chunks').add({ sessionId: session.id, data: flat.buffer });
      }
    }).catch(() => {});
  }

  async stop(extraMeta = {}) {
    if (!this.session) return null;
    clearInterval(this._timer);
    Object.assign(this.session, { status: 'stopped', endedAt: new Date().toISOString(), ...extraMeta });
    await this._flush();
    return this.session;
  }

  async setStatus(status) {
    if (!this.session) return;
    this.session.status = status;
    await this._flush();
  }

  toCsvBlob() { return buildCsv(this.rows, this.markers); }

  metadata() {
    return { ...this.session, markers: this.markers, samples: this.rows.length, durationSec: this.durationSec };
  }

  // ---- Recovery of recordings that were never exported or uploaded ----

  async listUnfinished() {
    const db = await this._db();
    if (!db) return [];
    const all = await tx(db, ['sessions'], 'readonly', (t) => reqP(t.objectStore('sessions').getAll()));
    return (await all).filter((s) => s.status === 'recording' || s.status === 'stopped');
  }

  async load(sessionId) {
    const db = await this._db();
    if (!db) return null;
    const t = db.transaction(['sessions', 'chunks'], 'readonly');
    const session = await reqP(t.objectStore('sessions').get(sessionId));
    const chunks = await reqP(t.objectStore('chunks').index('sessionId').getAll(sessionId));
    const rows = [];
    for (const c of chunks) {
      const flat = new Float64Array(c.data);
      for (let i = 0; i < flat.length; i += 5) rows.push(flat.subarray(i, i + 5));
    }
    this.session = { ...session, status: session.status === 'recording' ? 'stopped' : session.status };
    this.rows = rows;
    this.markers = session.markers || [];
    return this.session;
  }

  async discard(sessionId) {
    const db = await this._db();
    if (!db) return;
    const keys = await tx(db, ['chunks'], 'readonly', (t) => reqP(t.objectStore('chunks').index('sessionId').getAllKeys(sessionId)));
    const k = await keys;
    await tx(db, ['sessions', 'chunks'], 'readwrite', (t) => {
      t.objectStore('sessions').delete(sessionId);
      k.forEach((key) => t.objectStore('chunks').delete(key));
    });
    if (this.session?.id === sessionId) { this.session = null; this.rows = []; this.markers = []; }
  }
}

/** CSV: timestamps (unix seconds), TP9, AF7, AF8, TP10 (µV), plus Marker only if markers were added. */
export function buildCsv(rows, markers = []) {
  const sorted = [...markers].sort((a, b) => a.t - b.t);
  const withMarkers = sorted.length > 0;   // the Marker column is only added when markers exist
  const parts = [`timestamps,${CHANNELS.join(',')}${withMarkers ? ',Marker' : ''}\n`];
  let mi = 0;
  let buf = '';
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const labels = [];
    while (mi < sorted.length && sorted[mi].t <= r[0]) labels.push(sorted[mi++].label);
    buf += r[0].toFixed(6);
    for (let c = 1; c < 5; c++) buf += ',' + (Number.isFinite(r[c]) ? r[c].toFixed(3) : '');
    buf += (withMarkers ? ',' + labels.join('|') : '') + '\n';
    if (buf.length > 1 << 16) { parts.push(buf); buf = ''; }
  }
  // Markers placed after the last sample still belong in the file.
  if (mi < sorted.length && rows.length) {
    buf += `${sorted[sorted.length - 1].t.toFixed(6)},,,,,${sorted.slice(mi).map((m) => m.label).join('|')}\n`;
  }
  parts.push(buf);
  return new Blob(parts, { type: 'text/csv' });
}
