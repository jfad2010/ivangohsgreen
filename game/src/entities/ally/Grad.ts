import Phaser from 'phaser';
import { createAura, createNameplate, titleByLevel } from '../../renderHelpers';

export type GradCommand = 'retreat' | 'hold' | 'advance';

export class Grad extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  regen: number; // hp per second
  moveSpeed: number;
  command: GradCommand;
  leash: number;
  holdOffset: number;
  retreatOffset: number;

  level: number;
  aura: Phaser.GameObjects.Arc;
  nameplate: Phaser.GameObjects.Text;
  kills: number;
  fireTimer: number;
  fireCooldown: number;
  damage: number;
  pierce: number;

  constructor(scene: Phaser.Scene, x: number, y: number, level = 1) {
    super(scene, x, y, 'joe');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.maxHp = 10;
    this.hp = this.maxHp;
    this.regen = 1;
    this.moveSpeed = 200;
    this.command = 'hold';
    this.leash = 120;
    this.holdOffset = 60;
    this.retreatOffset = 120;

    this.level = level;
    this.aura = createAura(scene, 0x00ff00, this.level);
    const title = titleByLevel(this.level);
    const text = title ? `Grad - ${title}` : 'Grad';
    this.nameplate = createNameplate(scene, text);

    this.kills = 0;
    this.fireTimer = 0;
    this.fireCooldown = 0.8;
    this.damage = 2;
    this.pierce = 1;
    this.updateStats();

    this.setData('size', 'M');
  }

  setLevel(level: number) {
    this.level = level;
    const title = titleByLevel(level);
    const text = title ? `Grad - ${title}` : 'Grad';
    this.nameplate.setText(text);

    const radius = 20 + level * 4;
    const alpha = Math.min(1, 0.2 + level * 0.1);
    this.aura.setRadius(radius);
    this.aura.setFillStyle(this.aura.fillColor, alpha);
    this.updateStats();
  }

  setCommand(cmd: GradCommand) {
    this.command = cmd;
  }

  update(dt: number, player: Phaser.Physics.Arcade.Sprite) {
    // regen
    this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);

    // firing cooldown
    this.fireTimer = Math.max(0, this.fireTimer - dt);

    // follow player's lane
    this.y = player.y;

    let targetX = this.x;
    switch (this.command) {
      case 'advance':
        targetX = this.x + this.moveSpeed * dt;
        break;
      case 'hold':
        targetX = player.x - this.holdOffset;
        break;
      case 'retreat':
        targetX = player.x - this.retreatOffset;
        break;
    }

    if (this.command === 'advance') {
      this.x = targetX;
    } else {
      const dx = targetX - this.x;
      const step = this.moveSpeed * dt;
      if (Math.abs(dx) > step) {
        this.x += step * Math.sign(dx);
      } else {
        this.x = targetX;
      }

      // leash: stay close to the player when not advancing
      if (this.x > player.x + this.leash) {
        this.x = player.x + this.leash;
      }
    }

    this.setDepth(this.y);
    this.aura.setPosition(this.x, this.y);
    this.aura.setDepth(this.depth - 1);
    this.nameplate.setPosition(this.x, this.y - this.height);
    this.nameplate.setDepth(this.depth + 1);
  }

  readyToFire() {
    return this.fireTimer <= 0;
  }

  recordShot() {
    this.fireTimer = this.fireCooldown;
  }

  registerKill() {
    this.kills += 1;
    const thresholds = [3, 8, 18, 35];
    const nextLevel = this.level + 1;
    const idx = nextLevel - 2;
    if (idx >= 0 && idx < thresholds.length && this.kills >= thresholds[idx]) {
      this.setLevel(nextLevel);
    }
  }

  private updateStats() {
    this.damage = 2 + (this.level - 1);
    this.fireCooldown = Math.max(0.3, 0.8 - 0.1 * (this.level - 1));
    this.pierce = 1 + Math.floor((this.level - 1) / 2);
  }
}

