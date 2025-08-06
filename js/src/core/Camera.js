/**
 * Camera Management Module
 * Handles different camera modes and transitions
 */

import { CAMERA } from '../utils/Constants.js';

export class Camera {
    constructor() {
        this.camera = null;
        this.currentMode = 'walking';
        this.previousMode = null;
        
        this.init();
    }
    
    /**
     * Initialize the camera
     */
    init() {
        this.camera = new THREE.PerspectiveCamera(
            CAMERA.FOV,
            window.innerWidth / window.innerHeight,
            CAMERA.NEAR,
            CAMERA.FAR
        );
        
        // Default walking position
        this.camera.position.set(0, CAMERA.WALKING_HEIGHT, CAMERA.WALKING_DISTANCE);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * Switch to walking mode
     * @param {THREE.Vector3} characterPosition - Character position
     * @param {number} yaw - Character yaw rotation
     */
    setWalkingMode(characterPosition, yaw) {
        this.currentMode = 'walking';
        this.updateWalkingPosition(characterPosition, yaw);
    }
    
    /**
     * Switch to flight mode
     * @param {THREE.Vector3} aircraftPosition - Aircraft position
     * @param {number} yaw - Aircraft yaw rotation
     */
    setFlightMode(aircraftPosition, yaw) {
        this.currentMode = 'flight';
        this.updateFlightPosition(aircraftPosition, yaw);
    }
    
    /**
     * Switch to control tower mode
     * @param {THREE.Vector3} towerPosition - Tower position
     */
    setControlTowerMode(towerPosition) {
        this.currentMode = 'tower';
        this.updateTowerPosition(towerPosition);
    }
    
    /**
     * Update walking camera position
     * @param {THREE.Vector3} characterPosition - Character position
     * @param {number} yaw - Character yaw rotation
     */
    updateWalkingPosition(characterPosition, yaw) {
        if (this.currentMode !== 'walking') return;
        
        // Position camera behind character
        const backwardX = Math.sin(yaw) * CAMERA.WALKING_DISTANCE;
        const backwardZ = Math.cos(yaw) * CAMERA.WALKING_DISTANCE;
        
        this.camera.position.set(
            characterPosition.x + backwardX,
            characterPosition.y + CAMERA.WALKING_HEIGHT,
            characterPosition.z + backwardZ
        );
        
        // Look at character
        this.camera.lookAt(
            characterPosition.x,
            characterPosition.y + 1.5,
            characterPosition.z
        );
    }
    
    /**
     * Update flight camera position
     * @param {THREE.Vector3} aircraftPosition - Aircraft position
     * @param {number} yaw - Aircraft yaw rotation
     */
    updateFlightPosition(aircraftPosition, yaw) {
        if (this.currentMode !== 'flight') return;
        
        // Position camera behind aircraft
        const backwardX = -Math.cos(yaw) * CAMERA.FLIGHT_DISTANCE;
        const backwardZ = Math.sin(yaw) * CAMERA.FLIGHT_DISTANCE;
        
        this.camera.position.set(
            aircraftPosition.x + backwardX,
            aircraftPosition.y + CAMERA.FLIGHT_HEIGHT,
            aircraftPosition.z + backwardZ
        );
        
        // Look ahead of aircraft
        const forwardX = aircraftPosition.x + Math.cos(yaw) * 5;
        const forwardZ = aircraftPosition.z - Math.sin(yaw) * 5;
        this.camera.lookAt(forwardX, aircraftPosition.y, forwardZ);
    }
    
    /**
     * Update control tower camera position
     * @param {THREE.Vector3} towerPosition - Tower position
     */
    updateTowerPosition(towerPosition) {
        if (this.currentMode !== 'tower') return;
        
        // Fixed position in tower
        this.camera.position.set(
            towerPosition.x,
            towerPosition.y + 25, // High up in tower
            towerPosition.z
        );
        
        // Look out over airfield
        this.camera.lookAt(0, 5, 0);
    }
    
    /**
     * Apply mouse look (for first-person perspective)
     * @param {number} deltaX - Mouse movement X
     * @param {number} deltaY - Mouse movement Y
     * @param {number} sensitivity - Mouse sensitivity
     */
    applyMouseLook(deltaX, deltaY, sensitivity) {
        // This would be used for first-person mode
        // Currently using third-person, so mouse look affects character/aircraft rotation instead
    }
    
    /**
     * Get the Three.js camera
     * @returns {THREE.PerspectiveCamera}
     */
    getCamera() {
        return this.camera;
    }
    
    /**
     * Get current camera mode
     * @returns {string}
     */
    getCurrentMode() {
        return this.currentMode;
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
    
    /**
     * Smooth camera transition between modes
     * @param {THREE.Vector3} targetPosition - Target position
     * @param {THREE.Vector3} targetLookAt - Target look-at position
     * @param {number} duration - Transition duration in ms
     */
    smoothTransition(targetPosition, targetLookAt, duration = 1000) {
        // TODO: Implement smooth camera transitions using tweening
        // For now, just set position directly
        this.camera.position.copy(targetPosition);
        this.camera.lookAt(targetLookAt);
    }
}