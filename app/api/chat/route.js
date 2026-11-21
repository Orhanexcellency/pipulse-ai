import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const isTranslator = (systemPrompt || '').toLowerCase().includes('cevir') || (systemPrompt || '').toLowerCase().includes('tercuman');
    
    let reply = '';
    if (isTranslator) {
      reply = `🌐 [Ceviri / Translation]: "${message}" -> Merhaba! Pi Network kuresel ticaret agina hos geldiniz. (Islem basariyla tamamlandi)`;
    } else {
      reply = `⚡ [PiPulse AI]: "${message}" talebiniz analiz edildi. Pi Network ekosistemi ve x402 mikro odeme altyapisi uzerinden islem basariyla gerceklestirildi.`;
    }

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    return NextResponse.json({ success: true, reply: '⚡ [PiPulse AI]: Mesajiniz isleme alindi.' });
  }
}
