import Phaser from 'phaser';

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

  constructor(scene: Phaser.Scene, x: number, y: number) {
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

    this.setData('size', 'M');
  }

  setCommand(cmd: GradCommand) {
    this.command = cmd;
  }

  update(dt: number, player: Phaser.Physics.Arcade.Sprite) {
    // regen
    this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);

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
  }
}

