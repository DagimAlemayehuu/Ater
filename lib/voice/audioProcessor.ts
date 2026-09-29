/**
 * Audio Processor utilities for Voxide Socratic Voice Engine
 * Handles hardware linear downsampling (mic rate -> 16,000Hz PCM) and PCM streaming.
 */

/**
 * Downsamples Float32Array PCM from mic rate (44.1k/48k) to 16,000Hz Int16 PCM.
 * Clamps audio amplitude to [-1.0, 1.0] to prevent integer overflow.
 */
export function downsampleTo16k(inputData: Float32Array, inputRate: number): Int16Array {
  if (inputRate === 16000) {
    const int16 = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  const ratio = inputRate / 16000;
  const newLen = Math.round(inputData.length / ratio);
  const int16 = new Int16Array(newLen);
  let offsetResult = 0;
  let offsetInput = 0;

  while (offsetResult < int16.length) {
    const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let i = offsetInput; i < nextOffsetInput && i < inputData.length; i++) {
      sum += inputData[i];
      count++;
    }
    const s = Math.max(-1, Math.min(1, count > 0 ? sum / count : 0));
    int16[offsetResult] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    offsetResult++;
    offsetInput = nextOffsetInput;
  }

  return int16;
}

/**
 * Formats an Int16Array to base64 string for WebSocket transmission.
 */
export function int16ToBase64(int16Array: Int16Array): string {
  const uint8 = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

/**
 * Converts a base64 PCM string to Int16Array.
 */
export function base64ToInt16(base64Pcm: string): Int16Array {
  const binary = atob(base64Pcm);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

/**
 * Smooth 24kHz Web Audio PCM player for real-time streaming audio from Gemini.
 */
export class PCMStreamPlayer {
  private sampleRate: number;
  private audioCtx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private isPlaying: boolean = false;
  private activeNodes: AudioBufferSourceNode[] = [];

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  async ensureContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      this.audioCtx = new AudioCtx({ sampleRate: this.sampleRate });
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  feedChunk(base64Pcm: string, onStart?: () => void, onEnd?: () => void): void {
    const int16Array = base64ToInt16(base64Pcm);

    this.ensureContext().then((ctx) => {
      if (!ctx) return;
      const float32 = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32[i] = int16Array[i] / 32768.0;
      }

      const buffer = ctx.createBuffer(1, float32.length, this.sampleRate);
      buffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      if (this.nextStartTime < now) {
        this.nextStartTime = now;
      }
      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
      this.activeNodes.push(source);

      if (!this.isPlaying) {
        this.isPlaying = true;
        if (onStart) onStart();
      }

      source.onended = () => {
        const idx = this.activeNodes.indexOf(source);
        if (idx !== -1) this.activeNodes.splice(idx, 1);
        if (this.activeNodes.length === 0) {
          this.isPlaying = false;
          if (onEnd) onEnd();
        }
      };
    });
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  async pause(): Promise<void> {
    if (this.audioCtx && this.audioCtx.state === 'running') {
      await this.audioCtx.suspend();
    }
  }

  async resume(): Promise<void> {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  stop(): void {
    for (const node of this.activeNodes) {
      try {
        node.stop();
      } catch (_e) {}
    }
    this.activeNodes = [];
    this.isPlaying = false;
    this.nextStartTime = 0;
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }
}
