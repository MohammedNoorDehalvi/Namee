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

    /* ── Scene ─────────────────────────────────────── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020403, 0.042);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.08, 5.4);

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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.25 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
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

    /* ── Environment ───────────────────────────────── */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    scene.environment = environment;
    room.dispose();
    pmrem.dispose();

    /* ── Trophy rig ────────────────────────────────── */
    const trophyRig = new THREE.Group();
    scene.add(trophyRig);

    /* ── Lighting — Premium cinematic rig ──────────── */
    // Hemisphere for ambient fill
    const hemi = new THREE.HemisphereLight(0xd4ffe0, 0x0c0800, 1.4);
    scene.add(hemi);

    // Warm key light — main gold illumination
    const key = new THREE.SpotLight(0xffd56a, 110, 14, Math.PI / 5.5, 0.65, 1.3);
    key.position.set(3.5, 5.0, 5.0);
    key.castShadow = !lowPower;
    key.shadow.mapSize.set(lowPower ? 512 : 1024, lowPower ? 512 : 1024);
    key.shadow.bias = -0.0005;
    scene.add(key);

    // Cool rim light — separation from background
    const rim = new THREE.PointLight(0x55f59a, 38, 9, 1.6);
    rim.position.set(-3.5, 0.6, 2.2);
    scene.add(rim);

    // Warm fill from below — subtle warmth
    const warmRim = new THREE.PointLight(0xff8f48, 28, 8, 1.8);
    warmRim.position.set(2.2, -2.0, 1.8);
    scene.add(warmRim);

    // Accent spotlight — specular highlight on top
    const accent = new THREE.SpotLight(0xffffff, 45, 10, Math.PI / 8, 0.9, 1.2);
    accent.position.set(-1.5, 5.5, 3.0);
    scene.add(accent);

    // Subtle back light for edge definition
    const backLight = new THREE.PointLight(0x4488aa, 18, 8, 2);
    backLight.position.set(0, 1.2, -3.5);
    scene.add(backLight);

    /* ── Ground shadow ─────────────────────────────── */
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.52, 64),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.50 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.72;
    shadow.receiveShadow = true;
    scene.add(shadow);

    /* ── Particle system — Enhanced golden dust ────── */
    const particleCount = lowPower ? 55 : 120;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleAlphas = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i += 1) {
      const angle = i * 2.399963;
      const radius = 1.8 + ((i * 47) % 100) / 42;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = ((i * 31) % 100) / 18 - 2.8;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius - 0.8;
      particleSizes[i] = lowPower ? 0.015 : 0.012 + Math.random() * 0.022;
      particleAlphas[i] = 0.3 + Math.random() * 0.5;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf8d67a,
      size: lowPower ? 0.018 : 0.028,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    /* ── Model loading ─────────────────────────────── */
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
        const scale = 3.1 / Math.max(size.x, size.y, size.z);

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
              // Premium material tuning
              material.envMapIntensity = 2.2;
              material.metalness = Math.max(material.metalness, 0.7);
              material.roughness = Math.min(Math.max(material.roughness, 0.12), 0.35);

              // Slight emissive for bloom-like edge glow
              material.emissive = new THREE.Color(0xf8d67a);
              material.emissiveIntensity = 0.02;
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

    /* ── Pointer interaction ───────────────────────── */
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const dragPlane = new THREE.Plane();
    const planeNormal = new THREE.Vector3();
    const rigWorld = new THREE.Vector3();
    const rigScreenOffset = new THREE.Vector3();
    const pointerToWorld = new THREE.Vector3();
    const intersectPoint = new THREE.Vector3();
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

    // Enhanced interaction physics
    const rotationSensitivity = 0.005;
    const rotationDamping = 5.2;
    const translationDamping = 6.0;

    // Idle auto-rotation
    const idleRotationSpeed = 0.08;
    let idleBlend = 1; // 1 = full idle, 0 = user controlling

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
      idleBlend = 0;
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

    /* ── Render loop ───────────────────────────────── */
    function render() {
      if (!mounted) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const scroll = Math.min(window.scrollY / Math.max(window.innerHeight * 0.55, 1), 1);

      if (!state.active && !reduceMotion) {
        const rotDecay = Math.exp(-rotationDamping * delta);
        const posDecay = Math.exp(-translationDamping * delta);

        rotation.x += rotationVelocity.x * delta;
        rotation.y += rotationVelocity.y * delta;
        rotation.z += rotationVelocity.z * delta;
        position.addScaledVector(positionVelocity, delta);
        rotationVelocity.multiplyScalar(rotDecay);
        positionVelocity.multiplyScalar(posDecay);

        // Smooth idle auto-rotation blend back
        idleBlend += (1 - idleBlend) * delta * 0.5;
        rotation.y += idleRotationSpeed * delta * idleBlend * Math.sin(elapsed * 0.15 + 0.5) * 0.3;

        // Gentle sinusoidal idle sway
        const idleSway = idleBlend * 0.015;
        rotation.x += Math.sin(elapsed * 0.25) * idleSway * delta;
        rotation.z += Math.cos(elapsed * 0.18) * idleSway * delta * 0.5;
      }

      trophyRig.rotation.copy(rotation);
      trophyRig.position.copy(position);

      if (!reduceMotion) {
        // Particle animation — orbiting with pulsing opacity
        particles.rotation.y = elapsed * 0.015 - scroll * 0.12;
        particles.rotation.z = Math.sin(elapsed * 0.1) * 0.05;
        particleMaterial.opacity = 0.45 + Math.sin(elapsed * 0.6) * 0.12;

        // Cinematic scroll-linked camera with smooth lerp
        const lerpFactor = 0.025;
        const targetX = Math.sin(elapsed * 0.06) * 0.08;
        const targetY = -scroll * 0.32;
        const targetZ = 5.4 + scroll * 0.8;

        camera.position.x += (targetX - camera.position.x) * lerpFactor;
        camera.position.y += (targetY - camera.position.y) * lerpFactor;
        camera.position.z += (targetZ - camera.position.z) * lerpFactor;

        // Subtle camera roll for drama
        camera.rotation.z += (Math.sin(elapsed * 0.08) * 0.003 - camera.rotation.z) * 0.02;
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
