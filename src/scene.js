import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class PortfolioScene {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;

    this.mouse = {
      x: 0,
      y: 0,
      normX: 0,
      normY: 0,
      smoothX: 0,
      smoothY: 0
    };
    this.clock = new THREE.Clock();

    // Camera preset coordinates
    this.presets = {
      hero: { pos: new THREE.Vector3(2.4, 1.65, 3.2), target: new THREE.Vector3(0, 1.05, 0) },
      desk: { pos: new THREE.Vector3(0.65, 1.3, 1.55), target: new THREE.Vector3(-0.05, 1.15, 0) },
      wide: { pos: new THREE.Vector3(3.6, 2.2, 4.4), target: new THREE.Vector3(0, 0.95, 0) },
      profile: { pos: new THREE.Vector3(-2.6, 1.5, 1.9), target: new THREE.Vector3(0, 1.05, 0) },
      about: { pos: new THREE.Vector3(1.2, 1.45, 2.1), target: new THREE.Vector3(0, 1.1, 0) },
      skills: { pos: new THREE.Vector3(-1.1, 1.4, 2.0), target: new THREE.Vector3(-0.1, 1.15, -0.1) },
      projects: { pos: new THREE.Vector3(0.0, 1.35, 1.8), target: new THREE.Vector3(0, 1.2, -0.2) },
      experience: { pos: new THREE.Vector3(2.0, 1.8, 2.8), target: new THREE.Vector3(0, 1.0, 0) },
      achievements: { pos: new THREE.Vector3(-1.8, 1.7, 2.5), target: new THREE.Vector3(0, 1.05, 0) },
      certifications: { pos: new THREE.Vector3(1.6, 1.55, 2.4), target: new THREE.Vector3(0, 1.1, 0) },
      research: { pos: new THREE.Vector3(0.5, 1.5, 2.2), target: new THREE.Vector3(0, 1.2, 0) },
      resume: { pos: new THREE.Vector3(-0.8, 1.45, 2.1), target: new THREE.Vector3(0, 1.15, -0.1) },
      contact: { pos: new THREE.Vector3(1.8, 1.5, 3.0), target: new THREE.Vector3(0, 1.05, 0) }
    };

    this.currentPreset = 'hero';
    this.cameraPos = this.presets.hero.pos.clone();
    this.cameraTarget = this.presets.hero.target.clone();
    this.lerpSpeed = 0.035;

    this.quality = 'high';
    this.isMobile = window.innerWidth < 768;

    this.init();
  }

  init() {
    // 1. Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.045);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      this.isMobile ? 55 : 42,
      this.width / this.height,
      0.1,
      100
    );
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraTarget);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Post-processing
    this.setupPostProcessing();

    // 5. Interactive 3D Workstation Root Group (desk moves with cursor)
    this.workspaceRoot = new THREE.Group();
    this.scene.add(this.workspaceRoot);

    // 6. Build Workspace Environment
    this.setupLighting();
    this.buildRoom();
    this.buildDesk();
    this.buildMonitors();
    this.buildPeripherals();
    this.buildChair();
    this.buildCharacter();
    this.buildParticles();

    // 7. Event Listeners for 3D Cursor & Touch Motion
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('touchmove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerleave', this.onPointerLeave);

    // 8. Start render loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  setupPostProcessing() {
    this.renderPass = new RenderPass(this.scene, this.camera);
    // Subtle bloom that only affects bright glowing screen text, never the floor
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0.18,  // gentle bloom strength
      0.35,  // compact radius
      0.82   // high threshold so only screen graphics bloom
    );
    this.outputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.outputPass);
  }

  setQuality(mode) {
    this.quality = mode;
    if (mode === 'high') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.bloomPass.enabled = true;
    } else {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      this.bloomPass.enabled = false;
    }
  }

  setupLighting() {
    // 1. Soft, balanced dark-room ambient fill (no harsh glare)
    const ambientLight = new THREE.AmbientLight(0x0e172a, 1.8);
    this.scene.add(ambientLight);

    // 2. Gentle overhead fill (diffuse, soft, no harsh spotlight hotspots)
    const overheadFill = new THREE.DirectionalLight(0x1e293b, 1.0);
    overheadFill.position.set(0, 5, 2);
    this.scene.add(overheadFill);

    // 3. Monitor Screen Glow (Cyan-White, softly illuminating desk & character)
    this.monitorLight = new THREE.PointLight(0x00f0ff, 1.1, 3.2, 2.0);
    this.monitorLight.position.set(0, 1.25, 0.2);
    this.workspaceRoot.add(this.monitorLight);

    // 4. Subtle Back Rim Light: Softly outlines character silhouette without glare
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(-2.5, 2.2, -2.0);
    rimLight.target.position.set(0, 1.0, 0);
    this.scene.add(rimLight);
    this.scene.add(rimLight.target);

    // 5. Interactive 3D Cursor Light (softly follows cursor across the 3D desk)
    this.cursorLight = new THREE.PointLight(0x00f0ff, 0.45, 3.8, 2.0);
    this.cursorLight.position.set(0, 1.4, 1.2);
    this.scene.add(this.cursorLight);
  }

  buildRoom() {
    // 1. Dark Clean Matte Floor (no glare or harsh specular reflection)
    const floorGeo = new THREE.PlaneGeometry(28, 28);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050711,
      roughness: 0.94,
      metalness: 0.06
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Subtle Dark Grid
    const grid = new THREE.GridHelper(24, 48, 0x00f0ff, 0x0d1829);
    grid.position.y = 0.002;
    grid.material.opacity = 0.12;
    grid.material.transparent = true;
    this.scene.add(grid);

    // 3. Acoustic Slat Back Wall
    const backWallGroup = new THREE.Group();
    backWallGroup.position.set(0, 0, -2.2);

    const baseWallGeo = new THREE.PlaneGeometry(20, 8);
    const baseWallMat = new THREE.MeshStandardMaterial({
      color: 0x080e1c,
      roughness: 0.75,
      metalness: 0.3
    });
    const baseWall = new THREE.Mesh(baseWallGeo, baseWallMat);
    baseWall.position.y = 3;
    backWallGroup.add(baseWall);

    // Vertical slat panels
    const slatGeo = new THREE.BoxGeometry(0.04, 5.2, 0.06);
    const slatMat = new THREE.MeshStandardMaterial({
      color: 0x0e172a,
      roughness: 0.5,
      metalness: 0.5
    });

    for (let x = -5; x <= 5; x += 0.22) {
      if (Math.abs(x) < 1.6 && Math.random() > 0.4) continue; // architectural opening
      const slat = new THREE.Mesh(slatGeo, slatMat);
      slat.position.set(x, 2.6, 0.03);
      slat.castShadow = true;
      slat.receiveShadow = true;
      backWallGroup.add(slat);
    }

    this.scene.add(backWallGroup);

    // 4. Side Architectural Window / Skyline Atmosphere (Left & Right)
    this.buildCyberWindow();
  }

  buildCyberWindow() {
    const windowGroup = new THREE.Group();
    windowGroup.position.set(4.6, 0, 0);

    // Minimalist window frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0d1527,
      roughness: 0.3,
      metalness: 0.8
    });
    const pillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 7, 0.2), frameMat);
    pillar1.position.set(0, 3.5, -2);
    const pillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 7, 0.2), frameMat);
    pillar2.position.set(0, 3.5, 2);
    windowGroup.add(pillar1, pillar2);

    // Distant cyber monoliths / skyline silhouettes
    const skylineGroup = new THREE.Group();
    skylineGroup.position.set(6.5, 0, -2);

    for (let i = 0; i < 9; i++) {
      const h = 3 + Math.random() * 5;
      const w = 0.8 + Math.random() * 1.2;
      const d = 0.8 + Math.random() * 1.2;
      const bGeo = new THREE.BoxGeometry(w, h, d);
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x050813,
        roughness: 0.9,
        metalness: 0.1
      });
      const building = new THREE.Mesh(bGeo, bMat);
      building.position.set((Math.random() - 0.5) * 4, h / 2, (Math.random() - 0.5) * 6);
      skylineGroup.add(building);

      // Micro window dot lights
      if (Math.random() > 0.4) {
        const dotGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const dotMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x00f0ff : 0x38bdf8 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(building.position.x - w / 2 - 0.02, h * (0.4 + Math.random() * 0.5), building.position.z);
        skylineGroup.add(dot);
      }
    }
    this.scene.add(windowGroup);
    this.scene.add(skylineGroup);
  }

  buildDesk() {
    this.deskGroup = new THREE.Group();

    // 1. Premium Dark Carbon/Slate Desktop
    const deskTopGeo = new THREE.BoxGeometry(2.3, 0.055, 1.05);
    const deskTopMat = new THREE.MeshStandardMaterial({
      color: 0x0b111e,
      roughness: 0.35,
      metalness: 0.65
    });
    const deskTop = new THREE.Mesh(deskTopGeo, deskTopMat);
    deskTop.position.set(0, 0.85, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    this.deskGroup.add(deskTop);

    // Beveled accent edge strip (front of desk)
    const frontEdgeGeo = new THREE.BoxGeometry(2.302, 0.012, 0.012);
    const frontEdgeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2
    });
    const frontEdge = new THREE.Mesh(frontEdgeGeo, frontEdgeMat);
    frontEdge.position.set(0, 0.865, 0.525);
    this.deskGroup.add(frontEdge);

    // 2. Modern Architectural Legs (Cantilevered Brushed Titanium)
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x141d2f,
      roughness: 0.25,
      metalness: 0.85
    });

    const createLeg = (xPos) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(xPos, 0, 0);

      // Vertical post
      const vPost = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.08), legMat);
      vPost.position.set(0, 0.425, -0.15);
      vPost.castShadow = true;

      // Bottom foot
      const bFoot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.85), legMat);
      bFoot.position.set(0, 0.018, 0);
      bFoot.castShadow = true;

      // Top bracket
      const tBracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.85), legMat);
      tBracket.position.set(0, 0.83, 0);

      legGroup.add(vPost, bFoot, tBracket);
      return legGroup;
    };

    this.deskGroup.add(createLeg(-0.95));
    this.deskGroup.add(createLeg(0.95));

    // Under-desk cable management tray / structure
    const tray = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.2), legMat);
    tray.position.set(0, 0.8, -0.2);
    this.deskGroup.add(tray);

    // 3. Oversized Felt/Leather Desk Mat
    const matGeo = new THREE.BoxGeometry(1.5, 0.006, 0.62);
    const matMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.85,
      metalness: 0.1
    });
    const deskMat = new THREE.Mesh(matGeo, matMat);
    deskMat.position.set(0, 0.88, 0.1);
    deskMat.receiveShadow = true;
    this.deskGroup.add(deskMat);

    this.workspaceRoot.add(this.deskGroup);
  }

  buildMonitors() {
    // Dynamic Canvas Texture for Animated AI Terminal Display
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 1024;
    this.screenCanvas.height = 450;
    this.screenCtx = this.screenCanvas.getContext('2d');

    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.generateMipmaps = false;
    this.screenTexture.minFilter = THREE.LinearFilter;
    this.screenTexture.magFilter = THREE.LinearFilter;

    // Curved Ultrawide Display Assembly
    this.monitorGroup = new THREE.Group();
    this.monitorGroup.position.set(0, 0.88, -0.15);

    // Screen Dimensions: 3-segment subtly curved ultrawide
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      toneMapped: false
    });

    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x090e1a,
      roughness: 0.2,
      metalness: 0.85
    });

    // Center screen panel
    const centerGeo = new THREE.BoxGeometry(0.72, 0.38, 0.015);
    const centerScreen = new THREE.Mesh(centerGeo, screenMat);
    centerScreen.position.set(0, 0.44, 0);

    const centerBezel = new THREE.Mesh(new THREE.BoxGeometry(0.735, 0.395, 0.02), bezelMat);
    centerBezel.position.set(0, 0.44, -0.005);
    centerBezel.castShadow = true;

    // Left curved wing (11 deg angle)
    const wingGeo = new THREE.BoxGeometry(0.42, 0.38, 0.015);
    const leftWing = new THREE.Mesh(wingGeo, screenMat);
    leftWing.position.set(-0.55, 0.44, 0.04);
    leftWing.rotation.y = 0.19;

    const leftBezel = new THREE.Mesh(new THREE.BoxGeometry(0.435, 0.395, 0.02), bezelMat);
    leftBezel.position.set(-0.55, 0.44, 0.035);
    leftBezel.rotation.y = 0.19;
    leftBezel.castShadow = true;

    // Right curved wing (-11 deg angle)
    const rightWing = new THREE.Mesh(wingGeo, screenMat);
    rightWing.position.set(0.55, 0.44, 0.04);
    rightWing.rotation.y = -0.19;

    const rightBezel = new THREE.Mesh(new THREE.BoxGeometry(0.435, 0.395, 0.02), bezelMat);
    rightBezel.position.set(0.55, 0.44, 0.035);
    rightBezel.rotation.y = -0.19;
    rightBezel.castShadow = true;

    this.monitorGroup.add(centerScreen, centerBezel, leftWing, leftBezel, rightWing, rightBezel);

    // Stand Assembly (Precision Metal Arm)
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x162033,
      metalness: 0.9,
      roughness: 0.2
    });

    // Base plate
    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.015, 32), standMat);
    basePlate.position.set(0, 0.008, 0.02);
    basePlate.receiveShadow = true;

    // Upright column
    const column = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.06), standMat);
    column.position.set(0, 0.21, -0.06);
    column.rotation.x = -0.08;
    column.castShadow = true;

    // VESA mount connector
    const vesa = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.03), standMat);
    vesa.position.set(0, 0.42, -0.04);

    this.monitorGroup.add(basePlate, column, vesa);

    // Rear Ambilight LED Strip
    const rearLed = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.02, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    rearLed.position.set(0, 0.44, -0.02);
    this.monitorGroup.add(rearLed);

    this.workspaceRoot.add(this.monitorGroup);

    // Secondary Laptop (Slim Opened MacBook style) on Left
    this.buildLaptop();
  }

  buildLaptop() {
    this.laptopGroup = new THREE.Group();
    this.laptopGroup.position.set(-0.76, 0.88, 0.08);
    this.laptopGroup.rotation.y = 0.38;

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x182030,
      roughness: 0.25,
      metalness: 0.88
    });

    // Base chassis
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.01, 0.22), metalMat);
    base.position.set(0, 0.005, 0);
    base.castShadow = true;

    // Glowing trackpad
    const trackpad = new THREE.Mesh(
      new THREE.PlaneGeometry(0.09, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x101624, roughness: 0.4, metalness: 0.7 })
    );
    trackpad.rotation.x = -Math.PI / 2;
    trackpad.position.set(0, 0.011, 0.055);

    // Glowing miniature keyboard
    const kb = new THREE.Mesh(
      new THREE.PlaneGeometry(0.26, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x00d8ff, opacity: 0.15, transparent: true })
    );
    kb.rotation.x = -Math.PI / 2;
    kb.position.set(0, 0.011, -0.03);

    // Opened Screen Lid (angled 112 deg)
    const screenGroup = new THREE.Group();
    screenGroup.position.set(0, 0.01, -0.11);
    screenGroup.rotation.x = -1.25;

    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.008), metalMat);
    lid.position.set(0, 0.11, 0);
    lid.castShadow = true;

    const laptopScreenMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      toneMapped: false
    });
    const lScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), laptopScreenMat);
    lScreen.position.set(0, 0.11, 0.005);

    screenGroup.add(lid, lScreen);
    this.laptopGroup.add(base, trackpad, kb, screenGroup);

    this.workspaceRoot.add(this.laptopGroup);
  }

  buildPeripherals() {
    // 1. Mechanical Keyboard
    this.kbGroup = new THREE.Group();
    this.kbGroup.position.set(0, 0.88, 0.18);

    const kbBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.018, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x0e1524, roughness: 0.4, metalness: 0.8 })
    );
    kbBody.position.y = 0.009;
    kbBody.castShadow = true;
    this.kbGroup.add(kbBody);

    // Keycaps with subtle backlight underglow
    const keyPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.41, 0.006, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x1a263d,
        roughness: 0.5,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.12
      })
    );
    keyPlate.position.y = 0.021;
    this.kbGroup.add(keyPlate);

    this.workspaceRoot.add(this.kbGroup);

    // 2. Precision Wireless Mouse
    this.mouseGroup = new THREE.Group();
    this.mouseGroup.position.set(0.36, 0.88, 0.19);

    const mouseGeo = new THREE.BoxGeometry(0.065, 0.025, 0.105);
    const mouseMat = new THREE.MeshStandardMaterial({
      color: 0x0f1728,
      roughness: 0.3,
      metalness: 0.7
    });
    const mouseMesh = new THREE.Mesh(mouseGeo, mouseMat);
    mouseMesh.position.y = 0.0125;
    mouseMesh.castShadow = true;

    // Glowing center scroll strip
    const mouseLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, 0.004, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x00f5ff })
    );
    mouseLed.position.set(0, 0.026, -0.015);
    this.mouseGroup.add(mouseMesh, mouseLed);

    this.workspaceRoot.add(this.mouseGroup);

    // 3. Studio Monitor Speakers (Left & Right)
    this.buildStudioSpeakers();

    // 4. Minimalist Ceramic Mug & Desk Planter
    this.buildDeskAccessories();
  }

  buildStudioSpeakers() {
    const speakerMat = new THREE.MeshStandardMaterial({
      color: 0x0c1322,
      roughness: 0.35,
      metalness: 0.7
    });
    const coneMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

    const createSpeaker = (xPos, rotY) => {
      const spk = new THREE.Group();
      spk.position.set(xPos, 0.88, -0.06);
      spk.rotation.y = rotY;

      // Cabinet
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.14), speakerMat);
      cab.position.y = 0.11;
      cab.castShadow = true;

      // Tweeter
      const tweeter = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.005, 16), coneMat);
      tweeter.rotation.x = Math.PI / 2;
      tweeter.position.set(0, 0.165, 0.071);

      // Woofer
      const woofer = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.005, 24), coneMat);
      woofer.rotation.x = Math.PI / 2;
      woofer.position.set(0, 0.075, 0.071);

      spk.add(cab, tweeter, woofer);
      return spk;
    };

    this.workspaceRoot.add(createSpeaker(-0.88, 0.22));
    this.workspaceRoot.add(createSpeaker(0.88, -0.22));
  }

  buildDeskAccessories() {
    // Minimalist Coffee Mug
    const mugGroup = new THREE.Group();
    mugGroup.position.set(0.62, 0.88, 0.18);

    const mugMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.1
    });
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.035, 0.09, 24), mugMat);
    mug.position.y = 0.045;
    mug.castShadow = true;
    mugGroup.add(mug);
    this.workspaceRoot.add(mugGroup);

    // Minimalist Geometric Desktop Planter
    const plantGroup = new THREE.Group();
    plantGroup.position.set(-0.62, 0.88, -0.15);

    const potMat = new THREE.MeshStandardMaterial({
      color: 0x141e30,
      roughness: 0.4,
      metalness: 0.6
    });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.08, 6), potMat);
    pot.position.y = 0.04;
    pot.castShadow = true;
    plantGroup.add(pot);

    // Stylized succulent blades
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.5,
      metalness: 0.2
    });
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.07, 4), leafMat);
      leaf.position.set(0, 0.08, 0);
      leaf.rotation.z = 0.35;
      leaf.rotation.y = (i * Math.PI * 2) / 5;
      plantGroup.add(leaf);
    }
    this.workspaceRoot.add(plantGroup);
  }

  buildChair() {
    this.chairGroup = new THREE.Group();
    this.chairGroup.position.set(0, 0, 0.65);

    const chairMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.55,
      metalness: 0.4
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.2,
      metalness: 0.95
    });

    // 1. 5-Star Base with Wheels
    const starBase = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.3), chromeMat);
      leg.position.set(Math.sin(angle) * 0.15, 0.06, Math.cos(angle) * 0.15);
      leg.rotation.y = angle;

      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), chairMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(Math.sin(angle) * 0.28, 0.025, Math.cos(angle) * 0.28);
      starBase.add(leg, wheel);
    }
    this.chairGroup.add(starBase);

    // 2. Hydraulic Piston Cylinder
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.4, 16), chromeMat);
    cylinder.position.y = 0.25;
    cylinder.castShadow = true;
    this.chairGroup.add(cylinder);

    // 3. Ergonomic Molded Cushion
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.48), chairMat);
    seat.position.y = 0.48;
    seat.castShadow = true;
    seat.receiveShadow = true;
    this.chairGroup.add(seat);

    // 4. High-Back Contoured Mesh Backrest
    const backrestGroup = new THREE.Group();
    backrestGroup.position.set(0, 0.52, 0.22);

    // Backrest mesh
    const backGeo = new THREE.BoxGeometry(0.44, 0.65, 0.04);
    const backMesh = new THREE.Mesh(backGeo, chairMat);
    backMesh.position.y = 0.32;
    backMesh.rotation.x = 0.08;
    backMesh.castShadow = true;

    // Lumbar frame support
    const lumbarFrame = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 8, 24), chromeMat);
    lumbarFrame.position.set(0, 0.25, 0.035);
    lumbarFrame.rotation.x = 0.08;

    // Ergonomic Headrest
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.05), chairMat);
    headrest.position.set(0, 0.72, -0.01);
    headrest.castShadow = true;

    backrestGroup.add(backMesh, lumbarFrame, headrest);
    this.chairGroup.add(backrestGroup);

    // 5. 3D Armrests
    const createArmrest = (xPos) => {
      const arm = new THREE.Group();
      arm.position.set(xPos, 0.48, 0);

      const support = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 12), chromeMat);
      support.position.set(0, 0.11, 0);

      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.22), chairMat);
      pad.position.set(0, 0.22, 0);
      pad.castShadow = true;

      arm.add(support, pad);
      return arm;
    };

    this.chairGroup.add(createArmrest(-0.25));
    this.chairGroup.add(createArmrest(0.25));

    this.workspaceRoot.add(this.chairGroup);
  }

  buildCharacter() {
    this.characterGroup = new THREE.Group();
    this.characterGroup.position.set(0, 0.48, 0.62);

    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x090f1d,
      roughness: 0.8,
      metalness: 0.15
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x3d3536,
      roughness: 0.6,
      metalness: 0.1
    });

    // 1. Legs / Seated Pelvis
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.32), clothMat);
    pelvis.position.set(0, 0.06, 0);
    this.characterGroup.add(pelvis);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.36), clothMat);
    leftLeg.position.set(-0.12, 0.07, -0.16);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.36), clothMat);
    rightLeg.position.set(0.12, 0.07, -0.16);
    this.characterGroup.add(leftLeg, rightLeg);

    // 2. Torso (Breathing Spine Group for Subtle Idle Animation)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.12, 0.02);

    // Tech hoodie body
    const torsoGeo = new THREE.BoxGeometry(0.42, 0.48, 0.26);
    this.torsoMesh = new THREE.Mesh(torsoGeo, clothMat);
    this.torsoMesh.position.set(0, 0.24, 0);
    this.torsoMesh.castShadow = true;
    this.torsoGroup.add(this.torsoMesh);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 16), skinMat);
    neck.position.set(0, 0.52, 0);
    this.torsoGroup.add(neck);

    // 3. Head & Studio Headphones
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.62, 0);

    // Stylized Head Silhouette
    const headGeo = new THREE.BoxGeometry(0.2, 0.24, 0.22);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Modern Over-Ear Studio Headphones
    const hpMat = new THREE.MeshStandardMaterial({
      color: 0x05070d,
      roughness: 0.3,
      metalness: 0.85
    });
    const hpLedMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Headband
    const headband = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.015, 8, 24, Math.PI), hpMat);
    headband.rotation.z = Math.PI;
    headband.position.set(0, 0.08, 0);
    this.headGroup.add(headband);

    // Left & Right Earcups with subtle glowing status dots
    const earcupGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.025, 24);
    const leftCup = new THREE.Mesh(earcupGeo, hpMat);
    leftCup.rotation.z = Math.PI / 2;
    leftCup.position.set(-0.115, 0, 0);

    const leftDot = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.005, 12), hpLedMat);
    leftDot.rotation.z = Math.PI / 2;
    leftDot.position.set(-0.128, 0, 0);

    const rightCup = new THREE.Mesh(earcupGeo, hpMat);
    rightCup.rotation.z = Math.PI / 2;
    rightCup.position.set(0.115, 0, 0);

    const rightDot = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.005, 12), hpLedMat);
    rightDot.rotation.z = Math.PI / 2;
    rightDot.position.set(0.128, 0, 0);

    this.headGroup.add(leftCup, leftDot, rightCup, rightDot);
    this.torsoGroup.add(this.headGroup);

    // 4. Arms Resting Forward Towards Keyboard & Mouse
    // Left Arm (Keyboard)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.24, 0.44, 0);

    const lShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.28, 0.12), clothMat);
    lShoulder.position.set(0, -0.12, -0.06);
    lShoulder.rotation.x = 0.35;

    const lForearm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.32), clothMat);
    lForearm.position.set(0.1, -0.25, -0.22);
    lForearm.rotation.y = -0.32;

    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.09), skinMat);
    lHand.position.set(0.17, -0.27, -0.38);

    leftArmGroup.add(lShoulder, lForearm, lHand);
    this.torsoGroup.add(leftArmGroup);

    // Right Arm (Mouse)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.24, 0.44, 0);

    const rShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.28, 0.12), clothMat);
    rShoulder.position.set(0, -0.12, -0.06);
    rShoulder.rotation.x = 0.35;

    const rForearm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.32), clothMat);
    rForearm.position.set(0.02, -0.25, -0.22);
    rForearm.rotation.y = 0.18;

    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.09), skinMat);
    rHand.position.set(0.08, -0.27, -0.38);

    rightArmGroup.add(rShoulder, rForearm, rHand);
    this.torsoGroup.add(rightArmGroup);

    this.characterGroup.add(this.torsoGroup);
    this.workspaceRoot.add(this.characterGroup);
  }

  buildParticles() {
    // Ambient slow floating dust / light motes
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = 0.2 + Math.random() * 3.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

      speeds[i * 3] = (Math.random() - 0.5) * 0.001;
      speeds[i * 3 + 1] = 0.0004 + Math.random() * 0.0008; // very slow upward drift
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleSpeeds = speeds;

    const material = new THREE.PointsMaterial({
      color: 0x80e5ff,
      size: 0.028,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  updateScreenCanvas(time) {
    if (!this.screenCtx) return;
    const ctx = this.screenCtx;
    const w = this.screenCanvas.width;
    const h = this.screenCanvas.height;

    // Deep dark background
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, w, h);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Left Panel: Scrolling AI Neural Model Terminal
    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
    ctx.fillText('NEURAL_RUNTIME • DEV_WORKSPACE v4.1', 30, 42);

    const logLines = [
      '> import torch.nn as nn',
      '> model = TransformerBackbone(layers=32, heads=16)',
      `> loss.backward()  — epoch_delta: ${(Math.sin(time * 0.4) * 0.005 + 0.012).toFixed(5)}`,
      `> optimizer.step() — lr: 1e-4 • grad_norm: ${(0.42 + Math.cos(time * 0.5) * 0.05).toFixed(3)}`,
      '> tensor_shard_01: SYNC_COMPLETE [100%]',
      `> latency: ${(11.8 + Math.sin(time * 1.2) * 1.4).toFixed(1)}ms • batch_size: 128`,
      '> memory_alloc: 24.2GB / 32GB VRAM',
      '> status: OPTIMIZING ATTENTION KERNELS...'
    ];

    ctx.fillStyle = 'rgba(200, 225, 255, 0.65)';
    logLines.forEach((line, i) => {
      ctx.fillText(line, 30, 78 + i * 26);
    });

    // Center-Right Panel: Dynamic Neural Network Graph & Waveform
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.strokeRect(520, 25, 470, 395);

    ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.fillText('LIVE INFERENCE LOSS & ATTENTION DYNAMICS', 540, 52);

    // Waveform Curve
    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    for (let x = 0; x < 430; x += 6) {
      const y = 240 + Math.sin((x * 0.02) + time * 2.5) * 32 + Math.cos((x * 0.04) - time * 1.2) * 18;
      if (x === 0) ctx.moveTo(540 + x, y);
      else ctx.lineTo(540 + x, y);
    }
    ctx.stroke();

    // Neural nodes
    const nodeCount = 5;
    for (let i = 0; i < nodeCount; i++) {
      const nx = 580 + i * 85;
      const ny = 120 + Math.sin(time * 1.5 + i) * 15;

      ctx.beginPath();
      ctx.arc(nx, ny, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.fill();

      // Connector lines
      if (i < nodeCount - 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.moveTo(nx, ny);
        ctx.lineTo(nx + 85, 120 + Math.sin(time * 1.5 + i + 1) * 15);
        ctx.stroke();
      }
    }

    // Spectrum Bars at bottom
    for (let b = 0; b < 24; b++) {
      const barH = 15 + Math.sin(time * 2.2 + b * 0.6) * 18 + 12;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.55)';
      ctx.fillRect(540 + b * 18, 380 - barH, 10, barH);
    }

    this.screenTexture.needsUpdate = true;
  }

  setCameraPreset(name) {
    if (this.presets[name]) {
      this.currentPreset = name;
      this.cameraPos.copy(this.presets[name].pos);
      this.cameraTarget.copy(this.presets[name].target);
    }
  }

  onPointerMove(e) {
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

    if (clientX === undefined || clientY === undefined) return;

    // Normalized coordinates (-1.0 to +1.0)
    const normX = (clientX / window.innerWidth) * 2 - 1;
    const normY = -(clientY / window.innerHeight) * 2 + 1;

    this.mouse.normX = Math.max(-1, Math.min(1, normX));
    this.mouse.normY = Math.max(-1, Math.min(1, normY));
  }

  onPointerLeave() {
    // Gracefully ease back to center when cursor leaves the window
    this.mouse.normX = 0;
    this.mouse.normY = 0;
  }

  onWindowResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    this.isMobile = window.innerWidth < 768;

    this.camera.aspect = this.width / this.height;
    this.camera.fov = this.isMobile ? 55 : 42;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Fluid Mouse Damping
    this.mouse.smoothX += (this.mouse.normX - this.mouse.smoothX) * 0.055;
    this.mouse.smoothY += (this.mouse.normY - this.mouse.smoothY) * 0.055;

    // 2. Fully 3D Interactive Desk Motion (Wherever cursor moves, desk tilts & shifts in 3D)
    if (this.workspaceRoot) {
      // Dynamic tilt: when cursor moves right, desk turns to face right; vertical cursor tilts top surface
      const targetRotY = this.mouse.smoothX * 0.28; // ~16 deg yaw
      const targetRotX = -this.mouse.smoothY * 0.16; // ~9.2 deg pitch
      const targetRotZ = -this.mouse.smoothX * 0.045; // subtle banking

      // Dynamic position shift: desk glides along in 3D space following the cursor
      const targetPosX = this.mouse.smoothX * 0.35; // moves sideways with cursor
      const targetPosY = this.mouse.smoothY * 0.18; // moves up/down with cursor
      const targetPosZ = Math.abs(this.mouse.smoothX) * -0.10 + this.mouse.smoothY * 0.06;

      this.workspaceRoot.rotation.y += (targetRotY - this.workspaceRoot.rotation.y) * 0.065;
      this.workspaceRoot.rotation.x += (targetRotX - this.workspaceRoot.rotation.x) * 0.065;
      this.workspaceRoot.rotation.z += (targetRotZ - this.workspaceRoot.rotation.z) * 0.065;

      this.workspaceRoot.position.x += (targetPosX - this.workspaceRoot.position.x) * 0.065;
      this.workspaceRoot.position.y += (targetPosY - this.workspaceRoot.position.y) * 0.065;
      this.workspaceRoot.position.z += (targetPosZ - this.workspaceRoot.position.z) * 0.065;
    }

    // 3. Interactive 3D Cursor Lighting: Soft point light follows cursor over the desk
    if (this.cursorLight) {
      const cLightX = this.mouse.smoothX * 2.2;
      const cLightY = 1.35 + this.mouse.smoothY * 0.9;
      const cLightZ = 1.1 - this.mouse.smoothY * 0.3;
      this.cursorLight.position.set(cLightX, cLightY, cLightZ);
    }

    // 4. Character 3D Head & Torso Tracking (Developer looks directly towards user cursor!)
    if (this.headGroup) {
      const headTargetRotY = this.mouse.smoothX * 0.44;
      const headTargetRotX = 0.04 - this.mouse.smoothY * 0.22;
      this.headGroup.rotation.y += (headTargetRotY - this.headGroup.rotation.y) * 0.08;
      this.headGroup.rotation.x += (headTargetRotX - this.headGroup.rotation.x) * 0.08;
    }
    if (this.torsoGroup) {
      const breath = Math.sin(time * 0.9) * 0.012;
      this.torsoGroup.position.y = 0.12 + breath;
      this.torsoMesh.scale.set(1 + breath * 0.6, 1 + breath * 0.8, 1 + breath * 0.6);
      this.torsoGroup.rotation.y += (this.mouse.smoothX * 0.08 - this.torsoGroup.rotation.y) * 0.05;
    }

    // 5. Wireless Mouse Micro-Movement on Desk
    if (this.mouseGroup) {
      this.mouseGroup.position.x = 0.36 + this.mouse.smoothX * 0.04;
      this.mouseGroup.position.z = 0.19 - this.mouse.smoothY * 0.03;
    }

    // 6. Camera 3D Orbital Parallax & Ambient Float
    const floatX = Math.sin(time * 0.35) * 0.03;
    const floatY = Math.cos(time * 0.28) * 0.02;
    const camParallaxX = this.mouse.smoothX * 0.70;
    const camParallaxY = this.mouse.smoothY * 0.40;

    const targetX = this.cameraPos.x + camParallaxX + floatX;
    const targetY = this.cameraPos.y + camParallaxY + floatY;
    const targetZ = this.cameraPos.z - Math.abs(this.mouse.smoothX) * 0.12;

    this.camera.position.x += (targetX - this.camera.position.x) * this.lerpSpeed;
    this.camera.position.y += (targetY - this.camera.position.y) * this.lerpSpeed;
    this.camera.position.z += (targetZ - this.camera.position.z) * this.lerpSpeed;

    // Look at moving workspace focal center
    const focalCenter = this.cameraTarget.clone();
    if (this.workspaceRoot) {
      focalCenter.x += this.workspaceRoot.position.x * 0.4;
      focalCenter.y += this.workspaceRoot.position.y * 0.4;
    }
    this.camera.lookAt(focalCenter);

    // 7. Monitor Glow
    if (this.monitorLight) {
      this.monitorLight.intensity = 1.0 + Math.sin(time * 1.2) * 0.08;
    }

    // 8. Update Screen Canvas Texture at ~30fps
    if (Math.floor(time * 30) % 2 === 0) {
      this.updateScreenCanvas(time);
    }

    // 9. Ambient Particle Drift
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const speeds = this.particleSpeeds;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += speeds[i * 3 + 1];
        positions[i * 3] += Math.sin(time * 0.5 + i) * 0.0003;

        if (positions[i * 3 + 1] > 3.8) {
          positions[i * 3 + 1] = 0.2;
          positions[i * 3] = (Math.random() - 0.5) * 5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
        }
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // 10. Post-processing Composer Render
    if (this.quality === 'high') {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
