import { downsampleTo16k, int16ToBase64, PCMStreamPlayer } from './audioProcessor';

export interface SocraticVoiceSessionConfig {
  topic?: string;
  tabooWords?: string[];
  initialMode?: 'voice' | 'library';
  isMuted?: boolean;
  language?: 'en' | 'am';
  courseId?: string;
  lessonId?: string;
  question?: string;
  questionNum?: number;
  totalQuestions?: number;
  stage?: 'question' | 'mini_lesson' | 'reading' | 'lesson';
  miniLesson?: string;
  onGrade?: (result: { score: number; feedback: string; id?: string }) => void;
  onToolCall?: (call: { name: string; args: any; id?: string }) => void;
  onTranscript?: (turn: { role: 'user' | 'assistant'; text: string; timestamp: number }) => void;
  onAssistantChunk?: (chunk: { text: string; fullText: string }) => void;
  onLiveSpeech?: (speech: { text: string }) => void;
  onAudioLevel?: (level: { level: number; rms: number }) => void;
  onRecordingStatus?: (status: { recording: boolean; processing: boolean }) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  mockWs?: any;
}

export class SocraticVoiceSession {
  private mode: 'voice' | 'library';
  private muted: boolean;
  private recording: boolean = false;
  private processing: boolean = false;
  private topic: string;
  private tabooWords: string[];
  private language: 'en' | 'am';
  private courseId?: string;
  private lessonId?: string;
  private question?: string;
  private questionNum: number = 1;
  private totalQuestions: number = 3;
  private stage: 'question' | 'mini_lesson' | 'reading' | 'lesson' = 'question';
  private miniLesson?: string;

  private ws: any = null;
  private pcmPlayer: PCMStreamPlayer;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;

  private currentAssistantText: string = '';
  private liveSpeechText: string = '';
  private localSpeechText: string = '';
  private cloudSpeechText: string = '';
  private turnStartTime: number = 0;
  private speechRec: any = null;
  private watchdogTimer: any = null;
  private animFrameId: any = null;

  private onGrade?: (result: { score: number; feedback: string; id?: string }) => void;
  private onToolCall?: (call: { name: string; args: any; id?: string }) => void;
  private onTranscript?: (turn: { role: 'user' | 'assistant'; text: string; timestamp: number }) => void;
  private onAssistantChunk?: (chunk: { text: string; fullText: string }) => void;
  private onLiveSpeech?: (speech: { text: string }) => void;
  private onAudioLevel?: (level: { level: number; rms: number }) => void;
  private onRecordingStatus?: (status: { recording: boolean; processing: boolean }) => void;
  private onConnected?: () => void;
  private onDisconnected?: () => void;

  constructor(config: SocraticVoiceSessionConfig = {}) {
    this.mode = config.initialMode || 'library';
    this.muted = config.isMuted ?? (this.mode === 'library');
    this.topic = config.topic || 'Recursion';
    this.tabooWords = config.tabooWords || ['base case', 'stack', 'call itself'];
    this.language = config.language || 'en';
    this.courseId = config.courseId;
    this.lessonId = config.lessonId;
    this.question = config.question;
    this.questionNum = config.questionNum || 1;
    this.totalQuestions = config.totalQuestions || 3;
    this.stage = config.stage || 'question';
    this.miniLesson = config.miniLesson;

    this.onGrade = config.onGrade;
    this.onToolCall = config.onToolCall;
    this.onTranscript = config.onTranscript;
    this.onAssistantChunk = config.onAssistantChunk;
    this.onLiveSpeech = config.onLiveSpeech;
    this.onAudioLevel = config.onAudioLevel;
    this.onRecordingStatus = config.onRecordingStatus;
    this.onConnected = config.onConnected;
    this.onDisconnected = config.onDisconnected;

    this.pcmPlayer = new PCMStreamPlayer(24000);
    if (config.mockWs) {
      this.ws = config.mockWs;
    }
  }

  getMode(): 'voice' | 'library' {
    return this.mode;
  }

  setMode(mode: 'voice' | 'library'): void {
    this.mode = mode;
    if (mode === 'library') {
      this.stopVoiceCapture();
      this.pcmPlayer.stop();
      this.muted = true;
    } else {
      this.muted = false;
      this.pcmPlayer.ensureContext().catch(() => {});
    }
  }

  isAudioMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.pcmPlayer.stop();
    }
  }

  isRecording(): boolean {
    return this.recording;
  }

  isProcessing(): boolean {
    return this.processing;
  }

  isAudioPlaying(): boolean {
    return this.pcmPlayer.getIsPlaying();
  }

  stopAudio(): void {
    this.pcmPlayer.stop();
  }

  async pauseAudio(): Promise<void> {
    await this.pcmPlayer.pause();
  }

  async resumeAudio(): Promise<void> {
    await this.pcmPlayer.resume();
  }

  restartSession(): void {
    this.pcmPlayer.stop();
    if (this.ws && (this.ws.readyState === 1 || (typeof WebSocket !== 'undefined' && this.ws.readyState === WebSocket.OPEN))) {
      this.ws.send(JSON.stringify({
        type: 'restart',
        topic: this.topic,
        tabooWords: this.tabooWords,
        language: this.language,
        courseId: this.courseId,
        lessonId: this.lessonId,
        question: this.question,
        questionNum: this.questionNum,
        totalQuestions: this.totalQuestions,
        stage: this.stage,
        miniLesson: this.miniLesson,
        force_restart: true,
      }));
    } else {
      this.connect();
    }
  }

  updateSessionContext(context: {
    topic?: string;
    tabooWords?: string[];
    language?: 'en' | 'am';
    courseId?: string;
    lessonId?: string;
    question?: string;
    questionNum?: number;
    totalQuestions?: number;
    stage?: 'question' | 'mini_lesson' | 'reading' | 'lesson';
    miniLesson?: string;
  }): void {
    if (context.topic) this.topic = context.topic;
    if (context.tabooWords) this.tabooWords = context.tabooWords;
    if (context.language) this.language = context.language;
    if (context.courseId) this.courseId = context.courseId;
    if (context.lessonId) this.lessonId = context.lessonId;
    if (context.question !== undefined) this.question = context.question;
    if (context.questionNum !== undefined) this.questionNum = context.questionNum;
    if (context.totalQuestions !== undefined) this.totalQuestions = context.totalQuestions;
    if (context.stage) this.stage = context.stage;
    if (context.miniLesson !== undefined) this.miniLesson = context.miniLesson;

    if (this.ws && (this.ws.readyState === 1 || this.ws.readyState === WebSocket.OPEN)) {
      this.ws.send(JSON.stringify({
        type: 'update_context',
        topic: this.topic,
        tabooWords: this.tabooWords,
        language: this.language,
        courseId: this.courseId,
        lessonId: this.lessonId,
        question: this.question,
        questionNum: this.questionNum,
        totalQuestions: this.totalQuestions,
        stage: this.stage,
        miniLesson: this.miniLesson,
      }));
    }
  }

  async connect(wsHostUrl?: string): Promise<boolean> {
    if (typeof window === 'undefined' && !this.ws) return false;

    if (this.mode === 'voice') {
      this.pcmPlayer.ensureContext().catch(() => {});
    }

    return new Promise((resolve) => {
      // If already connected, do not sever connection - just send update_context
      if (this.ws && (this.ws.readyState === 1 || (typeof WebSocket !== 'undefined' && this.ws.readyState === WebSocket.OPEN))) {
        try {
          this.ws.send(JSON.stringify({
            type: 'update_context',
            topic: this.topic,
            tabooWords: this.tabooWords,
            language: this.language,
            courseId: this.courseId,
            lessonId: this.lessonId,
            question: this.question,
            questionNum: this.questionNum,
            totalQuestions: this.totalQuestions,
            stage: this.stage,
            miniLesson: this.miniLesson,
          }));
        } catch (_e) {}
        resolve(true);
        return;
      }

      // If currently connecting, avoid duplicate sockets
      if (this.ws && typeof WebSocket !== 'undefined' && this.ws.readyState === WebSocket.CONNECTING) {
        resolve(true);
        return;
      }

      let wsUrl: string;
      if (wsHostUrl) {
        wsUrl = wsHostUrl;
      } else {
        const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const port = 3333;
        const queryParams = new URLSearchParams({
          topic: this.topic,
          taboo: this.tabooWords.join(','),
          lang: this.language,
          question: this.question || '',
          qnum: String(this.questionNum || 1),
          total: String(this.totalQuestions || 3),
          stage: this.stage || 'question',
          mini: this.miniLesson || '',
        });
        wsUrl = `${protocol}//${host}:${port}/ws/live?${queryParams.toString()}`;
      }

      try {
        const WebSocketClass = (typeof WebSocket !== 'undefined') ? WebSocket : (globalThis as any).WebSocket;
        if (!WebSocketClass) {
          resolve(false);
          return;
        }

        this.ws = new WebSocketClass(wsUrl);

        this.ws.onopen = () => {
          this.onConnected?.();
          this.ws.send(JSON.stringify({
            type: 'session_init',
            topic: this.topic,
            tabooWords: this.tabooWords,
            language: this.language,
            courseId: this.courseId,
            lessonId: this.lessonId,
            question: this.question,
            questionNum: this.questionNum,
            totalQuestions: this.totalQuestions,
            stage: this.stage,
            miniLesson: this.miniLesson,
          }));
          resolve(true);
        };

        this.ws.onmessage = (event: any) => {
          try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            this.handleServerMessage(data);
          } catch (_err) {}
        };

        this.ws.onerror = (_err: any) => {
          resolve(false);
        };

        this.ws.onclose = () => {
          this.onDisconnected?.();
        };
      } catch (_err) {
        resolve(false);
      }
    });
  }

  disconnect(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.speechRec) {
      try {
        this.speechRec.stop();
      } catch (_e) {}
      this.speechRec = null;
    }
    this.stopVoiceCapture();
    this.pcmPlayer.stop();
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_e) {}
      this.ws = null;
    }
  }

  async handleServerMessage(msg: any): Promise<void> {
    if (!msg || !msg.type) return;

    if (msg.type === 'user_speech_chunk') {
      this.cloudSpeechText += msg.text;
      this.liveSpeechText = this.cloudSpeechText;
      this.onLiveSpeech?.({ text: this.liveSpeechText });
    } else if (msg.type === 'text_chunk') {
      this.currentAssistantText += msg.text;
      this.onAssistantChunk?.({ text: msg.text, fullText: this.currentAssistantText });
    } else if (msg.type === 'audio_chunk') {
      if (!this.muted && msg.data) {
        this.pcmPlayer.feedChunk(msg.data);
      }
    } else if (msg.type === 'tool_call') {
      if (msg.name === 'gradeExplanation') {
        const args = msg.args || {};
        this.onGrade?.({
          score: Number(args.score) || 0,
          feedback: args.feedback || '',
          id: msg.id,
        });
      }
      this.onToolCall?.({
        name: msg.name,
        args: msg.args || {},
        id: msg.id,
      });
    } else if (msg.type === 'turn_complete') {
      if (this.watchdogTimer) {
        clearTimeout(this.watchdogTimer);
        this.watchdogTimer = null;
      }
      const userText = (this.cloudSpeechText || this.localSpeechText || this.liveSpeechText).trim();
      if (userText) {
        this.onTranscript?.({
          role: 'user',
          text: userText,
          timestamp: Date.now(),
        });
      }
      this.liveSpeechText = '';
      this.localSpeechText = '';
      this.cloudSpeechText = '';

      if (this.currentAssistantText.trim()) {
        this.onTranscript?.({
          role: 'assistant',
          text: this.currentAssistantText.trim(),
          timestamp: Date.now(),
        });
        this.currentAssistantText = '';
      }
      this.processing = false;
      this.onRecordingStatus?.({ recording: false, processing: false });
    }
  }

  handleHoldToTalkStart(): void {
    if (this.recording) return;
    this.pcmPlayer.stop();
    this.recording = true;
    this.processing = false;
    this.liveSpeechText = '';
    this.localSpeechText = '';
    this.cloudSpeechText = '';
    this.onRecordingStatus?.({ recording: true, processing: false });
  }

  handleHoldToTalkEnd(): void {
    if (!this.recording) return;
    this.recording = false;
    this.processing = true;
    this.turnStartTime = Date.now();
    this.onRecordingStatus?.({ recording: false, processing: true });

    if (this.speechRec) {
      try {
        this.speechRec.stop();
      } catch (_e) {}
      this.speechRec = null;
    }

    const finalUserText = (this.cloudSpeechText || this.localSpeechText || this.liveSpeechText).trim();

    if (this.ws && (this.ws.readyState === 1 || (typeof WebSocket !== 'undefined' && this.ws.readyState === WebSocket.OPEN))) {
      this.ws.send(JSON.stringify({
        type: 'end_of_turn',
        is_audio: true,
        text: finalUserText,
      }));
    }

    // 7-second watchdog to guarantee processing never gets stuck
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
    }
    this.watchdogTimer = setTimeout(() => {
      if (this.processing) {
        console.warn('[socraticSession] Turn watchdog timeout: resetting processing state after 7s');
        const textToSave = (this.cloudSpeechText || this.localSpeechText || this.liveSpeechText).trim();
        if (textToSave) {
          this.onTranscript?.({
            role: 'user',
            text: textToSave,
            timestamp: Date.now(),
          });
        }
        this.liveSpeechText = '';
        this.localSpeechText = '';
        this.cloudSpeechText = '';
        this.processing = false;
        this.onRecordingStatus?.({ recording: false, processing: false });
      }
    }, 7000);
  }

  feedAudioChunk(inputData: Float32Array, inputRate: number): void {
    if (!this.recording || !this.ws) return;

    const int16 = downsampleTo16k(inputData, inputRate);
    const b64 = int16ToBase64(int16);

    if (this.ws.readyState === 1 || (typeof WebSocket !== 'undefined' && this.ws.readyState === WebSocket.OPEN)) {
      this.ws.send(JSON.stringify({
        type: 'audio_chunk',
        data: b64,
      }));
    }
  }

  async sendText(text: string): Promise<void> {
    const cleanText = text.trim();
    if (!cleanText) return;

    this.turnStartTime = Date.now();
    this.onTranscript?.({
      role: 'user',
      text: cleanText,
      timestamp: Date.now(),
    });

    if (this.ws && (this.ws.readyState === 1 || (typeof WebSocket !== 'undefined' && this.ws.readyState === WebSocket.OPEN))) {
      this.ws.send(JSON.stringify({
        type: 'user_text',
        text: cleanText,
      }));
    } else {
      throw new Error('WebSocket connection not open');
    }
  }

  private async ensureMic(): Promise<MediaStream | null> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return null;

    try {
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioContext && AudioCtx) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (this.mediaStream && this.audioContext && !this.scriptProcessor) {
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
        source.connect(this.scriptProcessor);

        const muteGain = this.audioContext.createGain();
        muteGain.gain.value = 0;
        this.scriptProcessor.connect(muteGain);
        muteGain.connect(this.audioContext.destination);

        this.scriptProcessor.onaudioprocess = (e) => {
          if (!this.recording) return;
          const channel = e.inputBuffer.getChannelData(0);
          this.feedAudioChunk(channel, this.audioContext?.sampleRate || 48000);
        };
      }

      return this.mediaStream;
    } catch (err) {
      console.error('[socraticSession] Mic setup error:', err);
      return null;
    }
  }

  async startVoiceCapture(): Promise<void> {
    if (this.mode !== 'voice') {
      this.setMode('voice');
    }
    if (this.recording) return;
    this.pcmPlayer.stop();

    await this.ensureMic();

    // Start audio RMS frequency meter loop
    if (this.analyser) {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
      }
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const checkLevel = () => {
        if (this.analyser && this.recording) {
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          const level = Math.min(1.0, avg / 128.0);
          this.onAudioLevel?.({ level, rms: avg });
          this.animFrameId = requestAnimationFrame(checkLevel);
        }
      };
      this.animFrameId = requestAnimationFrame(checkLevel);
    }

    // Launch local Web Speech recognition for instant, zero-latency visual transcription
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          if (this.speechRec) {
            try { this.speechRec.stop(); } catch (_e) {}
          }
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = this.language === 'am' ? 'am-ET' : 'en-US';
          rec.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; ++i) {
              fullText += event.results[i][0].transcript;
            }
            if (fullText.trim()) {
              this.localSpeechText = fullText.trim();
              if (!this.cloudSpeechText) {
                this.liveSpeechText = this.localSpeechText;
                this.onLiveSpeech?.({ text: this.liveSpeechText });
              }
            }
          };
          rec.onerror = (e: any) => {
            console.warn('[socraticSession] Web Speech recognition error:', e.error);
          };
          rec.start();
          this.speechRec = rec;
        } catch (e) {
          console.warn('[socraticSession] Web Speech not started:', e);
        }
      }
    }

    this.handleHoldToTalkStart();
  }

  stopVoiceCapture(): void {
    this.handleHoldToTalkEnd();
  }
}

export function createSocraticVoiceSession(config: SocraticVoiceSessionConfig = {}): SocraticVoiceSession {
  return new SocraticVoiceSession(config);
}
