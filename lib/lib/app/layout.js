import Script from 'next/script';

export const metadata = {
  title: 'PiPulse AI - Decentralized AI Marketplace',
  description: 'Pi Network AI Agents & Micro-payments Ecosystem',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <Script src="https://minepi.com" strategy="beforeInteractive" />
      </head>
      <body style={{ margin: 0, backgroundColor: '#0f0c29', color: '#ffffff', fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
