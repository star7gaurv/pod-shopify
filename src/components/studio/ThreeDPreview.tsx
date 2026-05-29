'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas as ThreeCanvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useStudioStore } from '@/store/studioStore';


const TRANSPARENT_TEXTURE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR42mP8z/C/HwAFAgH/0s7L6QAAAABJRU5ErkJggg==';
const MODEL_CORRECTION_ROTATION: [number, number, number] = [0, 0, 0];

export function ThreeDPreview() {
  const selectedTemplate = useStudioStore((state) => state.selectedTemplate);
  const currentTemplate = useStudioStore((state) => state.currentTemplate);
  const templateStatus = useStudioStore((state) => state.templateStatus);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const modelPath = currentTemplate?.modelPath?.trim();
    if (!modelPath) {
      return;
    }

    useGLTF.preload(modelPath);
  }, [currentTemplate?.modelPath]);

  if (!selectedTemplate) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-white/8 bg-black/20 px-5 text-center text-sm leading-6 text-white/55">
        Select a product and template to generate the live 3D preview.
      </div>
    );
  }

  if (!currentTemplate || templateStatus === "loading") {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-white/8 bg-black/20 px-5 text-center text-sm leading-6 text-white/55">
        Loading the live 3D preview...
      </div>
    );
  }

  return (
    <>
      <div className="relative h-60 overflow-hidden rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.12),rgba(5,10,18,0.94)_58%)] sm:h-72">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="absolute right-3 top-3 z-10 rounded-full border border-white/12 bg-black/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/78 backdrop-blur transition hover:border-white/25 hover:bg-white/10 hover:text-white sm:text-[11px] sm:tracking-[0.16em]"
        >
          Expand 3D
        </button>
        <MeasuredThreeViewport viewportLabel="preview" />
      </div>

      {isExpanded ? (
        <ThreeDPreviewModal onClose={() => setIsExpanded(false)} />
      ) : null}
    </>
  );
}

function ThreeDPreviewModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4 backdrop-blur-md"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Expanded 3D shirt preview"
    >
      <div
        className="relative h-[70vh] w-[92vw] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.14),rgba(5,10,18,0.96)_62%)] shadow-[0_30px_120px_rgba(0,0,0,0.62)] sm:h-[min(82vh,760px)] sm:w-[min(92vw,1120px)] sm:rounded-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">
            3D Preview
          </p>
          <p className="mt-2 max-w-[200px] text-xs text-white/70 sm:max-w-none sm:text-sm">
            Drag to rotate the live shirt preview.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/12 bg-black/35 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/78 backdrop-blur transition hover:border-white/25 hover:bg-white/10 hover:text-white sm:right-5 sm:top-5 sm:px-4 sm:text-xs sm:tracking-[0.18em]"
        >
          Close
        </button>
        <MeasuredThreeViewport viewportLabel="modal" />
      </div>
    </div>
  );
}

function MeasuredThreeViewport({ viewportLabel }: { viewportLabel: 'preview' | 'modal' }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateSize = () => {
      const nextSize = {
        width: Math.round(container.clientWidth),
        height: Math.round(container.clientHeight),
      };

      setContainerSize((current) => {
        if (current.width === nextSize.width && current.height === nextSize.height) {
          return current;
        }

        console.log(`${viewportLabel} container size`, nextSize);
        return nextSize;
      });
    };

    updateSize();
    const frameId = window.requestAnimationFrame(updateSize);
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(updateSize);
    });
    observer.observe(container);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [viewportLabel]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {containerSize.width > 0 && containerSize.height > 0 ? (
        <ThreeDScene
          viewportLabel={viewportLabel}
          viewportSize={containerSize}
        />
      ) : null}
    </div>
  );
}

function ThreeDScene({
  viewportLabel,
  viewportSize,
}: {
  viewportLabel: 'preview' | 'modal';
  viewportSize: { width: number; height: number };
}) {
  const baseColor = useStudioStore((state) => state.baseColor);
  const uvTextureUrl = useStudioStore((state) => state.previewTextures.uv);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const currentTemplate = useStudioStore((state) => state.currentTemplate);

  return (
    <ThreeCanvas
      key={`${viewportLabel}-${viewportSize.width}x${viewportSize.height}`}
      camera={{ position: [0, 0.18, 4.4], fov: 31 }}
      dpr={[1, 1.7]}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={1.25} />
      <directionalLight position={[2.5, 4, 4]} intensity={1.55} />
      <directionalLight position={[-2.5, 1.8, -2]} intensity={0.45} />
      <Suspense fallback={<ModelLoadingLabel />}>
        <ShirtModel
          modelPath={currentTemplate?.modelPath ?? ''} // modelpath must be defined
          baseColor={baseColor}
          uvTextureUrl={uvTextureUrl}
          modelRef={modelRef}
        />
        <SceneViewportController
          viewportLabel={viewportLabel}
          viewportSize={viewportSize}
          modelRef={modelRef}
          controlsRef={controlsRef}
          fitToken={[
            baseColor,
            uvTextureUrl ?? '',
          ].join('|')}
        />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        makeDefault
        rotateSpeed={0.48}
        target={[0, 0, 0]}
        minPolarAngle={Math.PI / 2.45}
        maxPolarAngle={Math.PI / 1.82}
      />
    </ThreeCanvas>
  );
}

function ShirtModel({
  modelPath,
  baseColor,
  uvTextureUrl,
  modelRef,
}: {
  modelPath: string;
  baseColor: string;
  uvTextureUrl: string | null;
  modelRef: { current: THREE.Group | null };
}) {
  const gl = useThree((state) => state.gl);
  const { scene } = useGLTF(modelPath);
  const sceneClone = useMemo(() => scene.clone(true), [scene]);
  const loadedTexture = useTexture(uvTextureUrl ?? TRANSPARENT_TEXTURE);
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);
  const generatedTexture = useMemo(() => {
    return createShirtTexture(loadedTexture.image, baseColor, maxAnisotropy);
  }, [baseColor, loadedTexture.image, maxAnisotropy]);

  useEffect(() => {
    const meshLogs: Array<{
      meshName: string;
      materialNames: string[];
      hasUv: boolean;
      rotation: number[];
    }> = [];
    const rootBox = new THREE.Box3().setFromObject(sceneClone);
    sceneClone.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        meshLogs.push({
          meshName: object.name || '(unnamed mesh)',
          materialNames: materials.map((material) => material?.name || '(unnamed material)'),
          hasUv: Boolean(object.geometry?.attributes.uv),
          rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
        });
      }
    });

    console.log('3D GLB mesh/material summary', {
      modelPath,
      loadedRootRotation: [
        sceneClone.rotation.x,
        sceneClone.rotation.y,
        sceneClone.rotation.z,
      ],
      loadedRootPosition: sceneClone.position.toArray(),
      loadedRootScale: sceneClone.scale.toArray(),
      boundingBoxBeforeFix: {
        min: rootBox.min.toArray(),
        max: rootBox.max.toArray(),
        size: rootBox.getSize(new THREE.Vector3()).toArray(),
      },
      meshCount: meshLogs.length,
      materialCount: new Set(meshLogs.flatMap((entry) => entry.materialNames)).size,
      meshes: meshLogs,
      mapping: 'direct Fabric UV canvas export applied to the model UVs',
    });
  }, [modelPath, sceneClone]);

  useEffect(() => {
    const disposableMaterials: THREE.Material[] = [];
    const assignedMeshes: Array<{
      meshName: string;
      materialNames: string[];
    }> = [];

    sceneClone.traverse((object: THREE.Object3D) => {
      if (!(object instanceof THREE.Mesh)) {
        return;
      }

      const sourceMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      const nextMaterials = sourceMaterials.map((material) => {
        const nextMaterial = buildPreviewMaterial(material, generatedTexture);
        disposableMaterials.push(nextMaterial);
        return nextMaterial;
      });

      object.material = Array.isArray(object.material)
        ? nextMaterials
        : nextMaterials[0];
      object.visible = true;

      assignedMeshes.push({
        meshName: object.name || '(unnamed mesh)',
        materialNames: nextMaterials.map(
          (material) => material.name || '(unnamed preview material)',
        ),
      });
    });

    console.log('3D texture/material update runs', {
      modelPath,
      hasUvTexture: Boolean(uvTextureUrl),
      assignedMeshes,
      textureFlipY: generatedTexture.flipY,
      textureRepeat: generatedTexture.repeat.toArray(),
      textureOffset: generatedTexture.offset.toArray(),
      textureRotation: generatedTexture.rotation,
      textureCenter: generatedTexture.center.toArray(),
      mapTransformApplied:
        generatedTexture.flipY ||
        generatedTexture.rotation !== 0 ||
        generatedTexture.offset.x !== 0 ||
        generatedTexture.offset.y !== 0 ||
        generatedTexture.repeat.x !== 1 ||
        generatedTexture.repeat.y !== 1,
      materialSettings: disposableMaterials.map((material) => {
        const typed = material as THREE.MeshStandardMaterial;
        return {
          name: material.name || '(unnamed preview material)',
          transparent: material.transparent,
          opacity: material.opacity,
          side: material.side,
          metalness: typed.metalness,
          roughness: typed.roughness,
          color: typed.color?.getHexString?.(),
          hasMap: Boolean(typed.map),
          mapUuid: typed.map?.uuid,
          hasAlphaMap: Boolean(typed.alphaMap),
          emissive: typed.emissive?.getHexString?.(),
          depthWrite: material.depthWrite,
        };
      }),
    });

    const studioState = useStudioStore.getState();
    const shouldWaitForLiveUvTexture = Boolean(studioState.currentTemplate?.uvLayoutImage);
    if (studioState.isStudioPreparing && (!shouldWaitForLiveUvTexture || uvTextureUrl)) {
      studioState.finishStudioPreparation('Finalizing design');
    }

    return () => {
      for (const material of disposableMaterials) {
        material.dispose();
      }
    };
  }, [generatedTexture, modelPath, sceneClone, uvTextureUrl]);

  useEffect(() => {
    return () => {
      generatedTexture.dispose();
    };
  }, [generatedTexture]);

  useEffect(() => {
    if (!modelRef.current) {
      return;
    }

    modelRef.current.updateWorldMatrix(true, true);
    const boundingBoxBeforeFix = new THREE.Box3().setFromObject(sceneClone);
    const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    console.log('3D model orientation applied', {
      wrapperGroupRotation: MODEL_CORRECTION_ROTATION,
      loadedRootRotation: [
        sceneClone.rotation.x,
        sceneClone.rotation.y,
        sceneClone.rotation.z,
      ],
      boundingBoxBeforeFix: {
        min: boundingBoxBeforeFix.min.toArray(),
        max: boundingBoxBeforeFix.max.toArray(),
        size: boundingBoxBeforeFix.getSize(new THREE.Vector3()).toArray(),
      },
      boundingBoxAfterFix: {
        min: boundingBox.min.toArray(),
        max: boundingBox.max.toArray(),
        size: size.toArray(),
      },
      finalBoundingBoxCenter: center.toArray(),
      finalModelPosition: modelRef.current.position.toArray(),
      orbitTarget: [0, 0, 0],
    });
  }, [generatedTexture, modelRef, sceneClone]);

  if (!sceneClone) {
    return null;
  }

  return (
    <group ref={modelRef} rotation={MODEL_CORRECTION_ROTATION} scale={1.08}>
      <primitive object={sceneClone} />
    </group>
  );
}

function ModelLoadingLabel() {
  return (
    <Html center>
      <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/60">
        Loading model
      </div>
    </Html>
  );
}

function SceneViewportController({
  viewportLabel,
  viewportSize,
  modelRef,
  controlsRef,
  fitToken,
}: {
  viewportLabel: 'preview' | 'modal';
  viewportSize: { width: number; height: number };
  modelRef: { current: THREE.Group | null };
  controlsRef: {
    current: OrbitControlsImpl | null;
  };
  fitToken: string;
}) {
  const { camera, gl, invalidate, size } = useThree();

  useEffect(() => {
    resizeRendererToContainer({
      viewportLabel,
      width: viewportSize.width,
      height: viewportSize.height,
      renderer: gl,
      camera,
    });
    invalidate();
  }, [camera, gl, invalidate, viewportLabel, viewportSize.height, viewportSize.width, size.height, size.width]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      fitCameraToModel({
        viewportLabel,
        camera,
        model: modelRef.current,
        controls: controlsRef.current,
      });
      invalidate();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [camera, controlsRef, fitToken, invalidate, modelRef, viewportLabel, viewportSize.height, viewportSize.width]);

  return null;
}

function resizeRendererToContainer({
  viewportLabel,
  width,
  height,
  renderer,
  camera,
}: {
  viewportLabel: 'preview' | 'modal';
  width: number;
  height: number;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
}) {
  if (width <= 0 || height <= 0) {
    return;
  }

  renderer.setSize(width, height, false);
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  console.log(`${viewportLabel} resizeRendererToContainer`, {
    width,
    height,
  });
}

function fitCameraToModel({
  viewportLabel,
  camera,
  model,
  controls,
}: {
  viewportLabel: 'preview' | 'modal';
  camera: THREE.Camera;
  model: THREE.Group | null;
  controls: {
    target: THREE.Vector3;
    update: () => void;
  } | OrbitControlsImpl | null;
}) {
  if (!model || !(camera instanceof THREE.PerspectiveCamera)) {
    return;
  }

  model.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) {
    return;
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxDimension / (2 * Math.tan((Math.PI * camera.fov) / 360));
  const distance = fitHeightDistance * 1.65;
  const viewDirection = new THREE.Vector3(0, 0.12, 1).normalize();
  const nextPosition = center.clone().add(viewDirection.multiplyScalar(distance));

  camera.position.copy(nextPosition);
  camera.near = Math.max(0.01, distance / 100);
  camera.far = distance * 100;
  camera.lookAt(center);
  camera.updateProjectionMatrix();

  controls?.target.copy(center);
  controls?.update();

  console.log(`${viewportLabel} fitCameraToModel`, {
    wrapperGroupRotation: MODEL_CORRECTION_ROTATION,
    boundingBoxCenter: center.toArray(),
    boundingBoxSize: size.toArray(),
    cameraPosition: camera.position.toArray(),
    orbitTarget: controls?.target.toArray() ?? center.toArray(),
  });
}

function getMaterialTexture(
  material: THREE.Material | null,
  key: 'normalMap',
): THREE.Texture | null {
  if (!material) {
    return null;
  }

  const candidate = (material as THREE.MeshStandardMaterial)[key];
  return candidate instanceof THREE.Texture ? candidate : null;
}

function getMaterialNumber(
  material: THREE.Material | null,
  key: 'roughness' | 'metalness',
  fallback: number,
) {
  if (!material) {
    return fallback;
  }

  const candidate = (material as THREE.MeshStandardMaterial)[key];
  return typeof candidate === 'number' ? candidate : fallback;
}

function createShirtTexture(
  image: THREE.Texture['image'] | undefined,
  baseColor: string,
  anisotropy: number,
) {
  const { width, height } = getTextureImageSize(image);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    const fallbackTexture = new THREE.Texture();
    fallbackTexture.needsUpdate = true;
    return fallbackTexture;
  }

  context.clearRect(0, 0, width, height);
  context.fillStyle = baseColor;
  context.fillRect(0, 0, width, height);

  if (image) {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image as CanvasImageSource, 0, 0, width, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.rotation = 0;
  texture.center.set(0.5, 0.5);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;

  console.log('shirt texture upload settings', {
    sourceWidth: width,
    sourceHeight: height,
    flipY: texture.flipY,
    repeat: texture.repeat.toArray(),
    offset: texture.offset.toArray(),
    rotation: texture.rotation,
    center: texture.center.toArray(),
    anisotropy: texture.anisotropy,
    minFilter: texture.minFilter,
    magFilter: texture.magFilter,
    hasNonFlipTransform:
      texture.rotation !== 0 ||
      texture.offset.x !== 0 ||
      texture.offset.y !== 0 ||
      texture.repeat.x !== 1 ||
      texture.repeat.y !== 1,
  });

  return texture;
}

function buildPreviewMaterial(
  sourceMaterial: THREE.Material,
  map: THREE.Texture,
) {
  const material = new THREE.MeshStandardMaterial({
    name: `${sourceMaterial.name || 'shirt-material'}-uv-preview`,
    color: '#ffffff',
    map,
    normalMap: getMaterialTexture(sourceMaterial, 'normalMap'),
    roughness: getMaterialNumber(sourceMaterial, 'roughness', 0.78),
    metalness: getMaterialNumber(sourceMaterial, 'metalness', 0.03),
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthWrite: true,
  });

  material.alphaMap = null;
  material.emissive.set('#000000');
  material.needsUpdate = true;

  return material;
}

function getTextureImageSize(image: THREE.Texture['image'] | undefined) {
  if (!image) {
    return { width: 2048, height: 2048 };
  }

  const typedImage = image as
    | {
        naturalWidth?: number;
        naturalHeight?: number;
        width?: number | { baseVal?: { value?: number } };
        height?: number | { baseVal?: { value?: number } };
      }
    | undefined;

  if (
    typedImage &&
    typeof typedImage === 'object' &&
    'naturalWidth' in typedImage &&
    'naturalHeight' in typedImage
  ) {
    return {
      width: typedImage.naturalWidth || 2048,
      height: typedImage.naturalHeight || 2048,
    };
  }

  if (
    typedImage &&
    typeof typedImage === 'object' &&
    'width' in typedImage &&
    'height' in typedImage
  ) {
    const width =
      typeof typedImage.width === 'number'
        ? typedImage.width
        : typedImage.width?.baseVal?.value;
    const height =
      typeof typedImage.height === 'number'
        ? typedImage.height
        : typedImage.height?.baseVal?.value;
    return {
      width: width || 2048,
      height: height || 2048,
    };
  }

  return { width: 2048, height: 2048 };
}
