import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const apiKey = (process.env.GROQ_API_KEY || '').trim();

    const res = await fetch('https://groq.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kisa ve net Turkce cevap ver.' },
          { role: 'user', content: message }
        ],
        max_tokens: 400
      })
    });

    const data = await res.json();
    const reply = data?.choices?.at(0)?.message?.content || ('API Uyarisi: ' + (data?.error?.message || res.status));
    return NextResponse.json({ success: true, reply });
  } catch (e) {
    return NextResponse.json({ success: true, reply: 'Baglanti Hatasi: ' + e.message });
  }
}
