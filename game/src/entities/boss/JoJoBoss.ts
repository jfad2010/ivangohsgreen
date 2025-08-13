import Phaser from 'phaser';

// Boss phases
enum Phase {
  ENGAGE = 'ENGAGE',
  VOLLEY = 'VOLLEY',
  RAIN = 'RAIN',
  HEAVY_ORBS = 'HEAVY_ORBS',
}

export class JoJoBoss extends Phaser.Physics.Arcade.Sprite {
  private phase: Phase = Phase.ENGAGE;
  private cycle: Phase[] = [Phase.VOLLEY, Phase.RAIN, Phase.HEAVY_ORBS];
  private cycleIndex = 0;
  private phaseTimer?: Phaser.Time.TimerEvent;
  private telegraphMs = 400;
  private enraged = false;
  private maxHp = 100;
  private bullets: Phaser.Physics.Arcade.Group;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bullets: Phaser.Physics.Arcade.Group,
  ) {
    super(scene, x, y, 'hr_1');
    this.bullets = bullets;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setData('hp', this.maxHp);

    this.startEngage();
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.checkEnrage();
  }

  private checkEnrage() {
    const hp = this.getData('hp') as number;
    if (!this.enraged && hp <= this.maxHp * 0.3) {
      this.enraged = true;
      console.log('JoJo enraged!');
    }
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
