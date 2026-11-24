import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const apiKey = (process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();

    const url = apiKey.startsWith('AQ.')
      ? 'https://googleapis.com'
      : 'https://googleapis.com';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `Rolun: ${systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kisa ve net Turkce cevap ver.'}\nSoru: ${message}` }]
          }
        ]
      })
    });

    const data = await res.json();
    const reply = data?.candidates?.at(0)?.content?.parts?.at(0)?.text || ('API Cevabi: ' + JSON.stringify(data.error || data));
    return NextResponse.json({ success: true, reply });
  } catch (e) {
    return NextResponse.json({ success: true, reply: 'Sunucu Hatasi: ' + e.message });
  }
}
