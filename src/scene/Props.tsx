import { CatmullRomCurve3, DoubleSide, Quaternion, Vector2, Vector3 } from "three";
import { TOP_Y, WALL_Z } from "./Room";
import { bloomTexture } from "./textures";

const UP = new Vector3(0, 1, 0);

const VASE_PROFILE = [
  [0.001, 0],
  [0.17, 0],
  [0.21, 0.1],
  [0.29, 0.35],
  [0.19, 0.6],
  [0.12, 0.7],
  [0.16, 0.78],
].map(([x, y]) => new Vector2(x, y));

const MOUTH = new Vector3(0, 0.76, 0);
const FLOWERS = [
  { to: new Vector3(-0.32, 1.3, 0.05), color: "#d9432a" },
  { to: new Vector3(-0.02, 1.55, -0.04), color: "#f08a2c" },
  { to: new Vector3(0.34, 1.35, 0.06), color: "#e8b830" },
  { to: new Vector3(0.12, 1.2, 0.18), color: "#d9432a" },
  { to: new Vector3(-0.15, 1.12, 0.2), color: "#f2c040" },
].map(({ to, color }) => {
  const dir = to.clone().sub(MOUTH);
  return {
    to,
    color,
    length: dir.length(),
    quaternion: new Quaternion().setFromUnitVectors(UP, dir.normalize()),
  };
});

const BOOK_SPECS: { size: [number, number, number]; color: string; x: number; rotY: number }[] = [
  { size: [0.95, 0.12, 0.65], color: "#b23a2e", x: 0, rotY: 0.05 },
  { size: [0.85, 0.1, 0.6], color: "#e6dcc2", x: 0.03, rotY: -0.08 },
  { size: [0.8, 0.11, 0.58], color: "#2f4b6e", x: -0.02, rotY: 0.12 },
];
// Stack them: each book rests on the sum of the heights below it.
const BOOKS = BOOK_SPECS.map((book, i) => ({
  ...book,
  y: TOP_Y + BOOK_SPECS.slice(0, i).reduce((sum, b) => sum + b.size[1], 0) + book.size[1] / 2,
}));

// Power cable: out of the back of the CRT, slack across the shelf, up to the wall socket.
const CABLE_CURVE = new CatmullRomCurve3([
  new Vector3(0.55, -0.8, -2.2),
  new Vector3(0.6, -1.4, -2.42),
  new Vector3(0.9, TOP_Y + 0.025, -2.25),
  new Vector3(1.3, TOP_Y + 0.025, -1.7),
  new Vector3(1.6, TOP_Y + 0.025, -2.05),
  new Vector3(1.85, TOP_Y + 0.025, -2.45),
  new Vector3(1.95, -1.5, WALL_Z + 0.05),
  new Vector3(1.95, -1.27, WALL_Z + 0.07),
]);

function Lamp() {
  return (
    <group position={[-2.0, TOP_Y, -1.35]}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.06, 20]} />
        <meshStandardMaterial color="#1d1a17" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.3, 0.48, 0.3]} />
        <meshStandardMaterial color="#b9b0a2" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.2, 10]} />
        <meshStandardMaterial color="#2a2622" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.27, 0.42, 0.56, 28, 1, true]} />
        <meshStandardMaterial
          color="#f2c93a"
          emissive="#f5b400"
          emissiveIntensity={0.55}
          roughness={0.9}
          side={DoubleSide}
        />
      </mesh>
      <pointLight position={[0, 0.9, 0.2]} color="#ffd27a" intensity={2.2} distance={7} />
    </group>
  );
}

function Books() {
  return (
    <group position={[-2.25, 0, -0.3]}>
      {BOOKS.map(({ size, color, x, y, rotY }) => (
        <mesh key={color} position={[x, y, 0]} rotation-y={rotY}>
          <boxGeometry args={size} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Vase() {
  return (
    <group position={[1.85, TOP_Y, -1.2]}>
      <mesh>
        <latheGeometry args={[VASE_PROFILE, 28]} />
        <meshStandardMaterial color="#f2c34a" roughness={0.25} side={DoubleSide} />
      </mesh>
      {FLOWERS.map(({ to, color, length, quaternion }) => (
        <group key={`${to.x}-${to.y}`}>
          <group position={MOUTH} quaternion={quaternion}>
            <mesh position={[0, length / 2, 0]}>
              <cylinderGeometry args={[0.012, 0.012, length, 6]} />
              <meshStandardMaterial color="#4f6b2c" roughness={0.9} />
            </mesh>
          </group>
          <mesh position={to}>
            <planeGeometry args={[0.46, 0.46]} />
            <meshBasicMaterial
              map={bloomTexture(color)}
              alphaTest={0.5}
              side={DoubleSide}
              color="#e8d4b8"
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Mug() {
  return (
    <group position={[1.95, TOP_Y, -0.5]}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.15, 0.13, 0.24, 20]} />
        <meshStandardMaterial color="#c8402a" roughness={0.5} />
      </mesh>
      <mesh position={[0.16, 0.12, 0]}>
        <torusGeometry args={[0.07, 0.02, 8, 14]} />
        <meshStandardMaterial color="#c8402a" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Cable() {
  return (
    <>
      <mesh>
        <tubeGeometry args={[CABLE_CURVE, 72, 0.022, 8, false]} />
        <meshStandardMaterial color="#141414" roughness={0.6} />
      </mesh>
      <mesh position={[1.95, -1.27, WALL_Z + 0.09]}>
        <boxGeometry args={[0.1, 0.14, 0.07]} />
        <meshStandardMaterial color="#141414" roughness={0.6} />
      </mesh>
    </>
  );
}

/** Things standing on the sideboard, plus the CRT's power cable. */
export function Props() {
  return (
    <group>
      <Lamp />
      <Books />
      <Vase />
      <Mug />
      <Cable />
    </group>
  );
}
