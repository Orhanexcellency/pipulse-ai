import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.message) {
      return NextResponse.json({ approved: true });
    }

    const orKey = (process.env.OPENROUTER_API_KEY || '').trim();
    if (!orKey) {
      return NextResponse.json({ success: true, reply: '⚠️ Vercel ayarlarinda OPENROUTER_API_KEY eksik.' });
    }

    const res = await fetch('https://openrouter.ai', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${orKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vercel.app',
        'X-Title': 'PiPulse AI'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: body.systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kisa ve net Turkce cevap ver.' },
          { role: 'user', content: body.message }
        ]
      })
    });

    const data = await res.json();
    const text = data?.choices?.at(0)?.message?.content;
    if (text) {
      return NextResponse.json({ success: true, reply: text });
    }

    return NextResponse.json({
      success: true,
      reply: `⚠️ Uyarisi (${res.status}): ` + (data?.error?.message || 'Yanit alinamadi')
    });
  } catch (err) {
    return NextResponse.json({ success: true, reply: '⚠️ Sistem: ' + err.message });
  }
}
