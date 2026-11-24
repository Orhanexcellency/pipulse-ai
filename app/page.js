'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BOTS = [
  { id: '1', creator_uid: 'sys', creator_username: 'PiPulse', name: 'Pi Uzmani', description: 'Pi Network ve hackathon asistani.', system_prompt: 'Sen Pi Network uzmanisin. Kisa ve net cevap ver.', price_per_msg: 0.22 },
  { id: '2', creator_uid: 'sys', creator_username: 'PiPulse', name: 'Global Tercuman', description: 'Anlik cok dilli cevirmen.', system_prompt: 'Sen profesyonel tercumansin.', price_per_msg: 0.22 }
];
const LANGS = [['🇹🇷 TR','Turkish'],['🇬🇧 EN','English'],['🇨🇳 ZH','Chinese'],['🇪🇸 ES','Spanish'],['🇮🇳 HI','Hindi'],['🇻🇳 VI','Vietnamese'],['🇰🇷 KO','Korean'],['🇸🇦 AR','Arabic'],['🇮🇩 ID','Indonesian'],['🇷🇺 RU','Russian']];

export default function Home() {
  const [user, setUser] = useState(null), [agents, setAgents] = useState(BOTS), [bot, setBot] = useState(null);
  const [msgs, setMsgs] = useState([]), [txt, setTxt] = useState(''), [busy, setBusy] = useState(false);
  const [trIdx, setTrIdx] = useState(null), [tab, setTab] = useState('market'), [bal, setBal] = useState(0.50);
  const [txs, setTxs] = useState([{ t: 'Referans & Hosgeldin Bonusu', a: '+0.50 Pi', c: '#4ade80' }]);
  const [form, setForm] = useState({ name: '', description: '', system_prompt: '', price: 0.22 });

  useEffect(() => { getBots(); }, []);
  const getBots = async () => { const { data } = await supabase.from('ai_agents').select('*').order('created_at', { ascending: false }); if (data?.length) setAgents(data); };
  const login = () => setUser({ uid: 'pioneer-pro-user', username: 'PioneerPro' });

  const send = async () => {
    if (!txt.trim() || !bot) return; if (!user) return alert('Once Pi ile Giris yapin!');
    const q = txt; setTxt(''); setBusy(true);
    const hist = msgs.slice(-4).map(m => `${m.r === 'u' ? 'User' : 'AI'}: ${m.t}`).join('\n');
    try {
      const res = await fetch('/api/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, systemPrompt: hist ? `${bot.system_prompt}\n\nHistory:\n${hist}` : bot.system_prompt }) });
      const data = await res.json();
      const p = Number(bot.price_per_msg);
      setBal(b => Number((b - p).toFixed(2)));
      setTxs(prev => [{ t: `Gider: ${bot.name} Sorusu`, a: `-${p} Pi`, c: '#f87171' }, ...prev]);
      setMsgs(prev => [...prev, { r: 'u', t: q }, { r: 'a', t: `[x402 Odeme: ${p} Pi] ` + (data.reply || 'Yanit hazir.') }]);
    } catch (e) { setMsgs(prev => [...prev, { r: 'u', t: q }, { r: 'a', t: '⚠️ Hata: ' + e.message }]); }
    setBusy(false);
  };

  const trMsg = async (idx, raw, lang) => {
    setTrIdx(idx); setMsgs(p => p.map((m, i) => i === idx ? { ...m, tr: `⏳ ${lang} cevriliyor...` } : m));
    try {
      const res = await fetch('/api/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: raw.replace(/^\[x402.*?\]\s*/, ''), systemPrompt: `Translate into ${lang}. Return ONLY translation.` }) });
      const data = await res.json();
      setMsgs(p => p.map((m, i) => i === idx ? { ...m, tr: `[🌐 ${lang}]: ${data.reply || 'Tekrar deneyin.'}` } : m));
    } catch (e) {} setTrIdx(null);
  };

  const create = async (e) => {
    e.preventDefault(); if (!user) return alert('Once Pi ile Giris yapin!'); setBusy(true);
    const { error } = await supabase.from('ai_agents').insert({ creator_uid: user.uid, creator_username: user.username, name: form.name, description: form.description, system_prompt: form.system_prompt, price_per_msg: Number(form.price) });
    setBusy(false); if (error) return alert(error.message);
    setBal(b => Number((b + 0.25).toFixed(2)));
    setTxs(p => [{ t: `Gelir: ${form.name} Yayin Odulu`, a: '+0.25 Pi', c: '#4ade80' }, ...p]);
    alert('Bot yayinlandi! +0.25 Pi kazanc eklendi.'); setForm({ name: '', description: '', system_prompt: '', price: 0.22 }); setTab('market'); getBots();
  };

  const withdraw = () => {
    if (bal <= 0) return alert('Cekilebilir bakiye bulunmuyor.');
    alert(`${bal} Pi tutarindaki kazanciniz @${user?.username || 'Pioneer'} Pi Cuzdaniniza aktarildi!`);
    setTxs(p => [{ t: 'Pi Cuzdana Cekim (Mainnet)', a: `-${bal} Pi`, c: '#f5b041' }, ...p]);
    setBal(0);
  };

  const delBot = async (e, id) => { e.stopPropagation(); if (confirm('Silinsin mi?')) { await supabase.from('ai_agents').delete().eq('id', id); getBots(); } };
  const refUrl = 'https://vercel.app' + (user?.username || 'Pioneer');

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 10 }}>
        <b onClick={() => { setBot(null); setTab('market'); }} style={{ color: '#f5b041', fontSize: 18 }}>⚡ PiPulse AI</b>
        {user ? <span style={{ background: '#2e1a47', padding: '5px 10px', borderRadius: 14, fontSize: 12 }}>@{user.username}</span> : <button onClick={login} style={{ background: '#f5b041', padding: '8px 14px', borderRadius: 8, border: 'none', fontWeight: 'bold' }}>Pi ile Giris</button>}
      </div>
      <div style={{ display: 'flex', gap: 6, margin: '12px 0' }}>
        <button onClick={() => { setBot(null); setTab('market'); }} style={{ flex: 1, padding: 9, background: tab === 'market' ? '#4a3578' : '#1e1633', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}>🤖 Pazar</button>
        <button onClick={() => { setBot(null); setTab('create'); }} style={{ flex: 1, padding: 9, background: tab === 'create' ? '#7d3c98' : '#1e1633', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}>+ Bot Kur</button>
        <button onClick={() => { setBot(null); setTab('wallet'); }} style={{ flex: 1, padding: 9, background: tab === 'wallet' ? '#1e4620' : '#1e1633', color: '#4ade80', border: 'none', borderRadius: 8, fontSize: 12 }}>💰 Cuzdan ({bal} Pi)</button>
      </div>
      {tab === 'wallet' && (
        <div style={{ background: '#1a142e', padding: 14, borderRadius: 12, border: '1px solid #4a3578' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f0c29', padding: 12, borderRadius: 10, marginBottom: 12 }}>
            <div><small style={{ color: '#999' }}>Cekilebilir Bakiye</small><div style={{ fontSize: 20, fontWeight: 'bold', color: '#4ade80' }}>{bal} Pi</div></div>
            <button onClick={withdraw} style={{ background: '#4ade80', color: '#000', padding: '9px 14px', borderRadius: 8, border: 'none', fontWeight: 'bold', fontSize: 12 }}>Cuzdana Cek</button>
          </div>
          <b style={{ color: '#f5b041', fontSize: 13 }}>🎁 Referans Linki (%10 Pi Komisyon)</b>
          <div style={{ display: 'flex', gap: 6, margin: '6px 0 14px' }}>
            <input readOnly value={refUrl} style={{ flex: 1, padding: 8, borderRadius: 6, fontSize: 11, background: '#0f0c29', color: '#fff', border: '1px solid #333' }} />
            <button onClick={() => { navigator.clipboard?.writeText(refUrl); alert('Referans linki kopyalandi!'); }} style={{ background: '#f5b041', padding: '8px 12px', borderRadius: 6, border: 'none', fontWeight: 'bold', fontSize: 12 }}>Kopyala</button>
          </div>
          <b style={{ color: '#f5b041', fontSize: 13 }}>📊 x402 Gelir / Gider Tablosu</b>
          {txs.map((x, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #2a214a', fontSize: 13 }}><span>{x.t}</span><b style={{ color: x.c }}>{x.a}</b></div>)}
        </div>
      )}
      {tab === 'create' && (
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Bot Adi" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <input placeholder="Aciklama" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <textarea rows={3} placeholder="Talimat (Prompt)" value={form.system_prompt} onChange={e => setForm({...form, system_prompt: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <input type="number" step="0.01" min="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <button type="submit" disabled={busy} style={{ background: '#f5b041', padding: 13, borderRadius: 8, fontWeight: 'bold', border: 'none' }}>{busy ? 'Kaydediliyor...' : 'Yayinla (+0.25 Pi Gelir)'}</button>
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
