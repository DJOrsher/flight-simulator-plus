/**
 * Control Tower Module
 * Manages air traffic control operations and aircraft dispatch
 */

import { FlightAutomation } from './FlightAutomation.js';

export class ControlTower {
    constructor(aircraftList, environment) {
        this.aircraftList = aircraftList;
        this.environment = environment;
        this.isActive = false;
        this.position = environment.getControlTowerPosition();
        
        this.dispatchedAircraft = new Map();
        this.flightAutomation = new FlightAutomation();
        
        this.setupNumberKeyHandlers();
    }
    
    /**
     * Setup number key handlers for aircraft dispatch
     */
    setupNumberKeyHandlers() {
        document.addEventListener('keydown', (event) => {
            if (this.isActive) {
                this.handleNumberKey(event);
            }
        });
    }
    
    /**
     * Handle number key presses for aircraft control
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleNumberKey(event) {
        const key = event.code;
        const aircraftIndex = this.getAircraftIndexFromKey(key);
        
        if (aircraftIndex !== -1 && this.aircraftList[aircraftIndex]) {
            this.toggleAircraftDispatch(aircraftIndex);
            event.preventDefault();
        }
    }
    
    /**
     * Get aircraft index from number key
     * @param {string} keyCode - Key code
     * @returns {number} Aircraft index or -1
     */
    getAircraftIndexFromKey(keyCode) {
        const numberKeys = {
            'Digit1': 0,
            'Digit2': 1,
            'Digit3': 2,
            'Digit4': 3,
            'Digit5': 4,
            'Digit6': 5,
            'Digit7': 6,
            'Digit8': 7,
            'Digit9': 8
        };
        
        return numberKeys[keyCode] !== undefined ? numberKeys[keyCode] : -1;
    }
    
    /**
     * Toggle aircraft dispatch status
     * @param {number} index - Aircraft index
     */
    toggleAircraftDispatch(index) {
        const aircraft = this.aircraftList[index];
        if (!aircraft) return;
        
        if (this.dispatchedAircraft.has(index)) {
            // Recall aircraft
            this.recallAircraft(index);
        } else {
            // Dispatch aircraft
            this.dispatchAircraft(index);
        }
    }
    
    /**
     * Dispatch aircraft for automated flight
     * @param {number} index - Aircraft index
     */
    dispatchAircraft(index) {
        const aircraft = this.aircraftList[index];
        if (!aircraft || aircraft.isActive) return;
        
        console.log(`Dispatching ${aircraft.type} (Aircraft ${index + 1})`);
        
        // Create flight plan based on aircraft type
        const flightPlan = this.createFlightPlan(aircraft);
        
        // Start automated flight
        const automatedFlight = this.flightAutomation.startAutomatedFlight(
            aircraft, 
            flightPlan
        );
        
        if (automatedFlight) {
            aircraft.isActive = true;
            aircraft.automatedFlight = automatedFlight;
            this.dispatchedAircraft.set(index, {
                aircraft,
                flightPlan,
                automatedFlight,
                dispatchTime: Date.now()
            });
            
            this.updateUI();
        }
    }
    
    /**
     * Recall aircraft from automated flight with proper landing/taxi procedures
     * @param {number} index - Aircraft index
     */
    recallAircraft(index) {
        const dispatchInfo = this.dispatchedAircraft.get(index);
        if (!dispatchInfo) return;
        
        const { aircraft, automatedFlight } = dispatchInfo;
        
        console.log(`Recalling ${aircraft.type} (Aircraft ${index + 1})`);
        
        // Stop current automated flight
        this.flightAutomation.stopAutomatedFlight(automatedFlight);
        
        // Create recall flight plan based on current aircraft state
        const recallFlightPlan = this.flightAutomation.createRecallFlightPlan(aircraft);
        
        // Start recall flight automation
        const recallFlight = this.flightAutomation.startAutomatedFlight(
            aircraft,
            recallFlightPlan
        );
        
        if (recallFlight) {
            // Update dispatch info with recall flight
            aircraft.automatedFlight = recallFlight;
            dispatchInfo.automatedFlight = recallFlight;
            dispatchInfo.isRecalling = true;
            dispatchInfo.recallStartTime = Date.now();
            
            console.log(`Started recall procedure for ${aircraft.type}`);
        } else {
            // Fallback: immediate reset if recall flight couldn't be created
            this.forceRecallAircraft(index);
        }
        
        this.updateUI();
    }
    
    /**
     * Force immediate recall of aircraft (emergency procedure)
     * @param {number} index - Aircraft index
     */
    forceRecallAircraft(index) {
        const dispatchInfo = this.dispatchedAircraft.get(index);
        if (!dispatchInfo) return;
        
        const { aircraft } = dispatchInfo;
        
        console.log(`Force recalling ${aircraft.type} (Aircraft ${index + 1})`);
        
        // Get parking spot for aircraft type
        const parkingSpot = this.flightAutomation.taxiSystem.getParkingSpot(aircraft.type);
        
        // Reset aircraft to parking position
        aircraft.position.set(parkingSpot.x, 1.0, parkingSpot.z);
        aircraft.rotation.set(0, parkingSpot.heading || 0, 0);
        aircraft.speed = 0;
        aircraft.isActive = false;
        aircraft.automatedFlight = null;
        
        // Update mesh
        if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
            aircraft.mesh.rotation.copy(aircraft.rotation);
        }
        
        // Remove from dispatched list
        this.dispatchedAircraft.delete(index);
        
        this.updateUI();
    }
    
    /**
     * Create flight plan for aircraft type
     * @param {Aircraft} aircraft - Aircraft to create plan for
     * @returns {Object} Flight plan
     */
    createFlightPlan(aircraft) {
        const baseFlightPlan = {
            aircraftType: aircraft.type,
            startPosition: aircraft.position.clone(),
            phases: []
        };
        
        if (aircraft.type === 'helicopter') {
            return this.createHelicopterDispatchPlan(baseFlightPlan, aircraft);
        } else {
            return this.createFixedWingDispatchPlan(baseFlightPlan, aircraft);
        }
    }
    
    /**
     * Create enhanced flight plan for fixed-wing aircraft with proper taxi and runway procedures
     * @param {Object} basePlan - Base flight plan
     * @param {Aircraft} aircraft - Aircraft
     * @returns {Object} Complete flight plan
     */
    createFixedWingDispatchPlan(basePlan, aircraft) {
        const plan = { ...basePlan };
        
        plan.phases = [
            {
                name: 'taxi_to_runway',
                duration: 0, // Duration determined by taxi system
                timeBasedProgress: false
            },
            {
                name: 'takeoff',
                duration: 12000, // Longer for proper runway usage
                targetPosition: new THREE.Vector3(50, 30, 0), // End beyond runway
                speed: aircraft.specs.maxSpeed * 0.8
            },
            {
                name: 'climb',
                duration: 10000,
                targetPosition: new THREE.Vector3(150, 60, 100),
                speed: aircraft.specs.maxSpeed
            },
            {
                name: 'cruise_out',
                duration: 15000,
                targetPosition: new THREE.Vector3(300, 80, 200),
                speed: aircraft.specs.maxSpeed
            },
            {
                name: 'cruise_pattern',
                duration: 20000,
                targetPosition: new THREE.Vector3(200, 70, -200),
                speed: aircraft.specs.maxSpeed * 0.9
            },
            {
                name: 'return_leg',
                duration: 12000,
                targetPosition: new THREE.Vector3(-100, 50, -100),
                speed: aircraft.specs.maxSpeed * 0.8
            },
            {
                name: 'traffic_pattern',
                duration: 8000,
                targetPosition: new THREE.Vector3(150, 40, 50),
                speed: aircraft.specs.maxSpeed * 0.6
            },
            {
                name: 'final_approach',
                duration: 8000,
                targetPosition: new THREE.Vector3(120, 30, 0),
                speed: aircraft.specs.maxSpeed * 0.5
            },
            {
                name: 'landing',
                duration: 12000, // Longer for proper landing sequence
                targetPosition: new THREE.Vector3(-60, 1.0, 0),
                speed: aircraft.specs.maxSpeed * 0.3
            },
            {
                name: 'taxi_to_parking',
                duration: 0, // Duration determined by taxi system
                timeBasedProgress: false
            }
        ];
        
        return plan;
    }
    
    /**
     * Create enhanced flight plan for helicopter with vertical operations
     * @param {Object} basePlan - Base flight plan
     * @param {Aircraft} aircraft - Aircraft
     * @returns {Object} Complete flight plan
     */
    createHelicopterDispatchPlan(basePlan, aircraft) {
        const plan = { ...basePlan };
        
        plan.phases = [
            {
                name: 'vertical_takeoff',
                duration: 6000,
                targetPosition: new THREE.Vector3(
                    basePlan.startPosition.x,
                    35,
                    basePlan.startPosition.z
                ),
                speed: aircraft.specs.maxSpeed * 0.6
            },
            {
                name: 'departure',
                duration: 8000,
                targetPosition: new THREE.Vector3(0, 40, 0),
                speed: aircraft.specs.maxSpeed * 0.8
            },
            {
                name: 'patrol_north',
                duration: 12000,
                targetPosition: new THREE.Vector3(150, 45, 150),
                speed: aircraft.specs.maxSpeed
            },
            {
                name: 'patrol_east',
                duration: 10000,
                targetPosition: new THREE.Vector3(200, 40, -100),
                speed: aircraft.specs.maxSpeed * 0.9
            },
            {
                name: 'patrol_south',
                duration: 12000,
                targetPosition: new THREE.Vector3(-100, 35, -200),
                speed: aircraft.specs.maxSpeed * 0.8
            },
            {
                name: 'patrol_west',
                duration: 10000,
                targetPosition: new THREE.Vector3(-200, 40, 100),
                speed: aircraft.specs.maxSpeed * 0.7
            },
            {
                name: 'return_approach',
                duration: 8000,
                targetPosition: new THREE.Vector3(
                    basePlan.startPosition.x - 20,
                    25,
                    basePlan.startPosition.z
                ),
                speed: aircraft.specs.maxSpeed * 0.6
            },
            {
                name: 'hover_approach',
                duration: 4000,
                targetPosition: new THREE.Vector3(
                    basePlan.startPosition.x,
                    15,
                    basePlan.startPosition.z
                ),
                speed: 0.2
            },
            {
                name: 'vertical_landing',
                duration: 5000,
                targetPosition: basePlan.startPosition,
                speed: 0.1
            }
        ];
        
        return plan;
    }
    
    /**
     * Enter control tower mode
     */
    enter() {
        this.isActive = true;
        console.log('Entered Control Tower');
        console.log('Use number keys 1-5 to dispatch/recall aircraft');
        this.updateUI();
    }
    
    /**
     * Exit control tower mode
     */
    exit() {
        this.isActive = false;
        console.log('Exited Control Tower');
        this.updateUI();
    }
    
    /**
     * Update all dispatched aircraft
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        const completedFlights = [];
        
        this.dispatchedAircraft.forEach((dispatchInfo, index) => {
            const { aircraft, automatedFlight, isRecalling } = dispatchInfo;
            
            if (automatedFlight && aircraft.isActive) {
                const isComplete = this.flightAutomation.updateFlight(
                    automatedFlight, 
                    deltaTime
                );
                
                if (isComplete) {
                    if (isRecalling) {
                        // Recall flight completed - aircraft is now parked
                        completedFlights.push(index);
                    } else {
                        // Normal dispatch flight completed - start recall
                        this.recallAircraft(index);
                    }
                }
            }
        });
        
        // Remove completed recall flights
        completedFlights.forEach(index => {
            this.finalizeRecall(index);
        });
    }
    
    /**
     * Finalize aircraft recall after landing and taxi to parking
     * @param {number} index - Aircraft index
     */
    finalizeRecall(index) {
        const dispatchInfo = this.dispatchedAircraft.get(index);
        if (!dispatchInfo) return;
        
        const { aircraft } = dispatchInfo;
        
        console.log(`Recall completed for ${aircraft.type} (Aircraft ${index + 1})`);
        
        // Ensure aircraft is properly positioned at parking spot
        const parkingSpot = this.flightAutomation.taxiSystem.getParkingSpot(aircraft.type);
        aircraft.position.set(parkingSpot.x, 1.0, parkingSpot.z);
        aircraft.rotation.set(0, parkingSpot.heading || 0, 0);
        aircraft.speed = 0;
        aircraft.isActive = false;
        aircraft.automatedFlight = null;
        
        // Update mesh
        if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
            aircraft.mesh.rotation.copy(aircraft.rotation);
        }
        
        // Remove from dispatched list
        this.dispatchedAircraft.delete(index);
        
        this.updateUI();
    }
    
    /**
     * Get control tower status for UI
     * @returns {Object} Status information
     */
    getStatus() {
        const dispatchedInfo = [];
        
        this.dispatchedAircraft.forEach((info, index) => {
            const { aircraft, automatedFlight } = info;
            dispatchedInfo.push({
                index: index + 1,
                type: aircraft.type,
                phase: automatedFlight ? automatedFlight.currentPhase : 'unknown',
                progress: automatedFlight ? 
                    Math.round(automatedFlight.phaseProgress * 100) : 0
            });
        });
        
        return {
            isActive: this.isActive,
            dispatchedCount: this.dispatchedAircraft.size,
            totalAircraft: this.aircraftList.length,
            dispatched: dispatchedInfo
        };
    }
    
    /**
     * Update UI display
     */
    updateUI() {
        // This will be handled by the UI module
        const event = new CustomEvent('controltower-update', {
            detail: this.getStatus()
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Emergency recall all aircraft
     */
    emergencyRecallAll() {
        console.log('Emergency recall initiated - returning all aircraft');
        
        const aircraftToRecall = Array.from(this.dispatchedAircraft.keys());
        aircraftToRecall.forEach(index => {
            this.recallAircraft(index);
        });
    }
    
    /**
     * Get position for camera
     * @returns {THREE.Vector3}
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * Check if currently in control tower
     * @returns {boolean}
     */
    isInControlTower() {
        return this.isActive;
    }
    
    /**
     * Dispose of control tower resources
     */
    dispose() {
        this.emergencyRecallAll();
        this.flightAutomation.dispose();
    }
}