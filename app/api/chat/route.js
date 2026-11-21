import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Rolun: ${systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kullanicinin dilinde kisa ve net cevap ver.'}\n\nSoru: ${message}`,
            },
          ],
        },
      ],
    };

    const endpoints = [
      'https://googleapis.com',
      'https://googleapis.com',
    ];

    let lastError = '';
    for (const url of endpoints) {
      try {
        const { data } = await axios.post(`${url}?key=${apiKey}`, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 8000,
        });
        const candidate = Array.isArray(data?.candidates) ? data.candidates.at(0) : null;
        const part = Array.isArray(candidate?.content?.parts) ? candidate.content.parts.at(0) : null;
        if (part?.text) {
          return NextResponse.json({ success: true, reply: part.text });
        }
      } catch (err) {
        lastError = err.response?.data?.error?.message || err.message;
      }
    }

    return NextResponse.json({ success: true, reply: '⚠️ Detay: ' + lastError });
  } catch (e) {
    return NextResponse.json({ success: true, reply: '⚠️ Hata: ' + e.message });
  }
}
