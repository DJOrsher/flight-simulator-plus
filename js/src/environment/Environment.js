/**
 * Environment Module
 * Manages airfield, terrain, buildings, and environmental objects
 */

import { COLORS, WORLD_BOUNDS } from '../utils/Constants.js';
import * as GeometryFactory from '../utils/GeometryFactory.js';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.airfield = {};
        this.buildings = {};
        this.terrain = {};
        this.objects = [];
    }
    
    /**
     * Initialize all environment elements
     */
    async init() {
        this.createAirfield();
        this.createBuildings();
        this.createTerrain();
        this.createWorldMarkers();
    }
    
    /**
     * Create airfield infrastructure
     */
    createAirfield() {
        this.createRunway();
        this.createTaxiways();
        this.createParkingAreas();
        this.createRunwayLights();
    }
    
    /**
     * Create main runway
     */
    createRunway() {
        // Main runway
        const runwayGeometry = new THREE.PlaneGeometry(200, 10);
        const runwayMaterial = new THREE.MeshLambertMaterial({ 
            color: COLORS.RUNWAY_GRAY || 0x404040 
        });
        
        this.airfield.runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
        this.airfield.runway.rotation.x = -Math.PI / 2;
        this.airfield.runway.position.y = 0.01;
        this.airfield.runway.receiveShadow = true;
        this.scene.add(this.airfield.runway);
        
        // Runway markings
        this.createRunwayMarkings();
    }
    
    /**
     * Create runway markings and numbers
     */
    createRunwayMarkings() {
        // Center line
        const centerLineGeometry = new THREE.PlaneGeometry(190, 0.5);
        const centerLineMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff 
        });
        
        const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.02;
        this.scene.add(centerLine);
        
        // Threshold markings
        for (let i = 0; i < 2; i++) {
            const x = i === 0 ? -85 : 85;
            const thresholdGeometry = new THREE.PlaneGeometry(8, 1);
            const threshold = new THREE.Mesh(thresholdGeometry, centerLineMaterial);
            threshold.rotation.x = -Math.PI / 2;
            threshold.position.set(x, 0.02, 0);
            this.scene.add(threshold);
        }
    }
    
    /**
     * Create taxiways connecting runway to parking areas
     */
    createTaxiways() {
        const taxiwayMaterial = new THREE.MeshLambertMaterial({ 
            color: COLORS.TAXIWAY_GRAY || 0x505050 
        });
        
        // Main taxiway parallel to runway
        const taxiwayGeometry = new THREE.PlaneGeometry(180, 6);
        this.airfield.mainTaxiway = new THREE.Mesh(taxiwayGeometry, taxiwayMaterial);
        this.airfield.mainTaxiway.rotation.x = -Math.PI / 2;
        this.airfield.mainTaxiway.position.set(0, 0.005, 15);
        this.airfield.mainTaxiway.receiveShadow = true;
        this.scene.add(this.airfield.mainTaxiway);
        
        // Connecting taxiways
        this.createConnectingTaxiways(taxiwayMaterial);
    }
    
    /**
     * Create connecting taxiways
     * @param {THREE.Material} material - Taxiway material
     */
    createConnectingTaxiways(material) {
        const connections = [
            { pos: [-60, 0.005, 7.5], size: [15, 4], rot: Math.PI / 2 },
            { pos: [0, 0.005, 7.5], size: [15, 4], rot: Math.PI / 2 },
            { pos: [60, 0.005, 7.5], size: [15, 4], rot: Math.PI / 2 }
        ];
        
        connections.forEach(conn => {
            const geometry = new THREE.PlaneGeometry(conn.size[0], conn.size[1]);
            const taxiway = new THREE.Mesh(geometry, material);
            taxiway.rotation.x = -Math.PI / 2;
            taxiway.rotation.y = conn.rot;
            taxiway.position.set(conn.pos[0], conn.pos[1], conn.pos[2]);
            taxiway.receiveShadow = true;
            this.scene.add(taxiway);
        });
    }
    
    /**
     * Create aircraft parking areas
     */
    createParkingAreas() {
        const parkingMaterial = new THREE.MeshLambertMaterial({ 
            color: COLORS.CONCRETE || 0x606060 
        });
        
        // General Aviation parking
        this.createParkingSpots(parkingMaterial, -40, 25, 3, 'GA');
        
        // Military parking
        this.createParkingSpots(parkingMaterial, 40, 25, 2, 'MIL');
        
        // Commercial gates
        this.createParkingSpots(parkingMaterial, 0, 40, 2, 'COM');
        
        // Helicopter pad
        this.createHelicopterPad();
    }
    
    /**
     * Create parking spots
     * @param {THREE.Material} material - Parking material
     * @param {number} centerX - Center X position
     * @param {number} centerZ - Center Z position
     * @param {number} count - Number of spots
     * @param {string} type - Parking type
     */
    createParkingSpots(material, centerX, centerZ, count, type) {
        for (let i = 0; i < count; i++) {
            const x = centerX + (i - count / 2) * 20;
            const geometry = new THREE.PlaneGeometry(15, 12);
            const spot = new THREE.Mesh(geometry, material);
            spot.rotation.x = -Math.PI / 2;
            spot.position.set(x, 0.003, centerZ);
            spot.receiveShadow = true;
            this.scene.add(spot);
            
            // Parking markers
            this.createParkingMarkers(x, centerZ);
        }
    }
    
    /**
     * Create parking spot markers
     * @param {number} x - X position
     * @param {number} z - Z position
     */
    createParkingMarkers(x, z) {
        const markerMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffff00 
        });
        
        // Yellow boundary lines
        const lineGeometry = new THREE.PlaneGeometry(15, 0.2);
        
        // Front and back lines
        for (let offset of [-6, 6]) {
            const line = new THREE.Mesh(lineGeometry, markerMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.004, z + offset);
            this.scene.add(line);
        }
        
        // Side lines
        const sideGeometry = new THREE.PlaneGeometry(0.2, 12);
        for (let offset of [-7.5, 7.5]) {
            const line = new THREE.Mesh(sideGeometry, markerMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x + offset, 0.004, z);
            this.scene.add(line);
        }
    }
    
    /**
     * Create helicopter landing pad
     */
    createHelicopterPad() {
        // Circular helipad
        const helipadGeometry = new THREE.CircleGeometry(8, 16);
        const helipadMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x404040 
        });
        
        const helipad = new THREE.Mesh(helipadGeometry, helipadMaterial);
        helipad.rotation.x = -Math.PI / 2;
        helipad.position.set(-80, 0.002, -30);
        helipad.receiveShadow = true;
        this.scene.add(helipad);
        
        // H marking
        const hGeometry = new THREE.PlaneGeometry(3, 0.5);
        const hMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff 
        });
        
        const h1 = new THREE.Mesh(hGeometry, hMaterial);
        h1.rotation.x = -Math.PI / 2;
        h1.position.set(-80, 0.003, -30);
        this.scene.add(h1);
        
        const h2 = new THREE.Mesh(hGeometry, hMaterial);
        h2.rotation.x = -Math.PI / 2;
        h2.rotation.z = Math.PI / 2;
        h2.position.set(-80, 0.003, -30);
        this.scene.add(h2);
    }
    
    /**
     * Create runway lights
     */
    createRunwayLights() {
        const lightMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
        });
        const lightFixtureGeometry = GeometryFactory.createCylinder(0.1, 0.1, 0.5);

        // Approach lights
        for (let i = 0; i < 10; i++) {
            const x = -110 + i * 5;
            const lightFixture = new THREE.Mesh(lightFixtureGeometry, lightMaterial);
            lightFixture.position.set(x, 0.25, 0);
            this.scene.add(lightFixture);
        }

        const runwayLightGeometry = GeometryFactory.createCylinder(0.1, 0.1, 0.3);
        // Runway edge lights
        for (let i = -95; i <= 95; i += 10) {
            // Left side
            const leftLight = new THREE.Mesh(runwayLightGeometry, lightMaterial);
            leftLight.position.set(i, 0.15, -5.5);
            this.scene.add(leftLight);

            // Right side
            const rightLight = new THREE.Mesh(runwayLightGeometry, lightMaterial);
            rightLight.position.set(i, 0.15, 5.5);
            this.scene.add(rightLight);
        }
    }
    
    /**
     * Create airport buildings
     */
    createBuildings() {
        this.createControlTower();
        this.createHangars();
        this.createTerminalBuilding();
    }
    
    /**
     * Create control tower
     */
    createControlTower() {
        const towerGroup = new THREE.Group();
        
        // Tower base
        const baseGeometry = new THREE.CylinderGeometry(4, 6, 20, 8);
        const baseMaterial = new THREE.MeshLambertMaterial({ 
            color: COLORS.CONCRETE || 0x888888 
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 10;
        base.castShadow = true;
        towerGroup.add(base);
        
        // Tower cab
        const cabGeometry = new THREE.CylinderGeometry(3, 3, 4, 8);
        const cabMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x666666 
        });
        const cab = new THREE.Mesh(cabGeometry, cabMaterial);
        cab.position.y = 22;
        cab.castShadow = true;
        towerGroup.add(cab);
        
        // Windows
        this.addTowerWindows(towerGroup);
        
        towerGroup.position.set(-40, 0, -20);
        this.buildings.controlTower = towerGroup;
        this.scene.add(towerGroup);
    }
    
    /**
     * Add windows to control tower
     * @param {THREE.Group} towerGroup - Tower group
     */
    addTowerWindows(towerGroup) {
        const windowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const windowGeometry = new THREE.PlaneGeometry(1.5, 2);
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            
            window.position.set(
                Math.cos(angle) * 2.9,
                22,
                Math.sin(angle) * 2.9
            );
            window.lookAt(0, 22, 0);
            towerGroup.add(window);
        }
    }
    
    /**
     * Create aircraft hangars
     */
    createHangars() {
        const hangarPositions = [
            { x: -60, z: 60 },
            { x: -20, z: 60 },
            { x: 20, z: 60 },
            { x: 60, z: 60 }
        ];
        
        hangarPositions.forEach((pos, index) => {
            const hangar = this.createHangar();
            hangar.position.set(pos.x, 0, pos.z);
            this.buildings[`hangar${index}`] = hangar;
            this.scene.add(hangar);
        });
    }
    
    /**
     * Create a single hangar
     * @returns {THREE.Group} Hangar group
     */
    createHangar() {
        const hangarGroup = new THREE.Group();
        
        // Main structure
        const structureGeometry = new THREE.BoxGeometry(25, 12, 20);
        const structureMaterial = new THREE.MeshLambertMaterial({ 
            color: COLORS.CONCRETE || 0x777777 
        });
        const structure = new THREE.Mesh(structureGeometry, structureMaterial);
        structure.position.y = 6;
        structure.castShadow = true;
        structure.receiveShadow = true;
        hangarGroup.add(structure);
        
        // Roof
        const roofGeometry = new THREE.CylinderGeometry(12, 12, 25, 16, 1, true, 0, Math.PI);
        const roofMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x666666 
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.rotation.z = Math.PI / 2;
        roof.position.y = 12;
        roof.castShadow = true;
        hangarGroup.add(roof);
        
        // Large door
        const doorGeometry = new THREE.PlaneGeometry(20, 10);
        const doorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x555555 
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 5, -10);
        hangarGroup.add(door);
        
        return hangarGroup;
    }
    
    /**
     * Create terminal building
     */
    createTerminalBuilding() {
        const terminalGroup = new THREE.Group();
        
        // Main terminal
        const mainGeometry = new THREE.BoxGeometry(40, 8, 15);
        const mainMaterial = new THREE.MeshLambertMaterial({ 
            color: COLORS.CONCRETE || 0x999999 
        });
        const main = new THREE.Mesh(mainGeometry, mainMaterial);
        main.position.y = 4;
        main.castShadow = true;
        terminalGroup.add(main);
        
        terminalGroup.position.set(80, 0, 30);
        this.buildings.terminal = terminalGroup;
        this.scene.add(terminalGroup);
    }
    
    /**
     * Create terrain features
     */
    createTerrain() {
        this.createHills();
        this.createTrees();
    }
    
    /**
     * Create hills around the airport
     */
    createHills() {
        const hillPositions = [
            { x: 200, z: 200, height: 30 },
            { x: -200, z: 200, height: 25 },
            { x: 200, z: -200, height: 35 },
            { x: -200, z: -200, height: 28 }
        ];
        
        hillPositions.forEach((hill, index) => {
            const hillGeometry = new THREE.SphereGeometry(80, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
            const hillMaterial = new THREE.MeshLambertMaterial({ 
                color: COLORS.GRASS_GREEN || 0x2d5016 
            });
            const hillMesh = new THREE.Mesh(hillGeometry, hillMaterial);
            hillMesh.position.set(hill.x, hill.height / 2, hill.z);
            hillMesh.scale.y = hill.height / 80;
            hillMesh.receiveShadow = true;
            this.terrain[`hill${index}`] = hillMesh;
            this.scene.add(hillMesh);
        });
    }
    
    /**
     * Create trees for decoration
     */
    createTrees() {
        const treeCount = 50;
        
        for (let i = 0; i < treeCount; i++) {
            // Random position avoiding runway area
            let x, z;
            do {
                x = (Math.random() - 0.5) * 800;
                z = (Math.random() - 0.5) * 800;
            } while (Math.abs(x) < 150 && Math.abs(z) < 100);
            
            const tree = this.createTree();
            tree.position.set(x, 0, z);
            this.scene.add(tree);
        }
    }
    
    /**
     * Create a single tree
     * @returns {THREE.Group} Tree group
     */
    createTree() {
        const treeGroup = new THREE.Group();
        
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 6, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513 
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 3;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Foliage
        const foliageGeometry = new THREE.SphereGeometry(4, 8, 6);
        const foliageMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x228B22 
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 8;
        foliage.castShadow = true;
        treeGroup.add(foliage);
        
        return treeGroup;
    }
    
    /**
     * Create world boundary markers
     */
    createWorldMarkers() {
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000 
        });
        const markerGeometry = GeometryFactory.createBox(2, 10, 2);

        // Corner markers
        const corners = [
            [WORLD_BOUNDS.minX, WORLD_BOUNDS.minZ],
            [WORLD_BOUNDS.maxX, WORLD_BOUNDS.minZ],
            [WORLD_BOUNDS.maxX, WORLD_BOUNDS.maxZ],
            [WORLD_BOUNDS.minX, WORLD_BOUNDS.maxZ]
        ];
        
        corners.forEach(([x, z]) => {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(x, 5, z);
            this.scene.add(marker);
        });
    }
    
    /**
     * Get control tower position
     * @returns {THREE.Vector3}
     */
    getControlTowerPosition() {
        return this.buildings.controlTower ? 
            this.buildings.controlTower.position.clone() : 
            new THREE.Vector3(-40, 0, -20);
    }
    
    /**
     * Get all buildings for collision detection
     * @returns {Array}
     */
    getBuildings() {
        return Object.values(this.buildings);
    }
    
    /**
     * Dispose of environment resources
     */
    dispose() {
        Object.values(this.airfield).forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        
        Object.values(this.buildings).forEach(obj => {
            obj.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        
        Object.values(this.terrain).forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    }
}