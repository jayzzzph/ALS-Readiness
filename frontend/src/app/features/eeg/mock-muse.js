// mock-muse.js
// Same interface as Muse2Device, but generates a synthetic 4-channel EEG signal.
// Use it to develop and demo the page without a headset.
// The ear sensors (TP9, TP10) start with poor contact and settle over ~8 s,
// so the fit check can be seen working.

import { SAMPLE_RATE, SAMPLES_PER_PACKET } from './muse2-ble.js';

export class MockMuseDevice extends EventTarget {
  constructor() {
    super();
    this._timer = null;
    this._index = 0;
    this._t = 0;
    this._startedAt = 0;
    this._battery = 86;
    this.isConnected = false;
  }

  get name() { return 'Demo signal (no headset)'; }

  _status(state, reason) {
    this.dispatchEvent(new CustomEvent('status', { detail: { state, reason } }));
  }

  async connect() {
    this._status('connecting');
    await new Promise((r) => setTimeout(r, 600));
    this.isConnected = true;
    this._status('connected');
  }

  async start() {
    this._startedAt = performance.now();
    let emitted = 0;
    const packetMs = (SAMPLES_PER_PACKET / SAMPLE_RATE) * 1000;
    const tick = () => {
      const due = Math.floor((performance.now() - this._startedAt) / packetMs);
      while (emitted < due) { this._emitPacket(); emitted++; }
    };
    this._timer = setInterval(tick, 40);
    this.dispatchEvent(new CustomEvent('telemetry', { detail: { battery: this._battery, temperature: 0 } }));
  }

  _emitPacket() {
    const elapsed = this._t;
    const now = Date.now();
    for (let ch = 0; ch < 4; ch++) {
      const samples = new Float32Array(SAMPLES_PER_PACKET);
      const ear = ch === 0 || ch === 3;
      // Contact quality: ear sensors settle later than forehead sensors.
      const settle = ear ? 8 : 2.5;
      const noise = elapsed < settle ? 90 * (1 - elapsed / settle) + 6 : 6;
      for (let i = 0; i < SAMPLES_PER_PACKET; i++) {
        const t = elapsed + i / SAMPLE_RATE;
        let v = 10 * Math.sin(2 * Math.PI * 10 * t + ch)           // alpha
              + 5 * Math.sin(2 * Math.PI * 6 * t + ch * 0.7)       // theta
              + 3 * Math.sin(2 * Math.PI * 20 * t + ch * 1.3)      // beta
              + noise * (Math.random() * 2 - 1);
        // Occasional blink on the forehead sensors.
        if (!ear) {
          const phase = t % 4.3;
          if (phase < 0.25) v += 70 * Math.sin(Math.PI * phase / 0.25);
        }
        samples[i] = v;
      }
      this.dispatchEvent(new CustomEvent('eeg', {
        detail: { index: this._index, channel: ch, samples, receivedAt: now },
      }));
    }
    this._index = (this._index + 1) & 0xffff;
    this._t += SAMPLES_PER_PACKET / SAMPLE_RATE;
  }

  async disconnect() {
    clearInterval(this._timer);
    this.isConnected = false;
    this._status('disconnected', 'user');
  }
}
