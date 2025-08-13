export type SpawnDirectorInput = {
  dt: number;
  progress: number;
  grads: number;
  difficulty: number;
  enemyCount: number;
  cap?: number;
  /** Whether the player is currently near the boss */
  nearBoss?: boolean;
};

export type SpawnDirectorOutput = {
  spawnHR: number;
  spawnLG: number;
  rateHR: number;
  rateLG: number;
  pressureScore: number;
  volleyOpen: boolean;
};

export class SpawnDirector {
  private time = 0;
  private accHR = 0;
  private accLG = 0;
  private pressureScore = 0;
  private volleyTimer = 0;

  update(input: SpawnDirectorInput): SpawnDirectorOutput {
    const { dt, progress, grads, difficulty, enemyCount, cap = 30, nearBoss = false } = input;
    this.time += dt;

    const timeFactor = 1 + this.time / 60;
    const gradFactor = 1 + grads * 0.05;
    const diffFactor = 0.5 + difficulty;
    const progressFactor = 0.5 + progress / 2;

    let rateHR = 0.1 * diffFactor * progressFactor * timeFactor * gradFactor;
    let rateLG = 0.3 * diffFactor * timeFactor * gradFactor * (1 - progress * 0.3);

    const damp = Math.max(0, 1 - enemyCount / cap);
    rateHR *= damp;
    rateLG *= damp;

    this.accHR += rateHR * dt;
    this.accLG += rateLG * dt;

    const spawnHR = Math.floor(this.accHR);
    const spawnLG = Math.floor(this.accLG);

    this.accHR -= spawnHR;
    this.accLG -= spawnLG;

    // track pressure from recent spawns with decay
    this.pressureScore = Math.max(0, this.pressureScore - dt * 0.5);
    this.pressureScore += spawnHR + spawnLG;

    const highPressure = this.pressureScore > 10;
    if ((highPressure || nearBoss) && this.volleyTimer <= 0) {
      this.volleyTimer = 2;
      console.log('SpawnDirector: volley window opened');
    }
    if (this.volleyTimer > 0) {
      this.volleyTimer -= dt;
    }

    return {
      spawnHR,
      spawnLG,
      rateHR,
      rateLG,
      pressureScore: this.pressureScore,
      volleyOpen: this.volleyTimer > 0,
    };
  }

  consumeVolleyWindow(): boolean {
    if (this.volleyTimer > 0) {
      this.volleyTimer = 0;
      console.log('SpawnDirector: volley window consumed');
      return true;
    }
    return false;
  }
}

