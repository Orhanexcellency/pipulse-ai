import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: true, reply: '⚠️ Vercel ayarlarinda GROQ_API_KEY eksik veya Redeploy yapilmamis.' });
    }

    const res = await fetch('https://groq.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt || 'Sen yardimci bir Pi Network yapay zeka asistanisin.' },
          { role: 'user', content: message },
        ],
        max_tokens: 500,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: true, reply: '⚠️ API Hatasi: ' + (data.error?.message || res.status) });
    }

    const reply = data.choices[0].message.content;
    return NextResponse.json({ success: true, reply });
  } catch (error) {
    return NextResponse.json({ success: true, reply: '⚠️ Hata: ' + error.message });
  }
}
