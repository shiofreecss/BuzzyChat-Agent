import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class ExplorerBeaver {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private beaver: THREE.Group;
  private mouth: THREE.Mesh;
  private container: HTMLElement | null = null;
  private animationId: number | null = null;

  constructor() {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xE0E0E0); // Light gray background like in the image

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 5;
    this.camera.position.y = 1;

    // Initialize renderer (will be properly set in mount method)
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    // Initialize controls (will be properly set in mount method)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 10;
    this.controls.enablePan = true; // Enable panning
    this.controls.enableZoom = true; // Enable zooming
    this.controls.autoRotate = false; // Disabled by default
    this.controls.autoRotateSpeed = 1.0; // Default rotation speed

    // Create beaver group to hold all parts
    this.beaver = new THREE.Group();
    
    // Create mouth (will be animated during speech)
    this.mouth = this.createMouth();
    
    // Create complete beaver
    this.createBeaver();

    // Add lighting
    this.addLighting();
    
    // Add base/platform
    this.addBase();
  }

  private createBeaver(): void {
    // Body - rounded, slightly oval shape
    const bodyGeometry = new THREE.CapsuleGeometry(0.9, 0.7, 8, 16);
    bodyGeometry.rotateZ(Math.PI / 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xB05C30, // Orange-brown color like in the image
      roughness: 0.8,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    this.beaver.add(body);

    // Head - same color as body, round shape
    const headGeometry = new THREE.SphereGeometry(0.9, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xB05C30, // Same brown as body
      roughness: 0.7,
      metalness: 0.1,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.1, 0);
    this.beaver.add(head);

    // Safari Hat
    this.createSafariHat(head.position);

    // Add sunglasses
    this.createSunglasses(head.position);

    // Add white lab coat/shirt
    this.createLabCoat();

    // Add binoculars
    this.createBinoculars(head.position);

    // Add feet/hands
    this.createFeet();

    // Add mouth to head
    this.mouth.position.set(0, 0.6, 0.8);
    this.beaver.add(this.mouth);

    // Add beaver to scene
    this.scene.add(this.beaver);
  }

  private createSafariHat(headPosition: THREE.Vector3): void {
    // Hat brim (wide circular brim)
    const brimGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.05, 32);
    const brimMaterial = new THREE.MeshStandardMaterial({
      color: 0xDAC4A0, // Tan/beige color
      roughness: 0.7,
      metalness: 0.1,
    });
    const brim = new THREE.Mesh(brimGeometry, brimMaterial);
    brim.position.set(headPosition.x, headPosition.y + 0.5, headPosition.z);
    this.beaver.add(brim);

    // Hat crown (dome part)
    const crownGeometry = new THREE.SphereGeometry(0.8, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const crownMaterial = new THREE.MeshStandardMaterial({
      color: 0xDAC4A0, // Same as brim
      roughness: 0.7,
      metalness: 0.1,
    });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.set(headPosition.x, headPosition.y + 0.5, headPosition.z);
    this.beaver.add(crown);

    // Hat band
    const bandGeometry = new THREE.CylinderGeometry(0.83, 0.83, 0.15, 32);
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777, // Gray band
      roughness: 0.6,
      metalness: 0.2,
    });
    const band = new THREE.Mesh(bandGeometry, bandMaterial);
    band.position.set(headPosition.x, headPosition.y + 0.6, headPosition.z);
    this.beaver.add(band);

    // Red flag on top
    const flagPoleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    const flagPoleMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000, // Black pole
      roughness: 0.5,
      metalness: 0.5,
    });
    const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    flagPole.position.set(headPosition.x + 0.4, headPosition.y + 1.1, headPosition.z);
    this.beaver.add(flagPole);

    const flagGeometry = new THREE.PlaneGeometry(0.3, 0.2);
    const flagMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000, // Red flag
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(headPosition.x + 0.55, headPosition.y + 1.2, headPosition.z);
    flag.rotation.y = Math.PI / 2;
    this.beaver.add(flag);
  }

  private createSunglasses(headPosition: THREE.Vector3): void {
    // Bridge between glasses
    const bridgeGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.05);
    const glassesMaterial = new THREE.MeshStandardMaterial({
      color: 0x990000, // Reddish-brown frame
      roughness: 0.5,
      metalness: 0.5,
    });
    const bridge = new THREE.Mesh(bridgeGeometry, glassesMaterial);
    bridge.position.set(headPosition.x, headPosition.y + 0.05, headPosition.z + 0.85);
    this.beaver.add(bridge);

    // Left lens
    const lensGeometry = new THREE.CircleGeometry(0.25, 32);
    const lensMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000, // Black lenses
      roughness: 0.0,
      metalness: 0.9,
      side: THREE.DoubleSide
    });
    const leftLens = new THREE.Mesh(lensGeometry, lensMaterial);
    leftLens.position.set(headPosition.x - 0.25, headPosition.y + 0.05, headPosition.z + 0.87);
    leftLens.rotation.y = Math.PI / 2;
    this.beaver.add(leftLens);

    // Left frame
    const frameGeometry = new THREE.TorusGeometry(0.25, 0.05, 16, 32);
    const leftFrame = new THREE.Mesh(frameGeometry, glassesMaterial);
    leftFrame.position.set(headPosition.x - 0.25, headPosition.y + 0.05, headPosition.z + 0.86);
    leftFrame.rotation.y = Math.PI / 2;
    this.beaver.add(leftFrame);

    // Right lens
    const rightLens = new THREE.Mesh(lensGeometry, lensMaterial);
    rightLens.position.set(headPosition.x + 0.25, headPosition.y + 0.05, headPosition.z + 0.87);
    rightLens.rotation.y = Math.PI / 2;
    this.beaver.add(rightLens);

    // Right frame
    const rightFrame = new THREE.Mesh(frameGeometry, glassesMaterial);
    rightFrame.position.set(headPosition.x + 0.25, headPosition.y + 0.05, headPosition.z + 0.86);
    rightFrame.rotation.y = Math.PI / 2;
    this.beaver.add(rightFrame);

    // Temple pieces (arms that go over ears)
    const templePieceGeometry = new THREE.BoxGeometry(0.5, 0.03, 0.03);
    
    // Left temple
    const leftTemple = new THREE.Mesh(templePieceGeometry, glassesMaterial);
    leftTemple.position.set(headPosition.x - 0.5, headPosition.y + 0.05, headPosition.z + 0.6);
    leftTemple.rotation.y = Math.PI / 4;
    this.beaver.add(leftTemple);
    
    // Right temple
    const rightTemple = new THREE.Mesh(templePieceGeometry, glassesMaterial);
    rightTemple.position.set(headPosition.x + 0.5, headPosition.y + 0.05, headPosition.z + 0.6);
    rightTemple.rotation.y = -Math.PI / 4;
    this.beaver.add(rightTemple);
  }

  private createLabCoat(): void {
    // White lab coat / safari jacket (front part)
    const coatFrontGeometry = new THREE.CapsuleGeometry(0.7, 1.0, 8, 16);
    coatFrontGeometry.rotateZ(Math.PI / 2);
    const coatMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, // White coat
      roughness: 0.7,
      metalness: 0.1,
    });
    
    // Only use front half by scaling on z-axis
    coatFrontGeometry.scale(1, 1, 0.5);
    const coatFront = new THREE.Mesh(coatFrontGeometry, coatMaterial);
    coatFront.position.set(0, 0.4, 0.5);
    this.beaver.add(coatFront);

    // Arms - cylindrical
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.0, 16);
    
    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, coatMaterial);
    leftArm.position.set(-0.6, 0.4, 0.3);
    leftArm.rotation.z = Math.PI / 2;
    leftArm.rotation.y = -Math.PI / 6;
    this.beaver.add(leftArm);
    
    // Right arm - pointing outward
    const rightArm = new THREE.Mesh(armGeometry, coatMaterial);
    rightArm.position.set(0.6, 0.4, 0.3);
    rightArm.rotation.z = Math.PI / 2;
    rightArm.rotation.y = Math.PI / 6;
    this.beaver.add(rightArm);
  }

  private createBinoculars(headPosition: THREE.Vector3): void {
    // Binoculars around neck
    const binocularPartGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
    const binocularMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333, // Dark gray
      roughness: 0.4,
      metalness: 0.7,
    });
    
    // Left cylinder
    const leftBinocular = new THREE.Mesh(binocularPartGeometry, binocularMaterial);
    leftBinocular.position.set(-0.15, 0.6, 0.9);
    leftBinocular.rotation.x = Math.PI / 2;
    this.beaver.add(leftBinocular);
    
    // Right cylinder
    const rightBinocular = new THREE.Mesh(binocularPartGeometry, binocularMaterial);
    rightBinocular.position.set(0.15, 0.6, 0.9);
    rightBinocular.rotation.x = Math.PI / 2;
    this.beaver.add(rightBinocular);
    
    // Connection between cylinders
    const connectionGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.05);
    const connection = new THREE.Mesh(connectionGeometry, binocularMaterial);
    connection.position.set(0, 0.6, 0.9);
    this.beaver.add(connection);

    // Strap
    const strapGeometry = new THREE.TorusGeometry(0.5, 0.03, 8, 32, Math.PI);
    const strapMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777, // Gray strap
      roughness: 0.8,
      metalness: 0.2,
    });
    const strap = new THREE.Mesh(strapGeometry, strapMaterial);
    strap.position.set(0, 0.75, 0.5);
    strap.rotation.x = Math.PI / 2;
    strap.rotation.y = Math.PI;
    this.beaver.add(strap);
  }

  private createFeet(): void {
    // Feet (cylindrical)
    const footGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16);
    const footMaterial = new THREE.MeshStandardMaterial({
      color: 0x5B3D28, // Darker brown
      roughness: 0.9,
      metalness: 0.1,
    });
    
    // Left foot
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(-0.3, -0.25, 0.3);
    leftFoot.rotation.x = Math.PI / 2;
    this.beaver.add(leftFoot);
    
    // Right foot
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(0.3, -0.25, 0.3);
    rightFoot.rotation.x = Math.PI / 2;
    this.beaver.add(rightFoot);
  }

  private createMouth(): THREE.Mesh {
    const mouthGeometry = new THREE.RingGeometry(0.1, 0.2, 32, 1, 0, Math.PI);
    const mouthMaterial = new THREE.MeshStandardMaterial({
      color: 0x330000, // Dark red
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(mouthGeometry, mouthMaterial);
  }

  private addBase(): void {
    // Base platform (turquoise square like in the image)
    const baseGeometry = new THREE.BoxGeometry(2, 0.1, 2);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x40E0D0, // Turquoise
      roughness: 0.3,
      metalness: 0.2,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.35;
    this.scene.add(base);
  }

  private addLighting(): void {
    // Add ambient light for general illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Add directional light (main light)
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 5);
    this.scene.add(directional);

    // Add a soft fill light from the front
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(0, 0, 10);
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
    
    this.renderer.render(this.scene, this.camera);
  };

  public animateTalking(intensity: number): void {
    // Scale mouth based on audio intensity
    const scale = 0.5 + intensity * 1.5; // Scale between 0.5 and 2.0 based on intensity
    this.mouth.scale.set(1, scale, 1);
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
    this.camera.position.set(0, 1, 5);
    this.camera.lookAt(0, 0, 0);
    if (this.beaver) {
      this.beaver.position.set(0, 0, 0);
      this.beaver.rotation.y = 0;
    }
  }
} 