/**
 * Base Aircraft Class
 * Common properties and methods for all aircraft types
 */

import { AIRCRAFT_SPECS } from '../utils/Constants.js';

export class Aircraft {
    constructor(type, position, rotation = { x: 0, y: 0, z: 0 }) {
        // Validate aircraft type
        if (!AIRCRAFT_SPECS[type]) {
            throw new Error(`Unknown aircraft type: ${type}`);
        }

        // Basic properties
        this.type = type;
        this.mesh = null; // Will be set by the factory
        this.specs = AIRCRAFT_SPECS[type];
        
        // Position and rotation
        this.position = new THREE.Vector3(position.x, position.y, position.z);
        this.rotation = new THREE.Vector3(rotation.x, rotation.y, rotation.z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        // Flight properties
        this.speed = 0;
        this.maxSpeed = this.specs.maxSpeed;
        this.acceleration = this.specs.acceleration;
        this.turnRate = this.specs.turnRate;
        
        // State properties
        this.isActive = false;
        this.automatedFlight = null;
        
        // Initialize aircraft-specific properties
        this.initializeSpecificProperties();
    }

    /**
     * Initialize properties specific to aircraft type
     * Override in subclasses for type-specific initialization
     */
    initializeSpecificProperties() {
        // Base implementation - can be overridden
    }

    /**
     * Get the minimum flight height for this aircraft
     * @returns {number} Minimum height above ground
     */
    getMinimumFlightHeight() {
        return this.specs.minFlightHeight;
    }

    /**
     * Get aircraft length for collision calculations
     * @returns {number} Aircraft length
     */
    getLength() {
        return this.specs.length;
    }

    /**
     * Get aircraft height for collision calculations
     * @returns {number} Aircraft height
     */
    getHeight() {
        return this.specs.height;
    }

    /**
     * Update aircraft position based on current velocity
     */
    updatePosition() {
        this.position.add(this.velocity);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    /**
     * Apply rotation to the aircraft mesh
     */
    updateRotation() {
        if (this.mesh) {
            this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        }
    }

    /**
     * Set aircraft position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     */
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    /**
     * Set aircraft rotation
     * @param {number} x - X rotation (pitch)
     * @param {number} y - Y rotation (yaw)
     * @param {number} z - Z rotation (roll)
     */
    setRotation(x, y, z) {
        this.rotation.set(x, y, z);
        if (this.mesh) {
            this.mesh.rotation.set(x, y, z);
        }
    }

    /**
     * Get aircraft's forward direction vector
     * @returns {THREE.Vector3} Forward direction
     */
    getForwardDirection() {
        return new THREE.Vector3(
            Math.cos(this.rotation.y),
            0,
            -Math.sin(this.rotation.y)
        );
    }

    /**
     * Calculate velocity based on current heading and speed
     */
    calculateVelocity() {
        const forward = this.getForwardDirection();
        this.velocity.copy(forward).multiplyScalar(this.speed);
    }

    /**
     * Apply physics updates specific to aircraft type
     * Override in subclasses for type-specific physics
     */
    updatePhysics() {
        // Base implementation - can be overridden
        this.calculateVelocity();
    }

    /**
     * Check if aircraft is airborne
     * @returns {boolean} True if aircraft is in the air
     */
    isAirborne() {
        return this.position.y > this.getMinimumFlightHeight() + 5;
    }

    /**
     * Reset aircraft to ground state
     */
    resetToGround() {
        this.speed = 0;
        this.velocity.set(0, 0, 0);
        this.rotation.z = 0; // Level aircraft
        this.position.y = this.getMinimumFlightHeight();
        this.isActive = false;
        this.automatedFlight = null;
    }

    /**
     * Get aircraft's current status for UI display
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            type: this.type,
            speed: this.speed,
            altitude: this.position.y,
            isActive: this.isActive,
            isAirborne: this.isAirborne(),
            phase: this.automatedFlight ? this.automatedFlight.phase : 'parked'
        };
    }

    /**
     * Start automated flight with given configuration
     * @param {Object} flightConfig - Flight configuration
     */
    startAutomatedFlight(flightConfig) {
        this.isActive = true;
        this.automatedFlight = {
            phase: 'initializing',
            timer: 0,
            ...flightConfig
        };
    }

    /**
     * Stop automated flight and return to manual control
     */
    stopAutomatedFlight() {
        this.automatedFlight = null;
        this.isActive = false;
    }

    /**
     * Update automated flight logic
     * Override in subclasses for type-specific automation
     */
    updateAutomatedFlight() {
        if (!this.automatedFlight) return;
        
        this.automatedFlight.timer += 1;
        // Base implementation - should be overridden
    }

    /**
     * Dispose of aircraft resources
     */
    dispose() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        this.mesh = null;
    }
}