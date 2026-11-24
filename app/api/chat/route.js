import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const key = (process.env.GROQ_API_KEY || '').trim();
    const endpoint = 'https://groq.com' + '/chat/completions';

    const { data } = await axios.post(
      endpoint,
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kisa ve net Turkce cevap ver.' },
          { role: 'user', content: message },
        ],
        max_tokens: 400,
      },
      {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        timeout: 9000,
      }
    );

    const reply = data?.choices?.at(0)?.message?.content || 'Yanit olusturuldu.';
    return NextResponse.json({ success: true, reply });
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message;
    return NextResponse.json({ success: true, reply: '⚠️ Hata: ' + msg });
  }
}
