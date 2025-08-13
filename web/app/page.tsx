import Link from 'next/link';

export default function Page(){
  return (
    <main>
      <h1>LF Belt‑Scroller Starter</h1>
      <p>API is in <code>/app/api</code>. Game static build is served from <code>/game/</code>.</p>
      <ul>
        <li><Link href="/play">Play the game</Link></li>
        <li><Link href="/api/health">API health</Link></li>
      </ul>
      <p>After building the Phaser project run <code>npm run sync:game</code> to copy <code>game/dist</code> into <code>web/public/game</code>.</p>
    </main>
  );
}
