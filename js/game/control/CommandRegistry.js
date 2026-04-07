/**
 * CommandRegistry defines the available flight commands and how they map to RocketEntity methods.
 */

import { getActiveBottomPhase } from '../rocketPhases.js';

export const COMMANDS = {
  /**
   * THROTTLE <phase> <percentage>%
   * Sets engine throttle for a specific stage.
   */
  THROTTLE: {
    pattern: /^THROTTLE\s+(\d+)\s+(\d+(?:\.\d+)?)\s*%$/i,
    execute: (matches, rocket) => {
      const phase = parseInt(matches[1]);
      const pct = parseFloat(matches[2]);
      rocket.setThrottle(phase, pct / 100);
    }
  },

  /**
   * SEPARATE <phase>
   * Initiates stage separation.
   */
  SEPARATE: {
    pattern: /^SEPARATE\s+(\d+)$/i,
    execute: (matches, rocket, context) => {
      const phase = parseInt(matches[1]);
      // The actual separation involves the scene/group manipulation,
      // handled by an external function for now (legacy transition).
      if (context.onSeparate) {
        context.onSeparate(phase, rocket);
      } else {
        rocket.separate(phase);
      }
    }
  },

  /**
   * YAW <degrees>[d]
   * Horizontal turn (Yaw) around Y axis using engine gimbals. Always targets the active phase.
   */
  YAW: {
    pattern: /^YAW\s+([-+]?\d+(?:\.\d+)?)\s*d?$/i,
    execute: (matches, rocket) => {
      const degrees = parseFloat(matches[1]);
      const active = getActiveBottomPhase(rocket.separatedPhases, rocket.maxPhase);
      if (active !== null) {
        rocket.addSpin(active, degrees, 'Y');
      }
    }
  },

  /**
   * PITCH <degrees>[d]
   * Vertical tilt (Pitch) around Z axis using engine gimbals. Always targets the active phase.
   */
  PITCH: {
    pattern: /^PITCH\s+([-+]?\d+(?:\.\d+)?)\s*d?$/i,
    execute: (matches, rocket) => {
      const degrees = parseFloat(matches[1]);
      const active = getActiveBottomPhase(rocket.separatedPhases, rocket.maxPhase);
      if (active !== null) {
        rocket.addSpin(active, degrees, 'Z');
      }
    }
  },

  /**
   * ABORT
   * Emergency cutoff and mission failure.
   */
  ABORT: {
    pattern: /^ABORT$/i,
    execute: (matches, rocket, context) => {
      if (context.onAbort) context.onAbort();
    }
  },

  /**
   * RELEASE
   * Release the payload (satellite).
   */
  RELEASE: {
    pattern: /^RELEASE$/i,
    execute: (matches, rocket, context) => {
      rocket.isSatelliteReleased = true;
      if (context.onRelease) context.onRelease();
    }
  }
};

/**
 * Parses and executes a raw command string.
 */
export function executeCommand(raw, rocket, context = {}) {
  const line = raw.trim();
  if (!line) return;

  for (const cmd of Object.values(COMMANDS)) {
    const matches = line.match(cmd.pattern);
    if (matches) {
      cmd.execute(matches, rocket, context);
      if (context.onCommandExecuted) {
        context.onCommandExecuted(line);
      }
      return true;
    }
  }
  
  console.warn(`Unknown command: ${line}`);
  return false;
}
