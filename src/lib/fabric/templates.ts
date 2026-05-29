import { FabricImage, Rect, Textbox, type Canvas, type FabricObject } from 'fabric';
import { useStudioStore, type StudioView } from '@/store/studioStore';
import type {
  StudioTemplateId,
  TemplateElement,
  TemplateImageElement,
  TemplateShapeElement,
  TemplateTextElement,
} from '@/types/templates';

type TemplateFabricObject = FabricObject & {
  studioObjectId?: string;
  objectRole?: 'garment' | 'guide' | 'template' | 'content';
  name?: string;
  studioElementRole?: string;
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
};

const UV_GUIDE_OPACITY = 0.12;
const UV_EDITOR_ORIENTATION = {
  flipX: false,
  flipY: false,
} as const;

export function getTemplateDefinition(templateId: StudioTemplateId | '') {
  const template = useStudioStore.getState().currentTemplate;
  if (!templateId || !template) {
    return undefined;
  }

  return template.templateId === templateId ? template : undefined;
}

export function getTemplateView(templateId: StudioTemplateId | '', view: StudioView) {
  return getTemplateDefinition(templateId)?.views?.[view];
}

export function isUvTemplate(templateId: StudioTemplateId | '') {
  return Boolean(getTemplateDefinition(templateId)?.uvLayoutImage);
}

export async function applyUvLayoutGuide(
  canvas: Canvas,
  templateId: StudioTemplateId | '',
  canvasSize: number,
  options?: {
    showGuide?: boolean;
  },
) {
  const template = getTemplateDefinition(templateId);
  if (!template?.uvLayoutImage) {
    return null;
  }

  removeGuideObjects(canvas);

  const guide = await FabricImage.fromURL(template.uvLayoutImage, {
    crossOrigin: shouldUseAnonymousCrossOrigin(template.uvLayoutImage)
      ? 'anonymous'
      : undefined,
  });
  guide.set({
    left: 0,
    top: 0,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    opacity: options?.showGuide === false ? 0 : UV_GUIDE_OPACITY,
    flipX: UV_EDITOR_ORIENTATION.flipX,
    flipY: UV_EDITOR_ORIENTATION.flipY,
  });
  guide.scaleToWidth(canvasSize);
  guide.scaleToHeight(canvasSize);
  setGuideIdentity(guide, 'uv-layout-guide');
  canvas.add(guide);
  canvas.sendObjectToBack(guide);
  console.log('uv guide transformed', {
    flipX: UV_EDITOR_ORIENTATION.flipX,
    flipY: UV_EDITOR_ORIENTATION.flipY,
    exportTransform: 'raw Fabric coordinates; no export flip',
  });

  return guide;
}

export async function applyTemplateToUvCanvas(
  canvas: Canvas,
  templateId: StudioTemplateId | '',
) {
  console.log('uv template render starts', { templateId });

  if (!isFabricCanvasReady(canvas, 'applyTemplateToUvCanvas')) {
    console.warn('uv template render skipped due to unready canvas', {
      templateId,
    });
    return;
  }

  const template = getTemplateDefinition(templateId);
  if (!template) {
    return;
  }

  removeTemplateObjects(canvas);

  for (const view of ['front', 'back', 'sleeves'] as StudioView[]) {
    const templateView = template.views?.[view];
    if (!templateView) {
      continue;
    }

    for (const element of templateView.elements) {
      await addTemplateElement(canvas, element);
    }
  }
}

export async function applyTemplateToCanvas(
  canvas: Canvas,
  templateId: StudioTemplateId | '',
  view: StudioView,
) {
  console.log('template render starts', { templateId, view });

  if (!isFabricCanvasReady(canvas, 'applyTemplateToCanvas')) {
    console.warn('template render skipped due to unready canvas', {
      templateId,
      view,
    });
    return;
  }

  const templateView = getTemplateView(templateId, view);
  if (!templateView) {
    return;
  }

  removeTemplateObjects(canvas);

  for (const element of templateView.elements) {
    await addTemplateElement(canvas, element);
  }
}

export function isFabricCanvasReady(
  canvas: Canvas | null | undefined,
  context = 'fabric canvas',
  options: { log?: boolean } = {},
) {
  const shouldLog = options.log ?? false;

  if (!canvas) {
    if (shouldLog) {
      console.warn(`${context}: canvas is missing.`);
    }
    return false;
  }

  const typedCanvas = canvas as FabricCanvasWithInternals;
  const lowerElement =
    typedCanvas.lowerCanvasEl ??
    typedCanvas.elements?.lower?.el ??
    typedCanvas.lower?.el;
  const isDisposed = Boolean(typedCanvas.disposed || typedCanvas.destroyed);

  if (shouldLog) {
    console.log(`${context}: lower canvas element exists`, Boolean(lowerElement));
  }

  if (isDisposed || !lowerElement) {
    if (shouldLog) {
      console.warn(`${context}: canvas is not ready.`, {
        isDisposed,
        hasLowerElement: Boolean(lowerElement),
      });
    }
    return false;
  }

  return true;
}

async function addTemplateElement(
  canvas: Canvas,
  element: TemplateElement,
) {
  if (element.type === 'shape') {
    canvas.add(createShapeElement(element));
    return;
  }

  if (element.type === 'image') {
    canvas.add(await createImageElement(element));
    return;
  }

  if (element.type === 'text') {
    canvas.add(createTextElement(element));
  }
}

function createShapeElement(element: TemplateShapeElement) {
  const rect = new Rect({
    left: element.left,
    top: element.top,
    width: element.width,
    height: element.height,
    fill: element.fill,
    angle: element.angle ?? 0,
    selectable: element.editable && !element.locked,
    evented: element.editable && !element.locked,
  });
  setElementIdentity(rect, element);
  return rect;
}

async function createImageElement(element: TemplateImageElement) {
  const image = await FabricImage.fromURL(element.src, {
    crossOrigin: shouldUseAnonymousCrossOrigin(element.src) ? 'anonymous' : undefined,
  });
  image.set({
    left: element.left,
    top: element.top,
    originX: 'center',
    originY: 'center',
    selectable: element.editable && !element.locked,
    evented: element.editable && !element.locked,
    cornerColor: '#2563eb',
    borderColor: '#2563eb',
    cornerStrokeColor: '#ffffff',
    transparentCorners: false,
  });
  image.scaleToWidth(element.width);
  setElementIdentity(image, element);
  return image;
}

function createTextElement(element: TemplateTextElement) {
  const textbox = new Textbox(element.text, {
    left: element.left,
    top: element.top,
    width: element.width,
    originX: 'center',
    textAlign: element.textAlign ?? 'center',
    fontSize: element.fontSize,
    fontFamily: element.fontFamily,
    fontWeight: element.fontWeight,
    fill: element.fill,
    editable: element.editable && !element.locked,
    selectable: element.editable && !element.locked,
    evented: element.editable && !element.locked,
    cornerColor: '#2563eb',
    borderColor: '#2563eb',
    cornerStrokeColor: '#ffffff',
    transparentCorners: false,
  });
  setElementIdentity(textbox, element);
  return textbox;
}

function shouldUseAnonymousCrossOrigin(src: string) {
  return /^https?:\/\//i.test(src);
}

function setElementIdentity(object: FabricObject, element: TemplateElement) {
  const typed = object as TemplateFabricObject;
  typed.studioObjectId = element.id;
  typed.objectRole = element.editable ? 'content' : 'template';
  typed.name = element.id;
  typed.studioElementRole = element.role;
}

function setGuideIdentity(object: FabricObject, objectId: string) {
  const typed = object as TemplateFabricObject;
  typed.studioObjectId = objectId;
  typed.objectRole = 'guide';
  typed.name = objectId;
}

function removeTemplateObjects(canvas: Canvas) {
  const removableObjects = canvas.getObjects().filter((object) => {
    const typed = object as TemplateFabricObject;
    return typed.objectRole === 'template';
  });

  for (const object of removableObjects) {
    canvas.remove(object);
  }
}

function removeGuideObjects(canvas: Canvas) {
  const removableObjects = canvas.getObjects().filter((object) => {
    const typed = object as TemplateFabricObject;
    return typed.objectRole === 'guide';
  });

  for (const object of removableObjects) {
    canvas.remove(object);
  }
}

