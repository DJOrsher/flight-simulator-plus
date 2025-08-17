/**
 * GroundOpsController - Manages ground vehicle operations
 * Single Responsibility: Ground vehicle coordination
 */

import { eventBus } from '../events/EventBus.js';
import { stateManager } from '../state/StateManager.js';
import { timerManager } from '../timing/TimerManager.js';

export class GroundOpsController {
    constructor() {
        this.groundVehicles = [];
        this.vehicleOperations = new Map();
        this.setupEventListeners();
        this.initializeGroundVehicles();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        eventBus.on('ground.vehicle.request', (data) => this.handleVehicleRequest(data));
        eventBus.on('ground.vehicle.start.pushback', (data) => this.handleStartPushback(data));
    }

    /**
     * Initialize ground vehicles (simplified for new architecture)
     */
    initializeGroundVehicles() {
        // Create simple ground vehicle objects
        const vehicles = [
            { id: 'tug_1', type: 'pushback_tug', position: { x: -60, y: 0, z: 55 }, available: true },
            { id: 'tug_2', type: 'pushback_tug', position: { x: -20, y: 0, z: 55 }, available: true }
        ];

        this.groundVehicles.push(...vehicles);
        console.log(`🚛 GROUND OPS: Initialized ${vehicles.length} ground vehicles`);
    }

    /**
     * Handle vehicle request
     */
    handleVehicleRequest(data) {
        const { aircraftId, operation, aircraft } = data;
        
        console.log(`🚛 VEHICLE REQUEST: ${aircraftId} requesting ${operation}`);

        // Find available vehicle
        const vehicle = this.getAvailableVehicle();
        if (!vehicle) {
            console.log(`❌ NO VEHICLE: No ground vehicle available for ${aircraftId}`);
            // Skip pushback, go directly to independent taxi
            eventBus.emit('ground.vehicle.unavailable', { aircraftId });
            return;
        }

        // Reserve vehicle
        vehicle.available = false;
        vehicle.assignedTo = aircraftId;

        console.log(`✅ VEHICLE ASSIGNED: ${vehicle.id} assigned to ${aircraftId}`);

        // Emit vehicle available event
        eventBus.emit('ground.vehicle.available', {
            aircraftId,
            vehicle
        });
    }

    /**
     * Handle start pushback
     */
    handleStartPushback(data) {
        const { vehicleId, aircraftId, aircraft } = data;
        
        console.log(`🚛 PUSHBACK START: ${vehicleId} starting pushback for ${aircraftId}`);

        // Set aircraft as being towed
        aircraft.isBeingTowed = true;

        // Simulate pushback operation with timer
        const pushbackTime = 8000; // 8 seconds
        const timerId = timerManager.setTimeout(() => {
            this.completePushback(vehicleId, aircraftId, aircraft);
        }, pushbackTime, `pushback_${aircraftId}`);

        // Store operation
        this.vehicleOperations.set(vehicleId, {
            aircraftId,
            aircraft,
            operation: 'pushback',
            timerId
        });

        // Position aircraft slightly away from parking (simplified pushback)
        const parkingPos = aircraft.position.clone();
        aircraft.position.x = parkingPos.x + 5; // Move 5 units forward
        aircraft.position.z = parkingPos.z - 3; // Move 3 units toward taxiway
        
        if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
        }

        console.log(`🚛 PUSHBACK: ${aircraftId} being pushed to taxiway position`);
    }

    /**
     * Complete pushback operation
     */
    completePushback(vehicleId, aircraftId, aircraft) {
        console.log(`✅ PUSHBACK COMPLETE: ${vehicleId} finished pushing ${aircraftId}`);

        // Release aircraft from tow control
        aircraft.isBeingTowed = false;

        // Release vehicle
        const vehicle = this.groundVehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            vehicle.available = true;
            vehicle.assignedTo = null;
        }

        // Clean up operation
        const operation = this.vehicleOperations.get(vehicleId);
        if (operation) {
            this.vehicleOperations.delete(vehicleId);
        }

        // Emit pushback complete event
        eventBus.emit('ground.vehicle.pushback.complete', {
            vehicleId,
            aircraftId,
            aircraft
        });
    }

    /**
     * Get available vehicle
     */
    getAvailableVehicle() {
        return this.groundVehicles.find(vehicle => vehicle.available);
    }

    /**
     * Get all ground vehicles
     */
    getGroundVehicles() {
        return [...this.groundVehicles];
    }

    /**
     * Dispose controller
     */
    dispose() {
        // Clear all operations
        for (const [vehicleId, operation] of this.vehicleOperations) {
            if (operation.timerId) {
                timerManager.clearTimeout(operation.timerId);
            }
        }
        this.vehicleOperations.clear();
        
        // Reset all vehicles
        this.groundVehicles.forEach(vehicle => {
            vehicle.available = true;
            vehicle.assignedTo = null;
        });
    }
}

// Export singleton instance
export const groundOpsController = new GroundOpsController();