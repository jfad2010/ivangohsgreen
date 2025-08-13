import Phaser from 'phaser';

/** Spawn big pickups along the horizontal path. */
export function placeBigPickups(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  worldWidth: number,
  count: number,
  laneTop: number,
  laneBottom: number,
) {
  const spacing = worldWidth / (count + 1);
  for (let i = 1; i <= count; i++) {
    const x = spacing * i;
    const y = Phaser.Math.Between(laneTop, laneBottom);
    const p = scene.physics.add.sprite(x, y, 'bullet');
    p.setScale(1.5);
    p.setData('type', 'big');
    p.setDepth(p.y);
    group.add(p);
  }
}

/** Drop a small lettuce from an enemy position. */
export function dropSmallLettuce(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  x: number,
  y: number,
) {
  const p = scene.physics.add.sprite(x, y, 'bullet');
  p.setScale(0.5);
  p.setData('type', 'small');
  p.setData('spawn', scene.time.now);
  p.setVelocity(Phaser.Math.Between(-40, 40), -200);
  p.setGravityY(300);
  p.setDrag(100, 0);
  group.add(p);
}

/** Update pickup behaviors like magnetism. */
export function updatePickups(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  player: Phaser.Physics.Arcade.Sprite,
  magnetRadius = 120,
  autoCollectMs = 3000,
) {
  group.children.iterate((obj: Phaser.GameObjects.GameObject) => {
    const p = obj as Phaser.Physics.Arcade.Sprite;
    if (!p) return true;

    if (p.getData('type') === 'small') {
      const age = scene.time.now - (p.getData('spawn') ?? 0);
      const dist = Phaser.Math.Distance.Between(p.x, p.y, player.x, player.y);
      if (dist < magnetRadius || age > autoCollectMs) {
        scene.physics.moveToObject(p, player, 300);
      }
    }

    p.setDepth(p.y);
    return true;
  });
}
