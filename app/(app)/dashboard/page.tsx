import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/ui/LogoutButton';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users_profile')
    .select('display_name, streak_days')
    .eq('id', user?.id)
    .single();

  const name   = profile?.display_name ?? user?.email ?? 'ゲスト';
  const streak = profile?.streak_days  ?? 0;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Revive Spanish &amp; Italian</h1>
          <p className="text-gray-500 mt-1">こんにちは、{name} さん。今日も練習しよう。</p>
        </div>
        <LogoutButton />
      </div>

      {/* ストリーク */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 inline-block">
        <div className="text-4xl font-bold text-orange-500">{streak}</div>
        <div className="text-gray-500">連続学習日数</div>
      </div>

      {/* 言語選択 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/session/new?lang=spanish">
          <div className="bg-red-600 text-white rounded-2xl p-8 hover:bg-red-700 transition cursor-pointer shadow">
            <div className="text-3xl mb-2">🇪🇸</div>
            <h2 className="text-2xl font-bold">スペイン語</h2>
            <p className="text-red-100 mt-1">Carlos / Elena と練習</p>
          </div>
        </Link>
        <Link href="/session/new?lang=italian">
          <div className="bg-green-700 text-white rounded-2xl p-8 hover:bg-green-800 transition cursor-pointer shadow">
            <div className="text-3xl mb-2">🇮🇹</div>
            <h2 className="text-2xl font-bold">イタリア語</h2>
            <p className="text-green-100 mt-1">Marco / Sofia と練習</p>
          </div>
        </Link>
      </div>

      <nav className="flex gap-4">
        <Link href="/history"  className="text-blue-600 hover:underline text-lg">学習履歴</Link>
        <Link href="/settings" className="text-blue-600 hover:underline text-lg">設定</Link>
      </nav>
    </main>
  );
}
