export const metadata = { title: 'LF Starter', description: 'Next.js + Neon + Phaser starter' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background:'#0b0d12', color:'#dbe7ff', fontFamily:'system-ui, Segoe UI, Roboto, Helvetica, Arial' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>{children}</div>
      </body>
    </html>
  );
}
