import Phaser from 'phaser';
import { BaseBoss } from './BaseBoss';

export class DummyBoss extends BaseBoss {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss', 20);
    this.states
      .addState('idle', {})
      .addState('rage', {});
    this.setState('idle');
  }
}
