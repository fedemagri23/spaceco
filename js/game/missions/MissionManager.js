/**
 * MissionManager handles the lifecyle of missions (third-party and self-driven).
 */

import { gameState } from '../state.js';
import { PAYLOAD_ITEMS } from '../../config/payloadItems.js';

export class MissionManager {
  constructor() {
    this.activeMission = null;
    this.availableMissions = []; // Third-party missions
    this.missionRoadmap = []; // Self-driven missions
    this.completedMissions = new Set();
    this.onMissionCompleted = null; // Callback for UI notifications
    
    this.lastGenerationTime = -1;
    this.generationInterval = 3600 * 12; // Check every 12 hours
    this.onMissionGenerated = null; // Callback for UI notifications
    
    this.initRoadmap();
  }

  /**
   * Initializes the self-driven mission roadmap.
   */
  initRoadmap() {
    this.missionRoadmap = [
      {
        id: 'self_weather_sat',
        title: 'Meteorological Mastery',
        description: 'Deploy the weather satellite to unlock real-time wind data in the control center.',
        reward: 0,
        type: 'self',
        payloadId: 'weatherControlSatellite',
        targetOrbit: { altitude: 180000, speed: 7500 },
        isUnlocked: true
      }
      // Add more roadmap items here
    ];
  }

  /**
   * Generates a new third-party mission.
   */
  generateThirdPartyMission(gameTimeSeconds) {
    const id = `mission_${Date.now()}`;
    const rewards = [500000, 750000, 1000000, 1500000];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    
    const satelliteTypes = Object.keys(PAYLOAD_ITEMS).filter(k => k !== 'none');
    const payloadId = satelliteTypes[Math.floor(Math.random() * satelliteTypes.length)];
    const payloadInfo = PAYLOAD_ITEMS[payloadId];

    const mission = {
      id,
      title: `Contract: ${payloadInfo.name} Deployment`,
      description: `A third-party company needs us to put a ${payloadInfo.name} into orbit. At least 180km altitude and 7.5km/s horizontal speed required for deployment.`,
      reward,
      type: 'third-party',
      payloadId,
      targetOrbit: { altitude: 180000, speed: 7500 },
      expiresAt: gameTimeSeconds + (3600 * 24 * 7) // Expires in 7 in-game days
    };

    this.availableMissions.push(mission);
    
    if (this.onMissionGenerated) {
      this.onMissionGenerated(mission);
    }

    return mission;
  }

  /**
   * Accepts a mission from the available pool.
   */
  acceptMission(missionId) {
    const mission = this.availableMissions.find(m => m.id === missionId) ||
                    this.missionRoadmap.find(m => m.id === missionId);
    
    if (mission) {
      this.activeMission = mission;
      // If third-party, remove from available
      this.availableMissions = this.availableMissions.filter(m => m.id !== missionId);
      
      // Add payload to inventory if not already there
      if (gameState.cargoInv[mission.payloadId] === undefined || gameState.cargoInv[mission.payloadId] === 0) {
        gameState.cargoInv[mission.payloadId] = (gameState.cargoInv[mission.payloadId] || 0) + 1;
      }
      return true;
    }
    return false;
  }

  /**
   * Checks if current flight satisfies active mission goals.
   */
  checkMissionCompletion(rocket) {
    if (!this.activeMission) return false;

    const mission = this.activeMission;
    
    // Check if the correct payload was released in suitable orbit
    if (rocket.isSatelliteReleased && rocket.payloadId === mission.payloadId) {
      if (rocket.checkOrbitalStatus()) {
        this.completeActiveMission();
        return true;
      }
    }
    return false;
  }

  /** @param {any} rocket */
  checkMissionCompletionFrame(rocket) {
    if (this.checkMissionCompletion(rocket)) {
      // Si se completó, esperamos 3 segundos para que el jugador vea el satélite alejarse
      setTimeout(() => {
        import('../flightSimulation.js').then(({ abortFlightSimulation }) => {
          abortFlightSimulation();
        });
      }, 3000);
    }
  }

  completeActiveMission() {
    if (!this.activeMission) return;
    
    const mission = this.activeMission;
    gameState.money += mission.reward;
    this.completedMissions.add(mission.id);
    
    // Handle self-driven rewards (unlocks)
    if (mission.id === 'self_weather_sat') {
      gameState.weatherDataUnlocked = true;
    }

    if (this.onMissionCompleted) {
      this.onMissionCompleted(mission);
    }

    this.activeMission = null;
    console.log(`Mission Completed: ${mission.title}. Reward: $${mission.reward}`);
  }

  update(gameTimeSeconds) {
    const totalHours = Math.floor(gameTimeSeconds / 3600);
    const dayHour = totalHours % 24;
    
    // Generar a la 01:00 y a la 13:00
    const isGenerationTime = (dayHour === 1 || dayHour === 13);
    const lastHour = Math.floor(this.lastGenerationTime / 3600);
    
    if (isGenerationTime && lastHour !== totalHours) {
      this.generateThirdPartyMission(gameTimeSeconds);
      this.lastGenerationTime = gameTimeSeconds;
    }

    // Filter expired missions
    this.availableMissions = this.availableMissions.filter(m => !m.expiresAt || m.expiresAt > gameTimeSeconds);
  }
}

export const missionManager = new MissionManager();
