import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.message) {
      return NextResponse.json({ approved: true });
    }

    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    if (!groqKey) {
      return NextResponse.json({ success: true, reply: '⚠️ GROQ_API_KEY okunamadi.' });
    }

    const res = await fetch('https://groq.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
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
    let data = {};
    try { data = JSON.parse(raw); } catch (e) {}

    const text = data?.choices?.at(0)?.message?.content;
    if (text) {
      return NextResponse.json({ success: true, reply: text });
    }

    return NextResponse.json({
      success: true,
      reply: `⚠️ Groq Uyarisi (HTTP ${res.status}): ` + (data?.error?.message || raw.slice(0, 120) || 'Bos yanit')
    });
  } catch (err) {
    return NextResponse.json({ success: true, reply: '⚠️ Sistem: ' + err.message });
  }
}
