'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/hooks/useSession';

type CharacterId = 'carlos' | 'elena' | 'marco' | 'sofia';

interface Character {
  id: CharacterId;
  name: string;
  role: string;
  avatar: string;
  color: string;
}

interface GrammarIssue {
  error: string;
  correction: string;
  rule: string;
}

interface EvalResult {
  grammar_score: number;
  fluency_score: number;
  naturalness_score: number;
  grammar_issues: GrammarIssue[];
  next_focus: string[];
  encouragement: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  evaluation?: EvalResult;
}

const CHARACTERS: Record<string, Character[]> = {
  spanish: [
    { id: 'carlos', name: 'Carlos', role: 'メキシコ系ガイド（バルセロナ在住）', avatar: '👨🏽', color: 'bg-orange-500' },
    { id: 'elena',  name: 'Elena',  role: 'マドリード出身の語学教師',           avatar: '👩🏻', color: 'bg-pink-500'   },
  ],
  italian: [
    { id: 'marco', name: 'Marco', role: 'ミラノの音楽プロデューサー',     avatar: '👨🏻', color: 'bg-green-600' },
    { id: 'sofia', name: 'Sofia', role: 'ローマのホテルコンシェルジュ', avatar: '👩🏽', color: 'bg-teal-500'  },
  ],
};

// ---- Score Bar ----
function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct   = Math.round(score * 10);
  const color = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right font-medium text-gray-700">{score}</span>
    </div>
  );
}

// ---- Evaluation Panel ----
function EvalPanel({ ev }: { ev: EvalResult }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
      <p className="text-blue-700 font-medium mb-2">💬 {ev.encouragement}</p>
      <div className="space-y-1 mb-2">
        <ScoreBar label="文法"   score={ev.grammar_score} />
        <ScoreBar label="流暢さ" score={ev.fluency_score} />
        <ScoreBar label="自然さ" score={ev.naturalness_score} />
      </div>
      {ev.grammar_issues?.length > 0 && (
        <button onClick={() => setOpen(o => !o)} className="text-blue-500 text-xs underline">
          {open ? '▲ 詳細を閉じる' : '▼ 文法ミスを見る'}
        </button>
      )}
      {open && (
        <ul className="mt-2 space-y-1">
          {ev.grammar_issues.map((g, i) => (
            <li key={i} className="bg-white rounded-lg px-3 py-2 border border-blue-100">
              <span className="line-through text-red-400 mr-2">{g.error}</span>
              <span className="text-green-600 font-medium mr-2">→ {g.correction}</span>
              <span className="text-gray-400 text-xs">{g.rule}</span>
            </li>
          ))}
        </ul>
      )}
      {ev.next_focus?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {ev.next_focus.map((f, i) => (
            <span key={i} className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- TTS Play Button ----
function TtsButton({ text, characterId }: { text: string; characterId: string }) {
  const [playing, setPlaying] = useState(false);
  const [loadingTts, setLoadingTts] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handlePlay() {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }

    setLoadingTts(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, characterId }),
      });

      if (!res.ok) {
        // ElevenLabs APIキー未設定時はサイレントに失敗
        console.warn('TTS not available:', res.status);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setPlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPlaying(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
      setPlaying(true);
    } catch (e) {
      console.error('TTS play error:', e);
    } finally {
      setLoadingTts(false);
    }
  }

  return (
    <button
      onClick={handlePlay}
      disabled={loadingTts}
      title={playing ? '停止' : '音声で聞く'}
      className="mt-1 ml-1 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-40 p-1 rounded-full touch-manipulation"
      style={{ minWidth: 36, minHeight: 36 }}
    >
      {loadingTts ? (
        <span className="text-base animate-spin inline-block">⏳</span>
      ) : playing ? (
        <span className="text-xl">⏹️</span>
      ) : (
        <span className="text-xl">🔊</span>
      )}
    </button>
  );
}

// ---- Main Session Page ----
export default function SessionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = searchParams.get('lang') ?? 'spanish';

  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [weaknessList, setWeaknessList] = useState<string[]>([]);

  // 音声入力関連
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { startSession, saveMessage, endSession } = useSession();
  const bottomRef = useRef<HTMLDivElement>(null);

  const langLabel = lang === 'spanish' ? '🇪🇸 スペイン語' : '🇮🇹 イタリア語';
  const langColor = lang === 'spanish' ? 'bg-red-600'    : 'bg-green-700';
  const speechLang = lang === 'spanish' ? 'es-ES'        : 'it-IT';
  const chars     = CHARACTERS[lang] ?? CHARACTERS['spanish'];

  // Web Speech API サポート確認（Safari: webkitSpeechRecognition）
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechSupported(supported);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // キャラクター選択時にDBセッション作成 + 弱点リスト取得
  async function handleSelectCharacter(c: Character) {
    setCharacter(c);
    const sid = await startSession(lang, c.id);
    setDbSessionId(sid);

    try {
      const res = await fetch(`/api/memory?language=${lang}`);
      if (res.ok) {
        const data: { description: string }[] = await res.json();
        setWeaknessList(data.map(w => w.description));
      }
    } catch (e) {
      console.error('弱点リスト取得エラー:', e);
    }
  }

  // セッション終了
  async function handleEndSession() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (dbSessionId) await endSession(dbSessionId);
    setCharacter(null);
    setMessages([]);
    setDbSessionId(null);
    router.push('/dashboard');
    router.refresh();
  }

  // 弱点保存
  async function saveWeakPoints(ev: EvalResult) {
    const posts: Promise<void>[] = [];
    for (const issue of ev.grammar_issues ?? []) {
      const description = issue.rule?.trim();
      if (!description) continue;
      posts.push(
        fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lang, category: 'grammar', description }),
        }).then((): void => undefined)
      );
    }
    for (const focus of ev.next_focus ?? []) {
      const description = focus?.trim();
      if (!description) continue;
      posts.push(
        fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lang, category: 'grammar', description }),
        }).then((): void => undefined)
      );
    }
    await Promise.all(posts);
  }

  // メッセージ送信（テキスト・音声共通）
  const sendMessage = useCallback(async (textOverride?: string) => {
    const userText = (textOverride ?? input).trim();
    if (!userText || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setLoading(true);

    if (dbSessionId) await saveMessage(dbSessionId, 'user', userText);

    try {
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          language: lang,
          characterId: character?.id,
          history: messages,
          weaknessList,
        }),
      });
      const chatData = await chatRes.json();
      const reply: string = chatData.reply ?? '⚠️ 返答を取得できませんでした';

      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userText, assistantMessage: reply, language: lang }),
      });
      const evalData: EvalResult = await evalRes.json();

      if (dbSessionId) await saveMessage(dbSessionId, 'assistant', reply, evalData as unknown as Record<string, unknown>);
      saveWeakPoints(evalData).catch(e => console.error('弱点保存エラー:', e));

      setMessages(prev => [...prev, { role: 'assistant', content: reply, evaluation: evalData }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ エラーが発生しました' }]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, loading, dbSessionId, lang, character, messages, weaknessList]);

  // 音声入力（Web Speech API / Safari: webkitSpeechRecognition）
  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = speechLang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      // 途中経過・確定ともに入力欄に表示（自動送信しない）
      setInput(transcript);
      if (isFinal) {
        setIsRecording(false);
        recognitionRef.current = null;
        // 入力欄にセットするだけ。送信はユーザーが「送信」ボタンを押す
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  // ---- キャラクター未選択 → 選択画面 ----
  if (!character) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <Link href="/dashboard" className="self-start text-gray-400 hover:text-gray-600 mb-8 text-sm">
          ← ダッシュボードに戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{langLabel} 会話練習</h1>
        <p className="text-gray-500 mb-10">誰と話しますか？</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-lg">
          {chars.map(c => (
            <button
              key={c.id}
              onClick={() => handleSelectCharacter(c)}
              className={`${c.color} text-white rounded-2xl p-8 text-left hover:opacity-90 active:opacity-80 transition shadow-md touch-manipulation`}
              style={{ minHeight: 120 }}
            >
              <div className="text-5xl mb-3">{c.avatar}</div>
              <div className="text-2xl font-bold">{c.name}</div>
              <div className="text-white/80 mt-1 text-sm">{c.role}</div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  // ---- 会話画面 ----
  return (
    <main className="flex flex-col bg-gray-50" style={{ height: '100dvh' }}>
      {/* ヘッダー */}
      <header className={`${langColor} text-white px-4 py-3 flex items-center gap-3 shrink-0`}>
        <span className="text-2xl">{character.avatar}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base leading-tight truncate">{character.name}</div>
          <div className="text-white/70 text-xs truncate">{character.role}</div>
        </div>
        <button
          onClick={handleEndSession}
          className="text-white/80 hover:text-white text-sm border border-white/40 rounded-lg px-3 py-2 shrink-0 touch-manipulation"
          style={{ minWidth: 56, minHeight: 40 }}
        >
          終了
        </button>
      </header>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20 text-base px-4">
            {lang === 'spanish'
              ? `¡Hola! ${character.name} に話しかけてみよう`
              : `Ciao! ${character.name} に話しかけてみよう`}
            {speechSupported && (
              <p className="mt-3 text-sm">🎤 マイクボタンでスピーキング練習もできます</p>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
              m.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-800 shadow-sm'
            }`}>
              {m.content}
            </div>

            {/* AI返答の🔊ボタン */}
            {m.role === 'assistant' && (
              <TtsButton text={m.content} characterId={character.id} />
            )}

            {/* 評価パネル */}
            {m.role === 'assistant' && m.evaluation && (
              <div className="max-w-[85%] w-full">
                <EvalPanel ev={m.evaluation} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm text-gray-400 animate-pulse">
              {character.name} が入力中…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア（iPhone縦持ち最適化） */}
      <div className="bg-white border-t px-3 py-3 flex gap-2 shrink-0"
           style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {/* 🎤 マイクボタン（Speech API対応ブラウザのみ表示） */}
        {speechSupported && (
          <button
            onClick={toggleRecording}
            title={isRecording ? '録音停止（タップで確定）' : '音声入力（スペイン語/イタリア語）'}
            className={`rounded-xl flex items-center justify-center transition touch-manipulation shrink-0 ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
            }`}
            style={{ minWidth: 52, minHeight: 52 }}
          >
            <span className="text-2xl">{isRecording ? '⏹' : '🎤'}</span>
          </button>
        )}

        {/* テキスト入力欄 */}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) sendMessage();
          }}
          placeholder={
            isRecording
              ? '🎤 話してください… （止まると自動確定）'
              : lang === 'spanish' ? '¿Qué quieres decir?' : 'Cosa vuoi dire?'
          }
          readOnly={isRecording}
          className="flex-1 border rounded-xl px-4 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          style={{ minHeight: 52 }}
        />

        {/* 送信ボタン */}
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white rounded-xl px-4 text-base font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 shrink-0 touch-manipulation"
          style={{ minWidth: 68, minHeight: 52 }}
        >
          送信
        </button>
      </div>
    </main>
  );
}
