import { UV_GUIDE_PATH, UV_REGIONS, UV_TEXTURE_SIZE, type UvRegion } from '@/studio/uv/uvRegions';

export type ComposeUvTextureInput = {
  frontDataUrl?: string | null;
  backDataUrl?: string | null;
  sleevesDataUrl?: string | null;
  leftSleeveDataUrl?: string | null;
  rightSleeveDataUrl?: string | null;
  baseColor?: string;
  showGuide?: boolean;
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export async function composeUvTexture(
  input: ComposeUvTextureInput,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = UV_TEXTURE_SIZE;
  canvas.height = UV_TEXTURE_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create UV compositor context.');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.fillStyle = input.baseColor ?? '#f8fafc';
  context.fillRect(0, 0, canvas.width, canvas.height);

  console.log('composeUvTexture inputs', {
    front: Boolean(input.frontDataUrl),
    back: Boolean(input.backDataUrl),
    leftSleeve: Boolean(input.leftSleeveDataUrl ?? input.sleevesDataUrl),
    rightSleeve: Boolean(input.rightSleeveDataUrl ?? input.sleevesDataUrl),
    baseColor: input.baseColor ?? '#f8fafc',
    showGuide: Boolean(input.showGuide),
  });

  const [frontImage, backImage, leftSleeveImage, rightSleeveImage, guideImage] =
    await Promise.all([
      loadImageMaybe(input.frontDataUrl),
      loadImageMaybe(input.backDataUrl),
      loadImageMaybe(input.leftSleeveDataUrl ?? input.sleevesDataUrl),
      loadImageMaybe(input.rightSleeveDataUrl ?? input.sleevesDataUrl),
      input.showGuide ? loadImage(UV_GUIDE_PATH) : Promise.resolve(null),
    ]);

  if (frontImage) {
    drawImageIntoUvRegion(context, frontImage, UV_REGIONS.front, 'front');
  }

  if (backImage) {
    drawImageIntoUvRegion(context, backImage, UV_REGIONS.back, 'back');
  }

  if (leftSleeveImage) {
    drawImageIntoUvRegion(context, leftSleeveImage, UV_REGIONS.leftSleeve, 'leftSleeve');
  }

  if (rightSleeveImage) {
    drawImageIntoUvRegion(context, rightSleeveImage, UV_REGIONS.rightSleeve, 'rightSleeve');
  }

  if (guideImage) {
    context.save();
    context.globalAlpha = 0.18;
    context.drawImage(guideImage, 0, 0, UV_TEXTURE_SIZE, UV_TEXTURE_SIZE);
    context.restore();
  }

  return canvas;
}

function drawImageIntoUvRegion(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  region: UvRegion,
  regionName: string,
) {
  const sourceRect = getSourceRect(image, region);
  const targetRect = getTargetRect(sourceRect.width, sourceRect.height, region);

  context.save();
  applyRegionTransform(context, region);
  context.drawImage(
    image,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    targetRect.x,
    targetRect.y,
    targetRect.width,
    targetRect.height,
  );
  context.restore();

  console.log('uv region composed', {
    region: regionName,
    atlas: {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
    },
    sourceRect,
    targetRect,
    transform: {
      flipX: Boolean(region.flipX),
      flipY: Boolean(region.flipY),
      rotation: region.rotation ?? 0,
    },
  });
}

function getSourceRect(image: HTMLImageElement, region: UvRegion) {
  const inset = region.sourceInset ?? { left: 0, top: 0, right: 0, bottom: 0 };

  return {
    x: inset.left,
    y: inset.top,
    width: Math.max(1, image.width - inset.left - inset.right),
    height: Math.max(1, image.height - inset.top - inset.bottom),
  };
}

function getTargetRect(
  sourceWidth: number,
  sourceHeight: number,
  region: UvRegion,
) {
  if (region.fit === 'contain') {
    const scale = Math.min(region.width / sourceWidth, region.height / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;

    return {
      x: region.x + (region.width - width) / 2,
      y: region.y + (region.height - height) / 2,
      width,
      height,
    };
  }

  const scale = Math.max(region.width / sourceWidth, region.height / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    x: region.x + (region.width - width) / 2,
    y: region.y + (region.height - height) / 2,
    width,
    height,
  };
}

function applyRegionTransform(
  context: CanvasRenderingContext2D,
  region: UvRegion,
) {
  const centerX = region.x + region.width / 2;
  const centerY = region.y + region.height / 2;

  if (!region.flipX && !region.flipY && !region.rotation) {
    return;
  }

  context.translate(centerX, centerY);
  context.rotate(((region.rotation ?? 0) * Math.PI) / 180);
  context.scale(region.flipX ? -1 : 1, region.flipY ? -1 : 1);
  context.translate(-centerX, -centerY);
}

async function loadImageMaybe(source?: string | null) {
  if (!source) {
    return null;
  }

  return loadImage(source);
}

function loadImage(source: string) {
  if (!imageCache.has(source)) {
    imageCache.set(
      source,
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load image: ${source}`));
        image.src = source;
      }),
    );
  }

  return imageCache.get(source)!;
}
