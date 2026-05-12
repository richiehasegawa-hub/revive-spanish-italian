import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';

const CHAR_LABELS: Record<string, string> = {
  carlos: '👨🏽 Carlos', elena: '👩🏻 Elena',
  marco:  '👨🏻 Marco',  sofia: '👩🏽 Sofia',
};
const LANG_LABELS: Record<string, string> = {
  spanish: '🇪🇸 スペイン語', italian: '🇮🇹 イタリア語',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: sessions } = await supabase
    .from('learning_sessions')
    .select('id, language, character_id, status, started_at, ended_at')
    .eq('user_id', user?.id)
    .order('started_at', { ascending: false })
    .limit(30);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← 戻る</Link>
        <h1 className="text-2xl font-bold text-gray-800">学習履歴</h1>
      </div>

      {!sessions?.length ? (
        <div className="text-center text-gray-400 mt-20 text-lg">
          まだセッションがありません。<br />
          <Link href="/dashboard" className="text-blue-500 hover:underline mt-2 inline-block">練習を始める →</Link>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {sessions.map(s => (
            <Link key={s.id} href={`/history/${s.id}`}>
              <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
                <div className="text-3xl">{LANG_LABELS[s.language]?.split(' ')[0]}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {LANG_LABELS[s.language] ?? s.language} — {CHAR_LABELS[s.character_id] ?? s.character_id}
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">{formatDate(s.started_at)}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  s.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {s.status === 'completed' ? '完了' : '途中'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
