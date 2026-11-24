import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.message) {
      return NextResponse.json({ approved: true });
    }

    const promptText = `Rolun: ${body.systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kisa ve net Turkce cevap ver.'}\nSoru: ${body.message}`;
    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    const geminiKey = (process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

    let errors = [];

    if (groqKey) {
      try {
        const { data } = await axios.post(
          'https://groq.com',
          {
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: body.systemPrompt || 'Sen Pi Network uzmanisin. Kisa ve net Turkce cevap ver.' },
              { role: 'user', content: body.message }
            ],
            max_tokens: 400
          },
          {
            headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            timeout: 8000
          }
        );
        const text = data?.choices?.at(0)?.message?.content;
        if (text) return NextResponse.json({ success: true, reply: text });
      } catch (e) {
        errors.push('Groq: ' + (e.response?.data?.error?.message || e.message));
      }
    }

    if (geminiKey) {
      try {
        const url = geminiKey.startsWith('AQ.')
          ? 'https://googleapis.com'
          : 'https://googleapis.com';

        const { data } = await axios.post(
          url,
          { contents: [{ role: 'user', parts: [{ text: promptText }] }] },
          { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey }, timeout: 8000 }
        );
        const text = data?.candidates?.at(0)?.content?.parts?.at(0)?.text;
        if (text) return NextResponse.json({ success: true, reply: text });
      } catch (e) {
        errors.push('Gemini: ' + (e.response?.data?.error?.message || e.message));
      }
    }

    return NextResponse.json({
      success: true,
      reply: '⚠️ Bilgi: ' + (errors.join(' | ') || 'Vercel ayarlarinda anahtar bulunamadi.')
    });
  } catch (err) {
    return NextResponse.json({ success: true, reply: '⚠️ Sistem: ' + err.message });
  }
}
