import { RoundedBox } from "@react-three/drei";
import { usePlayer } from "../player/store";

// Apple Monitor III (1980): beige case, dark inset screen frame, rainbow badge.
const BEIGE = "#d9d0b8";
const BEIGE_SHADE = "#c6bb9e";
const BEIGE_DEEP = "#b3a888";
const DARK = "#23211c";
const RAINBOW = ["#61bb46", "#fdb827", "#f5821f", "#e03a3e", "#963d97", "#009ddc"];
const VENTS = Array.from({ length: 15 }, (_, i) => -0.98 + i * 0.14);

/** A rectangular ring of four boxes around a rectangular opening (half-extents). */
function Frame({
  inner,
  outer,
  depth,
  color,
}: {
  inner: [number, number];
  outer: [number, number];
  depth: number;
  color: string;
}) {
  const [iw, ih] = inner;
  const [ow, oh] = outer;
  const bars: { position: [number, number, number]; size: [number, number, number] }[] = [
    { position: [0, (ih + oh) / 2, depth / 2], size: [ow * 2, oh - ih, depth] },
    { position: [0, -(ih + oh) / 2, depth / 2], size: [ow * 2, oh - ih, depth] },
    { position: [-(iw + ow) / 2, 0, depth / 2], size: [ow - iw, ih * 2, depth] },
    { position: [(iw + ow) / 2, 0, depth / 2], size: [ow - iw, ih * 2, depth] },
  ];
  return (
    <>
      {bars.map(({ position, size }) => (
        <mesh key={position.join()} position={position}>
          <boxGeometry args={size} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
    </>
  );
}

/** Origin is the center of the screen opening; the front face sits at z = 0. */
export function CrtMonitor() {
  const powered = usePlayer((s) => s.powered);

  return (
    <group>
      {/* Front housing, then the case steps down toward the tube */}
      <RoundedBox
        args={[2.9, 2.75, 1.1]}
        radius={0.12}
        smoothness={3}
        position={[0, -0.175, -0.55]}
      >
        <meshStandardMaterial color={BEIGE} roughness={0.65} />
      </RoundedBox>
      <RoundedBox args={[2.55, 2.2, 0.7]} radius={0.12} smoothness={3} position={[0, 0, -1.45]}>
        <meshStandardMaterial color={BEIGE_SHADE} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[1.9, 1.6, 0.5]} radius={0.1} smoothness={3} position={[0, 0, -2.05]}>
        <meshStandardMaterial color={BEIGE_DEEP} roughness={0.75} />
      </RoundedBox>

      {/* Top vents */}
      {VENTS.map((x) => (
        <mesh key={x} position={[x, 1.205, -0.55]}>
          <boxGeometry args={[0.04, 0.01, 0.55]} />
          <meshStandardMaterial color={DARK} roughness={0.9} />
        </mesh>
      ))}

      {/* Black backing behind the glass, a dark inset frame and a beige lip */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[2.45, 1.95]} />
        <meshStandardMaterial color="#000" roughness={1} />
      </mesh>
      <Frame inner={[1.13, 0.94]} outer={[1.25, 1.06]} depth={0.07} color={DARK} />
      <Frame inner={[1.25, 1.06]} outer={[1.36, 1.17]} depth={0.035} color={BEIGE_SHADE} />

      {/* Rainbow badge, lower left */}
      {RAINBOW.map((color, i) => (
        <mesh key={color} position={[-1.1, -1.36 + (2.5 - i) * 0.045, 0.006]}>
          <boxGeometry args={[0.32, 0.035, 0.012]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}

      {/* Brightness and contrast knobs, power LED */}
      {[0.7, 1.0].map((x) => (
        <mesh key={x} position={[x, -1.36, 0.035]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.09, 0.1, 0.07, 24]} />
          <meshStandardMaterial color={BEIGE_DEEP} roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[1.27, -1.36, 0.012]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial
          color="#6dff8a"
          emissive="#3dff66"
          emissiveIntensity={powered ? 2.5 : 0.08}
          toneMapped={false}
        />
      </mesh>

      {/* Neck and pedestal base */}
      <mesh position={[0, -1.615, -0.7]}>
        <boxGeometry args={[0.9, 0.15, 0.8]} />
        <meshStandardMaterial color={BEIGE_SHADE} roughness={0.7} />
      </mesh>
      <RoundedBox args={[2.1, 0.1, 1.9]} radius={0.04} smoothness={2} position={[0, -1.73, -0.8]}>
        <meshStandardMaterial color={BEIGE_DEEP} roughness={0.7} />
      </RoundedBox>

      {/* Light spilling from the tube onto the room */}
      <pointLight position={[0, 0, 1.4]} color="#9dbbff" intensity={powered ? 4 : 0} distance={7} />
    </group>
  );
}
