/**
 * Character Controller Module
 * Handles character movement, controls, and interactions
 */

import { MOVEMENT, WORLD_BOUNDS } from '../utils/Constants.js';
import * as MathUtils from '../utils/MathUtils.js';

export class CharacterController {
    constructor(character, input, camera) {
        this.character = character;
        this.input = input;
        this.camera = camera;
        
        this.yaw = 0;
        this.pitch = 0;
        this.mouseSensitivity = MOVEMENT.MOUSE_SENSITIVITY;
        this.moveSpeed = MOVEMENT.MOVE_SPEED;
        
        this.setupInputHandlers();
    }
    
    /**
     * Setup input event handlers
     */
    setupInputHandlers() {
        // Mouse movement for camera look
        this.input.on('mousemove', (event, mouse) => {
            if (mouse.isLocked) {
                this.handleMouseLook(mouse.deltaX, mouse.deltaY);
            }
        });
        
        // Key interactions
        this.input.on('keydown', (event, keys) => {
            if (event.code === 'KeyE') {
                this.handleInteraction();
            }
        });
    }
    
    /**
     * Update character movement and camera
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        const controls = this.input.getMovementControls();
        
        // Calculate movement
        const movement = this.calculateMovement(controls, deltaTime);
        
        // Apply movement
        if (movement.length() > 0) {
            this.character.move(movement);
            this.constrainToWorldBounds();
            this.character.updateAnimation(true, deltaTime);
        } else {
            this.character.updateAnimation(false, deltaTime);
        }
        
        // Update camera
        this.camera.updateWalkingPosition(
            this.character.getPosition(), 
            this.yaw
        );
    }
    
    /**
     * Calculate movement vector based on input
     * @param {Object} controls - Control state
     * @param {number} deltaTime - Time delta
     * @returns {THREE.Vector3} Movement vector
     */
    calculateMovement(controls, deltaTime) {
        let moveForward = 0;
        let moveRight = 0;
        
        if (controls.forward) moveForward = 1;
        if (controls.backward) moveForward = -1;
        if (controls.right) moveRight = 1;
        if (controls.left) moveRight = -1;
        
        // Normalize diagonal movement
        if (moveForward !== 0 && moveRight !== 0) {
            const length = Math.sqrt(moveForward * moveForward + moveRight * moveRight);
            moveForward /= length;
            moveRight /= length;
        }
        
        // Calculate movement direction based on camera yaw
        const forwardDir = MathUtils.forwardDirection(this.yaw);
        const rightDir = MathUtils.rightDirection(this.yaw);
        
        const movement = new THREE.Vector3(
            (forwardDir.x * moveForward + rightDir.x * moveRight) * this.moveSpeed,
            0,
            (forwardDir.z * moveForward + rightDir.z * moveRight) * this.moveSpeed
        );
        
        return movement;
    }
    
    /**
     * Handle mouse look for camera rotation
     * @param {number} deltaX - Mouse X movement
     * @param {number} deltaY - Mouse Y movement
     */
    handleMouseLook(deltaX, deltaY) {
        this.yaw -= deltaX * this.mouseSensitivity;
        this.pitch -= deltaY * this.mouseSensitivity;
        
        // Constrain pitch
        this.pitch = MathUtils.clamp(this.pitch, -Math.PI / 2, Math.PI / 2);
        
        // Normalize yaw
        this.yaw = MathUtils.normalizeAngle(this.yaw);
        
        // Reset mouse delta after processing
        this.input.resetMouseDelta();
    }
    
    /**
     * Handle interaction (E key)
     */
    handleInteraction() {
        // This will be called by the main game loop to check for aircraft proximity
        // The actual interaction logic is handled in the main simulator
        return {
            type: 'interact',
            position: this.character.getPosition()
        };
    }
    
    /**
     * Constrain character position to world bounds
     */
    constrainToWorldBounds() {
        const position = this.character.getPosition();
        
        position.x = MathUtils.clamp(position.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
        position.z = MathUtils.clamp(position.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
        position.y = Math.max(position.y, WORLD_BOUNDS.minY);
        
        this.character.setPosition(position);
    }
    
    /**
     * Set character position
     * @param {THREE.Vector3} position - New position
     */
    setPosition(position) {
        this.character.setPosition(position);
    }
    
    /**
     * Get current character position
     * @returns {THREE.Vector3}
     */
    getPosition() {
        return this.character.getPosition();
    }
    
    /**
     * Get current yaw rotation
     * @returns {number}
     */
    getYaw() {
        return this.yaw;
    }
    
    /**
     * Set character visibility
     * @param {boolean} visible - Visibility state
     */
    setVisible(visible) {
        this.character.setVisible(visible);
    }
    
    /**
     * Check if near any object in given list
     * @param {Array} objects - List of objects to check
     * @param {number} maxDistance - Maximum interaction distance
     * @returns {Object|null} Nearest interactable object or null
     */
    getNearestInteractable(objects, maxDistance = 8) {
        const characterPos = this.character.getPosition();
        let nearest = null;
        let nearestDistance = maxDistance;
        
        objects.forEach(obj => {
            const distance = MathUtils.distance3D(characterPos, obj.position);
            if (distance < nearestDistance) {
                nearest = obj;
                nearestDistance = distance;
            }
        });
        
        return nearest;
    }
    
    /**
     * Enable/disable mouse look
     * @param {boolean} enabled - Whether mouse look is enabled
     */
    setMouseLookEnabled(enabled) {
        if (enabled) {
            this.input.requestPointerLock(document.body);
        } else {
            this.input.exitPointerLock();
        }
    }
}