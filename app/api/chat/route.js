import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const res = await fetch('https://groq.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
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
    const firstChoice = Array.isArray(data.choices) ? data.choices.at(0) : null;
    const reply = firstChoice?.message?.content || '⚡ Yanit olusturuldu.';
    return NextResponse.json({ success: true, reply });
  } catch (error) {
    return NextResponse.json({ success: true, reply: '⚡ Baglanti yogun, lutfen tekrar deneyin.' });
  }
}
