import type { Canvas } from 'fabric';

type ExportFilter =
  NonNullable<Parameters<Canvas['toDataURL']>[0]>['filter'];

type ExportOptions = {
  filter?: ExportFilter;
  multiplier?: number;
};

const THREE_D_TEXTURE_MULTIPLIER = 4;

export function exportFabricCanvasDataUrl(
  canvas: Canvas,
  filterOrOptions?: ExportFilter | ExportOptions,
) {
  const options =
    typeof filterOrOptions === 'function' || !filterOrOptions
      ? { filter: filterOrOptions, multiplier: 1 }
      : { filter: filterOrOptions.filter, multiplier: filterOrOptions.multiplier ?? 1 };

  return canvas.toDataURL({
    format: 'png',
    multiplier: options.multiplier,
    filter: options.filter,
  });
}

export function exportUvPreviewTextureDataUrl(
  canvas: Canvas,
  filter?: ExportFilter,
) {
  console.log('uv preview export transform', {
    transform: 'raw Fabric canvas export',
    globalMirror: false,
    islandMirror: false,
    multiplier: THREE_D_TEXTURE_MULTIPLIER,
  });

  return exportFabricCanvasDataUrl(canvas, {
    filter,
    multiplier: THREE_D_TEXTURE_MULTIPLIER,
  });
}

export function exportFabricCanvasElement(
  canvas: Canvas,
  options?: ExportOptions,
) {
  return canvas.toCanvasElement(options?.multiplier ?? 1, {
    filter: options?.filter,
  });
}

export function canvasElementToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas.'));
        return;
      }

      resolve(blob);
    }, type, quality);
  });
}

export function exportSleevesCanvasDataUrls(
  source: Canvas | HTMLCanvasElement,
  cropRegions = {
    left: { left: 0, top: 80, width: 520, height: 260 },
    right: { left: 0, top: 330, width: 520, height: 260 },
  },
  filter?: ExportFilter,
) {
  const sourceCanvas =
    source instanceof HTMLCanvasElement
      ? source
      : source.toCanvasElement(1, { filter });

  return {
    left: cropCanvasToDataUrl(sourceCanvas, cropRegions.left),
    right: cropCanvasToDataUrl(sourceCanvas, cropRegions.right),
  };
}

function cropCanvasToDataUrl(
  source: HTMLCanvasElement,
  crop: {
    left: number;
    top: number;
    width: number;
    height: number;
  },
) {
  const target = document.createElement('canvas');
  target.width = crop.width;
  target.height = crop.height;
  const context = target.getContext('2d');
  if (!context) {
    return source.toDataURL('image/png');
  }

  context.drawImage(
    source,
    crop.left,
    crop.top,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return target.toDataURL('image/png');
}
