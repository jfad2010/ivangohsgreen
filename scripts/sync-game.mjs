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
fs.cpSync(gameDist, webPublicGame, { recursive: true });
console.log('Copied game/dist -> web/public/game');
