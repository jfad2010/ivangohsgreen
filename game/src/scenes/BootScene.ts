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

    const missing = new Set<string>();
    const warnMissing = (key: string) => {
      if (missing.has(key)) return;
      missing.add(key);
      console.warn(`[MISSING ASSET] ${key}`);
    };

    this.load.on('filecomplete', (key: string, type: string) => {
      if (type === 'image' && !this.textures.exists(key)) warnMissing(key);
      if (type === 'audio' && !this.cache.audio.has(key)) warnMissing(key);
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      warnMissing(file.key);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    // sprites
    this.load.setPath('assets/sprites');
    [
      'ivan',
      'joe',
      'kellie',
      'hr_1',
      'hr_2',
      'grad_male_1',
      'grad_male_2',
      'grad_female_1',
      'grad_female_2',
      'lettuce',
      'office_interior',
      'bullet'
    ].forEach(name => this.load.image(name, `${name}.png`));
    this.load.setPath('');

    // music
    this.load.setPath('assets/music');
    ['ivan_game', 'boss_battle'].forEach(name => this.load.audio(name, `${name}.mp3`));
    this.load.setPath('');

    // sfx
    this.load.setPath('assets/sfx');
    ['beam_charge', 'beam_fire'].forEach(name => this.load.audio(name, `${name}.mp3`));
    this.load.setPath('');
  }

  create(){
    this.scene.start('game');
  }
}
