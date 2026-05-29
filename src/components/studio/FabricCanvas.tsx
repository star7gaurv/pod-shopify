'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, Circle, FabricImage, FabricObject, Line, Rect, Textbox } from 'fabric';
import {
  useStudioStore,
  type CanvasAction,
  type StudioView,
  type UploadedAsset,
  type UvViewportFocus,
} from '@/store/studioStore';
import {
  FloatingObjectToolbar,
  type FloatingToolbarKind,
  type FloatingToolbarState,
} from '@/components/studio/FloatingObjectToolbar';
import {
  applyTemplateToCanvas,
  applyTemplateToUvCanvas,
  applyUvLayoutGuide,
  getTemplateDefinition,
  getTemplateView,
  isFabricCanvasReady,
  isUvTemplate,
} from '@/lib/fabric/templates';
import { ensureStudioFontLoaded } from "@/lib/fonts/fontLibrary";
import {
  applyGarmentPresentation,
  applySleevesPresentation,
  loadGarmentClipPath,
  loadSleevesClipPaths,
} from '@/lib/fabric/garments';
import {
  canvasElementToBlob,
  exportFabricCanvasElement,
  exportFabricCanvasDataUrl,
  exportSleevesCanvasDataUrls,
  exportUvPreviewTextureDataUrl,
} from '@/studio/uv/editorExports';
import type { StudioTemplateId } from '@/types/templates';

const LEGACY_CANVAS_WIDTH = 520;
const LEGACY_CANVAS_HEIGHT = 640;
const UV_CANVAS_SIZE = 520;

type StudioObjectId = string;
type StudioObjectRole = 'garment' | 'guide' | 'template' | 'content';

type FabricObjectWithId = FabricObject & {
  studioObjectId?: StudioObjectId;
  objectRole?: StudioObjectRole;
  name?: string;
  assetId?: string;
  assetR2Key?: string | null;
  assetUrl?: string;
  clipPath?: FabricObject;
  fill?: string;
  stroke?: string;
  fontSize?: number;
  fontFamily?: string;
  crossOrigin?: string | null;
  isEditing?: boolean;
};

type StudioCanvas = Canvas & {
  studioClipPath?: FabricObject;
  studioSleeveClipPaths?: {
    left: FabricObject;
    right: FabricObject;
  };
  wrapperEl?: HTMLDivElement;
  lowerCanvasEl?: HTMLCanvasElement;
  elements?: {
    lower?: {
      el?: HTMLCanvasElement;
    };
  };
};
type PreviewFilterObject =
  Parameters<
    NonNullable<NonNullable<Parameters<Canvas['toDataURL']>[0]>['filter']>
  >[0];

const TOOLBAR_MARGIN = 10;
const TOOLBAR_WIDTH_BY_KIND: Record<FloatingToolbarKind, number> = {
  text: 420,
  shape: 230,
  image: 180,
};

export function FabricCanvas() {
  const htmlCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const stageViewportRef = useRef<HTMLDivElement | null>(null);
  const selectedTemplate = useStudioStore((state) => state.selectedTemplate);
  const currentTemplate = useStudioStore((state) => state.currentTemplate);
  const baseColor = useStudioStore((state) => state.baseColor);
  const currentViewRef = useRef<StudioView>('front');
  const isSwitchingViewRef = useRef(false);
  const isCanvasReadyRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canvasReadyToken, setCanvasReadyToken] = useState(0);
  const [toolbar, setToolbar] = useState<FloatingToolbarState | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const canvasDisplaySize = getCanvasDisplaySize(selectedTemplate);
  const currentUvLayoutImage = currentTemplate?.uvLayoutImage || '';
  const showUvBaseFill =
    isUvTemplate(selectedTemplate as StudioTemplateId | '') &&
    Boolean(currentUvLayoutImage);

  useEffect(() => {
    const viewport = stageViewportRef.current;
    if (!viewport) {
      return;
    }

    const updateScale = () => {
      const nextScale = Math.min(1, viewport.clientWidth / LEGACY_CANVAS_WIDTH);
      setStageScale((current) =>
        Math.abs(current - nextScale) < 0.01 ? current : nextScale,
      );
    };

    updateScale();
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(updateScale);
    });
    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let isEffectActive = true;
    let frameId: number | null = null;
    isCanvasReadyRef.current = false;

    if (!htmlCanvasRef.current) {
      console.error('Canvas ref is not attached.');
      return;
    }

    const canvas = new Canvas(htmlCanvasRef.current, {
      width: LEGACY_CANVAS_WIDTH,
      height: LEGACY_CANVAS_HEIGHT,
      backgroundColor: 'rgba(0,0,0,0)',
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;
    const refreshToolbar = () => {
      setToolbar(buildToolbarState(canvas));
    };
    const refreshMovingObject = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        assignObjectClipPath(canvas, activeObject);
      }
      refreshToolbar();
    };
    const hideToolbar = () => {
      setToolbar(null);
    };
    const saveAfterObjectModified = () => {
      refreshToolbar();
      saveCanvasForView(canvas, currentViewRef.current);
    };

    canvas.on('selection:created', refreshToolbar);
    canvas.on('selection:updated', refreshToolbar);
    canvas.on('selection:cleared', hideToolbar);
    canvas.on('mouse:down', () => {
      discardProtectedActiveObject(canvas);
    });
    canvas.on('object:moving', refreshMovingObject);
    canvas.on('object:scaling', refreshMovingObject);
    canvas.on('object:rotating', refreshMovingObject);
    canvas.on('object:modified', saveAfterObjectModified);

    console.log('canvas initialized');
    console.log('canvas width/height', canvas.getWidth(), canvas.getHeight());
    console.log('canvas.getObjects()', canvas.getObjects());
    console.log('canvas lower element exists', isFabricCanvasReady(canvas));

    const markReadyWhenMounted = (attempt = 0) => {
      if (!isEffectActive) {
        return;
      }

      if (isFabricCanvasReady(canvas, 'FabricCanvas readiness', { log: attempt === 0 })) {
        isCanvasReadyRef.current = true;
        setCanvasReadyToken((token) => token + 1);
        console.log('Fabric canvas ready');
        return;
      }

      if (attempt >= 10) {
        console.warn('Fabric canvas did not become ready after mount.');
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        markReadyWhenMounted(attempt + 1);
      });
    };

    markReadyWhenMounted();

    return () => {
      isEffectActive = false;
      isCanvasReadyRef.current = false;
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      canvas.off('selection:created', refreshToolbar);
      canvas.off('selection:updated', refreshToolbar);
      canvas.off('selection:cleared', hideToolbar);
      canvas.off('mouse:down');
      canvas.off('object:moving', refreshMovingObject);
      canvas.off('object:scaling', refreshMovingObject);
      canvas.off('object:rotating', refreshMovingObject);
      canvas.off('object:modified', saveAfterObjectModified);
      canvas.dispose();
      fabricCanvasRef.current = null;
      setToolbar(null);
    };
  }, []);

  useEffect(() => {
    const handleDeleteKey = (event: KeyboardEvent) => {
      if (isTypingInFormControl(event.target)) {
        return;
      }

      const canvas = fabricCanvasRef.current;
      if (!canvas || !isCanvasReadyRef.current) {
        return;
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      const activeObject = canvas.getActiveObject();
      if (!activeObject || !isDeletableObject(activeObject)) {
        return;
      }

      if ('isEditing' in activeObject && activeObject.isEditing) {
        return;
      }

      event.preventDefault();
      deleteSelectedObject(canvas);
    };

    window.addEventListener('keydown', handleDeleteKey);
    return () => {
      window.removeEventListener('keydown', handleDeleteKey);
    };
  }, []);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvasReadyToken === 0 || !canvas || !isCanvasReadyRef.current) {
      return;
    }

    const state = useStudioStore.getState();
    currentViewRef.current = state.activeView;

    if (!state.selectedTemplate) {
      console.log('STEP 0: ready render skipped, no selected template');
      initializeBlankCanvas(canvas);
      return;
    }

    console.log('STEP 7: AFTER render triggered', {
      token: canvasReadyToken,
      view: state.activeView,
      template: state.selectedTemplate,
    });

    void loadViewIntoCanvas(canvas, state.activeView, state)
      .then(async () => {
        if (!isCanvasReadyRef.current || !isFabricCanvasReady(canvas)) {
          return;
        }

        saveCanvasForView(canvas, state.activeView);
        await publishAllPreviewTextures(state);
      })
      .catch((error) => {
        console.error('Fabric ready render failed:', error);
        useStudioStore
          .getState()
          .failStudioPreparation(
            error instanceof Error ? error.message : 'Unknown Fabric error',
          );
        setErrorMessage(
          error instanceof Error ? error.message : 'Unknown Fabric error',
        );
      });
  }, [canvasReadyToken]);

  useEffect(() => {
    const store = useStudioStore.getState();

    store.setExportHandlers({
      exportDesign: () => {
        void exportDesignZip();
      },
      prepareDesignSave: async () => {
        const currentCanvas = fabricCanvasRef.current;
        if (!currentCanvas || !isFabricCanvasReady(currentCanvas, 'prepareDesignSave')) {
          return;
        }

        saveCanvasForView(currentCanvas, currentViewRef.current);
        publishPreviewTextures(currentCanvas, currentViewRef.current);

        const currentState = useStudioStore.getState();
        await publishAllPreviewTextures(currentState);
      },
    });

    return () => {
      useStudioStore.getState().setExportHandlers({
        exportDesign: null,
        prepareDesignSave: null,
      });
    };
  }, []);

  useEffect(() => {
    const unsubscribe = useStudioStore.subscribe((state, previousState) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      if (!isCanvasReadyRef.current || !isFabricCanvasReady(canvas)) return;

      if (state.activeView !== previousState.activeView) {
        void switchCanvasView(canvas, previousState.activeView, state.activeView);
        return;
      }

      if (isSwitchingViewRef.current) {
        return;
      }

      if (state.selectedTemplate !== previousState.selectedTemplate) {
        saveCanvasForView(canvas, state.activeView);
        void rebuildCurrentView(canvas, state)
          .then(async () => {
            console.log(`template applied: ${state.selectedTemplate}`);
            saveCanvasForView(canvas, state.activeView);
            await publishAllPreviewTextures(state);
          })
          .catch((error) => {
            console.error('Template rebuild failed:', error);
            useStudioStore
              .getState()
              .failStudioPreparation(
                error instanceof Error ? error.message : 'Unknown Fabric error',
              );
            setErrorMessage(
              error instanceof Error ? error.message : 'Unknown Fabric error',
            );
          });
        return;
      }

      if (state.uvViewportFocus !== previousState.uvViewportFocus) {
        applyUvViewportFocus(
          canvas,
          state.selectedTemplate as StudioTemplateId | '',
          state.uvViewportFocus,
        );
        return;
      }

      if (state.showUvGuide !== previousState.showUvGuide) {
        applyUvGuideVisibility(canvas, state.showUvGuide);
        return;
      }

      if (state.baseColor !== previousState.baseColor) {
        updateGarmentBaseColor(canvas, state.baseColor);
        canvas.renderAll();
        publishPreviewTextures(canvas, state.activeView);
        void publishAllPreviewTextures(state);
      }

      if (state.canvasAction && state.canvasAction.id !== previousState.canvasAction?.id) {
        void handleCanvasAction(canvas, state.canvasAction, state.activeView).then(() => {
          saveCanvasForView(canvas, state.activeView);
        });
      }

      // Upload selection is now generic: files are added to the upload gallery
      // first, then explicitly placed with a canvas action when clicked.
    });

    return unsubscribe;
  }, []);

  return (
    <div className="flex w-full flex-col items-center">
      {errorMessage ? (
        <div className="mb-3 rounded-lg border border-red-400/40 bg-red-950/70 px-4 py-2 text-sm text-red-100">
          {errorMessage}
        </div>
      ) : null}

      <div
        ref={stageViewportRef}
        className="relative mx-auto w-full max-w-[520px]"
        style={{ height: LEGACY_CANVAS_HEIGHT * stageScale }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: LEGACY_CANVAS_WIDTH,
            height: LEGACY_CANVAS_HEIGHT,
            transform: `scale(${stageScale})`,
          }}
        >
          <FloatingObjectToolbar
            toolbar={toolbar}
            onChangeFill={handleToolbarFillChange}
            onChangeFontSize={handleToolbarFontSizeChange}
            onChangeFontFamily={handleToolbarFontFamilyChange}
            onDuplicate={handleToolbarDuplicate}
            onDelete={handleToolbarDelete}
          />
          <div
            className="relative mx-auto overflow-hidden rounded-[24px] border border-slate-700/70 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.14),rgba(2,6,23,0.9))] shadow-[0_24px_60px_rgba(2,6,23,0.45)] sm:rounded-[32px]"
            style={{
              width: canvasDisplaySize.width,
              height: canvasDisplaySize.height,
              marginTop:
                (LEGACY_CANVAS_HEIGHT - canvasDisplaySize.height) / 2,
            }}
          >
            {showUvBaseFill ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundColor: baseColor,
                  maskImage: `url(${currentUvLayoutImage})`,
                  maskSize: '100% 100%',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  maskMode: 'alpha',
                  WebkitMaskImage: `url(${currentUvLayoutImage})`,
                  WebkitMaskSize: '100% 100%',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                }}
              />
            ) : null}
            <canvas ref={htmlCanvasRef} className="relative z-10" />
          </div>
        </div>
      </div>
    </div>
  );

  function updateToolbarFromSelection(canvas: Canvas) {
    setToolbar(buildToolbarState(canvas));
  }

  function handleToolbarFillChange(value: string) {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    if (!canvas || !activeObject || !isDeletableObject(activeObject)) {
      return;
    }

    if (activeObject.type === 'line') {
      activeObject.set({ stroke: value });
    } else {
      activeObject.set({ fill: value });
    }

    activeObject.setCoords();
    canvas.renderAll();
    updateToolbarFromSelection(canvas);
    saveCanvasForView(canvas, currentViewRef.current);
  }

  function handleToolbarFontSizeChange(value: number) {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject() as FabricObjectWithId | undefined;
    if (!canvas || !activeObject || getToolbarKind(activeObject) !== 'text' || !Number.isFinite(value)) {
      return;
    }

    activeObject.set({ fontSize: Math.max(8, Math.min(220, value)) });
    activeObject.setCoords();
    canvas.renderAll();
    updateToolbarFromSelection(canvas);
    saveCanvasForView(canvas, currentViewRef.current);
  }

  async function handleToolbarFontFamilyChange(value: string) {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject() as FabricObjectWithId | undefined;
    if (!canvas || !activeObject || getToolbarKind(activeObject) !== 'text') {
      return;
    }

    await ensureStudioFontLoaded(value);
    activeObject.set({ fontFamily: value });
    activeObject.setCoords();
    canvas.renderAll();
    updateToolbarFromSelection(canvas);
    saveCanvasForView(canvas, currentViewRef.current);
  }

  function handleToolbarDuplicate() {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    void duplicateSelectedObject(canvas);
  }

  function handleToolbarDelete() {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    deleteSelectedObject(canvas);
  }

  async function switchCanvasView(
    canvas: Canvas,
    previousView: StudioView,
    nextView: StudioView,
  ) {
    isSwitchingViewRef.current = true;

    try {
      const beforeSaveState = useStudioStore.getState();
      const isUvMode = isUvTemplate(
        beforeSaveState.selectedTemplate as StudioTemplateId | '',
      );
      console.log(`switching to ${nextView}`);
      console.log('front content exists before rebuild', Boolean(beforeSaveState.frontCanvasJson));
      console.log('back content exists before rebuild', Boolean(beforeSaveState.backCanvasJson));
      console.log('sleeves content exists before rebuild', Boolean(beforeSaveState.sleevesCanvasJson));

      saveCanvasForView(canvas, previousView);

      if (isUvMode) {
        currentViewRef.current = nextView;
        applyUvViewportFocus(
          canvas,
          beforeSaveState.selectedTemplate as StudioTemplateId | '',
          beforeSaveState.uvViewportFocus,
        );
        canvas.renderAll();
        publishPreviewTextures(canvas, nextView);
        return;
      }

      const nextState = useStudioStore.getState();
      await loadViewIntoCanvas(canvas, nextView, nextState);

      currentViewRef.current = nextView;
      if (isFabricCanvasReady(canvas, 'switchCanvasView render')) {
        canvas.renderAll();
        saveCanvasForView(canvas, nextView);
      }
    } finally {
      isSwitchingViewRef.current = false;
    }
  }

  async function exportDesignZip() {
    const currentCanvas = fabricCanvasRef.current;
    if (!currentCanvas) {
      console.warn('Cannot export design: canvas is not ready.');
      return;
    }

    if (!isFabricCanvasReady(currentCanvas, 'exportDesignZip')) {
      console.warn('Cannot export design: Fabric canvas is not ready.');
      return;
    }

    saveCanvasForView(currentCanvas, currentViewRef.current);
    const state = useStudioStore.getState();
    if (!state.selectedTemplate) {
      console.warn('Cannot export design: no template is selected.');
      return;
    }

    const [{ default: JSZip }] = await Promise.all([import('jszip')]);
    const zip = new JSZip();
    const template = getTemplateDefinition(
      state.selectedTemplate as StudioTemplateId | '',
    );
    const selectedProduct = useStudioStore
      .getState()
      .products.find((product) => product.id === state.selectedProduct);
    const selectedMaterial =
      template?.materials?.find(
        (material) => material.id === useStudioStore.getState().selectedMaterialId,
      ) ?? template?.materials?.[0];
    const finalPrice = selectedMaterial?.price ?? template?.basePrice;
    const designJson = getCanvasJsonForView(state, currentViewRef.current) ?? '{"objects":[]}';
    const previewCanvas = await buildDesignPreviewCanvas(
      currentCanvas,
      template?.uvLayoutImage,
      state.baseColor,
    );
    const previewBlob = await canvasElementToBlob(previewCanvas);

    zip.file('design-preview.png', previewBlob);
    zip.file('design.json', JSON.stringify(JSON.parse(designJson), null, 2));

    const usedAssets = getUsedUploadedAssets(currentCanvas, state.uploadedAssets);
    const assetsFolder = zip.folder('assets');
    if (assetsFolder) {
      for (const [index, asset] of usedAssets.entries()) {
        const assetBlob = await uploadedImageUrlToBlob(asset.url);
        assetsFolder.file(getAssetFileName(asset, index), assetBlob);
      }
    }

    zip.file(
      'design-info.txt',
      [
        `Product: ${selectedProduct?.name ?? (state.selectedProduct || 'Unknown product')}`,
        `Template: ${template?.templateName ?? state.selectedTemplate}`,
        `Base Color: ${state.baseColor}`,
        ...(typeof template?.basePrice === 'number'
          ? [`Base Price: $${template.basePrice}`]
          : []),
        ...(selectedMaterial
          ? [
              `Selected Material: ${selectedMaterial.name}`,
              `Material ID: ${selectedMaterial.id}`,
              `Material Price: $${selectedMaterial.price}`,
            ]
          : []),
        ...(typeof finalPrice === 'number'
          ? [`Final Price: $${finalPrice}`]
          : []),
        `Exported At: ${new Date().toLocaleString()}`,
        '',
        'design-preview.png contains the current UV design preview for manufacturing review.',
      ].join('\n'),
    );

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
    });
    triggerBlobDownload(
      zipBlob,
      `design-export-${formatTimestampForFileName(new Date())}.zip`,
    );
  }
}

async function buildDesignPreviewCanvas(
  canvas: Canvas,
  uvLayoutImageUrl: string | undefined,
  baseColor: string,
) {
  const multiplier = 2;
  const width = canvas.getWidth() * multiplier;
  const height = canvas.getHeight() * multiplier;
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = width;
  previewCanvas.height = height;
  const previewContext = previewCanvas.getContext('2d');

  if (!previewContext) {
    return previewCanvas;
  }

  previewContext.fillStyle = '#02060b';
  previewContext.fillRect(0, 0, width, height);

  const maskImage = uvLayoutImageUrl
    ? await loadImageElement(uvLayoutImageUrl)
    : null;

  if (maskImage) {
    const fillLayer = document.createElement('canvas');
    fillLayer.width = width;
    fillLayer.height = height;
    const fillContext = fillLayer.getContext('2d');

    if (fillContext) {
      fillContext.fillStyle = baseColor;
      fillContext.fillRect(0, 0, width, height);
      fillContext.globalCompositeOperation = 'destination-in';
      fillContext.drawImage(maskImage, 0, 0, width, height);
      previewContext.drawImage(fillLayer, 0, 0);
    }
  }

  const artworkLayer = exportFabricCanvasElement(canvas, { multiplier });
  if (maskImage) {
    const artworkContext = artworkLayer.getContext('2d');
    if (artworkContext) {
      artworkContext.globalCompositeOperation = 'destination-in';
      artworkContext.drawImage(maskImage, 0, 0, width, height);
    }
  }
  previewContext.drawImage(artworkLayer, 0, 0);

  return previewCanvas;
}

function getUsedUploadedAssets(
  canvas: Canvas,
  uploadedAssets: UploadedAsset[],
) {
  const usedUrls = new Set<string>();

  for (const object of canvas.getObjects()) {
    const typed = object as FabricObjectWithId & {
      getSrc?: () => string;
      src?: string;
      toObject: (propertiesToInclude?: string[]) => Record<string, unknown>;
    };

    if (typed.objectRole !== 'content' || object.type !== 'image') {
      continue;
    }

    const directSrc = typed.getSrc?.() ?? typed.src;
    if (typeof directSrc === 'string' && directSrc.length > 0) {
      usedUrls.add(directSrc);
      continue;
    }

    const serialized = typed.toObject(['src']);
    if (typeof serialized.src === 'string' && serialized.src.length > 0) {
      usedUrls.add(serialized.src);
    }
  }

  console.log('used uploaded assets detected for export', {
    imageObjects: Array.from(usedUrls),
    uploadedAssets: uploadedAssets.map((asset) => asset.url),
  });

  return uploadedAssets.filter((asset) => usedUrls.has(asset.url));
}

function getAssetFileName(asset: UploadedAsset, index: number) {
  const safeBaseName = sanitizeFileName(removeFileExtension(asset.name)) || `asset-${index + 1}`;
  const extension =
    getFileExtension(asset.name) ||
    getExtensionFromMimeType(asset.type) ||
    getExtensionFromDataUrl(asset.url) ||
    'png';

  return `${safeBaseName}.${extension}`;
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getFileExtension(fileName: string) {
  const match = fileName.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase();
}

function removeFileExtension(fileName: string) {
  return fileName.replace(/\.[a-z0-9]+$/i, '');
}

function getExtensionFromMimeType(mimeType: string) {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('svg')) return 'svg';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('webp')) return 'webp';
  return null;
}

function getExtensionFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/([a-z0-9.+-]+);/i);
  const subtype = match?.[1]?.toLowerCase();
  if (!subtype) {
    return null;
  }

  if (subtype === 'jpeg') return 'jpg';
  if (subtype === 'svg+xml') return 'svg';
  return subtype;
}

function dataUrlToBlob(dataUrl: string) {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.match(/data:([^;]+);base64/i)?.[1] ?? 'application/octet-stream';
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

async function uploadedImageUrlToBlob(url: string) {
  if (url.startsWith('data:')) {
    return dataUrlToBlob(url);
  }

  const response = await fetch(url, {
    mode: 'cors',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch uploaded image: ${url}`);
  }

  return response.blob();
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

function formatTimestampForFileName(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (shouldUseAnonymousCrossOrigin(src)) {
      image.crossOrigin = 'anonymous';
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function shouldUseAnonymousCrossOrigin(src: string) {
  return /^https?:\/\//i.test(src);
}

async function handleCanvasAction(
  canvas: Canvas,
  action: CanvasAction,
  view: StudioView,
) {
  if (action.type === 'addImage') {
    await addImageObject(canvas, action.asset, view);
    return;
  }

  if (action.type === 'addText') {
    addFreeTextObject(canvas, view);
    return;
  }

  if (action.type === 'addRectangle') {
    addRectangleObject(canvas, view);
    return;
  }

  if (action.type === 'addCircle') {
    addCircleObject(canvas, view);
    return;
  }

  if (action.type === 'addLine') {
    addLineObject(canvas, view);
  }
}

async function addImageObject(
  canvas: Canvas,
  asset: UploadedAsset,
  view: StudioView,
) {
  const image = await FabricImage.fromURL(asset.url, {
    crossOrigin: shouldUseAnonymousCrossOrigin(asset.url) ? 'anonymous' : undefined,
  });
  const point = getDefaultInsertionPoint(view);
  image.set({
    left: point.left,
    top: point.top,
    originX: 'center',
    originY: 'center',
    cornerColor: '#2563eb',
    borderColor: '#2563eb',
    cornerStrokeColor: '#ffffff',
    transparentCorners: false,
    crossOrigin: shouldUseAnonymousCrossOrigin(asset.url) ? 'anonymous' : undefined,
  });
  image.scaleToWidth(120);
  setGenericContentIdentity(image, `uploadedImage-${view}-${Date.now()}`, asset.name);
  const typed = image as FabricObjectWithId;
  typed.assetId = asset.id;
  typed.assetR2Key = asset.r2Key ?? null;
  typed.assetUrl = asset.url;
  assignObjectClipPath(canvas, image);
  canvas.add(image);
  canvas.setActiveObject(image);
  applySceneLayerOrder(canvas);
  canvas.requestRenderAll();
}

function addFreeTextObject(canvas: Canvas, view: StudioView) {
  const point = getDefaultInsertionPoint(view);
  const textbox = new Textbox('Double click to edit', {
    left: point.left,
    top: point.top,
    width: 260,
    originX: 'center',
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '700',
    fill: '#111827',
    editable: true,
    cornerColor: '#2563eb',
    borderColor: '#2563eb',
    cornerStrokeColor: '#ffffff',
    transparentCorners: false,
  });
  setGenericContentIdentity(textbox, `text-${view}-${Date.now()}`, 'Text');
  assignObjectClipPath(canvas, textbox);
  canvas.add(textbox);
  canvas.setActiveObject(textbox);
  applySceneLayerOrder(canvas);
  canvas.requestRenderAll();
}

function addRectangleObject(canvas: Canvas, view: StudioView) {
  const point = getDefaultInsertionPoint(view);
  const rect = new Rect({
    left: point.left,
    top: point.top,
    width: 160,
    height: 90,
    originX: 'center',
    originY: 'center',
    fill: '#dc2626',
    opacity: 0.86,
    cornerColor: '#2563eb',
    borderColor: '#2563eb',
    cornerStrokeColor: '#ffffff',
    transparentCorners: false,
  });
  setGenericContentIdentity(rect, `rectangle-${view}-${Date.now()}`, 'Rectangle');
  assignObjectClipPath(canvas, rect);
  canvas.add(rect);
  canvas.setActiveObject(rect);
  applySceneLayerOrder(canvas);
  canvas.requestRenderAll();
}

function addCircleObject(canvas: Canvas, view: StudioView) {
  const point = getDefaultInsertionPoint(view);
  const circle = new Circle({
    left: point.left,
    top: point.top,
    radius: 52,
    originX: 'center',
    originY: 'center',
    fill: '#facc15',
    opacity: 0.9,
    cornerColor: '#2563eb',
    borderColor: '#2563eb',
    cornerStrokeColor: '#ffffff',
    transparentCorners: false,
  });
  setGenericContentIdentity(circle, `circle-${view}-${Date.now()}`, 'Circle');
  assignObjectClipPath(canvas, circle);
  canvas.add(circle);
  canvas.setActiveObject(circle);
  applySceneLayerOrder(canvas);
  canvas.requestRenderAll();
}

function addLineObject(canvas: Canvas, view: StudioView) {
  const point = getDefaultInsertionPoint(view);
  const line = new Line(
    [point.left - 70, point.top, point.left + 70, point.top],
    {
      stroke: '#111827',
      strokeWidth: 8,
      strokeLineCap: 'round',
      cornerColor: '#2563eb',
      borderColor: '#2563eb',
      cornerStrokeColor: '#ffffff',
      transparentCorners: false,
    },
  );
  setGenericContentIdentity(line, `line-${view}-${Date.now()}`, 'Line');
  assignObjectClipPath(canvas, line);
  canvas.add(line);
  canvas.setActiveObject(line);
  applySceneLayerOrder(canvas);
  canvas.requestRenderAll();
}

function initializeBlankCanvas(canvas: Canvas) {
  if (!isFabricCanvasReady(canvas, 'initializeBlankCanvas')) {
    return false;
  }

  const { width, height } = getCanvasDimensions(
    useStudioStore.getState().selectedTemplate,
  );
  canvas.clear();
  clearUvVisualMask(canvas);
  resetUvViewportFocus(canvas);
  (canvas as StudioCanvas).studioClipPath = undefined;
  (canvas as StudioCanvas).studioSleeveClipPaths = undefined;
  canvas.setDimensions({ width, height });
  canvas.backgroundColor = 'rgba(0,0,0,0)';
  canvas.renderAll();
  return true;
}

function saveCanvasForView(canvas: Canvas, view: StudioView) {
  if (!isFabricCanvasReady(canvas, 'saveCanvasForView')) {
    return;
  }

  const isUvMode = isUvTemplate(
    useStudioStore.getState().selectedTemplate as StudioTemplateId | '',
  );
  const contentObjects = canvas
    .getObjects()
    .filter((object) => {
      const typed = object as FabricObjectWithId;
      return typed.objectRole === 'content';
    })
    .map((object) => {
      const typed = object as FabricObjectWithId;
      const originalClipPath = object.clipPath;

      if (originalClipPath) {
        object.set('clipPath', undefined);
      }

      const serializedObject = object.toObject([
        'studioObjectId',
        'objectRole',
        'name',
        'assetId',
        'assetR2Key',
        'assetUrl',
        'crossOrigin',
        'src',
      ]);

      if (originalClipPath) {
        object.set('clipPath', originalClipPath);
      }

      return {
        ...serializedObject,
        studioObjectId: typed.studioObjectId,
        objectRole: typed.objectRole,
        name: typed.name,
      };
    });

  const json = JSON.stringify({ objects: contentObjects });
  const store = useStudioStore.getState();
  if (isUvMode) {
    store.setCanvasJson('front', json);
    store.setCanvasJson('back', json);
    store.setCanvasJson('sleeves', json);
  } else {
    store.setCanvasJson(view, json);
  }
  publishPreviewTextures(canvas, view);
  console.log(`saved ${view} canvas`, {
    objects: contentObjects.length,
  });
}

function setGenericContentIdentity(
  object: FabricObject,
  objectId: string,
  objectName: string,
) {
  const typed = object as FabricObjectWithId;
  typed.studioObjectId = objectId;
  typed.objectRole = 'content';
  typed.name = objectName;
  moveRotateControlToBottom(object);
}

function isDeletableObject(object: FabricObject) {
  const typed = object as FabricObjectWithId;
  return typed.objectRole === 'content';
}

function isProtectedObject(object: FabricObject) {
  const typed = object as FabricObjectWithId;
  return typed.objectRole === 'garment' || typed.objectRole === 'guide';
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

function protectSystemObjects(canvas: Canvas) {
  for (const object of canvas.getObjects()) {
    if (isProtectedObject(object)) {
      protectGarmentObject(object);
    }
  }
}

function discardProtectedActiveObject(canvas: Canvas) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject || !isProtectedObject(activeObject)) {
    return;
  }

  protectGarmentObject(activeObject);
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}

function buildToolbarState(canvas: Canvas): FloatingToolbarState | null {
  const activeObject = canvas.getActiveObject();
  if (!activeObject || isProtectedObject(activeObject) || !isDeletableObject(activeObject)) {
    return null;
  }

  const kind = getToolbarKind(activeObject);
  if (!kind) {
    return null;
  }

  moveRotateControlToBottom(activeObject);
  const bounds = activeObject.getBoundingRect();
  const typed = activeObject as FabricObjectWithId;
  const fill = kind === 'shape' && activeObject.type === 'line'
    ? normalizeColor(typed.stroke)
    : normalizeColor(typed.fill);
  const canvasTopOffset = Math.max(0, (LEGACY_CANVAS_HEIGHT - canvas.getHeight()) / 2);
  const toolbarWidth = TOOLBAR_WIDTH_BY_KIND[kind];
  const centeredLeft = bounds.left + bounds.width / 2;
  const minCenter = toolbarWidth / 2 + TOOLBAR_MARGIN;
  const maxCenter = LEGACY_CANVAS_WIDTH - toolbarWidth / 2 - TOOLBAR_MARGIN;
  const clampedLeft = Math.min(Math.max(centeredLeft, minCenter), maxCenter);
  const preferredTop = canvasTopOffset + bounds.top - 54;
  const belowTop = canvasTopOffset + bounds.top + bounds.height + 14;
  const top = preferredTop < TOOLBAR_MARGIN ? belowTop : preferredTop;

  return {
    visible: true,
    kind,
    left: clampedLeft,
    top,
    fill,
    fontSize: Math.round(typed.fontSize ?? 34),
    fontFamily: typed.fontFamily ?? 'Arial',
  };
}

function isTypingInFormControl(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

function getToolbarKind(object: FabricObject): FloatingToolbarKind | null {
  if (!isDeletableObject(object)) {
    return null;
  }

  if (object.type === 'textbox' || object.type === 'i-text' || object.type === 'text') {
    return 'text';
  }

  if (object.type === 'image') {
    return 'image';
  }

  if (object.type === 'rect' || object.type === 'circle' || object.type === 'line') {
    return 'shape';
  }

  return null;
}

function normalizeColor(value: unknown) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : '#111827';
}

async function duplicateSelectedObject(canvas: Canvas) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject || !isDeletableObject(activeObject)) {
    return;
  }

  const clone = await activeObject.clone();
  const clonedObject = clone as FabricObject;
  const typedSource = activeObject as FabricObjectWithId;

  clonedObject.set({
    left: (activeObject.left ?? 0) + 24,
    top: (activeObject.top ?? 0) + 24,
    evented: true,
    selectable: true,
  });
  clonedObject.setCoords();

  setGenericContentIdentity(
    clonedObject,
    `${typedSource.studioObjectId ?? activeObject.type}-copy-${Date.now()}`,
    `${typedSource.name ?? activeObject.type ?? 'Object'} copy`,
  );
  assignObjectClipPath(canvas, clonedObject);
  canvas.add(clonedObject);
  canvas.setActiveObject(clonedObject);
  applySceneLayerOrder(canvas);
  canvas.requestRenderAll();
  saveCanvasForView(canvas, currentStudioView());
}

function deleteSelectedObject(canvas: Canvas) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject || !isDeletableObject(activeObject)) {
    return;
  }

  canvas.remove(activeObject);
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  saveCanvasForView(canvas, currentStudioView());
  console.log('deleted selected object', {
    name: (activeObject as FabricObjectWithId).name,
    studioObjectId: (activeObject as FabricObjectWithId).studioObjectId,
  });
}

function currentStudioView() {
  return useStudioStore.getState().activeView;
}

function getCanvasDimensions(templateId: string | '') {
  return isUvTemplate(templateId as StudioTemplateId | '')
    ? { width: UV_CANVAS_SIZE, height: UV_CANVAS_SIZE }
    : { width: LEGACY_CANVAS_WIDTH, height: LEGACY_CANVAS_HEIGHT };
}

function getCanvasDisplaySize(templateId: string | '') {
  return getCanvasDimensions(templateId);
}

function applyUvViewportFocus(
  canvas: Canvas,
  templateId: StudioTemplateId | '',
  focus: UvViewportFocus,
) {
  void templateId;
  void focus;
  resetUvViewportFocus(canvas);
}

function resetUvViewportFocus(canvas: Canvas) {
  const typedCanvas = canvas as StudioCanvas;
  const wrapper = typedCanvas.wrapperEl;
  if (!wrapper) {
    return;
  }

  wrapper.style.transformOrigin = '0 0';
  wrapper.style.transform = 'translate3d(0, 0, 0) scale(1)';
  wrapper.style.transition = 'transform 220ms ease';
}

function applyUvGuideVisibility(canvas: Canvas, showGuide: boolean) {
  for (const object of canvas.getObjects()) {
    const typed = object as FabricObjectWithId;
    if (typed.objectRole === 'guide') {
      object.set({ opacity: showGuide ? 0.12 : 0 });
    }
  }

  canvas.requestRenderAll();
}

function applyUvVisualMask(canvas: Canvas, uvLayoutImageUrl?: string) {
  const typedCanvas = canvas as StudioCanvas;
  const lowerCanvas = typedCanvas.lowerCanvasEl ?? typedCanvas.elements?.lower?.el;
  if (!lowerCanvas) {
    return;
  }

  if (!uvLayoutImageUrl) {
    clearUvVisualMask(canvas);
    return;
  }

  lowerCanvas.style.maskImage = `url(${uvLayoutImageUrl})`;
  lowerCanvas.style.maskSize = '100% 100%';
  lowerCanvas.style.maskRepeat = 'no-repeat';
  lowerCanvas.style.maskPosition = 'center';
  lowerCanvas.style.maskMode = 'alpha';
  lowerCanvas.style.webkitMaskImage = `url(${uvLayoutImageUrl})`;
  lowerCanvas.style.webkitMaskSize = '100% 100%';
  lowerCanvas.style.webkitMaskRepeat = 'no-repeat';
  lowerCanvas.style.webkitMaskPosition = 'center';
}

function clearUvVisualMask(canvas: Canvas) {
  const typedCanvas = canvas as StudioCanvas;
  const lowerCanvas = typedCanvas.lowerCanvasEl ?? typedCanvas.elements?.lower?.el;
  if (!lowerCanvas) {
    return;
  }

  lowerCanvas.style.maskImage = 'none';
  lowerCanvas.style.maskSize = '';
  lowerCanvas.style.maskRepeat = '';
  lowerCanvas.style.maskPosition = '';
  lowerCanvas.style.maskMode = '';
  lowerCanvas.style.webkitMaskImage = 'none';
  lowerCanvas.style.webkitMaskSize = '';
  lowerCanvas.style.webkitMaskRepeat = '';
  lowerCanvas.style.webkitMaskPosition = '';
}

function logLoadedObjects(canvas: Canvas, phase: string) {
  for (const object of canvas.getObjects()) {
    const typed = object as FabricObjectWithId & { text?: string };
    console.log(`loaded object ${phase}`, {
      type: object.type,
      name: typed.name,
      studioObjectId: typed.studioObjectId,
      objectRole: typed.objectRole,
      text: typed.text,
    });
  }
}

async function rebuildCurrentView(
  canvas: Canvas,
  state: {
    selectedTemplate: string;
    activeView: StudioView;
    uvViewportFocus: UvViewportFocus;
    showUvGuide: boolean;
    baseColor: string;
    frontCanvasJson: string | null;
    backCanvasJson: string | null;
    sleevesCanvasJson: string | null;
  },
) {
  await loadViewIntoCanvas(canvas, state.activeView, state);
  canvas.renderAll();
}

async function loadViewIntoCanvas(
  canvas: Canvas,
  view: StudioView,
  state: {
    selectedTemplate: string;
    uvViewportFocus: UvViewportFocus;
    showUvGuide: boolean;
    baseColor: string;
    frontCanvasJson: string | null;
    backCanvasJson: string | null;
    sleevesCanvasJson: string | null;
  },
) {
  if (!isFabricCanvasReady(canvas, 'loadViewIntoCanvas')) {
    return;
  }

  console.log('STEP 1: start rebuild', {
    view,
    template: state.selectedTemplate,
    frontJson: Boolean(state.frontCanvasJson),
    backJson: Boolean(state.backCanvasJson),
    sleevesJson: Boolean(state.sleevesCanvasJson),
  });

  const template = getTemplateDefinition(
    state.selectedTemplate as StudioTemplateId | "",
  );

  if (!template) {
    initializeBlankCanvas(canvas);
    return;
  }

  if (!initializeBlankCanvas(canvas)) {
    return;
  }
  console.log('STEP 2: blank init');

  const isUvMode = Boolean(template.uvLayoutImage);

  if (isUvMode) {
    await applyUvLayoutGuide(
      canvas,
      state.selectedTemplate as StudioTemplateId | '',
      UV_CANVAS_SIZE,
      { showGuide: state.showUvGuide },
    );
    await applyTemplateToUvCanvas(
      canvas,
      state.selectedTemplate as StudioTemplateId | '',
    );
    protectSystemObjects(canvas);

    const sceneObjects = canvas
      .getObjects()
      .filter((object) => {
        const typed = object as FabricObjectWithId;
        return typed.objectRole !== 'content';
      })
      .map((object) => object.toObject(['studioObjectId', 'objectRole', 'name']));

    const json = getCanvasJsonForView(state, view);
    if (json) {
      await loadContentJsonIntoCanvas(
        canvas,
        json,
        sceneObjects,
        view,
        template.uvLayoutImage!,
      );
      console.log(`loaded ${view} uv canvas`);
    } else {
      console.log(`initialized blank ${view} uv canvas`);
    }

    applyUvGuideVisibility(canvas, state.showUvGuide);
    applyUvVisualMask(canvas, template.uvLayoutImage);
    applyUvViewportFocus(
      canvas,
      state.selectedTemplate as StudioTemplateId | '',
      state.uvViewportFocus,
    );
    canvas.renderAll();
    return;
  }

  const templateView = getTemplateView(
    state.selectedTemplate as StudioTemplateId | "",
    view,
  );

  if (!templateView || !template.garment) {
    initializeBlankCanvas(canvas);
    return;
  }

  if (view === 'sleeves') {
    await applySleevesPresentation(
      canvas,
      template.garment.sleeveLeftSvg,
      template.garment.sleeveRightSvg,
      state.baseColor || template.baseColor,
    );
  } else {
    await applyGarmentPresentation(
      canvas,
      view,
      templateView.garmentSvg,
      state.baseColor || template.baseColor,
    );
  }
  console.log('STEP 3: garment added');

  if (!isFabricCanvasReady(canvas, 'loadViewIntoCanvas after garment')) {
    return;
  }
  protectSystemObjects(canvas);

  await applyTemplateToCanvas(
    canvas,
    state.selectedTemplate as StudioTemplateId | "",
    view,
  );
  console.log('STEP 4: template added');

  if (!isFabricCanvasReady(canvas, 'loadViewIntoCanvas after template')) {
    return;
  }
  protectSystemObjects(canvas);
  const sceneObjects = canvas
    .getObjects()
    .filter((object) => {
      const typed = object as FabricObjectWithId;
      return typed.objectRole !== 'content';
    })
    .map((object) => object.toObject(['studioObjectId', 'objectRole', 'name']));

  const json = getCanvasJsonForView(state, view);
  if (json) {
    await loadContentJsonIntoCanvas(
      canvas,
      json,
      sceneObjects,
      view,
      view === 'sleeves'
        ? {
            left: template.garment.sleeveLeftSvg,
            right: template.garment.sleeveRightSvg,
          }
        : templateView.garmentSvg,
    );
    console.log(`loaded ${view} canvas`);
  } else {
    console.log(`initialized blank ${view}`);
  }

  console.log('STEP 5: content added');
  canvas.renderAll();
  console.log('STEP 6: renderAll');
  console.log('STEP 8: canvas objects', canvas.getObjects().length);
}

async function loadContentJsonIntoCanvas(
  canvas: Canvas,
  json: string,
  templateObjects: ReturnType<FabricObject['toObject']>[],
  view: StudioView,
  garmentSvg: string | { left: string; right: string },
) {
  const uvMode = isUvTemplate(
    useStudioStore.getState().selectedTemplate as StudioTemplateId | '',
  );
  const parsed = normalizeSerializedExternalImages(
    JSON.parse(json) as { objects?: Record<string, unknown>[] },
  ) as {
    objects?: Record<string, unknown>[];
  };
  const savedFontFamilies = collectSerializedFontFamilies(parsed.objects);
  const restoredObjectCount = parsed.objects?.length ?? 0;
  const store = useStudioStore.getState();
  if (store.isStudioPreparing) {
    store.updateStudioPreparation('Restoring artwork', 70);
  }
  console.log(`restoring ${view} content objects`, restoredObjectCount);
  const merged = {
    objects: [...templateObjects, ...(parsed.objects ?? [])],
  };

  if (savedFontFamilies.length > 0) {
    console.log(`preloading saved fonts for ${view}`, savedFontFamilies);
    await Promise.all(savedFontFamilies.map((fontFamily) => ensureStudioFontLoaded(fontFamily)));
    await waitForNextPaint();
  }

  logLoadedObjects(canvas, 'before content load');
  await canvas.loadFromJSON(merged);
  await refreshLoadedTextObjects(canvas);
  canvas.backgroundColor = 'rgba(0,0,0,0)';
  if (uvMode) {
    (canvas as StudioCanvas).studioClipPath = undefined;
    (canvas as StudioCanvas).studioSleeveClipPaths = undefined;
  } else if (view === 'sleeves' && typeof garmentSvg !== 'string') {
    (canvas as StudioCanvas).studioClipPath = undefined;
    (canvas as StudioCanvas).studioSleeveClipPaths = await loadSleevesClipPaths(
      garmentSvg.left,
      garmentSvg.right,
    );
  } else if (typeof garmentSvg === 'string') {
    (canvas as StudioCanvas).studioSleeveClipPaths = undefined;
    (canvas as StudioCanvas).studioClipPath = await loadGarmentClipPath(view, garmentSvg);
  }
  applySceneLayerOrder(canvas);
  applyClipPathToScene(canvas);
  logLoadedObjects(canvas, 'after content load');
  console.log(`restored ${view} object count`, canvas.getObjects().length);
  protectSystemObjects(canvas);
  canvas.renderAll();
  if (store.isStudioPreparing) {
    store.updateStudioPreparation('Preparing 3D preview', 90);
  }
}

function normalizeSerializedExternalImages(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeSerializedExternalImages(entry));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const typed = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  const imageSrc = typeof typed.src === 'string' ? typed.src : null;
  const shouldSetCrossOrigin =
    typed.type === 'image' && typeof imageSrc === 'string' && shouldUseAnonymousCrossOrigin(imageSrc);

  for (const [key, entry] of Object.entries(typed)) {
    next[key] = normalizeSerializedExternalImages(entry);
  }

  if (shouldSetCrossOrigin) {
    next.crossOrigin = 'anonymous';
  }

  return next;
}

async function refreshLoadedTextObjects(canvas: Canvas) {
  const textObjects = canvas
    .getObjects()
    .filter(isFabricTextObject)
    .filter((object) => typeof object.fontFamily === 'string' && object.fontFamily.trim().length > 0);

  if (textObjects.length === 0) {
    return;
  }

  const fontFamilies = Array.from(
    new Set(
      textObjects
        .map((object) => object.fontFamily?.trim())
        .filter((fontFamily): fontFamily is string => Boolean(fontFamily)),
    ),
  );

  console.log('refreshing restored text fonts', {
    textObjectCount: textObjects.length,
    fontFamilies,
  });

  await Promise.all(fontFamilies.map((fontFamily) => ensureStudioFontLoaded(fontFamily)));

  for (const object of textObjects) {
    object.dirty = true;
    object.initDimensions();
    object.setCoords();
  }

  canvas.requestRenderAll();
  await waitForNextPaint();
}

function collectSerializedFontFamilies(objects: Record<string, unknown>[] | undefined) {
  if (!objects) {
    return [];
  }

  return Array.from(
    new Set(
      objects
        .flatMap((object) => {
          const fontFamily = typeof object.fontFamily === 'string'
            ? object.fontFamily.trim()
            : '';
          return fontFamily ? [fontFamily] : [];
        }),
    ),
  );
}

function isFabricTextObject(object: FabricObject): object is Textbox & { fontFamily?: string } {
  return object.type === 'textbox' || object.type === 'i-text' || object.type === 'text';
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function applyClipPathToScene(canvas: Canvas) {
  for (const object of canvas.getObjects()) {
    const typed = object as FabricObjectWithId;
    if (typed.objectRole === 'template' || typed.objectRole === 'content') {
      moveRotateControlToBottom(object);
      assignObjectClipPath(canvas, object);
    }
  }
}

function applySceneLayerOrder(canvas: Canvas) {
  const isUvMode = isUvTemplate(
    useStudioStore.getState().selectedTemplate as StudioTemplateId | '',
  );
  const guideObjects = canvas.getObjects().filter((object) => {
    const typed = object as FabricObjectWithId;
    return typed.objectRole === 'guide';
  });
  const garmentObjects = canvas.getObjects().filter((object) => {
    const typed = object as FabricObjectWithId;
    return typed.objectRole === 'garment';
  });

  if (isUvMode) {
    for (const guideObject of guideObjects) {
      protectGarmentObject(guideObject);
      canvas.sendObjectToBack(guideObject);
    }

    for (const garmentObject of garmentObjects) {
      protectGarmentObject(garmentObject);
    }

    return;
  }

  for (const garmentObject of garmentObjects) {
    protectGarmentObject(garmentObject);
    canvas.sendObjectToBack(garmentObject);
  }
}

function getSceneClipPath(canvas: Canvas) {
  return (canvas as StudioCanvas).studioClipPath;
}

function assignObjectClipPath(canvas: Canvas, object: FabricObject) {
  const sleeveClipPath = getSleeveClipPathForObject(canvas, object);
  object.clipPath = sleeveClipPath ?? getSceneClipPath(canvas);
}

function getSleeveClipPathForObject(canvas: Canvas, object: FabricObject) {
  const sleeveClipPaths = (canvas as StudioCanvas).studioSleeveClipPaths;
  if (!sleeveClipPaths) {
    return undefined;
  }

  const center = object.getCenterPoint();
  return center.y < 332 ? sleeveClipPaths.left : sleeveClipPaths.right;
}

function getDefaultInsertionPoint(view: StudioView) {
  if (
    isUvTemplate(
      useStudioStore.getState().selectedTemplate as StudioTemplateId | '',
    )
  ) {
    return { left: UV_CANVAS_SIZE / 2, top: UV_CANVAS_SIZE / 2 };
  }

  return view === 'sleeves'
    ? { left: 260, top: 210 }
    : { left: 260, top: 230 };
}

function getCanvasJsonForView(
  state: {
    frontCanvasJson: string | null;
    backCanvasJson: string | null;
    sleevesCanvasJson: string | null;
  },
  view: StudioView,
) {
  if (
    isUvTemplate(
      useStudioStore.getState().selectedTemplate as StudioTemplateId | '',
    )
  ) {
    return state.frontCanvasJson ?? state.backCanvasJson ?? state.sleevesCanvasJson;
  }

  if (view === 'front') {
    return state.frontCanvasJson;
  }

  if (view === 'back') {
    return state.backCanvasJson;
  }

  return state.sleevesCanvasJson;
}

function updateGarmentBaseColor(canvas: Canvas, baseColor: string) {
  let updatedCount = 0;

  for (const object of canvas.getObjects()) {
    const typed = object as FabricObjectWithId;
    if (typed.objectRole !== 'garment') {
      continue;
    }

    typed.set({
      fill: baseColor,
      stroke: '#d1d5db',
      strokeWidth: 1,
    });
    updatedCount += 1;
  }

  console.log('shirt base color updated', {
    baseColor,
    updatedCount,
  });
}

function publishPreviewTextures(canvas: Canvas, view: StudioView) {
  const store = useStudioStore.getState();
  console.log('3D refresh trigger source', `${view} changed`);

  const isUvMode = isUvTemplate(
    store.selectedTemplate as StudioTemplateId | '',
  );

  if (isUvMode) {
    const uvTexture = exportUvPreviewTextureDataUrl(
      canvas,
      isPreviewRenderableObject,
    );
    store.setPreviewTexture('uv', uvTexture);
    console.log('uv texture generated', {
      bytes: uvTexture.length,
      view,
      exportTransform: 'raw master UV canvas export',
    });
    return;
  }

  if (view === 'front') {
    const frontTexture = exportFabricCanvasDataUrl(canvas, isPreviewRenderableObject);
    store.setPreviewTexture('front', frontTexture);
    console.log('front texture generated', {
      bytes: frontTexture.length,
    });
    return;
  }

  if (view === 'back') {
    const backTexture = exportFabricCanvasDataUrl(canvas, isPreviewRenderableObject);
    store.setPreviewTexture('back', backTexture);
    console.log('back texture generated', {
      bytes: backTexture.length,
    });
    return;
  }

  const sleeveExports = exportSleevesCanvasDataUrls(
    canvas,
    undefined,
    isPreviewRenderableObject,
  );
  const sleeveLeftTexture = sleeveExports.left;
  const sleeveRightTexture = sleeveExports.right;
  store.setPreviewTexture('sleeveLeft', sleeveLeftTexture);
  store.setPreviewTexture('sleeveRight', sleeveRightTexture);
  console.log('left sleeve export generated', {
    bytes: sleeveLeftTexture.length,
  });
  console.log('right sleeve export generated', {
    bytes: sleeveRightTexture.length,
  });
}

async function publishAllPreviewTextures(state: {
  selectedTemplate: string;
  uvViewportFocus: UvViewportFocus;
  showUvGuide: boolean;
  baseColor: string;
  frontCanvasJson: string | null;
  backCanvasJson: string | null;
  sleevesCanvasJson: string | null;
}) {
  if (!state.selectedTemplate) {
    return;
  }

  if (isUvTemplate(state.selectedTemplate as StudioTemplateId | '')) {
    return;
  }

  console.log('initial atlas source availability', {
    frontJson: Boolean(state.frontCanvasJson),
    backJson: Boolean(state.backCanvasJson),
    sleevesJson: Boolean(state.sleevesCanvasJson),
    selectedTemplate: state.selectedTemplate,
  });

  for (const view of ['front', 'back', 'sleeves'] as StudioView[]) {
    const element = document.createElement('canvas');
    const { width, height } = getCanvasDimensions(state.selectedTemplate);
    const exportCanvas = new Canvas(element, {
      width,
      height,
      backgroundColor: 'rgba(0,0,0,0)',
      preserveObjectStacking: true,
    });

    try {
      await loadViewIntoCanvas(exportCanvas, view, state);
      exportCanvas.renderAll();
      publishPreviewTextures(exportCanvas, view);
    } finally {
      exportCanvas.dispose();
    }
  }
}

function isPreviewRenderableObject(object: PreviewFilterObject) {
  const typed = object as PreviewFilterObject & {
    objectRole?: StudioObjectRole;
  };
  return typed.objectRole === 'template' || typed.objectRole === 'content';
}

function moveRotateControlToBottom(object: FabricObject) {
  const rotateControl = object.controls?.mtr;
  if (!rotateControl) {
    return;
  }

  rotateControl.x = 0;
  rotateControl.y = 0.5;
  rotateControl.offsetY = 34;
  rotateControl.withConnection = true;
  object.setCoords();
}
