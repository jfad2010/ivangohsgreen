'use client';

import { useEffect, useState } from 'react';

export default function Play(){
  const [ready, setReady] = useState(false);
  useEffect(()=>{ setReady(true); }, []);

  return (
    <main>
      <h1>Play</h1>
      {!ready ? <p>Loading…</p> : (
        <iframe
          title="game"
          src="/game/index.html"
          style={{ width:'100%', height:'70vh', border:'1px solid #2a2f3a', borderRadius:8, background:'#0e1117' }}
        />
      )}
      <p style={{opacity:.8}}>If you see a blank screen, build the game then run <code>npm run sync:game</code>.</p>
    </main>
  );
}
