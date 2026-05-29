export const UV_TEXTURE_SIZE = 4096;
export const UV_GUIDE_PATH = '/assets/garments/uv-layout.png';

export type UvRegionKey = 'front' | 'back' | 'leftSleeve' | 'rightSleeve';

export type UvRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  fit?: 'cover' | 'contain';
  flipX?: boolean;
  flipY?: boolean;
  rotation?: 0 | 90 | 180 | 270;
  sourceInset?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
};

export const UV_REGIONS: Record<UvRegionKey, UvRegion> = {
  front: {
    x: 872,
    y: 990,
    width: 1000,
    height: 2890,
    fit: 'cover',
    sourceInset: {
      left: 72,
      top: 54,
      right: 72,
      bottom: 42,
    },
  },
  back: {
    x: 2030,
    y: 1040,
    width: 1170,
    height: 2820,
    fit: 'cover',
    sourceInset: {
      left: 50,
      top: 38,
      right: 50,
      bottom: 34,
    },
  },
  leftSleeve: {
    x: 0,
    y: 930,
    width: 760,
    height: 3140,
    fit: 'cover',
    sourceInset: {
      left: 40,
      top: 18,
      right: 40,
      bottom: 18,
    },
  },
  rightSleeve: {
    x: 3340,
    y: 930,
    width: 756,
    height: 3140,
    fit: 'cover',
    sourceInset: {
      left: 40,
      top: 18,
      right: 40,
      bottom: 18,
    },
  },
};
