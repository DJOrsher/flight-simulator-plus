/**
 * Flight Physics Engine
 * Handles realistic flight physics for different aircraft types
 */

import { PHYSICS } from '../utils/Constants.js';
import { clamp } from '../utils/MathUtils.js';

export class FlightPhysics {
    
    /**
     * Update aircraft physics based on type and current state
     * @param {Aircraft} aircraft - Aircraft to update
     * @param {Object} controls - Current control inputs
     */
    static updateAircraft(aircraft, controls) {
        if (aircraft.type === 'helicopter') {
            this.updateHelicopterPhysics(aircraft, controls);
        } else {
            this.updateFixedWingPhysics(aircraft, controls);
        }
        
        // Apply common physics
        this.applyGravity(aircraft);
        this.checkGroundCollision(aircraft);
        aircraft.updatePosition();
    }

    /**
     * Update helicopter physics
     * @param {Aircraft} aircraft - Helicopter aircraft
     * @param {Object} controls - Control inputs
     */
    static updateHelicopterPhysics(aircraft, controls) {
        // Helicopter controls: W/S for vertical, A/D for yaw, Space/Shift for throttle
        if (controls.forward) {
            // W key - Collective up (rise vertically)
            aircraft.position.y += 0.5;
        }
        if (controls.backward) {
            // S key - Collective down (descend vertically)
            aircraft.position.y -= 0.5;
        }
        if (controls.left) {
            aircraft.rotation.y += aircraft.turnRate; // Yaw left
        }
        if (controls.right) {
            aircraft.rotation.y -= aircraft.turnRate; // Yaw right
        }
        if (controls.up) {
            aircraft.speed = Math.min(aircraft.maxSpeed, aircraft.speed + aircraft.acceleration);
        }
        if (controls.down) {
            aircraft.speed = Math.max(0, aircraft.speed - aircraft.acceleration);
        }

        // Calculate horizontal movement for helicopters
        const forwardX = Math.cos(aircraft.rotation.y);
        const forwardZ = -Math.sin(aircraft.rotation.y);
        
        aircraft.velocity.set(
            forwardX * aircraft.speed,
            0, // No automatic Y movement - controlled by W/S keys directly
            forwardZ * aircraft.speed
        );
    }

    /**
     * Update fixed-wing aircraft physics
     * @param {Aircraft} aircraft - Fixed-wing aircraft
     * @param {Object} controls - Control inputs
     */
    static updateFixedWingPhysics(aircraft, controls) {
        // Fixed-wing aircraft require airflow for control authority
        const controlAuthority = Math.min(aircraft.speed / PHYSICS.MIN_CONTROL_SPEED, 1.0);
        
        if (controls.forward) {
            aircraft.rotation.z -= aircraft.turnRate * controlAuthority; // Pitch up
        }
        if (controls.backward) {
            aircraft.rotation.z += aircraft.turnRate * controlAuthority; // Pitch down
        }
        if (controls.left) {
            aircraft.rotation.y += aircraft.turnRate * controlAuthority; // Yaw left
        }
        if (controls.right) {
            aircraft.rotation.y -= aircraft.turnRate * controlAuthority; // Yaw right
        }
        if (controls.up) {
            aircraft.speed = Math.min(aircraft.maxSpeed, aircraft.speed + aircraft.acceleration);
        }
        if (controls.down) {
            aircraft.speed = Math.max(0, aircraft.speed - aircraft.acceleration);
        }

        // Clamp pitch to prevent flipping
        aircraft.rotation.z = clamp(aircraft.rotation.z, -Math.PI / 3, Math.PI / 3);

        // Calculate movement based on aircraft orientation
        const forwardX = Math.cos(aircraft.rotation.y) * Math.cos(aircraft.rotation.z);
        const forwardY = Math.sin(aircraft.rotation.z);
        const forwardZ = -Math.sin(aircraft.rotation.y) * Math.cos(aircraft.rotation.z);
        
        aircraft.velocity.set(
            forwardX * aircraft.speed,
            forwardY * aircraft.speed,
            forwardZ * aircraft.speed
        );
    }

    /**
     * Apply gravity effects based on aircraft type and speed
     * @param {Aircraft} aircraft - Aircraft to apply gravity to
     */
    static applyGravity(aircraft) {
        if (aircraft.type === 'helicopter') {
            // Helicopters don't experience traditional gravity when rotors are spinning
            return;
        }

        const baseGravityForce = PHYSICS.GRAVITY;
        const minFlyingSpeed = PHYSICS.MIN_FLYING_SPEED;
        
        if (aircraft.speed <= 0) {
            // Aircraft has no speed - fall faster (stall)
            aircraft.velocity.y += baseGravityForce * 3;
        } else if (aircraft.speed < minFlyingSpeed) {
            // Aircraft is too slow but has some speed - apply normal gravity
            aircraft.velocity.y += baseGravityForce;
        } else {
            // Aircraft has enough speed for lift, reduce gravity effect
            const liftFactor = Math.min(aircraft.speed / minFlyingSpeed, 1.0);
            aircraft.velocity.y += baseGravityForce * (1 - liftFactor);
        }
    }

    /**
     * Check and handle ground collision
     * @param {Aircraft} aircraft - Aircraft to check
     * @returns {boolean} True if collision occurred
     */
    static checkGroundCollision(aircraft) {
        const minGroundHeight = aircraft.getMinimumFlightHeight();
        
        if (aircraft.position.y < minGroundHeight) {
            aircraft.position.y = minGroundHeight;
            
            // Reduce downward velocity when hitting ground
            if (aircraft.velocity.y < 0) {
                aircraft.velocity.y *= 0.1; // Dampen the bounce
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * Apply aircraft rotation with ground clearance checks
     * @param {Aircraft} aircraft - Aircraft to update
     */
    static applyAircraftRotationWithGroundClearance(aircraft) {
        // Calculate aircraft dimensions for ground clearance
        const aircraftLength = aircraft.getLength();
        const aircraftHeight = aircraft.getHeight();
        
        // Calculate the lowest point of the aircraft based on its pitch
        const pitchAngle = aircraft.rotation.z;
        
        // For nose-down pitch (positive pitchAngle), the front gets lower
        // For nose-up pitch (negative pitchAngle), the tail gets lower
        const frontHeight = Math.sin(pitchAngle) * (aircraftLength / 2);
        const rearHeight = -Math.sin(pitchAngle) * (aircraftLength / 2);
        
        // The lowest point of the aircraft (relative to its center)
        const lowestPoint = Math.min(frontHeight, rearHeight) - aircraftHeight / 2;
        
        // Calculate minimum Y position to prevent ground clipping
        const minGroundHeight = aircraft.getMinimumFlightHeight();
        const requiredY = minGroundHeight - lowestPoint;
        
        // Adjust aircraft position if it would clip through ground
        if (aircraft.position.y < requiredY) {
            aircraft.position.y = requiredY;
        }
        
        // Apply the rotation
        aircraft.updateRotation();
    }

    /**
     * Check if aircraft has crashed (was flying and hit ground hard)
     * @param {Aircraft} aircraft - Aircraft to check
     * @param {boolean} wasInFlight - Whether aircraft was previously airborne
     * @returns {boolean} True if crashed
     */
    static checkCrash(aircraft, wasInFlight) {
        if (aircraft.type === 'helicopter') {
            return false; // Helicopters can land vertically
        }
        
        const minGroundHeight = aircraft.getMinimumFlightHeight();
        const justHitGround = aircraft.position.y <= minGroundHeight;
        
        return wasInFlight && justHitGround && aircraft.speed > PHYSICS.MIN_FLYING_SPEED;
    }

    /**
     * Calculate lift force based on aircraft speed and configuration
     * @param {Aircraft} aircraft - Aircraft to calculate lift for
     * @returns {number} Lift force
     */
    static calculateLift(aircraft) {
        if (aircraft.type === 'helicopter') {
            // Helicopters generate lift from rotors, not wings
            return 0;
        }
        
        // Simple lift calculation based on speed
        const speedSquared = aircraft.speed * aircraft.speed;
        const liftCoefficient = 0.1; // Simplified lift coefficient
        
        return liftCoefficient * speedSquared;
    }

    /**
     * Calculate drag force based on aircraft speed
     * @param {Aircraft} aircraft - Aircraft to calculate drag for
     * @returns {number} Drag force
     */
    static calculateDrag(aircraft) {
        const speedSquared = aircraft.speed * aircraft.speed;
        const dragCoefficient = 0.02; // Simplified drag coefficient
        
        return dragCoefficient * speedSquared;
    }

    /**
     * Update aircraft control surfaces based on speed (for visual effects)
     * @param {Aircraft} aircraft - Aircraft to update
     */
    static updateControlSurfaces(aircraft) {
        if (aircraft.type === 'helicopter') {
            return; // Helicopters don't have traditional control surfaces
        }
        
        // Calculate control effectiveness based on airspeed
        const controlEffectiveness = Math.min(aircraft.speed / PHYSICS.MIN_CONTROL_SPEED, 1.0);
        
        // This could be used to animate control surfaces in the future
        aircraft.controlEffectiveness = controlEffectiveness;
    }

    /**
     * Apply boundary constraints to keep aircraft within world bounds
     * @param {Aircraft} aircraft - Aircraft to constrain
     * @param {Object} worldBounds - World boundary limits
     */
    static applyBoundaryConstraints(aircraft, worldBounds) {
        // Constrain X position
        if (aircraft.position.x < worldBounds.minX) {
            aircraft.position.x = worldBounds.minX;
        } else if (aircraft.position.x > worldBounds.maxX) {
            aircraft.position.x = worldBounds.maxX;
        }
        
        // Constrain Z position
        if (aircraft.position.z < worldBounds.minZ) {
            aircraft.position.z = worldBounds.minZ;
        } else if (aircraft.position.z > worldBounds.maxZ) {
            aircraft.position.z = worldBounds.maxZ;
        }
        
        // Constrain Y position
        if (aircraft.position.y < worldBounds.minY) {
            aircraft.position.y = worldBounds.minY;
        } else if (aircraft.position.y > worldBounds.maxY) {
            aircraft.position.y = worldBounds.maxY;
        }
    }

    /**
     * Get control authority percentage for UI display
     * @param {Aircraft} aircraft - Aircraft to check
     * @returns {number} Control authority as percentage (0-100)
     */
    static getControlAuthority(aircraft) {
        if (aircraft.type === 'helicopter') {
            return 100; // Helicopters always have full control
        }
        
        const authority = Math.min(aircraft.speed / PHYSICS.MIN_CONTROL_SPEED, 1.0);
        return Math.round(authority * 100);
    }
}