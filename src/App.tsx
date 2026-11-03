import { lazy, Suspense } from "react";
import { useDesktopGate } from "./player/useDesktopGate";
import { SmallScreen } from "./scene/SmallScreen";
import "./App.css";

// Three.js is only fetched on screens that can actually run the player.
const Stage = lazy(() => import("./scene/Stage").then((m) => ({ default: m.Stage })));

function App() {
  const isDesktop = useDesktopGate();
  if (!isDesktop) return <SmallScreen />;
  return (
    <Suspense fallback={null}>
      <Stage />
    </Suspense>
  );
}

export default App;
