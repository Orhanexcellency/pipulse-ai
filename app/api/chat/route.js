import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json({ success: true, reply: '⚠️ GEMINI_API_KEY eksik.' });
    }

    const res = await fetch('https://googleapis.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `Talimat: ${systemPrompt || 'Sen Pi Network ekosisteminde uzman bir yapay zeka asistanisin.'}\n\nSoru: ${message}` }],
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: true, reply: '⚠️ Gemini Hatasi: ' + (data.error?.message || res.status) });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '⚡ Yanit olusturuldu.';
    return NextResponse.json({ success: true, reply });
  } catch (error) {
    const detail = error.cause ? ` (${error.cause.code || error.cause.message})` : '';
    return NextResponse.json({ success: true, reply: '⚠️ Hata: ' + error.message + detail });
  }
}
