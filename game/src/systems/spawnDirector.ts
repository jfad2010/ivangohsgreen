export type FormationWave = {
  time: number;
  type: string;
  lane: 'top' | 'bottom';
  pattern: 'line' | 'arc';
  count: number;
  spacing?: number;
  radius?: number;
  minProgress?: number;
  minDifficulty?: number;
};

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
  waves: FormationWave[];
  pressureScore: number;
  volleyOpen: boolean;
};

export class SpawnDirector {
  private time = 0;
  private pressureScore = 0;
  private volleyTimer = 0;
  private index = 0;
  constructor(private formations: FormationWave[]) {
    this.formations = formations.sort((a, b) => a.time - b.time);
  }

  update(input: SpawnDirectorInput): SpawnDirectorOutput {
    const { dt, progress, difficulty, cap = 30, enemyCount, nearBoss = false } = input;
    this.time += dt;

    const triggered: FormationWave[] = [];
    while (this.index < this.formations.length && this.formations[this.index].time <= this.time) {
      const wave = this.formations[this.index];
      const meetsProgress = (wave.minProgress ?? 0) <= progress;
      const meetsDiff = (wave.minDifficulty ?? 0) <= difficulty;
      const underCap = enemyCount < cap;
      if (meetsProgress && meetsDiff && underCap) {
        triggered.push(wave);
      }
      this.index++;
    }

    // track pressure from recent spawns with decay
    this.pressureScore = Math.max(0, this.pressureScore - dt * 0.5);
    triggered.forEach(w => (this.pressureScore += w.count));

    const highPressure = this.pressureScore > 10;
    if ((highPressure || nearBoss) && this.volleyTimer <= 0) {
      this.volleyTimer = 2;
      console.log('SpawnDirector: volley window opened');
    }
    if (this.volleyTimer > 0) {
      this.volleyTimer -= dt;
    }

    return {
      waves: triggered,
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
