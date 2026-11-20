'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';

const DEMO_BOTS = [
  {
    id: 'demo-1',
    creator_username: 'PiPulseOfficial',
    name: 'Pi Ekosistem Uzmani',
    description: 'Pi Network projeleri, hackathon ve DeFi konularinda uzman asistan.',
    system_prompt: 'Sen Pi Network ekosisteminde uzman bir yapay zeka asistanisin.',
    price_per_msg: 0.01,
  },
  {
    id: 'demo-2',
    creator_username: 'PiPulseOfficial',
    name: 'Ingilizce Pratik Kocu',
    description: 'Seninle her seviyede Ingilizce sohbet eden ve hatalarini duzelten ogretmen.',
    system_prompt: 'Sen sabirli bir Ingilizce ogretmenisin.',
    price_per_msg: 0.01,
  },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState(DEMO_BOTS);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newBot, setNewBot] = useState({ name: '', description: '', system_prompt: '', price: 0.01 });

  useEffect(() => {
    loadPiSdk().catch(() => {});
    fetchAgents();
  }, []);

  const loadPiSdk = () => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.Pi) {
        return resolve(window.Pi);
      }
      const script = document.createElement('script');
      script.src = 'https://minepi.com';
      script.async = true;
      script.onload = () => {
        if (window.Pi) resolve(window.Pi);
        else reject(new Error('Pi nesnesi bulunamadi'));
      };
      script.onerror = () => reject(new Error('Pi SDK indirilemedi'));
      document.body.appendChild(script);
    });
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase.from('ai_agents').select('*').order('created_at', { ascending: false });
      if (error) {
        console.log('DB okuma hatasi:', error.message);
        return;
      }
      if (data && data.length > 0) {
        setAgents(data);
      }
    } catch (err) {
      console.log('Baglanti hatasi:', err);
    }
  };

  const handleLogin = async () => {
    try {
      const Pi = await loadPiSdk();
      Pi.init({ version: '2.0', sandbox: false });
      const scopes = ['username', 'payments'];
      const auth = await Pi.authenticate(scopes, (payment) => {
        console.log('Incomplete payment:', payment);
      });
      setUser(auth.user);
      await supabase.from('users').upsert({ pi_uid: auth.user.uid, username: auth.user.username }, { onConflict: 'pi_uid' });
    } catch (err) {
      alert('Giris hatasi: ' + (err?.message || JSON.stringify(err)));
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedAgent) return;
    if (!user) return alert('Once Pi cuzdaninizla giris yapin!');

    const userMsg = input;
    setInput('');
    setLoading(true);

    try {
      const Pi = await loadPiSdk();
      await Pi.createPayment(
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
          onError: (err) => {
            setLoading(false);
            alert('Odeme hatasi: ' + (err?.message || 'Bilinmeyen hata'));
          },
        }
      );
    } catch (e) {
      setLoading(false);
      alert('Odeme baslatilamadi: ' + (e?.message || 'Hata'));
    }
  };

  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!user) return alert('Bot olusturmak icin once Pi ile giris yapin!');
    setSaving(true);
    try {
      const { error } = await supabase.from('ai_agents').insert({
        creator_uid: user.uid,
        creator_username: user.username,
        name: newBot.name,
        description: newBot.description,
        system_prompt: newBot.system_prompt,
        price_per_msg: Number(newBot.price),
      });

      if (error) {
        alert('Veritabani Kayit Hatasi: ' + error.message);
        setSaving(false);
        return;
      }

      alert('Tebrikler! Botunuz basariyla yayinlandi.');
      setNewBot({ name: '', description: '', system_prompt: '', price: 0.01 });
      setShowCreate(false);
      await fetchAgents();
    } catch (err) {
      alert('Beklenmeyen Hata: ' + (err?.message || 'Baglanti kurulamadi'));
    }
    setSaving(false);
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
        <button onClick={() => { setSelectedAgent(null); setShowCreate(false); fetchAgents(); }} style={{ flex: 1, padding: '10px', background: !showCreate ? '#3c2a63' : '#1e1633', color: '#fff', border: '1px solid #4a3578', borderRadius: '8px', fontWeight: 'bold' }}>
          🤖 Bot Pazari
        </button>
        <button onClick={() => { setSelectedAgent(null); setShowCreate(true); }} style={{ flex: 1, padding: '10px', background: showCreate ? '#7d3c98' : '#5b2c6f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
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
          <button type="submit" disabled={saving} style={{ background: '#f5b041', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none' }}>
            {saving ? 'Kaydediliyor...' : 'Yayinla'}
          </button>
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
