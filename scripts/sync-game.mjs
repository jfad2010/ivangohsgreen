import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd());
const gameDist = path.join(root, 'game', 'dist');
const webPublicGame = path.join(root, 'web', 'public', 'game');

if (!fs.existsSync(gameDist)) {
  console.error('game/dist not found. Run: npm run build:game');
  process.exit(1);
}
fs.rmSync(webPublicGame, { recursive: true, force: true });
fs.mkdirSync(webPublicGame, { recursive: true });

// copy recursively
function copyDir(src, dest) {
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, item.name);
    const d = path.join(dest, item.name);
    if (item.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else if (item.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}
copyDir(gameDist, webPublicGame);
console.log('Copied game/dist -> web/public/game');
