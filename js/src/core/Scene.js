/**
 * Scene Management Module
 * Handles Three.js scene setup, lighting, and environment management
 */

import { WORLD_BOUNDS, COLORS } from '../utils/Constants.js';

export class Scene {
    constructor() {
        console.log('Scene constructor called');
        this.scene = null;
        this.renderer = null;
        this.lighting = {};
        this.environment = {};
        
        this.init();
    }
    
    /**
     * Initialize the Three.js scene
     */
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        // Setup lighting
        this.setupLighting();
        
        // Setup environment
        this.setupEnvironment();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * Setup scene lighting
     */
    setupLighting() {
        // Ambient light
        this.lighting.ambient = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(this.lighting.ambient);
        
        // Directional light (sun)
        this.lighting.directional = new THREE.DirectionalLight(0xffffff, 0.8);
        this.lighting.directional.position.set(100, 100, 50);
        this.lighting.directional.castShadow = true;
        
        // Shadow camera settings
        this.lighting.directional.shadow.camera.left = -200;
        this.lighting.directional.shadow.camera.right = 200;
        this.lighting.directional.shadow.camera.top = 200;
        this.lighting.directional.shadow.camera.bottom = -200;
        this.lighting.directional.shadow.camera.near = 0.1;
        this.lighting.directional.shadow.camera.far = 500;
        this.lighting.directional.shadow.mapSize.width = 2048;
        this.lighting.directional.shadow.mapSize.height = 2048;
        
        this.scene.add(this.lighting.directional);
    }
    
    /**
     * Setup basic environment
     */
    setupEnvironment() {
        this.createGround();
        this.createWorldBoundaries();
    }
    
    /**
     * Create the ground plane
     */
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: COLORS.GRASS || 0x4a7c59 
        });
        
        this.environment.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.environment.ground.rotation.x = -Math.PI / 2;
        this.environment.ground.receiveShadow = true;
        this.scene.add(this.environment.ground);
    }
    
    /**
     * Create visual world boundaries
     */
    createWorldBoundaries() {
        const boundaryMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.3 
        });
        
        // Create boundary lines
        const points = [
            new THREE.Vector3(WORLD_BOUNDS.minX, 0, WORLD_BOUNDS.minZ),
            new THREE.Vector3(WORLD_BOUNDS.maxX, 0, WORLD_BOUNDS.minZ),
            new THREE.Vector3(WORLD_BOUNDS.maxX, 0, WORLD_BOUNDS.maxZ),
            new THREE.Vector3(WORLD_BOUNDS.minX, 0, WORLD_BOUNDS.maxZ),
            new THREE.Vector3(WORLD_BOUNDS.minX, 0, WORLD_BOUNDS.minZ)
        ];
        
        const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(points);
        this.environment.boundaries = new THREE.Line(boundaryGeometry, boundaryMaterial);
        this.scene.add(this.environment.boundaries);
    }
    
    /**
     * Add object to scene
     * @param {THREE.Object3D} object - Object to add
     */
    add(object) {
        this.scene.add(object);
    }
    
    /**
     * Remove object from scene
     * @param {THREE.Object3D} object - Object to remove
     */
    remove(object) {
        this.scene.remove(object);
    }
    
    /**
     * Get the Three.js scene
     * @returns {THREE.Scene}
     */
    getScene() {
        return this.scene;
    }
    
    /**
     * Get the renderer
     * @returns {THREE.WebGLRenderer}
     */
    getRenderer() {
        return this.renderer;
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Render the scene with given camera
     * @param {THREE.Camera} camera - Camera to render with
     */
    render(camera) {
        this.renderer.render(this.scene, camera);
    }
}