import Phaser from 'phaser';

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
  private lanes = { top: 360, bottom: 520 }; // belt-scroller vertical band
  private speed = 220;

  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;

  private hudText!: Phaser.GameObjects.Text;

  constructor(){ super('game'); }

  create(){
    // world bounds and camera
    this.cameras.main.setBackgroundColor('#0b0d12');
    this.physics.world.setBounds(0, 0, this.worldWidth, 576);
    this.addParallax();

    // player spawn
    this.player = this.physics.add.sprite(120, this.lanes.bottom, 'ivan');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(this.player.y);

    // groups
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();

    // spawn a few enemies to start
    for(let i=0;i<20;i++) this.spawnEnemy(600 + i*180 + Phaser.Math.Between(-40,40));

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
      (b as Phaser.Physics.Arcade.Sprite).destroy();
      (e as Phaser.Physics.Arcade.Sprite).setTint(0xff6666);
      (e as any).health = ((e as any).health ?? 5) - 2;
      if(((e as any).health) <= 0) (e as Phaser.Physics.Arcade.Sprite).destroy();
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
    const y = Phaser.Math.Between(this.lanes.top, this.lanes.bottom);
    const e = this.physics.add.sprite(x, y, 'hr_1');
    e.setImmovable(true);
    (e as any).health = 5;
    e.setDepth(e.y);
    this.enemies.add(e);
  }

  update(time: number, delta: number){
    const dt = delta/1000;

    // movement (belt scroller: allow y within band, x scroll)
    const vx = (this.isDown(this.keys.d, this.keys.right) ? 1 : 0) - (this.isDown(this.keys.a, this.keys.left) ? 1 : 0);
    const vy = (this.isDown(this.keys.s, this.keys.down) ? 1 : 0) - (this.isDown(this.keys.w, this.keys.up) ? 1 : 0);
    this.player.x += vx * this.speed * dt;
    this.player.y = Phaser.Math.Clamp(this.player.y + vy * this.speed * 0.7 * dt, this.lanes.top, this.lanes.bottom);
    this.player.setDepth(this.player.y);

    // face direction
    this.player.setFlipX(vx < 0);

    // fire
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)){
      const b = this.physics.add.sprite(this.player.x + (this.player.flipX ? -18 : 18), this.player.y - 10, 'bullet');
      b.setDisplaySize(10, 4);
      b.setVelocityX(this.player.flipX ? -480 : 480);
      b.setDepth(b.y);
      this.bullets.add(b);
    }

    // cull enemies behind
    this.enemies.children.iterate((e) => {
      const s = e as Phaser.Physics.Arcade.Sprite;
      if(!s) return true;
      s.setDepth(s.y);
      if (s.x < this.cameras.main.worldView.x - 200) s.destroy();
      return true;
    });
  }

  private isDown(...keys: Phaser.Input.Keyboard.Key[]){
    return keys.some(k => k.isDown);
  }
}
