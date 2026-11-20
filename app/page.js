'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';

export default function Home() {
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newBot, setNewBot] = useState({ name: '', description: '', system_prompt: '', price: 0.01 });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Pi) {
      window.Pi.init({ version: '2.0', sandbox: false });
    }
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    const { data } = await supabase.from('ai_agents').select('*').order('created_at', { ascending: false });
    if (data) setAgents(data);
  };

  const handleLogin = async () => {
    try {
      const scopes = ['username', 'payments'];
      const auth = await window.Pi.authenticate(scopes, (payment) => {
        console.log('Incomplete payment:', payment);
      });
      setUser(auth.user);
      await supabase.from('users').upsert({ pi_uid: auth.user.uid, username: auth.user.username }, { onConflict: 'pi_uid' });
    } catch (err) {
      alert('Giris hatasi: Lutfen Pi Browser icinden acin.');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedAgent) return;
    if (!user) return alert('Once Pi cuzdaninizla giris yapin!');

    const userMsg = input;
    setInput('');
    setLoading(true);

    try {
      await window.Pi.createPayment(
        {
          amount: Number(selectedAgent.price_per_msg),
          memo: `${selectedAgent.name} AI Sorusu (x402)`,
          metadata: { agentId: selectedAgent.id, uid: user.uid },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            await axios.post('/api/payments/approve', { paymentId });
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            await axios.post('/api/payments/complete', { paymentId, txid });
            setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
            const res = await axios.post('/api/chat', {
              message: userMsg,
              systemPrompt: selectedAgent.system_prompt,
            });
            setMessages((prev) => [...prev, { role: 'ai', text: res.data.reply }]);
            setLoading(false);
          },
          onCancel: () => setLoading(false),
          onError: () => setLoading(false),
        }
      );
    } catch (e) {
      setLoading(false);
      alert('Odeme baslatilamadi.');
    }
  };

  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!user) return alert('Bot olusturmak icin Pi ile giris yapin!');
    await supabase.from('ai_agents').insert({
      creator_uid: user.uid,
      creator_username: user.username,
      name: newBot.name,
      description: newBot.description,
      system_prompt: newBot.system_prompt,
      price_per_msg: Number(newBot.price),
    });
    setNewBot({ name: '', description: '', system_prompt: '', price: 0.01 });
    setShowCreate(false);
    fetchAgents();
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '20px', color: '#f5b041', margin: 0 }}>⚡ PiPulse AI</h1>
        {user ? (
          <span style={{ background: '#2e1a47', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>@{user.username}</span>
        ) : (
          <button onClick={handleLogin} style={{ background: '#f5b041', color: '#000', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold' }}>
            Pi ile Giris
          </button>
        )}
      </header>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button onClick={() => { setSelectedAgent(null); setShowCreate(false); }} style={{ flex: 1, padding: '10px', background: '#1e1633', color: '#fff', border: '1px solid #4a3578', borderRadius: '8px' }}>
          🤖 Bot Pazari
        </button>
        <button onClick={() => setShowCreate(true)} style={{ flex: 1, padding: '10px', background: '#5b2c6f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          + Kendi Botunu Yap
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateBot} style={{ background: '#1a142e', padding: '16px', borderRadius: '12px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ margin: 0, color: '#f5b041' }}>Yeni AI Botu Olustur & Pi Kazan</h3>
          <input placeholder="Bot Adi (Orn: Kripto Analist)" value={newBot.name} onChange={(e) => setNewBot({ ...newBot, name: e.target.value })} required style={{ padding: '10px', borderRadius: '6px', border: 'none' }} />
          <input placeholder="Kisa Aciklama" value={newBot.description} onChange={(e) => setNewBot({ ...newBot, description: e.target.value })} required style={{ padding: '10px', borderRadius: '6px', border: 'none' }} />
          <textarea placeholder="Yapay Zeka Talimati (System Prompt)" value={newBot.system_prompt} onChange={(e) => setNewBot({ ...newBot, system_prompt: e.target.value })} required style={{ padding: '10px', borderRadius: '6px', border: 'none', minHeight: '70px' }} />
          <input type="number" step="0.01" placeholder="Soru Basi Ucret (Pi)" value={newBot.price} onChange={(e) => setNewBot({ ...newBot, price: e.target.value })} required style={{ padding: '10px', borderRadius: '6px', border: 'none' }} />
          <button type="submit" style={{ background: '#f5b041', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none' }}>Yayinla</button>
        </form>
      )}

      {!selectedAgent && !showCreate && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {agents.map((bot) => (
            <div key={bot.id} onClick={() => { setSelectedAgent(bot); setMessages([]); }} style={{ background: '#1a142e', padding: '14px', borderRadius: '12px', border: '1px solid #3c2a63', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#f5b041' }}>{bot.name}</strong>
                <span style={{ background: '#2e1a47', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{bot.price_per_msg} Pi / Soru</span>
              </div>
              <p style={{ fontSize: '13px', color: '#ccc', margin: '8px 0' }}>{bot.description}</p>
              <small style={{ color: '#888' }}>Uretici: @{bot.creator_username}</small>
            </div>
          ))}
        </div>
      )}

      {selectedAgent && !showCreate && (
        <div style={{ marginTop: '16px', background: '#1a142e', padding: '14px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <strong>{selectedAgent.name} ({selectedAgent.price_per_msg} Pi)</strong>
            <button onClick={() => setSelectedAgent(null)} style={{ background: 'transparent', color: '#f5b041', border: 'none' }}>← Geri</button>
          </div>
          <div style={{ height: '260px', overflowY: 'auto', background: '#0f0c29', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ marginBottom: '8px', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                <span style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '10px', background: m.role === 'user' ? '#5b2c6f' : '#261e45', fontSize: '14px' }}>
                  {m.text}
                </span>
              </div>
            ))}
            {loading && <p style={{ fontSize: '12px', color: '#f5b041' }}>Pi odemesi onaylaniyor ve AI dusunuyor...</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Sorunu yaz..." style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none' }} />
            <button onClick={handleSendMessage} disabled={loading} style={{ background: '#f5b041', color: '#000', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', border: 'none' }}>
              Gonder
            </button>
          </div>
        </div>
      )}
    </div>
  );
          }
                       
