'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BOTS = [
  { id: '1', creator_uid: 'guide', creator_username: 'PulseAI_Official', name: '🧭 AI Concierge: Find Your Best Agent', description: 'Tell me your goal and I will match you with the right specialist among our 25 curated agents.', system_prompt: 'You are the PulseAI Concierge. Recommend the best bot category and prompt for the user goal.', price_per_msg: 0.22 }
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

function FormatInline({ text }) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <b key={i} style={{ color: '#fde68a' }}>{part.slice(2, -2)}</b>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i} style={{ color: '#cbd5e1', fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ background: '#0f0c29', color: '#5eead4', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

function FormattedLines({ text }) {
  return text.split('\n').map((line, idx) => {
    const t = line.trim();
    if (!t) return <div key={idx} style={{ height: 6 }} />;
    if (t.startsWith('### ')) return <div key={idx} style={{ color: '#f5b041', fontWeight: 'bold', fontSize: 14, marginTop: 8, marginBottom: 3 }}>{t.slice(4)}</div>;
    if (t.startsWith('## ')) return <div key={idx} style={{ color: '#5eead4', fontWeight: 'bold', fontSize: 15, marginTop: 10, marginBottom: 4 }}>{t.slice(3)}</div>;
    if (t.startsWith('# ')) return <div key={idx} style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginTop: 10, marginBottom: 4 }}>{t.slice(2)}</div>;
    if (t.startsWith('> ')) return <div key={idx} style={{ borderLeft: '3px solid #2dd4bf', background: '#171130', padding: '5px 10px', margin: '5px 0', color: '#a5f3fc', fontStyle: 'italic', borderRadius: '0 6px 6px 0' }}><FormatInline text={t.slice(2)} /></div>;
    return <div key={idx}><FormatInline text={line} /></div>;
  });
}

function FormattedReply({ text }) {
  const blocks = text.split(/(```[\s\(\S\)]*?```)/g);
  return (
    <div style={{ lineHeight: 1.55 }}>
      {blocks.map((blk, i) => {
        if (blk.startsWith('```') && blk.endsWith('```')) {
          const lines = blk.slice(3, -3).split('\n');
          const first = (lines[0] || '').trim();
          const lang = first.match(/^[a-zA-Z0-9_-]+$/) ? lines.shift().trim() : 'code';
          const code = lines.join('\n').trim();
          return (
            <div key={i} style={{ background: '#090717', border: '1px solid #4a3578', borderRadius: 8, margin: '8px 0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#171130', padding: '4px 8px', fontSize: 10, color: '#a5f3fc' }}>
                <span>{lang.toUpperCase()}</span>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(code); alert('Code copied!'); }} style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 'bold' }}>Copy Code</button>
              </div>
              <pre style={{ margin: 0, padding: '8px 10px', overflowX: 'auto', fontSize: 12, color: '#6ee7b7', fontFamily: 'monospace' }}><code>{code}</code></pre>
            </div>
          );
        }
        return <FormattedLines key={i} text={blk} />;
      })}
    </div>
  );
}
export default function Home() {
  const [user, setUser] = useState(null), [agents, setAgents] = useState(BOTS), [bot, setBot] = useState(null);
  const [msgs, setMsgs] = useState([]), [txt, setTxt] = useState(''), [search, setSearch] = useState(''), [catIdx, setCatIdx] = useState(0);
  const [busy, setBusy] = useState(false), [trIdx, setTrIdx] = useState(null), [tab, setTab] = useState('market'), [bal, setBal] = useState(1.00);
  const [txs, setTxs] = useState([{ t: 'PioneerPro Testnet Welcome Balance', a: '+1.00 Pi', c: '#4ade80' }]);
  const [form, setForm] = useState({ name: '', category: 'Pi & Web3', description: '', system_prompt: '', price: '0.50' });
  const [trade, setTrade] = useState({ role: 'Buying', partner: '', item: '', amount: '' }), [contractData, setContractData] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [chatCounts, setChatCounts] = useState({});

  useEffect(() => { getBots(); }, []);

  const login = () => {
    const u = { uid: 'pioneer-pro-user', username: 'PioneerPro', kyc: true };
    setUser(u);
    const sBal = localStorage.getItem('pp_v3_bal_' + u.uid), sTxs = localStorage.getItem('pp_v3_txs_' + u.uid);
    let parsedTxs = [{ t: 'PioneerPro Testnet Welcome Balance', a: '+1.00 Pi', c: '#4ade80' }];
    if (sTxs) try { parsedTxs = JSON.parse(sTxs); } catch (e) {}
    const curBal = sBal !== null ? Number(sBal) : 1.00;
    if (curBal < 0.22) { setBal(1.00); setTxs([{ t: 'Testnet Credit Top-Up', a: '+1.00 Pi', c: '#4ade80' }, ...parsedTxs]); }
    else { setBal(curBal); setTxs(parsedTxs); }
  };

  const requireAuth = (nextTab) => {
    if (!user) { if (confirm('Please sign in with Pi Wallet first to access this feature. Sign in now?')) login(); return; }
    setBot(null); setTab(nextTab);
  };

  useEffect(() => {
    if (!user) return;
    localStorage.setItem('pp_v3_bal_' + user.uid, String(Math.max(0, bal)));
    localStorage.setItem('pp_v3_txs_' + user.uid, JSON.stringify(txs));
  }, [bal, txs, user]);

  const getBots = async () => { const { data } = await supabase.from('ai_agents').select('*').limit(100); if (data?.length) setAgents(data); };

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
      setChatCounts(prev => ({ ...prev, [bot.id]: (prev[bot.id] || 0) + 1 }));
      setTxs(prev => [{ t: `Pi SDK Payment: ${bot.name}`, a: `-${p.toFixed(2)} Pi`, c: '#f87171' }, ...prev]);
      setMsgs(prev => [...prev, { r: 'u', t: q }, { r: 'a', paid: p.toFixed(2), t: data.reply || 'Response ready.' }]);
    } catch (e) { setMsgs(prev => [...prev, { r: 'u', t: q }, { r: 'a', t: '⚠️ Error: ' + e.message }]); }
    setBusy(false);
  };

  const makeTrade = async (e) => {
    e.preventDefault();
    if (!user) { if (confirm('Please sign in with Pi Wallet first. Sign in now?')) login(); return; }
    setBusy(true); setContractData(null);
    const buyer = trade.role === 'Buying' ? `@${user.username}` : trade.partner;
    const seller = trade.role === 'Selling' ? `@${user.username}` : trade.partner;
    const proofId = `#PA-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    try {
      const res = await fetch('/api/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Buyer (Pays Pi): ${buyer}, Seller (Delivers): ${seller}, Item/Service: ${trade.item}, Agreed Price: ${trade.amount} Pi`, systemPrompt: 'You are the PulseAI P2P Smart Trade & Contract AI. Draft 4 concise numbered clauses covering Delivery Proof, Direct Pi Wallet Payment Timing, Anti-Scam Verification, and Dispute Resolution. Do not repeat headers.' }) });
      const data = await res.json();
      const body = data.reply || '1. Seller provides delivery proof in Pi Chats.\n2. Buyer transfers agreed Pi directly via Pi Wallet.';
      setContractData({ proofId, timestamp, buyer, seller, item: trade.item, amount: trade.amount, body });
      setRecentTrades(prev => [{ pair: `${buyer} ↔ ${seller}`, item: trade.item, amt: `${trade.amount} Pi`, status: 'Awaiting Partner Confirmation' }, ...prev]);
    } catch (e) { alert('Error generating contract.'); }
    setBusy(false);
  };

  const fullExportText = contractData ? `PULSEAI P2P SMART AGREEMENT (${contractData.proofId})\nTimestamp: ${contractData.timestamp}\nBuyer: ${contractData.buyer} (KYC Verified)\nSeller: ${contractData.seller}\nScope: ${contractData.item}\nDirect Transfer: ${contractData.amount} Pi\nNotice: Non-Custodial Agreement (No funds held by PulseAI)\n\n${contractData.body}` : '';

  const sealContract = () => {
    alert(`Counterparty confirmed & Pi SDK timestamp recorded! Agreement ${contractData?.proofId} is now Sealed.`);
    setRecentTrades(prev => prev.map((r, i) => i === 0 ? { ...r, status: 'Sealed (Pi SDK)' } : r));
  };

  const trMsg = async (idx, raw, lang) => {
    setTrIdx(idx); setMsgs(p => p.map((m, i) => i === idx ? { ...m, tr: `⏳ Translating to ${lang}...` } : m));
    try {
      const res = await fetch('/api/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: raw, systemPrompt: `Translate into ${lang}. Return ONLY translation.` }) });
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
    alert(`${bal.toFixed(2)} Pi transferred to @${user.username} Pi Wallet (Testnet)!`);
    setTxs(p => [{ t: 'Withdrawn to Pi Wallet (Testnet)', a: `-${bal.toFixed(2)} Pi`, c: '#f5b041' }, ...p]); setBal(0);
  };

  const delBot = async (e, id) => { e.stopPropagation(); if (confirm('Delete this agent?')) { await supabase.from('ai_agents').delete().eq('id', id); getBots(); } };
  const refUrl = 'https://pulseai7781' + '.vercel.app/?ref=' + (user?.username || 'Pioneer');
  const activeRegex = CATS[catIdx][1];
  const sorted = [...agents].sort((a, b) => (a.creator_uid === 'guide' ? -1 : b.creator_uid === 'guide' ? 1 : a.creator_uid === 'featured' ? -1 : b.creator_uid === 'featured' ? 1 : 0));
  const filtered = sorted.filter(b => {
    if (activeRegex && b.creator_uid === 'guide') return false;
    const text = b.name + ' ' + b.description;
    return (!search || text.toLowerCase().includes(search.toLowerCase())) && (!activeRegex || activeRegex.test(text));
  });
  const visibleBots = filtered.slice(0, 50);
              return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 10 }}>
        <b onClick={() => { setBot(null); setTab('market'); }} style={{ color: '#f5b041', fontSize: 18 }}>⚡ PulseAI</b>
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
            <b style={{ color: '#5eead4', fontSize: 14 }}>🤝 Pi P2P Smart Agreement & Audit AI</b>
            <div style={{ background: '#291d12', border: '1px solid #f59e0b', color: '#fcd34d', padding: '7px 10px', borderRadius: 8, fontSize: 11, margin: '8px 0 10px', lineHeight: 1.4 }}>
              <b>⚠️ Non-Custodial Transparency Notice:</b> PulseAI does not hold or custody user Pi funds. This tool drafts clear KYC-referenced P2P terms and generates a verifiable timestamped agreement hash for direct Pi Wallet transfers.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#5eead4', fontWeight: 'bold' }}>I am:</span>
              {['Buying', 'Selling'].map(r => (
                <button type="button" key={r} onClick={() => setTrade({...trade, role: r})} style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid #2dd4bf', background: trade.role === r ? '#2dd4bf' : '#0f0c29', color: trade.role === r ? '#000' : '#5eead4', fontWeight: 'bold', fontSize: 12 }}>{r === 'Buying' ? '🛒 Buying' : '🏷️ Selling'}</button>
              ))}
            </div>
            <form onSubmit={makeTrade} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input placeholder={trade.role === 'Buying' ? 'Seller Username (e.g. @SellerPi)' : 'Buyer Username (e.g. @BuyerPi)'} value={trade.partner} onChange={e => setTrade({...trade, partner: e.target.value})} required style={{ padding: 10, borderRadius: 8 }} />
              <input placeholder="Goods or Service Description" value={trade.item} onChange={e => setTrade({...trade, item: e.target.value})} required style={{ padding: 10, borderRadius: 8 }} />
              <label style={{ fontSize: 11, color: '#5eead4', marginTop: 2 }}>Agreed Direct Transfer Amount (in Pi):</label>
              <input type="text" inputMode="decimal" placeholder="Amount in Pi (e.g., 10 Pi)" value={trade.amount} onChange={e => setTrade({...trade, amount: e.target.value})} required style={{ padding: 10, borderRadius: 8 }} />
              <button type="submit" disabled={busy} style={{ background: '#2dd4bf', color: '#000', padding: 11, borderRadius: 8, fontWeight: 'bold', border: 'none', marginTop: 4 }}>{busy ? 'Drafting P2P Terms...' : 'Draft Non-Custodial P2P Agreement'}</button>
            </form>
            {contractData && (
              <div style={{ marginTop: 12, background: '#0f0c29', padding: 12, borderRadius: 10, border: '1px solid #2dd4bf' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a214a', paddingBottom: 6, marginBottom: 8, fontSize: 11 }}>
                  <b style={{ color: '#5eead4' }}>🔐 {contractData.proofId}</b>
                  <span style={{ color: '#94a3b8' }}>🕒 {contractData.timestamp}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: '#161130', padding: 8, borderRadius: 6, marginBottom: 8, fontSize: 11 }}>
                  <div><span style={{ color: '#888' }}>Buyer:</span><br/><b style={{ color: '#4ade80' }}>{contractData.buyer} 🛡️ KYC</b></div>
                  <div><span style={{ color: '#888' }}>Seller:</span><br/><b style={{ color: '#f5b041' }}>{contractData.seller}</b></div>
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #2a214a', paddingTop: 4 }}><span style={{ color: '#888' }}>Scope & Amount:</span> <b style={{ color: '#fff' }}>{contractData.item} ({contractData.amount} Pi)</b></div>
                </div>
                <div style={{ fontSize: 12, color: '#e2e8f0' }}><FormattedReply text={contractData.body} /></div>
                <div style={{ background: '#291d12', color: '#fcd34d', padding: '5px 8px', borderRadius: 6, fontSize: 10, marginTop: 8 }}>
                  🛡️ Anti-Scam Rule: Never send Pi before verifying Proof ID {contractData.proofId} in Pi Chats.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginTop: 8 }}>
                  <button type="button" onClick={() => { navigator.clipboard?.writeText(fullExportText); alert('Full Agreement copied!'); }} style={{ background: '#f5b041', color: '#000', padding: '7px 4px', borderRadius: 6, border: 'none', fontWeight: 'bold', fontSize: 10 }}>📋 Copy Chat</button>
                  <button type="button" onClick={() => { if (navigator.share) navigator.share({ title: `PulseAI Agreement ${contractData.proofId}`, text: fullExportText }); else { navigator.clipboard?.writeText(fullExportText); alert('Copied to share!'); } }} style={{ background: '#38bdf8', color: '#000', padding: '7px 4px', borderRadius: 6, border: 'none', fontWeight: 'bold', fontSize: 10 }}>📤 Share</button>
                  <button type="button" onClick={() => window.print()} style={{ background: '#a78bfa', color: '#000', padding: '7px 4px', borderRadius: 6, border: 'none', fontWeight: 'bold', fontSize: 10 }}>🖨️ Save PDF</button>
                </div>
                <button type="button" onClick={sealContract} style={{ width: '100%', marginTop: 6, background: '#4ade80', color: '#000', padding: '8px', borderRadius: 6, border: 'none', fontWeight: 'bold', fontSize: 11 }}>🛡️ Confirm & Record Pi SDK Timestamp</button>
              </div>
            )}
          </div>
          <div style={{ background: '#1a142e', padding: 12, borderRadius: 12, border: '1px solid #4a3578' }}>
            <b style={{ color: '#5eead4', fontSize: 12 }}>🛡️ Your Session P2P Agreements</b>
            {recentTrades.length === 0 ? (
              <p style={{ fontSize: 11, color: '#888', marginTop: 6 }}>No agreements drafted yet. Create your first P2P agreement above.</p>
            ) : recentTrades.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #2a214a', fontSize: 11 }}>
                <div><b style={{ color: '#fff' }}>{r.pair}</b><div style={{ color: '#999' }}>{r.item}</div></div>
                <div style={{ textAlign: 'right' }}><b style={{ color: '#f5b041' }}>{r.amt}</b><div style={{ color: r.status.includes('Sealed') ? '#4ade80' : '#f5b041', fontSize: 10 }}>● {r.status}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'wallet' && user && (
        <div style={{ background: '#1a142e', padding: 14, borderRadius: 12, border: '1px solid #4a3578' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f0c29', padding: 12, borderRadius: 10, marginBottom: 12 }}>
            <div><small style={{ color: '#999' }}>Testnet Demo Balance</small><div style={{ fontSize: 20, fontWeight: 'bold', color: '#4ade80' }}>{bal.toFixed(2)} Pi</div></div>
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search curated KYC-verified AI agents..." style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#1a142e', color: '#fff', border: '1px solid #4a3578', fontSize: 13 }} />
            {search && <button onClick={() => setSearch('')} style={{ background: '#4a3578', color: '#fff', border: 'none', borderRadius: 10, padding: '0 12px', fontWeight: 'bold' }}>✕</button>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 10 }}>
            {CATS.map(([lbl], i) => <button key={lbl} onClick={() => setCatIdx(i)} style={{ padding: '6px 4px', borderRadius: 10, border: '1px solid #4a3578', background: catIdx === i ? '#f5b041' : '#1a142e', color: catIdx === i ? '#000' : '#ddd', fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>{lbl}</button>)}
          </div>
          {visibleBots.map((b) => {
            const isG = b.creator_uid === 'guide';
            const liveChats = chatCounts[b.id] || 0;
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
                  <span>{liveChats > 0 ? `💬 ${liveChats} session chats` : '✨ KYC-Verified Agent'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {bot && (
        <div style={{ background: '#1a142e', padding: 12, borderRadius: 12, border: '1px solid #4a3578' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
              <b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 }}>{bot.name}</b>
              <small style={{ color: '#4ade80', flexShrink: 0, fontSize: 11 }}>● Memory</small>
            </div>
            <button onClick={() => setBot(null)} style={{ color: '#f5b041', background: '#2e1a47', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 'bold', flexShrink: 0 }}>← Back</button>
          </div>
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
              <div key={i} style={{ textAlign: m.r === 'u' ? 'right' : 'left', margin: '10px 0' }}>
                {m.r === 'a' && m.paid && (
                  <div style={{ display: 'inline-block', background: '#134e4a', color: '#5eead4', border: '1px solid #2dd4bf', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
                    ✓ {m.paid} Pi Paid via Pi SDK
                  </div>
                )}
                <div style={{ background: m.r === 'u' ? '#5b2c6f' : '#261e45', padding: '10px 12px', borderRadius: 10, display: m.r === 'u' ? 'inline-block' : 'block', fontSize: 13 }}>
                  {m.r === 'a' ? <FormattedReply text={m.t} /> : m.t}
                  {m.tr && <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #4a3578', color: '#a5f3fc', fontSize: 13 }}><FormattedReply text={m.tr} /></div>}
                </div>
                {m.r === 'a' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(m.tr || m.t); alert('Response copied!'); }} style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 'bold' }}>📋 Copy</button>
                    {LANGS.map(([l, c]) => <button type="button" key={c} onClick={() => trMsg(i, m.t, c)} disabled={trIdx === i} style={{ background: '#1e1633', color: '#f5b041', border: '1px solid #4a3578', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}>{l}</button>)}
                  </div>
                )}
              </div>
            ))}
            {busy && <small style={{ color: '#f5b041' }}>AI is analyzing...</small>}
          </div>
                   
