import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 1024px) and (min-height: 600px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** True on medium and large screens. The 3D scene never mounts below this. */
export function useDesktopGate() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
