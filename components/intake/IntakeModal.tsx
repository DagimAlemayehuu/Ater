'use client';

import React, { useState, useRef } from 'react';
import { X, Volume2, Upload, FileText, Trash2, Plus } from 'lucide-react';
import { playNeuralAudio, stopNeuralAudio, onAudioStateChange } from '@/lib/voice/ttsClient';
import { InputVoiceIndicator } from '@/components/voice/InputVoiceIndicator';
import { translations, type AppLanguage } from '@/lib/i18n/translations';
import type {
  CourseCurriculum,
  SocraticDiscoveryQuestion,
  IntakeResponse,
} from '@/types';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCurriculumCreated: (curriculum: CourseCurriculum) => void;
  useMock?: boolean;
  language?: AppLanguage;
}

type ModalStage = 'intake' | 'discovery' | 'synthesizing' | 'roadmap' | 'generating_course';
type IntakeMode = 'prompt' | 'files';

interface UploadedDoc {
  fileName: string;
  fileBase64?: string;
  fileType: string;
  textContent?: string;
  sizeBytes: number;
}

export const IntakeModal: React.FC<IntakeModalProps> = ({
  isOpen,
  onClose,
  onCurriculumCreated,
  useMock = false,
  language = 'en',
}) => {
  const t = translations[language] || translations.en;
  const isAmharic = language === 'am';
  const defaultVoice = isAmharic ? 'am-ET-MekdesNeural' : 'en-US-JennyNeural';
  const [stage, setStage] = useState<ModalStage>('intake');
  const [selectedMode, setSelectedMode] = useState<IntakeMode>('prompt');
  const [promptText, setPromptText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDoc[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Socratic discovery state
  const [topic, setTopic] = useState('');
  const [discoveryQuestions, setDiscoveryQuestions] = useState<SocraticDiscoveryQuestion[]>([]);
  const [initialQuestionCount, setInitialQuestionCount] = useState<number>(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customDetail, setCustomDetail] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [isTranscribingSpeech, setIsTranscribingSpeech] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Stage 4 Roadmap Preview State
  const [generatedCurriculum, setGeneratedCurriculum] = useState<CourseCurriculum | null>(null);
  const [roadmapFeedback, setRoadmapFeedback] = useState('');
  const [isModifyingRoadmap, setIsModifyingRoadmap] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      stopNeuralAudio();
      setSelectedOptions([]);
      setCustomDetail('');
      return;
    }
    const unsub = onAudioStateChange((state, meta) => {
      if (state !== 'playing' || meta?.readerId !== 'intake-question') {
        setIsPlayingAudio(false);
      }
    });
    return () => {
      unsub();
      stopNeuralAudio();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilesAdded = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    setErrorMsg(null);

    filesArray.forEach((file) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isText =
        file.type.startsWith('text/') ||
        file.name.toLowerCase().endsWith('.txt') ||
        file.name.toLowerCase().endsWith('.md') ||
        file.name.toLowerCase().endsWith('.json');

      if (!isPdf && !isText) {
        setErrorMsg(
          isAmharic
            ? 'እባክዎ የፒዲኤፍ (PDF) ወይም የፅሁፍ (TXT, MD) ሰነዶችን ብቻ ይጫኑ።'
            : 'Please upload PDF or text documents (.pdf, .txt, .md).'
        );
        return;
      }

      if (isText) {
        const reader = new FileReader();
        reader.onload = () => {
          const text = (reader.result as string) || '';
          setUploadedFiles((prev) => {
            if (prev.some((f) => f.fileName === file.name)) return prev;
            return [
              ...prev,
              {
                fileName: file.name,
                fileType: 'text/plain',
                textContent: text,
                sizeBytes: file.size,
              },
            ];
          });
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const b64 = (reader.result as string) || '';
          setUploadedFiles((prev) => {
            if (prev.some((f) => f.fileName === file.name)) return prev;
            return [
              ...prev,
              {
                fileName: file.name,
                fileBase64: b64,
                fileType: 'application/pdf',
                sizeBytes: file.size,
              },
            ];
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeUploadedFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.fileName !== fileName));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Submit initial intake (Prompt / Files) -> Triggers Socratic Discovery Interview
  const handleIntakeSubmit = async () => {
    const activeMode = selectedMode || 'prompt';
    if (activeMode === 'prompt' && !promptText.trim()) {
      setErrorMsg(isAmharic ? 'እባክዎ የሚማሩትን ርዕስ ወይም ፅንሰ-ሀሳብ ያስገቡ።' : 'Please provide a learning topic prompt or concept.');
      return;
    }
    if (activeMode === 'files' && uploadedFiles.length === 0) {
      setErrorMsg(isAmharic ? 'እባክዎ ቢያንስ አንድ ሰነድ ያስገቡ።' : 'Please upload at least one document.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payloadFiles = uploadedFiles.map((f) => ({
        fileName: f.fileName,
        fileBase64: f.fileBase64,
        fileType: f.fileType,
        textContent: f.textContent,
      }));

      const res = await fetch('/api/ingest/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeMode === 'prompt' ? 'prompt' : 'document',
          prompt: activeMode === 'prompt' ? promptText.trim() : undefined,
          files: activeMode === 'files' ? payloadFiles : undefined,
          useMock,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`Intake failed with status ${res.status}`);
      }

      const data: IntakeResponse = await res.json();
      const initialQs = data.questions || [];
      setTopic(data.topic);
      setDiscoveryQuestions(initialQs);
      setInitialQuestionCount(initialQs.length);
      setActiveQuestionIdx(0);
      setStage('discovery');

      // Speak first question aloud via Jenny Neural TTS
      if (data.questions && data.questions.length > 0) {
        speakQuestion(data.questions[0]);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to start Socratic discovery interview.');
    } finally {
      setIsLoading(false);
    }
  };

  const speakQuestion = (q: SocraticDiscoveryQuestion) => {
    const textToSpeak = q.spokenPrompt || q.question;
    stopNeuralAudio();
    setIsPlayingAudio(true);
    playNeuralAudio(textToSpeak, {
      voice: defaultVoice,
      readerId: 'intake-question',
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
      onCancel: () => setIsPlayingAudio(false),
    });
  };

  // Speech Recording & Transcription via Gemini for answering Socratic questions verbally
  const toggleSpeechInput = async () => {
    if (isListeningSpeech) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsListeningSpeech(false);
      return;
    }

    stopNeuralAudio();
    setIsPlayingAudio(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsListeningSpeech(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (audioBlob.size < 100) return;

        setIsTranscribingSpeech(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64 = (reader.result as string)?.split(',')[1];
            if (!base64) {
              setIsTranscribingSpeech(false);
              return;
            }

            const res = await fetch('/api/voice/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64, mimeType: audioBlob.type || 'audio/webm', language }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data.transcript) {
                setCustomDetail((prev) => (prev ? `${prev} ${data.transcript.trim()}` : data.transcript.trim()));
              }
            }
            setIsTranscribingSpeech(false);
          };
        } catch {
          setIsTranscribingSpeech(false);
        }
      };

      recorder.start(100);
      setIsListeningSpeech(true);
    } catch {
      setIsListeningSpeech(false);
      setErrorMsg(isAmharic ? 'የማይክሮፎን ፈቃድ አልተገኘም።' : 'Microphone access denied or unavailable.');
    }
  };

  // Next discovery question with dynamic Socratic "Grill Me" follow-up evaluation
  const handleAnswerSubmit = async () => {
    const activeQ = discoveryQuestions[activeQuestionIdx];
    if (!activeQ) return;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListeningSpeech(false);
    }

    // Build compound answer from selected option pills + custom text detail
    const parts: string[] = [];
    if (selectedOptions.length > 0) {
      parts.push(selectedOptions.join(', '));
    }
    if (customDetail.trim()) {
      parts.push(customDetail.trim());
    }
    const finalAnswer = parts.join(' — ') || 'General learning';

    const updatedAnswers = {
      ...answers,
      [activeQ.id]: finalAnswer,
    };
    setAnswers(updatedAnswers);
    setSelectedOptions([]);
    setCustomDetail('');

    // If there is another pre-existing question, advance to it
    if (activeQuestionIdx + 1 < discoveryQuestions.length) {
      const nextIdx = activeQuestionIdx + 1;
      setActiveQuestionIdx(nextIdx);
      speakQuestion(discoveryQuestions[nextIdx]);
      return;
    }

    // Otherwise, ask /api/ingest/grill if the LLM needs more follow-up questions
    setIsLoading(true);
    try {
      const previousQA = Object.entries(updatedAnswers).map(([qId, ans]) => {
        const found = discoveryQuestions.find((q) => q.id === qId);
        return {
          question: found?.question || qId,
          answer: ans,
        };
      });

      const grillRes = await fetch('/api/ingest/grill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || promptText.trim(),
          previousQA,
          language,
          useMock,
        }),
      });

      if (grillRes.ok) {
        const grillData = await grillRes.json();
        if (!grillData.done && grillData.question) {
          // Dynamic Grill Me follow-up question generated!
          const nextQ: SocraticDiscoveryQuestion = grillData.question;
          setDiscoveryQuestions((prev) => [...prev, nextQ]);
          setActiveQuestionIdx((prev) => prev + 1);
          speakQuestion(nextQ);
          setIsLoading(false);
          return;
        }
      }
    } catch (_err) {
      // Fallback: proceed to curriculum creation
    }

    // Finished grilling -> generate curriculum
    handleGenerateCurriculum(updatedAnswers);
  };

  // Generate curriculum roadmap
  const handleGenerateCurriculum = async (finalAnswers: Record<string, string>) => {
    setStage('synthesizing');
    setIsLoading(true);
    stopNeuralAudio();

    try {
      const res = await fetch('/api/curriculum/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          sourceType: selectedMode || 'prompt',
          answers: finalAnswers,
          useMock,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`Curriculum generation failed with status ${res.status}`);
      }

      const curriculum: CourseCurriculum = await res.json();
      stopNeuralAudio();
      setGeneratedCurriculum(curriculum);
      setStage('roadmap');

      // Vocalize teacher explanation of roadmap if available
      if (curriculum.teacherWalkthrough) {
        playNeuralAudio(curriculum.teacherWalkthrough, {
          voice: defaultVoice,
          readerId: 'roadmap-walkthrough',
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isAmharic ? 'ስርዓተ-ትምህርቱን ማዘጋጀት አልተቻለም።' : 'Failed to generate living curriculum.'));
      setStage('discovery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifyRoadmap = async () => {
    if (!generatedCurriculum || !roadmapFeedback.trim()) return;

    setIsModifyingRoadmap(true);
    setErrorMsg(null);
    stopNeuralAudio();

    try {
      const res = await fetch('/api/curriculum/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculum: generatedCurriculum,
          feedback: roadmapFeedback.trim(),
          language,
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || (isAmharic ? 'የትምህርት ካርታውን ማስተካከል አልተቻለም።' : 'Failed to modify roadmap.'));

      setGeneratedCurriculum(updated);
      setRoadmapFeedback('');

      if (updated.teacherWalkthrough) {
        playNeuralAudio(updated.teacherWalkthrough, {
          voice: defaultVoice,
          readerId: 'roadmap-walkthrough',
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isAmharic ? 'የትምህርት ካርታ ማስተካከል ላይ ስህተት ተፈጥሯል።' : 'Error modifying roadmap.'));
    } finally {
      setIsModifyingRoadmap(false);
    }
  };

  const handleApproveRoadmap = () => {
    if (!generatedCurriculum) return;
    stopNeuralAudio();
    setStage('generating_course');
    setTimeout(() => {
      onCurriculumCreated(generatedCurriculum);
      onClose();
    }, 450);
  };

  const handleClose = () => {
    stopNeuralAudio();
    onClose();
  };

  const isFollowUp = activeQuestionIdx >= initialQuestionCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {stage === 'intake' && (isAmharic ? 'አዲስ ኮርስ' : 'New Course')}
              {stage === 'discovery' && (topic || (isAmharic ? 'ልኬት' : 'Calibration'))}
              {stage === 'synthesizing' && (isAmharic ? 'የትምህርት ካርታ በማዘጋጀት ላይ' : 'Generating Roadmap')}
              {stage === 'roadmap' && (generatedCurriculum?.title || generatedCurriculum?.topic || (isAmharic ? 'የትምህርት ካርታ' : 'Roadmap'))}
              {stage === 'generating_course' && (isAmharic ? 'ኮርስ በማዘጋጀት ላይ' : 'Generating Course')}
            </h2>

            {stage === 'intake' && (
              <div className="flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-900 p-0.5 border border-zinc-200/60 dark:border-zinc-800/60 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMode('prompt');
                    setErrorMsg(null);
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                    selectedMode === 'prompt'
                      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  {isAmharic ? 'ርዕስ' : 'Topic'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMode('files');
                    setErrorMsg(null);
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                    selectedMode === 'files'
                      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  {isAmharic ? 'ሰነዶች' : 'Files'}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="rounded-lg p-3 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
              {errorMsg}
            </div>
          )}

          {/* Stage 1: Intake */}
          {stage === 'intake' && (
            <div>
              {selectedMode === 'prompt' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      onFocus={() => setFocusedInput('intake-prompt')}
                      onBlur={() => setFocusedInput(null)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault();
                          if (promptText.trim()) handleIntakeSubmit();
                        }
                      }}
                      placeholder={isAmharic ? 'ምን መማር ይፈልጋሉ? (ምሳሌ፦ ኮምፒውተር ሳይንስ፣ አርቴፊሻል ኢንተለጀንስ)...' : 'What do you want to learn? (e.g. How computers work, Machine Learning)...'}
                      rows={5}
                      autoFocus
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 px-3.5 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 leading-relaxed"
                    />
                    <InputVoiceIndicator
                      isFocused={focusedInput === 'intake-prompt'}
                      isProcessingOverride={isLoading && focusedInput === 'intake-prompt'}
                      language={language}
                      className="top-3 right-3"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Upload Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100/60 dark:bg-zinc-900/60'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/40 dark:bg-zinc-900/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.txt,.md,.json,application/pdf,text/plain,text/markdown"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
                    />

                    <div className="space-y-1.5 flex flex-col items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {isAmharic ? 'ሰነዶችን እዚህ ይጎትቱ ወይም ለመምረጥ ይጫኑ' : 'Drop documents here or click to upload'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {isAmharic ? 'ብዙ ፒዲኤፍ (PDF) እና የፅሁፍ ሰነዶችን መጫን ይችላሉ' : 'Multiple PDF and text documents supported'}
                      </p>
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                        <span>{isAmharic ? 'የተመረጡ ሰነዶች' : 'Attached Documents'} ({uploadedFiles.length})</span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-zinc-700 dark:text-zinc-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isAmharic ? 'ተጨማሪ ጨምር' : 'Add more'}</span>
                        </button>
                      </div>

                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {uploadedFiles.map((f) => (
                          <div
                            key={f.fileName}
                            className="flex items-center justify-between p-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                {f.fileName}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                                {Math.round(f.sizeBytes / 1024)} KB
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUploadedFile(f.fileName);
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                              title={isAmharic ? 'ሰነዱን አስወግድ' : 'Remove document'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stage 2: Socratic Discovery Dialogue */}
          {stage === 'discovery' && discoveryQuestions.length > 0 && (
            <div className="space-y-4">
              {/* Progress Indicator */}
              <div className="space-y-1.5">
                {/* Number indicator for initial set of questions */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>
                    {!isFollowUp
                      ? `${activeQuestionIdx + 1} / ${Math.max(initialQuestionCount, 1)}`
                      : `${Math.max(initialQuestionCount, 1)} / ${Math.max(initialQuestionCount, 1)}`}
                  </span>
                </div>

                {/* Primary Initial Questions Bar */}
                <div className="flex items-center gap-1.5">
                  {discoveryQuestions.slice(0, Math.max(initialQuestionCount, 1)).map((q, idx) => (
                    <div
                      key={q.id}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        idx === activeQuestionIdx && !isFollowUp
                          ? 'bg-zinc-900 dark:bg-zinc-100'
                          : idx < activeQuestionIdx || isFollowUp
                            ? 'bg-zinc-400 dark:bg-zinc-600'
                            : 'bg-zinc-200 dark:bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>

                {/* Follow-up Questions Mini Sub-bar (Shows just 'Follow-up', NO numbers) */}
                {discoveryQuestions.length > initialQuestionCount && (
                  <div className="pt-0.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center text-[10px] text-zinc-400 font-mono">
                      <span>{isAmharic ? 'ተከታታይ ጥያቄ' : 'Follow-up'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {discoveryQuestions.slice(initialQuestionCount).map((q, subIdx) => {
                        const actualIdx = initialQuestionCount + subIdx;
                        return (
                          <div
                            key={q.id}
                            className={`h-0.5 flex-1 rounded-full transition-all ${
                              actualIdx === activeQuestionIdx
                                ? 'bg-zinc-900 dark:bg-zinc-100'
                                : actualIdx < activeQuestionIdx
                                  ? 'bg-zinc-400 dark:bg-zinc-500'
                                  : 'bg-zinc-200/80 dark:bg-zinc-800/80'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Socratic Question Container (NO redundant QUESTION text) */}
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                    {discoveryQuestions[activeQuestionIdx]?.question}
                  </p>

                  <button
                    onClick={() => speakQuestion(discoveryQuestions[activeQuestionIdx])}
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shrink-0 transition-colors"
                    title="Hear question via voice"
                  >
                    <svg className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse text-zinc-900 dark:text-zinc-100' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>

                {/* Dynamic tailored options aligned to the active question with multi-select support */}
                {(() => {
                  const activeQ = discoveryQuestions[activeQuestionIdx];
                  const options = activeQ?.options && activeQ.options.length > 0
                    ? activeQ.options
                    : activeQ?.category === 'goal'
                      ? ['Build a real-world project from scratch', 'Understand the core ideas and principles', 'Prepare for technical interviews or exams', 'Get a clear step-by-step overview']
                      : activeQ?.category === 'baseline'
                        ? ['Complete beginner with zero background', 'Know the basics, want to learn deeper details', 'Experienced, want advanced real-world edge cases', 'Academic background wanting thorough derivations']
                        : ['Focus on common mistakes and practical tips', 'Balance intuition with hands-on examples', 'Deep technical dive', 'Quick high-level summary'];

                  const toggleOption = (opt: string) => {
                    setSelectedOptions((prev) =>
                      prev.includes(opt) ? prev.filter((item) => item !== opt) : [...prev, opt]
                    );
                  };

                  return (
                    <div className="space-y-2 pt-1">
                      {/* Stacked options without dots, easy to read */}
                      <div className="space-y-2">
                        {options.map((option) => {
                          const isSelected = selectedOptions.includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => toggleOption(option)}
                              className={`w-full px-4 py-3 text-sm rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}

                        {/* "Other..." card matching the exact same size, height and border radius */}
                        <div
                          className={`w-full rounded-xl border transition-all relative flex items-center px-4 py-3 ${
                            customDetail.trim()
                              ? 'border-zinc-400 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-900'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <input
                            type="text"
                            value={customDetail}
                            onChange={(e) => setCustomDetail(e.target.value)}
                            onFocus={() => setFocusedInput('other-detail')}
                            onBlur={() => setFocusedInput(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAnswerSubmit();
                              }
                            }}
                            placeholder={isAmharic ? 'ሌላ... (ተጨማሪ ዝርዝር ያክሉ)' : 'Other... (add more detail or custom topic)'}
                            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none pr-10"
                          />
                          <button
                            type="button"
                            onClick={toggleSpeechInput}
                            disabled={isTranscribingSpeech}
                            className={`absolute right-2.5 p-1.5 rounded-md transition-colors ${
                              isListeningSpeech
                                ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 animate-pulse'
                                : isTranscribingSpeech
                                  ? 'text-zinc-400'
                                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                            title={
                              isListeningSpeech
                                ? (isAmharic ? 'የንግግር ግብዓት አቁም' : 'Stop speech recording')
                                : isTranscribingSpeech
                                  ? (isAmharic ? 'እየተገለበጠ ነው...' : 'Transcribing audio...')
                                  : (isAmharic ? 'ድምፅዎን ይናገሩ' : 'Speak response')
                            }
                          >
                            {isTranscribingSpeech ? (
                              <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-800 dark:border-t-zinc-200 rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Stage 3: Synthesizing Roadmap Loader (Minimal & Elegant) */}
          {stage === 'synthesizing' && (
            <div className="py-14 text-center space-y-3">
              <div className="inline-block w-5 h-5 border-[1.5px] border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {isAmharic
                    ? `ለ "${topic || 'ኮርስ'}" የትምህርት ካርታ በማዘጋጀት ላይ...`
                    : `Generating roadmap for "${topic || 'topic'}"...`}
                </p>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  {isAmharic
                    ? 'በሰጧቸው ምላሾች መሰረት የትምህርት ቅደም ተከተል እየተቀመረ ነው።'
                    : 'Calibrating structured lesson sequence based on your responses.'}
                </p>
              </div>
            </div>
          )}

          {/* Stage: Generating Course Transition Loader (Minimal & Elegant) */}
          {stage === 'generating_course' && (
            <div className="py-14 text-center space-y-3">
              <div className="inline-block w-5 h-5 border-[1.5px] border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {isAmharic
                    ? `ለ "${generatedCurriculum?.title || topic || 'ኮርስ'}" ኮርስ በማዘጋጀት ላይ...`
                    : `Generating course for "${generatedCurriculum?.title || topic || 'topic'}"...`}
                </p>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  {isAmharic
                    ? 'የመጀመሪያውን ትምህርት እና የተሟላ ማስታወሻ በማዘጋጀት ላይ።'
                    : 'Preparing Lesson 01 and dynamic mental model notes.'}
                </p>
              </div>
            </div>
          )}

          {/* Stage 4: Interactive Roadmap Review & Modification */}
          {stage === 'roadmap' && generatedCurriculum && (
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {generatedCurriculum.title || generatedCurriculum.topic}
                </h3>
                {generatedCurriculum.targetGoal && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isAmharic ? 'የታለመ ግብ፡ ' : 'Target goal: '}{generatedCurriculum.targetGoal}
                  </p>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {generatedCurriculum.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-start gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <span className="font-mono text-xs text-zinc-400 mt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {lesson.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {lesson.summary}
                      </p>
                    </div>
                    <span className="text-[11px] text-zinc-400 shrink-0 font-mono">
                      {lesson.estimatedMinutes} {isAmharic ? 'ደቂቃ' : 'min'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Real-Time Roadmap Modification Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleModifyRoadmap();
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={roadmapFeedback}
                  onChange={(e) => setRoadmapFeedback(e.target.value)}
                  placeholder={
                    isAmharic
                      ? 'ካርታውን ያሻሽሉ (ለምሳሌ፡ "የላቀ የደህንነት ትምህርት ጨምር")...'
                      : 'Modify roadmap (e.g. "Add advanced practical examples", "Make it deeper")...'
                  }
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <button
                  type="submit"
                  disabled={isModifyingRoadmap || !roadmapFeedback.trim()}
                  className="px-3 py-2 text-xs font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  {isModifyingRoadmap ? (
                    <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
                  ) : (
                    <span>{isAmharic ? 'አሻሽል' : 'Refine'}</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
          <button
            onClick={handleClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            {t.intake.cancel}
          </button>

          {stage === 'intake' && selectedMode !== null && (
            <button
              onClick={handleIntakeSubmit}
              disabled={isLoading || (selectedMode === 'prompt' ? !promptText.trim() : uploadedFiles.length === 0)}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300/80 dark:border-zinc-700/80 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading && (
                <div className="w-3 h-3 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
              )}
              <span>{isLoading ? (isAmharic ? 'እየጫነ ነው...' : 'Loading...') : (isAmharic ? 'ቀጥል' : 'Continue')}</span>
            </button>
          )}

          {stage === 'discovery' && (
            <div className="flex items-center gap-2">
              {/* Secondary action: End exploration / Generate roadmap early (hidden or static during loading) */}
              {!isLoading && (isFollowUp || activeQuestionIdx >= 2) && (
                <button
                  type="button"
                  onClick={() => handleGenerateCurriculum(answers)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  {isFollowUp
                    ? (isAmharic ? 'ማጣሪያውን አጠናቅቅ' : 'End exploration')
                    : (isAmharic ? 'ቀጥታ ካርታ አዘጋጅ' : 'Generate roadmap')}
                </button>
              )}

              {/* Single Primary Action Button with sole loading state */}
              <button
                type="button"
                onClick={handleAnswerSubmit}
                disabled={isLoading}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300/80 dark:border-zinc-700/80 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isLoading && (
                  <div className="w-3 h-3 border-[1.5px] border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
                )}
                <span>
                  {isLoading
                    ? (isAmharic ? 'እየጫነ ነው...' : 'Loading...')
                    : (isAmharic ? 'ቀጣይ ጥያቄ' : 'Next Question')}
                </span>
              </button>
            </div>
          )}

          {stage === 'roadmap' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApproveRoadmap}
                disabled={isLoading || isModifyingRoadmap}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300/80 dark:border-zinc-700/80 transition-colors cursor-pointer shadow-xs"
              >
                {isAmharic ? 'አጽድቅ እና ትምህርት 01 ጀምር' : 'Approve & Start Lesson 01'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
