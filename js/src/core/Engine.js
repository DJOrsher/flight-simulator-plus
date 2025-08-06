/**
 * Main Engine Module
 * Orchestrates all systems and manages the game loop
 */

// Core modules
import { Scene } from './Scene.js';
import { Camera } from './Camera.js';
import { Input } from './Input.js';

// Character system
import { Character } from '../character/Character.js';
import { CharacterController } from '../character/CharacterController.js';

// Aircraft system
import { AircraftFactory } from '../aircraft/AircraftFactory.js';
import { FlightControls } from '../aircraft/FlightControls.js';

// Environment
import { Environment } from '../environment/Environment.js';

// Control tower
import { ControlTower } from '../control-tower/ControlTower.js';

// UI system
import { UIManager } from '../ui/UIManager.js';

// Utilities
import { WORLD_BOUNDS } from '../utils/Constants.js';
import * as MathUtils from '../utils/MathUtils.js';

export class Engine {
    constructor() {
        // Core systems
        this.scene = null;
        this.camera = null;
        this.input = null;
        this.uiManager = null;
        
        // Game systems
        this.character = null;
        this.characterController = null;
        this.environment = null;
        this.controlTower = null;
        
        // Aircraft management
        this.aircraftList = [];
        this.currentAircraft = null;
        
        // Game state
        this.gameMode = 'walking'; // 'walking', 'flight', 'tower'
        this.isRunning = false;
        this.lastTime = 0;
        
        // Animation frame
        this.animationId = null;
        
    }
    
    /**
     * Initialize the engine
     */
    async init() {
        try {
            console.log('Initializing Flight Simulator Engine...');
            
            this.scene = new Scene();
            console.log('Scene initialized');
            
            this.camera = new Camera();
            console.log('Camera initialized');
            
            this.input = new Input();
            console.log('Input initialized');
            
            this.uiManager = new UIManager();
            console.log('UIManager initialized');
            
            this.environment = new Environment(this.scene.getScene());
            console.log('Environment initialized');
            
            this.character = new Character();
            console.log('Character initialized');
            
            this.characterController = new CharacterController(this.character, this.input, this.camera);
            console.log('CharacterController initialized');
            
            this.scene.add(this.character.getMesh());
            
            await this.createAircraft();
            console.log('Aircraft created');
            
            this.controlTower = new ControlTower(this.aircraftList, this.environment);
            console.log('ControlTower initialized');
            
            setTimeout(() => {
                this.addGroundVehiclesToScene();
            }, 100);
            
            this.setupInputHandlers();
            console.log('Input handlers set up');
            
            console.log('Flight Simulator Engine initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize engine:', error);
            this.uiManager.showNotification('Failed to initialize simulator', 5000, 'error');
        }
    }
    
    /**
     * Create aircraft fleet
     */
    async createAircraft() {
        const aircraftConfigs = [
            { type: 'cessna', x: -20, z: 25, rotation: 0 },
            { type: 'fighter', x: 20, z: 25, rotation: Math.PI / 4 },
            { type: 'airliner', x: 0, z: 40, rotation: 0 },
            { type: 'cargo', x: 40, z: 25, rotation: -Math.PI / 4 },
            { type: 'helicopter', x: -80, z: -30, rotation: 0 }
        ];
        
        this.aircraftList = [];
        
        for (const config of aircraftConfigs) {
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
                console.error(`Failed to create ${config.type} aircraft:`, error);
            }
        }
        
        // Note: Ground vehicles are added after control tower initialization
    }
    
    /**
     * Setup input event handlers
     */
    setupInputHandlers() {
        // Interaction handler
        this.input.on('keydown', (event, keys) => {
            if (event.code === 'KeyE') {
                this.handleInteraction();
            }
        });
        
        // Mouse lock for camera
        this.scene.getRenderer().domElement.addEventListener('click', () => {
            if (this.gameMode === 'walking') {
                this.input.requestPointerLock(this.scene.getRenderer().domElement);
            }
        });
    }
    
    /**
     * Handle interaction (E key)
     */
    handleInteraction() {
        switch (this.gameMode) {
            case 'walking':
                this.handleWalkingInteraction();
                break;
                
            case 'flight':
                this.exitAircraft();
                break;
                
            case 'tower':
                this.exitControlTower();
                break;
        }
    }
    
    /**
     * Handle walking mode interaction
     */
    handleWalkingInteraction() {
        // Check for aircraft proximity
        const nearestAircraft = this.characterController.getNearestInteractable(
            this.aircraftList, 8
        );
        
        if (nearestAircraft) {
            this.enterAircraft(nearestAircraft);
            return;
        }
        
        // Check for control tower proximity
        const towerPosition = this.environment.getControlTowerPosition();
        const characterPosition = this.characterController.getPosition();
        const distanceToTower = MathUtils.distance3D(characterPosition, towerPosition);
        
        if (distanceToTower < 15) {
            this.enterControlTower();
            return;
        }
        
        this.uiManager.showNotification('Nothing to interact with nearby', 2000, 'info');
    }
    
    /**
     * Enter aircraft
     * @param {Aircraft} aircraft - Aircraft to enter
     */
    enterAircraft(aircraft) {
        this.currentAircraft = aircraft;
        this.gameMode = 'flight';
        
        // Hide character
        this.characterController.setVisible(false);
        
        // Switch camera to flight mode
        this.camera.setFlightMode(aircraft.position, aircraft.rotation.y);
        
        // Update UI
        this.uiManager.updateMode('flight', {
            aircraft: aircraft,
            aircraftType: aircraft.type,
            position: aircraft.position,
            speed: aircraft.speed
        });
        
        this.uiManager.showNotification(`Entered ${aircraft.type}`, 2000, 'success');
        console.log(`Entered ${aircraft.type}`);
    }
    
    /**
     * Exit aircraft
     */
    exitAircraft() {
        if (!this.currentAircraft) return;
        
        // Land aircraft safely
        this.currentAircraft.resetToGround();
        
        // Position character near aircraft
        const aircraftPos = this.currentAircraft.position.clone();
        aircraftPos.x += 5;
        aircraftPos.y = 0;
        aircraftPos.z += 5;
        this.characterController.setPosition(aircraftPos);
        
        // Show character
        this.characterController.setVisible(true);
        
        // Switch camera to walking mode
        this.camera.setWalkingMode(aircraftPos, this.characterController.getYaw());
        
        // Reset game mode
        this.gameMode = 'walking';
        this.currentAircraft = null;
        
        // Update UI
        this.uiManager.updateMode('walking', {
            position: aircraftPos
        });
        
        this.uiManager.showNotification('Exited aircraft', 2000, 'info');
        console.log('Exited aircraft');
    }
    
    /**
     * Enter control tower
     */
    enterControlTower() {
        this.gameMode = 'tower';
        
        // Hide character
        this.characterController.setVisible(false);
        
        // Switch camera to tower mode
        const towerPosition = this.environment.getControlTowerPosition();
        this.camera.setControlTowerMode(towerPosition);
        
        // Activate control tower
        this.controlTower.enter();
        
        // Update UI
        this.uiManager.updateMode('tower', this.controlTower.getStatus());
        
        this.uiManager.showNotification('Entered Control Tower', 2000, 'success');
    }
    
    /**
     * Exit control tower
     */
    exitControlTower() {
        // Show character
        this.characterController.setVisible(true);
        
        // Switch camera back to walking mode
        const characterPos = this.characterController.getPosition();
        this.camera.setWalkingMode(characterPos, this.characterController.getYaw());
        
        // Deactivate control tower
        this.controlTower.exit();
        
        // Reset game mode
        this.gameMode = 'walking';
        
        // Update UI
        this.uiManager.updateMode('walking', {
            position: characterPos
        });
        
        this.uiManager.showNotification('Exited Control Tower', 2000, 'info');
    }
    
    /**
     * Start the game loop
     */
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update systems
        try {
            this.update(deltaTime);
        } catch (error) {
            console.error('Error during update:', error);
            this.stop(); // Stop the loop to prevent further errors
            return;
        }
        
        // Render
        try {
            this.render();
        } catch (error) {
            console.error('Error during render:', error);
            this.stop();
            return;
        }
        
        // Schedule next frame
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Update all systems
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Update based on current mode
        switch (this.gameMode) {
            case 'walking':
                this.updateWalkingMode(deltaTime);
                break;
                
            case 'flight':
                this.updateFlightMode(deltaTime);
                break;
                
            case 'tower':
                this.updateTowerMode(deltaTime);
                break;
        }
        
        // Always update control tower (for dispatched aircraft)
        this.controlTower.update(deltaTime);
        
        // Update ground operations (vehicles and landing state machine)
        this.controlTower.flightAutomation.updateGroundOperations(deltaTime);
    }
    
    /**
     * Update walking mode
     * @param {number} deltaTime - Time delta
     */
    updateWalkingMode(deltaTime) {
        // Update character controller
        this.characterController.update(deltaTime);
        
        // Update UI with current character data
        this.uiManager.updateCharacterPosition({
            position: this.characterController.getPosition()
        });
    }
    
    /**
     * Update flight mode
     * @param {number} deltaTime - Time delta
     */
    updateFlightMode(deltaTime) {
        if (!this.currentAircraft) return;
        
        // Update flight controls
        const controls = this.input.getMovementControls();
        FlightControls.updateAircraftControls(
            this.currentAircraft,
            controls,
            WORLD_BOUNDS
        );
        
        // Update camera
        this.camera.updateFlightPosition(
            this.currentAircraft.position,
            this.currentAircraft.rotation.y
        );
        
        // Update UI with aircraft data
        this.uiManager.updateAircraftInfo({
            aircraft: this.currentAircraft,
            position: this.currentAircraft.position,
            speed: this.currentAircraft.speed
        });
    }
    
    /**
     * Update tower mode
     * @param {number} deltaTime - Time delta
     */
    updateTowerMode(deltaTime) {
        // Update UI with control tower status
        this.uiManager.updateControlTowerStatus(this.controlTower.getStatus());
    }
    
    /**
     * Render the scene
     */
    render() {
        this.scene.render(this.camera.getCamera());
    }
    
    /**
     * Get current game state
     * @returns {Object} Game state
     */
    getGameState() {
        return {
            mode: this.gameMode,
            isRunning: this.isRunning,
            aircraftCount: this.aircraftList.length,
            currentAircraft: this.currentAircraft ? this.currentAircraft.type : null,
            characterPosition: this.characterController.getPosition()
        };
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.onWindowResize();
        this.scene.onWindowResize();
    }
    
    /**
     * Dispose of engine resources
     */
    dispose() {
        console.log('Disposing engine resources...');
        
        this.stop();
        
        // Dispose systems
        if (this.controlTower) this.controlTower.dispose();
        if (this.environment) this.environment.dispose();
        if (this.character) this.character.dispose();
        if (this.uiManager) this.uiManager.dispose();
        
        // Dispose aircraft
        this.aircraftList.forEach(aircraft => {
            if (aircraft.dispose) aircraft.dispose();
        });
        
        this.aircraftList = [];
    }
    
    /**
     * Add ground support vehicles to scene
     */
    addGroundVehiclesToScene() {
        if (this.controlTower && this.controlTower.flightAutomation) {
            const vehicleMeshes = this.controlTower.flightAutomation.getGroundVehicleMeshes();
            vehicleMeshes.forEach(vehicleMesh => {
                this.scene.add(vehicleMesh);
                console.log('Added ground support vehicle to scene');
            });
        }
    }
}