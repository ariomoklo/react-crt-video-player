import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { readRigInput, registerRigWake } from "./rigInput";

const MIN_DISTANCE = 1.8; // closest the camera gets to the glass
const MAX_BACK = 2; // how far past the default framing it can retreat
const MAX_STRAFE = 2.2;
const SPEED = 3; // world units per second while a key is held
const DAMPING = 8;
const SETTLE = 0.001;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type RigProps = { baseDistance: number; y: number; tilt: number; tanHalfFov: number };

/**
 * Moves the default camera. The remote is a child of the camera, so it
 * follows without any extra work. Runs before ScreenAnchor so the DOM
 * video layer reads the up-to-date camera matrix.
 */
export function Rig({ baseDistance, y, tilt, tanHalfFov }: RigProps) {
  const invalidate = useThree((s) => s.invalidate);
  // Offsets from the default framing: `target` is where we want to be, `current` is eased.
  const motion = useRef({ targetIn: 0, targetSide: 0, currentIn: 0, currentSide: 0 });

  useEffect(() => registerRigWake(invalidate), [invalidate]);
  useEffect(() => invalidate(), [invalidate, baseDistance, y, tilt]);

  useFrame(({ camera, size }, delta) => {
    const m = motion.current;
    const dt = Math.min(delta, 0.05); // demand mode can report a huge first delta
    const input = readRigInput();

    // Distance from the camera to the CRT before this frame's input.
    const distance = baseDistance - m.targetIn;
    // A pinch scales that distance, so the gesture feels proportional at any zoom level.
    const pinchIn = distance - distance / input.pinch;
    // One pixel of finger travel equals this many world units at the CRT's depth.
    const worldPerPx = (2 * distance * tanHalfFov) / size.height;

    m.targetIn = clamp(
      m.targetIn + input.forward * SPEED * dt + input.zoom + pinchIn,
      -MAX_BACK,
      baseDistance - MIN_DISTANCE,
    );
    m.targetSide = clamp(
      m.targetSide + input.strafe * SPEED * dt - input.panPx * worldPerPx,
      -MAX_STRAFE,
      MAX_STRAFE,
    );

    const ease = 1 - Math.exp(-DAMPING * dt);
    m.currentIn += (m.targetIn - m.currentIn) * ease;
    m.currentSide += (m.targetSide - m.currentSide) * ease;

    camera.position.set(m.currentSide, y, baseDistance - m.currentIn);
    camera.rotation.set(tilt, 0, 0);

    const settling =
      Math.abs(m.targetIn - m.currentIn) > SETTLE ||
      Math.abs(m.targetSide - m.currentSide) > SETTLE;
    if (settling || input.forward !== 0 || input.strafe !== 0) invalidate();
  }, -1);

  return null;
}
