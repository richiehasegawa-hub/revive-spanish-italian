'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface WeakPoint {
  id: string;
  language: 'spanish' | 'italian';
  category: string;
  description: string;
  frequency: number;
  last_seen: string;
}

interface Profile {
  display_name: string;
  streak_days: number;
  last_active: string | null;
}

export default function SettingsPage() {
  const supabase = createClient();

  const [profile, setProfile]           = useState<Profile | null>(null);
  const [displayName, setDisplayName]   = useState('');
  const [savingName, setSavingName]     = useState(false);
  const [saveMsg, setSaveMsg]           = useState('');

  const [weakPoints, setWeakPoints]     = useState<WeakPoint[]>([]);
  const [loadingWP, setLoadingWP]       = useState(true);
  const [activeTab, setActiveTab]       = useState<'spanish' | 'italian'>('spanish');

  // プロフィール読み込み
  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('users_profile')
      .select('display_name, streak_days, last_active')
      .eq('id', user.id)
      .single();
    if (data) {
      setProfile(data);
      setDisplayName(data.display_name);
    }
  }, [supabase]);

  // 弱点リスト読み込み
  const loadWeakPoints = useCallback(async () => {
    setLoadingWP(true);
    try {
      const res = await fetch('/api/memory');
      if (res.ok) {
        const data: WeakPoint[] = await res.json();
        setWeakPoints(data);
      }
    } finally {
      setLoadingWP(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadWeakPoints();
  }, [loadProfile, loadWeakPoints]);

  // 表示名の保存
  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSavingName(true);
    setSaveMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('users_profile')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id);
    setSavingName(false);
    setSaveMsg(error ? '保存に失敗しました' : '保存しました ✓');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  // 弱点の削除
  async function handleDeleteWeakPoint(id: string) {
    const res = await fetch(`/api/memory?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setWeakPoints(prev => prev.filter(w => w.id !== id));
    }
  }

  const filtered = weakPoints.filter(w => w.language === activeTab);

  const formatDate = (iso: string | null) => {
    if (!iso) return 'なし';
    return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* ヘッダー */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
          ← ダッシュボードに戻る
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-8">設定</h1>

      <div className="max-w-2xl space-y-8">

        {/* ── 学習状況 ── */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">📊 学習状況</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-orange-500">
                {profile?.streak_days ?? 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">連続学習日数</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-base font-semibold text-blue-600 mt-1">
                {formatDate(profile?.last_active ?? null)}
              </div>
              <div className="text-sm text-gray-500 mt-1">最終学習日</div>
            </div>
          </div>
        </section>

        {/* ── プロフィール ── */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">👤 プロフィール</h2>
          <form onSubmit={handleSaveName} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-500 mb-1">表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={savingName}
              className="bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              {savingName ? '保存中…' : '保存'}
            </button>
          </form>
          {saveMsg && (
            <p className={`mt-2 text-sm ${saveMsg.includes('失敗') ? 'text-red-500' : 'text-green-600'}`}>
              {saveMsg}
            </p>
          )}
        </section>

        {/* ── 弱点リスト ── */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">🧠 蓄積された弱点リスト</h2>
          <p className="text-sm text-gray-400 mb-4">会話練習で繰り返し出た文法ミス・練習項目です。次のセッションでキャラクターが意識的に練習に組み込みます。</p>

          {/* 言語タブ */}
          <div className="flex gap-2 mb-4">
            {(['spanish', 'italian'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  activeTab === lang
                    ? lang === 'spanish'
                      ? 'bg-red-600 text-white'
                      : 'bg-green-700 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {lang === 'spanish' ? '🇪🇸 スペイン語' : '🇮🇹 イタリア語'}
              </button>
            ))}
          </div>

          {/* 弱点一覧 */}
          {loadingWP ? (
            <p className="text-gray-400 text-sm py-4 text-center">読み込み中…</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">
              まだ弱点が蓄積されていません。<br />
              会話練習を行うと自動的に記録されます。
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map(wp => (
                <li
                  key={wp.id}
                  className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3"
                >
                  {/* 頻度バッジ */}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    wp.frequency >= 3 ? 'bg-red-100 text-red-600' :
                    wp.frequency === 2 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    ×{wp.frequency}
                  </span>
                  {/* 内容 */}
                  <span className="flex-1 text-sm text-gray-700">{wp.description}</span>
                  {/* カテゴリ */}
                  <span className="text-xs text-gray-400 shrink-0">{wp.category}</span>
                  {/* 削除ボタン */}
                  <button
                    onClick={() => handleDeleteWeakPoint(wp.id)}
                    className="text-gray-300 hover:text-red-400 transition text-lg leading-none shrink-0"
                    title="削除"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {filtered.length > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              ×の数字は出現回数。3回以上（赤）は重点練習項目です。
            </p>
          )}
        </section>

      </div>
    </main>
  );
}
