import { CanvasTexture, SRGBColorSpace } from "three";

export type IconName =
  | "power"
  | "eject"
  | "play"
  | "stop"
  | "rew"
  | "ff"
  | "volDown"
  | "volUp"
  | "mute";

export const ICON_NAMES: IconName[] = [
  "power",
  "eject",
  "play",
  "stop",
  "rew",
  "ff",
  "volDown",
  "volUp",
  "mute",
];

const SIZE = 128;

type Ctx = CanvasRenderingContext2D;

function triangle(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  dir: "left" | "right" | "up",
) {
  ctx.beginPath();
  if (dir === "right") {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x, y + h);
  } else if (dir === "left") {
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h);
  } else {
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
  }
  ctx.closePath();
  ctx.fill();
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function speaker(ctx: Ctx) {
  ctx.fillRect(14, 50, 16, 28);
  ctx.beginPath();
  ctx.moveTo(30, 50);
  ctx.lineTo(56, 28);
  ctx.lineTo(56, 100);
  ctx.lineTo(30, 78);
  ctx.closePath();
  ctx.fill();
}

const DRAW: Record<IconName, (ctx: Ctx) => void> = {
  power(ctx) {
    ctx.beginPath();
    ctx.arc(64, 68, 34, -Math.PI / 2 + 0.65, -Math.PI / 2 - 0.65 + Math.PI * 2);
    ctx.stroke();
    line(ctx, 64, 20, 64, 66);
  },
  eject(ctx) {
    triangle(ctx, 28, 22, 72, 44, "up");
    ctx.fillRect(28, 80, 72, 16);
  },
  play(ctx) {
    triangle(ctx, 18, 32, 46, 64, "right");
    ctx.fillRect(78, 32, 13, 64);
    ctx.fillRect(100, 32, 13, 64);
  },
  stop(ctx) {
    ctx.fillRect(32, 32, 64, 64);
  },
  rew(ctx) {
    triangle(ctx, 12, 32, 52, 64, "left");
    triangle(ctx, 64, 32, 52, 64, "left");
  },
  ff(ctx) {
    triangle(ctx, 12, 32, 52, 64, "right");
    triangle(ctx, 64, 32, 52, 64, "right");
  },
  volDown(ctx) {
    speaker(ctx);
    line(ctx, 74, 64, 112, 64);
  },
  volUp(ctx) {
    speaker(ctx);
    line(ctx, 74, 64, 112, 64);
    line(ctx, 93, 45, 93, 83);
  },
  mute(ctx) {
    speaker(ctx);
    line(ctx, 76, 48, 112, 80);
    line(ctx, 112, 48, 76, 80);
  },
};

export function createIconTexture(name: IconName): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f2ece0";
  ctx.strokeStyle = "#f2ece0";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  DRAW[name](ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
