import { NextRequest, NextResponse } from 'next/server';
import { anthropic, CLAUDE_PARAMS } from '@/lib/claude/client';
import { EVALUATION_PROMPT } from '@/lib/claude/prompts';
import type { Language, EvaluationResult } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { userMessage, assistantMessage, language } =
      await req.json() as {
        userMessage: string;
        assistantMessage: string;
        language: Language;
      };

    const response = await anthropic.messages.create({
      ...CLAUDE_PARAMS.evaluation,
      system: EVALUATION_PROMPT(language),
      messages: [
        {
          role: 'user',
          content: `ユーザー発言: ${userMessage}\nAI応答: ${assistantMessage}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result: EvaluationResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json(result);
  } catch (error) {
    console.error('[/api/evaluate]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
