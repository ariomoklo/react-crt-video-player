import { paintingTexture, sunbeamTexture, SUNBEAM_BLENDING, wallpaperTexture } from "./textures";

export const WALL_Z = -2.6;
/** Top surface of the sideboard; the monitor pedestal rests here. */
export const TOP_Y = -1.78;

const WOOD = "#7a4a2a";
const WOOD_DARK = "#5a351c";
const BRASS = "#b08d3c";
const DRAWERS = [-1.7, 0, 1.7];

type Vec3 = [number, number, number];

function Painting({
  position,
  size,
  seed,
}: {
  position: Vec3;
  size: [number, number];
  seed: number;
}) {
  const [w, h] = size;
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w + 0.14, h + 0.14, 0.05]} />
        <meshStandardMaterial color="#4a2e18" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={paintingTexture(seed)} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Socket({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.2, 0.28, 0.03]} />
        <meshStandardMaterial color="#e8e0cf" roughness={0.6} />
      </mesh>
      {[0.05, -0.05].map((y) => (
        <mesh key={y} position={[0, y, 0.016]}>
          <boxGeometry args={[0.07, 0.025, 0.005]} />
          <meshStandardMaterial color="#222" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Floral wall, floor, sideboard, paintings and the wall socket the CRT cable plugs into. */
export function Room() {
  return (
    <group>
      {/* Wall */}
      <mesh position={[0, 1, WALL_Z]}>
        <planeGeometry args={[24, 12]} />
        <meshStandardMaterial
          map={wallpaperTexture()}
          map-repeat={[10, 5]}
          roughness={1}
          color="#d8c9b4"
        />
      </mesh>
      <mesh position={[0, 1.2, WALL_Z + 0.01]} raycast={() => null}>
        <planeGeometry args={[11, 5.5]} />
        <meshBasicMaterial
          map={sunbeamTexture()}
          transparent
          blending={SUNBEAM_BLENDING}
          depthWrite={false}
          opacity={0.55}
        />
      </mesh>

      {/* Floor */}
      <mesh position={[0, -3.35, -1]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[30, 14]} />
        <meshStandardMaterial color="#1b130d" roughness={1} />
      </mesh>

      <Painting position={[-2.3, 0.75, WALL_Z + 0.03]} size={[0.9, 1.15]} seed={11} />
      <Painting position={[2.15, 1.0, WALL_Z + 0.03]} size={[0.85, 1.05]} seed={4} />
      <Socket position={[1.95, -1.2, WALL_Z + 0.02]} />

      {/* Sideboard */}
      <mesh position={[0, TOP_Y - 0.07, -1.05]}>
        <boxGeometry args={[5.6, 0.14, 3.0]} />
        <meshStandardMaterial color={WOOD} roughness={0.55} />
      </mesh>
      <mesh position={[0, -2.62, -1.1]}>
        <boxGeometry args={[5.3, 1.4, 2.8]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.75} />
      </mesh>
      {DRAWERS.map((x) => (
        <group key={x}>
          <mesh position={[x, -2.3, 0.31]}>
            <boxGeometry args={[1.6, 0.6, 0.03]} />
            <meshStandardMaterial color={WOOD} roughness={0.7} />
          </mesh>
          <mesh position={[x, -2.3, 0.35]}>
            <boxGeometry args={[0.3, 0.04, 0.04]} />
            <meshStandardMaterial color={BRASS} roughness={0.35} metalness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
