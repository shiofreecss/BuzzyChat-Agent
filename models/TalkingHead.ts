import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export type EmotionType = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'thinking';

export class TalkingHead {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private model: THREE.Group;
  private mouth: THREE.Object3D | null = null;
  private head: THREE.Object3D | null = null;
  private container: HTMLElement | null = null;
  private animationId: number | null = null;
  private currentEmotion: EmotionType = 'neutral';
  private modelLoaded: boolean = false;
  private mixer: THREE.AnimationMixer | null = null;
  private clock: THREE.Clock;
  private animations: THREE.AnimationClip[] = [];
  private mousePosition = { x: 0, y: 0 };
  private isMouseOver = false;
  private clickEffects: THREE.Mesh[] = [];
  
  // Callback for model loading
  public onModelLoaded: (() => void) | null = null;

  constructor() {
    // Initialize scene with lower quality for better performance
    this.scene = new THREE.Scene();
    
    // Set a dark blue-purple background color for space
    this.scene.background = new THREE.Color(0x050a20); 
    
    // Initialize camera with better default position
    this.camera = new THREE.PerspectiveCamera(65, 1, 0.1, 1000);
    this.camera.position.z = 6;
    this.camera.position.y = 0;

    // Initialize renderer with performance optimizations
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Disable antialiasing for performance
      powerPreference: 'high-performance',
      precision: 'mediump' // Medium precision for better performance
    });

    // Initialize controls with less damping for better performance
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1; // Less smooth but better performance
    this.controls.minDistance = 4;   // Prevent zooming in too close
    this.controls.maxDistance = 8;   // Prevent zooming out too far
    this.controls.minPolarAngle = Math.PI / 6;   // Limit vertical rotation (bottom)
    this.controls.maxPolarAngle = (5 * Math.PI) / 6;   // Limit vertical rotation (top)
    this.controls.enablePan = true; // Enable panning to adjust position
    this.controls.enableZoom = true; // Enable zooming for better control
    this.controls.autoRotate = false; // Disabled by default, can be enabled by user
    this.controls.autoRotateSpeed = 1.0; // Slow rotation speed

    // Create elements
    this.model = new THREE.Group();
    this.clock = new THREE.Clock();

    // Load the GLB model
    this.loadModel();

    // Add lighting
    this.addLighting();
    
    // Reduce star count for better performance
    this.addStarField();
  }

  private loadModel(): void {
    const loader = new GLTFLoader();
    
    loader.load(
      '/3d-models/machinarium.glb',
      (gltf) => {
        this.model = gltf.scene;
        
        // Scale and position the model appropriately for the robot - positioned higher
        this.model.scale.set(3, 3, 3);
        this.model.position.set(0, -1, 0); // Moved up from -2 to -1
        this.model.rotation.y = Math.PI / 12; // Slight angle for better view
        
        // Get animations
        if (gltf.animations && gltf.animations.length > 0) {
          this.animations = gltf.animations;
          this.mixer = new THREE.AnimationMixer(this.model);
        }
        
        // Find mouth and head elements for animation
        this.findMouthAndHead(this.model);
        
        // Add model to scene
        this.scene.add(this.model);
        this.modelLoaded = true;
        
        // Notify that model is loaded
        if (this.onModelLoaded) {
          this.onModelLoaded();
        }
        
        console.log('Model loaded successfully');
      },
      (progress) => {
        console.log('Loading model...', (progress.loaded / progress.total) * 100, '%');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  }

  private findMouthAndHead(object: THREE.Object3D): void {
    // Try to find mouth and head in the model
    // This is a simplified approach - you may need to adjust based on your model's structure
    object.traverse((child) => {
      if (child.name.toLowerCase().includes('mouth') || child.name.toLowerCase().includes('jaw')) {
        this.mouth = child;
        console.log('Found mouth object:', child.name);
      }
      if (child.name.toLowerCase().includes('head')) {
        this.head = child;
        console.log('Found head object:', child.name);
      }
    });
    
    // If we couldn't find specific parts, use the main model as the head for simple rotation
    if (!this.head) {
      this.head = this.model;
      console.log('Using main model as head for animations');
    }
    
    // If we couldn't find a mouth, create a dummy object for compatibility
    if (!this.mouth) {
      console.log('No mouth found in the model, creating a dummy mouth for compatibility');
      this.mouth = new THREE.Object3D();
      if (this.head) {
        this.head.add(this.mouth);
      } else {
        this.model.add(this.mouth);
      }
    }
  }

  private addLighting(): void {
    // Bright ambient light for overall illumination in space
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);

    // Direct front light to highlight the model's face
    const frontLight = new THREE.DirectionalLight(0xffffff, 2.5);
    frontLight.position.set(0, 0, 5);
    this.scene.add(frontLight);

    // Top rim light with blue tint for space atmosphere
    const topLight = new THREE.DirectionalLight(0xaaddff, 1.5);
    topLight.position.set(0, 5, 0);
    this.scene.add(topLight);
    
    // Side rim lights for edge definition against dark space
    const leftRimLight = new THREE.SpotLight(0xccffff, 1.5, 20, Math.PI / 6);
    leftRimLight.position.set(-6, 2, 4);
    this.scene.add(leftRimLight);
    
    const rightRimLight = new THREE.SpotLight(0xffccdd, 1.2, 20, Math.PI / 6);
    rightRimLight.position.set(6, 2, 4);
    this.scene.add(rightRimLight);
    
    // Add a slight purple/blue fill light from below for cosmic ambiance
    const bottomLight = new THREE.PointLight(0xaa88ff, 1.0, 15);
    bottomLight.position.set(0, -3, 5);
    this.scene.add(bottomLight);
  }

  public mount(container: HTMLElement): void {
    this.container = container;
    
    // Adjust quality based on device performance
    const pixelRatio = Math.min(window.devicePixelRatio, 2); // Limit pixel ratio
    this.renderer.setPixelRatio(pixelRatio);
    
    // Set size with quality adjustment based on screen size
    const quality = this.getQualityFactor();
    const width = container.clientWidth * quality;
    const height = container.clientHeight * quality;
    this.renderer.setSize(width, height, false);
    
    container.appendChild(this.renderer.domElement);
    
    // Stretch canvas to full container size
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Add mouse event listeners for interactive animations
    this.renderer.domElement.addEventListener('mousemove', this.handleMouseMove);
    this.renderer.domElement.addEventListener('mouseenter', this.handleMouseEnter);
    this.renderer.domElement.addEventListener('mouseleave', this.handleMouseLeave);
    this.renderer.domElement.addEventListener('click', this.handleClick);

    // Start animation loop
    this.animate();

    // Handle window resize
    window.addEventListener('resize', this.handleResize);
  }

  public unmount(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.container && this.renderer.domElement) {
      // Remove mouse event listeners
      this.renderer.domElement.removeEventListener('mousemove', this.handleMouseMove);
      this.renderer.domElement.removeEventListener('mouseenter', this.handleMouseEnter);
      this.renderer.domElement.removeEventListener('mouseleave', this.handleMouseLeave);
      this.renderer.domElement.removeEventListener('click', this.handleClick);
      
      this.container.removeChild(this.renderer.domElement);
      this.container = null;
    }

    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    if (!this.container) return;

    // Update camera aspect ratio
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    
    // Resize renderer with quality adjustment
    const quality = this.getQualityFactor();
    const width = this.container.clientWidth * quality;
    const height = this.container.clientHeight * quality;
    this.renderer.setSize(width, height, false);
    
    // Reset camera position on resize to maintain proper view
    this.camera.position.z = 6;
    this.camera.position.y = 0;
    
    // Reset model position
    if (this.model && this.modelLoaded) {
      this.model.position.set(0, -1, 0); // Update to match the new position
      this.model.rotation.y = Math.PI / 12;
    }
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.container) return;
    
    // Calculate normalized mouse position (-1 to 1)
    const rect = this.container.getBoundingClientRect();
    this.mousePosition.x = ((event.clientX - rect.left) / this.container.clientWidth) * 2 - 1;
    this.mousePosition.y = -((event.clientY - rect.top) / this.container.clientHeight) * 2 + 1;
  };

  private handleMouseEnter = (): void => {
    this.isMouseOver = true;
    
    // Show happy emotion briefly when mouse enters
    if (this.modelLoaded) {
      this.setEmotion('happy');
      
      // Reset to previous emotion after 1 second
      setTimeout(() => {
        if (this.currentEmotion === 'happy') {
          this.setEmotion('neutral');
        }
      }, 1000);
    }
  };

  private handleMouseLeave = (): void => {
    this.isMouseOver = false;
  };

  private handleClick = (): void => {
    if (!this.modelLoaded) return;
    
    // Create a visual ripple effect
    this.createClickEffect();
    
    // Set a random emotion briefly
    const emotions: EmotionType[] = ['happy', 'surprised', 'thinking'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    this.setEmotion(randomEmotion);
    
    // Reset to neutral after 1.5 seconds
    setTimeout(() => {
      this.setEmotion('neutral');
    }, 1500);
  };
  
  private createClickEffect(): void {
    // Create a ripple effect around the model
    const geometry = new THREE.RingGeometry(0.5, 0.7, 32);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x66aaff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.position.set(0, 0, 0);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    
    // Add to effects array for animation
    this.clickEffects.push(ring);
    
    // Remove effect after animation completes
    setTimeout(() => {
      if (this.clickEffects.includes(ring)) {
        this.scene.remove(ring);
        this.clickEffects = this.clickEffects.filter(effect => effect !== ring);
        material.dispose();
        geometry.dispose();
      }
    }, 2000);
  }

  private animate = (): void => {
    if (!this.animationId) {
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      this.animationId = requestAnimationFrame(this.animate);
    }
    
    // Update orbit controls
    this.controls.update();
    
    // Update mixer for animations if available
    if (this.mixer) {
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
    }
    
    // Throttle background rotation and star twinkling for better performance
    if (this.modelLoaded) {
      const time = Date.now();
      
      // Only apply rotation every few frames
      if (time % 3 === 0) {
        const rotTime = time * 0.00005;
        this.scene.rotation.y = rotTime * 0.1; // Very slow rotation of the entire scene
      }
      
      // Only do occasional twinkling at longer intervals
      if (time % 100 === 0 && Math.random() > 0.7) {
        this.scene.traverse((object) => {
          if (object instanceof THREE.Points && object.material instanceof THREE.PointsMaterial) {
            // Slightly adjust opacity for a twinkling effect
            object.material.opacity = 0.6 + Math.random() * 0.4;
            object.material.needsUpdate = true;
          }
        });
      }
    }
    
    // Add subtle floating animation to the model - reduced updates for better performance
    if (this.modelLoaded && this.model) {
      const time = Date.now() * 0.001;
      
      // Gentle floating up and down - adjusted for new position
      this.model.position.y = -1 + Math.sin(time * 0.5) * 0.15;
      
      // Interactive model movement when mouse is over
      if (this.isMouseOver) {
        // Look toward mouse cursor with limited range
        const targetRotationY = Math.PI / 12 + this.mousePosition.x * 0.3;
        const targetRotationX = this.mousePosition.y * 0.2;
        
        // Smoothly interpolate current rotation toward target - less smooth for better performance
        this.model.rotation.y += (targetRotationY - this.model.rotation.y) * 0.1;
        
        // Apply head tracking if head part is available, otherwise use model
        if (this.head && this.head !== this.model) {
          this.head.rotation.x += (targetRotationX - this.head.rotation.x) * 0.1;
        } else {
          this.model.rotation.x += (targetRotationX - this.model.rotation.x) * 0.1;
        }
      } else {
        // Standard subtle rotation when not hovering
        this.model.rotation.y = Math.PI / 12 + Math.sin(time * 0.3) * 0.05;
      }
      
      // Skip material updates on some frames for better performance
      if (Date.now() % 5 === 0) {
        // Enhance model materials for maximum brightness
        this.model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            // Increase material emissiveness for better visibility
            if (child.material instanceof THREE.MeshStandardMaterial) {
              if (!child.userData.originalEmissive) {
                // Store original values first time
                child.userData.originalEmissive = child.material.emissive.clone();
                child.userData.originalEmissiveIntensity = child.material.emissiveIntensity;
              }
              // Add strong emissive glow to materials
              child.material.emissive.setHex(0x666666);
              child.material.emissiveIntensity = 0.4;
            }
          }
        });
      }
    }
    
    // Animate click effects
    for (const effect of this.clickEffects) {
      // Scale up
      effect.scale.x += 0.04;
      effect.scale.y += 0.04;
      effect.scale.z += 0.04;
      
      // Fade out
      if (effect.material instanceof THREE.MeshBasicMaterial) {
        effect.material.opacity -= 0.015;
      }
    }
    
    this.renderer.render(this.scene, this.camera);
  };

  public animateTalking(intensity: number): void {
    if (!this.modelLoaded) return;
    
    // Animate the mouth if found
    if (this.mouth) {
      // Scale or rotate mouth based on intensity
      // This will need adjustment based on your model's structure
      const scale = 0.5 + intensity * 1.2;
      
      // Try different approaches for mouth animation depending on model
      if (this.mouth.name.toLowerCase().includes('jaw')) {
        // For jaw-based mouth, rotate it with a mechanical motion
        this.mouth.rotation.x = Math.min(-0.05, -0.4 * intensity) * Math.sin(Date.now() * 0.02);
      } else {
        // For other mouth types, try scaling with a mechanical feel
        this.mouth.scale.set(1, Math.round(scale * 4) / 4, 1); // Quantized for robotic feel
      }
    }
    
    // Add slight mechanical movements to the head
    if (this.head) {
      // More mechanical, robot-like movement pattern
      const time = Date.now() * 0.001;
      // Step-like movements for a more mechanical feel
      this.head.rotation.y = Math.round(Math.sin(time) * 10) / 100;
      this.head.rotation.x = Math.round(Math.sin(time * 1.5) * 8) / 100;
    }
  }
  
  /**
   * Set facial expression based on emotion
   */
  public setEmotion(emotion: EmotionType): void {
    this.currentEmotion = emotion;
    
    if (!this.modelLoaded) return;
    
    // For GLB models, expression changes would typically be handled via:
    // 1. Blend shapes/morph targets if the model has them
    // 2. Animation clips if the model has facial animations
    // 3. Texture swapping for different facial expressions
    
    // Below is a simplified approach that tries to use animations if available
    if (this.mixer && this.animations.length > 0) {
      // Stop any current animations
      this.mixer.stopAllAction();
      
      // Try to find an animation that matches the emotion
      const emotionAnimation = this.animations.find(anim => 
        anim.name.toLowerCase().includes(emotion.toLowerCase())
      );
      
      if (emotionAnimation) {
        // Play the emotion animation
        const action = this.mixer.clipAction(emotionAnimation);
        action.reset().play();
        return;
      }
    }
    
    // Fallback: simple mechanical movements for basic expressions
    if (this.mouth) {
      switch(emotion) {
        case 'happy':
          // Try to create a mechanical smile effect
          if (this.mouth.name.toLowerCase().includes('jaw')) {
            this.mouth.rotation.x = -0.1;
            this.mouth.position.y = 0.05;
          } else {
            this.mouth.rotation.z = 0.15;
            this.mouth.scale.set(1.2, 0.8, 1);
          }
          if (this.head) {
            this.head.rotation.z = 0.05;
          }
          break;
          
        case 'sad':
          // Try to create a mechanical frown effect
          if (this.mouth.name.toLowerCase().includes('jaw')) {
            this.mouth.rotation.x = 0.1;
            this.mouth.position.y = -0.05;
          } else {
            this.mouth.rotation.z = -0.15;
            this.mouth.scale.set(0.9, 0.7, 1);
          }
          if (this.head) {
            this.head.rotation.z = -0.05;
            this.head.rotation.x = 0.1;
          }
          break;
          
        case 'angry':
          // Tight mechanical mouth effect
          this.mouth.scale.set(0.7, 0.4, 1);
          if (this.head) {
            this.head.rotation.x = -0.1;
          }
          break;
          
        case 'surprised':
          // Open mouth wide with mechanical motion
          if (this.mouth.name.toLowerCase().includes('jaw')) {
            this.mouth.rotation.x = -0.25;
            // Quick oscillation for surprise
            const oscillation = Math.sin(Date.now() * 0.01) * 0.05;
            this.mouth.rotation.y = oscillation;
          } else {
            this.mouth.scale.set(1.2, 1.5, 1);
          }
          if (this.head) {
            this.head.position.z += 0.1;
          }
          break;
          
        case 'thinking':
          // Asymmetric mechanical mouth and head tilt
          this.mouth.rotation.z = 0.1;
          this.mouth.position.x = 0.1;
          if (this.head) {
            this.head.rotation.z = 0.1;
            this.head.rotation.y = 0.15;
          }
          break;
          
        case 'neutral':
        default:
          // Reset to mechanical neutral position
          this.mouth.rotation.z = 0;
          this.mouth.rotation.x = 0;
          this.mouth.position.x = 0;
          this.mouth.position.y = 0;
          this.mouth.scale.set(1, 1, 1);
          if (this.head) {
            this.head.rotation.z = 0;
            this.head.rotation.y = Math.PI / 12; // Maintain the slight angle
            this.head.position.z = 0;
          }
          break;
      }
    }
  }

  private createUniverseBackground(): void {
    // Set a dark blue-purple background color for space
    this.scene.background = new THREE.Color(0x050a20); 
    
    // Add a lot of stars with proper circular rendering
    this.addStarField();
    
    // Add a subtle nebula effect
    this.addNebula();
  }
  
  private addStarField(): void {
    // Create a shared texture for all star layers - reduce star count for mobile
    const starTexture = this.createStarTexture();
    
    // Reduce star count and size for better performance
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const multiplier = isMobile ? 0.5 : 1.0;
    
    // Create three layers of star particles for parallax effect with different sizes
    this.addStarLayerWithTexture(Math.floor(1000 * multiplier), 0.4, 200, starTexture);  // Distant small stars
    this.addStarLayerWithTexture(Math.floor(500 * multiplier), 0.8, 100, starTexture);   // Closer larger stars
    this.addStarLayerWithTexture(Math.floor(100 * multiplier), 1.2, 50, starTexture);    // Few very bright stars
    
    // Skip nebula effect on mobile for better performance
    if (!isMobile) {
      this.addNebula();
    }
  }
  
  private addStarLayerWithTexture(count: number, size: number, distance: number, texture: THREE.Texture): void {
    // Create star particles
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: size,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      map: texture,
      sizeAttenuation: true,
      depthWrite: false
    });
    
    // Create random star positions
    const positions = [];
    const colors = [];
    const possibleColors = [
      new THREE.Color(0xffffff), // White
      new THREE.Color(0xaaaaff), // Blue-ish
      new THREE.Color(0xffffaa), // Yellow-ish
      new THREE.Color(0xffaaaa)  // Red-ish
    ];
    
    for (let i = 0; i < count; i++) {
      // Create a sphere of positions
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.sin(phi) * Math.sin(theta);
      const z = distance * Math.cos(phi);
      
      positions.push(x, y, z);
      
      // Randomly select a star color with white being most common
      const colorIndex = Math.random() > 0.8 ? 
                        Math.floor(Math.random() * 3) + 1 : 0;
      const color = possibleColors[colorIndex];
      
      colors.push(color.r, color.g, color.b);
    }
    
    starsGeometry.setAttribute(
      'position', 
      new THREE.Float32BufferAttribute(positions, 3)
    );
    
    starsGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }
  
  private createStarTexture(): THREE.Texture {
    // Create a canvas to draw the star texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Could not get canvas context');
      return new THREE.Texture();
    }
    
    // Clear the canvas - transparent background
    context.clearRect(0, 0, 64, 64);
    
    // Center of the texture
    const centerX = 32;
    const centerY = 32;
    
    // Create a radial gradient for a soft circular star
    const gradient = context.createRadialGradient(
      centerX, centerY, 0,      // inner circle center and radius
      centerX, centerY, 28      // outer circle center and radius
    );
    
    // Add color stops for a glowing circular star
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Fill the circle with the gradient
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(centerX, centerY, 28, 0, Math.PI * 2);
    context.fill();
    
    // Random chance to add a diffraction spike effect (makes stars look more realistic)
    if (Math.random() > 0.5) {
      // Create the "sparkle" effect that real stars often have in astrophotography
      const createSpike = (angle: number, length: number) => {
        context.save();
        context.translate(centerX, centerY);
        context.rotate(angle);
        
        // Draw a tapered line for the spike
        const spikeGradient = context.createLinearGradient(0, 0, length, 0);
        spikeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        spikeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        context.strokeStyle = spikeGradient;
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(length, 0);
        context.stroke();
        
        context.restore();
      };
      
      // Create 4 spikes (typical diffraction pattern)
      const spikeLength = 28 + Math.random() * 4;
      createSpike(0, spikeLength);             // Right
      createSpike(Math.PI / 2, spikeLength);   // Down
      createSpike(Math.PI, spikeLength);       // Left
      createSpike(3 * Math.PI / 2, spikeLength); // Up
      
      // Occasional diagonal spikes for extra detail
      if (Math.random() > 0.7) {
        const diagonalLength = spikeLength * 0.7;
        createSpike(Math.PI / 4, diagonalLength);       // Down-right
        createSpike(3 * Math.PI / 4, diagonalLength);   // Down-left
        createSpike(5 * Math.PI / 4, diagonalLength);   // Up-left
        createSpike(7 * Math.PI / 4, diagonalLength);   // Up-right
      }
    }
    
    // Create and return a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }
  
  private addNebula(): void {
    // Create fewer nebula clouds for better performance
    const createNebulaCloud = (color: THREE.Color, size: number, count: number, distance: number) => {
      // Create a procedural particle texture
      const particleTexture = this.createParticleTexture();
      
      const cloudMaterial = new THREE.SpriteMaterial({
        map: particleTexture,
        color: color,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
      });
      
      for (let i = 0; i < count; i++) {
        const sprite = new THREE.Sprite(cloudMaterial);
        
        // Position in a sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        sprite.position.x = distance * Math.sin(phi) * Math.cos(theta);
        sprite.position.y = distance * Math.sin(phi) * Math.sin(theta);
        sprite.position.z = distance * Math.cos(phi);
        
        // Random size
        const scale = Math.random() * size + size / 2;
        sprite.scale.set(scale, scale, 1);
        
        this.scene.add(sprite);
      }
    };
    
    // Reduced cloud count
    createNebulaCloud(new THREE.Color(0x5040aa), 15, 3, 80); // Purple clouds
    createNebulaCloud(new THREE.Color(0x4080ff), 18, 2, 100); // Blue clouds
    createNebulaCloud(new THREE.Color(0xff4060), 20, 1, 120); // Red clouds
  }
  
  private createParticleTexture(): THREE.Texture {
    // Create a canvas to draw the particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Could not get canvas context');
      return new THREE.Texture();
    }
    
    // Create a radial gradient for a soft particle look
    const gradient = context.createRadialGradient(
      32, 32, 0,     // inner circle center and radius
      32, 32, 32     // outer circle center and radius
    );
    
    // Add color stops for a smooth falloff
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Fill the circle with the gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    
    // Create and return a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }

  // Estimate quality factor based on device performance
  private getQualityFactor(): number {
    // Determine quality factor based on device performance
    // Lower values for better performance
    const width = window.innerWidth;
    if (width <= 768) {
      return 0.7; // Lowest quality for mobile
    } else if (width <= 1024) {
      return 0.8; // Medium quality for tablets
    } else {
      return 0.9; // Higher quality for desktops
    }
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
    this.camera.position.set(0, 0, 6);
    this.camera.lookAt(0, 0, 0);
    if (this.model && this.modelLoaded) {
      this.model.position.set(0, -1, 0);
      this.model.rotation.y = Math.PI / 12;
    }
  }
} 