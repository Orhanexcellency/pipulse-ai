import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Eger yapay zeka sorusu geldiyse Groq'a baglan
    if (body.message) {
      const apiKey = (process.env.GROQ_API_KEY || '').trim();
      if (!apiKey) {
        return NextResponse.json({ success: true, reply: '⚠️ GROQ_API_KEY eksik.' });
      }
      const res = await fetch('https://groq.com', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: body.systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kisa ve net Turkce cevap ver.' },
            { role: 'user', content: body.message }
          ],
          max_tokens: 400
        })
      });
      const data = await res.json();
      const reply = data?.choices?.at(0)?.message?.content || ('API Uyarisi: ' + (data?.error?.message || res.status));
      return NextResponse.json({ success: true, reply });
    }

    // Normal Pi odeme onayi geldiyse onay ver
    return NextResponse.json({ approved: true });
  } catch (e) {
    return NextResponse.json({ success: true, reply: '⚠️ Hata: ' + e.message });
  }
}
