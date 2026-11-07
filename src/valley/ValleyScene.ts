import * as THREE from 'three';
import {
  createMarigoldTexture,
  createLotusTexture,
  createJasmineTexture,
  createLeafTexture,
  createDiyaFlameTexture,
  createSparkleTexture,
} from './textures';
import { audioStore } from './audio';

// Preallocated math helpers
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

// Firework particle definition
interface FireworkParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
  decay: number;
  size: number;
}

interface Rocket {
  x: number;
  y: number;
  z: number;
  vy: number;
  targetY: number;
  color: THREE.Color;
}

export class ValleyScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;

  // Animation & virtual scroller (calibrated for calm, serene motion)
  private frameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private scrollProgress: number = 0;
  private scrollVelocity: number = 0;
  private cameraPath: THREE.CatmullRomCurve3;

  // Pointer & interaction
  private pointer: THREE.Vector2 = new THREE.Vector2(0, 0);
  private pointerTarget: THREE.Vector2 = new THREE.Vector2(0, 0);
  private lastTouchY: number = 0;

  // Hover transition state
  private isHoverTransition: boolean = false;
  private hoverAmount: number = 0; // 0 to 1

  // Particle systems
  private flowerPoints!: THREE.Points;
  private leafPoints!: THREE.Points;
  private fireflyPoints!: THREE.Points;
  private flowerPositions!: Float32Array;
  private flowerBasePositions!: Float32Array;
  private flowerScales!: Float32Array;
  private flowerColors!: Float32Array;

  // Diyas in scene
  private diyaGroup: THREE.Group = new THREE.Group();
  private diyaLight!: THREE.PointLight;

  // 3D Fireworks System
  private fireworksParticles: FireworkParticle[] = [];
  private activeRockets: Rocket[] = [];
  private fireworksPoints!: THREE.Points;
  private fireworksPositions!: Float32Array;
  private fireworksColors!: Float32Array;
  private fireworksMaxCount = 2000;
  private fireworkFlashLight!: THREE.PointLight;
  private nextAutoFireworkTime = 1.5;

  // Callbacks
  private onLoadedCb?: () => void;
  private onIntroDoneCb?: () => void;
  private hasReportedIntro: boolean = false;

  constructor(
    container: HTMLElement,
    onLoaded?: () => void,
    onIntroDone?: () => void
  ) {
    this.container = container;
    this.onLoadedCb = onLoaded;
    this.onIntroDoneCb = onIntroDone;

    // Detect software WebGL per directives
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    const canvasContainer =
      container.querySelector('.js-canvas-container') || container;
    canvasContainer.innerHTML = '';
    canvasContainer.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020207);
    this.scene.fog = new THREE.FogExp2(0x030309, 0.0075);

    this.camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.5,
      700
    );

    // Camera spline path
    this.cameraPath = this.createCameraSpline();

    // Scene setup
    this.initLighting();
    this.initTerrainFoliage();
    this.initDiyas();
    this.initFireflies();
    this.initFireworks();

    this.bindEvents();
    this.startLoop();

    window.setTimeout(() => {
      this.onLoadedCb?.();
    }, 350);
  }

  private createCameraSpline(): THREE.CatmullRomCurve3 {
    // Gentle wide curves for calm flight
    const points: THREE.Vector3[] = [
      new THREE.Vector3(0, 4.0, 0),
      new THREE.Vector3(12, 4.6, 60),
      new THREE.Vector3(-14, 4.2, 130),
      new THREE.Vector3(16, 5.0, 200),
      new THREE.Vector3(-10, 4.5, 280),
      new THREE.Vector3(14, 4.8, 360),
      new THREE.Vector3(0, 4.0, 440),
      new THREE.Vector3(-12, 4.5, 520),
    ];
    return new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
  }

  private initLighting() {
    const keyLight = new THREE.DirectionalLight(0xfde047, 1.4);
    keyLight.position.set(20, 50, 20);
    this.scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x1e1b4b, 0x070412, 1.1);
    this.scene.add(hemiLight);

    this.diyaLight = new THREE.PointLight(0xf59e0b, 2.0, 35, 1.5);
    this.scene.add(this.diyaLight);

    // Firework flash light (illuminates valley when a firework bursts)
    this.fireworkFlashLight = new THREE.PointLight(0xfcd34d, 0, 180, 1.2);
    this.scene.add(this.fireworkFlashLight);
  }

  private getTerrainHeight(x: number, z: number): number {
    const hill1 = Math.sin(x * 0.035) * Math.cos(z * 0.025) * 5.5;
    const hill2 = Math.cos(x * 0.07 + 1.2) * Math.sin(z * 0.05) * 2.5;
    const valleyBowl = (x * x) * 0.003;
    return hill1 + hill2 + valleyBowl - 2.8;
  }

  private initTerrainFoliage() {
    const flowerCount = this.isSoftwareGl ? 2000 : 3600;
    const leafCount = this.isSoftwareGl ? 1400 : 2800;

    const marigoldTex = createMarigoldTexture();
    const lotusTex = createLotusTexture();
    const jasmineTex = createJasmineTexture();
    const leafTex = createLeafTexture();

    const flowerGeo = new THREE.BufferGeometry();
    this.flowerPositions = new Float32Array(flowerCount * 3);
    this.flowerBasePositions = new Float32Array(flowerCount * 3);
    this.flowerScales = new Float32Array(flowerCount);
    this.flowerColors = new Float32Array(flowerCount * 3);

    const palettes = [
      new THREE.Color(0xfbbf24), // Gold
      new THREE.Color(0xf59e0b), // Marigold
      new THREE.Color(0xf43f5e), // Lotus Pink
      new THREE.Color(0xfde047), // Radiant Yellow
      new THREE.Color(0xffedd5), // Jasmine Cream
    ];

    for (let i = 0; i < flowerCount; i++) {
      const idx3 = i * 3;
      const progress = Math.random();
      const ptOnPath = this.cameraPath.getPointAt(progress);

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.75) * 48 + 3.0;
      const x = ptOnPath.x + Math.cos(angle) * dist;
      const z = ptOnPath.z + Math.sin(angle) * dist;
      const y = this.getTerrainHeight(x, z) + 0.35 + Math.random() * 0.3;

      this.flowerPositions[idx3] = x;
      this.flowerPositions[idx3 + 1] = y;
      this.flowerPositions[idx3 + 2] = z;

      this.flowerBasePositions[idx3] = x;
      this.flowerBasePositions[idx3 + 1] = y;
      this.flowerBasePositions[idx3 + 2] = z;

      this.flowerScales[i] = 1.3 + Math.random() * 1.6;

      const col = palettes[Math.floor(Math.random() * palettes.length)];
      this.flowerColors[idx3] = col.r;
      this.flowerColors[idx3 + 1] = col.g;
      this.flowerColors[idx3 + 2] = col.b;
    }

    flowerGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.flowerPositions, 3)
    );
    flowerGeo.setAttribute(
      'color',
      new THREE.BufferAttribute(this.flowerColors, 3)
    );

    const flowerMat = new THREE.PointsMaterial({
      size: 3.0,
      map: marigoldTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.flowerPoints = new THREE.Points(flowerGeo, flowerMat);
    this.scene.add(this.flowerPoints);

    // Secondary Lotus layer
    const lotusGeo = new THREE.BufferGeometry();
    const lotusCount = Math.floor(flowerCount * 0.25);
    const lotusPos = new Float32Array(lotusCount * 3);
    for (let i = 0; i < lotusCount; i++) {
      const idx3 = i * 3;
      const progress = Math.random();
      const pt = this.cameraPath.getPointAt(progress);
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 30 + 3.5;
      const x = pt.x + Math.cos(angle) * dist;
      const z = pt.z + Math.sin(angle) * dist;
      const y = this.getTerrainHeight(x, z) + 0.45;

      lotusPos[idx3] = x;
      lotusPos[idx3 + 1] = y;
      lotusPos[idx3 + 2] = z;
    }
    lotusGeo.setAttribute('position', new THREE.BufferAttribute(lotusPos, 3));
    const lotusMat = new THREE.PointsMaterial({
      size: 4.0,
      map: lotusTex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.scene.add(new THREE.Points(lotusGeo, lotusMat));

    // Leaves layer
    const leafGeo = new THREE.BufferGeometry();
    const leafPos = new Float32Array(leafCount * 3);
    for (let i = 0; i < leafCount; i++) {
      const idx3 = i * 3;
      const progress = Math.random();
      const pt = this.cameraPath.getPointAt(progress);
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 54 + 4;
      const x = pt.x + Math.cos(angle) * dist;
      const z = pt.z + Math.sin(angle) * dist;
      const y = this.getTerrainHeight(x, z) + 0.1;

      leafPos[idx3] = x;
      leafPos[idx3 + 1] = y;
      leafPos[idx3 + 2] = z;
    }
    leafGeo.setAttribute('position', new THREE.BufferAttribute(leafPos, 3));
    const leafMat = new THREE.PointsMaterial({
      size: 2.3,
      map: leafTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.leafPoints = new THREE.Points(leafGeo, leafMat);
    this.scene.add(this.leafPoints);
  }

  private initDiyas() {
    const flameTex = createDiyaFlameTexture();
    const diyaCount = 26;

    for (let i = 0; i < diyaCount; i++) {
      const progress = (i / diyaCount + 0.04) % 1.0;
      const pt = this.cameraPath.getPointAt(progress);

      const side = (i % 2 === 0 ? 1 : -1) * (3.8 + Math.random() * 4.0);
      const tangent = this.cameraPath.getTangentAt(progress);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const diyaX = pt.x + normal.x * side;
      const diyaZ = pt.z + normal.z * side;
      const diyaY = this.getTerrainHeight(diyaX, diyaZ) + 0.3;

      const singleDiya = new THREE.Group();
      singleDiya.position.set(diyaX, diyaY, diyaZ);

      // Terracotta clay bowl
      const bowlPoints: THREE.Vector2[] = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.55, 0.05),
        new THREE.Vector2(0.85, 0.35),
        new THREE.Vector2(0.7, 0.45),
        new THREE.Vector2(0, 0.2),
      ];
      const bowlGeo = new THREE.LatheGeometry(bowlPoints, 14);
      const bowlMat = new THREE.MeshStandardMaterial({
        color: 0x92400e,
        roughness: 0.75,
        metalness: 0.1,
      });
      singleDiya.add(new THREE.Mesh(bowlGeo, bowlMat));

      // Luminous flame
      const flameGeo = new THREE.BufferGeometry();
      flameGeo.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array([0, 0.75, 0]), 3)
      );
      const flameMat = new THREE.PointsMaterial({
        size: 3.2,
        map: flameTex,
        transparent: true,
        opacity: 0.98,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      singleDiya.add(new THREE.Points(flameGeo, flameMat));

      if (i % 3 === 0) {
        const glow = new THREE.PointLight(0xf59e0b, 1.1, 11, 1.8);
        glow.position.set(0, 0.8, 0);
        singleDiya.add(glow);
      }

      this.diyaGroup.add(singleDiya);
    }
    this.scene.add(this.diyaGroup);
  }

  private initFireflies() {
    const count = this.isSoftwareGl ? 300 : 600;
    const sparkleTex = createSparkleTexture();

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const idx3 = i * 3;
      pos[idx3] = (Math.random() - 0.5) * 160;
      pos[idx3 + 1] = Math.random() * 20 + 1.2;
      pos[idx3 + 2] = (Math.random() - 0.5) * 350;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.6,
      map: sparkleTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xfde047,
    });

    this.fireflyPoints = new THREE.Points(geo, mat);
    this.scene.add(this.fireflyPoints);
  }

  /**
   * Initialize 3D Fireworks Particle System in the Night Sky
   */
  private initFireworks() {
    const sparkleTex = createSparkleTexture();
    const geo = new THREE.BufferGeometry();
    this.fireworksPositions = new Float32Array(this.fireworksMaxCount * 3);
    this.fireworksColors = new Float32Array(this.fireworksMaxCount * 3);

    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.fireworksPositions, 3)
    );
    geo.setAttribute(
      'color',
      new THREE.BufferAttribute(this.fireworksColors, 3)
    );

    const mat = new THREE.PointsMaterial({
      size: 8.0,
      map: sparkleTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      fog: false,
    });

    this.fireworksPoints = new THREE.Points(geo, mat);
    this.fireworksPoints.frustumCulled = false;
    this.scene.add(this.fireworksPoints);
  }

  private fireworkSideToggle: boolean = false;

  /**
   * Launch a celebratory firework rocket framed by default at the sides of the screen (calibrated for 9:16)
   */
  public launchFirework(targetPos?: THREE.Vector3, flank?: 'left' | 'right') {
    const currentPt = this.cameraPath.getPointAt(this.scrollProgress);
    const forward = this.cameraPath.getTangentAt(this.scrollProgress);
    const normal = new THREE.Vector3(-forward.z, 0, forward.x).normalize();

    let spawnX: number;
    let spawnZ: number;
    let targetY: number;

    if (targetPos) {
      spawnX = targetPos.x;
      spawnZ = targetPos.z;
      targetY = Math.max(targetPos.y, 18);
    } else {
      // Pick side: left flank (-1) vs right flank (+1)
      const chosenSide =
        flank === 'left' ? -1 : flank === 'right' ? 1 : this.fireworkSideToggle ? 1 : -1;
      this.fireworkSideToggle = !this.fireworkSideToggle;

      // Positioned right in the visible 9:16 sky flanks
      const lateral = chosenSide * (14 + Math.random() * 12);
      const dist = 26 + Math.random() * 20;

      spawnX = currentPt.x + forward.x * dist + normal.x * lateral;
      spawnZ = currentPt.z + forward.z * dist + normal.z * lateral;
      targetY = 18 + Math.random() * 12;
    }

    const fireworkPalettes = [
      new THREE.Color(0xfbbf24), // Rich Golden Amber
      new THREE.Color(0xf43f5e), // Ruby Crimson
      new THREE.Color(0x38bdf8), // Electric Cyan
      new THREE.Color(0xc084fc), // Royal Violet
      new THREE.Color(0x34d399), // Emerald Green
      new THREE.Color(0xf97316), // Radiant Saffron
      new THREE.Color(0xfffbeb), // Shimmering Gold Pearl
    ];

    const color =
      fireworkPalettes[Math.floor(Math.random() * fireworkPalettes.length)];

    this.activeRockets.push({
      x: spawnX,
      y: 1.0,
      z: spawnZ,
      vy: 20 + Math.random() * 6,
      targetY,
      color,
    });
  }

  /**
   * Explode a rocket at high altitude into a glittering sphere
   */
  private explodeRocket(rocket: Rocket) {
    audioStore.playFireworkBurst();

    // Trigger illumination flash light
    this.fireworkFlashLight.position.set(rocket.x, rocket.y, rocket.z);
    this.fireworkFlashLight.color.copy(rocket.color);
    this.fireworkFlashLight.intensity = 5.0;

    // Number of sparks in explosion (denser, fuller burst)
    const sparkCount = this.isSoftwareGl ? 85 : 150;

    for (let i = 0; i < sparkCount; i++) {
      if (this.fireworksParticles.length >= this.fireworksMaxCount) {
        this.fireworksParticles.shift();
      }

      // Spherical uniform distribution with burst velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 6.0 + Math.random() * 13.0;

      const vx = speed * Math.sin(phi) * Math.cos(theta);
      const vy = speed * Math.cos(phi) + 1.5;
      const vz = speed * Math.sin(phi) * Math.sin(theta);

      // Color variation per spark (gold sparkles mix with primary color)
      const isGlitter = Math.random() > 0.6;
      const col = isGlitter ? new THREE.Color(0xfffbeb) : rocket.color;

      this.fireworksParticles.push({
        x: rocket.x,
        y: rocket.y,
        z: rocket.z,
        vx,
        vy,
        vz,
        r: col.r,
        g: col.g,
        b: col.b,
        alpha: 1.0,
        decay: 0.32 + Math.random() * 0.32,
        size: 5.5 + Math.random() * 3.5,
      });
    }
  }

  private updateFireworks(delta: number) {
    // 1. Update Rockets ascent
    for (let i = this.activeRockets.length - 1; i >= 0; i--) {
      const rocket = this.activeRockets[i];
      rocket.y += rocket.vy * delta;

      // Rocket ascent spark trail
      if (this.fireworksParticles.length < this.fireworksMaxCount) {
        this.fireworksParticles.push({
          x: rocket.x + (Math.random() - 0.5) * 0.4,
          y: rocket.y,
          z: rocket.z + (Math.random() - 0.5) * 0.4,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -2.0 - Math.random() * 3.0,
          vz: (Math.random() - 0.5) * 1.5,
          r: 1.0,
          g: 0.9,
          b: 0.5,
          alpha: 0.9,
          decay: 2.2,
          size: 2.5,
        });
      }

      if (rocket.y >= rocket.targetY) {
        this.explodeRocket(rocket);
        this.activeRockets.splice(i, 1);
      }
    }

    // 2. Flash light decay
    if (this.fireworkFlashLight.intensity > 0.05) {
      this.fireworkFlashLight.intensity *= 0.88;
    } else {
      this.fireworkFlashLight.intensity = 0;
    }

    // 3. Update Sparks physics & buffer
    const gravity = -6.8;
    const airResistance = 0.965;

    for (let i = this.fireworksParticles.length - 1; i >= 0; i--) {
      const p = this.fireworksParticles[i];
      p.vx *= airResistance;
      p.vy = (p.vy + gravity * delta) * airResistance;
      p.vz *= airResistance;

      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      p.alpha -= p.decay * delta;

      if (p.alpha <= 0) {
        this.fireworksParticles.splice(i, 1);
      }
    }

    // Write particles to BufferAttributes
    const pCount = this.fireworksParticles.length;
    for (let i = 0; i < this.fireworksMaxCount; i++) {
      const idx3 = i * 3;
      if (i < pCount) {
        const p = this.fireworksParticles[i];
        this.fireworksPositions[idx3] = p.x;
        this.fireworksPositions[idx3 + 1] = p.y;
        this.fireworksPositions[idx3 + 2] = p.z;

        // Multiply by alpha for additive fade
        this.fireworksColors[idx3] = p.r * p.alpha;
        this.fireworksColors[idx3 + 1] = p.g * p.alpha;
        this.fireworksColors[idx3 + 2] = p.b * p.alpha;
      } else {
        // Park unused off-screen
        this.fireworksPositions[idx3] = 0;
        this.fireworksPositions[idx3 + 1] = -500;
        this.fireworksPositions[idx3 + 2] = 0;

        this.fireworksColors[idx3] = 0;
        this.fireworksColors[idx3 + 1] = 0;
        this.fireworksColors[idx3 + 2] = 0;
      }
    }

    const posAttr = this.fireworksPoints.geometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    const colAttr = this.fireworksPoints.geometry.getAttribute(
      'color'
    ) as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  private resizeObserver?: ResizeObserver;

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.onResize();
      });
      this.resizeObserver.observe(this.container);
    }
    window.addEventListener('pointermove', this.onPointerMove, {
      passive: true,
    });
    window.addEventListener('wheel', this.onWheel, { passive: false });

    const el = this.container;
    el.addEventListener('touchstart', this.onTouchStart, { passive: true });
    el.addEventListener('touchmove', this.onTouchMove, { passive: false });
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.pointerTarget.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerTarget.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    // Calm, smooth scroll response
    this.scrollVelocity += e.deltaY * 0.000035;
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      const rect = this.container.getBoundingClientRect();
      this.lastTouchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      if (rect.width > 0 && rect.height > 0) {
        this.pointerTarget.x = ((touchX - rect.left) / rect.width) * 2 - 1;
        this.pointerTarget.y = -((this.lastTouchY - rect.top) / rect.height) * 2 + 1;
      }
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = this.lastTouchY - currentY;
      this.lastTouchY = currentY;

      // Drastically reduced touch sensitivity for calm, serene gliding
      this.scrollVelocity += deltaY * 0.00008;

      const rect = this.container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.pointerTarget.x = ((currentX - rect.left) / rect.width) * 2 - 1;
        this.pointerTarget.y = -((currentY - rect.top) / rect.height) * 2 + 1;
      }
    }
  };

  public startHoverTransition() {
    this.isHoverTransition = true;
    audioStore.setMuffled(true);
  }

  public stopHoverTransition() {
    this.isHoverTransition = false;
    audioStore.setMuffled(false);
  }

  private startLoop() {
    const tick = () => {
      const delta = Math.min(this.clock.getDelta(), 0.06);
      const elapsed = this.clock.getElapsedTime();

      // 1. Serene, majestic idle drift
      if (!this.isHoverTransition) {
        this.scrollVelocity += 0.0016 * delta;
      }

      // Exponential damping
      this.scrollVelocity *= 0.94;
      this.scrollProgress += this.scrollVelocity;
      if (this.scrollProgress < 0) this.scrollProgress += 1;
      this.scrollProgress = this.scrollProgress % 1;

      // 2. Periodic celebratory fireworks framed at the sides of the screen (every ~1.8s)
      if (elapsed > this.nextAutoFireworkTime) {
        this.launchFirework(undefined, this.fireworkSideToggle ? 'left' : 'right');
        if (Math.random() > 0.35) {
          window.setTimeout(() => {
            this.launchFirework(undefined, this.fireworkSideToggle ? 'right' : 'left');
          }, 380);
        }
        this.nextAutoFireworkTime = elapsed + 1.6 + Math.random() * 1.3;
      }

      // 3. Hover amount interpolation
      const targetHover = this.isHoverTransition ? 1 : 0;
      this.hoverAmount += (targetHover - this.hoverAmount) * 0.05;

      // 4. Pointer smoothing (gentle, relaxed)
      this.pointer.x += (this.pointerTarget.x - this.pointer.x) * 0.04;
      this.pointer.y += (this.pointerTarget.y - this.pointer.y) * 0.04;

      // 5. Update Camera along spline
      const currentPt = this.cameraPath.getPointAt(this.scrollProgress);
      const lookAtOffset = 0.025;
      const lookAtPt = this.cameraPath.getPointAt(
        (this.scrollProgress + lookAtOffset) % 1
      );

      _vec3A.copy(currentPt);
      _vec3A.x += this.pointer.x * 1.2;
      _vec3A.y += this.pointer.y * 0.8;

      this.camera.position.copy(_vec3A);

      _vec3B.copy(lookAtPt);
      _vec3B.x += this.pointer.x * 1.8;
      _vec3B.y += this.pointer.y * 1.2;
      this.camera.lookAt(_vec3B);

      this.diyaLight.position.copy(this.camera.position);
      this.diyaLight.position.y -= 0.8;

      // 6. Update Fireworks
      this.updateFireworks(delta);

      // 7. Flower blooming & hover dispersion
      if (this.flowerPositions && this.flowerPoints) {
        const count = this.flowerScales.length;
        const attr = this.flowerPoints.geometry.getAttribute(
          'position'
        ) as THREE.BufferAttribute;

        const step = this.isSoftwareGl ? 3 : 1;
        for (let i = 0; i < count; i += step) {
          const idx3 = i * 3;
          const bx = this.flowerBasePositions[idx3];
          const by = this.flowerBasePositions[idx3 + 1];
          const bz = this.flowerBasePositions[idx3 + 2];

          // Gentle calm wind sway
          const sway = Math.sin(elapsed * 1.4 + bx * 0.3) * 0.08;

          // Hover dispersion
          const dispAngle = i * 0.45;
          const dispRadius = this.hoverAmount * 5.5;
          const dispX = Math.cos(dispAngle) * dispRadius;
          const dispY =
            Math.sin(dispAngle) * dispRadius * 0.7 + this.hoverAmount * 2.8;
          const dispZ = Math.sin(dispAngle * 0.7) * dispRadius;

          this.flowerPositions[idx3] = bx + sway + dispX;
          this.flowerPositions[idx3 + 1] = by + dispY;
          this.flowerPositions[idx3 + 2] = bz + dispZ;
        }
        attr.needsUpdate = true;
      }

      // 8. Fireflies gentle float
      if (this.fireflyPoints) {
        const fireflyAttr = this.fireflyPoints.geometry.getAttribute(
          'position'
        ) as THREE.BufferAttribute;
        const array = fireflyAttr.array as Float32Array;
        const len = array.length / 3;
        for (let i = 0; i < len; i += 2) {
          const idx = i * 3;
          array[idx + 1] += Math.sin(elapsed * 1.2 + i) * 0.012;
        }
        fireflyAttr.needsUpdate = true;
      }

      // 9. Render
      this.renderer.render(this.scene, this.camera);

      if (!this.hasReportedIntro && elapsed > 0.3) {
        this.hasReportedIntro = true;
        this.onIntroDoneCb?.();
      }

      this.frameId = requestAnimationFrame(tick);
    };

    this.frameId = requestAnimationFrame(tick);
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('wheel', this.onWheel);

    const el = this.container;
    el.removeEventListener('touchstart', this.onTouchStart);
    el.removeEventListener('touchmove', this.onTouchMove);

    this.resizeObserver?.disconnect();
    this.renderer.dispose();
  }
}
