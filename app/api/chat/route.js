import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    
    const { data } = await axios.post(
      'https://groq.com',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kullanicinin dilinde kisa ve net cevap ver.' },
          { role: 'user', content: message },
        ],
        max_tokens: 400,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );

    const reply = data?.choices?.at(0)?.message?.content || '⚡ Yanit olusturuldu.';
    return NextResponse.json({ success: true, reply });
  } catch (e) {
    const errMsg = e.response?.data?.error?.message || e.message;
    return NextResponse.json({ success: true, reply: '⚠️ Bilgi: ' + errMsg });
  }
}
