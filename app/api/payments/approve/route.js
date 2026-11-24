import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.message) {
      return NextResponse.json({ approved: true });
    }

    const promptText = `Rolun: ${body.systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kisa ve net Turkce cevap ver.'}\nSoru: ${body.message}`;
    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    const geminiKey = (process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

    if (groqKey) {
      const res = await fetch('https://groq.com', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: body.systemPrompt || 'Sen Pi Network uzmanisin. Kisa ve net Turkce cevap ver.' },
            { role: 'user', content: body.message }
          ],
          max_tokens: 400
        })
      });
      const raw = await res.text();
      if (raw) {
        const data = JSON.parse(raw);
        const text = data?.choices?.at(0)?.message?.content;
        if (text) return NextResponse.json({ success: true, reply: text });
      }
    }

    if (geminiKey) {
      const url = geminiKey.startsWith('AQ.')
        ? 'https://googleapis.com'
        : 'https://googleapis.com';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: promptText }] }] })
      });
      const raw = await res.text();
      if (raw && !raw.trim().startsWith('<')) {
        const data = JSON.parse(raw);
        const text = data?.candidates?.at(0)?.content?.parts?.at(0)?.text;
        if (text) return NextResponse.json({ success: true, reply: text });
      }
    }

    return NextResponse.json({ success: true, reply: '⚠️ Vercel ayarlarinda gecerli API anahtari eksik.' });
  } catch (err) {
    return NextResponse.json({ success: true, reply: '⚠️ Sistem: ' + err.message });
  }
}
