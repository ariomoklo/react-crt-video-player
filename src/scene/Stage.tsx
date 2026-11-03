import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { changeVolume, loadFile, seek, setDragging, toggleMute, togglePlay } from "../player/store";
import { Scene } from "./Scene";
import { Screen } from "./Screen";
import { panByPixels, pinchBy, setMoveAxes, zoomBy } from "./rigInput";
import type { ScreenLayerRefs } from "./ScreenAnchor";

const MOVE_KEYS = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);

function hasFiles(event: DragEvent) {
  return event.dataTransfer?.types.includes("Files") ?? false;
}

export function Stage() {
  useEffect(() => {
    const onDragOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      setDragging(true);
    };
    const onDragLeave = (event: DragEvent) => {
      if (event.relatedTarget === null) setDragging(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer?.files[0];
      if (file) loadFile(file);
    };
    const heldMoveKeys = new Set<string>();
    const syncMovement = () => {
      const has = (...keys: string[]) => keys.some((key) => heldMoveKeys.has(key));
      setMoveAxes(
        Number(has("w", "arrowup")) - Number(has("s", "arrowdown")),
        Number(has("d", "arrowright")) - Number(has("a", "arrowleft")),
      );
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();

      if (MOVE_KEYS.has(key)) {
        event.preventDefault();
        if (!heldMoveKeys.has(key)) {
          heldMoveKeys.add(key);
          syncMovement();
        }
        return;
      }

      const handlers: Record<string, () => void> = {
        " ": togglePlay,
        m: toggleMute,
        j: () => seek(-1),
        l: () => seek(1),
        "-": () => changeVolume(-1),
        "=": () => changeVolume(1),
        "+": () => changeVolume(1),
      };
      const handler = handlers[key];
      if (!handler) return;
      event.preventDefault();
      // Holding space or M should not flip the state repeatedly.
      if (event.repeat && (key === " " || key === "m")) return;
      handler();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (heldMoveKeys.delete(event.key.toLowerCase())) syncMovement();
    };
    const onBlur = () => {
      heldMoveKeys.clear();
      syncMovement();
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = Math.max(-200, Math.min(200, event.deltaY));
      zoomBy(-delta * 0.003);
    };

    // Touch: one finger slides left/right, two fingers pinch to zoom.
    const touches = new Map<number, { x: number; y: number }>();
    let lastSpread = 0;
    const spread = () => {
      const [a, b] = [...touches.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touches.size === 2) lastSpread = spread();
    };
    const onPointerMove = (event: PointerEvent) => {
      const touch = touches.get(event.pointerId);
      if (!touch) return;
      const dx = event.clientX - touch.x;
      touch.x = event.clientX;
      touch.y = event.clientY;
      if (touches.size === 1) {
        panByPixels(dx);
      } else if (touches.size === 2) {
        const next = spread();
        if (lastSpread > 0 && next > 0) pinchBy(next / lastSpread);
        lastSpread = next;
      }
    };
    const onPointerEnd = (event: PointerEvent) => {
      touches.delete(event.pointerId);
      lastSpread = touches.size === 2 ? spread() : 0;
    };
    // Safari fires its own page-zoom gesture events on top of pointer events.
    const stopGesture = (event: Event) => event.preventDefault();

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    window.addEventListener("gesturestart", stopGesture);
    window.addEventListener("gesturechange", stopGesture);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
      window.removeEventListener("gesturestart", stopGesture);
      window.removeEventListener("gesturechange", stopGesture);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("wheel", onWheel);
      onBlur();
    };
  }, []);

  const layer = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const object = useRef<HTMLDivElement>(null);
  const layerRefs: ScreenLayerRefs = { layer, camera, object };

  return (
    <main className="stage">
      <h1 className="sr-only">CRT video player</h1>
      {/* The video sits under the transparent canvas and shows through a hole in the glass,
          so anything nearer the camera (remote, bezel) correctly covers it. */}
      <div ref={layer} className="css3d-layer">
        <div ref={camera} className="css3d-camera">
          <div ref={object} className="css3d-object">
            <Screen />
          </div>
        </div>
      </div>
      <Canvas dpr={[1, 2]} frameloop="demand" gl={{ antialias: true, alpha: true }}>
        <Scene layerRefs={layerRefs} />
      </Canvas>
      <p className="key-hint">
        <span className="hint-keys">
          WASD / arrows / scroll move · Space play · J L seek · − + volume · M mute
        </span>
        <span className="hint-touch">Drag to slide · pinch to zoom · tap the remote</span>
      </p>
    </main>
  );
}
