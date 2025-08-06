/**
 * Taxi System Module
 * Handles aircraft ground movement, taxi routes, and parking procedures
 */

import { PARKING_SPOTS, RUNWAY_SYSTEM } from '../utils/Constants.js';
import * as MathUtils from '../utils/MathUtils.js';
import { GroundSupportVehicle } from '../environment/GroundSupportVehicle.js';

export class TaxiSystem {
    constructor() {
        this.taxiRoutes = new Map();
        this.runwayQueue = [];
        this.activeTaxiOperations = new Map();
        this.groundVehicles = [];
        this.vehicleOperations = new Map();
        
        this.initializeTaxiRoutes();
        this.initializeGroundVehicles();
    }
    
    /**
     * Initialize taxi routes for all aircraft types
     */
    initializeTaxiRoutes() {
        // Enhanced taxi routes with proper waypoints
        this.taxiRoutes.set('cessna', {
            parkingSpot: { x: -20, z: 25, heading: 0 },
            toRunway: [
                { x: -20, z: 25, name: 'parking' },
                { x: -20, z: 15, name: 'taxiway_entry' },
                { x: -60, z: 15, name: 'taxiway_main' },
                { x: -90, z: 15, name: 'runway_approach' },
                { x: -90, z: 5, name: 'runway_threshold' },
                { x: -90, z: 0, name: 'runway_position', heading: 0 }
            ],
            fromRunway: [
                { x: 90, z: 0, name: 'runway_exit', heading: Math.PI },
                { x: 90, z: 15, name: 'runway_clear' },
                { x: 60, z: 15, name: 'taxiway_return' },
                { x: -20, z: 15, name: 'taxiway_final' },
                { x: -20, z: 25, name: 'parking', heading: 0 }
            ]
        });
        
        this.taxiRoutes.set('fighter', {
            parkingSpot: { x: 20, z: 25, heading: Math.PI / 4 },
            toRunway: [
                { x: 20, z: 25, name: 'parking' },
                { x: 20, z: 15, name: 'taxiway_entry' },
                { x: -30, z: 15, name: 'taxiway_main' },
                { x: -90, z: 15, name: 'runway_approach' },
                { x: -90, z: 5, name: 'runway_threshold' },
                { x: -90, z: 0, name: 'runway_position', heading: 0 }
            ],
            fromRunway: [
                { x: 90, z: 0, name: 'runway_exit', heading: Math.PI },
                { x: 90, z: 15, name: 'runway_clear' },
                { x: 60, z: 15, name: 'taxiway_return' },
                { x: 20, z: 15, name: 'taxiway_final' },
                { x: 20, z: 25, name: 'parking', heading: Math.PI / 4 }
            ]
        });
        
        this.taxiRoutes.set('airliner', {
            parkingSpot: { x: 0, z: 40, heading: 0 },
            toRunway: [
                { x: 0, z: 40, name: 'parking' },
                { x: 0, z: 15, name: 'taxiway_entry' },
                { x: -60, z: 15, name: 'taxiway_main' },
                { x: -90, z: 15, name: 'runway_approach' },
                { x: -90, z: 5, name: 'runway_threshold' },
                { x: -90, z: 0, name: 'runway_position', heading: 0 }
            ],
            fromRunway: [
                { x: 90, z: 0, name: 'runway_exit', heading: Math.PI },
                { x: 90, z: 15, name: 'runway_clear' },
                { x: 30, z: 15, name: 'taxiway_return' },
                { x: 0, z: 15, name: 'taxiway_final' },
                { x: 0, z: 40, name: 'parking', heading: 0 }
            ]
        });
        
        this.taxiRoutes.set('cargo', {
            parkingSpot: { x: 40, z: 25, heading: -Math.PI / 4 },
            toRunway: [
                { x: 40, z: 25, name: 'parking' },
                { x: 40, z: 15, name: 'taxiway_entry' },
                { x: 0, z: 15, name: 'taxiway_main' },
                { x: -60, z: 15, name: 'runway_approach' },
                { x: -90, z: 15, name: 'runway_threshold' },
                { x: -90, z: 0, name: 'runway_position', heading: 0 }
            ],
            fromRunway: [
                { x: 90, z: 0, name: 'runway_exit', heading: Math.PI },
                { x: 90, z: 15, name: 'runway_clear' },
                { x: 60, z: 15, name: 'taxiway_return' },
                { x: 40, z: 15, name: 'taxiway_final' },
                { x: 40, z: 25, name: 'parking', heading: -Math.PI / 4 }
            ]
        });
        
        this.taxiRoutes.set('helicopter', {
            parkingSpot: { x: -80, z: -30, heading: 0 },
            // Helicopters don't need taxi routes - they can take off/land vertically
            toRunway: [],
            fromRunway: []
        });
    }
    
    /**
     * Initialize ground support vehicles
     */
    initializeGroundVehicles() {
        console.log('Initializing ground support vehicles...');
        
        // Create pushback tugs at specific hangar positions
        const tug1 = new GroundSupportVehicle('pushback_tug');
        const tug2 = new GroundSupportVehicle('pushback_tug');
        
        // Position them in different hangars and update mesh position
        tug1.position.set(-60, 0, 55);
        tug1.updateMeshPosition();
        
        tug2.position.set(-20, 0, 55);
        tug2.updateMeshPosition();
        
        this.groundVehicles.push(tug1, tug2);
        
        console.log(`Created ${this.groundVehicles.length} ground support vehicles`);
        console.log(`Tug1 position:`, tug1.position);
        console.log(`Tug2 position:`, tug2.position);
        console.log(`Tug1 mesh:`, tug1.getMesh() ? 'valid' : 'null');
        console.log(`Tug2 mesh:`, tug2.getMesh() ? 'valid' : 'null');
    }
    
    /**
     * Get taxi route for aircraft type and direction
     * @param {string} aircraftType - Type of aircraft
     * @param {string} direction - 'toRunway' or 'fromRunway'
     * @returns {Array} Array of waypoints
     */
    getTaxiRoute(aircraftType, direction) {
        const routes = this.taxiRoutes.get(aircraftType);
        if (!routes) return [];
        
        return routes[direction] || [];
    }
    
    /**
     * Get parking spot for aircraft type
     * @param {string} aircraftType - Type of aircraft
     * @returns {Object} Parking spot coordinates and heading
     */
    getParkingSpot(aircraftType) {
        const routes = this.taxiRoutes.get(aircraftType);
        return routes ? routes.parkingSpot : { x: 0, z: 0, heading: 0 };
    }
    
    /**
     * Start taxi operation for aircraft with ground support vehicle
     * @param {Object} aircraft - Aircraft object
     * @param {string} direction - 'toRunway' or 'fromRunway'
     * @returns {Object} Taxi operation object
     */
    startTaxiOperation(aircraft, direction) {
        const route = this.getTaxiRoute(aircraft.type, direction);
        if (route.length === 0) return null;
        
        const taxiOperation = {
            aircraft,
            direction,
            route: [...route], // Copy the route
            currentWaypointIndex: 0,
            startTime: Date.now(),
            isComplete: false,
            taxiSpeed: 0.15, // Realistic taxi speed
            turnRate: 0.03,
            phase: 'waiting_for_vehicle', // New phase system
            groundVehicle: null
        };
        
        // Assign ground support vehicle for toRunway operations
        if (direction === 'toRunway') {
            const vehicle = this.getAvailableGroundVehicle();
            if (vehicle) {
                taxiOperation.groundVehicle = vehicle;
                taxiOperation.phase = 'vehicle_dispatched';
                
                // Start pushback operation
                vehicle.startPushbackOperation(aircraft, route);
                this.vehicleOperations.set(vehicle, taxiOperation);
                
                console.log(`Ground vehicle assigned to ${aircraft.type} for pushback`);
            }
        }
        
        this.activeTaxiOperations.set(aircraft.id || aircraft.type, taxiOperation);
        
        console.log(`Started taxi operation: ${aircraft.type} ${direction}`);
        return taxiOperation;
    }
    
    /**
     * Update taxi operation
     * @param {Object} taxiOperation - Taxi operation to update
     * @param {number} deltaTime - Time since last update
     * @returns {boolean} True if taxi operation is complete
     */
    updateTaxiOperation(taxiOperation, deltaTime) {
        if (!taxiOperation || taxiOperation.isComplete) {
            return true;
        }
        
        const { aircraft, route, currentWaypointIndex, phase, groundVehicle } = taxiOperation;
        
        // Handle different phases of taxi operation
        if (phase === 'waiting_for_vehicle' || phase === 'vehicle_dispatched') {
            // Wait for ground vehicle to complete pushback
            if (groundVehicle && groundVehicle.getState() === 'returning') {
                taxiOperation.phase = 'independent_taxi';
                taxiOperation.currentWaypointIndex = Math.min(2, route.length - 1); // Skip initial waypoints
                console.log(`${aircraft.type} released for independent taxi`);
            } else if (!groundVehicle) {
                // No ground vehicle available, proceed with independent taxi
                taxiOperation.phase = 'independent_taxi';
                taxiOperation.currentWaypointIndex = 0;
                console.log(`${aircraft.type} proceeding with independent taxi (no vehicle available)`);
            }
            
            if (taxiOperation.phase === 'independent_taxi') {
                // Continue to independent taxi logic below
            } else {
                return false; // Continue waiting
            }
        }
        
        const currentWaypoint = route[currentWaypointIndex];
        
        if (!currentWaypoint) {
            taxiOperation.isComplete = true;
            return true;
        }
        
        // Calculate distance to current waypoint
        const distanceToWaypoint = MathUtils.distance3D(
            aircraft.position,
            new THREE.Vector3(currentWaypoint.x, aircraft.position.y, currentWaypoint.z)
        );
        
        // Check if reached waypoint
        if (distanceToWaypoint < 2.0) {
            // Move to next waypoint
            taxiOperation.currentWaypointIndex++;
            
            if (taxiOperation.currentWaypointIndex >= route.length) {
                // Taxi operation complete
                taxiOperation.isComplete = true;
                this.finalizeTaxiOperation(taxiOperation);
                return true;
            }
        } else {
            // Move towards current waypoint
            this.moveAircraftTowardsWaypoint(aircraft, currentWaypoint, taxiOperation);
        }
        
        return false;
    }
    
    /**
     * Move aircraft towards waypoint
     * @param {Object} aircraft - Aircraft object
     * @param {Object} waypoint - Target waypoint
     * @param {Object} taxiOperation - Taxi operation
     */
    moveAircraftTowardsWaypoint(aircraft, waypoint, taxiOperation) {
        const targetPos = new THREE.Vector3(waypoint.x, aircraft.position.y, waypoint.z);
        const direction = targetPos.clone().sub(aircraft.position).normalize();
        
        // Calculate desired heading
        const desiredHeading = Math.atan2(-direction.x, -direction.z);
        
        // Smoothly turn towards desired heading
        const headingDiff = MathUtils.normalizeAngle(desiredHeading - aircraft.rotation.y);
        const maxTurnRate = taxiOperation.turnRate;
        
        if (Math.abs(headingDiff) > maxTurnRate) {
            aircraft.rotation.y += Math.sign(headingDiff) * maxTurnRate;
        } else {
            aircraft.rotation.y = desiredHeading;
        }
        
        aircraft.rotation.y = MathUtils.normalizeAngle(aircraft.rotation.y);
        
        // Move forward
        const forwardDirection = new THREE.Vector3(
            Math.sin(aircraft.rotation.y),
            0,
            Math.cos(aircraft.rotation.y)
        );
        
        const moveDistance = taxiOperation.taxiSpeed;
        aircraft.position.add(forwardDirection.multiplyScalar(moveDistance));
        
        // Keep on ground
        aircraft.position.y = Math.max(aircraft.position.y, 1.0);
        
        // Update aircraft speed for visual feedback
        aircraft.speed = taxiOperation.taxiSpeed;
        
        // Update mesh position
        if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
            aircraft.mesh.rotation.copy(aircraft.rotation);
        }
    }
    
    /**
     * Finalize taxi operation
     * @param {Object} taxiOperation - Completed taxi operation
     */
    finalizeTaxiOperation(taxiOperation) {
        const { aircraft, direction, route } = taxiOperation;
        const finalWaypoint = route[route.length - 1];
        
        // Set final position and heading
        aircraft.position.set(finalWaypoint.x, 1.0, finalWaypoint.z);
        
        if (finalWaypoint.heading !== undefined) {
            aircraft.rotation.y = finalWaypoint.heading;
        }
        
        // Update mesh
        if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
            aircraft.mesh.rotation.copy(aircraft.rotation);
        }
        
        // Remove from active operations
        this.activeTaxiOperations.delete(aircraft.id || aircraft.type);
        
        console.log(`Taxi operation complete: ${aircraft.type} ${direction} - ${finalWaypoint.name}`);
    }
    
    /**
     * Get runway takeoff position for aircraft type
     * @param {string} aircraftType - Aircraft type
     * @returns {Object} Takeoff position and heading
     */
    getRunwayTakeoffPosition(aircraftType) {
        // All aircraft use west end of runway for takeoff
        return {
            x: -90,
            y: 1.0,
            z: 0,
            heading: 0 // Facing east
        };
    }
    
    /**
     * Get runway landing position
     * @returns {Object} Landing approach position
     */
    getRunwayLandingApproach() {
        return {
            x: 120, // Start approach from east
            y: 30,
            z: 0,
            heading: Math.PI // Facing west
        };
    }
    
    /**
     * Check if runway is clear for operation
     * @param {string} operation - 'takeoff' or 'landing'
     * @returns {boolean} True if runway is clear
     */
    isRunwayClear(operation) {
        // Simple implementation - in real system would check for other aircraft
        return this.runwayQueue.length === 0;
    }
    
    /**
     * Reserve runway for operation
     * @param {Object} aircraft - Aircraft reserving runway
     * @param {string} operation - 'takeoff' or 'landing'
     */
    reserveRunway(aircraft, operation) {
        this.runwayQueue.push({
            aircraft,
            operation,
            startTime: Date.now()
        });
        
        console.log(`Runway reserved for ${aircraft.type} ${operation}`);
    }
    
    /**
     * Release runway after operation
     * @param {Object} aircraft - Aircraft releasing runway
     */
    releaseRunway(aircraft) {
        this.runwayQueue = this.runwayQueue.filter(
            reservation => reservation.aircraft !== aircraft
        );
        
        console.log(`Runway released by ${aircraft.type}`);
    }
    
    /**
     * Get all active taxi operations
     * @returns {Map} Active taxi operations
     */
    getActiveTaxiOperations() {
        return this.activeTaxiOperations;
    }
    
    /**
     * Stop all taxi operations for aircraft
     * @param {Object} aircraft - Aircraft to stop
     */
    stopTaxiOperation(aircraft) {
        const key = aircraft.id || aircraft.type;
        if (this.activeTaxiOperations.has(key)) {
            this.activeTaxiOperations.delete(key);
            console.log(`Stopped taxi operation for ${aircraft.type}`);
        }
    }
    
    /**
     * Emergency stop all operations
     */
    emergencyStop() {
        console.log('Emergency stop - clearing all taxi operations');
        this.activeTaxiOperations.clear();
        this.runwayQueue = [];
    }
    
    /**
     * Get available ground support vehicle
     * @returns {GroundSupportVehicle|null}
     */
    getAvailableGroundVehicle() {
        return this.groundVehicles.find(vehicle => vehicle.isAvailable()) || null;
    }
    
    /**
     * Update all ground vehicles
     * @param {number} deltaTime - Time since last update
     */
    updateGroundVehicles(deltaTime) {
        // Debug: Log ground vehicle count
        if (this.groundVehicles.length === 0) {
            console.warn('No ground vehicles found in taxi system!');
            return;
        }
        
        this.groundVehicles.forEach((vehicle, index) => {
            vehicle.update(deltaTime);
            
            // Debug: Log vehicle state occasionally
            if (Date.now() % 5000 < 100) { // Every 5 seconds
                console.log(`Vehicle ${index}: state=${vehicle.getState()}, active=${vehicle.isActive}`);
            }
            
            // Check if pushback is complete
            if (vehicle.getState() === 'returning') {
                const operation = this.vehicleOperations.get(vehicle);
                if (operation) {
                    // Transition aircraft to independent taxi
                    operation.phase = 'independent_taxi';
                    operation.currentWaypointIndex = 2; // Skip initial waypoints
                    this.vehicleOperations.delete(vehicle);
                    
                    console.log(`${operation.aircraft.type} released for independent taxi`);
                }
            }
        });
    }
    
    /**
     * Get all ground vehicles for adding to scene
     * @returns {Array} Array of vehicle meshes
     */
    getGroundVehicleMeshes() {
        console.log(`Providing ${this.groundVehicles.length} ground vehicle meshes to scene`);
        return this.groundVehicles.map(vehicle => {
            const mesh = vehicle.getMesh();
            console.log(`Vehicle mesh: ${mesh ? 'valid' : 'null'} at position`, vehicle.position);
            return mesh;
        }).filter(mesh => mesh !== null);
    }
    
    /**
     * Dispose of taxi system resources
     */
    dispose() {
        this.emergencyStop();
        this.groundVehicles.forEach(vehicle => vehicle.dispose());
        this.groundVehicles = [];
        this.vehicleOperations.clear();
        this.taxiRoutes.clear();
    }
}