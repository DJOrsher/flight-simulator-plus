/**
 * TaxiController - Orchestrates taxi operations using modular architecture
 * Single Responsibility: Taxi operation coordination
 */

import { eventBus } from '../events/EventBus.js';
import { stateManager } from '../state/StateManager.js';
import { configManager } from '../config/ConfigManager.js';
import { timerManager } from '../timing/TimerManager.js';
import { TaxiStateMachine } from '../state-machines/TaxiStateMachine.js';
import { 
    getTaxiRoute, 
    calculateRouteTime 
} from '../utils/RouteCalculator.js';
import { 
    hasReachedWaypoint,
    getDistanceToWaypoint 
} from '../utils/PositionValidator.js';
import { 
    calculateTaxiMovement 
} from '../utils/MovementCalculator.js';
import { 
    validateTaxiRequirements 
} from '../utils/ValidationRules.js';

export class TaxiController {
    constructor() {
        this.activeOperations = new Map();
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        eventBus.on('taxi.requested', (data) => this.handleTaxiRequest(data));
        eventBus.on('taxi.state.changed', (data) => this.handleStateChange(data));
        eventBus.on('ground.vehicle.available', (data) => this.handleVehicleAvailable(data));
        eventBus.on('ground.vehicle.unavailable', (data) => this.handleVehicleUnavailable(data));
        eventBus.on('ground.vehicle.pushback.complete', (data) => this.handlePushbackComplete(data));
    }

    /**
     * Start taxi operation
     * @param {Object} aircraft - Aircraft object
     * @param {string} direction - 'toRunway' or 'fromRunway'
     * @returns {Promise} Operation promise
     */
    async startTaxiOperation(aircraft, direction) {
        const aircraftId = aircraft.id || `${aircraft.type}_${Date.now()}`;
        aircraft.id = aircraftId;

        console.log(`🚖 TAXI START: ${aircraftId} direction=${direction}`);

        // Validate requirements
        const validation = validateTaxiRequirements(aircraft, direction);
        if (!validation.isValid) {
            console.error(`Taxi validation failed for ${aircraftId}:`, validation.violations);
            throw new Error(`Taxi validation failed: ${validation.violations.join(', ')}`);
        }

        // Skip taxi for helicopters
        if (aircraft.type === 'helicopter') {
            console.log(`🚁 HELICOPTER: ${aircraftId} skipping taxi operation`);
            stateManager.setState(aircraftId, {
                operation: 'taxi',
                phase: 'complete',
                reason: 'helicopter_no_taxi_needed'
            });
            return Promise.resolve();
        }

        // Create state machine
        const stateMachine = new TaxiStateMachine(aircraftId);
        
        // Get taxi route
        const route = getTaxiRoute(aircraft.type, direction);
        if (!route || route.length === 0) {
            throw new Error(`No taxi route found for ${aircraft.type} ${direction}`);
        }

        // Create operation
        const operation = {
            aircraftId,
            aircraft,
            direction,
            route,
            stateMachine,
            currentWaypointIndex: 1, // Start at waypoint 1 (0 is parking)
            startTime: Date.now(),
            groundVehicle: null,
            timerId: null
        };

        this.activeOperations.set(aircraftId, operation);

        // Start state machine
        stateMachine.transition('requesting_vehicle', {
            direction,
            routeLength: route.length
        });

        return new Promise((resolve, reject) => {
            operation.resolve = resolve;
            operation.reject = reject;

            // Set timeout
            const timeoutConfig = configManager.getTimingConfig('taxi');
            const timeout = timeoutConfig.timeout || 120000; // 2 minutes

            operation.timerId = timerManager.setTimeout(() => {
                this.handleTimeout(aircraftId);
            }, timeout, `taxi_timeout_${aircraftId}`);

            // Request ground vehicle for toRunway operations
            if (direction === 'toRunway') {
                eventBus.emit('ground.vehicle.request', {
                    aircraftId,
                    operation: 'pushback',
                    aircraft,
                    route
                });
            } else {
                // fromRunway operations start immediately with independent taxi
                stateMachine.transition('independent_taxi', {
                    reason: 'no_pushback_needed'
                });
            }
        });
    }

    /**
     * Handle taxi request event
     */
    handleTaxiRequest(data) {
        const { aircraft, direction } = data;
        this.startTaxiOperation(aircraft, direction)
            .then(() => {
                eventBus.emit('taxi.completed', { aircraftId: aircraft.id });
            })
            .catch((error) => {
                eventBus.emit('taxi.error', { aircraftId: aircraft.id, error });
            });
    }

    /**
     * Handle state change
     */
    handleStateChange(data) {
        const { aircraftId, currentState } = data;
        const operation = this.activeOperations.get(aircraftId);
        
        if (!operation) return;

        switch (currentState) {
            case 'independent_taxi':
                this.startIndependentTaxi(operation);
                break;
                
            case 'complete':
                this.completeOperation(operation);
                break;
                
            case 'error':
                this.errorOperation(operation, data.context?.reason || 'unknown_error');
                break;
        }
    }

    /**
     * Handle vehicle unavailable
     */
    handleVehicleUnavailable(data) {
        const { aircraftId } = data;
        const operation = this.activeOperations.get(aircraftId);
        
        if (!operation || operation.stateMachine.getState() !== 'requesting_vehicle') {
            return;
        }

        console.log(`🚶 NO VEHICLE: ${aircraftId} proceeding with independent taxi`);
        operation.stateMachine.transition('independent_taxi', {
            reason: 'no_vehicle_available'
        });
    }

    /**
     * Handle vehicle available
     */
    handleVehicleAvailable(data) {
        const { aircraftId, vehicle } = data;
        const operation = this.activeOperations.get(aircraftId);
        
        if (!operation || operation.stateMachine.getState() !== 'requesting_vehicle') {
            return;
        }

        operation.groundVehicle = vehicle;
        operation.stateMachine.transition('vehicle_dispatched', {
            vehicleId: vehicle.id
        });

        // Start pushback
        eventBus.emit('ground.vehicle.start.pushback', {
            vehicleId: vehicle.id,
            aircraftId,
            aircraft: operation.aircraft,
            route: operation.route
        });

        operation.stateMachine.transition('being_pushed');
    }

    /**
     * Handle pushback complete
     */
    handlePushbackComplete(data) {
        const { aircraftId } = data;
        const operation = this.activeOperations.get(aircraftId);
        
        if (!operation) return;

        // Release aircraft from tow control
        operation.aircraft.isBeingTowed = false;
        
        // Transition to independent taxi
        operation.stateMachine.transition('independent_taxi', {
            reason: 'pushback_complete'
        });
    }

    /**
     * Start independent taxi movement
     */
    startIndependentTaxi(operation) {
        const { aircraftId, aircraft, route } = operation;
        
        console.log(`🚶 INDEPENDENT TAXI: ${aircraftId} starting waypoint navigation`);
        
        // Set up position at correct waypoint
        if (operation.direction === 'toRunway') {
            operation.currentWaypointIndex = Math.max(1, Math.min(2, route.length - 1));
        } else {
            operation.currentWaypointIndex = 1;
        }

        // Start movement update loop
        this.updateTaxiMovement(operation);
    }

    /**
     * Update taxi movement
     */
    updateTaxiMovement(operation) {
        const { aircraftId, aircraft, route, stateMachine } = operation;
        
        if (stateMachine.getState() !== 'independent_taxi') {
            return; // Stop updating if not in taxi state
        }

        const currentWaypoint = route[operation.currentWaypointIndex];
        if (!currentWaypoint) {
            // Reached end of route
            stateMachine.transition('complete', {
                reason: 'route_complete',
                finalPosition: aircraft.position
            });
            return;
        }

        // Check if reached current waypoint
        if (hasReachedWaypoint(aircraft.position, currentWaypoint)) {
            operation.currentWaypointIndex++;
            console.log(`📍 WAYPOINT: ${aircraftId} reached waypoint ${operation.currentWaypointIndex}/${route.length}`);
            
            if (operation.currentWaypointIndex >= route.length) {
                // Position aircraft at final waypoint precisely
                const finalWaypoint = route[route.length - 1];
                aircraft.position.x = finalWaypoint.x;
                aircraft.position.y = 1.0;
                aircraft.position.z = finalWaypoint.z;
                if (finalWaypoint.heading !== undefined) {
                    aircraft.rotation.y = finalWaypoint.heading;
                }

                // Update mesh
                if (aircraft.mesh) {
                    aircraft.mesh.position.copy(aircraft.position);
                    aircraft.mesh.rotation.set(aircraft.rotation.x, aircraft.rotation.y, aircraft.rotation.z);
                }

                stateMachine.transition('complete', {
                    reason: 'reached_final_waypoint',
                    finalPosition: { ...aircraft.position }
                });
                return;
            }
        }

        // Calculate movement to current waypoint
        const deltaTime = 16; // ~60fps
        const movement = calculateTaxiMovement(
            aircraft.position,
            currentWaypoint,
            aircraft.rotation.y,
            aircraft.type,
            deltaTime / 1000
        );

        // Update aircraft
        aircraft.position.copy(movement.position);
        aircraft.rotation.y = movement.heading;
        aircraft.speed = movement.speed;

        // Update mesh
        if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
            aircraft.mesh.rotation.set(aircraft.rotation.x, aircraft.rotation.y, aircraft.rotation.z);
        }

        // Continue movement on next frame
        requestAnimationFrame(() => this.updateTaxiMovement(operation));
    }

    /**
     * Complete operation
     */
    completeOperation(operation) {
        const { aircraftId, aircraft, direction, resolve, timerId } = operation;
        
        console.log(`✅ TAXI COMPLETE: ${aircraftId} ${direction} operation finished`);

        // Clear timeout
        if (timerId) {
            timerManager.clearTimeout(timerId);
        }

        // Final positioning
        const finalWaypoint = operation.route[operation.route.length - 1];
        if (finalWaypoint) {
            aircraft.position.set(finalWaypoint.x, 1.0, finalWaypoint.z);
            if (finalWaypoint.heading !== undefined) {
                aircraft.rotation.y = finalWaypoint.heading;
            }
            if (aircraft.mesh) {
                aircraft.mesh.position.copy(aircraft.position);
                aircraft.mesh.rotation.set(aircraft.rotation.x, aircraft.rotation.y, aircraft.rotation.z);
            }
        }

        // Clean up
        this.activeOperations.delete(aircraftId);
        
        // Resolve promise
        if (resolve) {
            resolve({
                aircraftId,
                success: true,
                finalPosition: aircraft.position
            });
        }

        // Emit completion event
        eventBus.emit('taxi.operation.completed', {
            aircraftId,
            direction,
            finalPosition: aircraft.position
        });
    }

    /**
     * Handle operation error
     */
    errorOperation(operation, reason) {
        const { aircraftId, reject, timerId } = operation;
        
        console.error(`❌ TAXI ERROR: ${aircraftId} - ${reason}`);

        // Clear timeout
        if (timerId) {
            timerManager.clearTimeout(timerId);
        }

        // Clean up
        this.activeOperations.delete(aircraftId);
        
        // Reject promise
        if (reject) {
            reject(new Error(`Taxi operation failed: ${reason}`));
        }

        // Emit error event
        eventBus.emit('taxi.operation.error', {
            aircraftId,
            reason
        });
    }

    /**
     * Handle timeout
     */
    handleTimeout(aircraftId) {
        const operation = this.activeOperations.get(aircraftId);
        if (operation) {
            operation.stateMachine.error('timeout', {
                duration: Date.now() - operation.startTime
            });
        }
    }

    /**
     * Stop taxi operation
     */
    stopTaxiOperation(aircraftId) {
        const operation = this.activeOperations.get(aircraftId);
        if (operation) {
            operation.stateMachine.error('stopped_by_user');
        }
    }

    /**
     * Get active operations
     */
    getActiveOperations() {
        return new Map(this.activeOperations);
    }

    /**
     * Dispose controller
     */
    dispose() {
        // Stop all active operations
        for (const [aircraftId, operation] of this.activeOperations) {
            if (operation.timerId) {
                timerManager.clearTimeout(operation.timerId);
            }
        }
        this.activeOperations.clear();
    }
}

// Export singleton instance
export const taxiController = new TaxiController();