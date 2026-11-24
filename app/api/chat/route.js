import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const apiKey = (process.env.GROQ_API_KEY || '').trim();

    if (!apiKey) {
      return NextResponse.json({ success: true, reply: '⚠️ Vercel ayarlarinda GROQ_API_KEY eksik.' });
    }

    const res = await fetch('https://groq.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kisa ve net Turkce cevap ver.' },
          { role: 'user', content: message }
        ],
        max_tokens: 400
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: true, reply: '⚠️ API Uyarisi: ' + (data?.error?.message || res.status) });
    }

    const reply = data?.choices?.at(0)?.message?.content || 'Yanit olusturuldu.';
    return NextResponse.json({ success: true, reply });
  } catch (e) {
    return NextResponse.json({ success: true, reply: '⚠️ Detay: ' + e.message });
  }
}
