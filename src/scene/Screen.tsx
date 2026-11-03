import { attachVideo, handleLoadedData, handleVideoError, usePlayer } from "../player/store";

const BARS = ["#c8c8c8", "#c8c820", "#20c8c8", "#20c820", "#c820c8", "#c82020", "#2020c8"];

// Touch screens can't drop files from the desktop, so point them at the eject key.
const IS_TOUCH = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

function IdleCard({ dragging }: { dragging: boolean }) {
  return (
    <div className="crt-idle">
      <div className="crt-bars">
        {BARS.map((color) => (
          <span key={color} style={{ background: color }} />
        ))}
      </div>
      <div className="crt-idle-text">
        <p className="crt-idle-title">
          {dragging ? "Release to play" : IS_TOUCH ? "Pick a video" : "Drop a video"}
        </p>
        <p className="crt-idle-hint">
          {dragging ? "" : IS_TOUCH ? "tap eject on the remote" : "or press eject on the remote"}
        </p>
      </div>
    </div>
  );
}

/** The picture tube: a real <video> plus scanlines, OSD and idle card. */
export function Screen() {
  const powered = usePlayer((s) => s.powered);
  const src = usePlayer((s) => s.src);
  const dragging = usePlayer((s) => s.dragging);
  const osd = usePlayer((s) => s.osd);

  return (
    <div className="crt" data-on={powered}>
      <div className="crt-pic">
        <video
          ref={attachVideo}
          src={src ?? undefined}
          playsInline
          preload="auto"
          onLoadedData={handleLoadedData}
          onError={handleVideoError}
        />
        {(!src || dragging) && <IdleCard dragging={dragging} />}
        {osd && (
          <p className="crt-osd" role="status">
            {osd}
          </p>
        )}
      </div>
      <div className="crt-glass" />
    </div>
  );
}
