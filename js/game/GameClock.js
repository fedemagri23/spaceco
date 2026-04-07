/**
 * GameClock handles the in-game time progression and simulation scaling.
 */

export class GameClock {
  constructor() {
    this.totalSeconds = 0;
    this.timeScale = 1;
    this.lastUpdateTime = performance.now();
  }

  /**
   * Updates the game clock based on real time.
   * Typically called from the main loop.
   */
  update() {
    const now = performance.now();
    const dtReal = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // Factor de aceleración de tiempo global (ej: 1 seg real = 2 minutos juego -> 120x)
    const WORLD_TIME_FACTOR = 120;
    this.totalSeconds += dtReal * WORLD_TIME_FACTOR * this.timeScale;
    return dtReal * this.timeScale;
  }

  setTimeScale(scale) {
    this.timeScale = Math.max(0.1, Math.min(64, scale));
  }

  getTimeScale() {
    return this.timeScale;
  }

  getFormattedTime() {
    const totalMinutes = Math.floor(this.totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);

    const mins = totalMinutes % 60;
    const hrs = totalHours % 24;

    return {
      days,
      hours: hrs.toString().padStart(2, '0'),
      minutes: mins.toString().padStart(2, '0')
    };
  }

  getDisplayString() {
    const { days, hours, minutes } = this.getFormattedTime();
    return `Day ${days}, ${hours}:${minutes}`;
  }
}

// Singleton instance for the game
export const gameClock = new GameClock();
