import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json({ success: true, reply: '⚠️ GROQ_API_KEY bos gorunuyor.' });
    }

    const res = await fetch('https://groq.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt || 'Sen yardimci bir Pi Network yapay zeka asistanisin.' },
          { role: 'user', content: message },
        ],
        max_tokens: 400,
      }),
    });

    const rawText = await res.text();
    if (!rawText) {
      return NextResponse.json({ success: true, reply: `⚠️ Groq bos yanit dondu (HTTP ${res.status}). API anahtarini kontrol edin.` });
    }

    const data = JSON.parse(rawText);
    if (!res.ok) {
      return NextResponse.json({ success: true, reply: '⚠️ Groq Hatasi: ' + (data.error?.message || res.status) });
    }

    const firstChoice = Array.isArray(data.choices) ? data.choices[0] : null;
    const reply = firstChoice?.message?.content || '⚡ Yanit olusturuldu.';
    return NextResponse.json({ success: true, reply });
  } catch (error) {
    return NextResponse.json({ success: true, reply: '⚠️ Sistem Uyarisi: ' + error.message });
  }
}
