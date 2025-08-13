import Phaser from 'phaser';
import { laneBand, laneOverlap, projectileHitsEnemy } from '../systems/collision';
import { JoJoBoss } from '../entities/boss/JoJoBoss';

const LANE_TOP = 360;
const LANE_BOTTOM = 520;
const LANE_SOFT_SNAP = 0.12;
const LANE_SOFT_ZONE = 10;

type Keys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
  space: Phaser.Input.Keyboard.Key;
};

export class GameScene extends Phaser.Scene {
  private keys!: Keys;
  private player!: Phaser.Physics.Arcade.Sprite;
  private worldWidth = 8000;
  private speed = 220;

  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private boss?: JoJoBoss;

  private hudText!: Phaser.GameObjects.Text;

  constructor(){ super('game'); }

  create(){
    // world bounds and camera
    this.cameras.main.setBackgroundColor('#0b0d12');
    this.physics.world.setBounds(0, 0, this.worldWidth, 576);
    this.addParallax();

    // player spawn
    this.player = this.physics.add.sprite(120, LANE_BOTTOM, 'ivan');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(this.player.y);
    this.player.setData('size', 'M');

    // groups
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.pickups = this.physics.add.group();

    // spawn a few enemies to start
    for(let i=0;i<20;i++) this.spawnEnemy(600 + i*180 + Phaser.Math.Between(-40,40));

    // boss spawn
    this.boss = new JoJoBoss(this, 2400, LANE_BOTTOM, this.bullets);
    this.boss.setDepth(this.boss.y);
    this.enemies.add(this.boss);

    // camera follows
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, -200, 120);

    // input
    const k = this.input.keyboard!;
    this.keys = {
      up: k.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: k.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: k.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: k.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: k.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: k.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: k.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: k.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: k.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };

    // collisions
    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite;
      const enemy = e as Phaser.Physics.Arcade.Sprite & { takeDamage?: (n: number) => void };
      if (!projectileHitsEnemy(bullet, enemy)) return;
      bullet.destroy();
      enemy.setTint(0xff6666);
      if (typeof enemy.takeDamage === 'function') {
        enemy.takeDamage(2);
      } else {
        const hp = (enemy.getData('hp') ?? 5) - 2;
        enemy.setData('hp', hp);
        if (hp <= 0) enemy.destroy();
      }
    });
    this.physics.add.overlap(this.enemies, this.player, (e, p) => {
      const enemy = e as Phaser.Physics.Arcade.Sprite;
      const player = p as Phaser.Physics.Arcade.Sprite;
      if (!laneOverlap(enemy.y, player.y, laneBand(player))) return;
      player.setTint(0xff6666);
    });
    this.physics.add.overlap(this.pickups, this.player, (p, pl) => {
      const pickup = p as Phaser.Physics.Arcade.Sprite;
      const player = pl as Phaser.Physics.Arcade.Sprite;
      if (!laneOverlap(pickup.y, player.y, laneBand(player))) return;
      pickup.destroy();
    });

    this.hudText = this.add.text(16, 16, 'A/D move · W/S lane · Space fire', {
      fontFamily: 'system-ui, Segoe UI, Roboto, Helvetica, Arial',
      color: '#cfe6ff', fontSize: '14px'
    }).setScrollFactor(0);

    // timed enemy spawns
    this.time.addEvent({ delay: 1500, loop: true, callback: () => {
      const x = Math.min(this.player.x + 900, this.worldWidth - 200);
      this.spawnEnemy(x + Phaser.Math.Between(-60, 60));
    }});
  }

  private addParallax(){
    // simple strip background
    const g = this.add.graphics().setScrollFactor(0);
    g.fillStyle(0x101318, 1).fillRect(0, 0, 1024, 576);
    // horizon
    g.fillStyle(0x121a27, 1).fillRect(0, 420, 1024, 156);
  }

  private spawnEnemy(x: number){
    const y = Phaser.Math.Between(LANE_TOP, LANE_BOTTOM);
    const e = this.physics.add.sprite(x, y, 'hr_1');
    e.setImmovable(true);
    e.setData('hp', 5);
    e.setData('size', 'M');
    e.setDepth(e.y);

    this.enemies.add(e);
  }

  update(time: number, delta: number){
    const dt = delta/1000;

    // movement (belt scroller: allow y within band, x scroll)
    const vx = (this.isDown(this.keys.d, this.keys.right) ? 1 : 0) - (this.isDown(this.keys.a, this.keys.left) ? 1 : 0);
    const vy = (this.isDown(this.keys.s, this.keys.down) ? 1 : 0) - (this.isDown(this.keys.w, this.keys.up) ? 1 : 0);
    this.player.x += vx * this.speed * dt;
    if (vy !== 0) {
      this.player.y = Phaser.Math.Clamp(
        this.player.y + vy * this.speed * 0.7 * dt,
        LANE_TOP,
        LANE_BOTTOM
      );
    } else {
      const distTop = Math.abs(this.player.y - LANE_TOP);
      const distBottom = Math.abs(this.player.y - LANE_BOTTOM);
      const target = distTop < distBottom ? LANE_TOP : LANE_BOTTOM;
      if (Math.abs(this.player.y - target) <= LANE_SOFT_ZONE) {
        this.player.y = target;
      } else {
        this.player.y = Phaser.Math.Clamp(
          Phaser.Math.Linear(this.player.y, target, LANE_SOFT_SNAP),
          LANE_TOP,
          LANE_BOTTOM
        );
      }
    }
    this.updateDepth(this.player);

    // face direction
    this.player.setFlipX(vx < 0);

    // fire
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)){
      const b = this.physics.add.sprite(this.player.x + (this.player.flipX ? -18 : 18), this.player.y - 10, 'bullet');
      b.setDisplaySize(10, 4);
      b.setVelocityX(this.player.flipX ? -480 : 480);
      this.updateDepth(b);
      this.bullets.add(b);
    }

    // beam damage
    if (this.boss) {
      const beam = this.player.getData('beam') as Phaser.GameObjects.GameObject | undefined;
      if (beam && beam.active) {
        const beamBounds = (beam as any).getBounds?.();
        if (beamBounds) {
          const bossBounds = this.boss.getBounds();
          if (
            Phaser.Geom.Rectangle.Overlaps(beamBounds, bossBounds) &&
            laneOverlap(this.player.y, this.boss.y, laneBand(this.boss))
          ) {
            this.boss.takeDamage(10 * dt);
          }
        }
      }
    }

    // cull enemies behind
    this.enemies.children.iterate((obj: Phaser.GameObjects.GameObject) => {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      if (!s) return true;
      this.updateDepth(s);
      if (s.x < this.cameras.main.worldView.x - 200) s.destroy();
      return true;
    });

    // update projectile depths
    this.bullets.children.iterate((obj: Phaser.GameObjects.GameObject) => {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      if (!s) return true;
      this.updateDepth(s);
      return true;
    });
  }

  private isDown(...keys: Phaser.Input.Keyboard.Key[]){
    return keys.some(k => k.isDown);
  }

  private updateDepth(entity: Phaser.GameObjects.Sprite){
    entity.setDepth(entity.y);
  }
}
