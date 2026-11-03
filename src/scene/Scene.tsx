import { PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { CrtMonitor } from "./CrtMonitor";
import { Props } from "./Props";
import { Remote } from "./Remote";
import { Rig } from "./Rig";
import { Room } from "./Room";
import { ScreenAnchor, type ScreenLayerRefs } from "./ScreenAnchor";

const FOV = 35;
const TAN_HALF_FOV = Math.tan((FOV * Math.PI) / 360);
const REMOTE_DEPTH = 3;
const VISIBLE_WIDTH = 6.4;
const VISIBLE_HEIGHT = 4.2;
const LOOK_AT_Y = -0.25;
const CAMERA_Y = 0.3;

export function Scene({ layerRefs }: { layerRefs: ScreenLayerRefs }) {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const aspect = width / height;

  // Pull the camera back until the set fits both axes.
  const distance = Math.max(VISIBLE_WIDTH / aspect, VISIBLE_HEIGHT) / 2 / TAN_HALF_FOV;
  const tilt = -Math.atan((CAMERA_Y - LOOK_AT_Y) / distance);
  const remoteHalfHeight = REMOTE_DEPTH * TAN_HALF_FOV;

  return (
    <>
      <ambientLight intensity={0.9} color="#ffe9cc" />
      <directionalLight position={[2, 3, 5]} intensity={1.6} color="#ffd9a8" />

      <Rig baseDistance={distance} y={CAMERA_Y} tilt={tilt} tanHalfFov={TAN_HALF_FOV} />
      <PerspectiveCamera makeDefault fov={FOV}>
        <Remote
          halfWidth={remoteHalfHeight * aspect}
          halfHeight={remoteHalfHeight}
          depth={REMOTE_DEPTH}
        />
      </PerspectiveCamera>

      <group position={[-0.8, 0, 0]}>
        <Room />
        <Props />
        <CrtMonitor />
        <ScreenAnchor refs={layerRefs} />
      </group>
    </>
  );
}
