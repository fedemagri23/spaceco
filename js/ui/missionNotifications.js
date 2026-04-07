/**
 * Handles mission success notifications with sound and animations.
 */

import { missionManager } from '../game/missions/MissionManager.js';
import { renderMissionList } from './missionCenter.js';

export function initMissionNotifications() {
  missionManager.onMissionCompleted = (mission) => {
    showNotification(mission, 'COMPLETED');
    renderMissionList(); // Update UI to reflect completion
  };

  missionManager.onMissionGenerated = (mission) => {
    showNotification(mission, 'NEW_CONTRACT');
    renderMissionList(); // Update UI to reflect new arrival
  };
}

function showNotification(mission, type) {
  const container = document.createElement('div');
  container.className = 'mission-success-notif';
  
  const isNew = type === 'NEW_CONTRACT';
  const hdr = isNew ? '/// NUEVO CONTRATO DISPONIBLE' : '/// MISIÓN COMPLETADA';
  const status = isNew ? 'ESTADO: PENDIENTE DE REVISIÓN' : 'ESTADO: ÉXITO OPERATIVO';
  const color = isNew ? '#7FE8FF' : '#AAFF55';
  
  container.style.border = `1px solid ${color}`;
  container.style.borderRight = `5px solid ${color}`;
  container.style.boxShadow = `0 0 15px ${isNew ? 'rgba(127,232,255,0.3)' : 'rgba(170,255,85,0.3)'}`;

  // HTML Structure
  container.innerHTML = `
    <div class="msn-hdr" style="color:${color}">${hdr}</div>
    <div class="msn-title">${mission.title}</div>
    <div class="msn-status" style="border-left-color:${color}; background: ${isNew ? 'rgba(127,232,255,0.1)' : 'rgba(170,255,85,0.1)'}">${status}</div>
  `;
  
  document.body.appendChild(container);

  // Play Sound (Simple Synthesis since we don't have assets)
  playMissionCompletionSound();

  // Remove after animation (3.5s)
  setTimeout(() => {
    container.classList.add('fade-out');
    setTimeout(() => container.remove(), 600);
  }, 3500);
}

function playMissionCompletionSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Simple "Cliiin" sound - Two tones rising
    const playTone = (freq, start, duration, type = 'sine') => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = audioCtx.currentTime;
    playTone(880, now, 1.2, 'triangle'); // A5
    playTone(1760, now + 0.1, 1.0, 'sine'); // A6
    
  } catch (e) {
    console.warn("Audio context not available", e);
  }
}
