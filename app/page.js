'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BOTS = [
  { id: '1', creator_uid: 'sys', creator_username: 'PiPulse', name: 'Pi Uzmani', description: 'Pi Network ve hackathon asistani.', system_prompt: 'Sen Pi Network uzmanisin. Kisa ve net cevap ver.', price_per_msg: 0.01 },
  { id: '2', creator_uid: 'sys', creator_username: 'PiPulse', name: 'Global Tercuman', description: 'Anlik cok dilli cevirmen.', system_prompt: 'Sen profesyonel tercumansin.', price_per_msg: 0.01 }
];
const LANGS = [['🇹🇷 TR','Turkish'],['🇬🇧 EN','English'],['🇨🇳 ZH','Chinese'],['🇪🇸 ES','Spanish'],['🇮🇳 HI','Hindi'],['🇻🇳 VI','Vietnamese'],['🇰🇷 KO','Korean'],['🇸🇦 AR','Arabic'],['🇮🇩 ID','Indonesian'],['🇷🇺 RU','Russian']];

export default function Home() {
  const [user, setUser] = useState(null), [agents, setAgents] = useState(BOTS), [bot, setBot] = useState(null);
  const [msgs, setMsgs] = useState([]), [txt, setTxt] = useState(''), [busy, setBusy] = useState(false);
  const [trIdx, setTrIdx] = useState(null), [tab, setTab] = useState('market'), [totalPi, setTotalPi] = useState(0);
  const [form, setForm] = useState({ name: '', description: '', system_prompt: '', price: 0.01 });

  useEffect(() => { getBots(); }, []);
  const getBots = async () => { const { data } = await supabase.from('ai_agents').select('*').order('created_at', { ascending: false }); if (data?.length) setAgents(data); };
  const login = () => setUser({ uid: 'pioneer-pro-user', username: 'PioneerPro' });

  const send = async () => {
    if (!txt.trim() || !bot) return;
    if (!user) return alert('Once Pi ile Giris yapin!');
    const q = txt; setTxt(''); setBusy(true);
    const hist = msgs.slice(-4).map(m => `${m.r === 'u' ? 'User' : 'AI'}: ${m.t}`).join('\n');
    try {
      const res = await fetch('/api/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, systemPrompt: hist ? `${bot.system_prompt}\n\nHistory:\n${hist}` : bot.system_prompt }) });
      const data = await res.json();
      setTotalPi(p => Number((p + Number(bot.price_per_msg)).toFixed(2)));
      setMsgs(p => [...p, { r: 'u', t: q }, { r: 'a', t: `[x402 Odeme Onayli: ${bot.price_per_msg} Pi] ` + (data.reply || 'Yanit olusturuldu.') }]);
    } catch (e) { setMsgs(p => [...p, { r: 'u', t: q }, { r: 'a', t: '⚠️ Hata: ' + e.message }]); }
    setBusy(false);
  };

  const trMsg = async (idx, raw, lang) => {
    setTrIdx(idx); setMsgs(p => p.map((m, i) => i === idx ? { ...m, tr: `⏳ ${lang} cevriliyor...` } : m));
    try {
      const res = await fetch('/api/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: raw.replace(/^\[x402.*?\]\s*/, ''), systemPrompt: `Translate naturally into ${lang}. Return ONLY the translation.` }) });
      const data = await res.json();
      setMsgs(p => p.map((m, i) => i === idx ? { ...m, tr: `[🌐 ${lang}]: ${data.reply || 'Tekrar deneyin.'}` } : m));
    } catch (e) { setMsgs(p => p.map((m, i) => i === idx ? { ...m, tr: `⚠️ Hata: ${e.message}` } : m)); }
    setTrIdx(null);
  };

  const create = async (e) => {
    e.preventDefault(); if (!user) return alert('Once Pi ile Giris yapin!'); setBusy(true);
    const { error } = await supabase.from('ai_agents').insert({ creator_uid: user.uid, creator_username: user.username, name: form.name, description: form.description, system_prompt: form.system_prompt, price_per_msg: Number(form.price) });
    setBusy(false); if (error) return alert(error.message);
    alert('Botunuz yayinlandi!'); setForm({ name: '', description: '', system_prompt: '', price: 0.01 }); setTab('market'); getBots();
  };

  const delBot = async (e, id) => { e.stopPropagation(); if (confirm('Silinsin mi?')) { await supabase.from('ai_agents').delete().eq('id', id); getBots(); } };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 10 }}>
        <b onClick={() => { setBot(null); setTab('market'); }} style={{ color: '#f5b041', fontSize: 18 }}>⚡ PiPulse AI</b>
        {user ? <div style={{ display: 'flex', gap: 6 }}><span style={{ background: '#1e3a2f', color: '#4ade80', padding: '4px 8px', borderRadius: 12, fontSize: 12 }}>x402: {totalPi} Pi</span><span style={{ background: '#2e1a47', padding: '5px 10px', borderRadius: 14, fontSize: 12 }}>@{user.username}</span></div> : <button onClick={login} style={{ background: '#f5b041', padding: '8px 14px', borderRadius: 8, border: 'none', fontWeight: 'bold' }}>Pi ile Giris</button>}
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button onClick={() => { setBot(null); setTab('market'); }} style={{ flex: 1, padding: 10, background: tab === 'market' ? '#4a3578' : '#1e1633', color: '#fff', border: 'none', borderRadius: 8 }}>🤖 Bot Pazari</button>
        <button onClick={() => { setBot(null); setTab('create'); }} style={{ flex: 1, padding: 10, background: tab === 'create' ? '#7d3c98' : '#1e1633', color: '#fff', border: 'none', borderRadius: 8 }}>+ Bot Olustur</button>
      </div>
      {tab === 'create' && (
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Bot Adi" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <input placeholder="Aciklama" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <textarea rows={3} placeholder="Talimat (Prompt)" value={form.system_prompt} onChange={e => setForm({...form, system_prompt: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <input type="number" step="0.01" min="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <button type="submit" disabled={busy} style={{ background: '#f5b041', padding: 13, borderRadius: 8, fontWeight: 'bold', border: 'none' }}>{busy ? 'Kaydediliyor...' : 'Yayinla'}</button>
        </form>
      )}
      {tab === 'market' && !bot && agents.map(b => (
        <div key={b.id} onClick={() => { setBot(b); setMsgs([]); }} style={{ background: '#1a142e', padding: 14, borderRadius: 12, marginBottom: 10, border: '1px solid #4a3578' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><b style={{ color: '#f5b041' }}>{b.name}</b><div style={{ display: 'flex', gap: 6 }}><span style={{ background: '#2e1a47', padding: '2px 8px', borderRadius: 8, fontSize: 12 }}>{b.price_per_msg} Pi</span>{user && b.creator_uid === user.uid && <button onClick={e => delBot(e, b.id)} style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>Sil</button>}</div></div>
          <p style={{ fontSize: 13, margin: '6px 0' }}>{b.description}</p><small style={{ color: '#999' }}>@{b.creator_username}</small>
        </div>
      ))}
      {bot && (
        <div style={{ background: '#1a142e', padding: 12, borderRadius: 12, border: '1px solid #4a3578' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><b>{bot.name} <small style={{ color: '#4ade80' }}>● Hafiza</small></b><button onClick={() => setBot(null)} style={{ color: '#f5b041', background: 'none', border: 'none' }}>← Geri</button></div>
          <div style={{ height: '52vh', minHeight: 340, overflowY: 'auto', background: '#0f0c29', padding: 10, borderRadius: 10, marginBottom: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ textAlign: m.r === 'u' ? 'right' : 'left', margin: '8px 0' }}>
                <div style={{ background: m.r === 'u' ? '#5b2c6f' : '#261e45', padding: '8px 12px', borderRadius: 10, display: 'inline-block', fontSize: 14, whiteSpace: 'pre-wrap' }}>{m.t}{m.tr && <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #4a3578', color: '#a5f3fc', fontSize: 13 }}>{m.tr}</div>}</div>
                {m.r === 'a' && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>{LANGS.map(([l, c]) => <button type="button" key={c} onClick={() => trMsg(i, m.t, c)} disabled={trIdx === i} style={{ background: '#1e1633', color: '#f5b041', border: '1px solid #4a3578', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}>{l}</button>)}</div>}
              </div>
            ))}
            {busy && <small style={{ color: '#f5b041' }}>AI analiz ediyor...</small>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}><input value={txt} onChange={e => setTxt(e.target.value)} placeholder="Sorunu yaz..." style={{ flex: 1, padding: 10, borderRadius: 8 }} /><button onClick={send} disabled={busy} style={{ background: '#f5b041', padding: '10px 16px', borderRadius: 8, fontWeight: 'bold', border: 'none' }}>Gonder</button></div>
        </div>
      )}
    </div>
  );
}
