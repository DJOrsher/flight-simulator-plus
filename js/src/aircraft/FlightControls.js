/**
 * Flight Controls
 * Handles input processing and control logic for aircraft
 */

import { FlightPhysics } from './FlightPhysics.js';
import { ANIMATION } from '../utils/Constants.js';

export class FlightControls {
    
    /**
     * Process flight controls for an aircraft
     * @param {Aircraft} aircraft - Aircraft to control
     * @param {Object} controls - Current control inputs
     * @param {Object} worldBounds - World boundary limits
     */
    static updateAircraftControls(aircraft, controls, worldBounds) {
        // Update physics based on controls
        FlightPhysics.updateAircraft(aircraft, controls);
        
        // Apply world boundaries
        FlightPhysics.applyBoundaryConstraints(aircraft, worldBounds);
        
        // Update rotation with ground clearance
        FlightPhysics.applyAircraftRotationWithGroundClearance(aircraft);
        
        // Animate moving parts
        this.animateAircraftParts(aircraft);
    }

    /**
     * Animate aircraft moving parts (propellers, rotors)
     * @param {Aircraft} aircraft - Aircraft to animate
     */
    static animateAircraftParts(aircraft) {
        const mesh = aircraft.mesh;
        const speedFactor = aircraft.speed * ANIMATION.PROPELLER_SPEED_FACTOR;
        
        // Animate propellers for Cessna
        if (aircraft.type === 'cessna' && mesh.userData.propeller) {
            mesh.userData.propeller.rotation.x += speedFactor;
        }
        
        // Animate propellers for Cargo plane
        if (aircraft.type === 'cargo' && mesh.userData.propellers) {
            mesh.userData.propellers.forEach(propeller => {
                propeller.rotation.x += speedFactor;
            });
        }
        
        // Animate helicopter rotors
        if (aircraft.type === 'helicopter') {
            this.animateHelicopterRotors(aircraft, mesh);
        }
        
        // Add subtle wing flex for larger aircraft during flight
        if ((aircraft.type === 'airliner' || aircraft.type === 'cargo') && aircraft.speed > 0.3) {
            const flexAmount = Math.sin(Date.now() * 0.01) * 0.02 * aircraft.speed;
            // Wing flex animation could be added here if wings were separate objects
        }
    }

    /**
     * Animate helicopter rotor systems
     * @param {Aircraft} aircraft - Helicopter aircraft
     * @param {THREE.Group} mesh - Aircraft mesh
     */
    static animateHelicopterRotors(aircraft, mesh) {
        // Helicopters need rotors spinning to stay airborne, even at speed 0
        const isActiveHelicopter = aircraft.isActive || 
                                 (aircraft.speed > 0) || 
                                 aircraft.isAirborne();
        
        const minRotorSpeed = isActiveHelicopter ? ANIMATION.ROTOR_MIN_SPEED : 0;
        const speedFactor = aircraft.speed * ANIMATION.PROPELLER_SPEED_FACTOR;
        const rotorSpeed = Math.max(minRotorSpeed, speedFactor);
        
        if (mesh.userData.mainRotor) {
            mesh.userData.mainRotor.rotation.y += rotorSpeed * ANIMATION.ROTOR_MAIN_MULTIPLIER;
        }
        if (mesh.userData.tailRotor) {
            mesh.userData.tailRotor.rotation.x += rotorSpeed * ANIMATION.ROTOR_TAIL_MULTIPLIER;
        }
    }

    /**
     * Get flight control effectiveness for UI display
     * @param {Aircraft} aircraft - Aircraft to check
     * @returns {Object} Control effectiveness info
     */
    static getControlEffectiveness(aircraft) {
        const authority = FlightPhysics.getControlAuthority(aircraft);
        
        return {
            authority: authority,
            hasControl: authority > 50,
            isStalling: aircraft.type !== 'helicopter' && authority < 30,
            canManeuver: authority > 70
        };
    }

    /**
     * Get recommended control inputs for optimal flight
     * @param {Aircraft} aircraft - Aircraft to analyze
     * @returns {Object} Control recommendations
     */
    static getControlRecommendations(aircraft) {
        const recommendations = {
            throttle: 'maintain',
            pitch: 'level',
            warnings: []
        };

        if (aircraft.type === 'helicopter') {
            // Helicopter-specific recommendations
            if (aircraft.speed < 0.1 && aircraft.position.y > aircraft.getMinimumFlightHeight() + 10) {
                recommendations.warnings.push('Hovering at altitude - watch fuel consumption');
            }
        } else {
            // Fixed-wing recommendations
            if (aircraft.speed < 0.2) {
                recommendations.throttle = 'increase';
                recommendations.warnings.push('Speed too low - increase throttle to maintain control');
            }
            
            if (Math.abs(aircraft.rotation.z) > Math.PI / 6) {
                recommendations.pitch = aircraft.rotation.z > 0 ? 'lower nose' : 'raise nose';
                recommendations.warnings.push('Extreme pitch angle - level aircraft');
            }
            
            if (!aircraft.isAirborne() && aircraft.speed > 0.3) {
                recommendations.warnings.push('High speed on ground - reduce throttle');
            }
        }

        return recommendations;
    }

    /**
     * Process emergency procedures
     * @param {Aircraft} aircraft - Aircraft in emergency
     * @param {string} emergencyType - Type of emergency
     * @returns {Object} Emergency procedures
     */
    static handleEmergency(aircraft, emergencyType) {
        const procedures = {
            actions: [],
            priority: 'normal'
        };

        switch (emergencyType) {
            case 'engine_failure':
                if (aircraft.type === 'helicopter') {
                    procedures.actions.push('Initiate autorotation');
                    procedures.actions.push('Find suitable landing area');
                    procedures.priority = 'critical';
                } else {
                    procedures.actions.push('Maintain airspeed');
                    procedures.actions.push('Find nearest runway');
                    procedures.priority = 'high';
                }
                break;
                
            case 'low_fuel':
                procedures.actions.push('Reduce power setting');
                procedures.actions.push('Proceed to nearest airport');
                procedures.priority = 'medium';
                break;
                
            case 'weather':
                procedures.actions.push('Avoid turbulent areas');
                procedures.actions.push('Consider alternate landing site');
                procedures.priority = 'medium';
                break;
                
            case 'collision_warning':
                procedures.actions.push('Immediate evasive action');
                procedures.actions.push('Climb or descend as appropriate');
                procedures.priority = 'critical';
                break;
        }

        return procedures;
    }

    /**
     * Calculate optimal approach parameters for landing
     * @param {Aircraft} aircraft - Aircraft approaching for landing
     * @param {Object} runway - Target runway information
     * @returns {Object} Approach parameters
     */
    static calculateApproachParameters(aircraft, runway) {
        const parameters = {
            approachSpeed: 0,
            glidePath: 0,
            finalApproachFix: null,
            minimumAltitude: 0
        };

        if (aircraft.type === 'helicopter') {
            // Helicopter approach - can be steep and slow
            parameters.approachSpeed = 0.2;
            parameters.glidePath = 6; // degrees
            parameters.minimumAltitude = aircraft.getMinimumFlightHeight();
        } else {
            // Fixed-wing approach
            parameters.approachSpeed = Math.max(0.3, aircraft.maxSpeed * 0.4);
            parameters.glidePath = 3; // degrees - standard ILS approach
            parameters.minimumAltitude = aircraft.getMinimumFlightHeight();
            
            // Calculate final approach fix (1 mile from runway)
            const approachDistance = 50; // units
            parameters.finalApproachFix = {
                x: runway.x - Math.cos(runway.heading) * approachDistance,
                z: runway.z + Math.sin(runway.heading) * approachDistance,
                altitude: aircraft.getMinimumFlightHeight() + 15
            };
        }

        return parameters;
    }

    /**
     * Check if aircraft is in a stable flight configuration
     * @param {Aircraft} aircraft - Aircraft to check
     * @returns {Object} Stability information
     */
    static checkFlightStability(aircraft) {
        const stability = {
            isStable: true,
            issues: [],
            recommendations: []
        };

        // Check speed stability
        if (aircraft.type !== 'helicopter') {
            if (aircraft.speed < 0.15) {
                stability.isStable = false;
                stability.issues.push('Speed too low for stable flight');
                stability.recommendations.push('Increase throttle');
            }
        }

        // Check attitude stability
        if (Math.abs(aircraft.rotation.z) > Math.PI / 4) {
            stability.isStable = false;
            stability.issues.push('Excessive pitch angle');
            stability.recommendations.push('Level aircraft');
        }

        // Check altitude stability for fixed-wing
        if (aircraft.type !== 'helicopter' && aircraft.velocity.y < -0.5) {
            stability.isStable = false;
            stability.issues.push('Rapid descent rate');
            stability.recommendations.push('Reduce descent rate');
        }

        return stability;
    }
}