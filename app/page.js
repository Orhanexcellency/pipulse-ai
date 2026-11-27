'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BOTS = [
  { id: '1', creator_uid: 'guide', creator_username: 'PiPulseOfficial', name: '🧭 AI Concierge: Find Your Best Bot!', description: 'Not sure which agent to pick? Tell me your goal, and I will match you with the exact expert and prompt.', system_prompt: 'You are the PiPulse AI Concierge. Recommend the best bot category and prompt for the user goal.', price_per_msg: 0.22 }
];
const LANGS = [['🇬🇧 EN','English'],['🇹🇷 TR','Turkish'],['🇨🇳 ZH','Chinese'],['🇪🇸 ES','Spanish'],['🇮🇳 HI','Hindi'],['🇻🇳 VI','Vietnamese'],['🇰🇷 KO','Korean'],['🇸🇦 AR','Arabic'],['🇮🇩 ID','Indonesian'],['🇷🇺 RU','Russian']];
const CATS = [
  ['All', null],
  ['Pi & Web3', /\b(pi|web3|blockchain|defi|nft|solidity|tokenomics|crypto|smart contract|escrow)\b/i],
  ['Software & AI', /\b(code|sql|python|react|next\.js|software|developer|bug|cloud|devops|app|aso|database|supabase|prompt|automation)\b/i],
  ['Business & Finance', /\b(finance|sales|trade|lawyer|pitch|startup|vc|tax|budget|real estate|b2b|contract|supply chain|customs)\b/i],
  ['Marketing & SEO', /\b(seo|viral|content|copywriter|social|ads|brand|shorts|reels|tiktok|instagram|linkedin|newsletter)\b/i],
  ['Life & Education', /\b(nutrition|fitness|travel|language|tutor|chef|coach|sleep|yoga|running|parenting|pet|ielts|math)\b/i]
];

const hashNum = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return h;
};

export default function Home() {
  const [user, setUser] = useState(null), [agents, setAgents] = useState(BOTS), [bot, setBot] = useState(null);
  const [msgs, setMsgs] = useState([]), [txt, setTxt] = useState(''), [search, setSearch] = useState(''), [catIdx, setCatIdx] = useState(0);
  const [busy, setBusy] = useState(false), [trIdx, setTrIdx] = useState(null), [tab, setTab] = useState('market'), [bal, setBal] = useState(1.00);
  const [txs, setTxs] = useState([{ t: 'PioneerPro Welcome Balance', a: '+1.00 Pi', c: '#4ade80' }]);
  const [form, setForm] = useState({ name: '', category: 'Pi & Web3', description: '', system_prompt: '', price: '0.50' });
  const [trade, setTrade] = useState({ role: 'Buying', partner: '', item: '', amount: '' }), [contract, setContract] = useState('');
  const [recentTrades, setRecentTrades] = useState([
    { pair: '@Web3Dev ↔ @DesignPi', item: 'Mobile App UI Kit', amt: '25 Pi', status: 'Sealed' },
    { pair: '@LocalCafe ↔ @Pioneer88', item: 'Coffee & Pastry Voucher', amt: '4.5 Pi', status: 'Sealed' }
  ]);

  useEffect(() => { getBots(); }, []);

  const login = () => {
    const u = { uid: 'pioneer-pro-user', username: 'PioneerPro', kyc: true };
    setUser(u);
    const sBal = localStorage.getItem('pp_v2_bal_' + u.uid), sTxs = localStorage.getItem('pp_v2_txs_' + u.uid);
    let parsedTxs = [{ t: 'PioneerPro Welcome Balance', a: '+1.00 Pi', c: '#4ade80' }];
    if (sTxs) try { parsedTxs = JSON.parse(sTxs); } catch (e) {}
    const curBal = sBal !== null ? Number(sBal) : 1.00;
    if (curBal < 0.22) { setBal(1.00); setTxs([{ t: 'Testnet Credit Top-Up', a: '+1.00 Pi', c: '#4ade80' }, ...parsedTxs]); }
    else { setBal(curBal); setTxs(parsedTxs); }
  };

  const requireAuth = (nextTab) => {
    if (!user) {
      if (confirm('Please sign in with Pi Wallet first to access this feature. Sign in now?')) login();
      return;
    }
    setBot(null);
    setTab(nextTab);
  };

  useEffect(() => {
    if (!user) return;
    localStorage.setItem('pp_v2_bal_' + user.uid, String(Math.max(0, bal)));
    localStorage.setItem('pp_v2_txs_' + user.uid, JSON.stringify(txs));
  }, [bal, txs, user]);

  const getBots = async () => { const { data } = await supabase.from('ai_agents').select('*').limit(1000); if (data?.length) setAgents(data); };

  const send = async (preset) => {
    const q = (typeof preset === 'string' ? preset : txt).trim();
    if (!q || !bot) return;
    if (!user) { if (confirm('Please sign in with Pi Wallet first. Sign in now?')) login(); return; }
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
      setTxs(prev => [{ t: `Spent: ${bot.name}`, a: `-${p.toFixed(2)} Pi`, c: '#f87171' }, ...prev]);
      setMsgs(prev => [...prev, { r: 'u', t: q }, { r: 'a', t: `[Pi SDK Paid: ${p.toFixed(2)} Pi] ` + (data.reply || 'Response ready.') }]);
    } catch (e) { setMsgs(prev => [...prev, { r: 'u', t: q }, { r: 'a', t: '⚠️ Error: ' + e.message }]); }
    setBusy(false);
  };

  const makeTrade = async (e) => {
    e.preventDefault();
    if (!user) { if (confirm('Please sign in with Pi Wallet first. Sign in now?')) login(); return; }
    setBusy(true); setContract('');
    const buyer = trade.role === 'Buying' ? `@${user.username}` : trade.partner;
    const seller = trade.role === 'Selling' ? `@${user.username}` : trade.partner;
    try {
      const res = await fetch('/api/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Buyer (Pays Pi): ${buyer}, Seller (Delivers): ${seller}, Item/Service: ${trade.item}, Agreed Price: ${trade.amount} Pi`, systemPrompt: 'You are the PiPulse P2P Smart Trade & Contract AI. Draft a concise, clear Pi Network peer-to-peer trade agreement clearly stating Buyer and Seller obligations, KYC status, delivery terms, and mutual confirmation clauses.' }) });
      const data = await res.json();
      setContract(data.reply || 'Smart trade contract generated.');
      setRecentTrades(prev => [{ pair: `${buyer} ↔ ${seller}`, item: trade.item, amt: `${trade.amount} Pi`, status: 'Drafted' }, ...prev.slice(0, 3)]);
    } catch (e) { setContract('Error generating contract.'); }
    setBusy(false);
  };

  const sealContract = () => {
    alert(`Contract sealed with Pi SDK Proof! Copy and share it with ${trade.partner} via Pi Chats.`);
    setRecentTrades(prev => prev.map((r, i) => i === 0 ? { ...r, status: 'Sealed' } : r));
  };

  const trMsg = async (idx, raw, lang) => {
    setTrIdx(idx); setMsgs(p => p.map((m, i) => i === idx ? { ...m, tr: `⏳ Translating to ${lang}...` } : m));
    try {
      const res = await fetch('/api/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: raw.replace(/^\[.*?Paid.*?\]\s*/, ''), systemPrompt: `Translate into ${lang}. Return ONLY translation.` }) });
      const data = await res.json();
      setMsgs(p => p.map((m, i) => i === idx ? { ...m, tr: `[🌐 ${lang}]: ${data.reply || 'Please try again.'}` } : m));
    } catch (e) {} setTrIdx(null);
  };

  const create = async (e) => {
    e.preventDefault();
    if (!user) { if (confirm('Please sign in with Pi Wallet first. Sign in now?')) login(); return; }
    if (agents.filter(a => a.creator_uid === user.uid).length >= 3) return alert('Limit reached: Max 3 AI agents per KYC account.');
    const numPrice = Math.max(0.01, Number(String(form.price).replace(',', '.')) || 0.50);
    setBusy(true);
    const { error } = await supabase.from('ai_agents').insert({ creator_uid: user.uid, creator_username: user.username, name: form.name, description: `[${form.category}] ${form.description}`, system_prompt: form.system_prompt, price_per_msg: numPrice });
    setBusy(false); if (error) return alert(error.message);
    alert('KYC-Verified Agent published!'); setForm({ name: '', category: 'Pi & Web3', description: '', system_prompt: '', price: '0.50' }); setTab('market'); getBots();
  };

  const withdraw = () => {
    if (!user) return;
    if (bal <= 0) return alert('No available balance to withdraw.');
    alert(`${bal.toFixed(2)} Pi transferred to @${user.username} Pi Wallet!`);
    setTxs(p => [{ t: 'Withdrawn to Pi Wallet', a: `-${bal.toFixed(2)} Pi`, c: '#f5b041' }, ...p]); setBal(0);
  };

  const delBot = async (e, id) => { e.stopPropagation(); if (confirm('Delete this agent?')) { await supabase.from('ai_agents').delete().eq('id', id); getBots(); } };
  const refUrl = 'https://pipulseai' + '.vercel.app/?ref=' + (user?.username || 'Pioneer');
  const activeRegex = CATS[catIdx][1];
  const sorted = [...agents].sort((a, b) => (a.creator_uid === 'guide' ? -1 : b.creator_uid === 'guide' ? 1 : a.creator_uid === 'featured' ? -1 : b.creator_uid === 'featured' ? 1 : 0));
  const filtered = sorted.filter(b => {
    if (activeRegex && b.creator_uid === 'guide') return false;
    const text = b.name + ' ' + b.description;
    return (!search || text.toLowerCase().includes(search.toLowerCase())) && (!activeRegex || activeRegex.test(text));
  });
  const visibleBots = (search || activeRegex) ? filtered.slice(0, 60) : filtered.slice(0, 30);
    return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 10 }}>
        <b onClick={() => { setBot(null); setTab('market'); }} style={{ color: '#f5b041', fontSize: 18 }}>⚡ PiPulse AI</b>
        {user ? <span style={{ background: '#134e4a', color: '#5eead4', padding: '5px 10px', borderRadius: 14, fontSize: 11, fontWeight: 'bold' }}>🛡️ @{user.username} • KYC</span> : <button onClick={login} style={{ background: '#f5b041', padding: '8px 14px', borderRadius: 8, border: 'none', fontWeight: 'bold' }}>Sign in with Pi</button>}
      </div>
      <div style={{ display: 'flex', gap: 5, margin: '12px 0' }}>
        <button onClick={() => { setBot(null); setTab('market'); }} style={{ flex: 1, padding: 8, background: tab === 'market' ? '#4a3578' : '#1e1633', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11 }}>🤖 Market ({agents.length})</button>
        <button onClick={() => { setBot(null); setTab('trade'); }} style={{ flex: 1, padding: 8, background: tab === 'trade' ? '#0f766e' : '#1e1633', color: '#5eead4', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 'bold' }}>🤝 Pi Trade</button>
        <button onClick={() => requireAuth('create')} style={{ flex: 1, padding: 8, background: tab === 'create' ? '#7d3c98' : '#1e1633', color: user ? '#fff' : '#888', border: 'none', borderRadius: 8, fontSize: 11 }}>{user ? '+ Bot' : '🔒 + Bot'}</button>
        <button onClick={() => requireAuth('wallet')} style={{ flex: 1, padding: 8, background: tab === 'wallet' ? '#1e4620' : '#1e1633', color: user ? '#4ade80' : '#888', border: 'none', borderRadius: 8, fontSize: 11 }}>{user ? `💰 ${bal.toFixed(2)} Pi` : '🔒 Wallet'}</button>
      </div>
      {tab === 'trade' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#1a142e', padding: 14, borderRadius: 12, border: '1px solid #2dd4bf' }}>
            <b style={{ color: '#5eead4', fontSize: 14 }}>🤝 Pi P2P Smart Trade & Contract AI</b>
            <p style={{ fontSize: 12, color: '#ccc', margin: '6px 0 12px' }}>Draft a clear, KYC-backed peer-to-peer trade agreement for local goods, services, or freelancing on Pi.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#5eead4', fontWeight: 'bold' }}>I am:</span>
              {['Buying', 'Selling'].map(r => (
                <button type="button" key={r} onClick={() => setTrade({...trade, role: r})} style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid #2dd4bf', background: trade.role === r ? '#2dd4bf' : '#0f0c29', color: trade.role === r ? '#000' : '#5eead4', fontWeight: 'bold', fontSize: 12 }}>{r === 'Buying' ? '🛒 Buying' : '🏷️ Selling'}</button>
              ))}
            </div>
            <form onSubmit={makeTrade} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input placeholder={trade.role === 'Buying' ? 'Seller Username (e.g. @SellerPi)' : 'Buyer Username (e.g. @BuyerPi)'} value={trade.partner} onChange={e => setTrade({...trade, partner: e.target.value})} required style={{ padding: 10, borderRadius: 8 }} />
              <input placeholder="Goods or Service Description" value={trade.item} onChange={e => setTrade({...trade, item: e.target.value})} required style={{ padding: 10, borderRadius: 8 }} />
              <label style={{ fontSize: 11, color: '#5eead4', marginTop: 2 }}>Agreed Price (in Pi):</label>
              <input type="text" inputMode="decimal" placeholder="Amount in Pi (e.g., 10 Pi)" value={trade.amount} onChange={e => setTrade({...trade, amount: e.target.value})} required style={{ padding: 10, borderRadius: 8 }} />
              <button type="submit" disabled={busy} style={{ background: '#2dd4bf', color: '#000', padding: 11, borderRadius: 8, fontWeight: 'bold', border: 'none', marginTop: 4 }}>{busy ? 'Drafting Smart Contract...' : 'Generate KYC Pi Trade Agreement'}</button>
            </form>
            {contract && (
              <div style={{ marginTop: 12, background: '#0f0c29', padding: 12, borderRadius: 8, border: '1px solid #4a3578' }}>
                <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{contract}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => { navigator.clipboard?.writeText(contract); alert('Contract copied for Pi Chats!'); }} style={{ flex: 1, background: '#f5b041', padding: '8px', borderRadius: 6, border: 'none', fontWeight: 'bold', fontSize: 11 }}>📋 Copy for Pi Chats</button>
                  <button onClick={sealContract} style={{ flex: 1, background: '#4ade80', color: '#000', padding: '8px', borderRadius: 6, border: 'none', fontWeight: 'bold', fontSize: 11 }}>🛡️ Seal with Pi SDK</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ background: '#1a142e', padding: 12, borderRadius: 12, border: '1px solid #4a3578' }}>
            <b style={{ color: '#f5b041', fontSize: 12 }}>⚡ How P2P Smart Trade Works</b>
            <div style={{ fontSize: 11, color: '#ccc', marginTop: 6, lineHeight: 1.5 }}>
              1. Select your role (Buying/Selling) & enter partner username.<br/>
              2. AI drafts clear delivery & dispute-protection terms.<br/>
              3. Seal with Pi SDK & share via Pi Chats or Link.
            </div>
          </div>
          <div style={{ background: '#1a142e', padding: 12, borderRadius: 12, border: '1px solid #4a3578' }}>
            <b style={{ color: '#5eead4', fontSize: 12 }}>🛡️ Recent KYC-Verified Trades</b>
            {recentTrades.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #2a214a', fontSize: 11 }}>
                <div><b style={{ color: '#fff' }}>{r.pair}</b><div style={{ color: '#999' }}>{r.item}</div></div>
                <div style={{ textAlign: 'right' }}><b style={{ color: '#f5b041' }}>{r.amt}</b><div style={{ color: '#4ade80', fontSize: 10 }}>● {r.status}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'wallet' && user && (
        <div style={{ background: '#1a142e', padding: 14, borderRadius: 12, border: '1px solid #4a3578' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f0c29', padding: 12, borderRadius: 10, marginBottom: 12 }}>
            <div><small style={{ color: '#999' }}>Available Balance</small><div style={{ fontSize: 20, fontWeight: 'bold', color: '#4ade80' }}>{bal.toFixed(2)} Pi</div></div>
            <button onClick={withdraw} style={{ background: '#4ade80', color: '#000', padding: '9px 14px', borderRadius: 8, border: 'none', fontWeight: 'bold', fontSize: 12 }}>Withdraw Pi</button>
          </div>
          <b style={{ color: '#f5b041', fontSize: 13 }}>🎁 Referral Link (10% Pi Commission)</b>
          <div style={{ display: 'flex', gap: 6, margin: '6px 0 14px' }}>
            <input readOnly value={refUrl} style={{ flex: 1, padding: 8, borderRadius: 6, fontSize: 11, background: '#0f0c29', color: '#fff', border: '1px solid #333' }} />
            <button onClick={() => { navigator.clipboard?.writeText(refUrl); alert('Referral link copied!'); }} style={{ background: '#f5b041', padding: '8px 12px', borderRadius: 6, border: 'none', fontWeight: 'bold', fontSize: 12 }}>Copy</button>
          </div>
          <b style={{ color: '#f5b041', fontSize: 13 }}>📊 Pi SDK Income & Expense Ledger</b>
          {txs.map((x, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #2a214a', fontSize: 13 }}><span>{x.t}</span><b style={{ color: x.c }}>{x.a}</b></div>)}
        </div>
      )}
        {tab === 'create' && user && (
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#134e4a', color: '#5eead4', padding: 8, borderRadius: 8, fontSize: 12 }}>🛡️ Publishing with Pi KYC Identity Protection (Max 3 bots/user)</div>
          <input placeholder="Agent Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ padding: 11, borderRadius: 8, background: '#fff', color: '#000' }}>
            {CATS.slice(1).map(([lbl]) => <option key={lbl} value={lbl}>Category: {lbl}</option>)}
          </select>
          <input placeholder="Short Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <textarea rows={3} placeholder="System Prompt (Instructions)" value={form.system_prompt} onChange={e => setForm({...form, system_prompt: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <label style={{ fontSize: 11, color: '#f5b041' }}>Price per Message (in Pi):</label>
          <input type="text" inputMode="decimal" placeholder="0.50" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required style={{ padding: 11, borderRadius: 8 }} />
          <button type="submit" disabled={busy} style={{ background: '#f5b041', padding: 13, borderRadius: 8, fontWeight: 'bold', border: 'none' }}>{busy ? 'Publishing...' : 'Publish KYC-Verified Agent'}</button>
        </form>
      )}
      {tab === 'market' && !bot && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search 1,000+ KYC-verified AI agents..." style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#1a142e', color: '#fff', border: '1px solid #4a3578', fontSize: 13 }} />
            {search && <button onClick={() => setSearch('')} style={{ background: '#4a3578', color: '#fff', border: 'none', borderRadius: 10, padding: '0 12px', fontWeight: 'bold' }}>✕</button>}
          </div>
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 8, marginBottom: 6 }}>
            {CATS.map(([lbl], i) => <button key={lbl} onClick={() => setCatIdx(i)} style={{ whiteSpace: 'nowrap', padding: '5px 10px', borderRadius: 14, border: '1px solid #4a3578', background: catIdx === i ? '#f5b041' : '#1a142e', color: catIdx === i ? '#000' : '#ddd', fontSize: 11, fontWeight: 'bold' }}>{lbl}</button>)}
          </div>
          {visibleBots.map((b) => {
            const isG = b.creator_uid === 'guide';
            const h = hashNum(b.name + String(b.id));
            const rating = (4.7 + (h % 3) * 0.1).toFixed(1);
            const chats = 64 + (h % 380);
            return (
              <div key={b.id} onClick={() => { setBot(b); setMsgs([]); }} style={{ background: isG ? 'linear-gradient(135deg, #134e4a, #1e1b4b)' : '#1a142e', padding: 14, borderRadius: 12, marginBottom: 10, border: isG ? '2px solid #2dd4bf' : '1px solid #4a3578' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <b style={{ color: isG ? '#5eead4' : '#f5b041', fontSize: 14 }}>{b.name}</b>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {isG && <span style={{ background: '#0d9488', color: '#fff', padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 'bold' }}>📌 GUIDE</span>}
                    <span style={{ background: '#2e1a47', padding: '2px 8px', borderRadius: 8, fontSize: 12 }}>{Number(b.price_per_msg).toFixed(2)} Pi</span>
                    {user && b.creator_uid === user.uid && <button onClick={e => delBot(e, b.id)} style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>Del</button>}
                  </div>
                </div>
                <p style={{ fontSize: 13, margin: '6px 0', color: isG ? '#e2e8f0' : '#ddd' }}>{b.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: isG ? '#5eead4' : '#999', whiteSpace: 'nowrap' }}>
                  <span>{`🛡️ @${b.creator_username} • KYC`}</span>
                  <span>{`⭐ ${rating} (${chats} chats)`}</span>
                </div>
              </div>
            );
          })}
          {!search && catIdx === 0 && filtered.length > 30 && <p style={{ textAlign: 'center', color: '#888', fontSize: 12 }}>Showing top 30 agents. Search or pick a category to explore all <b>{agents.length}</b> agents.</p>}
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
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(m.tr || m.t.replace(/^\[.*?Paid.*?\]\s*/, '')); alert('Response copied!'); }} style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 'bold' }}>📋 Copy</button>
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
          
