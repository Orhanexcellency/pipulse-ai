import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const apiKey = (process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      return NextResponse.json({ success: true, reply: '⚠️ Vercel ayarlarinda NEXT_PUBLIC_GEMINI_API_KEY eksik.' });
    }

    const url = `https://googleapis.com{encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Rolun: ${systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kisa ve net Turkce cevap ver.'}\nSoru: ${message}`
              }
            ]
          }
        ]
      })
    });

    const raw = await res.text();
    if (raw.trim().startsWith('<')) {
      return NextResponse.json({ success: true, reply: `⚠️ Sunucu HTML hatasi (${res.status}).` });
    }

    const data = JSON.parse(raw);
    if (!res.ok) {
      return NextResponse.json({ success: true, reply: '⚠️ API Hatasi: ' + (data.error?.message || res.status) });
    }

    const reply = data?.candidates?.at(0)?.content?.parts?.at(0)?.text || 'Yanit olusturuldu.';
    return NextResponse.json({ success: true, reply });
  } catch (e) {
    return NextResponse.json({ success: true, reply: '⚠️ Hata: ' + e.message });
  }
}
