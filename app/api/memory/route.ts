import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Language } from '@/types';

// DELETE: 弱点を1件削除
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id は必須です' }, { status: 400 });

    const { error } = await supabase
      .from('weak_points')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // 自分のデータのみ削除可能

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/memory]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: ユーザーの弱点・長期記憶を取得
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const lang = req.nextUrl.searchParams.get('language') as Language | null;

    const query = supabase
      .from('weak_points')
      .select('*')
      .eq('user_id', user.id)
      .order('frequency', { ascending: false })
      .limit(10);

    if (lang) query.eq('language', lang);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/memory]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: 弱点を追加 or frequencyをインクリメント
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { language, category, description } = await req.json();
    if (!language || !category || !description) {
      return NextResponse.json({ error: 'language / category / description は必須です' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 既存レコードを検索
    const { data: existing } = await supabase
      .from('weak_points')
      .select('id, frequency')
      .eq('user_id', user.id)
      .eq('language', language)
      .eq('description', description)
      .maybeSingle();

    if (existing) {
      // 既存 → frequency を +1
      const { data, error } = await supabase
        .from('weak_points')
        .update({ frequency: existing.frequency + 1, last_seen: now })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // 新規 → insert
      const { data, error } = await supabase
        .from('weak_points')
        .insert({ user_id: user.id, language, category, description, frequency: 1, last_seen: now })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('[POST /api/memory]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
