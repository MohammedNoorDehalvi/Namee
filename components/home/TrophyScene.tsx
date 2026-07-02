'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type SceneState = 'loading' | 'ready' | 'fallback';
type InteractionMode = 'rotate' | 'translate';

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function TrophyScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [sceneState, setSceneState] = useState<SceneState>('loading');
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !supportsWebGL()) {
      setSceneState('fallback');
      return;
    }

    let mounted = true;
    let frame = 0;
    let isVisible = true;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connection = navigator as Navigator & { deviceMemory?: number };
    const lowPower = (connection.deviceMemory ?? 8) <= 4 || window.innerWidth < 700;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030806, 0.055);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.05, 5.15);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !lowPower,
        powerPreference: 'high-performance',
      });
    } catch {
      setSceneState('fallback');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !lowPower;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.userSelect = 'none';
    renderer.domElement.style.webkitUserSelect = 'none';
    (renderer.domElement.style as CSSStyleDeclaration & { webkitTouchCallout?: string }).webkitTouchCallout = 'none';
    host.appendChild(renderer.domElement);

    function onContextLost(event: Event) {
      event.preventDefault();
      isVisible = false;
      setSceneState('fallback');
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    scene.environment = environment;
    room.dispose();
    pmrem.dispose();

    const trophyRig = new THREE.Group();
    scene.add(trophyRig);

    const hemi = new THREE.HemisphereLight(0xdfffe7, 0x111806, 1.7);
    scene.add(hemi);

    const key = new THREE.SpotLight(0xffd56a, 95, 12, Math.PI / 5, 0.7, 1.4);
    key.position.set(3.8, 4.2, 4.5);
    key.castShadow = !lowPower;
    key.shadow.mapSize.set(lowPower ? 512 : 1024, lowPower ? 512 : 1024);
    scene.add(key);

    const rim = new THREE.PointLight(0x55f59a, 32, 8, 1.8);
    rim.position.set(-3, 0.2, 1.8);
    scene.add(rim);

    const warmRim = new THREE.PointLight(0xff8f48, 22, 7, 2);
    warmRim.position.set(2.4, -1.6, 1.4);
    scene.add(warmRim);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.42, 64),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.55 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.68;
    shadow.receiveShadow = true;
    scene.add(shadow);

    const particleCount = lowPower ? 44 : 92;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const angle = index * 2.399963;
      const radius = 2.2 + ((index * 47) % 100) / 56;
      particlePositions[index * 3] = Math.cos(angle) * radius;
      particlePositions[index * 3 + 1] = ((index * 31) % 100) / 20 - 2.5;
      particlePositions[index * 3 + 2] = Math.sin(angle) * radius - 1.1;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf8d67a,
      size: lowPower ? 0.018 : 0.025,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const loader = new GLTFLoader();

    const modelRoot = new THREE.Group();
    trophyRig.add(modelRoot);

    let trophyModel: THREE.Object3D | null = null;

    loader.load(
      '/models/golden_trophyV.glb',
      (gltf) => {
        if (!mounted) return;
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const scale = 3 / Math.max(size.x, size.y, size.z);

        model.scale.setScalar(scale);
        const scaledCenter = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
        model.position.sub(scaledCenter);
        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = !lowPower;
          child.receiveShadow = true;
          const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
          const tunedMaterials = sourceMaterials.map((sourceMaterial) => {
            const material = sourceMaterial.clone();
            if (material instanceof THREE.MeshStandardMaterial) {
              material.envMapIntensity = 1.7;
              material.metalness = Math.max(material.metalness, 0.55);
              material.roughness = Math.min(Math.max(material.roughness, 0.18), 0.42);
            }
            return material;
          });
          child.material = Array.isArray(child.material) ? tunedMaterials : tunedMaterials[0];
        });

        modelRoot.add(model);
        trophyModel = model;
        trophyRig.rotation.set(-0.04, -0.28, 0.02);
        setLoadProgress(100);
        setSceneState('ready');
      },
      (event) => {
        if (event.total > 0) setLoadProgress(Math.round((event.loaded / event.total) * 100));
      },
      () => {
        if (mounted) setSceneState('fallback');
      },
    );

    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const dragPlane = new THREE.Plane();
    const hitPoint = new THREE.Vector3();
    const planePoint = new THREE.Vector3();
    const planeNormal = new THREE.Vector3();
    const rigWorld = new THREE.Vector3();
    const rigScreenOffset = new THREE.Vector3();
    const pointerToWorld = new THREE.Vector3();
    const intersectPoint = new THREE.Vector3();
    const dragStart = new THREE.Vector3();
    const cameraForward = new THREE.Vector3();
    const dragHit = new THREE.Vector3();

    const state = {
      active: false,
      pointerId: -1,
      mode: 'rotate' as InteractionMode,
      lastX: 0,
      lastY: 0,
      lastTime: 0,
    };

    const rotation = new THREE.Euler(-0.04, -0.28, 0.02, 'XYZ');
    const rotationVelocity = new THREE.Vector3();
    const position = new THREE.Vector3();
    const positionVelocity = new THREE.Vector3();

    const rotationSensitivity = 0.0045;
    const translationSensitivity = 1;
    const rotationDamping = 3.8;
    const translationDamping = 4.8;
    const pointerToWorldScale = 0.0019;

    function updatePointer(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointer.set(x, y);
    }

    function pickModel(event: PointerEvent) {
      if (!trophyModel) return false;
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(trophyModel, true);
      return hits.length > 0;
    }

    function onPointerDown(event: PointerEvent) {
      const forceTranslate = event.pointerType === 'mouse' && (event.button === 1 || event.button === 2 || event.altKey || event.shiftKey || event.metaKey);
      if (event.pointerType === 'mouse' && event.button !== 0 && !forceTranslate) return;
      if (state.active) return;
      state.active = true;
      state.pointerId = event.pointerId;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastTime = performance.now();
      renderer.domElement.setPointerCapture(event.pointerId);

      const hitTrophy = pickModel(event);
      state.mode = forceTranslate || hitTrophy ? 'translate' : 'rotate';

      if (state.mode === 'translate' && trophyModel) {
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        trophyRig.getWorldPosition(rigWorld);
        camera.getWorldDirection(planeNormal);
        dragPlane.setFromNormalAndCoplanarPoint(planeNormal, rigWorld);
        if (raycaster.ray.intersectPlane(dragPlane, dragHit)) {
          rigScreenOffset.copy(rigWorld).sub(dragHit);
        } else {
          rigScreenOffset.set(0, 0, 0);
        }
      }

      rotationVelocity.set(0, 0, 0);
      positionVelocity.set(0, 0, 0);
      event.preventDefault();
    }

    function onPointerMove(event: PointerEvent) {
      if (!state.active || event.pointerId !== state.pointerId) return;
      const now = performance.now();
      const dt = Math.max((now - state.lastTime) / 1000, 0.001);
      const dx = event.clientX - state.lastX;
      const dy = event.clientY - state.lastY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastTime = now;

      if (state.mode === 'rotate') {
        const deltaYaw = dx * rotationSensitivity;
        const deltaPitch = dy * rotationSensitivity;
        rotation.y += deltaYaw;
        rotation.x += deltaPitch;
        rotationVelocity.y = deltaYaw / dt;
        rotationVelocity.x = deltaPitch / dt;
      } else {
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
          pointerToWorld.copy(intersectPoint).add(rigScreenOffset);
          const deltaWorld = pointerToWorld.sub(position);
          position.add(deltaWorld);
          positionVelocity.copy(deltaWorld).divideScalar(dt);
        }
      }

      event.preventDefault();
    }

    function endPointer(event: PointerEvent) {
      if (event.pointerId !== state.pointerId) return;
      state.active = false;
      state.pointerId = -1;
      event.preventDefault();
    }

    function resize() {
      if (!host) return;
      const { width, height } = host.getBoundingClientRect();
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function render() {
      if (!mounted) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const scroll = Math.min(window.scrollY / Math.max(window.innerHeight * 0.55, 1), 1);

      if (!state.active && !reduceMotion) {
        const rotationDecay = Math.exp(-rotationDamping * delta);
        const translationDecay = Math.exp(-translationDamping * delta);
        rotation.x += rotationVelocity.x * delta;
        rotation.y += rotationVelocity.y * delta;
        rotation.z += rotationVelocity.z * delta;
        position.addScaledVector(positionVelocity, delta);
        rotationVelocity.multiplyScalar(rotationDecay);
        positionVelocity.multiplyScalar(translationDecay);
      }

      trophyRig.rotation.copy(rotation);
      trophyRig.position.copy(position);

      if (!reduceMotion) {
        particles.rotation.y = elapsed * 0.018 - scroll * 0.16;
        particles.rotation.z = Math.sin(elapsed * 0.12) * 0.06;
        camera.position.x += (0 - camera.position.x) * 0.035;
        camera.position.y += (-scroll * 0.26 - camera.position.y) * 0.035;
        camera.position.z += (5.15 + scroll * 0.68 - camera.position.z) * 0.035;
      }
      camera.lookAt(0, -0.06, 0);

      if (isVisible) renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    }

    const clock = new THREE.Clock();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting && !document.hidden;
    });
    visibilityObserver.observe(host);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', endPointer);
    renderer.domElement.addEventListener('pointercancel', endPointer);
    renderer.domElement.addEventListener('lostpointercapture', endPointer);
    resize();
    render();

    return () => {
      mounted = false;
      window.cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', endPointer);
      renderer.domElement.removeEventListener('pointercancel', endPointer);
      renderer.domElement.removeEventListener('lostpointercapture', endPointer);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className="trophy-scene" role="img" aria-label="Interactive golden APL trophy">
      {sceneState === 'loading' && (
        <div className="scene-loader" role="status">
          <span className="scene-loader__ring" />
          <span>Forging the trophy {loadProgress ? `${loadProgress}%` : ''}</span>
        </div>
      )}
      {sceneState === 'fallback' && (
        <div className="scene-fallback" aria-hidden="true">
          <span className="scene-fallback__glow" />
          <span className="scene-fallback__trophy">APL</span>
        </div>
      )}
    </div>
  );
}
