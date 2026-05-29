import { type Canvas, type FabricObject, loadSVGFromURL } from 'fabric';
import type { StudioView } from '@/store/studioStore';

type GarmentObject = FabricObject & {
  objectRole?: 'garment' | 'template' | 'content';
  studioObjectId?: string;
  name?: string;
  absolutePositioned?: boolean;
};

type FabricCanvasWithInternals = Canvas & {
  lowerCanvasEl?: HTMLCanvasElement;
  lower?: {
    el?: HTMLCanvasElement;
  };
  elements?: {
    lower?: {
      el?: HTMLCanvasElement;
    };
  };
  disposed?: boolean;
  destroyed?: boolean;
  studioClipPath?: FabricObject;
  studioSleeveClipPaths?: {
    left: FabricObject;
    right: FabricObject;
  };
};

type GarmentAsset = {
  svgUrl: string;
  targetWidth: number;
  targetHeight: number;
  centerX: number;
  centerY: number;
};

type GarmentPlacement = Omit<GarmentAsset, "svgUrl">;

const GARMENT_PLACEMENT: Record<Exclude<StudioView, "sleeves">, GarmentPlacement> = {
  front: {
    targetWidth: 418,
    targetHeight: 574,
    centerX: 260,
    centerY: 326,
  },
  back: {
    targetWidth: 418,
    targetHeight: 574,
    centerX: 260,
    centerY: 326,
  },
};

const SLEEVE_PLACEMENT: Record<"left" | "right", GarmentPlacement> = {
  left: {
    targetWidth: 300,
    targetHeight: 230,
    centerX: 260,
    centerY: 210,
  },
  right: {
    targetWidth: 300,
    targetHeight: 230,
    centerX: 260,
    centerY: 455,
  },
};

export async function applyGarmentPresentation(
  canvas: Canvas,
  view: StudioView,
  svgUrl: string,
  baseColor: string,
) {
  if (!isGarmentCanvasReady(canvas, 'applyGarmentPresentation start')) {
    return;
  }

  const garmentVisual = await loadGarmentVisual(view, svgUrl, baseColor);
  const clipPath = await loadGarmentClipPath(view, svgUrl);

  if (!isGarmentCanvasReady(canvas, 'applyGarmentPresentation after assets')) {
    return;
  }

  canvas.add(garmentVisual);
  canvas.sendObjectToBack(garmentVisual);
  (canvas as FabricCanvasWithInternals).studioClipPath = clipPath;
  const bounds = garmentVisual.getBoundingRect();
  console.log('visible garment added', {
    side: view,
    width: bounds.width,
    height: bounds.height,
    left: garmentVisual.left,
    top: garmentVisual.top,
  });
  canvas.requestRenderAll();
}

export async function applySleevesPresentation(
  canvas: Canvas,
  leftSvgUrl: string,
  rightSvgUrl: string,
  baseColor: string,
) {
  if (!isGarmentCanvasReady(canvas, 'applySleevesPresentation start')) {
    return;
  }

  const [leftVisual, rightVisual, leftClipPath, rightClipPath] = await Promise.all([
    loadGarmentObject(
      leftSvgUrl,
      SLEEVE_PLACEMENT.left,
      'leftSleeveBase',
      baseColor,
      false,
    ),
    loadGarmentObject(
      rightSvgUrl,
      SLEEVE_PLACEMENT.right,
      'rightSleeveBase',
      baseColor,
      false,
    ),
    loadGarmentObject(
      leftSvgUrl,
      SLEEVE_PLACEMENT.left,
      'leftSleeveClip',
      '#000000',
      true,
    ),
    loadGarmentObject(
      rightSvgUrl,
      SLEEVE_PLACEMENT.right,
      'rightSleeveClip',
      '#000000',
      true,
    ),
  ]);

  if (!isGarmentCanvasReady(canvas, 'applySleevesPresentation after assets')) {
    return;
  }

  canvas.add(leftVisual, rightVisual);
  canvas.sendObjectToBack(rightVisual);
  canvas.sendObjectToBack(leftVisual);
  const typedCanvas = canvas as FabricCanvasWithInternals;
  typedCanvas.studioClipPath = undefined;
  typedCanvas.studioSleeveClipPaths = {
    left: leftClipPath,
    right: rightClipPath,
  };
  console.log('visible garment added', {
    side: 'sleeves',
    left: leftVisual.getBoundingRect(),
    right: rightVisual.getBoundingRect(),
  });
  canvas.requestRenderAll();
}

export async function loadGarmentVisual(
  view: StudioView,
  svgUrl: string,
  baseColor: string,
) {
  const asset = getGarmentAsset(view, svgUrl);
  const { objects, options } = await loadSVGFromURL(asset.svgUrl);
  const svgObjects = objects.filter((object): object is FabricObject => Boolean(object));
  const garmentObject = selectPrimaryGarmentObject(
    svgObjects,
    options.width,
    options.height,
  );

  positionGarmentObject(garmentObject, view);
  const typedGarmentObject = garmentObject as GarmentObject;
  typedGarmentObject.objectRole = 'garment';
  typedGarmentObject.studioObjectId = `${view}GarmentBase`;
  typedGarmentObject.name = `${view}GarmentBase`;
  garmentObject.set({
    fill: baseColor,
    stroke: '#d1d5db',
    strokeWidth: 1,
    opacity: 1,
  });
  protectGarmentObject(garmentObject);
  console.log('garment protected', {
    objectId: typedGarmentObject.studioObjectId,
    selectable: garmentObject.selectable,
    evented: garmentObject.evented,
  });
  return garmentObject;
}

export async function loadSleevesClipPaths(
  leftSvgUrl: string,
  rightSvgUrl: string,
) {
  const [left, right] = await Promise.all([
    loadGarmentObject(
      leftSvgUrl,
      SLEEVE_PLACEMENT.left,
      'leftSleeveClip',
      '#000000',
      true,
    ),
    loadGarmentObject(
      rightSvgUrl,
      SLEEVE_PLACEMENT.right,
      'rightSleeveClip',
      '#000000',
      true,
    ),
  ]);

  return { left, right };
}

export async function loadGarmentClipPath(view: StudioView, svgUrl: string) {
  const asset = getGarmentAsset(view, svgUrl);
  const { objects, options } = await loadSVGFromURL(asset.svgUrl);
  const svgObjects = objects.filter((object): object is FabricObject => Boolean(object));
  const clipObject = selectPrimaryGarmentObject(
    svgObjects,
    options.width,
    options.height,
  );

  positionGarmentObject(clipObject, view);
  const typedClipObject = clipObject as GarmentObject;
  typedClipObject.absolutePositioned = true;
  typedClipObject.objectRole = 'garment';
  typedClipObject.studioObjectId = `${view}GarmentClip`;
  typedClipObject.name = `${view}GarmentClip`;
  clipObject.set({
    fill: '#000000',
    stroke: undefined,
    opacity: 1,
  });
  protectGarmentObject(clipObject);

  return clipObject;
}

function selectPrimaryGarmentObject(
  objects: FabricObject[],
  sourceWidth?: number,
  sourceHeight?: number,
) {
  if (objects.length === 0) {
    throw new Error('No SVG objects found for garment clip path.');
  }

  const candidates = objects.filter((object) => {
    if (!sourceWidth || !sourceHeight) {
      return true;
    }

    const bounds = object.getBoundingRect();
    const nearlyFullWidth = bounds.width >= sourceWidth * 0.94;
    const nearlyFullHeight = bounds.height >= sourceHeight * 0.94;
    return !(nearlyFullWidth && nearlyFullHeight);
  });

  const ranked = (candidates.length > 0 ? candidates : objects)
    .map((object) => {
      const bounds = object.getBoundingRect();
      return {
        object,
        area: bounds.width * bounds.height,
      };
    })
    .sort((left, right) => right.area - left.area);

  const primary = ranked[0]?.object;
  if (!primary) {
    throw new Error('No usable SVG object found for garment clip path.');
  }

  return primary;
}

function positionGarmentObject(object: FabricObject, view: StudioView) {
  const asset = getGarmentAsset(view, "");
  positionGarmentObjectWithPlacement(object, asset);
}

function positionGarmentObjectWithPlacement(
  object: FabricObject,
  placement: GarmentPlacement,
) {
  const width = object.width ?? 1;
  const height = object.height ?? 1;
  const scale = Math.min(placement.targetWidth / width, placement.targetHeight / height);

  object.set({
    left: placement.centerX,
    top: placement.centerY,
    originX: 'center',
    originY: 'center',
    scaleX: scale,
    scaleY: scale,
  });
  object.setCoords();
}

async function loadGarmentObject(
  svgUrl: string,
  placement: GarmentPlacement,
  objectId: string,
  fill: string,
  isClipPath: boolean,
) {
  const { objects, options } = await loadSVGFromURL(svgUrl);
  const svgObjects = objects.filter((object): object is FabricObject => Boolean(object));
  const garmentObject = selectPrimaryGarmentObject(
    svgObjects,
    options.width,
    options.height,
  );

  positionGarmentObjectWithPlacement(garmentObject, placement);
  const typedGarmentObject = garmentObject as GarmentObject;
  typedGarmentObject.objectRole = 'garment';
  typedGarmentObject.studioObjectId = objectId;
  typedGarmentObject.name = objectId;
  typedGarmentObject.absolutePositioned = isClipPath;
  garmentObject.set({
    fill,
    stroke: isClipPath ? undefined : '#d1d5db',
    strokeWidth: isClipPath ? 0 : 1,
    opacity: 1,
  });
  protectGarmentObject(garmentObject);
  console.log('garment protected', {
    objectId,
    selectable: garmentObject.selectable,
    evented: garmentObject.evented,
  });
  return garmentObject;
}

function protectGarmentObject(object: FabricObject) {
  object.set({
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
  });
}

function getGarmentAsset(view: StudioView, svgUrl: string): GarmentAsset {
  if (view === 'sleeves') {
    throw new Error('Sleeves use two garment assets and cannot be loaded as a single garment.');
  }

  return {
    svgUrl,
    ...GARMENT_PLACEMENT[view],
  };
}

function isGarmentCanvasReady(canvas: Canvas, context: string) {
  const typedCanvas = canvas as FabricCanvasWithInternals;
  const lowerElement =
    typedCanvas.lowerCanvasEl ??
    typedCanvas.elements?.lower?.el ??
    typedCanvas.lower?.el;
  const isDisposed = Boolean(typedCanvas.disposed || typedCanvas.destroyed);

  if (isDisposed || !lowerElement) {
    console.warn(`${context}: garment render skipped because canvas is not ready.`, {
      isDisposed,
      hasLowerElement: Boolean(lowerElement),
    });
    return false;
  }

  return true;
}
