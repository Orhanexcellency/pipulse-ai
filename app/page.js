'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BOTS = [
  { id: '1', creator_uid: 'system', creator_username: 'PiPulse', name: 'Pi Uzmani', description: 'Pi Network, Web3 ve hackathon asistani.', system_prompt: 'Sen Pi Network konusunda uzman bir yapay zeka asistanisin. Kisa, net ve analitik Turkce cevap ver.', price_per_msg: 0.01 },
  { id: '2', creator_uid: 'system', creator_username: 'PiPulse', name: 'Global Tercuman', description: 'Anlik profesyonel cok dilli cevirmen.', system_prompt: 'Sen profesyonel bir tercuman ve dil uzmanisin. Metinleri dogal ve akici sekilde cevir.', price_per_msg: 0.01 }
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState(BOTS);
  const [bot, setBot] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('market');
  const [totalPi, setTotalPi] = useState(0);
  const [form, setForm] = useState({ name: '', description: '', system_prompt: '', price: 0.01 });

  useEffect(() => { getBots(); }, []);

  const getBots = async () => {
    const { data } = await supabase.from('ai_agents').select('*').order('created_at', { ascending: false });
    if (data?.length) setAgents(data);
  };

  const login = () => {
    setUser({ uid: 'pioneer-pro-user', username: 'PioneerPro' });
  };

  const send = async () => {
    if (!txt.trim() || !bot) return;
    if (!user) return alert('Once sag ustten Pi ile Giris yapin!');
    const q = txt; setTxt(''); setBusy(true);

    // Son 4 mesaji hafiza olarak birlestir
    const history = msgs.slice(-4).map(m => `${m.r === 'u' ? 'Kullanici' : 'Asistan'}: ${m.t}`).join('\n');
    const contextPrompt = history ? `${bot.system_prompt}\n\nOnceki Konusma:\n${history}` : bot.system_prompt;

    try {
      const res = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, systemPrompt: contextPrompt })
      });
      const text = await res.text();
      let yanit = text;
      try {
        const data = JSON.parse(text);
        yanit = data.reply || text;
      } catch (e) {}
      setTotalPi(prev => Number((prev + Number(bot.price_per_msg)).toFixed(2)));
      setMsgs(p => [...p, { r: 'u', t: q }, { r: 'a', t: `[x402 Odeme Onayli: ${bot.price_per_msg} Pi] ` + yanit }]);
    } catch (err) {
      setMsgs(p => [...p, { r: 'u', t: q }, { r: 'a', t: '⚠️ Ag Hatasi: ' + err.message }]);
    }
    setBusy(false);
  };

  const create = async (e) => {
    e.preventDefault();
    if (!user) return alert('Once sag ustten Pi ile Giris yapin!');
    setBusy(true);
    const { error } = await supabase.from('ai_agents').insert({
      creator_uid: user.uid, creator_username: user.username,
      name: form.name, description: form.description, system_prompt: form.system_prompt, price_per_msg: Number(form.price)
    });
    setBusy(false);
    if (error) return alert('DB Hatasi: ' + error.message);
    alert('Tebrikler! Uzman botunuz pazarda yayinlandi.');
    setForm({ name: '', description: '', system_prompt: '', price: 0.01 });
    setTab('market');
    getBots();
  };

  const deleteBot = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Bu botu silmek istediginize emin misiniz?')) return;
    await supabase.from('ai_agents').delete().eq('id', id);
    getBots();
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 10 }}>
        <b onClick={() => { setBot(null); setTab('market'); }} style={{ color: '#f5b041', fontSize: 18, cursor: 'pointer' }}>⚡ PiPulse AI</b>
        {user ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ background: '#1e3a2f', color: '#4ade80', padding: '4px 8px', borderRadius: 12, fontSize: 12 }}>x402: {totalPi} Pi</span>
            <span style={{ background: '#2e1a47', padding: '5px 10px', borderRadius: 14, fontSize: 12 }}>@{user.username}</span>
          </div>
        ) : (
          <button onClick={login} style={{ background: '#f5b041', padding: '8px 14px', borderRadius: 8, border: 'none', fontWeight: 'bold' }}>Pi ile Giris</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button onClick={() => { setBot(null); setTab('market'); }} style={{ flex: 1, padding: 10, background: tab === 'market' ? '#4a3578' : '#1e1633', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>🤖 Bot Pazari</button>
        <button onClick={() => { setBot(null); setTab('create'); }} style={{ flex: 1, padding: 10, background: tab === 'create' ? '#7d3c98' : '#1e1633', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>+ Bot Olustur</button>
      </div>

      {tab === 'create' && (
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Bot Adi (orn: Kripto Analist)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <input placeholder="Kisa Aciklama" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <textarea rows={4} placeholder="Uzmanlik Talimati (Botun karakterini ve kurallarini yazin)" value={form.system_prompt} onChange={e => setForm({...form, system_prompt: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <input type="number" step="0.01" min="0.01" placeholder="Mesaj Basi Ucret (Pi)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <button type="submit" disabled={busy} style={{ background: '#f5b041', padding: 13, borderRadius: 8, fontWeight: 'bold', border: 'none' }}>{busy ? 'Kaydediliyor...' : 'Botu Pazarda Yayinla'}</button>
        </form>
      )}

      {tab === 'market' && !bot && agents.map(b => (
        <div key={b.id} onClick={() => { setBot(b); setMsgs([]); }} style={{ background: '#1a142e', padding: 14, borderRadius: 12, marginBottom: 10, border: '1px solid #4a3578', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ color: '#f5b041', fontSize: 16 }}>{b.name}</b>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ background: '#2e1a47', padding: '3px 8px', borderRadius: 8, fontSize: 12 }}>{b.price_per_msg} Pi</span>
              {user && b.creator_uid === user.uid && (
                <button onClick={(e) => deleteBot(e, b.id)} style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>Sil</button>
              )}
            </div>
          </div>
          <p style={{ fontSize: 13, margin: '6px 0', color: '#ddd' }}>{b.description}</p>
          <small style={{ color: '#999' }}>Olusturan: @{b.creator_username}</small>
        </div>
      ))}

      {bot && (
        <div style={{ background: '#1a142e', padding: 12, borderRadius: 12, border: '1px solid #4a3578' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div><b>{bot.name}</b> <small style={{ color: '#4ade80' }}>● Hafiza Aktif</small></div>
            <button onClick={() => setBot(null)} style={{ color: '#f5b041', background: 'none', border: 'none', fontWeight: 'bold' }}>← Geri</button>
          </div>
          <div style={{ height: '52vh', minHeight: 340, overflowY: 'auto', background: '#0f0c29', padding: 10, borderRadius: 10, marginBottom: 10 }}>
            {msgs.length === 0 && <p style={{ color: '#666', fontSize: 13, textAlign: 'center', marginTop: 40 }}>{bot.name} hazir. Sorunuzu yazin (Mesaj basi {bot.price_per_msg} Pi).</p>}
            {msgs.map((m, i) => (
              <div key={i} style={{ textAlign: m.r === 'u' ? 'right' : 'left', margin: '8px 0' }}>
                <span style={{ background: m.r === 'u' ? '#5b2c6f' : '#261e45', padding: '8px 12px', borderRadius: 10, display: 'inline-block', fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{m.t}</span>
              </div>
            ))}
            {busy && <small style={{ color: '#f5b041' }}>AI analiz ediyor...</small>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Sorunu yaz..." style={{ flex: 1, padding: 10, borderRadius: 8 }} />
            <button onClick={send} disabled={busy} style={{ background: '#f5b041', padding: '10px 16px', borderRadius: 8, fontWeight: 'bold', border: 'none' }}>Gonder</button>
          </div>
        </div>
      )}
    </div>
  );
}
