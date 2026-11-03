/** Camera movement input, shared between DOM listeners and the WebGL rig. */

const axes = { forward: 0, strafe: 0 };
let pendingZoom = 0;
let pendingPanPx = 0;
let pendingPinch = 1;
let wake: (() => void) | null = null;

/** The rig registers a callback that asks the demand-driven canvas for a frame. */
export function registerRigWake(fn: () => void) {
  wake = fn;
  return () => {
    if (wake === fn) wake = null;
  };
}

/** forward: 1 moves toward the CRT, -1 away. strafe: 1 moves right, -1 left. */
export function setMoveAxes(forward: number, strafe: number) {
  axes.forward = forward;
  axes.strafe = strafe;
  wake?.();
}

/** Positive moves toward the CRT (one-shot, e.g. a wheel tick). */
export function zoomBy(amount: number) {
  pendingZoom += amount;
  wake?.();
}

/** Touch drag in screen pixels; positive means the finger moved right. */
export function panByPixels(dx: number) {
  pendingPanPx += dx;
  wake?.();
}

/** Touch pinch as a ratio of finger spread; above 1 moves toward the CRT. */
export function pinchBy(ratio: number) {
  pendingPinch *= ratio;
  wake?.();
}

export function readRigInput() {
  const input = {
    forward: axes.forward,
    strafe: axes.strafe,
    zoom: pendingZoom,
    panPx: pendingPanPx,
    pinch: pendingPinch,
  };
  pendingZoom = 0;
  pendingPanPx = 0;
  pendingPinch = 1;
  return input;
}
