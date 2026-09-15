import { EdgeTTS } from 'node-edge-tts';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CACHE_DIR = path.join(os.tmpdir(), 'ater_tts_cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (_e) {}
}

// In-memory buffer cache for ultra-low latency (< 1ms)
export const memoryAudioCache = new Map<string, Buffer>();

export function getTtsCacheKey(text: string, voice: string, rate: string = '+8%'): string {
  const normalized = `${voice}:${rate}:${text.trim()}`;
  return crypto.createHash('md5').update(normalized).digest('hex');
}

export function getCachedAudio(key: string): Buffer | null {
  if (memoryAudioCache.has(key)) {
    return memoryAudioCache.get(key)!;
  }
  const filePath = path.join(CACHE_DIR, `${key}.mp3`);
  if (fs.existsSync(filePath)) {
    try {
      const buf = fs.readFileSync(filePath);
      memoryAudioCache.set(key, buf);
      return buf;
    } catch (_e) {}
  }
  return null;
}

export async function synthesizeAndCacheAudio(
  text: string,
  voice: string = 'en-US-JennyNeural',
  rate: string = '+8%'
): Promise<Buffer> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Empty text cannot be synthesized');
  }

  const key = getTtsCacheKey(trimmed, voice, rate);
  const cached = getCachedAudio(key);
  if (cached) {
    return cached;
  }

  const tts = new EdgeTTS({ voice, rate });
  const tmpFile = path.join(CACHE_DIR, `${key}_${crypto.randomBytes(4).toString('hex')}.tmp.mp3`);
  const finalFile = path.join(CACHE_DIR, `${key}.mp3`);

  await tts.ttsPromise(trimmed, tmpFile);

  if (!fs.existsSync(tmpFile)) {
    throw new Error('TTS output file was not created');
  }

  const buffer = fs.readFileSync(tmpFile);

  try {
    fs.renameSync(tmpFile, finalFile);
  } catch (_e) {
    try {
      fs.writeFileSync(finalFile, buffer);
      fs.unlinkSync(tmpFile);
    } catch (_e2) {}
  }

  memoryAudioCache.set(key, buffer);
  return buffer;
}

/**
 * Pre-warms the TTS cache in the background without blocking execution.
 */
export function warmTtsInBackground(text?: string, voice: string = 'en-US-JennyNeural', rate: string = '+8%'): void {
  if (!text || !text.trim()) return;
  const key = getTtsCacheKey(text, voice, rate);
  if (getCachedAudio(key)) return;

  synthesizeAndCacheAudio(text, voice, rate).catch((err) => {
    console.warn('Background TTS warming failed:', err?.message || err);
  });
}
