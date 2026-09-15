export type AudioPlaybackState = 'idle' | 'playing' | 'paused';

export interface AudioPlaybackMetadata {
  text?: string;
  voice?: string;
  readerId?: string;
}

export type AudioStateListener = (state: AudioPlaybackState, meta?: AudioPlaybackMetadata) => void;

export interface PlayAudioOptions {
  voice?: string;
  readerId?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onCancel?: () => void;
}

// Global Audio Coordinator Singleton State
let currentSessionId = 0;
let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
let currentPlaybackState: AudioPlaybackState = 'idle';
let currentReaderId: string | null = null;
let activeSpokenText: string | null = null;
let lastSpokenText: string | null = null;
let lastSpokenOptions: PlayAudioOptions | null = null;
let activeAbortController: AbortController | null = null;

const stateListeners = new Set<AudioStateListener>();
const clientAudioCache = new Map<string, Blob>();

function setPlaybackState(state: AudioPlaybackState, meta?: AudioPlaybackMetadata): void {
  currentPlaybackState = state;
  const dispatchMeta: AudioPlaybackMetadata = meta || {
    text: activeSpokenText || undefined,
    readerId: currentReaderId || undefined,
  };

  stateListeners.forEach((listener) => {
    try {
      listener(state, dispatchMeta);
    } catch (_e) {}
  });
}

export function getAudioPlaybackState(): AudioPlaybackState {
  return currentPlaybackState;
}

export function getActiveSpokenText(): string | null {
  return activeSpokenText;
}

export function getActiveReaderId(): string | null {
  return currentReaderId;
}

export function isVoicePlaying(): boolean {
  return currentPlaybackState === 'playing';
}

export function onAudioStateChange(listener: AudioStateListener): () => void {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

/**
 * Stop and synchronously silence any currently active audio element and in-flight fetch.
 */
function cleanupCurrentAudio(): void {
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch (_e) {}
    activeAbortController = null;
  }

  if (currentAudio) {
    try {
      currentAudio.onplay = null;
      currentAudio.onpause = null;
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
    } catch (_e) {}
    currentAudio = null;
  }

  if (currentObjectUrl) {
    try {
      URL.revokeObjectURL(currentObjectUrl);
    } catch (_e) {}
    currentObjectUrl = null;
  }
}

/**
 * Stops all ongoing voice playback and cancels any pending TTS synthesis.
 * Guarantees zero overlapping audio.
 */
export function stopNeuralAudio(): void {
  // Invalidate any in-flight asynchronous operations
  currentSessionId++;

  const prevOptions = lastSpokenOptions;
  lastSpokenOptions = null;
  activeSpokenText = null;
  currentReaderId = null;

  cleanupCurrentAudio();
  setPlaybackState('idle', { text: '', readerId: '' });

  if (prevOptions?.onCancel) {
    try {
      prevOptions.onCancel();
    } catch (_e) {}
  }
}

export const stopAllAudio = stopNeuralAudio;

export function pauseNeuralAudio(): void {
  if (currentAudio && !currentAudio.paused) {
    try {
      currentAudio.pause();
      setPlaybackState('paused', {
        text: activeSpokenText || undefined,
        readerId: currentReaderId || undefined,
      });
    } catch (_e) {}
  }
}

export function resumeNeuralAudio(): void {
  if (currentAudio && currentAudio.paused) {
    try {
      currentAudio.play();
      setPlaybackState('playing', {
        text: activeSpokenText || undefined,
        readerId: currentReaderId || undefined,
      });
    } catch (_e) {}
  } else if (!currentAudio && lastSpokenText) {
    playNeuralAudio(lastSpokenText, lastSpokenOptions || {});
  }
}

export function restartNeuralAudio(): void {
  if (currentAudio) {
    try {
      currentAudio.currentTime = 0;
      currentAudio.play();
      setPlaybackState('playing', {
        text: activeSpokenText || undefined,
        readerId: currentReaderId || undefined,
      });
      return;
    } catch (_e) {}
  }
  if (lastSpokenText) {
    playNeuralAudio(lastSpokenText, lastSpokenOptions || {});
  }
}

/**
 * Preload audio into memory cache silently so playback is instant.
 */
export async function preloadNeuralAudio(text: string, voice: string = 'en-US-JennyNeural'): Promise<void> {
  if (typeof window === 'undefined' || !text || !text.trim()) return;
  const key = `${voice}:${text.trim()}`;
  if (clientAudioCache.has(key)) return;

  try {
    const res = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
    if (res.ok) {
      const blob = await res.blob();
      clientAudioCache.set(key, blob);
    }
  } catch (_e) {}
}

/**
 * Plays base64-encoded audio through the single global coordinator,
 * ensuring it cancels and preempts any TTS voice reader.
 */
export async function playBase64Audio(
  base64: string,
  options: PlayAudioOptions = {}
): Promise<void> {
  if (typeof window === 'undefined' || !base64) return;

  // Preempt any active or pending audio
  stopNeuralAudio();
  const sessionId = ++currentSessionId;

  currentReaderId = options.readerId || 'base64-audio';
  lastSpokenOptions = options;

  try {
    let objectUrl: string;
    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      objectUrl = URL.createObjectURL(blob);
    } catch {
      objectUrl = `data:audio/mp3;base64,${base64}`;
    }

    if (sessionId !== currentSessionId) {
      if (objectUrl.startsWith('blob:')) URL.revokeObjectURL(objectUrl);
      return;
    }

    currentObjectUrl = objectUrl.startsWith('blob:') ? objectUrl : null;
    const audio = new Audio(objectUrl);
    currentAudio = audio;

    audio.onplay = () => {
      if (sessionId !== currentSessionId) {
        try { audio.pause(); } catch {}
        return;
      }
      setPlaybackState('playing', { readerId: options.readerId });
      options.onStart?.();
    };

    audio.onpause = () => {
      if (sessionId === currentSessionId && currentAudio && !currentAudio.ended) {
        setPlaybackState('paused', { readerId: options.readerId });
      }
    };

    audio.onended = () => {
      if (sessionId === currentSessionId) {
        stopNeuralAudio();
        options.onEnd?.();
      }
    };

    audio.onerror = (e) => {
      if (sessionId === currentSessionId) {
        stopNeuralAudio();
        options.onError?.(e);
      }
    };

    setPlaybackState('playing', { readerId: options.readerId });
    await audio.play();
  } catch (err) {
    if (sessionId === currentSessionId) {
      stopNeuralAudio();
      options.onError?.(err);
    }
  }
}

/**
 * Plays neural TTS speech through the single global coordinator.
 * Preempts any active speech or in-flight TTS generation so only one voice speaks at a time.
 */
export async function playNeuralAudio(
  text: string,
  options: PlayAudioOptions = {}
): Promise<void> {
  if (typeof window === 'undefined' || !text || !text.trim()) return;

  // Immediately preempt and silence any active playback
  stopNeuralAudio();

  // Create a new distinct session token for this playback request
  const sessionId = ++currentSessionId;
  const voice = options.voice || 'en-US-JennyNeural';
  const readerId = options.readerId || 'tts-reader';

  lastSpokenText = text;
  lastSpokenOptions = options;
  activeSpokenText = text;
  currentReaderId = readerId;

  const controller = new AbortController();
  activeAbortController = controller;

  try {
    const cacheKey = `${voice}:${text.trim()}`;
    let blob = clientAudioCache.get(cacheKey);

    if (!blob) {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
        signal: controller.signal,
      });

      // If preempted while fetching, bail out immediately
      if (sessionId !== currentSessionId) return;

      if (!res.ok) {
        throw new Error(`TTS API returned status ${res.status}`);
      }

      blob = await res.blob();
      if (sessionId !== currentSessionId) return;
      clientAudioCache.set(cacheKey, blob);
    }

    if (sessionId !== currentSessionId) return;

    const objectUrl = URL.createObjectURL(blob);
    currentObjectUrl = objectUrl;

    const audio = new Audio(objectUrl);
    currentAudio = audio;

    audio.onplay = () => {
      if (sessionId !== currentSessionId) {
        try { audio.pause(); } catch {}
        return;
      }
      setPlaybackState('playing', { text, voice, readerId });
      options.onStart?.();
    };

    audio.onpause = () => {
      if (sessionId === currentSessionId && currentAudio && !currentAudio.ended) {
        setPlaybackState('paused', { text, voice, readerId });
      }
    };

    audio.onended = () => {
      if (sessionId === currentSessionId) {
        stopNeuralAudio();
        options.onEnd?.();
      }
    };

    audio.onerror = (e) => {
      if (sessionId === currentSessionId) {
        stopNeuralAudio();
        options.onError?.(e);
      }
    };

    setPlaybackState('playing', { text, voice, readerId });
    await audio.play();
  } catch (err: any) {
    if (err?.name === 'AbortError' || sessionId !== currentSessionId) {
      // Intentionally aborted by preemption; no error to report
      return;
    }
    console.error('TTS playback error:', err);
    if (sessionId === currentSessionId) {
      stopNeuralAudio();
      options.onError?.(err);
    }
  }
}
