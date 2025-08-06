/**
 * Refactored Flight Simulator Entry Point
 * Demonstrates the modular architecture with key components extracted
 */

// Import the refactored modules
import { WORLD_BOUNDS, AIRCRAFT_SPECS, CAMERA } from './src/utils/Constants.js';
import * as MathUtils from './src/utils/MathUtils.js';
import { AircraftFactory } from './src/aircraft/AircraftFactory.js';
import { FlightControls } from './src/aircraft/FlightControls.js';

class RefactoredSimulator {
    constructor() {
        // Core properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Control state
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        // Mouse control
        this.mouse = {
            x: 0,
            y: 0,
            isLocked: false
        };
        
        // Camera control
        this.yaw = 0;
        this.pitch = 0;
        
        // Aircraft management
        this.aircraftList = [];
        this.currentAircraft = null;
        this.isFlying = false;
        
        // Character system
        this.character = null;
        this.characterPosition = new THREE.Vector3(0, 0, 5);
        
        // Initialize the simulator
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            CAMERA.FOV,
            window.innerWidth / window.innerHeight,
            CAMERA.NEAR,
            CAMERA.FAR
        );
        this.camera.position.set(0, 2, 5);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // Setup scene
        this.setupLighting();
        this.createGround();
        this.createAircraft();
        this.createCharacter();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    createGround() {
        // Simple grass ground
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Simple runway
        const runwayGeometry = new THREE.PlaneGeometry(200, 10);
        const runwayMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
        runway.rotation.x = -Math.PI / 2;
        runway.position.y = 0.01;
        runway.receiveShadow = true;
        this.scene.add(runway);
    }

    createAircraft() {
        // Create aircraft using the refactored factory
        const aircraftConfigs = [
            { type: 'cessna', x: -20, z: 10, rotation: 0 },
            { type: 'fighter', x: 20, z: -10, rotation: Math.PI / 4 },
            { type: 'helicopter', x: 0, z: 20, rotation: 0 }
        ];

        aircraftConfigs.forEach(config => {
            try {
                const aircraft = AircraftFactory.create(
                    config.type, 
                    config.x, 
                    1, // y position 
                    config.z, 
                    config.rotation
                );
                
                this.scene.add(aircraft.mesh);
                this.aircraftList.push(aircraft);
                
                console.log(`Created ${config.type} aircraft`);
            } catch (error) {
                console.error(`Failed to create ${config.type}:`, error);
            }
        });
    }

    createCharacter() {
        // Simple character representation
        this.character = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169e1 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        this.character.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 12, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.4;
        head.castShadow = true;
        this.character.add(head);
        
        this.character.position.copy(this.characterPosition);
        this.scene.add(this.character);
        
        this.updateWalkingCamera();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        
        // Mouse controls
        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.mouse.isLocked = document.pointerLockElement === this.renderer.domElement;
        });
        
        document.addEventListener('mousemove', (event) => {
            if (this.mouse.isLocked) {
                this.mouse.x = event.movementX;
                this.mouse.y = event.movementY;
            }
        });
    }

    handleKeyDown(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.controls.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.controls.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.controls.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.controls.right = true;
                break;
            case 'Space':
                this.controls.up = true;
                event.preventDefault();
                break;
            case 'ShiftLeft':
                this.controls.down = true;
                break;
            case 'KeyE':
                this.handleInteraction();
                break;
        }
    }

    handleKeyUp(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.controls.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.controls.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.controls.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.controls.right = false;
                break;
            case 'Space':
                this.controls.up = false;
                break;
            case 'ShiftLeft':
                this.controls.down = false;
                break;
        }
    }

    handleInteraction() {
        if (this.isFlying) {
            this.exitAircraft();
        } else {
            this.checkAircraftProximity();
        }
    }

    checkAircraftProximity() {
        const playerPos = this.camera.position;
        const interactionDistance = 8;
        
        for (let aircraft of this.aircraftList) {
            const distance = MathUtils.distance3D(playerPos, aircraft.position);
            if (distance < interactionDistance) {
                this.enterAircraft(aircraft);
                return;
            }
        }
    }

    enterAircraft(aircraft) {
        this.isFlying = true;
        this.currentAircraft = aircraft;
        
        if (this.character) {
            this.character.visible = false;
        }
        
        this.updateFlightCamera();
        this.updateUI();
        console.log(`Entered ${aircraft.type}`);
    }

    exitAircraft() {
        if (this.currentAircraft) {
            // Return aircraft to ground safely
            this.currentAircraft.resetToGround();
            
            // Position character near aircraft
            this.characterPosition.copy(this.currentAircraft.position);
            this.characterPosition.x += 5;
            this.characterPosition.y = 0;
            
            if (this.character) {
                this.character.visible = true;
                this.character.position.copy(this.characterPosition);
            }
            
            this.isFlying = false;
            this.currentAircraft = null;
            
            this.updateWalkingCamera();
            this.updateUI();
            console.log('Exited aircraft');
        }
    }

    updateMovement() {
        if (this.isFlying) {
            this.updateFlightControls();
        } else {
            this.updateWalkingMovement();
        }
    }

    updateFlightControls() {
        if (!this.currentAircraft) return;
        
        // Use the refactored flight controls
        FlightControls.updateAircraftControls(
            this.currentAircraft, 
            this.controls, 
            WORLD_BOUNDS
        );
        
        this.updateFlightCamera();
    }

    updateWalkingMovement() {
        let moveForward = 0;
        let moveRight = 0;
        
        if (this.controls.forward) moveForward = 1;
        if (this.controls.backward) moveForward = -1;
        if (this.controls.right) moveRight = 1;
        if (this.controls.left) moveRight = -1;
        
        if (moveForward !== 0 || moveRight !== 0) {
            // Normalize movement
            if (moveForward !== 0 || moveRight !== 0) {
                const length = Math.sqrt(moveForward * moveForward + moveRight * moveRight);
                moveForward /= length;
                moveRight /= length;
            }
            
            // Calculate movement direction
            const forwardDir = MathUtils.forwardDirection(this.yaw);
            const rightDir = MathUtils.rightDirection(this.yaw);
            
            this.characterPosition.x += (forwardDir.x * moveForward + rightDir.x * moveRight) * 0.2;
            this.characterPosition.z += (forwardDir.z * moveForward + rightDir.z * moveRight) * 0.2;
            
            // Apply boundary constraints
            this.characterPosition.x = MathUtils.clamp(this.characterPosition.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
            this.characterPosition.z = MathUtils.clamp(this.characterPosition.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
        }
        
        this.character.position.copy(this.characterPosition);
        this.updateWalkingCamera();
    }

    updateFlightCamera() {
        if (this.currentAircraft) {
            const aircraft = this.currentAircraft;
            const yaw = aircraft.rotation.y;
            
            // Position camera behind aircraft
            const backwardX = -Math.cos(yaw) * CAMERA.FLIGHT_DISTANCE;
            const backwardZ = Math.sin(yaw) * CAMERA.FLIGHT_DISTANCE;
            
            this.camera.position.set(
                aircraft.position.x + backwardX,
                aircraft.position.y + CAMERA.FLIGHT_HEIGHT,
                aircraft.position.z + backwardZ
            );
            
            // Look ahead of aircraft
            const forwardX = aircraft.position.x + Math.cos(yaw) * 5;
            const forwardZ = aircraft.position.z - Math.sin(yaw) * 5;
            this.camera.lookAt(forwardX, aircraft.position.y, forwardZ);
        }
    }

    updateWalkingCamera() {
        if (this.character) {
            const backwardX = Math.sin(this.yaw) * CAMERA.WALKING_DISTANCE;
            const backwardZ = Math.cos(this.yaw) * CAMERA.WALKING_DISTANCE;
            
            this.camera.position.set(
                this.characterPosition.x + backwardX,
                this.characterPosition.y + CAMERA.WALKING_HEIGHT,
                this.characterPosition.z + backwardZ
            );
            
            this.camera.lookAt(
                this.characterPosition.x,
                this.characterPosition.y + 1.5,
                this.characterPosition.z
            );
        }
    }

    updateMouseLook() {
        if (this.mouse.isLocked && !this.isFlying) {
            this.yaw -= this.mouse.x * 0.002;
            this.pitch -= this.mouse.y * 0.002;
            this.pitch = MathUtils.clamp(this.pitch, -Math.PI / 2, Math.PI / 2);
        }
        
        this.mouse.x = 0;
        this.mouse.y = 0;
    }

    updateUI() {
        const infoElement = document.getElementById('info');
        if (infoElement) {
            if (this.isFlying && this.currentAircraft) {
                const aircraft = this.currentAircraft;
                const status = aircraft.getStatus();
                infoElement.innerHTML = `
                    <h3>Flight Mode - ${status.type.charAt(0).toUpperCase() + status.type.slice(1)}</h3>
                    <p><strong>Controls:</strong> WASD - Move, Space/Shift - Throttle, E - Exit</p>
                    <p>Speed: ${(status.speed * 100).toFixed(0)}% | Alt: ${status.altitude.toFixed(1)}m</p>
                    <p>Status: ${status.phase}</p>
                `;
            } else {
                infoElement.innerHTML = `
                    <h3>Refactored Flight Simulator</h3>
                    <p><strong>Controls:</strong> WASD - Move, Mouse - Look, E - Enter Aircraft</p>
                    <p>Click to lock mouse</p>
                    <p>Architecture: Modular with ${this.aircraftList.length} aircraft</p>
                `;
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateMovement();
        this.updateMouseLook();
        this.updateUI();
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the refactored simulator
window.addEventListener('load', () => {
    try {
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js is not loaded');
        }
        console.log('Refactored Flight Simulator initialized');
        new RefactoredSimulator();
    } catch (error) {
        console.error('Failed to initialize refactored simulator:', error);
        const infoElement = document.getElementById('info');
        if (infoElement) {
            infoElement.innerHTML = `
                <h3>Error: Failed to load refactored simulator</h3>
                <p>Error: ${error.message}</p>
                <p>Note: ES6 modules require a web server to run properly.</p>
                <p>Try using a local web server or check the console for details.</p>
            `;
        }
    }
});