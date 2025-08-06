/**
 * Flight Automation Module
 * Handles automated flight patterns and aircraft movement
 */

import * as MathUtils from '../utils/MathUtils.js';
import { TaxiSystem } from './TaxiSystem.js';
import { LandingStateMachine } from './LandingStateMachine.js';

export class FlightAutomation {
    constructor() {
        this.activeFlights = new Map();
        this.flightIdCounter = 0;
        this.taxiSystem = new TaxiSystem();
        this.landingStateMachine = new LandingStateMachine();
    }
    
    /**
     * Start automated flight for aircraft
     * @param {Aircraft} aircraft - Aircraft to automate
     * @param {Object} flightPlan - Flight plan with phases
     * @returns {Object} Automated flight object
     */
    startAutomatedFlight(aircraft, flightPlan) {
        const flightId = ++this.flightIdCounter;
        
        const automatedFlight = {
            id: flightId,
            aircraft,
            flightPlan,
            currentPhaseIndex: 0,
            phaseStartTime: Date.now(),
            phaseProgress: 0,
            isComplete: false,
            originalPosition: aircraft.position.clone(),
            originalRotation: aircraft.rotation.clone()
        };
        
        // Set initial phase
        if (flightPlan.phases.length > 0) {
            automatedFlight.currentPhase = flightPlan.phases[0].name;
            this.activeFlights.set(flightId, automatedFlight);
            
            console.log(`Started automated flight for ${aircraft.type} - Phase: ${automatedFlight.currentPhase}`);
            return automatedFlight;
        }
        
        return null;
    }
    
    /**
     * Stop automated flight
     * @param {Object} automatedFlight - Automated flight to stop
     */
    stopAutomatedFlight(automatedFlight) {
        if (automatedFlight && this.activeFlights.has(automatedFlight.id)) {
            this.activeFlights.delete(automatedFlight.id);
            console.log(`Stopped automated flight for ${automatedFlight.aircraft.type}`);
        }
    }
    
    /**
     * Update automated flight
     * @param {Object} automatedFlight - Flight to update
     * @param {number} deltaTime - Time since last update
     * @returns {boolean} True if flight is complete
     */
    updateFlight(automatedFlight, deltaTime) {
        if (!automatedFlight || automatedFlight.isComplete) {
            return true;
        }
        
        const { aircraft, flightPlan } = automatedFlight;
        const currentPhase = flightPlan.phases[automatedFlight.currentPhaseIndex];
        
        if (!currentPhase) {
            // No more phases, flight is complete
            automatedFlight.isComplete = true;
            return true;
        }
        
        // Handle taxi operations separately
        if (currentPhase.name === 'taxi_to_runway' || currentPhase.name === 'taxi_to_parking') {
            const taxiComplete = this.updateTaxiPhase(automatedFlight, currentPhase, deltaTime);
            if (taxiComplete) {
                this.advanceToNextPhase(automatedFlight);
            }
            return automatedFlight.isComplete;
        }
        
        // Handle landing operations with state machine
        if (currentPhase.name === 'landing') {
            const landingComplete = this.updateLandingPhase(automatedFlight, currentPhase, deltaTime);
            if (landingComplete) {
                this.advanceToNextPhase(automatedFlight);
            }
            return automatedFlight.isComplete;
        }
        
        // Update phase progress for time-based phases
        if (currentPhase.timeBasedProgress !== false) {
            const phaseElapsed = Date.now() - automatedFlight.phaseStartTime;
            automatedFlight.phaseProgress = Math.min(phaseElapsed / currentPhase.duration, 1.0);
        }
        
        // Update aircraft position based on current phase
        this.updateAircraftForPhase(automatedFlight, currentPhase, deltaTime);
        
        // Check if phase is complete
        if (automatedFlight.phaseProgress >= 1.0) {
            this.advanceToNextPhase(automatedFlight);
        }
        
        return automatedFlight.isComplete;
    }
    
    /**
     * Update aircraft position for current phase
     * @param {Object} automatedFlight - Automated flight
     * @param {Object} phase - Current phase
     * @param {number} deltaTime - Time delta
     */
    updateAircraftForPhase(automatedFlight, phase, deltaTime) {
        const { aircraft } = automatedFlight;
        const progress = automatedFlight.phaseProgress;
        
        // Handle different phase types
        switch (phase.name) {
            case 'taxi':
            case 'taxi_back':
                this.updateTaxiPhase(aircraft, phase, progress);
                break;
                
            case 'takeoff':
                this.updateTakeoffPhase(aircraft, phase, progress);
                break;
                
            case 'climb':
            case 'cruise_out':
            case 'cruise_pattern':
            case 'return_leg':
            case 'traffic_pattern':
                this.updateCruisePhase(aircraft, phase, progress);
                break;
                
            case 'final_approach':
            case 'return_pattern':
                this.updateApproachPhase(aircraft, phase, progress);
                break;
                
            case 'landing':
                // This is now handled in the main updateFlight method
                break;
                
            case 'vertical_takeoff':
                this.updateVerticalTakeoffPhase(aircraft, phase, progress);
                break;
                
            case 'departure':
            case 'patrol_north':
            case 'patrol_east':
            case 'patrol_south':
            case 'patrol_west':
            case 'return_direct':
                this.updateHelicopterFlightPhase(aircraft, phase, progress);
                break;
                
            case 'return_approach':
            case 'hover_approach':
                this.updateHoverPhase(aircraft, phase, progress);
                break;
                
            case 'vertical_landing':
                this.updateVerticalLandingPhase(aircraft, phase, progress);
                break;
                
            default:
                this.updateDefaultPhase(aircraft, phase, progress);
                break;
        }
        
        // Update mesh position to match aircraft position
        if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
            aircraft.mesh.rotation.copy(aircraft.rotation);
        }
    }
    
    /**
     * Update taxi phase using taxi system
     * @param {Object} automatedFlight - Automated flight
     * @param {Object} phase - Phase info
     * @param {number} deltaTime - Time delta
     * @returns {boolean} True if phase complete
     */
    updateTaxiPhase(automatedFlight, phase, deltaTime) {
        const { aircraft } = automatedFlight;
        
        // Start taxi operation if not already started
        if (!phase.taxiOperation) {
            const direction = phase.name === 'taxi_to_runway' ? 'toRunway' : 'fromRunway';
            phase.taxiOperation = this.taxiSystem.startTaxiOperation(aircraft, direction);
            
            if (!phase.taxiOperation) {
                // No taxi route needed (e.g., helicopter)
                automatedFlight.phaseProgress = 1.0;
                return false;
            }
        }
        
        // Update taxi operation
        const isComplete = this.taxiSystem.updateTaxiOperation(phase.taxiOperation, deltaTime);
        
        if (isComplete) {
            automatedFlight.phaseProgress = 1.0;
            phase.taxiOperation = null;
            console.log(`Taxi phase complete for ${aircraft.type}`);
            return true; // Phase complete
        } else {
            // Progress based on waypoint completion
            const operation = phase.taxiOperation;
            automatedFlight.phaseProgress = operation.currentWaypointIndex / operation.route.length;
        }
        
        return false; // Phase not complete
    }
    
    /**
     * Update takeoff phase with proper runway usage
     * @param {Aircraft} aircraft - Aircraft
     * @param {Object} phase - Phase info
     * @param {number} progress - Phase progress (0-1)
     */
    updateTakeoffPhase(aircraft, phase, progress) {
        // Takeoff sequence: taxi down runway for half length, then climb
        const runwayLength = 180; // Total runway length
        const takeoffPoint = runwayLength * 0.5; // Take off at halfway point
        
        if (progress < 0.5) {
            // First half: accelerate down runway
            const runwayProgress = progress * 2; // 0 to 1 for first half
            const startX = -90; // West end of runway
            const currentX = startX + (takeoffPoint * runwayProgress);
            
            aircraft.position.set(currentX, 1.0, 0);
            aircraft.rotation.y = 0; // Facing east
            aircraft.speed = runwayProgress * aircraft.specs.maxSpeed * 0.8;
            
        } else {
            // Second half: climb out
            const climbProgress = (progress - 0.5) * 2; // 0 to 1 for second half
            const takeoffX = -90 + takeoffPoint;
            
            // Continue forward and climb
            const currentX = takeoffX + (takeoffPoint * climbProgress);
            const climbHeight = climbProgress * phase.targetPosition.y;
            
            aircraft.position.set(currentX, 1.0 + climbHeight, 0);
            aircraft.rotation.x = -climbProgress * 0.15; // Nose up attitude
            aircraft.speed = aircraft.specs.maxSpeed * (0.8 + climbProgress * 0.2);
        }
        
        // Update mesh
        if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
            aircraft.mesh.rotation.copy(aircraft.rotation);
        }
    }
    
    /**
     * Update cruise phase
     * @param {Aircraft} aircraft - Aircraft
     * @param {Object} phase - Phase info
     * @param {number} progress - Phase progress (0-1)
     */
    updateCruisePhase(aircraft, phase, progress) {
        const startPos = aircraft.position.clone();
        const targetPos = phase.targetPosition;
        
        aircraft.position.lerpVectors(startPos, targetPos, progress);
        aircraft.speed = phase.speed || aircraft.specs.maxSpeed;
        
        // Face movement direction
        const direction = targetPos.clone().sub(startPos).normalize();
        if (direction.length() > 0) {
            aircraft.rotation.y = Math.atan2(-direction.x, -direction.z);
        }
        
        // Level flight attitude
        aircraft.rotation.x = 0;
    }
    
    /**
     * Update approach phase
     * @param {Aircraft} aircraft - Aircraft
     * @param {Object} phase - Phase info
     * @param {number} progress - Phase progress (0-1)
     */
    updateApproachPhase(aircraft, phase, progress) {
        const startPos = aircraft.position.clone();
        const targetPos = phase.targetPosition;
        
        aircraft.position.lerpVectors(startPos, targetPos, progress);
        aircraft.speed = phase.speed || aircraft.specs.maxSpeed * 0.5;
        
        // Gradual descent
        const descentAngle = (targetPos.y - startPos.y) / 
                           Math.sqrt(Math.pow(targetPos.x - startPos.x, 2) + 
                                   Math.pow(targetPos.z - startPos.z, 2));
        aircraft.rotation.x = descentAngle * 0.5; // Nose down for descent
        
        // Face runway
        const direction = targetPos.clone().sub(startPos).normalize();
        if (direction.length() > 0) {
            aircraft.rotation.y = Math.atan2(-direction.x, -direction.z);
        }
    }
    
    /**
     * Update landing phase using state machine
     * @param {Object} automatedFlight - Automated flight
     * @param {Object} phase - Phase info
     * @param {number} deltaTime - Time delta
     * @returns {boolean} True if phase complete
     */
    updateLandingPhase(automatedFlight, phase, deltaTime) {
        const { aircraft } = automatedFlight;
        
        // Start landing state machine if not already started
        if (!phase.landingState) {
            const approachDirection = this.landingStateMachine.getBestApproachDirection(aircraft);
            phase.landingState = this.landingStateMachine.startLanding(aircraft, approachDirection);
            
            if (!phase.landingState) {
                // Landing state machine couldn't start
                automatedFlight.phaseProgress = 1.0;
                return false;
            }
        }
        
        // Update landing state machine
        const isComplete = this.landingStateMachine.updateLanding(phase.landingState, deltaTime);
        
        if (isComplete) {
            automatedFlight.phaseProgress = 1.0;
            phase.landingState = null;
            console.log(`Landing phase complete for ${aircraft.type}`);
            return true; // Phase complete
        } else {
            // Progress based on landing state
            const landingState = phase.landingState;
            const stateProgress = {
                'approach_setup': 0.1,
                'approaching': 0.3,
                'final_approach': 0.6,
                'touchdown': 0.8,
                'rollout': 0.9,
                'complete': 1.0
            };
            
            automatedFlight.phaseProgress = stateProgress[landingState.currentState] || 0;
        }
        
        return false; // Phase not complete
    }
    
    /**
     * Update vertical takeoff phase (helicopter)
     * @param {Aircraft} aircraft - Aircraft
     * @param {Object} phase - Phase info
     * @param {number} progress - Phase progress (0-1)
     */
    updateVerticalTakeoffPhase(aircraft, phase, progress) {
        const startPos = aircraft.position.clone();
        const targetPos = phase.targetPosition;
        
        // Vertical climb with slight forward movement
        aircraft.position.lerpVectors(startPos, targetPos, progress);
        aircraft.speed = phase.speed || aircraft.specs.maxSpeed * 0.6;
        
        // Keep level attitude
        aircraft.rotation.x = 0;
        aircraft.rotation.z = 0;
    }
    
    /**
     * Update helicopter flight phase
     * @param {Aircraft} aircraft - Aircraft
     * @param {Object} phase - Phase info
     * @param {number} progress - Phase progress (0-1)
     */
    updateHelicopterFlightPhase(aircraft, phase, progress) {
        const startPos = aircraft.position.clone();
        const targetPos = phase.targetPosition;
        
        aircraft.position.lerpVectors(startPos, targetPos, progress);
        aircraft.speed = phase.speed || aircraft.specs.maxSpeed;
        
        // Face movement direction
        const direction = targetPos.clone().sub(startPos).normalize();
        if (direction.length() > 0) {
            aircraft.rotation.y = Math.atan2(-direction.x, -direction.z);
        }
        
        // Slight forward tilt for helicopter forward flight
        aircraft.rotation.x = -0.1;
    }
    
    /**
     * Update hover phase (helicopter)
     * @param {Aircraft} aircraft - Aircraft
     * @param {Object} phase - Phase info
     * @param {number} progress - Phase progress (0-1)
     */
    updateHoverPhase(aircraft, phase, progress) {
        const startPos = aircraft.position.clone();
        const targetPos = phase.targetPosition;
        
        aircraft.position.lerpVectors(startPos, targetPos, progress);
        aircraft.speed = 0.1;
        
        // Add slight hover movement
        const hoverOffset = Math.sin(Date.now() * 0.002) * 0.5;
        aircraft.position.y += hoverOffset;
        
        // Face movement direction
        const direction = targetPos.clone().sub(startPos).normalize();
        if (direction.length() > 0.1) {
            aircraft.rotation.y = Math.atan2(-direction.x, -direction.z);
        }
        
        // Level attitude
        aircraft.rotation.x = 0;
        aircraft.rotation.z = 0;
        
        // Update mesh
        if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
            aircraft.mesh.rotation.copy(aircraft.rotation);
        }
    }
    
    /**
     * Update vertical landing phase (helicopter)
     * @param {Aircraft} aircraft - Aircraft
     * @param {Object} phase - Phase info
     * @param {number} progress - Phase progress (0-1)
     */
    updateVerticalLandingPhase(aircraft, phase, progress) {
        const startPos = aircraft.position.clone();
        const targetPos = phase.targetPosition;
        
        // Slow vertical descent
        aircraft.position.lerpVectors(startPos, targetPos, progress);
        aircraft.speed = phase.speed || 0.1;
        
        // Ensure we don't go below ground
        aircraft.position.y = Math.max(aircraft.position.y, 1.0);
        
        // Add slight hover movement during descent
        const hoverOffset = Math.sin(Date.now() * 0.001) * 0.2 * (1 - progress);
        aircraft.position.y += hoverOffset;
        
        // Maintain stable attitude
        aircraft.rotation.x = 0;
        aircraft.rotation.z = 0;
        
        // Update mesh
        if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
            aircraft.mesh.rotation.copy(aircraft.rotation);
        }
    }
    
    /**
     * Default phase update
     * @param {Aircraft} aircraft - Aircraft
     * @param {Object} phase - Phase info
     * @param {number} progress - Phase progress (0-1)
     */
    updateDefaultPhase(aircraft, phase, progress) {
        const startPos = aircraft.position.clone();
        const targetPos = phase.targetPosition;
        
        aircraft.position.lerpVectors(startPos, targetPos, progress);
        aircraft.speed = phase.speed || aircraft.specs.maxSpeed * 0.5;
        
        // Face movement direction
        const direction = targetPos.clone().sub(startPos).normalize();
        if (direction.length() > 0) {
            aircraft.rotation.y = Math.atan2(-direction.x, -direction.z);
        }
    }
    
    /**
     * Advance to next phase
     * @param {Object} automatedFlight - Automated flight
     */
    advanceToNextPhase(automatedFlight) {
        automatedFlight.currentPhaseIndex++;
        automatedFlight.phaseStartTime = Date.now();
        automatedFlight.phaseProgress = 0;
        
        if (automatedFlight.currentPhaseIndex >= automatedFlight.flightPlan.phases.length) {
            // Flight complete
            automatedFlight.isComplete = true;
            automatedFlight.currentPhase = 'complete';
            console.log(`Flight complete for ${automatedFlight.aircraft.type}`);
        } else {
            // Next phase
            const nextPhase = automatedFlight.flightPlan.phases[automatedFlight.currentPhaseIndex];
            automatedFlight.currentPhase = nextPhase.name;
            console.log(`${automatedFlight.aircraft.type} entering phase: ${nextPhase.name}`);
        }
    }
    
    /**
     * Get all active flights
     * @returns {Map} Active flights map
     */
    getActiveFlights() {
        return this.activeFlights;
    }
    
    /**
     * Get flight status
     * @param {number} flightId - Flight ID
     * @returns {Object|null} Flight status or null
     */
    getFlightStatus(flightId) {
        const flight = this.activeFlights.get(flightId);
        if (!flight) return null;
        
        return {
            id: flight.id,
            aircraftType: flight.aircraft.type,
            currentPhase: flight.currentPhase,
            progress: flight.phaseProgress,
            isComplete: flight.isComplete
        };
    }
    
    /**
     * Create recall flight plan for aircraft
     * @param {Object} aircraft - Aircraft to recall
     * @returns {Object} Recall flight plan
     */
    createRecallFlightPlan(aircraft) {
        const isHelicopter = aircraft.type === 'helicopter';
        const currentPosition = aircraft.position.clone();
        const parkingSpot = this.taxiSystem.getParkingSpot(aircraft.type);
        
        if (isHelicopter) {
            // Helicopter can land directly at parking spot
            return this.createHelicopterRecallPlan(aircraft, currentPosition, parkingSpot);
        } else {
            // Fixed-wing must land on runway then taxi to parking
            return this.createFixedWingRecallPlan(aircraft, currentPosition, parkingSpot);
        }
    }
    
    /**
     * Create helicopter recall plan (direct to parking)
     * @param {Object} aircraft - Helicopter
     * @param {THREE.Vector3} currentPos - Current position
     * @param {Object} parkingSpot - Parking spot
     * @returns {Object} Flight plan
     */
    createHelicopterRecallPlan(aircraft, currentPos, parkingSpot) {
        const plan = {
            aircraftType: aircraft.type,
            startPosition: currentPos.clone(),
            phases: []
        };
        
        if (currentPos.y > 10) {
            // If airborne, return and land vertically
            plan.phases = [
                {
                    name: 'return_direct',
                    duration: 8000,
                    targetPosition: new THREE.Vector3(parkingSpot.x, 15, parkingSpot.z),
                    speed: aircraft.specs.maxSpeed * 0.8
                },
                {
                    name: 'vertical_landing',
                    duration: 4000,
                    targetPosition: new THREE.Vector3(parkingSpot.x, 1.0, parkingSpot.z),
                    speed: 0.1
                }
            ];
        } else {
            // If on ground, taxi to parking
            plan.phases = [
                {
                    name: 'taxi_to_parking',
                    duration: 0, // Duration determined by taxi system
                    timeBasedProgress: false
                }
            ];
        }
        
        return plan;
    }
    
    /**
     * Create fixed-wing recall plan (land then taxi)
     * @param {Object} aircraft - Fixed-wing aircraft
     * @param {THREE.Vector3} currentPos - Current position
     * @param {Object} parkingSpot - Parking spot
     * @returns {Object} Flight plan
     */
    createFixedWingRecallPlan(aircraft, currentPos, parkingSpot) {
        const plan = {
            aircraftType: aircraft.type,
            startPosition: currentPos.clone(),
            phases: []
        };
        
        if (currentPos.y > 10) {
            // If airborne, must land on runway first
            plan.phases = [
                {
                    name: 'return_pattern',
                    duration: 10000,
                    targetPosition: new THREE.Vector3(150, 40, 50),
                    speed: aircraft.specs.maxSpeed * 0.7
                },
                {
                    name: 'final_approach',
                    duration: 8000,
                    targetPosition: new THREE.Vector3(120, 30, 0),
                    speed: aircraft.specs.maxSpeed * 0.5
                },
                {
                    name: 'landing',
                    duration: 12000,
                    targetPosition: new THREE.Vector3(-60, 1.0, 0),
                    speed: aircraft.specs.maxSpeed * 0.3
                },
                {
                    name: 'taxi_to_parking',
                    duration: 0, // Duration determined by taxi system
                    timeBasedProgress: false
                }
            ];
        } else {
            // If on ground, just taxi to parking
            plan.phases = [
                {
                    name: 'taxi_to_parking',
                    duration: 0, // Duration determined by taxi system
                    timeBasedProgress: false
                }
            ];
        }
        
        return plan;
    }
    
    /**
     * Update ground vehicles and landing operations
     * @param {number} deltaTime - Time since last update
     */
    updateGroundOperations(deltaTime) {
        // Update taxi system ground vehicles
        if (this.taxiSystem) {
            this.taxiSystem.updateGroundVehicles(deltaTime);
        }
        
        // Update landing state machine
        if (this.landingStateMachine) {
            this.landingStateMachine.updateAllLandings(deltaTime);
        }
    }
    
    /**
     * Get ground vehicle meshes for scene
     * @returns {Array} Array of vehicle meshes
     */
    getGroundVehicleMeshes() {
        return this.taxiSystem ? this.taxiSystem.getGroundVehicleMeshes() : [];
    }
    
    /**
     * Dispose of flight automation resources
     */
    dispose() {
        this.activeFlights.clear();
        if (this.taxiSystem) {
            this.taxiSystem.dispose();
        }
        if (this.landingStateMachine) {
            this.landingStateMachine.dispose();
        }
        console.log('Flight automation disposed');
    }
}