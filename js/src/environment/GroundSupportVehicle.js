/**
 * Ground Support Vehicle Module
 * Handles pushback tugs and ground support equipment for aircraft operations
 */

import * as GeometryFactory from '../utils/GeometryFactory.js';
import * as MathUtils from '../utils/MathUtils.js';
import { COLORS } from '../utils/Constants.js';

export class GroundSupportVehicle {
    constructor(type = 'pushback_tug') {
        this.type = type;
        this.mesh = null;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Vector3(0, 0, 0);
        this.isActive = false;
        this.currentOperation = null;
        this.speed = 0.08; // Slower than aircraft taxi speed
        this.maxSpeed = 0.12;
        
        // Vehicle states
        this.state = 'parked'; // 'parked', 'moving_to_aircraft', 'pushing', 'returning'
        this.targetAircraft = null;
        this.waypoints = [];
        this.currentWaypointIndex = 0;
        
        this.createVehicle();
    }
    
    /**
     * Create the 3D vehicle model
     */
    createVehicle() {
        this.mesh = new THREE.Group();
        
        if (this.type === 'pushback_tug') {
            this.createPushbackTug();
        }
        
        // Start in hangar area
        this.parkInHangar();
    }
    
    /**
     * Create pushback tug model
     */
    createPushbackTug() {
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(3, 1, 2);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xffa500 }); // Orange
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Cab
        const cabGeometry = new THREE.BoxGeometry(1.5, 1.2, 1.8);
        const cabMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        const cab = new THREE.Mesh(cabGeometry, cabMaterial);
        cab.position.set(-0.75, 1.1, 0);
        cab.castShadow = true;
        this.mesh.add(cab);
        
        // Wheels
        this.createWheels();
        
        // Tow bar (extends when pushing)
        const towBarGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5);
        const towBarMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        this.towBar = new THREE.Mesh(towBarGeometry, towBarMaterial);
        this.towBar.rotation.z = Math.PI / 2;
        this.towBar.position.set(1.8, 0.3, 0);
        this.towBar.visible = false; // Hidden until needed
        this.mesh.add(this.towBar);
        
        // Warning lights
        this.createWarningLights();
    }
    
    /**
     * Create vehicle wheels
     */
    createWheels() {
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        
        const wheelPositions = [
            [-1, 0.3, -0.8],  // Front left
            [-1, 0.3, 0.8],   // Front right
            [1, 0.3, -0.8],   // Rear left
            [1, 0.3, 0.8]     // Rear right
        ];
        
        this.wheels = [];
        wheelPositions.forEach((pos, index) => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.rotation.x = Math.PI / 2;
            wheel.castShadow = true;
            this.wheels.push(wheel);
            this.mesh.add(wheel);
        });
    }
    
    /**
     * Create warning lights
     */
    createWarningLights() {
        const lightGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const lightMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            emissive: 0x444400
        });
        
        // Rotating beacon on top
        this.beacon = new THREE.Mesh(lightGeometry, lightMaterial);
        this.beacon.position.set(0, 1.8, 0);
        this.mesh.add(this.beacon);
        
        // Side lights
        const sideLight1 = new THREE.Mesh(lightGeometry, lightMaterial);
        sideLight1.position.set(1.5, 1, -1);
        this.mesh.add(sideLight1);
        
        const sideLight2 = new THREE.Mesh(lightGeometry, lightMaterial);
        sideLight2.position.set(1.5, 1, 1);
        this.mesh.add(sideLight2);
    }
    
    /**
     * Park vehicle in hangar
     */
    parkInHangar() {
        // Park in first hangar
        this.position.set(-60, 0, 55);
        this.rotation.y = 0;
        this.state = 'parked';
        this.isActive = false;
        
        this.updateMeshPosition();
    }
    
    /**
     * Start pushback operation for aircraft
     * @param {Object} aircraft - Aircraft to push
     * @param {Array} taxiRoute - Taxi route waypoints
     */
    startPushbackOperation(aircraft, taxiRoute) {
        if (this.isActive) {
            console.warn('Ground support vehicle already active, state:', this.state);
            return false;
        }
        
        console.log(`Starting pushback operation for ${aircraft.type} at position:`, aircraft.position);
        console.log('Vehicle current position:', this.position);
        
        this.targetAircraft = aircraft;
        this.isActive = true;
        this.state = 'moving_to_aircraft';
        
        // Create route from hangar to aircraft
        this.createRouteToAircraft(aircraft.position);
        
        // Show tow bar
        if (this.towBar) {
            this.towBar.visible = true;
        }
        
        console.log(`Ground support vehicle dispatched to ${aircraft.type}`);
        console.log('Vehicle waypoints:', this.waypoints);
        return true;
    }
    
    /**
     * Create route from hangar to aircraft
     * @param {THREE.Vector3} aircraftPosition - Target aircraft position
     */
    createRouteToAircraft(aircraftPosition) {
        this.waypoints = [
            // Exit hangar
            { x: -60, z: 50, name: 'hangar_exit' },
            { x: -60, z: 30, name: 'taxiway_approach' },
            // Approach aircraft from behind
            { 
                x: aircraftPosition.x - 5, 
                z: aircraftPosition.z, 
                name: 'aircraft_approach',
                heading: Math.atan2(aircraftPosition.z, aircraftPosition.x)
            }
        ];
        
        this.currentWaypointIndex = 0;
    }
    
    /**
     * Update vehicle position and operations
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        switch (this.state) {
            case 'moving_to_aircraft':
                this.updateMovementToAircraft();
                break;
                
            case 'pushing':
                this.updatePushingOperation();
                break;
                
            case 'returning':
                this.updateReturnToHangar();
                break;
        }
        
        // Animate warning lights
        this.updateWarningLights();
        
        // Animate wheels
        this.updateWheelRotation();
        
        this.updateMeshPosition();
    }
    
    /**
     * Update movement toward aircraft
     */
    updateMovementToAircraft() {
        if (this.currentWaypointIndex >= this.waypoints.length) {
            // Reached aircraft, start pushing
            this.state = 'pushing';
            this.attachToAircraft();
            return;
        }
        
        const targetWaypoint = this.waypoints[this.currentWaypointIndex];
        const targetPos = new THREE.Vector3(targetWaypoint.x, this.position.y, targetWaypoint.z);
        
        // Move toward waypoint
        const distance = this.position.distanceTo(targetPos);
        
        if (distance < 1.5) {
            // Reached waypoint, move to next
            this.currentWaypointIndex++;
            if (targetWaypoint.heading !== undefined) {
                this.rotation.y = targetWaypoint.heading;
            }
        } else {
            // Move toward waypoint
            const direction = targetPos.clone().sub(this.position).normalize();
            this.position.add(direction.multiplyScalar(this.speed));
            
            // Face movement direction
            this.rotation.y = Math.atan2(-direction.x, -direction.z);
        }
    }
    
    /**
     * Attach to aircraft for pushing
     */
    attachToAircraft() {
        if (!this.targetAircraft) return;
        
        console.log(`Ground vehicle attached to ${this.targetAircraft.type}`);
        
        // Position behind aircraft
        const aircraft = this.targetAircraft;
        this.position.set(
            aircraft.position.x - 4,
            0,
            aircraft.position.z
        );
        
        // Face same direction as aircraft
        this.rotation.y = aircraft.rotation.y;
        
        // Start pushback timer
        this.pushbackStartTime = Date.now();
    }
    
    /**
     * Update pushing operation
     */
    updatePushingOperation() {
        if (!this.targetAircraft) {
            this.completePushback();
            return;
        }
        
        // Simulate pushback duration (3 seconds)
        if (Date.now() - this.pushbackStartTime > 3000) {
            this.completePushback();
        }
    }
    
    /**
     * Complete pushback operation
     */
    completePushback() {
        console.log('Pushback operation completed');
        
        // Hide tow bar
        if (this.towBar) {
            this.towBar.visible = false;
        }
        
        // Start return to hangar
        this.state = 'returning';
        this.targetAircraft = null;
        
        // Create return route
        this.createReturnRoute();
    }
    
    /**
     * Create route back to hangar
     */
    createReturnRoute() {
        this.waypoints = [
            { x: this.position.x, z: 30, name: 'clear_aircraft' },
            { x: -60, z: 30, name: 'taxiway_return' },
            { x: -60, z: 50, name: 'hangar_approach' },
            { x: -60, z: 55, name: 'hangar_parking' }
        ];
        
        this.currentWaypointIndex = 0;
    }
    
    /**
     * Update return to hangar
     */
    updateReturnToHangar() {
        if (this.currentWaypointIndex >= this.waypoints.length) {
            // Returned to hangar
            this.parkInHangar();
            return;
        }
        
        const targetWaypoint = this.waypoints[this.currentWaypointIndex];
        const targetPos = new THREE.Vector3(targetWaypoint.x, this.position.y, targetWaypoint.z);
        
        // Move toward waypoint
        const distance = this.position.distanceTo(targetPos);
        
        if (distance < 1.5) {
            // Reached waypoint
            this.currentWaypointIndex++;
        } else {
            // Move toward waypoint
            const direction = targetPos.clone().sub(this.position).normalize();
            this.position.add(direction.multiplyScalar(this.speed));
            
            // Face movement direction
            this.rotation.y = Math.atan2(-direction.x, -direction.z);
        }
    }
    
    /**
     * Update warning lights animation
     */
    updateWarningLights() {
        if (this.beacon && this.isActive) {
            // Rotate beacon
            this.beacon.rotation.y += 0.1;
            
            // Flash effect
            const flash = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            this.beacon.material.emissive.setScalar(flash * 0.3);
        }
    }
    
    /**
     * Update wheel rotation animation
     */
    updateWheelRotation() {
        if (this.wheels && this.isActive && this.speed > 0) {
            const rotationSpeed = this.speed * 2;
            this.wheels.forEach(wheel => {
                wheel.rotation.y += rotationSpeed;
            });
        }
    }
    
    /**
     * Update mesh position to match logical position
     */
    updateMeshPosition() {
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.rotation);
        }
    }
    
    /**
     * Get vehicle mesh for adding to scene
     * @returns {THREE.Group}
     */
    getMesh() {
        return this.mesh;
    }
    
    /**
     * Check if vehicle is available for operations
     * @returns {boolean}
     */
    isAvailable() {
        return !this.isActive && this.state === 'parked';
    }
    
    /**
     * Get current state
     * @returns {string}
     */
    getState() {
        return this.state;
    }
    
    /**
     * Emergency stop and return to hangar
     */
    emergencyReturn() {
        console.log('Ground support vehicle emergency return');
        this.targetAircraft = null;
        this.state = 'returning';
        this.createReturnRoute();
    }
    
    /**
     * Dispose of vehicle resources
     */
    dispose() {
        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        this.isActive = false;
        this.targetAircraft = null;
    }
}