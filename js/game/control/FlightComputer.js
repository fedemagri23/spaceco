/**
 * FlightComputer manages the execution of the flight script.
 * It monitors altitude and time events and triggers commands from the CommandRegistry.
 */

import { executeCommand } from './CommandRegistry.js';

export class FlightComputer {
  constructor(rocket, timeMap, altitudeMap) {
    this.rocket = rocket;
    this.timeMap = timeMap; // Map<number, string[]>
    this.altitudeMap = altitudeMap; // Map<number, string[]>
    
    this.timeEvents = this.sortMapKeys(timeMap);
    this.altitudeEvents = this.sortMapKeys(altitudeMap);
    
    this.timeIdx = 0;
    this.altitudeIdx = 0;
    
    // Callbacks for special commands (handled in Simulation Orchestrator)
    this.handlers = {
      onSeparate: null,
      onAbort: null,
      onRelease: null
    };
  }

  setHandlers(handlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Checks for pending events at current time/altitude.
   */
  processEvents(currentTime, currentAltitude) {
    // 1. Time events
    while (this.timeIdx < this.timeEvents.length && currentTime >= this.timeEvents[this.timeIdx]) {
      const time = this.timeEvents[this.timeIdx];
      const commands = this.timeMap.get(time) ?? [];
      for (const cmd of commands) {
        executeCommand(cmd, this.rocket, this.handlers);
      }
      this.timeIdx++;
    }

    // 2. Altitude events
    while (this.altitudeIdx < this.altitudeEvents.length && currentAltitude >= this.altitudeEvents[this.altitudeIdx]) {
      const alt = this.altitudeEvents[this.altitudeIdx];
      const commands = this.altitudeMap.get(alt) ?? [];
      for (const cmd of commands) {
        executeCommand(cmd, this.rocket, this.handlers);
      }
      this.altitudeIdx++;
    }
  }

  /**
   * Sorts keys for sequential event processing.
   */
  sortMapKeys(map) {
    return Array.from(map.keys()).sort((a, b) => a - b);
  }

  reset() {
    this.timeIdx = 0;
    this.altitudeIdx = 0;
  }
}
