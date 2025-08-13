export function laneBand(target: { getData?: (key: string) => any }, band = 40): number {
  const size = target?.getData?.('size');
  switch (size) {
    case 'S':
      return band * 0.5; // smaller targets, tighter band
    case 'L':
      return band * 1.5; // larger targets, wider band
    default:
      return band;
  }
}

export function laneOverlap(aY: number, bY: number, band = 40): boolean {
  return Math.abs(aY - bY) < band;
}

export function projectileHitsEnemy(projectile: { y: number }, enemy: { y: number; getData?: (key: string) => any }): boolean {
  return laneOverlap(projectile.y, enemy.y, laneBand(enemy));
}

export function enemyHitsPlayer(enemy: { y: number }, player: { y: number; getData?: (key: string) => any }): boolean {
  return laneOverlap(enemy.y, player.y, laneBand(player));
}

export function pickupHitsPlayer(pickup: { y: number }, player: { y: number; getData?: (key: string) => any }): boolean {
  return laneOverlap(pickup.y, player.y, laneBand(player));
}
