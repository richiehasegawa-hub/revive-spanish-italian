'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const supabase = createClient();
  const router   = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError('メールアドレスまたはパスワードが正しくありません'); }
    else        { router.push('/dashboard'); router.refresh(); }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">ログイン</h1>
        <p className="text-gray-400 text-sm mb-6">Revive Spanish &amp; Italian</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">メールアドレス</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">パスワード</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-base font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'ログイン中…' : 'ログイン'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          アカウントがない方は{' '}
          <Link href="/signup" className="text-blue-500 hover:underline">新規登録</Link>
        </p>
      </div>
    </main>
  );
}
