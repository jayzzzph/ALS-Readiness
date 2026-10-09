// muse2-ble.js
// Minimal, dependency-free Web Bluetooth driver for the Interaxon Muse 2.
// Protocol details follow the open-source muse-js / muselsl implementations.
//
// Emits (via EventTarget):
//   "status"    detail: { state: 'connecting'|'connected'|'reconnecting'|'disconnected', reason? }
//   "eeg"       detail: { index, receivedAt, channel: 0..3, samples: Float32Array(12) }  (microvolts)
//   "telemetry" detail: { battery, temperature }
//
// Usage:
//   const muse = new Muse2Device();
//   muse.addEventListener('eeg', e => ...);
//   await muse.connect();   // MUST be called from a click/tap handler (Chrome's pairing chooser)
//   await muse.start();

export const MUSE_SERVICE = 0xfe8d;
const UUID = (short) => `273e${short}-4c4d-454d-96be-f03bac821358`;

const CONTROL_CHAR = UUID('0001');
const TELEMETRY_CHAR = UUID('000b');
// Order matters: index in this array = channel index.
const EEG_CHARS = [UUID('0003'), UUID('0004'), UUID('0005'), UUID('0006')];
export const CHANNELS = ['TP9', 'AF7', 'AF8', 'TP10'];

export const SAMPLE_RATE = 256;           // Hz, per channel
export const SAMPLES_PER_PACKET = 12;

/** Muse commands are "X<cmd>\n" where X is replaced by the payload length. */
export function encodeCommand(cmd) {
  const bytes = new TextEncoder().encode(`X${cmd}\n`);
  bytes[0] = bytes.length - 1;
  return bytes;
}

/**
 * Decode one EEG notification (20 bytes): uint16 packet index + 12 × 12-bit samples.
 * Returns { index, samples } with samples already scaled to microvolts.
 */
export function decodeEegPacket(dataView) {
  const index = dataView.getUint16(0);
  const samples = new Float32Array(SAMPLES_PER_PACKET);
  let s = 0;
  for (let i = 2; i + 2 < dataView.byteLength && s < SAMPLES_PER_PACKET; i += 3) {
    const b0 = dataView.getUint8(i), b1 = dataView.getUint8(i + 1), b2 = dataView.getUint8(i + 2);
    const a = (b0 << 4) | (b1 >> 4);
    const b = ((b1 & 0x0f) << 8) | b2;
    samples[s++] = 0.48828125 * (a - 0x800);
    samples[s++] = 0.48828125 * (b - 0x800);
  }
  return { index, samples };
}

export function decodeTelemetry(dataView) {
  return {
    battery: Math.round((dataView.getUint16(2) / 512) * 10) / 10,   // percent
    temperature: dataView.getUint16(8),
  };
}

export function isWebBluetoothAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth && window.isSecureContext;
}

export class Muse2Device extends EventTarget {
  constructor({ maxReconnectAttempts = 3, keepAliveMs = 10000 } = {}) {
    super();
    this.device = null;
    this.server = null;
    this.control = null;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.keepAliveMs = keepAliveMs;
    this._userDisconnect = false;
    this._keepAlive = null;
    this._onDisconnected = this._onDisconnected.bind(this);
  }

  get name() { return this.device?.name || 'Muse 2'; }
  get isConnected() { return !!this.server?.connected; }

  _status(state, reason) {
    this.dispatchEvent(new CustomEvent('status', { detail: { state, reason } }));
  }

  /** Opens Chrome/Edge's device chooser. Call from a user gesture. */
  async connect() {
    if (!isWebBluetoothAvailable()) {
      throw new Error('Web Bluetooth is not available. Use Chrome or Edge on a laptop, over HTTPS or localhost.');
    }
    this._status('connecting');
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [MUSE_SERVICE] }, { namePrefix: 'Muse' }],
      optionalServices: [MUSE_SERVICE],
    });
    this.device.addEventListener('gattserverdisconnected', this._onDisconnected);
    this._userDisconnect = false;
    await this._openGatt();
  }

  async _openGatt() {
    this.server = await this.device.gatt.connect();
    const service = await this.server.getPrimaryService(MUSE_SERVICE);

    this.control = await service.getCharacteristic(CONTROL_CHAR);

    const telemetry = await service.getCharacteristic(TELEMETRY_CHAR);
    telemetry.addEventListener('characteristicvaluechanged', (e) => {
      this.dispatchEvent(new CustomEvent('telemetry', { detail: decodeTelemetry(e.target.value) }));
    });
    await telemetry.startNotifications();

    for (let ch = 0; ch < EEG_CHARS.length; ch++) {
      const c = await service.getCharacteristic(EEG_CHARS[ch]);
      c.addEventListener('characteristicvaluechanged', (e) => {
        const { index, samples } = decodeEegPacket(e.target.value);
        this.dispatchEvent(new CustomEvent('eeg', {
          detail: { index, channel: ch, samples, receivedAt: Date.now() },
        }));
      });
      await c.startNotifications();
    }
    this._status('connected');
  }

  async _send(cmd) {
    const bytes = encodeCommand(cmd);
    if (this.control.writeValueWithoutResponse) {
      try { await this.control.writeValueWithoutResponse(bytes); return; } catch { /* fall through */ }
    }
    await this.control.writeValue(bytes);
  }

  /** Starts EEG streaming (preset p21 = 4 EEG channels, no AUX). */
  async start() {
    await this._send('h');      // halt
    await this._send('p21');    // preset
    await this._send('s');      // status / apply
    await this._send('d');      // resume data
    clearInterval(this._keepAlive);
    this._keepAlive = setInterval(() => { this._send('k').catch(() => {}); }, this.keepAliveMs);
  }

  async disconnect() {
    this._userDisconnect = true;
    clearInterval(this._keepAlive);
    try { if (this.isConnected) await this._send('h'); } catch { /* ignore */ }
    this.device?.gatt?.disconnect();
    this._status('disconnected', 'user');
  }

  async _onDisconnected() {
    clearInterval(this._keepAlive);
    if (this._userDisconnect) return;
    // Same device object: reconnecting does not need the chooser again.
    for (let attempt = 1; attempt <= this.maxReconnectAttempts; attempt++) {
      this._status('reconnecting', `attempt ${attempt} of ${this.maxReconnectAttempts}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      if (this._userDisconnect) return;
      try {
        await this._openGatt();
        await this.start();
        return;
      } catch { /* try again */ }
    }
    this._status('disconnected', 'lost');
  }
}
