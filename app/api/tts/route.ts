import { NextRequest, NextResponse } from 'next/server';

// キャラクターごとのElevenLabs voice_id（eleven_multilingual_v2 対応の確認済みID）
const VOICE_IDS: Record<string, string> = {
  carlos: 'pNInz6obpgDQGcFmaJgB', // Adam（男性）
  elena:  'EXAVITQu4vr4xnSDxMaL', // Sarah（女性）
  marco:  'TxGEqnHWrfWFTfGW9XjX', // Josh（男性）← Arnoldから変更
  sofia:  '21m00Tcm4TlvDq8ikWAM', // Rachel（女性）← Dorothyから変更（無効IDのため）
};

// キャラクター別の言語設定
const VOICE_SETTINGS: Record<string, { model_id: string; language_code: string }> = {
  carlos: { model_id: 'eleven_multilingual_v2', language_code: 'es' },
  elena:  { model_id: 'eleven_multilingual_v2', language_code: 'es' },
  marco:  { model_id: 'eleven_multilingual_v2', language_code: 'it' },
  sofia:  { model_id: 'eleven_multilingual_v2', language_code: 'it' },
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 503 }
    );
  }

  try {
    const { text, characterId } = await req.json() as { text: string; characterId: string };

    if (!text || !characterId) {
      return NextResponse.json({ error: 'text and characterId are required' }, { status: 400 });
    }

    const voiceId = VOICE_IDS[characterId] ?? VOICE_IDS['carlos'];
    const settings = VOICE_SETTINGS[characterId] ?? VOICE_SETTINGS['carlos'];

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: settings.model_id,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs error:', errText);
      return NextResponse.json({ error: 'TTS generation failed', detail: errText }, { status: 502 });
    }

    // 音声データをバイナリで返す
    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('TTS route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
