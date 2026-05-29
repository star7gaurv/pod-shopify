import { UV_REGIONS, UV_TEXTURE_SIZE } from '@/studio/uv/uvRegions';

const DEBUG_COLORS = {
  front: '#ef4444',
  back: '#3b82f6',
  leftSleeve: '#22c55e',
  rightSleeve: '#f59e0b',
} as const;

export function createUvDebugCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = UV_TEXTURE_SIZE;
  canvas.height = UV_TEXTURE_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create UV debug canvas.');
  }

  context.fillStyle = '#020617';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = 'bold 180px Arial';

  const labels = {
    front: 'FRONT',
    back: 'BACK',
    leftSleeve: 'LS',
    rightSleeve: 'RS',
  } as const;

  for (const [key, region] of Object.entries(UV_REGIONS) as Array<
    [keyof typeof UV_REGIONS, (typeof UV_REGIONS)[keyof typeof UV_REGIONS]]
  >) {
    context.fillStyle = DEBUG_COLORS[key];
    context.fillRect(region.x, region.y, region.width, region.height);
    context.strokeStyle = '#ffffff';
    context.lineWidth = 14;
    context.strokeRect(region.x, region.y, region.width, region.height);
    context.fillStyle = '#ffffff';
    context.fillText(
      labels[key],
      region.x + region.width / 2,
      region.y + region.height / 2,
    );
  }

  return canvas;
}
