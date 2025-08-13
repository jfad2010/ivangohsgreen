import Phaser from 'phaser';

export interface ProjectilePool {
  fire(x: number, y: number, vx: number): Phaser.Physics.Arcade.Sprite | null;
  release(obj: Phaser.Physics.Arcade.Sprite): void;
  update(camera: Phaser.Cameras.Scene2D.Camera, updateDepth: (s: Phaser.GameObjects.Sprite) => void): void;
}

export interface ParticlePool {
  spawn(x: number, y: number): void;
  update(dt: number): void;
}

/**
 * Pre-creates a fixed number of projectiles and reuses them. No runtime
 * allocations occur during firing. Exceeding the max silently skips firing.
 */
export function createProjectilePool(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  texture: string,
  max: number
): ProjectilePool {
  for (let i = 0; i < max; i++) {
    const b = scene.physics.add.sprite(0, 0, texture);
    b.setActive(false);
    b.setVisible(false);
    b.body.enable = false;
    group.add(b);
  }

  function fire(x: number, y: number, vx: number) {
    const b = group.getFirstDead(false) as Phaser.Physics.Arcade.Sprite | null;
    if (!b) return null;
    b.enableBody(true, x, y, true, true);
    b.setVelocityX(vx);
    b.setData('from', 'player');
    return b;
  }

  function release(obj: Phaser.Physics.Arcade.Sprite) {
    obj.disableBody(true, true);
  }

  function update(
    camera: Phaser.Cameras.Scene2D.Camera,
    updateDepth: (s: Phaser.GameObjects.Sprite) => void
  ) {
    const left = camera.worldView.x - 200;
    const right = camera.worldView.right + 200;
    group.children.iterate((obj: Phaser.GameObjects.GameObject) => {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      if (!s.active) return true;
      updateDepth(s);
      if (s.x < left || s.x > right) {
        release(s);
      }
      return true;
    });
  }

  return { fire, release, update };
}

/**
 * Simple particle pool. Reuses sprite images that fade out over a short
 * lifespan. Intended for lightweight impact effects.
 */
export function createParticlePool(
  scene: Phaser.Scene,
  texture: string,
  max: number,
  lifespan = 0.3
): ParticlePool {
  type Particle = { sprite: Phaser.GameObjects.Image; ttl: number };
  const pool: Particle[] = [];
  const active: Particle[] = [];

  for (let i = 0; i < max; i++) {
    const p = scene.add.image(0, 0, texture);
    p.setActive(false);
    p.setVisible(false);
    pool.push({ sprite: p, ttl: 0 });
  }

  function spawn(x: number, y: number) {
    const particle = pool.pop();
    if (!particle) return;
    const s = particle.sprite;
    s.setActive(true).setVisible(true).setPosition(x, y).setAlpha(1);
    particle.ttl = lifespan;
    active.push(particle);
  }

  function update(dt: number) {
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i];
      p.ttl -= dt;
      if (p.ttl <= 0) {
        p.sprite.setActive(false).setVisible(false);
        pool.push(p);
        active[i] = active[active.length - 1];
        active.pop();
      } else {
        p.sprite.setAlpha(p.ttl / lifespan);
      }
    }
  }

  return { spawn, update };
}
