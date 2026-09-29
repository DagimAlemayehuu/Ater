import os
import sys
import json
import base64
import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from google import genai
from google.genai import types

# 1. Load .env.local
env_path = Path(__file__).resolve().parent.parent / '.env.local'
GEMINI_API_KEY = None
if env_path.exists():
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('GEMINI_API_KEY='):
                GEMINI_API_KEY = line.split('=', 1)[1].strip()
                os.environ['GEMINI_API_KEY'] = GEMINI_API_KEY
                break

if not GEMINI_API_KEY:
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

MODEL_NAME = os.getenv('GEMINI_LIVE_MODEL', 'gemini-2.5-flash-native-audio-latest')
PORT = int(os.getenv('VOXIDE_PORT', 3333))

app = FastAPI(title="Ater Socratic Live Audio Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socratic Tools Declaration
tools_def = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name='gradeExplanation',
                description='Update the learner conceptual score (0-100) and provide brief Socratic feedback critique.',
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        'score': types.Schema(type=types.Type.NUMBER, description='Conceptual score between 0 and 100'),
                        'feedback': types.Schema(type=types.Type.STRING, description='Concise critique pointing out gaps or praising depth')
                    },
                    required=['score', 'feedback']
                )
            ),
            types.FunctionDeclaration(
                name='triggerMiniLesson',
                description='Trigger the remedial mini-lesson when the student admits they do not know, asks for explanation, or expresses fundamental confusion on the current defense question.',
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        'reason': types.Schema(type=types.Type.STRING, description='Why the mini-lesson was triggered (e.g. unknown, misconception, taboo violation)'),
                        'coreConcept': types.Schema(type=types.Type.STRING, description='The key causal insight or first-principles explanation to teach')
                    },
                    required=['reason', 'coreConcept']
                )
            ),
            types.FunctionDeclaration(
                name='advanceQuestion',
                description='Advance the defense battery to the next question when the student successfully masters the current question.',
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        'nextIndex': types.Schema(type=types.Type.NUMBER, description='The next question index (1-based, e.g. 2 or 3)'),
                        'feedback': types.Schema(type=types.Type.STRING, description='Brief congratulatory Socratic feedback')
                    },
                    required=['nextIndex']
                )
            ),
            types.FunctionDeclaration(
                name='toggleTheme',
                description='Toggle the interface theme between dark and light',
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        'theme': types.Schema(type=types.Type.STRING, enum=['dark', 'light'])
                    },
                    required=['theme']
                )
            )
        ]
    )
]

def build_system_prompt(
    topic: str,
    taboo_words: List[str],
    lang: str,
    question: Optional[str] = None,
    question_num: int = 1,
    total_questions: int = 3,
    stage: str = "question",
    mini_lesson: Optional[str] = None,
) -> str:
    taboo_str = ", ".join(f"'{w}'" for w in taboo_words) if taboo_words else "none"
    lang_rule = "Speak in Amharic (አማርኛ) unless addressed in English." if lang == 'am' else "Speak ONLY in English."

    question_text = question.strip() if question else f"Explain the core mechanism and causal purpose of {topic}."

    if stage in ("reading", "lesson"):
        explanation_text = question.strip() if question else f"Here is the lesson for {topic}."
        return f"""You are Ater's voice narrator for "{topic}".
The student is currently listening to Section {question_num} of {total_questions}.

TRANSCRIPTION TO READ:
"{explanation_text}"

YOUR MISSION & RULES:
1. When this section begins, immediately read the exact transcription above aloud word-for-word in a natural, clear, human voice. Do not summarize, do not hallucinate, and do not add filler or commentary. Read the exact text provided above.
2. After finishing reading the transcription, stay silent and ready. If the student speaks, asks a question, or greets you, respond conversationally and helpfully in 1-2 natural sentences:
   - If they greet you (e.g. "hello", "hi"), greet them back warmly and ask what question they have about "{topic}".
   - If they ask a question or request explanation, answer directly, simply, and causally from first principles.
3. {lang_rule}
"""

    if stage == "mini_lesson":
        lesson_text = mini_lesson.strip() if mini_lesson else "State transitions must follow a strict causal order so intermediate failures never corrupt invariants."
        return f"""You are Ater's real-time Socratic Examiner in MINI-LESSON REMEDIATION mode for "{topic}".
The student was unsure or requested explanation on Question {question_num} of {total_questions}.

FOUNDATIONAL MINI-LESSON TO TEACH:
"{lesson_text}"

YOUR MISSION & RULES:
1. When this remediation session begins, immediately teach the causal rule above directly to the student in 1-2 punchy, conversational spoken sentences, then ask a simple check question to test their understanding.
2. Keep spoken responses short (1-2 sentences maximum). Do not lecture or waffle.
3. {lang_rule}
"""

    return f"""You are Ater's real-time Socratic Examiner conducting an oral defense for "{topic}".

ACTIVE DEFENSE QUESTION (Question {question_num} of {total_questions}):
"{question_text}"

TABOO FORBIDDEN WORDS:
{taboo_str}
(The student is strictly forbidden from using these crutches).

YOUR MISSION & RULES:
1. When the session begins, immediately ask this active defense question aloud to the student in 1 natural sentence, then wait for the student's answer.
2. EVALUATE THE ACTIVE QUESTION: The student is answering the question above. Judge whether they explain the causal "why and how" from first principles.
3. BREVITY: Keep all spoken responses short, conversational, and direct (1-2 sentences maximum).
4. UNCERTAINTY & STRUGGLE: If the student says "I don't know", "explain it", "I need you to explain", "no idea", or shows a fundamental conceptual gap, IMMEDIATELY call the 'triggerMiniLesson' tool! Do NOT ask them vague questions back. Teach them directly.
5. TABOO WORDS: If they use a forbidden word ({taboo_str}), point it out directly and challenge them to re-explain without the buzzword.
6. MASTERED: If their explanation is causal, accurate, and avoids taboo buzzwords, call the 'gradeExplanation' tool with score >= 80 and praise their depth. Then call 'advanceQuestion'.
7. {lang_rule}
"""

@app.get('/api/health')
async def health():
    return {
        'status': 'online',
        'model': MODEL_NAME,
        'live_api': True,
        'port': PORT
    }

class ActiveGeminiBridge:
    def __init__(self, websocket: WebSocket):
        self.ws = websocket
        self.client = genai.Client()
        self.live_session = None
        self.live_ctx = None
        self.receive_task = None
        self.turn_in_progress = False

    async def start_session(
        self,
        topic: str,
        taboo_words: List[str],
        lang: str,
        question: Optional[str],
        question_num: int,
        total_questions: int,
        stage: str,
        mini_lesson: Optional[str],
    ):
        await self.close_session()

        system_prompt = build_system_prompt(
            topic=topic,
            taboo_words=taboo_words,
            lang=lang,
            question=question,
            question_num=question_num,
            total_questions=total_questions,
            stage=stage,
            mini_lesson=mini_lesson,
        )

        config = types.LiveConnectConfig(
            response_modalities=['AUDIO'],
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
            tools=tools_def,
            system_instruction=types.Content(
                parts=[types.Part.from_text(text=system_prompt)]
            )
        )

        self.live_ctx = self.client.aio.live.connect(model=MODEL_NAME, config=config)
        self.live_session = await self.live_ctx.__aenter__()

        await self.ws.send_json({
            'type': 'session_ready',
            'model': MODEL_NAME,
            'topic': topic,
            'question': question,
            'questionNum': question_num,
            'totalQuestions': total_questions,
            'stage': stage,
            'tabooWords': taboo_words,
            'message': 'Connected to Gemini Live Multimodal Dialog'
        })

        async def receive_from_gemini():
            try:
                while True:
                    async for response in self.live_session.receive():
                        sc = response.server_content
                        if sc:
                            self.turn_in_progress = True
                            if getattr(sc, 'input_transcription', None) and sc.input_transcription.text:
                                await self.ws.send_json({
                                    'type': 'user_speech_chunk',
                                    'text': sc.input_transcription.text
                                })

                            if getattr(sc, 'output_transcription', None) and sc.output_transcription.text:
                                await self.ws.send_json({
                                    'type': 'text_chunk',
                                    'text': sc.output_transcription.text
                                })

                            if sc.model_turn:
                                for part in sc.model_turn.parts:
                                    if part.text and not getattr(part, 'thought', False):
                                        await self.ws.send_json({
                                            'type': 'text_chunk',
                                            'text': part.text
                                        })
                                    if part.inline_data:
                                        b64_audio = base64.b64encode(part.inline_data.data).decode('utf-8')
                                        await self.ws.send_json({
                                            'type': 'audio_chunk',
                                            'data': b64_audio,
                                            'mime': part.inline_data.mime_type
                                        })

                            if sc.turn_complete:
                                self.turn_in_progress = False
                                await self.ws.send_json({
                                    'type': 'turn_complete'
                                })
                                break

                        tool_call = response.tool_call
                        if tool_call:
                            self.turn_in_progress = True
                            function_responses = []
                            for fc in tool_call.function_calls:
                                call_args = fc.args or {}
                                await self.ws.send_json({
                                    'type': 'tool_call',
                                    'id': fc.id,
                                    'name': fc.name,
                                    'args': call_args
                                })
                                function_responses.append(
                                    types.FunctionResponse(
                                        id=fc.id,
                                        name=fc.name,
                                        response={'status': 'executed', 'args': call_args}
                                    )
                                )
                            await self.live_session.send_tool_response(function_responses=function_responses)
            except asyncio.CancelledError:
                pass
            except Exception as e:
                print(f"[live_server] Gemini receive error: {e}", file=sys.stderr)

        self.receive_task = asyncio.create_task(receive_from_gemini())

        # Trigger opening turn directly from the system instruction without fake directives
        if question or stage in ("mini_lesson", "reading", "lesson"):
            if stage in ("reading", "lesson"):
                init_text = f"[Session Started: Read the Section {question_num} transcription aloud now word-for-word.]"
            elif stage == "mini_lesson":
                init_text = f"[Session Started: Teach the mini-lesson remediation now aloud in 1-2 punchy spoken sentences.]"
            else:
                init_text = f"[Session Started: Ask Defense Question {question_num} now aloud in 1 sentence.]"

            try:
                self.turn_in_progress = True
                await self.live_session.send_client_content(
                    turns=[
                        types.Content(
                            role='user',
                            parts=[types.Part.from_text(text=init_text)]
                        )
                    ],
                    turn_complete=True
                )
            except Exception as e:
                print(f"[live_server] Opening oral prompt error: {e}", file=sys.stderr)

    async def send_user_text(self, text: str):
        if self.live_session and text:
            self.turn_in_progress = True
            await self.live_session.send_client_content(
                turns=[
                    types.Content(
                        role='user',
                        parts=[types.Part.from_text(text=text)]
                    )
                ],
                turn_complete=True
            )

    async def send_audio_chunk(self, raw_bytes: bytes):
        if self.live_session and raw_bytes:
            await self.live_session.send_realtime_input(
                media=types.Blob(
                    mime_type='audio/pcm;rate=16000',
                    data=raw_bytes
                )
            )

    async def end_of_audio_turn(self, text_hint: str):
        if not self.live_session:
            return
        await self.live_session.send_realtime_input(audio_stream_end=True)

        async def audio_turn_watchdog(hint: str):
            await asyncio.sleep(3.5)
            if not self.turn_in_progress and hint:
                try:
                    await self.send_user_text(hint)
                except Exception as exc:
                    print(f"[live_server] Fallback error: {exc}", file=sys.stderr)
            await asyncio.sleep(2.5)
            if not self.turn_in_progress:
                try:
                    await self.ws.send_json({'type': 'turn_complete'})
                except Exception:
                    pass

        asyncio.create_task(audio_turn_watchdog(text_hint))

    async def close_session(self):
        if self.receive_task:
            self.receive_task.cancel()
            try:
                await self.receive_task
            except asyncio.CancelledError:
                pass
            self.receive_task = None

        if self.live_ctx and self.live_session:
            try:
                await self.live_ctx.__aexit__(None, None, None)
            except Exception:
                pass
            self.live_ctx = None
            self.live_session = None

@app.websocket('/ws/live')
async def websocket_live_endpoint(
    websocket: WebSocket,
    topic: Optional[str] = Query(default="Recursion"),
    taboo: Optional[str] = Query(default="base case,stack,call itself"),
    lang: Optional[str] = Query(default="en"),
    question: Optional[str] = Query(default=None),
    qnum: Optional[int] = Query(default=1),
    total: Optional[int] = Query(default=3),
    stage: Optional[str] = Query(default="question"),
    mini: Optional[str] = Query(default=None)
):
    await websocket.accept()

    taboo_list = [w.strip() for w in taboo.split(",") if w.strip()] if taboo else []
    current_topic = topic or "Recursion"
    current_question = question
    current_qnum = qnum or 1
    current_total = total or 3
    current_stage = stage or "question"
    current_mini = mini
    current_lang = lang or "en"

    bridge = ActiveGeminiBridge(websocket)

    try:
        await bridge.start_session(
            topic=current_topic,
            taboo_words=taboo_list,
            lang=current_lang,
            question=current_question,
            question_num=current_qnum,
            total_questions=current_total,
            stage=current_stage,
            mini_lesson=current_mini,
        )

        while True:
            raw_data = await websocket.receive_text()
            try:
                msg = json.loads(raw_data)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get('type')

            if msg_type == 'user_text':
                text = msg.get('text', '').strip()
                if text:
                    await bridge.send_user_text(text)

            elif msg_type == 'audio_chunk':
                b64_data = msg.get('data')
                if b64_data:
                    raw_bytes = base64.b64decode(b64_data)
                    await bridge.send_audio_chunk(raw_bytes)

            elif msg_type in ('session_init', 'update_context', 'restart'):
                prev_stage = current_stage
                prev_question = current_question
                prev_qnum = current_qnum
                force_restart = msg.get('force_restart', False) or (msg_type == 'restart')

                current_topic = msg.get('topic', current_topic)
                taboo_list = msg.get('tabooWords', taboo_list)
                current_question = msg.get('question', current_question)
                current_qnum = msg.get('questionNum', current_qnum)
                current_total = msg.get('totalQuestions', current_total)
                current_stage = msg.get('stage', current_stage)
                current_mini = msg.get('miniLesson', current_mini)
                current_lang = msg.get('language', current_lang)

                # Reconnect Gemini with clean system instruction when question, stage, or questionNum changes
                question_changed = (current_question != prev_question and bool(current_question))
                stage_changed = (current_stage != prev_stage)
                qnum_changed = (current_qnum != prev_qnum)

                if question_changed or stage_changed or qnum_changed or force_restart:
                    await bridge.start_session(
                        topic=current_topic,
                        taboo_words=taboo_list,
                        lang=current_lang,
                        question=current_question,
                        question_num=current_qnum,
                        total_questions=current_total,
                        stage=current_stage,
                        mini_lesson=current_mini,
                    )

            elif msg_type == 'end_of_turn':
                is_audio = msg.get('is_audio', True)
                text_hint = msg.get('text', '').strip()
                if is_audio:
                    await bridge.end_of_audio_turn(text_hint)
                elif text_hint:
                    await bridge.send_user_text(text_hint)

    except WebSocketDisconnect:
        pass
    except Exception as err:
        print(f"[live_server] WebSocket session error: {err}", file=sys.stderr)
        try:
            await websocket.send_json({
                'type': 'error',
                'message': str(err)
            })
        except Exception:
            pass
    finally:
        await bridge.close_session()

if __name__ == '__main__':
    print(f"Starting Ater Socratic Live Voice Server on http://0.0.0.0:{PORT} with model {MODEL_NAME}...")
    uvicorn.run(app, host='0.0.0.0', port=PORT, log_level='info')
