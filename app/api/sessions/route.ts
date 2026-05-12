import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST: 新規セッション作成
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { language, characterId, scenarioType = 'free_conversation' } = await req.json();

    const { data, error } = await supabase
      .from('learning_sessions')
      .insert({ user_id: user.id, language, character_id: characterId, scenario_type: scenarioType })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[POST /api/sessions]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: セッション一覧
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/sessions]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
