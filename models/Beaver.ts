import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Beaver {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private beaver: THREE.Group;
  private mouth: THREE.Mesh;
  private tail: THREE.Mesh;
  private container: HTMLElement | null = null;
  private animationId: number | null = null;

  constructor() {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 10;
    this.camera.position.y = 2;

    // Initialize renderer (will be properly set in mount method)
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    // Initialize controls (will be properly set in mount method)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 15;
    this.controls.enablePan = true; // Enable panning
    this.controls.enableZoom = true; // Enable zooming
    this.controls.autoRotate = false; // Disabled by default
    this.controls.autoRotateSpeed = 1.0; // Default rotation speed

    // Create beaver group to hold all parts
    this.beaver = new THREE.Group();
    
    // Create mouth (will be animated during speech)
    this.mouth = this.createMouth();
    
    // Create tail (will be animated)
    this.tail = this.createTail();
    
    // Create complete beaver
    this.createBeaver();

    // Add lighting
    this.addLighting();
    
    // Add ground
    this.addGround();
  }

  private createBeaver(): void {
    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(1.2, 1.5, 8, 16);
    bodyGeometry.rotateZ(Math.PI / 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      roughness: 0.8,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.beaver.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.9, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      roughness: 0.7,
      metalness: 0.1,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(1.7, 0.3, 0);
    this.beaver.add(head);

    // Nose
    const noseGeometry = new THREE.SphereGeometry(0.3, 32, 16);
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000, // Black
      roughness: 0.5,
      metalness: 0.2,
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(2.5, 0.2, 0);
    this.beaver.add(nose);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

    // Left eye white
    const leftEyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      eyeWhiteMaterial
    );
    leftEyeWhite.position.set(2.1, 0.6, 0.4);
    this.beaver.add(leftEyeWhite);

    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(2.2, 0.6, 0.5);
    this.beaver.add(leftEye);

    // Right eye white
    const rightEyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      eyeWhiteMaterial
    );
    rightEyeWhite.position.set(2.1, 0.6, -0.4);
    this.beaver.add(rightEyeWhite);

    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(2.2, 0.6, -0.5);
    this.beaver.add(rightEye);

    // Ears
    const earGeometry = new THREE.CircleGeometry(0.3, 32);
    const earMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321, // Darker brown
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    // Left ear
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(1.5, 1.0, 0.6);
    leftEar.rotation.y = Math.PI / 4;
    this.beaver.add(leftEar);

    // Right ear
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(1.5, 1.0, -0.6);
    rightEar.rotation.y = -Math.PI / 4;
    this.beaver.add(rightEar);

    // Teeth (front)
    const toothGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.1);
    const toothMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFE0, // Ivory
      roughness: 0.3,
      metalness: 0.3,
    });

    // Left tooth
    const leftTooth = new THREE.Mesh(toothGeometry, toothMaterial);
    leftTooth.position.set(2.4, -0.1, 0.1);
    this.beaver.add(leftTooth);

    // Right tooth
    const rightTooth = new THREE.Mesh(toothGeometry, toothMaterial);
    rightTooth.position.set(2.4, -0.1, -0.1);
    this.beaver.add(rightTooth);

    // Add mouth
    this.mouth.position.set(2.35, -0.1, 0);
    this.beaver.add(this.mouth);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1, 16);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      roughness: 0.8,
      metalness: 0.1,
    });

    // Front left leg
    const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    frontLeftLeg.position.set(0.8, -1.2, 0.7);
    this.beaver.add(frontLeftLeg);

    // Front right leg
    const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    frontRightLeg.position.set(0.8, -1.2, -0.7);
    this.beaver.add(frontRightLeg);

    // Back left leg
    const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    backLeftLeg.position.set(-0.8, -1.2, 0.7);
    this.beaver.add(backLeftLeg);

    // Back right leg
    const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    backRightLeg.position.set(-0.8, -1.2, -0.7);
    this.beaver.add(backRightLeg);

    // Add tail to beaver
    this.tail.position.set(-2.0, 0, 0);
    this.beaver.add(this.tail);

    // Add beaver to scene
    this.scene.add(this.beaver);
  }

  private createMouth(): THREE.Mesh {
    const mouthGeometry = new THREE.RingGeometry(0.15, 0.25, 32, 1, 0, Math.PI);
    const mouthMaterial = new THREE.MeshStandardMaterial({
      color: 0x330000, // Dark red
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(mouthGeometry, mouthMaterial);
  }

  private createTail(): THREE.Mesh {
    const tailGeometry = new THREE.BoxGeometry(1.5, 0.3, 1.2);
    tailGeometry.translate(-0.75, 0, 0); // Pivot from the connection point
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321, // Darker brown
      roughness: 0.9,
      metalness: 0.1,
    });
    return new THREE.Mesh(tailGeometry, tailMaterial);
  }

  private addGround(): void {
    // Create a ground plane
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x228B22, // Forest green
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -1.7;
    this.scene.add(ground);

    // Create some water
    const waterGeometry = new THREE.PlaneGeometry(20, 10);
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1E90FF, // Dodger blue
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = Math.PI / 2;
    water.position.set(-5, -1.65, 0);
    this.scene.add(water);

    // Create a log
    const logGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 16);
    const logMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      roughness: 1.0,
      metalness: 0.0,
    });
    const log = new THREE.Mesh(logGeometry, logMaterial);
    log.rotation.z = Math.PI / 2;
    log.position.set(-2, -0.7, -3);
    this.scene.add(log);
  }

  private addLighting(): void {
    // Add ambient light for general illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Add directional light (sun)
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 5);
    directional.castShadow = true;
    this.scene.add(directional);

    // Add a soft light from the other side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  public mount(container: HTMLElement): void {
    this.container = container;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Update camera aspect ratio
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();

    // Start animation loop
    this.animate();

    // Handle window resize
    window.addEventListener('resize', this.handleResize);
  }

  public unmount(): void {
    if (this.container && this.renderer.domElement.parentNode) {
      this.container.removeChild(this.renderer.domElement);
    }

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    if (!this.container) return;

    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    
    // Update controls for smooth damping
    this.controls.update();
    
    // Animate tail
    if (this.tail) {
      this.tail.rotation.z = Math.sin(Date.now() * 0.002) * 0.2;
    }
    
    this.renderer.render(this.scene, this.camera);
  };

  public animateTalking(intensity: number): void {
    // Scale mouth based on audio intensity
    const scale = 0.5 + intensity * 1.5; // Scale between 0.5 and 2.0 based on intensity
    
    this.mouth.scale.set(1, scale, 1);
    
    // Also slightly move the head for more lively animation
    this.beaver.rotation.y = Math.sin(Date.now() * 0.0015) * 0.1;
    this.beaver.rotation.x = Math.sin(Date.now() * 0.002) * 0.05;
  }

  /**
   * Toggles auto-rotation of the model
   * @param enable Whether to enable or disable auto-rotation
   */
  public toggleAutoRotate(enable: boolean): void {
    if (this.controls) {
      this.controls.autoRotate = enable;
    }
  }

  /**
   * Sets the auto-rotation speed
   * @param speed The rotation speed (default is 1.0)
   */
  public setAutoRotateSpeed(speed: number): void {
    if (this.controls) {
      this.controls.autoRotateSpeed = speed;
    }
  }

  /**
   * Resets the camera to its default position
   */
  public resetCamera(): void {
    this.camera.position.set(0, 2, 10);
    this.camera.lookAt(0, 0, 0);
    if (this.beaver) {
      this.beaver.position.set(0, 0, 0);
      this.beaver.rotation.y = 0;
    }
  }
} 