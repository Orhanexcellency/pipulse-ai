import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const prompt = encodeURIComponent(`Rolun: ${systemPrompt || 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kullanicinin dilinde kisa ve net cevap ver.'}\nSoru: ${message}`);
    
    const res = await fetch(`https://pollinations.ai{prompt}`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (res.ok) {
      const aiText = await res.text();
      if (aiText && aiText.trim().length > 0) {
        return NextResponse.json({ success: true, reply: aiText.trim() });
      }
    }

    return NextResponse.json({ 
      success: true, 
      reply: `⚡ [PiPulse AI]: "${message}" sorunuz islendi. Su an canli AI sunucusu yogun, lutfen tekrar deneyin.` 
    });
  } catch (e) {
    return NextResponse.json({ 
      success: true, 
      reply: `⚡ [PiPulse AI]: "${message}" talebiniz alindi. Lutfen birazdan tekrar deneyin.` 
    });
  }
}
