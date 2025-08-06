/**
 * Landing State Machine Module
 * Handles proper aircraft landing sequences with state management
 */

import * as MathUtils from '../utils/MathUtils.js';

export class LandingStateMachine {
    constructor() {
        this.activeLandings = new Map();
        this.runwayData = {
            // Main runway (East-West)
            centerline: { startX: -90, endX: 90, z: 0 },
            approach: {
                east: { x: 150, y: 40, z: 0, heading: Math.PI }, // Approach from east
                west: { x: -150, y: 40, z: 0, heading: 0 }        // Approach from west
            },
            touchdown: {
                east: { x: 60, z: 0 },   // Touch down 30m from east end
                west: { x: -60, z: 0 }   // Touch down 30m from west end
            }
        };
    }
    
    /**
     * Start landing sequence for aircraft
     * @param {Object} aircraft - Aircraft to land
     * @param {string} approachDirection - 'east' or 'west'
     * @returns {Object} Landing state machine instance
     */
    startLanding(aircraft, approachDirection = 'east') {
        const landingId = aircraft.id || aircraft.type + '_' + Date.now();
        
        const landingState = {
            id: landingId,
            aircraft,
            approachDirection,
            currentState: 'approach_setup',
            progress: 0,
            startTime: Date.now(),
            waypoints: this.createLandingWaypoints(approachDirection),
            currentWaypointIndex: 0,
            targetSpeed: aircraft.specs.maxSpeed * 0.6,
            isComplete: false,
            runway: this.runwayData
        };
        
        this.activeLandings.set(landingId, landingState);
        console.log(`Landing sequence started for ${aircraft.type} from ${approachDirection}`);
        
        return landingState;
    }
    
    /**
     * Create landing waypoints based on approach direction
     * @param {string} direction - Approach direction
     * @returns {Array} Waypoints for landing sequence
     */
    createLandingWaypoints(direction) {
        const approach = this.runwayData.approach[direction];
        const touchdown = this.runwayData.touchdown[direction];
        
        if (direction === 'east') {
            // Landing from east (standard approach)
            return [
                {
                    name: 'initial_approach',
                    position: new THREE.Vector3(200, 50, 0),
                    speed: 0.6,
                    altitude: 50
                },
                {
                    name: 'outer_marker',
                    position: new THREE.Vector3(150, 40, 0),
                    speed: 0.5,
                    altitude: 40
                },
                {
                    name: 'final_approach',
                    position: new THREE.Vector3(120, 30, 0),
                    speed: 0.4,
                    altitude: 30
                },
                {
                    name: 'short_final',
                    position: new THREE.Vector3(100, 15, 0),
                    speed: 0.35,
                    altitude: 15
                },
                {
                    name: 'touchdown',
                    position: new THREE.Vector3(touchdown.x, 1.0, touchdown.z),
                    speed: 0.3,
                    altitude: 1.0
                },
                {
                    name: 'rollout',
                    position: new THREE.Vector3(-80, 1.0, 0),
                    speed: 0.1,
                    altitude: 1.0
                }
            ];
        } else {
            // Landing from west (opposite direction)
            return [
                {
                    name: 'initial_approach',
                    position: new THREE.Vector3(-200, 50, 0),
                    speed: 0.6,
                    altitude: 50
                },
                {
                    name: 'outer_marker',
                    position: new THREE.Vector3(-150, 40, 0),
                    speed: 0.5,
                    altitude: 40
                },
                {
                    name: 'final_approach',
                    position: new THREE.Vector3(-120, 30, 0),
                    speed: 0.4,
                    altitude: 30
                },
                {
                    name: 'short_final',
                    position: new THREE.Vector3(-100, 15, 0),
                    speed: 0.35,
                    altitude: 15
                },
                {
                    name: 'touchdown',
                    position: new THREE.Vector3(touchdown.x, 1.0, touchdown.z),
                    speed: 0.3,
                    altitude: 1.0
                },
                {
                    name: 'rollout',
                    position: new THREE.Vector3(80, 1.0, 0),
                    speed: 0.1,
                    altitude: 1.0
                }
            ];
        }
    }
    
    /**
     * Update landing state machine
     * @param {Object} landingState - Landing state to update
     * @param {number} deltaTime - Time since last update
     * @returns {boolean} True if landing is complete
     */
    updateLanding(landingState, deltaTime) {
        if (!landingState || landingState.isComplete) {
            return true;
        }
        
        const { aircraft, currentState } = landingState;
        
        // Update based on current state
        switch (currentState) {
            case 'approach_setup':
                this.handleApproachSetup(landingState);
                break;
                
            case 'approaching':
                this.handleApproaching(landingState);
                break;
                
            case 'final_approach':
                this.handleFinalApproach(landingState);
                break;
                
            case 'touchdown':
                this.handleTouchdown(landingState);
                break;
                
            case 'rollout':
                this.handleRollout(landingState);
                break;
                
            case 'complete':
                landingState.isComplete = true;
                return true;
        }
        
        return false;
    }
    
    /**
     * Handle approach setup state
     * @param {Object} landingState - Landing state
     */
    handleApproachSetup(landingState) {
        const { aircraft, waypoints } = landingState;
        
        // Position aircraft at initial approach point
        const initialWaypoint = waypoints[0];
        aircraft.position.copy(initialWaypoint.position);
        aircraft.speed = initialWaypoint.speed * aircraft.specs.maxSpeed;
        
        // Set heading toward runway
        const runwayHeading = landingState.approachDirection === 'east' ? Math.PI : 0;
        aircraft.rotation.y = runwayHeading;
        
        // Move to approaching state
        landingState.currentState = 'approaching';
        landingState.currentWaypointIndex = 1;
        
        console.log(`${aircraft.type} established on approach from ${landingState.approachDirection}`);
    }
    
    /**
     * Handle approaching state
     * @param {Object} landingState - Landing state
     */
    handleApproaching(landingState) {
        const { aircraft, waypoints, currentWaypointIndex } = landingState;
        
        if (currentWaypointIndex >= waypoints.length - 2) {
            // Transition to final approach
            landingState.currentState = 'final_approach';
            return;
        }
        
        const currentWaypoint = waypoints[currentWaypointIndex];
        const targetPosition = currentWaypoint.position;
        
        // Move toward waypoint
        const distance = aircraft.position.distanceTo(targetPosition);
        
        if (distance < 15) {
            // Reached waypoint, move to next
            landingState.currentWaypointIndex++;
        } else {
            // Move toward waypoint
            this.moveAircraftTowardTarget(aircraft, currentWaypoint);
        }
    }
    
    /**
     * Handle final approach state
     * @param {Object} landingState - Landing state
     */
    handleFinalApproach(landingState) {
        const { aircraft, waypoints, approachDirection } = landingState;
        const touchdownWaypoint = waypoints.find(w => w.name === 'touchdown');
        
        if (!touchdownWaypoint) return;
        
        // Calculate glide slope
        const horizontalDistance = Math.abs(aircraft.position.x - touchdownWaypoint.position.x);
        const desiredAltitude = Math.max(1.0, horizontalDistance * 0.1); // 10% glide slope
        
        // Move toward touchdown point
        this.moveAircraftTowardTarget(aircraft, touchdownWaypoint);
        
        // Apply glide slope
        aircraft.position.y = Math.max(1.0, desiredAltitude);
        
        // Set nose-down attitude for descent
        aircraft.rotation.x = 0.05;
        
        // Check if near touchdown
        const distanceToTouchdown = aircraft.position.distanceTo(touchdownWaypoint.position);
        if (distanceToTouchdown < 10 && aircraft.position.y < 5) {
            landingState.currentState = 'touchdown';
            console.log(`${aircraft.type} touchdown`);
        }
    }
    
    /**
     * Handle touchdown state
     * @param {Object} landingState - Landing state
     */
    handleTouchdown(landingState) {
        const { aircraft, waypoints } = landingState;
        
        // Force aircraft to runway level
        aircraft.position.y = 1.0;
        aircraft.position.z = 0; // Align with runway centerline
        
        // Level attitude
        aircraft.rotation.x = 0;
        aircraft.rotation.z = 0;
        
        // Reduce speed
        aircraft.speed *= 0.95;
        
        // Move to rollout if slow enough
        if (aircraft.speed < aircraft.specs.maxSpeed * 0.2) {
            landingState.currentState = 'rollout';
            console.log(`${aircraft.type} rollout`);
        }
    }
    
    /**
     * Handle rollout state
     * @param {Object} landingState - Landing state
     */
    handleRollout(landingState) {
        const { aircraft, waypoints } = landingState;
        const rolloutWaypoint = waypoints.find(w => w.name === 'rollout');
        
        if (!rolloutWaypoint) {
            landingState.currentState = 'complete';
            return;
        }
        
        // Continue rolling toward end of runway
        this.moveAircraftTowardTarget(aircraft, rolloutWaypoint);
        
        // Gradually reduce speed
        aircraft.speed = Math.max(0.05, aircraft.speed * 0.98);
        
        // Check if reached rollout point
        const distance = aircraft.position.distanceTo(rolloutWaypoint.position);
        if (distance < 10 || aircraft.speed < 0.1) {
            landingState.currentState = 'complete';
            aircraft.speed = 0;
            console.log(`${aircraft.type} landing complete`);
        }
    }
    
    /**
     * Move aircraft toward target waypoint
     * @param {Object} aircraft - Aircraft to move
     * @param {Object} waypoint - Target waypoint
     */
    moveAircraftTowardTarget(aircraft, waypoint) {
        const targetPosition = waypoint.position;
        const direction = targetPosition.clone().sub(aircraft.position).normalize();
        
        // Set speed
        aircraft.speed = waypoint.speed * aircraft.specs.maxSpeed;
        
        // Move toward target
        const moveVector = direction.multiplyScalar(aircraft.speed);
        aircraft.position.add(moveVector);
        
        // Set heading
        if (direction.length() > 0.1) {
            aircraft.rotation.y = Math.atan2(-direction.x, -direction.z);
        }
        
        // Update mesh
        if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
            aircraft.mesh.rotation.copy(aircraft.rotation);
        }
    }
    
    /**
     * Get landing state for aircraft
     * @param {Object} aircraft - Aircraft
     * @returns {Object|null} Landing state or null
     */
    getLandingState(aircraft) {
        for (const [id, state] of this.activeLandings) {
            if (state.aircraft === aircraft) {
                return state;
            }
        }
        return null;
    }
    
    /**
     * Stop landing sequence for aircraft
     * @param {Object} aircraft - Aircraft
     */
    stopLanding(aircraft) {
        for (const [id, state] of this.activeLandings) {
            if (state.aircraft === aircraft) {
                this.activeLandings.delete(id);
                console.log(`Landing sequence stopped for ${aircraft.type}`);
                break;
            }
        }
    }
    
    /**
     * Get best approach direction based on aircraft position
     * @param {Object} aircraft - Aircraft
     * @returns {string} 'east' or 'west'
     */
    getBestApproachDirection(aircraft) {
        // Simple logic: approach from the side aircraft is closest to
        return aircraft.position.x > 0 ? 'east' : 'west';
    }
    
    /**
     * Check if runway is clear for landing
     * @returns {boolean} True if runway is clear
     */
    isRunwayClear() {
        // Simple implementation - could be enhanced to check for other aircraft
        return this.activeLandings.size < 1;
    }
    
    /**
     * Emergency abort landing
     * @param {Object} aircraft - Aircraft to abort
     */
    abortLanding(aircraft) {
        const landingState = this.getLandingState(aircraft);
        if (landingState) {
            console.log(`Aborting landing for ${aircraft.type} - go around`);
            
            // Set go-around parameters
            aircraft.position.y = Math.max(aircraft.position.y, 20);
            aircraft.speed = aircraft.specs.maxSpeed * 0.7;
            aircraft.rotation.x = -0.1; // Climb attitude
            
            // Remove from active landings
            this.stopLanding(aircraft);
        }
    }
    
    /**
     * Get all active landings
     * @returns {Map} Active landing states
     */
    getActiveLandings() {
        return this.activeLandings;
    }
    
    /**
     * Update all active landings
     * @param {number} deltaTime - Time since last update
     * @returns {Array} Completed landings
     */
    updateAllLandings(deltaTime) {
        const completedLandings = [];
        
        this.activeLandings.forEach((landingState, id) => {
            const isComplete = this.updateLanding(landingState, deltaTime);
            
            if (isComplete) {
                completedLandings.push(landingState);
                this.activeLandings.delete(id);
            }
        });
        
        return completedLandings;
    }
    
    /**
     * Dispose of landing state machine resources
     */
    dispose() {
        this.activeLandings.clear();
        console.log('Landing state machine disposed');
    }
}