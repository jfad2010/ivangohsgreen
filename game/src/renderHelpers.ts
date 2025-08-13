import Phaser from 'phaser';

export function createAura(scene: Phaser.Scene, color: number, level: number) {
  const radius = 20 + level * 4;
  const alpha = Math.min(1, 0.2 + level * 0.1);
  const aura = scene.add.circle(0, 0, radius, color, alpha);
  aura.setBlendMode(Phaser.BlendModes.ADD);
  return aura;
}

export function createNameplate(scene: Phaser.Scene, text: string) {
  const nameplate = scene.add.text(0, 0, text, {
    fontSize: '12px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
    fontStyle: 'bold'
  });
  nameplate.setOrigin(0.5, 1);
  return nameplate;
}

const LEVEL_TITLES = ['', 'Rookie', 'Veteran', 'Elite', 'Legend', 'Mythic'];

export function titleByLevel(level: number): string {
  return LEVEL_TITLES[level] ?? '';
}
