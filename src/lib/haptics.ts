// Haptic Feedback Helpers for Mobile UX

export function hapticLight() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

export function hapticMedium() {
  if ('vibrate' in navigator) {
    navigator.vibrate(20);
  }
}

export function hapticHeavy() {
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 10, 10]);
  }
}

export function hapticSuccess() {
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 50, 10]);
  }
}

export function hapticError() {
  if ('vibrate' in navigator) {
    navigator.vibrate([20, 40, 20, 40, 20]);
  }
}

export function hapticSelection() {
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
}

// Check if device supports haptics
export function supportsHaptics(): boolean {
  return 'vibrate' in navigator;
}

