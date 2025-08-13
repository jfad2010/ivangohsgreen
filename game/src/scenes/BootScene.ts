import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor(){ super('boot'); }

  preload(){
    const { width, height } = this.cameras.main;
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    // sprites
    this.load.setPath('assets/sprites');
    ['ivan','joe','hr_1','boss','bullet'].forEach(name => this.load.image(name, `${name}.png`));
    this.load.setPath('');

    // music
    this.load.setPath('assets/music');
    ['boss_battle','ivan_game'].forEach(name => this.load.audio(name, `${name}.mp3`));
    this.load.setPath('');

    // sfx
    this.load.setPath('assets/sfx');
    ['beam_charge','beam_fire'].forEach(name => this.load.audio(name, `${name}.mp3`));
    this.load.setPath('');
  }

  create(){
    this.scene.start('game');
  }
}
