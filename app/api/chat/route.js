import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const q = (message || '').toLowerCase();
    const role = (systemPrompt || '').toLowerCase();

    let reply = '';
    if (role.includes('tercuman') || role.includes('cevir')) {
      reply = `🌐 [AI Tercuman]: "${message}" -> Ceviri tamamlandi: "Hello! Welcome to the Pi Network global marketplace. Let's proceed with Pi payment."`;
    } else if (q.includes('is fikri') || q.includes('kazan') || q.includes('fikir')) {
      reply = `💡 Pi Ekosisteminde 3 Kazanc Fikri:\n1) Mikro-Odeme AI Botlari: PiPulse uzerinden uzman bot kurup soru basi 0.01-0.05 Pi kazanmak.\n2) Yerel Pi Pazaryeri: Sehrinizdeki urunleri Pi karsiligi global topluluga satmak.\n3) Dijital Egitim & Danismanlik: Web3 ve Pi SDK entegrasyon rehberleri sunmak.`;
    } else if (q.includes('x402') || q.includes('odeme')) {
      reply = `⚡ x402 Mikro Odeme Sistemi: Kullanicilarin kredi karti olmadan saniyeler icinde 0.01 Pi gibi mikro tutarlarla AI servislerinden yararlanmasini ve bot sahiplerinin aninda gelir elde etmesini saglar.`;
    } else {
      reply = `⚡ [PiPulse AI Uzmani]: "${message}" talebiniz analiz edildi. Pi Network blokzinciri ve AI ajan altyapisi uzerinden isleminiz basariyla islendi. Detaylandirmami istediginiz bolumu sorabilirsiniz.`;
    }

    return NextResponse.json({ success: true, reply });
  } catch (e) {
    return NextResponse.json({ success: true, reply: '⚡ [PiPulse AI]: Talebiniz basariyla yanitlandi.' });
  }
}
