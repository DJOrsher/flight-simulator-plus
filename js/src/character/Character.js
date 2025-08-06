/**
 * Character Module
 * Handles the walking character model and its properties
 */

import { MOVEMENT } from '../utils/Constants.js';
import * as GeometryFactory from '../utils/GeometryFactory.js';

export class Character {
    constructor(position = { x: 0, y: 0, z: 5 }) {
        this.mesh = null;
        this.position = new THREE.Vector3(position.x, position.y, position.z);
        this.rotation = new THREE.Vector3(0, 0, 0);
        this.isVisible = true;
        this.animations = {
            walking: false,
            walkCycle: 0
        };
        
        this.init();
    }
    
    /**
     * Initialize the character mesh
     */
    init() {
        this.createCharacterMesh();
    }
    
    /**
     * Create the 3D character model
     */
    createCharacterMesh() {
        this.mesh = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169e1 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 12, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.4;
        head.castShadow = true;
        this.mesh.add(head);
        
        // Arms
        this.createLimbs();
        
        // Set initial position
        this.mesh.position.copy(this.position);
    }
    
    /**
     * Create character limbs (arms and legs)
     */
    createLimbs() {
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.8, 6);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
        
        // Left arm
        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.4, 0.8, 0);
        this.leftArm.castShadow = true;
        this.mesh.add(this.leftArm);
        
        // Right arm
        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.4, 0.8, 0);
        this.rightArm.castShadow = true;
        this.mesh.add(this.rightArm);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        
        // Left leg
        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.15, -0.2, 0);
        this.leftLeg.castShadow = true;
        this.mesh.add(this.leftLeg);
        
        // Right leg
        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.15, -0.2, 0);
        this.rightLeg.castShadow = true;
        this.mesh.add(this.rightLeg);
    }
    
    /**
     * Update character position
     * @param {THREE.Vector3} newPosition - New position
     */
    setPosition(newPosition) {
        this.position.copy(newPosition);
        this.mesh.position.copy(this.position);
    }
    
    /**
     * Move character by offset
     * @param {THREE.Vector3} offset - Movement offset
     */
    move(offset) {
        this.position.add(offset);
        this.mesh.position.copy(this.position);
    }
    
    /**
     * Set character visibility
     * @param {boolean} visible - Visibility state
     */
    setVisible(visible) {
        this.isVisible = visible;
        this.mesh.visible = visible;
    }
    
    /**
     * Update walking animation
     * @param {boolean} isMoving - Whether character is moving
     * @param {number} deltaTime - Time since last frame
     */
    updateAnimation(isMoving, deltaTime) {
        if (isMoving) {
            this.animations.walking = true;
            this.animations.walkCycle += deltaTime * 0.01;
            
            // Animate arms and legs swinging
            const swing = Math.sin(this.animations.walkCycle) * 0.5;
            
            if (this.leftArm && this.rightArm) {
                this.leftArm.rotation.x = swing;
                this.rightArm.rotation.x = -swing;
            }
            
            if (this.leftLeg && this.rightLeg) {
                this.leftLeg.rotation.x = -swing;
                this.rightLeg.rotation.x = swing;
            }
        } else {
            this.animations.walking = false;
            
            // Reset limb positions
            if (this.leftArm && this.rightArm) {
                this.leftArm.rotation.x = 0;
                this.rightArm.rotation.x = 0;
            }
            
            if (this.leftLeg && this.rightLeg) {
                this.leftLeg.rotation.x = 0;
                this.rightLeg.rotation.x = 0;
            }
        }
    }
    
    /**
     * Set character rotation
     * @param {number} yaw - Y-axis rotation in radians
     */
    setRotation(yaw) {
        this.rotation.y = yaw;
        this.mesh.rotation.y = yaw;
    }
    
    /**
     * Get character mesh for adding to scene
     * @returns {THREE.Group}
     */
    getMesh() {
        return this.mesh;
    }
    
    /**
     * Get current position
     * @returns {THREE.Vector3}
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * Get current rotation
     * @returns {THREE.Vector3}
     */
    getRotation() {
        return this.rotation.clone();
    }
    
    /**
     * Check if character is visible
     * @returns {boolean}
     */
    isCharacterVisible() {
        return this.isVisible;
    }
    
    /**
     * Dispose of character resources
     */
    dispose() {
        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}