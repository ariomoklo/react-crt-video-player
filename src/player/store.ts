import { useSyncExternalStore } from "react";

export type PlayerState = {
  powered: boolean;
  src: string | null;
  name: string | null;
  volume: number; // 0..10
  muted: boolean;
  dragging: boolean;
  osd: string | null;
};

const VIDEO_EXT = /\.(mp4|m4v|mov|webm|ogv|ogg|mkv|avi)$/i;
const SEEK_STEP = 10;
const MAX_VOLUME = 10;

let state: PlayerState = {
  powered: true,
  src: null,
  name: null,
  volume: 7,
  muted: false,
  dragging: false,
  osd: null,
};

const listeners = new Set<() => void>();
let video: HTMLVideoElement | null = null;
let osdTimer: number | undefined;
let autoplayPending = false;

function set(patch: Partial<PlayerState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Subscribe to one primitive slice of the player state. */
export function usePlayer<T>(select: (s: PlayerState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

function applyAudio() {
  if (!video) return;
  video.volume = state.volume / MAX_VOLUME;
  video.muted = state.muted;
}

function formatTime(seconds: number) {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function flash(text: string, ms = 1800) {
  window.clearTimeout(osdTimer);
  set({ osd: text });
  osdTimer = window.setTimeout(() => set({ osd: null }), ms);
}

/** Called as a ref callback by the screen's <video>. */
export function attachVideo(el: HTMLVideoElement | null) {
  if (el) {
    video = el;
    if (state.src && el.src !== state.src) el.src = state.src;
    applyAudio();
    return;
  }
  if (video) {
    // Release the decoder when the screen unmounts.
    video.pause();
    video.removeAttribute("src");
    video.load();
    video = null;
  }
}

export function playVideo() {
  video?.play().catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      flash("Press play to start");
    }
  });
}

/** Called when the browser has the first frame of a newly loaded file. */
export function handleLoadedData() {
  if (!autoplayPending) return;
  autoplayPending = false;
  playVideo();
}

export function handleVideoError() {
  if (state.src) flash("This browser can't play that video", 4000);
}

export function setDragging(dragging: boolean) {
  if (state.dragging !== dragging) set({ dragging });
}

export function loadFile(file: File) {
  if (!file.type.startsWith("video/") && !VIDEO_EXT.test(file.name)) {
    set({ dragging: false });
    flash("That file isn't a video", 3000);
    return;
  }
  if (state.src) URL.revokeObjectURL(state.src);
  autoplayPending = true;
  set({
    src: URL.createObjectURL(file),
    name: file.name,
    powered: true,
    dragging: false,
  });
  flash(file.name, 3000);
}

export function openPicker() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "video/*,.mkv";
  input.addEventListener(
    "change",
    () => {
      const file = input.files?.[0];
      if (file) loadFile(file);
    },
    { once: true },
  );
  input.click();
}

function unloadVideo(src: string | null) {
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
  if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
}

export function togglePower() {
  if (!state.powered) {
    set({ powered: true });
    return;
  }
  const src = state.src;
  autoplayPending = false;
  window.clearTimeout(osdTimer);
  video?.pause();
  // Clear the store first so a load() error can't report the file we just dropped.
  // Unload on the next frame, after React has dropped the src prop.
  set({ powered: false, src: null, name: null, osd: null, dragging: false });
  requestAnimationFrame(() => unloadVideo(src));
}

export function togglePlay() {
  if (!state.powered) return;
  if (!video || !state.src) {
    flash("Drop a video or press eject", 2500);
    return;
  }
  if (video.paused || video.ended) {
    playVideo();
    flash("Play");
  } else {
    video.pause();
    flash("Pause");
  }
}

export function stop() {
  if (!state.powered || !video || !state.src) return;
  video.pause();
  video.currentTime = 0;
  flash("Stop");
}

export function seek(direction: -1 | 1) {
  if (!state.powered || !video || !state.src) return;
  const duration = video.duration;
  if (!Number.isFinite(duration)) return;
  const next = Math.min(Math.max(video.currentTime + direction * SEEK_STEP, 0), duration);
  video.currentTime = next;
  flash(`${direction < 0 ? "Rew" : "FF"} ${formatTime(next)} / ${formatTime(duration)}`);
}

export function changeVolume(step: -1 | 1) {
  if (!state.powered) return;
  const volume = Math.min(Math.max(state.volume + step, 0), MAX_VOLUME);
  set({ volume, muted: false });
  applyAudio();
  flash(`Volume ${volume}`);
}

export function toggleMute() {
  if (!state.powered) return;
  const muted = !state.muted;
  set({ muted });
  applyAudio();
  flash(muted ? "Mute" : `Volume ${state.volume}`);
}
