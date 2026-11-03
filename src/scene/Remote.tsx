import { useEffect, useMemo, useState } from "react";
import type { CanvasTexture } from "three";
import { RoundedBox } from "@react-three/drei";
import {
  changeVolume,
  openPicker,
  seek,
  stop,
  toggleMute,
  togglePlay,
  togglePower,
} from "../player/store";
import { createIconTexture, ICON_NAMES, type IconName } from "./icons";

type KeyDef = {
  icon: IconName;
  label: string;
  x: number;
  y: number;
  r: number;
  color: string;
  action: () => void;
};

const KEY = "#3a3935";

const KEYS: KeyDef[] = [
  {
    icon: "power",
    label: "Power",
    x: -0.08,
    y: 0.3,
    r: 0.04,
    color: "#d23b2e",
    action: togglePower,
  },
  { icon: "eject", label: "Eject", x: 0.08, y: 0.3, r: 0.04, color: KEY, action: openPicker },
  { icon: "play", label: "Play / Pause", x: 0, y: 0.165, r: 0.058, color: KEY, action: togglePlay },
  {
    icon: "rew",
    label: "Rewind",
    x: -0.095,
    y: 0.03,
    r: 0.036,
    color: KEY,
    action: () => seek(-1),
  },
  { icon: "stop", label: "Stop", x: 0, y: 0.03, r: 0.036, color: KEY, action: stop },
  {
    icon: "ff",
    label: "Fast forward",
    x: 0.095,
    y: 0.03,
    r: 0.036,
    color: KEY,
    action: () => seek(1),
  },
  {
    icon: "volDown",
    label: "Volume down",
    x: -0.08,
    y: -0.1,
    r: 0.04,
    color: KEY,
    action: () => changeVolume(-1),
  },
  {
    icon: "volUp",
    label: "Volume up",
    x: 0.08,
    y: -0.1,
    r: 0.04,
    color: KEY,
    action: () => changeVolume(1),
  },
  { icon: "mute", label: "Mute", x: 0, y: -0.22, r: 0.04, color: KEY, action: toggleMute },
];

const KEY_HEIGHT = 0.02;

/**
 * The remote is pinned a fixed distance from the camera, so zooming in puts the
 * CRT nearer than the remote. It is drawn as a last overlay pass instead: the
 * materials are "transparent" (so they sort after the screen hole), ignore depth,
 * and use ascending render orders so the body, keys and icons stack correctly.
 */
const OVERLAY_ORDER = 1000;
const OVERLAY_MATERIAL = { transparent: true, depthTest: false } as const;

function RemoteKey({ def, texture }: { def: KeyDef; texture: CanvasTexture }) {
  const [down, setDown] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!hover) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover]);

  return (
    <group position={[def.x, def.y, down ? -0.006 : 0]}>
      <mesh
        position-z={KEY_HEIGHT / 2}
        rotation-x={Math.PI / 2}
        renderOrder={OVERLAY_ORDER + 1}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => {
          setHover(false);
          setDown(false);
        }}
        onPointerDown={() => setDown(true)}
        onPointerUp={() => setDown(false)}
        onClick={def.action}
      >
        <cylinderGeometry args={[def.r, def.r * 1.06, KEY_HEIGHT, 28]} />
        <meshStandardMaterial
          color={def.color}
          roughness={0.55}
          emissive="#ffffff"
          emissiveIntensity={hover ? 0.07 : 0}
          {...OVERLAY_MATERIAL}
        />
      </mesh>
      <mesh position-z={KEY_HEIGHT + 0.0005} renderOrder={OVERLAY_ORDER + 2} raycast={() => null}>
        <planeGeometry args={[def.r * 1.5, def.r * 1.5]} />
        <meshBasicMaterial map={texture} toneMapped={false} {...OVERLAY_MATERIAL} />
      </mesh>
    </group>
  );
}

/** Lives in camera space so it stays pinned to the bottom-right corner. */
export function Remote({
  halfWidth,
  halfHeight,
  depth,
}: {
  halfWidth: number;
  halfHeight: number;
  depth: number;
}) {
  const textures = useMemo(
    () =>
      Object.fromEntries(ICON_NAMES.map((name) => [name, createIconTexture(name)])) as Record<
        IconName,
        CanvasTexture
      >,
    [],
  );

  useEffect(
    () => () => {
      Object.values(textures).forEach((texture) => texture.dispose());
    },
    [textures],
  );

  return (
    <group
      position={[halfWidth - 0.3, -halfHeight + 0.46, -depth]}
      rotation={[-0.35, -0.3, 0.2]}
      scale={0.9}
    >
      <RoundedBox
        args={[0.32, 0.74, 0.07]}
        radius={0.03}
        smoothness={3}
        position-y={0.035}
        renderOrder={OVERLAY_ORDER}
      >
        <meshStandardMaterial color="#2c2b28" roughness={0.5} {...OVERLAY_MATERIAL} />
      </RoundedBox>
      {KEYS.map((def) => (
        <group key={def.icon} position-z={0.035}>
          <RemoteKey def={def} texture={textures[def.icon]} />
        </group>
      ))}
    </group>
  );
}
