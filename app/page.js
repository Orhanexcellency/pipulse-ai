'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';

const BOTS = [
  { id: '1', creator_username: 'PiPulse', name: 'Pi Uzmani', description: 'Pi Network ve hackathon asistani.', system_prompt: 'Sen Pi uzmanisin.', price_per_msg: 0.01 },
  { id: '2', creator_username: 'PiPulse', name: 'Ingilizce Kocu', description: 'Ingilizce pratik ogretmeni.', system_prompt: 'Sen Ingilizce ogretmenisin.', price_per_msg: 0.01 }
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState(BOTS);
  const [bot, setBot] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('market');
  const [form, setForm] = useState({ name: '', description: '', system_prompt: '', price: 0.01 });

  useEffect(() => {
    if (window.Pi) { try { window.Pi.init({ version: '2.0', sandbox: false }); } catch (e) {} }
    getBots();
  }, []);

  const getBots = async () => {
    const { data } = await supabase.from('ai_agents').select('*').order('created_at', { ascending: false });
    if (data?.length) setAgents(data);
  };

  const login = async () => {
    try {
      if (!window.Pi) return alert('Sayfayi yenileyip tekrar deneyin.');
      window.Pi.init({ version: '2.0', sandbox: false });
      const auth = await window.Pi.authenticate(['username', 'payments'], () => {});
      setUser(auth.user);
      supabase.from('users').upsert({ pi_uid: auth.user.uid, username: auth.user.username }, { onConflict: 'pi_uid' });
    } catch (e) {
      alert('Giris Hatasi: ' + (e?.message || JSON.stringify(e)));
    }
  };

  const send = async () => {
    if (!txt.trim() || !bot) return;
    if (!user) return alert('Once Pi ile giris yapin!');
    const q = txt; setTxt(''); setBusy(true);
    try {
      await window.Pi.createPayment({ amount: Number(bot.price_per_msg), memo: bot.name, metadata: { id: bot.id } }, {
        onReadyForServerApproval: (paymentId) => axios.post('/api/payments/approve', { paymentId }),
        onReadyForServerCompletion: async (paymentId, txid) => {
          await axios.post('/api/payments/complete', { paymentId, txid });
          const r = await axios.post('/api/chat', { message: q, systemPrompt: bot.system_prompt });
          setMsgs(p => [...p, { r: 'u', t: q }, { r: 'a', t: r.data.reply }]);
          setBusy(false);
        },
        onCancel: () => setBusy(false),
        onError: (e) => { setBusy(false); alert('Odeme hatasi: ' + e?.message); }
      });
    } catch (e) { setBusy(false); alert('Hata: ' + e?.message); }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!user) return alert('Once Pi ile giris yapin!');
    setBusy(true);
    const { error } = await supabase.from('ai_agents').insert({
      creator_uid: user.uid, creator_username: user.username,
      name: form.name, description: form.description, system_prompt: form.system_prompt, price_per_msg: Number(form.price)
    });
    setBusy(false);
    if (error) return alert('DB Hatasi: ' + error.message);
    alert('Bot yayinlandi!');
    setForm({ name: '', description: '', system_prompt: '', price: 0.01 });
    setTab('market');
    getBots();
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 10 }}>
        <b onClick={() => { setBot(null); setTab('market'); }} style={{ color: '#f5b041', fontSize: 18, cursor: 'pointer' }}>⚡ PiPulse AI</b>
        {user ? <span>@{user.username}</span> : <button onClick={login} style={{ background: '#f5b041', padding: '8px 14px', borderRadius: 8, border: 'none', fontWeight: 'bold' }}>Pi ile Giris</button>}
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button onClick={() => { setBot(null); setTab('market'); }} style={{ flex: 1, padding: 10, background: tab === 'market' ? '#4a3578' : '#1e1633', color: '#fff', border: 'none', borderRadius: 8 }}>🤖 Bot Pazari</button>
        <button onClick={() => { setBot(null); setTab('create'); }} style={{ flex: 1, padding: 10, background: tab === 'create' ? '#7d3c98' : '#1e1633', color: '#fff', border: 'none', borderRadius: 8 }}>+ Bot Olustur</button>
      </div>
      {tab === 'create' && (
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="Bot Adi" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ padding: 10, borderRadius: 6 }} />
          <input placeholder="Aciklama" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required style={{ padding: 10, borderRadius: 6 }} />
          <textarea placeholder="Talimat (Prompt)" value={form.system_prompt} onChange={e => setForm({...form, system_prompt: e.target.value})} required style={{ padding: 10, borderRadius: 6 }} />
          <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required style={{ padding: 10, borderRadius: 6 }} />
          <button type="submit" disabled={busy} style={{ background: '#f5b041', padding: 12, borderRadius: 8, fontWeight: 'bold', border: 'none' }}>{busy ? 'Kaydediliyor...' : 'Yayinla'}</button>
        </form>
      )}
      {tab === 'market' && !bot && agents.map(b => (
        <div key={b.id} onClick={() => { setBot(b); setMsgs([]); }} style={{ background: '#1a142e', padding: 12, borderRadius: 10, marginBottom: 10, border: '1px solid #4a3578' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><b style={{ color: '#f5b041' }}>{b.name}</b><span>{b.price_per_msg} Pi</span></div>
          <p style={{ fontSize: 13, margin: '6px 0' }}>{b.description}</p>
          <small style={{ color: '#999' }}>@{b.creator_username}</small>
        </div>
      ))}
      {bot && (
        <div style={{ background: '#1a142e', padding: 12, borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><b>{bot.name}</b><button onClick={() => setBot(null)} style={{ color: '#f5b041', background: 'none', border: 'none' }}>← Geri</button></div>
          <div style={{ height: 220, overflowY: 'auto', background: '#0f0c29', padding: 8, borderRadius: 8, marginBottom: 8 }}>
            {msgs.map((m, i) => <div key={i} style={{ textAlign: m.r === 'u' ? 'right' : 'left', margin: '4px 0' }}><span style={{ background: m.r === 'u' ? '#5b2c6f' : '#261e45', padding: '6px 10px', borderRadius: 8, display: 'inline-block' }}>{m.t}</span></div>)}
            {busy && <small style={{ color: '#f5b041' }}>Islem yapiliyor...</small>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={txt} onChange={e => setTxt(e.target.value)} placeholder="Sorunu yaz..." style={{ flex: 1, padding: 8, borderRadius: 6 }} />
            <button onClick={send} disabled={busy} style={{ background: '#f5b041', padding: '8px 14px', borderRadius: 6, fontWeight: 'bold', border: 'none' }}>Gonder</button>
          </div>
        </div>
      )}
    </div>
  );
}
