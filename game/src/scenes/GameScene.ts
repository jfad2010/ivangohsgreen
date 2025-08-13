import Phaser from 'phaser';
import { laneBand, laneOverlap, projectileHitsEnemy } from '../systems/collision';
import {
  createParticlePool,
  createProjectilePool,
  ParticlePool,
  ProjectilePool
} from '../systems/pools';
import { JoJoBoss } from '../entities/boss/JoJoBoss';
import { Grad, GradCommand } from '../entities/ally/Grad';
import HUD from '../ui/hud';
import { placeBigPickups, dropSmallLettuce, updatePickups } from '../systems/pickups';
import { SpawnDirector, FormationWave } from '../systems/spawnDirector';
import formationConfig from '../config/formations/default.json';

const LANE_TOP = 360;
const LANE_BOTTOM = 520;
const LANE_SOFT_SNAP = 0.12;
const LANE_SOFT_ZONE = 10;
export const BGM_VOL = 0.5;
export const SFX_VOL = 1;

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
  one: Phaser.Input.Keyboard.Key;
  two: Phaser.Input.Keyboard.Key;
  three: Phaser.Input.Keyboard.Key;
  q: Phaser.Input.Keyboard.Key;
  e: Phaser.Input.Keyboard.Key;
};

export class GameScene extends Phaser.Scene {
  private keys!: Keys;
  private player!: Phaser.Physics.Arcade.Sprite;
  private worldWidth = 8000;
  private speed = 220;

  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private projectilePool!: ProjectilePool;
  private particlePool!: ParticlePool;
  private boss?: JoJoBoss;
  private spawnDirector!: SpawnDirector;

  private allies!: Grad[];
  private lettuce = 5;
  private recruitCost = 3;
  private toastText?: Phaser.GameObjects.Text;

  private instructionsText!: Phaser.GameObjects.Text;
  private hud!: HUD;
  private currentCommand: GradCommand = 'hold';
  private bossMaxHp = 0;
  private depthUpdater = (s: Phaser.GameObjects.Sprite) => this.updateDepth(s);
  private shield!: Phaser.Physics.Arcade.Sprite;
  private shieldActive = false;
  private shieldCooldown = 0;
  private bg!: Phaser.GameObjects.TileSprite;
  private musicMain?: Phaser.Sound.BaseSound;
  private musicBoss?: Phaser.Sound.BaseSound;
  private bossMusic = false;
  private sfxCharge?: Phaser.Sound.BaseSound;
  private sfxFire?: Phaser.Sound.BaseSound;
  private gradKeys = ['grad_male_1','grad_female_1','grad_male_2','grad_female_2'];
  private gradIndex = 0;
  private hrAlt = 0;
  private missing = new Set<string>();

  constructor(){ super('game'); }

  private warnMissing(key: string){
    if (this.missing.has(key)) return;
    this.missing.add(key);
    console.warn(`[MISSING ASSET] ${key}`);
  }

  private nextGradKey(){
    const key = this.gradKeys[this.gradIndex % this.gradKeys.length];
    this.gradIndex++;
    return key;
  }

  private spawnGrad(x: number, y: number){
    const key = this.nextGradKey();
    const color = key.includes('female') ? 0xff66cc : 0x66ccff;
    const grad = new Grad(this, x, y, key, 1, color);
    if (!this.textures.exists(key)) this.warnMissing(key);
    grad.setDepth(grad.y);
    return grad;
  }

  private fadeToBoss(){
    if (!this.musicBoss) return;
    if (this.musicMain && this.musicMain.isPlaying) {
      this.tweens.add({ targets: this.musicMain, volume: 0, duration: 1000, onComplete: () => this.musicMain?.stop() });
    }
    if (!this.musicBoss.isPlaying) this.musicBoss.play();
    this.tweens.add({ targets: this.musicBoss, volume: BGM_VOL, duration: 1000 });
    this.bossMusic = true;
  }

  private fadeToMain(){
    if (!this.musicMain) return;
    if (this.musicBoss && this.musicBoss.isPlaying) {
      this.tweens.add({ targets: this.musicBoss, volume: 0, duration: 1000, onComplete: () => this.musicBoss?.stop() });
    }
    if (!this.musicMain.isPlaying) this.musicMain.play();
    this.tweens.add({ targets: this.musicMain, volume: BGM_VOL, duration: 1000 });
    this.bossMusic = false;
  }

  create(){
    // world bounds and camera
    this.cameras.main.setBackgroundColor('#0b0d12');
    this.physics.world.setBounds(0, 0, this.worldWidth, 576);
    this.addParallax();

    if (this.cache.audio.has('ivan_game')) {
      this.musicMain = this.sound.add('ivan_game', { loop: true, volume: BGM_VOL });
      this.musicMain.play();
    } else {
      this.warnMissing('ivan_game');
    }
    if (this.cache.audio.has('boss_battle')) {
      this.musicBoss = this.sound.add('boss_battle', { loop: true, volume: 0 });
    } else {
      this.warnMissing('boss_battle');
    }
    if (this.cache.audio.has('beam_charge')) {
      this.sfxCharge = this.sound.add('beam_charge');
    } else {
      this.warnMissing('beam_charge');
    }
    if (this.cache.audio.has('beam_fire')) {
      this.sfxFire = this.sound.add('beam_fire');
    } else {
      this.warnMissing('beam_fire');
    }

    // create shield texture
    const shieldG = this.add.graphics();
    shieldG.fillStyle(0x00aaff, 0.3).fillCircle(32, 32, 32);
    shieldG.generateTexture('shield', 64, 64);
    shieldG.destroy();

    // player spawn
    this.player = this.physics.add.sprite(120, LANE_BOTTOM, 'ivan');
    if (!this.textures.exists('ivan')) this.warnMissing('ivan');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(this.player.y);
    this.player.setData('size', 'M');
    this.player.setData('hp', 10);
    this.player.setData('beamCharge', 1);
    this.player.setData('beamCooldown', 0);

    // shield setup
    this.shield = this.physics.add.sprite(this.player.x, this.player.y, 'shield');
    this.shield.setCircle(32);
    this.shield.setVisible(false).setActive(false).setAlpha(0.5);
    (this.shield.body as Phaser.Physics.Arcade.Body).enable = false;

    // ally spawn
    const initialGrad = this.spawnGrad(this.player.x - 80, this.player.y);
    this.allies = [initialGrad];

    // groups
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.pickups = this.physics.add.group();

    // pools
    this.projectilePool = createProjectilePool(this, this.bullets, 'bullet', 200);
    this.particlePool = createParticlePool(this, 'bullet', 100, 0.3);

    // big pickups along path
    placeBigPickups(this, this.pickups, this.worldWidth, 8, LANE_TOP, LANE_BOTTOM);

    // formation-based spawns
    this.spawnDirector = new SpawnDirector((formationConfig as { waves: FormationWave[] }).waves);

    // boss spawn
    this.boss = new JoJoBoss(this, 2400, LANE_BOTTOM, this.bullets, this.spawnDirector);
    this.boss.setDepth(this.boss.y);
    this.enemies.add(this.boss);
    this.boss.on('onDefeated', () => this.fadeToMain());
    this.bossMaxHp = this.boss.hp;
    if (!this.textures.exists('joe')) this.warnMissing('joe');

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
      space: k.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      one: k.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      two: k.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      three: k.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      q: k.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      e: k.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    };

    // collisions
    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite;
      const enemy = e as Phaser.Physics.Arcade.Sprite & { takeDamage?: (n: number) => void };
      if (!projectileHitsEnemy(bullet, enemy)) return;
      this.particlePool.spawn(bullet.x, bullet.y);
      enemy.setTint(0xff6666);

      const dmg = bullet.getData('damage') ?? 2;
      let killed = false;

      if (typeof enemy.takeDamage === 'function') {
        const boss = enemy as any;
        enemy.takeDamage(dmg);
        if (typeof boss.hp === 'number' && boss.hp <= 0) {
          killed = true;
        }
      } else {
        const hp = (enemy.getData('hp') ?? 5) - dmg;
        enemy.setData('hp', hp);
        if (hp <= 0) {
          dropSmallLettuce(this, this.pickups, enemy.x, enemy.y);
          enemy.destroy();
          killed = true;
        }
      }

      if (killed) {
        const owner = bullet.getData('owner') as Grad | undefined;
        owner?.registerKill();
      }

      const pierce = bullet.getData('pierce') ?? 1;
      if (pierce > 1) {
        bullet.setData('pierce', pierce - 1);
      } else {
        this.projectilePool.release(bullet);
      }
    });
      this.physics.add.overlap(this.enemies, this.player, (e, p) => {
        const enemy = e as Phaser.Physics.Arcade.Sprite;
        const player = p as Phaser.Physics.Arcade.Sprite;
        if (!laneOverlap(enemy.y, player.y, laneBand(player))) return;
        if (this.shieldActive) return;
        player.setTint(0xff6666);
        const hp = (player.getData('hp') as number ?? 10) - 1;
        player.setData('hp', Math.max(0, hp));
      });
      this.physics.add.overlap(this.bullets, this.player, (b, p) => {
        const bullet = b as Phaser.Physics.Arcade.Sprite;
        if (bullet.getData('from') !== 'enemy') return;
        if (this.shieldActive) {
          this.particlePool.spawn(bullet.x, bullet.y);
          bullet.destroy();
          return;
        }
        bullet.destroy();
        const hp = (this.player.getData('hp') as number ?? 10) - 1;
        this.player.setData('hp', Math.max(0, hp));
        this.player.setTint(0xff6666);
      });
      this.physics.add.overlap(this.bullets, this.shield, (b, s) => {
        const bullet = b as Phaser.Physics.Arcade.Sprite;
        if (bullet.getData('from') !== 'enemy') return;
        this.particlePool.spawn(bullet.x, bullet.y);
        bullet.destroy();
      });
      this.physics.add.overlap(this.pickups, this.player, (p, pl) => {
      const pickup = p as Phaser.Physics.Arcade.Sprite;
      const player = pl as Phaser.Physics.Arcade.Sprite;
      if (!laneOverlap(pickup.y, player.y, laneBand(player))) return;
      const type = pickup.getData('type');
      if (type === 'big') {
        this.lettuce += 3;
        const hp = player.getData('hp') ?? 10;
        player.setData('hp', Math.min(hp + 1, 10));
      } else {
        this.lettuce += 1;
      }
      // HUD updates automatically
      pickup.destroy();
    });

      this.instructionsText = this.add.text(16, 16,
        'A/D move · W/S lane · Space fire · E shield · 1 Retreat 2 Hold 3 Advance', {
        fontFamily: 'system-ui, Segoe UI, Roboto, Helvetica, Arial',
        color: '#cfe6ff', fontSize: '14px'
      }).setScrollFactor(0);

    this.hud = new HUD(this);

  }

  private addParallax(){
    this.bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'office_interior')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-1000);
    if (!this.textures.exists('office_interior')) this.warnMissing('office_interior');
  }

  private spawnEnemy(x: number, y?: number){
    const yy = y !== undefined ? y : Phaser.Math.Between(LANE_TOP, LANE_BOTTOM);
    const key = this.hrAlt++ % 2 === 0 ? 'hr_1' : 'hr_2';
    if (!this.textures.exists(key)) this.warnMissing(key);
    const e = this.physics.add.sprite(x, yy, key);
    e.setImmovable(true);
    e.setData('hp', 5);
    e.setData('size', 'M');
    e.setDepth(e.y);

    this.enemies.add(e);
  }

  private spawnFormation(wave: FormationWave, baseX: number){
    const laneY = wave.lane === 'top' ? LANE_TOP : LANE_BOTTOM;
    if (wave.pattern === 'line') {
      const spacing = wave.spacing ?? 60;
      for (let i = 0; i < wave.count; i++) {
        this.spawnEnemy(baseX + i * spacing, laneY);
      }
    } else if (wave.pattern === 'arc') {
      const radius = wave.radius ?? 60;
      for (let i = 0; i < wave.count; i++) {
        const t = wave.count === 1 ? 0.5 : i / (wave.count - 1);
        const theta = Math.PI * t;
        const x = baseX + Math.cos(theta) * radius;
        const y = wave.lane === 'top'
          ? laneY + Math.sin(theta) * radius
          : laneY - Math.sin(theta) * radius;
        this.spawnEnemy(x, y);
      }
    }
  }

  update(time: number, delta: number){
    const dt = delta/1000;
    this.bg.tilePositionX = this.cameras.main.scrollX * 0.3;
    if (this.boss && !this.bossMusic && this.player.x > this.boss.x - 300) {
      this.fadeToBoss();
    }

    // formation scheduling
    const output = this.spawnDirector.update({
      dt,
      progress: this.player.x / this.worldWidth,
      grads: this.allies.length,
      difficulty: 1,
      enemyCount: this.enemies.getChildren().length,
      nearBoss: this.boss ? Math.abs(this.boss.x - this.player.x) < 400 : false,
    });
    const baseX = Math.min(this.player.x + 900, this.worldWidth - 200);
    output.waves.forEach(w => this.spawnFormation(w, baseX));

    // ally command input
    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
      this.currentCommand = 'retreat';
      this.allies.forEach(a => a.setCommand('retreat'));
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
      this.currentCommand = 'hold';
      this.allies.forEach(a => a.setCommand('hold'));
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) {
      this.currentCommand = 'advance';
      this.allies.forEach(a => a.setCommand('advance'));
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.q)) this.recruitGrad();
    if (Phaser.Input.Keyboard.JustDown(this.keys.e) && !this.shieldActive && this.shieldCooldown <= 0) {
      this.activateShield();
    }
    const SHIELD_COOLDOWN_TIME = 5; // seconds
    if (this.shieldCooldown > 0) {
      this.shieldCooldown = Math.max(0, this.shieldCooldown - dt / SHIELD_COOLDOWN_TIME);
    }

    // beam charge / cooldown update
    const charge = (this.player.getData('beamCharge') as number) ?? 0;
    const cooldown = (this.player.getData('beamCooldown') as number) ?? 0;
    const COOLDOWN_TIME = 3; // seconds
    const CHARGE_RATE = 0.3; // per second
    if (cooldown > 0) {
      const newCooldown = Math.max(0, cooldown - dt / COOLDOWN_TIME);
      this.player.setData('beamCooldown', newCooldown);
      if (newCooldown === 0) {
        this.player.setData('beamCharge', 0);
      }
    } else if (charge < 1) {
      this.player.setData('beamCharge', Math.min(1, charge + dt * CHARGE_RATE));
    }

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
    if (this.shieldActive) {
      this.shield.x = this.player.x;
      this.shield.y = this.player.y;
      this.updateDepth(this.shield);
    }

    // update allies after player movement and handle firing
    this.allies.forEach(a => {
      a.update(dt, this.player);
      this.updateDepth(a);
      if (a.readyToFire()) {
        const b = this.projectilePool.fire(a.x + 18, a.y - 10, 480);
        if (b) {
          b.setData('from', 'ally');
          b.setData('owner', a);
          b.setData('damage', a.damage);
          b.setData('pierce', a.pierce);
          b.setDisplaySize(10, 4);
          this.updateDepth(b);
        }
        a.recordShot();
      }
    });

    // face direction
    this.player.setFlipX(vx < 0);

    // fire
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)){
      if (this.sfxCharge && !this.sfxCharge.isPlaying) this.sfxCharge.play({ volume: SFX_VOL });
      const b = this.projectilePool.fire(
        this.player.x + (this.player.flipX ? -18 : 18),
        this.player.y - 10,
        this.player.flipX ? -480 : 480
      );
      if (b) {
        b.setDisplaySize(10, 4);
        this.updateDepth(b);
      }
      if ((this.player.getData('beamCharge') as number ?? 0) >= 1 && (this.player.getData('beamCooldown') as number ?? 0) <= 0) {
        this.player.setData('beamCharge', 0);
        this.player.setData('beamCooldown', 1);
      }
    }
    if (Phaser.Input.Keyboard.JustUp(this.keys.space)) {
      if (this.sfxFire && !this.sfxFire.isPlaying) this.sfxFire.play({ volume: SFX_VOL });
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

    // update pickups (magnetism)
    updatePickups(this, this.pickups, this.player);

    // cull enemies behind
    this.enemies.children.iterate((obj: Phaser.GameObjects.GameObject) => {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      if (!s) return true;
      this.updateDepth(s);
      if (s.x < this.cameras.main.worldView.x - 200) s.destroy();
      return true;
    });

    // update projectiles and particles
    this.projectilePool.update(this.cameras.main, this.depthUpdater);
    this.particlePool.update(dt);
    this.hud.update(dt, {
      lettuce: this.lettuce,
      grads: this.allies.length,
      hp: (this.player.getData('hp') as number) ?? 10,
      bossHp: this.boss ? this.boss.hp : 0,
      bossMaxHp: this.boss ? this.bossMaxHp : 0,
      command: this.currentCommand,
      beamCharge: (this.player.getData('beamCharge') as number) ?? 0,
      beamCooldown: (this.player.getData('beamCooldown') as number) ?? 0,
      shieldCooldown: this.shieldCooldown
    });
  }

  private activateShield(){
    this.shieldActive = true;
    this.shield.setPosition(this.player.x, this.player.y);
    this.shield.setVisible(true).setActive(true);
    (this.shield.body as Phaser.Physics.Arcade.Body).enable = true;
    this.time.delayedCall(2000, () => {
      this.shieldActive = false;
      this.shield.setVisible(false).setActive(false);
      (this.shield.body as Phaser.Physics.Arcade.Body).enable = false;
      this.shieldCooldown = 1;
    });
  }

  private isDown(...keys: Phaser.Input.Keyboard.Key[]){
    return keys.some(k => k.isDown);
  }

  private updateDepth(entity: Phaser.GameObjects.Sprite){
    entity.setDepth(entity.y);
  }

  private recruitGrad(){
    if (this.lettuce >= this.recruitCost) {
      this.lettuce -= this.recruitCost;
      const g = this.spawnGrad(this.player.x - 80, this.player.y);
      this.allies.push(g);
      // HUD updates automatically
    } else {
      this.showToast('Not enough lettuce');
    }
  }

  // HUD refresh method removed; HUD updates each frame

  private showToast(msg: string){
    if (this.toastText) this.toastText.destroy();
    this.toastText = this.add.text(16, 40, msg, {
      fontFamily: 'system-ui, Segoe UI, Roboto, Helvetica, Arial',
      color: '#ff6666',
      fontSize: '14px'
    }).setScrollFactor(0);
    this.time.delayedCall(1000, () => {
      this.toastText?.destroy();
      this.toastText = undefined;
    });
  }
}
