import { NextRequest, NextResponse } from 'next/server';
import { anthropic, CLAUDE_PARAMS } from '@/lib/claude/client';
import { CHARACTER_SYSTEM_PROMPTS } from '@/lib/claude/prompts';
import type { Language, CharacterId } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { message, language, characterId = 'carlos', history = [], weaknessList = [], sessionSummary = '' } =
      await req.json() as {
        message: string;
        language: Language;
        characterId?: CharacterId;
        history: { role: string; content: string }[];
        weaknessList?: string[];
        sessionSummary?: string;
      };

    const systemPrompt = CHARACTER_SYSTEM_PROMPTS[characterId]({
      weaknessList,
      sessionSummary,
    });

    const response = await anthropic.messages.create({
      ...CLAUDE_PARAMS.conversation,
      system: systemPrompt,
      messages: [
        ...history.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ reply, language });
  } catch (error) {
    console.error('[/api/chat]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
