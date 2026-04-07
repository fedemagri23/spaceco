/**
 * Manages the real-time command log display in the follow-camera HUD.
 */

const LOG_DURATION_MS = 5000;
const FADE_OUT_MS = 500;

/**
 * Adds a command string to the visual log.
 * @param {string} cmdLine 
 */
export function addCommandToLog(cmdLine) {
  const container = document.getElementById('follow-hud-command-log');
  if (!container) return;

  const entry = document.createElement('div');
  entry.className = 'cmd-log-entry';
  entry.textContent = `> ${cmdLine}`;

  container.appendChild(entry);

  // Auto-remove after duration
  setTimeout(() => {
    entry.classList.add('fade-out');
    
    // Wait for fade animation to finish
    setTimeout(() => {
      if (entry.parentNode === container) {
        container.removeChild(entry);
      }
    }, FADE_OUT_MS);
  }, LOG_DURATION_MS);
}

/**
 * Clears all entries from the log.
 */
export function clearCommandLog() {
  const container = document.getElementById('follow-hud-command-log');
  if (container) {
    container.innerHTML = '';
  }
}
