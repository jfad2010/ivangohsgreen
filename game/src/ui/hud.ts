import Phaser from 'phaser';

export interface HudState {
  lettuce: number;
  grads: number;
  hp: number;
  bossHp: number;
  bossMaxHp: number;
  command: string;
  beamCharge: number; // 0..1
  beamCooldown: number; // 0..1
  shieldCooldown: number; // 0..1
}

/**
 * Simple heads-up display for showing player stats and ability meters.
 */
export class HUD {
  private scene: Phaser.Scene;
  private lettuceText: Phaser.GameObjects.Text;
  private gradsText: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;
  private bossHpText: Phaser.GameObjects.Text;
  private commandText: Phaser.GameObjects.Text;

  private beamChargeBar: Phaser.GameObjects.Graphics;
  private beamCooldownBar: Phaser.GameObjects.Graphics;
  private beamChargeBg: Phaser.GameObjects.Graphics;
  private beamCooldownBg: Phaser.GameObjects.Graphics;
  private shieldCooldownBar: Phaser.GameObjects.Graphics;
  private shieldCooldownBg: Phaser.GameObjects.Graphics;

  private readonly barWidth = 120;
  private readonly barHeight = 8;
  private chargePos: { x: number; y: number };
  private cooldownPos: { x: number; y: number };
  private shieldPos: { x: number; y: number };

  private beamChargeDisplay = 0;
  private beamCooldownDisplay = 0;
  private shieldCooldownDisplay = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const style = {
      fontFamily: 'system-ui, Segoe UI, Roboto, Helvetica, Arial',
      color: '#cfe6ff',
      fontSize: '14px'
    };

    let y = 16;
    this.lettuceText = scene.add.text(16, y, '', style).setScrollFactor(0); y += 18;
    this.gradsText = scene.add.text(16, y, '', style).setScrollFactor(0); y += 18;
    this.hpText = scene.add.text(16, y, '', style).setScrollFactor(0); y += 18;
    this.bossHpText = scene.add.text(16, y, '', style).setScrollFactor(0); y += 18;
    this.commandText = scene.add.text(16, y, '', style).setScrollFactor(0); y += 20;

    // Beam charge bar
    this.beamChargeBg = scene.add.graphics().setScrollFactor(0);
    this.beamChargeBg.fillStyle(0x333333, 1).fillRect(16, y, this.barWidth, this.barHeight);
    this.beamChargeBar = scene.add.graphics().setScrollFactor(0);
    this.chargePos = { x: 16, y };
    y += this.barHeight + 4;

    // Beam cooldown bar
    this.beamCooldownBg = scene.add.graphics().setScrollFactor(0);
    this.beamCooldownBg.fillStyle(0x333333, 1).fillRect(16, y, this.barWidth, this.barHeight);
    this.beamCooldownBar = scene.add.graphics().setScrollFactor(0);
    this.cooldownPos = { x: 16, y };
    y += this.barHeight + 4;

    // Shield cooldown bar
    this.shieldCooldownBg = scene.add.graphics().setScrollFactor(0);
    this.shieldCooldownBg.fillStyle(0x333333, 1).fillRect(16, y, this.barWidth, this.barHeight);
    this.shieldCooldownBar = scene.add.graphics().setScrollFactor(0);
    this.shieldPos = { x: 16, y };
  }

  update(dt: number, state: HudState): void {
    this.lettuceText.setText(`Lettuce: ${state.lettuce}`);
    this.gradsText.setText(`Grads: ${state.grads}`);
    this.hpText.setText(`HP: ${Math.round(state.hp)}`);

    if (state.bossMaxHp > 0) {
      const hp = Math.max(0, Math.round(state.bossHp));
      this.bossHpText.setText(`Boss HP: ${hp}/${Math.round(state.bossMaxHp)}`);
    } else {
      this.bossHpText.setText('Boss HP: --');
    }

    this.commandText.setText(`Command: ${state.command}`);

    const lerpAmt = Phaser.Math.Clamp(dt * 5, 0, 1);
    this.beamChargeDisplay = Phaser.Math.Linear(this.beamChargeDisplay, state.beamCharge, lerpAmt);
    this.beamCooldownDisplay = Phaser.Math.Linear(this.beamCooldownDisplay, state.beamCooldown, lerpAmt);
    this.shieldCooldownDisplay = Phaser.Math.Linear(this.shieldCooldownDisplay, state.shieldCooldown, lerpAmt);

    this.drawBar(this.beamChargeBar, this.chargePos, this.beamChargeDisplay, 0x00ff00);
    this.drawBar(this.beamCooldownBar, this.cooldownPos, this.beamCooldownDisplay, 0xff0000);
    this.drawBar(this.shieldCooldownBar, this.shieldPos, this.shieldCooldownDisplay, 0x00aaff);
  }

  private drawBar(g: Phaser.GameObjects.Graphics, pos: { x: number; y: number }, value: number, color: number): void {
    g.clear();
    const width = this.barWidth * Phaser.Math.Clamp(value, 0, 1);
    g.fillStyle(color, 1).fillRect(pos.x, pos.y, width, this.barHeight);
  }
}

export default HUD;
