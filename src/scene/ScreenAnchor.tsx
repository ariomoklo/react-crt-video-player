import { useEffect, useRef, type RefObject } from "react";
import { NoBlending, type Camera, type Group } from "three";
import { useFrame, useThree } from "@react-three/fiber";

export type ScreenLayerRefs = {
  layer: RefObject<HTMLDivElement | null>;
  camera: RefObject<HTMLDivElement | null>;
  object: RefObject<HTMLDivElement | null>;
};

/** The DOM screen is 640 x 480 px and covers 2.2 x 1.65 world units. */
export const SCREEN_PX_WIDTH = 640;
export const SCREEN_PX_HEIGHT = 480;
const SCREEN_WORLD_WIDTH = 2.2;
const PX_TO_WORLD = SCREEN_WORLD_WIDTH / SCREEN_PX_WIDTH;

const CAMERA_MULTIPLIERS = [1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1];
const S = PX_TO_WORLD;
const OBJECT_MULTIPLIERS = [S, S, S, 1, -S, -S, -S, -1, S, S, S, 1, 1, 1, 1, 1];

function epsilon(value: number) {
  return Math.abs(value) < 1e-10 ? 0 : value;
}

function cssMatrix(elements: ArrayLike<number>, multipliers: number[]) {
  let out = "matrix3d(";
  for (let i = 0; i < 16; i++) {
    out += epsilon(multipliers[i] * elements[i]) + (i < 15 ? "," : ")");
  }
  return out;
}

/** Mirror the camera and the anchor's world matrix into CSS 3D transforms. */
function syncLayer(
  refs: ScreenLayerRefs,
  camera: Camera,
  size: { width: number; height: number },
  group: Group,
) {
  const layer = refs.layer.current;
  const cameraEl = refs.camera.current;
  const objectEl = refs.object.current;
  if (!layer || !cameraEl || !objectEl) return;

  camera.updateMatrixWorld();
  group.updateWorldMatrix(true, false);

  const widthHalf = size.width / 2;
  const heightHalf = size.height / 2;
  const fov = camera.projectionMatrix.elements[5] * heightHalf;

  layer.style.perspective = `${fov}px`;
  cameraEl.style.transform = `translateZ(${fov}px)${cssMatrix(
    camera.matrixWorldInverse.elements,
    CAMERA_MULTIPLIERS,
  )}translate(${widthHalf}px,${heightHalf}px)`;
  objectEl.style.transform = `translate(-50%,-50%)${cssMatrix(
    group.matrixWorld.elements,
    OBJECT_MULTIPLIERS,
  )}`;
  layer.style.visibility = "visible";
}

/** Pins a regular DOM element to a point in the 3D scene. */
export function ScreenAnchor({ refs }: { refs: ScreenLayerRefs }) {
  const anchor = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useFrame(({ camera, size }) => {
    if (anchor.current) syncLayer(refs, camera, size, anchor.current);
  });

  return (
    <group ref={anchor} position={[0, 0, 0.03]}>
      {/* Punches a transparent hole through the canvas so the DOM video underneath shows. */}
      <mesh raycast={() => null}>
        <planeGeometry
          args={[SCREEN_WORLD_WIDTH, (SCREEN_WORLD_WIDTH * SCREEN_PX_HEIGHT) / SCREEN_PX_WIDTH]}
        />
        <meshBasicMaterial
          color="#000"
          transparent
          opacity={0}
          blending={NoBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
