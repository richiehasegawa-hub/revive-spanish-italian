'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const supabase = createClient();
  const router   = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button onClick={handleLogout}
      className="text-gray-400 hover:text-gray-600 text-sm border border-gray-200 rounded-lg px-3 py-1.5">
      ログアウト
    </button>
  );
}
