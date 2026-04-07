/**
 * missionCenter.js handles the UI for the Mission Center panel.
 */

import { gameState } from '../game/state.js';
import { missionManager } from '../game/missions/MissionManager.js';
import { PAYLOAD_ITEMS } from '../config/payloadItems.js';

let currentTab = 'available'; // 'available' or 'roadmap'
let currentPage = 1;
const PAGE_SIZE = 4;

export function initMissionCenter() {
  const tabs = document.querySelectorAll('.m-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.background = 'rgba(0,20,40,0.3)';
        t.style.color = '#88d';
      });
      tab.classList.add('active');
      tab.style.background = 'rgba(0,40,80,0.5)';
      tab.style.color = '#fff';
      currentTab = tab.dataset.tab;
      currentPage = 1;
      renderMissionList();
    });
  });

  renderMissionList();
}

export function renderMissionList() {
  const container = document.getElementById('mission-list');
  if (!container) return;

  container.innerHTML = '';
  
  let missions = [];
  if (currentTab === 'available') {
    missions = missionManager.availableMissions;
  } else {
    missions = missionManager.missionRoadmap;
  }

  // Pagination
  const totalPages = Math.ceil(missions.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagedMissions = missions.slice(start, end);

  if (pagedMissions.length === 0) {
    container.innerHTML = `<div style="color:#668; text-align:center; padding:20px;">No hay misiones disponibles.</div>`;
  }

  pagedMissions.forEach(m => {
    const isCompleted = missionManager.completedMissions.has(m.id);
    const isActive = missionManager.activeMission?.id === m.id;
    
    const card = document.createElement('div');
    card.className = 'mission-card';
    card.style.padding = '12px';
    card.style.background = isCompleted ? 'rgba(40,80,40,0.1)' : 'rgba(0,30,60,0.4)';
    card.style.borderLeft = isActive ? '4px solid #AAFF55' : (isCompleted ? '4px solid #448822' : '4px solid #336699');
    card.style.marginBottom = '10px';
    card.style.borderRadius = '4px';

    const payloadName = PAYLOAD_ITEMS[m.payloadId]?.name || 'Unknown';
    
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
        <span style="font-weight:bold; color:#7FE8FF;">${m.title}</span>
        <span style="color:#AAFF55; font-size:0.9em;">${m.reward > 0 ? '$'+m.reward.toLocaleString() : 'Roadmap'}</span>
      </div>
      <div style="font-size:0.85em; color:#ccd; margin-bottom:10px;">${m.description}</div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.8em; color:#88d;">Orbit: ${m.targetOrbit.altitude/1000}km / ${m.targetOrbit.speed/1000}km/s</span>
        ${isCompleted ? 
          '<span style="color:#448822; font-weight:bold;">¡COMPLETADA!</span>' : 
          (isActive ? 
            '<span style="color:#AAFF55; font-weight:bold;">ACTIVA</span>' : 
            `<button type="button" class="btn-small mission-accept-btn" data-id="${m.id}" style="padding:4px 12px; font-size:0.85em; background:#336699; border:none; color:#fff; cursor:pointer; border-radius:3px;">Aceptar</button>`
          )
        }
      </div>
    `;
    container.appendChild(card);
  });

  renderPagination(totalPages);
  
  // Bind event listeners
  container.querySelectorAll('.mission-accept-btn').forEach(btn => {
    btn.onclick = () => {
      if (missionManager.acceptMission(btn.dataset.id)) {
        renderMissionList();
      }
    };
  });
}

function renderPagination(totalPages) {
  const pagContainer = document.getElementById('mission-pagination');
  if (!pagContainer) return;
  pagContainer.innerHTML = '';

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.textContent = i;
    dot.style.background = i === currentPage ? 'rgba(127,232,255,0.4)' : 'transparent';
    dot.style.color = '#fff';
    dot.style.border = '1px solid rgba(127,232,255,0.2)';
    dot.style.padding = '2px 8px';
    dot.style.cursor = 'pointer';
    dot.style.borderRadius = '3px';
    dot.onclick = () => {
      currentPage = i;
      renderMissionList();
    };
    pagContainer.appendChild(dot);
  }
}
