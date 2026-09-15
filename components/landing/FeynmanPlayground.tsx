'use client';

import React, { useState, useRef } from 'react';
import { Mic, MicOff, Send, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const TABOO_WORDS = ['B-Tree', 'Binary Search', 'Sorted'];

export function FeynmanPlayground() {
  const [inputMode, setInputMode] = useState<'typed' | 'spoken'>('typed');
  const [explanation, setExplanation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<{
    score: string;
    valid: boolean;
    breakdown: string;
    tabooUsed: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  const handleSubmit = async (textToSubmit?: string) => {
    const text = (textToSubmit ?? explanation).trim();
    if (!text) {
      setError('Please enter or speak an explanation before evaluating.');
      return;
    }

    setError(null);
    setEvaluating(true);

    try {
      const res = await fetch('/api/demo/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ explanation: text }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Evaluation failed.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Network error evaluating demo.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleStartRecording = async () => {
    setError(null);
    try {
      // Browser SpeechRecognition API support if available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((r: any) => r[0].transcript)
            .join('');
          setExplanation(transcript);
        };

        recognition.onerror = (e: any) => {
          setIsRecording(false);
          setError(`Microphone error: ${e.error || 'Check browser permissions'}`);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
      } else {
        // Fallback to MediaRecorder for holding state
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
      }
    } catch (e: any) {
      setError('Audio capture permission denied or not supported in this browser.');
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleReset = () => {
    setExplanation('');
    setResult(null);
    setError(null);
  };

  return (
    <section className="w-full max-w-2xl mx-auto px-4 py-6">
      <div className="border border-zinc-800 bg-zinc-950/70 rounded-lg p-6 shadow-2xl relative overflow-hidden">
        {/* Header line */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-300">Live Feynman Test</span>
          </div>
          <div className="flex items-center space-x-1 border border-zinc-800 rounded p-0.5 bg-zinc-900/40 text-[11px] font-mono">
            <button
              onClick={() => setInputMode('typed')}
              className={`px-2.5 py-1 rounded transition-colors ${
                inputMode === 'typed' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Typed
            </button>
            <button
              onClick={() => setInputMode('spoken')}
              className={`px-2.5 py-1 rounded transition-colors ${
                inputMode === 'spoken' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Spoken
            </button>
          </div>
        </div>

        {/* Challenge prompt */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-zinc-100 leading-snug mb-3">
            Can you explain Database Indexing without using the words:
          </h3>
          <div className="flex flex-wrap gap-2 items-center">
            {TABOO_WORDS.map((word) => (
              <span
                key={word}
                className="font-mono text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded flex items-center space-x-1.5"
              >
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider">Locked:</span>
                <span className="font-semibold">{word}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Input Interface */}
        <div className="space-y-4">
          {inputMode === 'typed' ? (
            <div className="relative">
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                placeholder="Type your causal explanation here..."
                disabled={evaluating}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-4 py-3 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors font-sans"
              />
              <button
                onClick={() => handleSubmit()}
                disabled={evaluating || !explanation.trim()}
                className="absolute right-2 top-2 bottom-2 px-3.5 bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-30 disabled:hover:bg-zinc-100 rounded text-xs font-medium flex items-center space-x-1.5 transition-colors"
              >
                {evaluating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Test</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border border-zinc-800/80 bg-zinc-900/30 rounded-md space-y-4">
              <button
                onMouseDown={handleStartRecording}
                onMouseUp={handleStopRecording}
                onTouchStart={handleStartRecording}
                onTouchEnd={handleStopRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all ${
                  isRecording
                    ? 'border-zinc-300 bg-zinc-800 scale-105'
                    : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                }`}
              >
                {isRecording ? (
                  <Mic className="w-6 h-6 text-zinc-100 animate-pulse" />
                ) : (
                  <MicOff className="w-6 h-6 text-zinc-400" />
                )}
              </button>
              <div className="text-center">
                <p className="text-xs font-mono text-zinc-300">
                  {isRecording ? 'Listening... Release to stop' : 'Hold to Speak (Voice Recall)'}
                </p>
                {explanation && (
                  <p className="text-xs text-zinc-400 mt-2 italic max-w-md line-clamp-2">
                    &quot;{explanation}&quot;
                  </p>
                )}
              </div>
              {explanation && !isRecording && (
                <button
                  onClick={() => handleSubmit()}
                  disabled={evaluating}
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded text-xs font-medium hover:bg-white transition-colors"
                >
                  {evaluating ? 'Evaluating...' : 'Evaluate Spoken Explanation'}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start space-x-2 text-xs text-zinc-400 border border-zinc-800 bg-zinc-900/40 p-3 rounded">
              <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Diagnostic Result */}
          {result && (
            <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Evaluation:</span>
                  <span className="text-sm font-mono font-bold text-zinc-100 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                    Score: {result.score}
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Try Again</span>
                </button>
              </div>

              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded text-xs text-zinc-300 leading-relaxed font-sans">
                {result.breakdown}
              </div>

              {result.tabooUsed && result.tabooUsed.length > 0 && (
                <div className="text-[11px] font-mono text-zinc-400">
                  Taboo words detected: <span className="text-zinc-200">{result.tabooUsed.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
