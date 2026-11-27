export const metadata = {
  title: 'PiPulse AI - Decentralized AI Marketplace & P2P Smart Trade',
  description: 'KYC-Verified AI Agents, x402/Pi SDK Micropayments, and P2P Smart Trade Contracts on Pi Network.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0f0c29', color: '#fff', fontFamily: 'sans-serif' }}>{children}</body>
    </html>
  );
}
