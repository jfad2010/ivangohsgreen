import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor(){ super('boot'); }

  preload(){
    // Generate minimal textures at runtime
    const g = this.add.graphics();

    // player
    g.clear().fillStyle(0x5bd1ff).fillRect(0,0,28,44);
    g.generateTexture('player', 28, 44);

    // ally
    g.clear().fillStyle(0x52ff9a).fillRect(0,0,26,40);
    g.generateTexture('ally', 26, 40);

    // enemy
    g.clear().fillStyle(0xff9a2f).fillRect(0,0,26,40);
    g.generateTexture('enemy', 26, 40);

    // boss
    g.clear().fillStyle(0xff4d4d).fillRect(0,0,80,140);
    g.generateTexture('boss', 80, 140);

    // bullet
    g.clear().fillStyle(0xffffff).fillRect(0,0,10,4);
    g.generateTexture('bullet', 10, 4);

    g.destroy();
  }

  create(){
    this.scene.start('game');
  }
}
