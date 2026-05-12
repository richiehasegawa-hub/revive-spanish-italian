'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * 今日の日付を YYYY-MM-DD 形式で返す（ローカルタイム基準）
 */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 2つの YYYY-MM-DD 文字列の差分を日数で返す
 */
function dayDiff(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / msPerDay);
}

export function useSession() {
  const supabase = createClient();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const startSession = useCallback(async (language: string, characterId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('learning_sessions')
        .insert({ user_id: user.id, language, character_id: characterId, scenario_type: 'free_conversation' })
        .select('id')
        .single();
      if (error) { console.error('セッション作成エラー:', error); return null; }
      setSessionId(data.id);
      return data.id;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [supabase]);

  const saveMessage = useCallback(async (
    sid: string,
    role: 'user' | 'assistant',
    content: string,
    evaluation?: Record<string, unknown>
  ) => {
    try {
      await supabase.from('messages').insert({
        session_id:      sid,
        role,
        content,
        grammar_score:   evaluation?.grammar_score   ?? null,
        fluency_score:   evaluation?.fluency_score   ?? null,
        natural_score:   evaluation?.naturalness_score ?? null,
        evaluation_json: evaluation ?? null,
      });
    } catch (e) {
      console.error('メッセージ保存エラー:', e);
    }
  }, [supabase]);

  /**
   * ストリーク更新ロジック
   *  - last_active が今日     → 変更なし（同日2回目の練習）
   *  - last_active が昨日     → streak_days + 1
   *  - last_active が2日以上前 → streak_days = 1（リセット）
   *  - last_active が null    → streak_days = 1（初回）
   */
  const updateStreak = useCallback(async (userId: string) => {
    try {
      const today = toDateString(new Date());

      const { data: profile, error: fetchError } = await supabase
        .from('users_profile')
        .select('streak_days, last_active')
        .eq('id', userId)
        .single();

      if (fetchError || !profile) {
        console.error('プロフィール取得エラー:', fetchError);
        return;
      }

      const lastActive: string | null = profile.last_active;
      let newStreak: number;

      if (!lastActive) {
        // 初回練習
        newStreak = 1;
      } else {
        const diff = dayDiff(today, lastActive);
        if (diff === 0) {
          // 今日すでに練習済み → 変更なし
          return;
        } else if (diff === 1) {
          // 昨日から継続 → ストリーク+1
          newStreak = (profile.streak_days ?? 0) + 1;
        } else {
          // 2日以上空いた → リセット
          newStreak = 1;
        }
      }

      const { error: updateError } = await supabase
        .from('users_profile')
        .update({ streak_days: newStreak, last_active: today })
        .eq('id', userId);

      if (updateError) {
        console.error('ストリーク更新エラー:', updateError);
      }
    } catch (e) {
      console.error('updateStreak 例外:', e);
    }
  }, [supabase]);

  const endSession = useCallback(async (sid: string) => {
    // セッションを完了状態に更新
    await supabase
      .from('learning_sessions')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', sid);

    // ストリークを更新
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await updateStreak(user.id);
    }
  }, [supabase, updateStreak]);

  return { sessionId, startSession, saveMessage, endSession };
}
