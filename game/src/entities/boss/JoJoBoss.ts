import Phaser from 'phaser';
import { BaseBoss } from './BaseBoss';
import { SpawnDirector } from '../../systems/spawnDirector';

// Boss phases
enum Phase {
  ENGAGE = 'ENGAGE',
  VOLLEY = 'VOLLEY',
  RAIN = 'RAIN',
  HEAVY_ORBS = 'HEAVY_ORBS',
}

export class JoJoBoss extends BaseBoss {
  private phase: Phase = Phase.ENGAGE;
  private cycle: Phase[] = [Phase.VOLLEY, Phase.RAIN, Phase.HEAVY_ORBS];
  private cycleIndex = 0;
  private phaseTimer?: Phaser.Time.TimerEvent;
  private telegraphMs = 400;
  private enraged = false;
  private maxHp = 100;
  private bullets: Phaser.Physics.Arcade.Group;
  private hpBar: Phaser.GameObjects.Graphics;
  private spawnDirector?: SpawnDirector;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bullets: Phaser.Physics.Arcade.Group,
    spawnDirector?: SpawnDirector,
  ) {
    super(scene, x, y, 'hr_1', 100);
    this.bullets = bullets;
    this.spawnDirector = spawnDirector;
    this.hpBar = scene.add.graphics();
    this.setImmovable(true);

    this.on('onDefeated', () => {
      this.hpBar.destroy();
      this.destroy();
    });

    this.startEngage();
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.checkEnrage();
    this.drawHpBar();
    if (this.spawnDirector?.consumeVolleyWindow()) {
      console.log('JoJo consumes volley window');
      this.forceVolley();
    }
  }

  private checkEnrage() {
    const hp = this.hp;
    if (!this.enraged && hp <= this.maxHp * 0.3) {
      this.enraged = true;
      console.log('JoJo enraged!');
    }
  }

  private forceVolley() {
    if (this.phaseTimer) this.phaseTimer.remove(false);
    if (this.phase !== Phase.VOLLEY) {
      this.startPhase(Phase.VOLLEY);
    }
  }

  private drawHpBar() {
    const width = 60;
    const height = 6;
    const x = this.x - width / 2;
    const y = this.y - this.height / 2 - 10;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x000000, 1).fillRect(x - 1, y - 1, width + 2, height + 2);
    this.hpBar.fillStyle(0xff0000, 1).fillRect(x, y, width * (this.hp / this.maxHp), height);
    this.hpBar.lineStyle(1, 0xffffff).strokeRect(x, y, width, height);
    this.hpBar.setDepth(this.depth + 1);
  }

  private startEngage() {
    console.log('JoJo engage');
    const targetX = this.x - 200;
    this.scene.tweens.add({ targets: this, x: targetX, duration: 3000 });

    const volleyTimer = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.phase !== Phase.ENGAGE) return;
        this.fireFan();
      },
    });

    this.phaseTimer = this.scene.time.delayedCall(4000, () => {
      volleyTimer.remove(false);
      this.nextPhase();
    });
  }

  private startPhase(phase: Phase) {
    this.phase = phase;
    console.log(`JoJo telegraph ${phase}`);
    this.phaseTimer = this.scene.time.delayedCall(this.telegraphMs, () => {
      switch (phase) {
        case Phase.VOLLEY:
          this.doVolley();
          break;
        case Phase.RAIN:
          this.doRain();
          break;
        case Phase.HEAVY_ORBS:
          this.doHeavyOrbs();
          break;
      }
    });
  }

  private doVolley() {
    console.log('JoJo volley');
    this.fireFan();
    const duration = this.getPhaseDuration();
    this.phaseTimer = this.scene.time.delayedCall(duration, () => this.nextPhase());
  }

  private doRain() {
    console.log('JoJo rain');
    const duration = this.getPhaseDuration();
    const rainTimer = this.scene.time.addEvent({
      delay: 200,
      callback: () => {
        const b = this.scene.physics.add.sprite(this.x + Phaser.Math.Between(-80, 80), this.y - 200, 'bullet');
        b.setVelocityY(200);
        this.bullets.add(b);
      },
      repeat: duration / 200,
    });
    this.phaseTimer = this.scene.time.delayedCall(duration, () => {
      rainTimer.remove(false);
      this.nextPhase();
    });
  }

  private doHeavyOrbs() {
    console.log('JoJo heavy orbs');
    const duration = this.getPhaseDuration();
    const orbTimer = this.scene.time.addEvent({
      delay: 800,
      callback: () => {
        const b = this.scene.physics.add.sprite(this.x, this.y, 'bullet');
        b.setVelocityX(-100);
        b.setScale(2);
        this.bullets.add(b);
      },
      repeat: duration / 800,
    });
    this.phaseTimer = this.scene.time.delayedCall(duration, () => {
      orbTimer.remove(false);
      this.nextPhase();
    });
  }

  private fireFan() {
    const spread = [-0.3, -0.15, 0, 0.15, 0.3];
    spread.forEach((angle) => {
      const b = this.scene.physics.add.sprite(this.x, this.y, 'bullet');
      const speed = 250;
      b.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      );
      this.bullets.add(b);
    });
  }

  private getPhaseDuration(): number {
    const base = 3000;
    return this.enraged ? base * 0.6 : base;
  }

  private nextPhase() {
    const next = this.cycle[this.cycleIndex];
    this.cycleIndex = (this.cycleIndex + 1) % this.cycle.length;
    this.startPhase(next);
  }
}

export default JoJoBoss;
