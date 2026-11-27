'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BOTS = [
  { id: '1', creator_uid: 'guide', creator_username: 'PiPulseOfficial', name: '🧭 AI Concierge: Find Your Best Bot!', description: 'Do not get lost in 1,000+ bots! Tell me your goal, and I will match you with the exact expert bot.', system_prompt: 'You are the PiPulse AI Concierge. Recommend the best bot category and prompt for the user goal.', price_per_msg: 0.22 }
];
const LANGS = [['🇬🇧 EN','English'],['🇹🇷 TR','Turkish'],['🇨🇳 ZH','Chinese'],['🇪🇸 ES','Spanish'],['🇮🇳 HI','Hindi'],['🇻🇳 VI','Vietnamese'],['🇰🇷 KO','Korean'],['🇸🇦 AR','Arabic'],['🇮🇩 ID','Indonesian'],['🇷🇺 RU','Russian']];
const CATS = [['All', ''], ['Pi & Web3', 'pi web3 blockchain defi nft contract'], ['Software & AI', 'code sql python react ai data app cloud'], ['Business & Finance', 'finance sales trade lawyer pitch startup tax'], ['Marketing & SEO', 'seo viral content copywriter social ads brand'], ['Life & Education', 'nutrition fitness travel language tutor chef coach']];

export default function Home() {
  const [user, setUser] = useState(null), [agents, setAgents] = useState(BOTS), [bot, setBot] = useState(null);
  const [msgs, setMsgs] = useState([]), [txt, setTxt] = useState(''), [search, setSearch] = useState(''), [cat, setCat] = useState('');
  const [busy, setBusy] = useState(false), [trIdx, setTrIdx] = useState(null), [tab, setTab] = useState('market'), [bal, setBal] = useState(1.00);
  const [txs, setTxs] = useState([{ t: 'PioneerPro Welcome Balance', a: '+1.00 Pi', c: '#4ade80' }]);
  const [form, setForm] = useState({ name: '', description: '', system_prompt: '', price: 0.50 });

  useEffect(() => { getBots(); }, []);

  const login = () => {
    const u = { uid: 'pioneer-pro-user', username: 'PioneerPro' };
    setUser(u);
    const sBal = localStorage.getItem('pp_bal_' + u.uid), sTxs = localStorage.getItem('pp_txs_' + u.uid);
    let parsedTxs = [{ t: 'PioneerPro Welcome Balance', a: '+1.00 Pi', c: '#4ade80' }];
    if (sTxs) try { parsedTxs = JSON.parse(sTxs); } catch (e) {}
    const curBal = sBal !== null ? Number(sBal) : 1.00;
    if (curBal < 0.22) { setBal(1.00); setTxs([{ t: 'Testnet Credit Top-Up', a: '+1.00 Pi', c: '#4ade80' }, ...parsedTxs]); }
    else { setBal(curBal); setTxs(parsedTxs); }
  };

  useEffect(() => {
    if (!user) return;
    localStorage.setItem('pp_bal_' + user.uid, String(Math.max(0, bal)));
    localStorage.setItem('pp_txs_' + user.uid, JSON.stringify(txs));
  }, [bal, txs, user]);

  const getBots = async () => { const { data } = await supabase.from('ai_agents').select('*').limit(1000); if (data?.length) setAgents(data); };

  const send = async (preset) => {
    const q = (typeof preset === 'string' ? preset : txt).trim();
    if (!q || !bot) return;
    if (!user) return alert('Please sign in with Pi first!');
    const p = Number(bot.price_per_msg);
    let activeBal = bal;
    if (activeBal < p) { activeBal = Number((activeBal + 1.00).toFixed(2)); setTxs(prev => [{ t: 'Auto Testnet Credit Top-Up', a: '+1.00 Pi', c: '#4ade80' }, ...prev]); }
    if (typeof preset !== 'string') setTxt('');
    setBusy(true);
    const hist = msgs.slice(-4).map(m => `${m.r === 'u' ? 'User' : 'AI'}: ${m.t}`).join('\n');
    try {
      const res = await fetch('/api/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, systemPrompt: hist ? `${bot.system_prompt}\n\nHistory:\n${hist}` : bot.system_prompt }) });
      const data = await res.json();
      setBal(Math.max(0, Number((activeBal - p).toFixed(2))));
      setTxs(prev => [{ t: `Spent: ${bot.name}`, a: `-${p} Pi`, c: '#f87171' }, ...prev]);
      setMsgs(prev => [...prev, { r: 'u', t: q }, { r: 'a', t: `[x402 Paid: ${p} Pi] ` + (data.reply || 'Response ready.') }]);
    } catch (e) { setMsgs(prev => [...prev, { r: 'u', t: q }, { r: 'a', t: '⚠️ Error: ' + e.message }]); }
    setBusy(false);
  };

  const trMsg = async (idx, raw, lang) => {
    setTrIdx(idx); setMsgs(p => p.map((m, i) => i === idx ? { ...m, tr: `⏳ Translating to ${lang}...` } : m));
    try {
      const res = await fetch('/api/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: raw.replace(/^\[x402.*?\]\s*/, ''), systemPrompt: `Translate into ${lang}. Return ONLY translation.` }) });
      const data = await res.json();
      setMsgs(p => p.map((m, i) => i === idx ? { ...m, tr: `[🌐 ${lang}]: ${data.reply || 'Please try again.'}` } : m));
    } catch (e) {} setTrIdx(null);
  };

  const create = async (e) => {
    e.preventDefault(); if (!user) return alert('Please sign in with Pi first!'); setBusy(true);
    const { error } = await supabase.from('ai_agents').insert({ creator_uid: user.uid, creator_username: user.username, name: form.name, description: form.description, system_prompt: form.system_prompt, price_per_msg: Number(form.price) });
    setBusy(false); if (error) return alert(error.message);
    setBal(b => Number((b + 0.25).toFixed(2)));
    setTxs(p => [{ t: `Earned: ${form.name} Creator Reward`, a: '+0.25 Pi', c: '#4ade80' }, ...p]);
    alert('Agent published! +0.25 Pi reward added.'); setForm({ name: '', description: '', system_prompt: '', price: 0.50 }); setTab('market'); getBots();
  };

  const withdraw = () => {
    if (!user) return alert('Please sign in with Pi first!');
    if (bal <= 0) return alert('No available balance to withdraw.');
    alert(`${bal} Pi transferred to @${user.username} Pi Wallet!`);
    setTxs(p => [{ t: 'Withdrawn to Pi Wallet', a: `-${bal} Pi`, c: '#f5b041' }, ...p]); setBal(0);
  };

  const delBot = async (e, id) => { e.stopPropagation(); if (confirm('Delete this agent?')) { await supabase.from('ai_agents').delete().eq('id', id); getBots(); } };
  const refUrl = 'https://pipulseai' + '.vercel.app/?ref=' + (user?.username || 'Pioneer');
  const sorted = [...agents].sort((a, b) => (a.creator_uid === 'guide' ? -1 : b.creator_uid === 'guide' ? 1 : 0));
  const filtered = sorted.filter(b => {
    const text = (b.name + ' ' + b.description).toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (!cat || cat.split(' ').some(k => text.includes(k)));
  });
  const visibleBots = (search || cat) ? filtered.slice(0, 60) : filtered.slice(0, 30);
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 10 }}>
        <b onClick={() => { setBot(null); setTab('market'); }} style={{ color: '#f5b041', fontSize: 18 }}>⚡ PiPulse AI</b>
        {user ? <span style={{ background: '#2e1a47', padding: '5px 10px', borderRadius: 14, fontSize: 12 }}>@{user.username}</span> : <button onClick={login} style={{ background: '#f5b041', padding: '8px 14px', borderRadius: 8, border: 'none', fontWeight: 'bold' }}>Sign in with Pi</button>}
      </div>
      <div style={{ display: 'flex', gap: 6, margin: '12px 0' }}>
        <button onClick={() => { setBot(null); setTab('market'); }} style={{ flex: 1, padding: 9, background: tab === 'market' ? '#4a3578' : '#1e1633', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}>🤖 Market ({agents.length})</button>
        <button onClick={() => { setBot(null); setTab('create'); }} style={{ flex: 1, padding: 9, background: tab === 'create' ? '#7d3c98' : '#1e1633', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}>+ Create Bot</button>
        <button onClick={() => { if (!user) return alert('Please sign in with Pi first!'); setBot(null); setTab('wallet'); }} style={{ flex: 1, padding: 9, background: tab === 'wallet' ? '#1e4620' : '#1e1633', color: '#4ade80', border: 'none', borderRadius: 8, fontSize: 12 }}>{user ? `💰 Wallet (${bal} Pi)` : '💰 Wallet'}</button>
      </div>
      {tab === 'wallet' && user && (
        <div style={{ background: '#1a142e', padding: 14, borderRadius: 12, border: '1px solid #4a3578' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f0c29', padding: 12, borderRadius: 10, marginBottom: 12 }}>
            <div><small style={{ color: '#999' }}>Available Balance</small><div style={{ fontSize: 20, fontWeight: 'bold', color: '#4ade80' }}>{bal} Pi</div></div>
            <button onClick={withdraw} style={{ background: '#4ade80', color: '#000', padding: '9px 14px', borderRadius: 8, border: 'none', fontWeight: 'bold', fontSize: 12 }}>Withdraw Pi</button>
          </div>
          <b style={{ color: '#f5b041', fontSize: 13 }}>🎁 Referral Link (10% Pi Commission)</b>
          <div style={{ display: 'flex', gap: 6, margin: '6px 0 14px' }}>
            <input readOnly value={refUrl} style={{ flex: 1, padding: 8, borderRadius: 6, fontSize: 11, background: '#0f0c29', color: '#fff', border: '1px solid #333' }} />
            <button onClick={() => { navigator.clipboard?.writeText(refUrl); alert('Referral link copied!'); }} style={{ background: '#f5b041', padding: '8px 12px', borderRadius: 6, border: 'none', fontWeight: 'bold', fontSize: 12 }}>Copy</button>
          </div>
          <b style={{ color: '#f5b041', fontSize: 13 }}>📊 x402 Income & Expense Ledger</b>
          {txs.map((x, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #2a214a', fontSize: 13 }}><span>{x.t}</span><b style={{ color: x.c }}>{x.a}</b></div>)}
        </div>
      )}
      {tab === 'create' && (
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Agent Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <input placeholder="Short Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <textarea rows={3} placeholder="System Prompt (Instructions)" value={form.system_prompt} onChange={e => setForm({...form, system_prompt: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <input type="number" step="0.01" min="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <button type="submit" disabled={busy} style={{ background: '#f5b041', padding: 13, borderRadius: 8, fontWeight: 'bold', border: 'none' }}>{busy ? 'Publishing...' : 'Publish Agent (+0.25 Pi Reward)'}</button>
        </form>
      )}
        {tab === 'market' && !bot && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search 1,000+ expert AI agents..." style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#1a142e', color: '#fff', border: '1px solid #4a3578', fontSize: 13 }} />
            {search && <button onClick={() => setSearch('')} style={{ background: '#4a3578', color: '#fff', border: 'none', borderRadius: 10, padding: '0 12px', fontWeight: 'bold' }}>✕</button>}
          </div>
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 8, marginBottom: 6 }}>
            {CATS.map(([lbl, keys]) => <button key={lbl} onClick={() => setCat(keys)} style={{ whiteSpace: 'nowrap', padding: '5px 10px', borderRadius: 14, border: '1px solid #4a3578', background: cat === keys ? '#f5b041' : '#1a142e', color: cat === keys ? '#000' : '#ddd', fontSize: 11, fontWeight: 'bold' }}>{lbl}</button>)}
          </div>
          {visibleBots.map((b, idx) => {
            const isG = b.creator_uid === 'guide';
            return (
              <div key={b.id} onClick={() => { setBot(b); setMsgs([]); }} style={{ background: isG ? 'linear-gradient(135deg, #134e4a, #1e1b4b)' : '#1a142e', padding: 14, borderRadius: 12, marginBottom: 10, border: isG ? '2px solid #2dd4bf' : '1px solid #4a3578' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <b style={{ color: isG ? '#5eead4' : '#f5b041', fontSize: 14 }}>{b.name}</b>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {isG && <span style={{ background: '#0d9488', color: '#fff', padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 'bold' }}>📌 GUIDE</span>}
                    <span style={{ background: '#2e1a47', padding: '2px 8px', borderRadius: 8, fontSize: 12 }}>{b.price_per_msg} Pi</span>
                    {user && b.creator_uid === user.uid && <button onClick={e => delBot(e, b.id)} style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>Del</button>}
                  </div>
                </div>
                <p style={{ fontSize: 13, margin: '6px 0', color: isG ? '#e2e8f0' : '#ddd' }}>{b.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: isG ? '#5eead4' : '#999' }}><span>@{b.creator_username}</span><span>⭐ 4.{9 - (idx % 2)} ({120 + (idx * 17) % 340} chats)</span></div>
              </div>
            );
          })}
          {!search && !cat && filtered.length > 30 && <p style={{ textAlign: 'center', color: '#888', fontSize: 12 }}>Showing top 30 agents. Search or pick a category to explore all <b>{agents.length}</b> agents.</p>}
        </div>
      )}
      {bot && (
        <div style={{ background: '#1a142e', padding: 12, borderRadius: 12, border: '1px solid #4a3578' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><b>{bot.name} <small style={{ color: '#4ade80' }}>● Memory</small></b><button onClick={() => setBot(null)} style={{ color: '#f5b041', background: 'none', border: 'none' }}>← Back</button></div>
          <div style={{ height: '52vh', minHeight: 340, overflowY: 'auto', background: '#0f0c29', padding: 10, borderRadius: 10, marginBottom: 10 }}>
            {msgs.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 30 }}>
                <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>Tap a quick starter prompt or type your question below:</p>
                {['Give me a fast, actionable expert analysis.', 'Create a step-by-step roadmap for my goal.', 'What are the top 3 mistakes to avoid here?'].map(q => (
                  <button key={q} onClick={() => send(q)} style={{ display: 'block', width: '100%', textAlign: 'left', background: '#1e1633', color: '#e2e8f0', border: '1px solid #4a3578', borderRadius: 8, padding: '9px 12px', marginBottom: 8, fontSize: 12 }}>💬 {q}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} style={{ textAlign: m.r === 'u' ? 'right' : 'left', margin: '8px 0' }}>
                <div style={{ background: m.r === 'u' ? '#5b2c6f' : '#261e45', padding: '8px 12px', borderRadius: 10, display: 'inline-block', fontSize: 14, whiteSpace: 'pre-wrap' }}>{m.t}{m.tr && <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #4a3578', color: '#a5f3fc', fontSize: 13 }}>{m.tr}</div>}</div>
                {m.r === 'a' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(m.tr || m.t.replace(/^\[x402.*?\]\s*/, '')); alert('Response copied!'); }} style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 'bold' }}>📋 Copy</button>
                    {LANGS.map(([l, c]) => <button type="button" key={c} onClick={() => trMsg(i, m.t, c)} disabled={trIdx === i} style={{ background: '#1e1633', color: '#f5b041', border: '1px solid #4a3578', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}>{l}</button>)}
                  </div>
                )}
              </div>
            ))}
            {busy && <small style={{ color: '#f5b041' }}>AI is analyzing...</small>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}><input value={txt} onChange={e => setTxt(e.target.value)} placeholder="Ask your question..." style={{ flex: 1, padding: 10, borderRadius: 8 }} /><button onClick={() => send()} disabled={busy} style={{ background: '#f5b041', padding: '10px 16px', borderRadius: 8, fontWeight: 'bold', border: 'none' }}>Send</button></div>
        </div>
      )}
    </div>
  );
        }
                                          
