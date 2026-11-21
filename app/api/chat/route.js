import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    const { data } = await axios.post(
      'https://googleapis.com',
      {
        contents: [
          {
            parts: [
              {
                text: `Rolun: ${systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin.'}\n\nSoru: ${message}`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        timeout: 9000,
      }
    );

    const candidate = Array.isArray(data?.candidates) ? data.candidates.at(0) : null;
    const part = Array.isArray(candidate?.content?.parts) ? candidate.content.parts.at(0) : null;
    const reply = part?.text || '⚡ Yanit olusturuldu.';
    return NextResponse.json({ success: true, reply });
  } catch (e) {
    const errMsg = e.response?.data?.error?.message || e.message;
    return NextResponse.json({ success: true, reply: '⚠️ Detay: ' + errMsg });
  }
}
