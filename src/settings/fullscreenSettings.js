export const FULLSCREEN_SETTINGS_EVENT = "fullscreen-settings-change";

export function isFullscreenEnabled() {
  return Boolean(document.fullscreenElement);
}

export async function setFullscreenEnabled(enabled) {
  if (enabled && !document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  }

  if (!enabled && document.fullscreenElement) {
    await document.exitFullscreen();
  }

  window.dispatchEvent(
    new CustomEvent(FULLSCREEN_SETTINGS_EVENT, {
      detail: isFullscreenEnabled(),
    }),
  );

  return isFullscreenEnabled();
}
