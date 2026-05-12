import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const CHAR_LABELS: Record<string, string> = {
  carlos: '👨🏽 Carlos', elena: '👩🏻 Elena',
  marco:  '👨🏻 Marco',  sofia: '👩🏽 Sofia',
};
const LANG_LABELS: Record<string, string> = {
  spanish: '🇪🇸 スペイン語', italian: '🇮🇹 イタリア語',
};

function ScoreChip({ label, score }: { label: string; score: number }) {
  const color = score >= 8 ? 'bg-green-100 text-green-700' : score >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label} {score}</span>
  );
}

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();

  const { data: session } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!session) return notFound();

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', params.id)
    .order('created_at', { ascending: true });

  const avgGrammar = messages?.filter(m => m.grammar_score)
    .reduce((acc, m, _, arr) => acc + m.grammar_score / arr.length, 0) ?? 0;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/history" className="text-gray-400 hover:text-gray-600 text-sm">← 履歴に戻る</Link>
        <h1 className="text-xl font-bold text-gray-800">
          {LANG_LABELS[session.language]} — {CHAR_LABELS[session.character_id]}
        </h1>
      </div>

      {/* サマリー */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 flex gap-6 flex-wrap">
        <div>
          <div className="text-xs text-gray-400">日時</div>
          <div className="font-medium">{new Date(session.started_at).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">メッセージ数</div>
          <div className="font-medium">{messages?.length ?? 0} 件</div>
        </div>
        {avgGrammar > 0 && (
          <div>
            <div className="text-xs text-gray-400">平均文法スコア</div>
            <div className="font-medium text-blue-600">{avgGrammar.toFixed(1)}</div>
          </div>
        )}
      </div>

      {/* 会話ログ */}
      <div className="space-y-4 max-w-2xl">
        {messages?.map(m => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-base leading-relaxed ${
              m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 shadow-sm'
            }`}>
              {m.content}
            </div>
            {m.role === 'assistant' && (m.grammar_score || m.fluency_score) && (
              <div className="flex gap-1 mt-1">
                {m.grammar_score  && <ScoreChip label="文法"   score={m.grammar_score} />}
                {m.fluency_score  && <ScoreChip label="流暢さ" score={m.fluency_score} />}
                {m.natural_score  && <ScoreChip label="自然さ" score={m.natural_score} />}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
