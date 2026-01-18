export function setupUI({ onRandomLevel, onFullscreen }) {
  document.getElementById("randomLevelBtn").onclick = onRandomLevel;
  document.getElementById("fullscreenBtn").onclick = onFullscreen;
}
