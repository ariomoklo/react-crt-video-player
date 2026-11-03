import { AdditiveBlending, CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

// Small procedural textures for the room. Each one is built lazily, once.

const PETALS = 8;

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function drawBloom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  petal: string,
  center: string,
  rotation: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = petal;
  for (let i = 0; i < PETALS; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / PETALS);
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.55, radius * 0.27, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#6f8a3a";
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.28, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const WALL_TILE = 512;
const WALL_PALETTE = ["#d9532c", "#ee8a3a", "#d4475a", "#f0b445"];

let wallpaper: CanvasTexture | undefined;
export function wallpaperTexture() {
  if (wallpaper) return wallpaper;
  const { canvas, ctx } = createCanvas(WALL_TILE, WALL_TILE);
  const rand = rng(7);
  ctx.fillStyle = "#e0bd78";
  ctx.fillRect(0, 0, WALL_TILE, WALL_TILE);
  for (let i = 0; i < 9; i++) {
    const x = rand() * WALL_TILE;
    const y = rand() * WALL_TILE;
    const radius = 38 + rand() * 24;
    const color = WALL_PALETTE[i % WALL_PALETTE.length];
    const rotation = rand() * Math.PI;
    const leafAngle = rand() * Math.PI;
    // Draw every flower shifted by a whole tile so the pattern repeats seamlessly
    for (const dx of [-WALL_TILE, 0, WALL_TILE]) {
      for (const dy of [-WALL_TILE, 0, WALL_TILE]) {
        drawLeaf(ctx, x + dx + radius, y + dy + radius * 0.6, radius, leafAngle);
        drawLeaf(ctx, x + dx - radius, y + dy + radius * 0.7, radius, leafAngle + 1.8);
        drawBloom(ctx, x + dx, y + dy, radius, color, "#7a2e12", rotation);
      }
    }
  }
  wallpaper = toTexture(canvas);
  wallpaper.wrapS = wallpaper.wrapT = RepeatWrapping;
  return wallpaper;
}

const paintings = new Map<number, CanvasTexture>();
export function paintingTexture(seed: number) {
  const cached = paintings.get(seed);
  if (cached) return cached;
  const width = 256;
  const height = 320;
  const { canvas, ctx } = createCanvas(width, height);
  const rand = rng(seed);
  ctx.fillStyle = seed % 2 ? "#e9d8a8" : "#d7c08a";
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 9; i++) {
    drawLeaf(ctx, 40 + rand() * 176, 60 + rand() * 220, 60, rand() * Math.PI);
  }
  for (let i = 0; i < 7; i++) {
    drawBloom(
      ctx,
      45 + rand() * 166,
      55 + rand() * 210,
      34 + rand() * 24,
      WALL_PALETTE[i % WALL_PALETTE.length],
      "#6a2410",
      rand() * Math.PI,
    );
  }
  const texture = toTexture(canvas);
  paintings.set(seed, texture);
  return texture;
}

const blooms = new Map<string, CanvasTexture>();
/** Transparent flower head used for the vase bouquet. */
export function bloomTexture(petal: string) {
  const cached = blooms.get(petal);
  if (cached) return cached;
  const { canvas, ctx } = createCanvas(128, 128);
  drawBloom(ctx, 64, 64, 60, petal, "#5c1f0a", 0.3);
  const texture = toTexture(canvas);
  blooms.set(petal, texture);
  return texture;
}

let sunbeam: CanvasTexture | undefined;
/** Two soft diagonal bands of window light, drawn additively over the wall. */
export function sunbeamTexture() {
  if (sunbeam) return sunbeam;
  const width = 1024;
  const height = 512;
  const { canvas, ctx } = createCanvas(width, height);
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-0.38);
  for (const [offset, thickness, alpha] of [
    [-110, 150, 0.5],
    [120, 110, 0.35],
  ] as const) {
    const gradient = ctx.createLinearGradient(0, offset - thickness, 0, offset + thickness);
    gradient.addColorStop(0, "rgba(255,214,140,0)");
    gradient.addColorStop(0.5, `rgba(255,214,140,${alpha})`);
    gradient.addColorStop(1, "rgba(255,214,140,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(-width, offset - thickness, width * 2, thickness * 2);
  }
  sunbeam = toTexture(canvas);
  return sunbeam;
}

export const SUNBEAM_BLENDING = AdditiveBlending;
