import * as THREE from 'three';

/**
 * Procedural texture generator for glowing flowers, leaves, and diya flames.
 * Zero external asset dependencies.
 */

// Helper to create an offscreen canvas
function createOffscreen(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

/**
 * Procedural glowing Marigold flower (Genda phool)
 */
export function createMarigoldTexture(): THREE.CanvasTexture {
  const size = 128;
  const { canvas, ctx } = createOffscreen(size, size);
  const cx = size / 2;
  const cy = size / 2;

  // Soft outer aura
  const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  auraGrad.addColorStop(0, 'rgba(251, 191, 36, 0.95)');
  auraGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.6)');
  auraGrad.addColorStop(0.7, 'rgba(225, 29, 72, 0.15)');
  auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = auraGrad;
  ctx.fillRect(0, 0, size, size);

  // Concentric petal rings
  const layers = [
    { count: 18, radius: 46, color: '#f59e0b', width: 9 },
    { count: 14, radius: 34, color: '#fbbf24', width: 8 },
    { count: 10, radius: 22, color: '#fde047', width: 7 },
    { count: 6, radius: 10, color: '#fef08a', width: 6 },
  ];

  layers.forEach(({ count, radius, color, width }) => {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.arc(px, py, width, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Glowing center pistil
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.5, '#fef08a');
  coreGrad.addColorStop(1, '#ea580c');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Glowing Lotus blossom
 */
export function createLotusTexture(): THREE.CanvasTexture {
  const size = 128;
  const { canvas, ctx } = createOffscreen(size, size);
  const cx = size / 2;
  const cy = size / 2;

  // Luminous pink & gold aura
  const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  aura.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  aura.addColorStop(0.3, 'rgba(251, 113, 133, 0.7)');
  aura.addColorStop(0.65, 'rgba(244, 63, 94, 0.25)');
  aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, size, size);

  // Lotus Petals (pointed ellipses)
  const petalCount = 8;
  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < petalCount; i++) {
    ctx.save();
    ctx.rotate((i / petalCount) * Math.PI * 2);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(14, -26, 0, -50);
    ctx.quadraticCurveTo(-14, -26, 0, 0);

    const grad = ctx.createLinearGradient(0, 0, 0, -50);
    grad.addColorStop(0, 'rgba(254, 205, 211, 0.9)');
    grad.addColorStop(0.7, 'rgba(244, 63, 94, 0.85)');
    grad.addColorStop(1, 'rgba(255, 241, 242, 0.95)');

    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  // Inner petal layer
  for (let i = 0; i < petalCount; i++) {
    ctx.save();
    ctx.rotate((i / petalCount) * Math.PI * 2 + Math.PI / petalCount);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(9, -16, 0, -32);
    ctx.quadraticCurveTo(-9, -16, 0, 0);

    ctx.fillStyle = 'rgba(255, 228, 230, 0.95)';
    ctx.fill();
    ctx.restore();
  }

  // Golden lotus heart
  const heart = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
  heart.addColorStop(0, '#ffffff');
  heart.addColorStop(0.6, '#fde047');
  heart.addColorStop(1, '#eab308');
  ctx.fillStyle = heart;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Glowing Night Jasmine / Star flower
 */
export function createJasmineTexture(): THREE.CanvasTexture {
  const size = 128;
  const { canvas, ctx } = createOffscreen(size, size);
  const cx = size / 2;
  const cy = size / 2;

  // Cream/Golden soft glow
  const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  aura.addColorStop(0, 'rgba(254, 243, 199, 0.9)');
  aura.addColorStop(0.4, 'rgba(253, 230, 138, 0.5)');
  aura.addColorStop(0.8, 'rgba(217, 119, 6, 0.1)');
  aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, size, size);

  // 5 pointed starlike petals
  ctx.save();
  ctx.translate(cx, cy);
  const points = 5;
  for (let i = 0; i < points; i++) {
    ctx.save();
    ctx.rotate((i / points) * Math.PI * 2);

    ctx.beginPath();
    ctx.ellipse(0, -28, 8, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fefce8';
    ctx.fill();
    ctx.restore();
  }

  // Golden centre
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Deep Emerald Foliage Leaf
 */
export function createLeafTexture(): THREE.CanvasTexture {
  const size = 128;
  const { canvas, ctx } = createOffscreen(size, size);
  const cx = size / 2;
  const cy = size / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4);

  // Leaf contour
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.quadraticCurveTo(24, -12, 0, 48);
  ctx.quadraticCurveTo(-24, -12, 0, -48);

  const grad = ctx.createLinearGradient(-18, 0, 18, 0);
  grad.addColorStop(0, 'rgba(6, 78, 59, 0.9)');
  grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.85)');
  grad.addColorStop(1, 'rgba(5, 150, 105, 0.9)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Leaf vein
  ctx.beginPath();
  ctx.moveTo(0, -44);
  ctx.lineTo(0, 44);
  ctx.strokeStyle = 'rgba(167, 243, 208, 0.6)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Diya Flame Texture
 */
export function createDiyaFlameTexture(): THREE.CanvasTexture {
  const size = 128;
  const { canvas, ctx } = createOffscreen(size, size);
  const cx = size / 2;
  const cy = size / 2 + 10;

  // Luminous halo
  const halo = ctx.createRadialGradient(cx, cy - 14, 0, cx, cy - 14, 55);
  halo.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  halo.addColorStop(0.2, 'rgba(254, 240, 138, 0.85)');
  halo.addColorStop(0.5, 'rgba(245, 158, 11, 0.5)');
  halo.addColorStop(0.8, 'rgba(225, 29, 72, 0.15)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  // Flame teardrop
  ctx.beginPath();
  ctx.moveTo(cx, cy - 42); // flame tip
  ctx.bezierCurveTo(cx + 18, cy - 16, cx + 18, cy + 12, cx, cy + 16);
  ctx.bezierCurveTo(cx - 18, cy + 12, cx - 18, cy - 16, cx, cy - 42);

  const flameGrad = ctx.createLinearGradient(cx, cy + 16, cx, cy - 42);
  flameGrad.addColorStop(0, '#3b82f6'); // blue base
  flameGrad.addColorStop(0.2, '#f97316'); // orange
  flameGrad.addColorStop(0.65, '#fde047'); // bright yellow
  flameGrad.addColorStop(1, '#ffffff'); // pure white tip
  ctx.fillStyle = flameGrad;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Starlight / Sparkle sprite
 */
export function createSparkleTexture(): THREE.CanvasTexture {
  const size = 64;
  const { canvas, ctx } = createOffscreen(size, size);
  const cx = size / 2;
  const cy = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.2, 'rgba(253, 230, 138, 0.8)');
  grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Sharp cross
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, 4);
  ctx.lineTo(cx, size - 4);
  ctx.moveTo(4, cy);
  ctx.lineTo(size - 4, cy);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
