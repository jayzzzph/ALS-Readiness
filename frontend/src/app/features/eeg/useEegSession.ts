import { useCallback, useEffect, useRef, useState } from "react";
import { Muse2Device, SAMPLE_RATE, isWebBluetoothAvailable } from "./muse2-ble.js";
import { MockMuseDevice } from "./mock-muse.js";
import { PacketAssembler, SignalQuality } from "./eeg-stream.js";
import { Recorder } from "./recorder.js";

// Behavior of the Muse 2 session, ported from the reference eeg-session.js: pair, check the
// fit, record for a fixed length that stops by itself, reconnect, and recover an unsaved
// recording. The drivers (muse2-ble, eeg-stream, recorder, mock-muse) are used unchanged.

export type Level = "waiting" | "good" | "fair" | "poor";
export type ConnState = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";
export type Step = 1 | 2 | 3 | 4;

export const WINDOW_SEC = 5;
const FIT_HOLD_MS = 2500;
const N = SAMPLE_RATE * WINDOW_SEC;
const HP_A = 1 / (1 + (2 * Math.PI * 1) / SAMPLE_RATE);

/** Rolling 5-second window of the filtered signal, read by the canvas. Mutated in place, never re-rendered. */
export interface SignalBuffer {
  ring: Float32Array[];
  pos: number;
  dirty: boolean;
}

export interface Recovered { id: string; when: string; duration: number }
export interface Result { completed: boolean; recordedSec: number }

export function useEegSession({ learnerId, seconds }: { learnerId: string | null; seconds: number }) {
  const [step, setStepState] = useState<Step>(1);
  const [conn, setConn] = useState<{ state: ConnState; reason?: string; name: string }>({ state: "idle", name: "Muse 2" });
  const [battery, setBattery] = useState<number | null>(null);
  const [levels, setLevels] = useState<Level[]>(["waiting", "waiting", "waiting", "waiting"]);
  const [connectNote, setConnectNote] = useState<"unsupported" | "cancelled" | string | null>(
    () => (isWebBluetoothAvailable() ? null : "unsupported"),
  );
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [exported, setExported] = useState(false);
  const [recovered, setRecovered] = useState<Recovered | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [source, setSource] = useState<"muse" | "demo" | null>(null);

  const stepRef = useRef<Step>(1);
  const deviceRef = useRef<any>(null);
  const unwireRef = useRef<() => void>(() => {});
  const sourceRef = useRef<"muse" | "demo" | null>(null);
  const recorderRef = useRef<any>(null);
  const qualityRef = useRef<any>(null);
  const assemblerRef = useRef<any>(null);
  const hpRef = useRef(Array.from({ length: 4 }, () => ({ x: NaN, y: 0 })));
  const signal = useRef<SignalBuffer>({ ring: Array.from({ length: 4 }, () => new Float32Array(N).fill(NaN)), pos: 0, dirty: true });
  const levelsRef = useRef<Level[]>([]);
  const fitGoodSince = useRef(0);
  const droppedAtStart = useRef(0);
  const finishing = useRef(false);
  const targetSamples = Math.round(seconds * SAMPLE_RATE);
  const targetRef = useRef(targetSamples);
  targetRef.current = targetSamples;
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const stopRef = useRef<(completed: boolean) => Promise<void>>(async () => {});

  if (!recorderRef.current) recorderRef.current = new Recorder({ persist: true });
  if (!qualityRef.current) qualityRef.current = new SignalQuality();
  if (!assemblerRef.current) {
    assemblerRef.current = new PacketAssembler((rows: Float64Array[], info: { dropped: number }) => {
      const sig = signal.current, hp = hpRef.current, rec = recorderRef.current;
      for (const r of rows) {
        qualityRef.current.add(r);
        for (let ch = 0; ch < 4; ch++) {
          const x = r[ch + 1], f = hp[ch];
          if (!Number.isFinite(x)) { sig.ring[ch][sig.pos] = NaN; continue; }
          if (!Number.isFinite(f.x)) f.x = x;
          f.y = HP_A * (f.y + x - f.x); f.x = x;
          sig.ring[ch][sig.pos] = f.y;
        }
        sig.pos = (sig.pos + 1) % N;
      }
      if (rec.isRecording && !finishing.current) {
        // Keep exactly the planned length: 256 samples per second.
        const room = targetRef.current - rec.sampleCount;
        if (room > 0) rec.addRows(room >= rows.length ? rows : rows.slice(0, room));
        if (rec.sampleCount >= targetRef.current) void stopRef.current(true);
      }
      assemblerRef.current.dropped = info.dropped;
      sig.dirty = true;
    });
  }

  const setStep = useCallback((n: Step) => { stepRef.current = n; setStepState(n); }, []);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const resetSignal = useCallback(() => {
    const sig = signal.current;
    sig.ring.forEach((r) => r.fill(NaN));
    hpRef.current.forEach((f) => { f.x = NaN; f.y = 0; });
    qualityRef.current.count = 0;
    assemblerRef.current.reset();
    sig.dirty = true;
  }, []);

  const stopRecording = useCallback(async (completed: boolean) => {
    const rec = recorderRef.current;
    if (!rec.isRecording || finishing.current) return;
    finishing.current = true;
    await rec.stop({ droppedPackets: assemblerRef.current.dropped - droppedAtStart.current, completed });
    finishing.current = false;
    setRecording(false);
    setElapsedSec(rec.durationSec);
    setExported(false);
    setResult({ completed, recordedSec: rec.durationSec });
  }, []);
  stopRef.current = stopRecording;

  /** Stops and deletes the recording in progress (for example the learner took the headband off). */
  const cancelRecording = useCallback(async () => {
    const rec = recorderRef.current;
    if (!rec.isRecording) return;
    finishing.current = true;
    const { id } = await rec.stop({ completed: false });
    await rec.discard(id).catch(() => {});
    rec.session = null; rec.rows = [];
    finishing.current = false;
    setRecording(false);
    setElapsedSec(0);
    setResult(null);
    showToast("Recording cancelled and deleted");
  }, [showToast]);

  const onDeviceStatus = useCallback((state: ConnState, reason: string | undefined, name: string) => {
    setConn({ state, reason, name });
    if (state === "disconnected" && reason === "lost") {
      if (recorderRef.current.isRecording) void stopRecording(false);
      resetSignal();
      setLevels(["waiting", "waiting", "waiting", "waiting"]);
      setStep(2);
    }
  }, [resetSignal, setStep, stopRecording]);

  const pair = useCallback(async (useDemo = false) => {
    unwireRef.current();
    if (deviceRef.current) { try { await deviceRef.current.disconnect(); } catch { /* ignore */ } }
    resetSignal();
    setConnectNote(null);
    if (!useDemo && !isWebBluetoothAvailable()) {
      setConnectNote("unsupported");
      if (stepRef.current < 2) setStep(2);
      return;
    }
    sourceRef.current = useDemo ? "demo" : "muse";
    setSource(sourceRef.current);
    const dev: any = useDemo ? new MockMuseDevice() : new Muse2Device();
    deviceRef.current = dev;
    const onStatus = (e: any) => onDeviceStatus(e.detail.state, e.detail.reason, dev.name);
    const onEeg = (e: any) => assemblerRef.current.push(e.detail);
    const onTelemetry = (e: any) => setBattery(e.detail.battery);
    dev.addEventListener("status", onStatus);
    dev.addEventListener("eeg", onEeg);
    dev.addEventListener("telemetry", onTelemetry);
    unwireRef.current = () => {
      dev.removeEventListener("status", onStatus);
      dev.removeEventListener("eeg", onEeg);
      dev.removeEventListener("telemetry", onTelemetry);
    };
    try {
      await dev.connect();
      await dev.start();
      fitGoodSince.current = 0;
      setStep(3);
    } catch (err: any) {
      setConn({ state: "idle", name: "Muse 2" });
      setConnectNote(err?.name === "NotFoundError" ? "cancelled" : String(err?.message || err));
      deviceRef.current = null;
    }
  }, [onDeviceStatus, resetSignal, setStep]);

  const startRecording = useCallback(async () => {
    const dev = deviceRef.current, rec = recorderRef.current;
    if (!dev?.isConnected || rec.isRecording) return;
    if (stepRef.current < 4) setStep(4);
    finishing.current = false;
    droppedAtStart.current = assemblerRef.current.dropped;
    setResult(null);
    setElapsedSec(0);
    await rec.start({
      learnerId,
      device: dev.name,
      source: sourceRef.current,
      fitAtStart: levelsRef.current,
      plannedDurationSec: seconds,
      app: "alsense/part-iv-baseline@1",
    });
    setRecording(true);
  }, [learnerId, seconds, setStep]);

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const exportCsv = useCallback(async (rec: any = recorderRef.current) => {
    if (!rec.session) return;
    download(rec.toCsvBlob(), `${rec.session.learnerId ? rec.session.learnerId + "_" : ""}${rec.session.id}.csv`);
    await rec.setStatus("exported");
    if (rec === recorderRef.current) setExported(true);
    showToast("CSV exported");
  }, [showToast]);

  const exportRecovered = useCallback(async () => {
    if (!recovered) return;
    const old = new Recorder();
    await old.load(recovered.id);
    await exportCsv(old);
    setRecovered(null);
  }, [recovered, exportCsv]);

  const discardRecovered = useCallback(async () => {
    if (!recovered) return;
    await new Recorder().discard(recovered.id);
    setRecovered(null);
  }, [recovered]);

  const skipFit = useCallback(() => setStep(4), [setStep]);
  const continueFromStep1 = useCallback(() => setStep(2), [setStep]);

  useEffect(() => {
    let alive = true;
    const rec = recorderRef.current;

    // Contact quality twice a second; once all four sensors hold Good or Fair for 2.5 s, move on to recording.
    const qTimer = setInterval(() => {
      if (!deviceRef.current?.isConnected) return;
      const q: { level: Level }[] = qualityRef.current.read();
      const next = q.map((x) => x.level);
      levelsRef.current = next;
      setLevels(next);
      const ready = next.filter((l) => l === "good" || l === "fair").length === 4;
      if (ready) fitGoodSince.current ||= Date.now(); else fitGoodSince.current = 0;
      if (stepRef.current === 3 && fitGoodSince.current && Date.now() - fitGoodSince.current > FIT_HOLD_MS) setStep(4);
    }, 500);
    const sTimer = setInterval(() => { if (rec.isRecording) setElapsedSec(rec.durationSec); }, 250);
    const onUnload = (e: BeforeUnloadEvent) => { if (rec.isRecording) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", onUnload);

    // A recording that was never exported (tab closed, crash) is offered back.
    rec.listUnfinished().catch(() => []).then((list: any[]) => {
      const s = [...list].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
      if (!alive || !s) return;
      setRecovered({
        id: s.id,
        when: new Date(s.startedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
        duration: (s.samples || 0) / SAMPLE_RATE,
      });
    });

    return () => {
      alive = false;
      clearInterval(qTimer); clearInterval(sTimer);
      clearTimeout(toastTimer.current);
      window.removeEventListener("beforeunload", onUnload);
      unwireRef.current();
      const dev = deviceRef.current;
      deviceRef.current = null;
      void (async () => {
        if (rec.isRecording) await stopRecording(false);   // what was recorded is kept
        try { await dev?.disconnect(); } catch { /* ignore */ }
      })();
    };
  }, [setStep, stopRecording]);

  const ready = levels.filter((l) => l === "good" || l === "fair").length;

  return {
    step, conn, battery, levels, ready, fitReady: ready === 4, connectNote, source,
    recording, elapsedSec, secondsLeft: Math.max(0, Math.ceil(seconds - elapsedSec - 1e-9)),
    progress: Math.min(1, elapsedSec / seconds),
    result, exported, recovered, toast, signal,
    pair, startRecording, cancelRecording, exportCsv: () => exportCsv(), exportRecovered, discardRecovered,
    skipFit, continueFromStep1,
  };
}
