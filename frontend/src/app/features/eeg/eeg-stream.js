// eeg-stream.js
// Turns per-channel BLE notifications into time-aligned rows, and scores contact quality.
//
// The Muse sends each channel as its own notification, all tagged with the same
// 16-bit packet index. PacketAssembler waits until all four channels of an index
// have arrived, then emits 12 rows: [timestampSeconds, TP9, AF7, AF8, TP10].
// Timestamps come from the packet index (256 Hz), anchored to the wall clock at the
// first packet, so a late notification doesn't shift the timeline.

import { SAMPLE_RATE, SAMPLES_PER_PACKET } from './muse2-ble.js';

export class PacketAssembler {
  /** @param {(rows: Float64Array[], info: {dropped:number}) => void} onRows */
  constructor(onRows) {
    this.onRows = onRows;
    this.reset();
  }

  reset() {
    this.pending = new Map();      // unwrapped index -> { chans: [], receivedAt }
    this.lastRaw = null;
    this.lastUnwrapped = 0;
    this.lastFlushed = null;
    this.t0 = null;
    this.u0 = null;
    this.dropped = 0;
    this.total = 0;
  }

  _unwrap(raw) {
    if (this.lastRaw === null) { this.lastRaw = raw; this.lastUnwrapped = 0; return 0; }
    const forward = (raw - this.lastRaw) & 0xffff;
    if (forward < 0x8000) {
      this.lastUnwrapped += forward;
      this.lastRaw = raw;
      return this.lastUnwrapped;
    }
    return this.lastUnwrapped - ((this.lastRaw - raw) & 0xffff);   // an older packet, arriving late
  }

  push({ index, channel, samples, receivedAt }) {
    const u = this._unwrap(index);
    if (this.lastFlushed !== null && u <= this.lastFlushed) return;   // too late, already emitted
    let entry = this.pending.get(u);
    if (!entry) { entry = { chans: [null, null, null, null], receivedAt }; this.pending.set(u, entry); }
    entry.chans[channel] = samples;

    const complete = entry.chans.every(Boolean);
    const stale = [...this.pending.keys()].filter((k) => k < u - 4);
    if (complete || stale.length) this._flush(complete ? u : Math.max(...stale));
  }

  _flush(upTo) {
    const keys = [...this.pending.keys()].filter((k) => k <= upTo).sort((a, b) => a - b);
    const rows = [];
    for (const u of keys) {
      const { chans, receivedAt } = this.pending.get(u);
      this.pending.delete(u);
      if (this.t0 === null) {
        this.t0 = receivedAt / 1000 - (SAMPLES_PER_PACKET - 1) / SAMPLE_RATE;
        this.u0 = u;
      }
      if (this.lastFlushed !== null && u > this.lastFlushed + 1) this.dropped += u - this.lastFlushed - 1;
      this.lastFlushed = u;
      for (let k = 0; k < SAMPLES_PER_PACKET; k++) {
        const row = new Float64Array(5);
        row[0] = this.t0 + ((u - this.u0) * SAMPLES_PER_PACKET + k) / SAMPLE_RATE;
        for (let ch = 0; ch < 4; ch++) row[ch + 1] = chans[ch] ? chans[ch][k] : NaN;
        rows.push(row);
      }
    }
    this.total += rows.length;
    if (rows.length) this.onRows(rows, { dropped: this.dropped });
  }
}

/**
 * Contact quality from the last second of raw signal (per channel).
 * Heuristic thresholds in microvolts; tune them with your own headset if needed.
 *   flat  : std below 1 µV          (sensor not reporting / saturated flat)
 *   good  : std up to 25 µV
 *   fair  : std up to 60 µV
 *   poor  : anything noisier, or samples near the ±1000 µV rails
 */
export const QUALITY_THRESHOLDS = { flat: 1, good: 25, fair: 60, rail: 900 };

export class SignalQuality {
  constructor(windowSize = SAMPLE_RATE, thresholds = QUALITY_THRESHOLDS) {
    this.size = windowSize;
    this.th = thresholds;
    this.buf = Array.from({ length: 4 }, () => new Float32Array(windowSize));
    this.count = 0;
    this.pos = 0;
  }

  add(row) {
    for (let ch = 0; ch < 4; ch++) this.buf[ch][this.pos] = row[ch + 1];
    this.pos = (this.pos + 1) % this.size;
    this.count = Math.min(this.count + 1, this.size);
  }

  /** @returns {{level: 'waiting'|'good'|'fair'|'poor', std: number}[]} */
  read() {
    return this.buf.map((b) => {
      if (this.count < this.size) return { level: 'waiting', std: NaN };
      let sum = 0, n = 0, railed = 0;
      for (const v of b) { if (Number.isFinite(v)) { sum += v; n++; if (Math.abs(v) > this.th.rail) railed++; } }
      if (n < this.size / 2) return { level: 'poor', std: NaN };
      const mean = sum / n;
      let sq = 0;
      for (const v of b) if (Number.isFinite(v)) sq += (v - mean) ** 2;
      const std = Math.sqrt(sq / n);
      let level = 'poor';
      if (railed > n * 0.05 || std < this.th.flat) level = 'poor';
      else if (std <= this.th.good) level = 'good';
      else if (std <= this.th.fair) level = 'fair';
      return { level, std };
    });
  }
}
