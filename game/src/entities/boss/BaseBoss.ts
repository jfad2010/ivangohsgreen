import Phaser from 'phaser';
import { FSM } from '../../systems/fsm';

export class BaseBoss extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  states: FSM;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, hp = 1) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.hp = hp;
    this.states = new FSM();
  }

  preUpdate(t: number, dt: number) {
    super.preUpdate(t, dt);
    this.states.update(dt / 1000);
  }

  takeDamage(n: number) {
    this.hp -= n;
    if (this.hp <= 0) {
      this.emit('onDefeated');
    }
  }

  setState(name: string | number) {
    const stateName = String(name);
    console.log(`Boss state -> ${stateName}`);
    this.states.setState(stateName);
    this.emit('onPhaseStart', stateName);
    return this;
  }
}
