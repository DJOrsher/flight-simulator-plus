// Three.js Simulator - No modules required (using CDN)
class Simulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };
        this.mouse = {
            x: 0,
            y: 0,
            isLocked: false
        };
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveSpeed = 0.2;
        this.mouseSensitivity = 0.002;
        
        // Camera rotation angles
        this.yaw = 0;   // Horizontal rotation (left/right)
        this.pitch = 0; // Vertical rotation (up/down)
        
        // Flight simulation state
        this.isFlying = false;
        this.currentAircraft = null;
        this.aircraftList = [];
        this.flightControls = {
            throttle: 0,
            pitch: 0,
            roll: 0,
            yaw: 0
        };
        this.wasInFlight = false; // Track if aircraft was flying to detect crashes
        
        // Control tower system
        this.inControlTower = false;
        this.controlTowerPosition = new THREE.Vector3(-40, 0, -20); // At the actual control tower location
        this.controlTowerCamera = null;
        this.dispatchedAircraft = []; // Track dispatched aircraft
        
        // Walking character
        this.character = null;
        this.characterPosition = new THREE.Vector3(0, 0, 5);
        this.walkingAnimations = {
            leftLeg: 0,
            rightLeg: 0,
            leftArm: 0,
            rightArm: 0,
            animationTime: 0
        };
        
        // World boundaries (5x larger world)
        this.worldBounds = {
            minX: -500,
            maxX: 500,
            minZ: -500,
            maxZ: 500,
            minY: 0,
            maxY: 200  // Height limit for aircraft
        };
        
        // Hills for collision detection
        this.hills = [];
        
        // Hangars for collision detection
        this.hangars = [];
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 5);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // Add lighting
        this.setupLighting();
        
        // Create airfield environment
        this.createAirfield();
        this.createHills();
        this.createAircraft();
        
        // Create walking character
        this.createCharacter();
        
        // Add world boundary grid
        this.createWorldGrid();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);
    }
    
    createAirfield() {
        // Main grass ground (expanded for better parking)
        const grassGeometry = new THREE.PlaneGeometry(1200, 1200);
        const grassMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a7c59  // Darker green for grass
        });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.receiveShadow = true;
        this.scene.add(grass);
        
        // Main runway (longer for larger world)
        const runwayGeometry = new THREE.PlaneGeometry(300, 12);
        const runwayMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x404040  // Dark gray asphalt
        });
        const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
        runway.rotation.x = -Math.PI / 2;
        runway.position.y = 0.01; // Slightly above grass
        runway.receiveShadow = true;
        this.scene.add(runway);
        
        // Secondary runway (cross runway)
        const runway2Geometry = new THREE.PlaneGeometry(12, 250);
        const runway2 = new THREE.Mesh(runway2Geometry, runwayMaterial);
        runway2.rotation.x = -Math.PI / 2;
        runway2.position.set(50, 0.01, 0);
        runway2.receiveShadow = true;
        this.scene.add(runway2);
        
        // Runway markings - center line
        const markingGeometry = new THREE.PlaneGeometry(100, 0.3);
        const markingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff  // White markings
        });
        const centerLine = new THREE.Mesh(markingGeometry, markingMaterial);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.02;
        this.scene.add(centerLine);
        
        // Taxiways
        const taxiwayGeometry = new THREE.PlaneGeometry(40, 6);
        const taxiwayMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x505050  // Lighter gray
        });
        
        // Taxiway 1
        const taxiway1 = new THREE.Mesh(taxiwayGeometry, taxiwayMaterial);
        taxiway1.rotation.x = -Math.PI / 2;
        taxiway1.rotation.z = Math.PI / 2;
        taxiway1.position.set(-30, 0.01, 0);
        taxiway1.receiveShadow = true;
        this.scene.add(taxiway1);
        
        // Taxiway 2
        const taxiway2 = new THREE.Mesh(taxiwayGeometry, taxiwayMaterial);
        taxiway2.rotation.x = -Math.PI / 2;
        taxiway2.rotation.z = Math.PI / 2;
        taxiway2.position.set(30, 0.01, 0);
        taxiway2.receiveShadow = true;
        this.scene.add(taxiway2);
        
        // Control tower
        const towerBaseGeometry = new THREE.BoxGeometry(4, 8, 4);
        const towerBaseMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        const towerBase = new THREE.Mesh(towerBaseGeometry, towerBaseMaterial);
        towerBase.position.set(-40, 4, -20);
        towerBase.castShadow = true;
        towerBase.receiveShadow = true;
        this.scene.add(towerBase);
        
        // Control tower cabin
        const towerCabinGeometry = new THREE.BoxGeometry(6, 3, 6);
        const towerCabinMaterial = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
        const towerCabin = new THREE.Mesh(towerCabinGeometry, towerCabinMaterial);
        towerCabin.position.set(-40, 9.5, -20);
        towerCabin.castShadow = true;
        towerCabin.receiveShadow = true;
        this.scene.add(towerCabin);
        
        // Hangars
        const hangarGeometry = new THREE.BoxGeometry(15, 8, 20);
        const hangarMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        
        for (let i = 0; i < 3; i++) {
            const hangar = new THREE.Mesh(hangarGeometry, hangarMaterial);
            const hangarX = -50 + i * 25;
            const hangarZ = -40;
            hangar.position.set(hangarX, 4, hangarZ);
            hangar.castShadow = true;
            hangar.receiveShadow = true;
            this.scene.add(hangar);
            
            // Store hangar data for collision detection
            this.hangars.push({
                x: hangarX,
                z: hangarZ,
                width: 15,  // hangar width
                depth: 20,  // hangar depth
                height: 8   // hangar height
            });
        }
        
        // Helipad
        const helipadGeometry = new THREE.CircleGeometry(12, 32);
        const helipadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const helipad = new THREE.Mesh(helipadGeometry, helipadMaterial);
        helipad.rotation.x = -Math.PI / 2;
        helipad.position.set(60, 0.02, -30);
        helipad.receiveShadow = true;
        this.scene.add(helipad);
        
        // Helipad markings - outer circle
        const outerCircleGeometry = new THREE.RingGeometry(10, 11, 32);
        const helipadMarkingMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        const outerCircle = new THREE.Mesh(outerCircleGeometry, helipadMarkingMaterial);
        outerCircle.rotation.x = -Math.PI / 2;
        outerCircle.position.set(60, 0.03, -30);
        this.scene.add(outerCircle);
        
        // Helipad markings - inner circle
        const innerCircleGeometry = new THREE.RingGeometry(7, 8, 32);
        const innerCircle = new THREE.Mesh(innerCircleGeometry, helipadMarkingMaterial);
        innerCircle.rotation.x = -Math.PI / 2;
        innerCircle.position.set(60, 0.03, -30);
        this.scene.add(innerCircle);
        
        // Helipad landing skid markings - two parallel lines for helicopter skids (rotated 90 degrees)
        const skidMarkingMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        
        // Front skid line (rotated to run east-west)
        const frontSkidGeometry = new THREE.PlaneGeometry(6, 0.5);
        const frontSkidMarking = new THREE.Mesh(frontSkidGeometry, skidMarkingMaterial);
        frontSkidMarking.rotation.x = -Math.PI / 2;
        frontSkidMarking.position.set(60, 0.04, -32); // 2 units forward of center
        this.scene.add(frontSkidMarking);
        
        // Back skid line (rotated to run east-west)
        const backSkidGeometry = new THREE.PlaneGeometry(6, 0.5);
        const backSkidMarking = new THREE.Mesh(backSkidGeometry, skidMarkingMaterial);
        backSkidMarking.rotation.x = -Math.PI / 2;
        backSkidMarking.position.set(60, 0.04, -28); // 2 units back of center
        this.scene.add(backSkidMarking);
        
        // Store helipad position for helicopter operations
        this.helipadPosition = new THREE.Vector3(60, 0, -30);
        
        // Create dedicated parking areas with concrete pads
        this.createParkingAreas();
        
        // Aircraft parking spots - organized by terminal areas
        this.parkingSpots = [
            { x: -90, z: 45, type: 'cessna' },     // General Aviation area (expanded)
            { x: -50, z: 60, type: 'fighter' },    // Military apron (farther out)
            { x: 50, z: 60, type: 'airliner' },    // Commercial terminal gates (expanded)
            { x: 90, z: 45, type: 'cargo' },       // Cargo apron (expanded)
            { x: 60, z: -30, type: 'helicopter' }  // Helipad (separate area)
        ];
        
        // Runway system for takeoff/landing procedures
        this.runwaySystem = {
            // Main runway (East-West)
            mainRunway: {
                takeoffPosition: { x: -90, z: 0, heading: 0 },      // West end, facing east
                landingPosition: { x: 90, z: 0, heading: Math.PI }, // East end, facing west
                centerline: { startX: -90, endX: 90, z: 0 }
            },
            // Taxi waypoints for each aircraft type (updated for new parking areas)
            taxiWaypoints: {
                cessna: [
                    { x: -90, z: 45 },  // GA parking spot
                    { x: -90, z: 20 },  // Taxi south
                    { x: -90, z: 0 }    // West runway threshold
                ],
                fighter: [
                    { x: -50, z: 60 },  // Military apron
                    { x: -50, z: 20 },  // Taxi south
                    { x: -90, z: 0 }    // West runway threshold
                ],
                airliner: [
                    { x: 50, z: 60 },   // Terminal gate
                    { x: 50, z: 20 },   // Taxi south
                    { x: 90, z: 0 }     // East runway threshold
                ],
                cargo: [
                    { x: 90, z: 45 },   // Cargo apron
                    { x: 90, z: 20 },   // Taxi south
                    { x: 90, z: 0 }     // East runway threshold
                ]
            }
        };
    }
    
    createParkingAreas() {
        const concreteColor = 0x888888;
        const markingColor = 0xffff00;
        
        // General Aviation parking (Cessna)
        const gaGeometry = new THREE.PlaneGeometry(25, 20);
        const gaMaterial = new THREE.MeshLambertMaterial({ color: concreteColor });
        const gaParking = new THREE.Mesh(gaGeometry, gaMaterial);
        gaParking.rotation.x = -Math.PI / 2;
        gaParking.position.set(-90, 0.01, 45);
        gaParking.receiveShadow = true;
        this.scene.add(gaParking);
        
        // Military apron (Fighter)
        const milGeometry = new THREE.PlaneGeometry(30, 25);
        const milMaterial = new THREE.MeshLambertMaterial({ color: concreteColor });
        const milParking = new THREE.Mesh(milGeometry, milMaterial);
        milParking.rotation.x = -Math.PI / 2;
        milParking.position.set(-50, 0.01, 60);
        milParking.receiveShadow = true;
        this.scene.add(milParking);
        
        // Commercial gates (Airliner)
        const terminalGeometry = new THREE.PlaneGeometry(40, 30);
        const terminalMaterial = new THREE.MeshLambertMaterial({ color: concreteColor });
        const terminalParking = new THREE.Mesh(terminalGeometry, terminalMaterial);
        terminalParking.rotation.x = -Math.PI / 2;
        terminalParking.position.set(50, 0.01, 60);
        terminalParking.receiveShadow = true;
        this.scene.add(terminalParking);
        
        // Cargo apron (Cargo plane)
        const cargoGeometry = new THREE.PlaneGeometry(35, 25);
        const cargoMaterial = new THREE.MeshLambertMaterial({ color: concreteColor });
        const cargoParking = new THREE.Mesh(cargoGeometry, cargoMaterial);
        cargoParking.rotation.x = -Math.PI / 2;
        cargoParking.position.set(90, 0.01, 45);
        cargoParking.receiveShadow = true;
        this.scene.add(cargoParking);
        
        // Add parking spot markings
        const markingMaterial = new THREE.MeshLambertMaterial({ color: markingColor });
        
        // GA marking
        const gaMarkingGeometry = new THREE.PlaneGeometry(12, 1);
        const gaMarking = new THREE.Mesh(gaMarkingGeometry, markingMaterial);
        gaMarking.rotation.x = -Math.PI / 2;
        gaMarking.position.set(-90, 0.02, 45);
        this.scene.add(gaMarking);
        
        // Military marking
        const milMarkingGeometry = new THREE.PlaneGeometry(15, 1);
        const milMarking = new THREE.Mesh(milMarkingGeometry, markingMaterial);
        milMarking.rotation.x = -Math.PI / 2;
        milMarking.position.set(-50, 0.02, 60);
        this.scene.add(milMarking);
        
        // Terminal gate marking
        const terminalMarkingGeometry = new THREE.PlaneGeometry(20, 1);
        const terminalMarking = new THREE.Mesh(terminalMarkingGeometry, markingMaterial);
        terminalMarking.rotation.x = -Math.PI / 2;
        terminalMarking.position.set(50, 0.02, 60);
        this.scene.add(terminalMarking);
        
        // Cargo marking
        const cargoMarkingGeometry = new THREE.PlaneGeometry(18, 1);
        const cargoMarkingTwo = new THREE.Mesh(cargoMarkingGeometry, markingMaterial);
        cargoMarkingTwo.rotation.x = -Math.PI / 2;
        cargoMarkingTwo.position.set(90, 0.02, 45);
        this.scene.add(cargoMarkingTwo);
    }
    
    createHills() {
        // Create surrounding hills for larger world (5x bigger area)
        const hillPositions = [];
        
        // Generate hills around the perimeter of the expanded world
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const distance = 300 + Math.random() * 150; // 300-450 units from center
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            hillPositions.push({
                x: x,
                z: z,
                scale: 1.5 + Math.random() * 1.0,
                color: Math.random() > 0.5 ? 0x228b22 : 0x32cd32
            });
        }
        
        // Add some interior hills for variety (but not in airbase area)
        for (let i = 0; i < 20; i++) {
            let x, z;
            let attempts = 0;
            do {
                x = (Math.random() - 0.5) * 400;
                z = (Math.random() - 0.5) * 400;
                attempts++;
            } while (attempts < 50 && this.isInAirbaseArea(x, z)); // Avoid airbase area
            
            // Only add hill if it's not in airbase area
            if (!this.isInAirbaseArea(x, z)) {
                hillPositions.push({
                    x: x,
                    z: z,
                    scale: 0.8 + Math.random() * 0.7,
                    color: Math.random() > 0.5 ? 0x228b22 : 0x32cd32
                });
            }
        }
        
        hillPositions.forEach(hill => {
            const hillGeometry = new THREE.SphereGeometry(30, 16, 16);
            const hillMaterial = new THREE.MeshLambertMaterial({ color: hill.color });
            const hillMesh = new THREE.Mesh(hillGeometry, hillMaterial);
            
            hillMesh.position.set(hill.x, -15, hill.z);
            hillMesh.scale.set(hill.scale, 0.7, hill.scale);
            hillMesh.receiveShadow = true;
            this.scene.add(hillMesh);
            
            // Store hill data for collision detection
            this.hills.push({
                x: hill.x,
                z: hill.z,
                radius: 30 * hill.scale,
                height: 30 * 0.7, // Scaled height
                baseY: -15
            });
        });
    }
    
    isInAirbaseArea(x, z) {
        // Define airbase area boundaries (roughly where runways and aircraft are)
        // Main runway area plus some buffer
        const airbaseWidth = 200;  // Width of airbase area
        const airbaseHeight = 150; // Height of airbase area
        
        return (Math.abs(x) < airbaseWidth / 2 && Math.abs(z) < airbaseHeight / 2);
    }
    
    createAircraft() {
        // Aircraft 1: Small Cessna-style plane (at parking spot)
        const cessnaSpot = this.parkingSpots.find(spot => spot.type === 'cessna');
        const cessna = this.createCessna(cessnaSpot.x, 0, cessnaSpot.z, 0);
        this.aircraftList.push({
            mesh: cessna,
            type: 'cessna',
            position: new THREE.Vector3(cessnaSpot.x, 1, cessnaSpot.z),
            rotation: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            speed: 0,
            maxSpeed: 0.8,
            acceleration: 0.02,
            turnRate: 0.02
        });
        
        // Aircraft 2: Military Fighter Jet
        const fighter = this.createFighterJet(20, 0, -10, Math.PI / 4);
        this.aircraftList.push({
            mesh: fighter,
            type: 'fighter',
            position: new THREE.Vector3(20, 1, -10),
            rotation: new THREE.Vector3(0, Math.PI / 4, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            speed: 0,
            maxSpeed: 1.5,
            acceleration: 0.04,
            turnRate: 0.03
        });
        
        // Aircraft 3: Large Commercial Airliner
        const airliner = this.createAirliner(-10, 0, 25, Math.PI);
        this.aircraftList.push({
            mesh: airliner,
            type: 'airliner',
            position: new THREE.Vector3(-10, 2, 25),
            rotation: new THREE.Vector3(0, Math.PI, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            speed: 0,
            maxSpeed: 1.2,
            acceleration: 0.01,
            turnRate: 0.01
        });
        
        // Aircraft 4: Cargo Plane
        const cargo = this.createCargoPlane(35, 0, 20, -Math.PI / 3);
        this.aircraftList.push({
            mesh: cargo,
            type: 'cargo',
            position: new THREE.Vector3(35, 2, 20),
            rotation: new THREE.Vector3(0, -Math.PI / 3, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            speed: 0,
            maxSpeed: 1.0,
            acceleration: 0.015,
            turnRate: 0.015
        });
        
        // Aircraft 5: Helicopter
        const helicopter = this.createHelicopter(60, 0, -30, 0); // Position on helipad
        this.aircraftList.push({
            mesh: helicopter,
            type: 'helicopter',
            position: new THREE.Vector3(60, 2, -30), // Start on helipad
            rotation: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            speed: 0,
            maxSpeed: 0.6,
            acceleration: 0.03,
            turnRate: 0.04
        });
    }
    
    createCessna(x, y, z, rotation) {
        const cessna = new THREE.Group();
        
        // Main fuselage (more realistic proportions)
        const fuselageGeometry = new THREE.CylinderGeometry(0.6, 0.3, 6, 12);
        const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.position.set(0, 0.3, 0);
        fuselage.castShadow = true;
        cessna.add(fuselage);
        
        // Cockpit/windscreen
        const cockpitGeometry = new THREE.SphereGeometry(0.4, 8, 6);
        const cockpitMaterial = new THREE.MeshLambertMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.7 });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(1.5, 0.6, 0);
        cockpit.scale.set(1.2, 0.8, 1);
        cessna.add(cockpit);
        
        // Main wings
        const wingGeometry = new THREE.BoxGeometry(8, 0.15, 1.5);
        const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.set(0.5, 0.4, 0);
        wings.castShadow = true;
        cessna.add(wings);
        
        // Wing struts
        const strutGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1, 6);
        const strutMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        
        for (let side of [-1, 1]) {
            const strut = new THREE.Mesh(strutGeometry, strutMaterial);
            strut.position.set(0, -0.1, side * 2);
            strut.rotation.x = Math.PI / 6;
            cessna.add(strut);
        }
        
        // Propeller (will be animated)
        const propGroup = new THREE.Group();
        const propHubGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
        const propHubMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const propHub = new THREE.Mesh(propHubGeometry, propHubMaterial);
        propHub.rotation.z = Math.PI / 2;
        propGroup.add(propHub);
        
        // Propeller blades
        const bladeGeometry = new THREE.BoxGeometry(0.05, 2.5, 0.15);
        const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
        
        for (let i = 0; i < 2; i++) {
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.rotation.z = i * Math.PI;
            propGroup.add(blade);
        }
        
        propGroup.position.set(3.2, 0.3, 0);
        cessna.add(propGroup);
        cessna.userData.propeller = propGroup; // Store reference for animation
        
        // Horizontal stabilizer
        const hStabGeometry = new THREE.BoxGeometry(2.5, 0.1, 0.8);
        const hStabMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const hStab = new THREE.Mesh(hStabGeometry, hStabMaterial);
        hStab.position.set(-2.8, 0.3, 0);
        hStab.castShadow = true;
        cessna.add(hStab);
        
        // Vertical stabilizer
        const vStabGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.1);
        const vStabMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const vStab = new THREE.Mesh(vStabGeometry, vStabMaterial);
        vStab.position.set(-2.8, 1, 0);
        vStab.castShadow = true;
        cessna.add(vStab);
        
        // Landing gear
        const gearGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
        const gearMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        
        // Main gear
        for (let side of [-1, 1]) {
            const wheel = new THREE.Mesh(gearGeometry, gearMaterial);
            wheel.position.set(0.5, -0.5, side * 1.2);
            wheel.rotation.x = Math.PI / 2;
            cessna.add(wheel);
            
            // Gear strut
            const strutGearGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6);
            const gearStrut = new THREE.Mesh(strutGearGeometry, strutMaterial);
            gearStrut.position.set(0.5, -0.15, side * 1.2);
            cessna.add(gearStrut);
        }
        
        // Nose gear
        const noseWheel = new THREE.Mesh(gearGeometry, gearMaterial);
        noseWheel.position.set(2.5, -0.4, 0);
        noseWheel.rotation.x = Math.PI / 2;
        noseWheel.scale.set(0.8, 0.8, 0.8);
        cessna.add(noseWheel);
        
        cessna.position.set(x, y + 1, z);
        cessna.rotation.y = rotation;
        this.scene.add(cessna);
        return cessna;
    }
    
    createFighterJet(x, y, z, rotation) {
        const fighter = new THREE.Group();
        
        // Main fuselage (sleeker design)
        const fuselageGeometry = new THREE.CylinderGeometry(0.6, 0.3, 8, 12);
        const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.position.set(0, 0, 0);
        fuselage.castShadow = true;
        fighter.add(fuselage);
        
        // Nose cone
        const noseGeometry = new THREE.ConeGeometry(0.3, 2, 8);
        const nose = new THREE.Mesh(noseGeometry, fuselageMaterial);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(5, 0, 0);
        nose.castShadow = true;
        fighter.add(nose);
        
        // Delta wings (swept back, integrated with fuselage)
        const wingGeometry = new THREE.BoxGeometry(6, 0.2, 2);
        const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.set(-1, -0.1, 0);
        wings.castShadow = true;
        fighter.add(wings);
        
        // Wing tips (angled for swept design)
        const tipGeometry = new THREE.BoxGeometry(2, 0.2, 0.8);
        const leftTip = new THREE.Mesh(tipGeometry, wingMaterial);
        leftTip.position.set(-3, -0.1, 2.5);
        leftTip.rotation.y = Math.PI / 6;
        leftTip.castShadow = true;
        fighter.add(leftTip);
        
        const rightTip = new THREE.Mesh(tipGeometry, wingMaterial);
        rightTip.position.set(-3, -0.1, -2.5);
        rightTip.rotation.y = -Math.PI / 6;
        rightTip.castShadow = true;
        fighter.add(rightTip);
        
        // Cockpit canopy
        const cockpitGeometry = new THREE.SphereGeometry(0.5, 12, 8);
        const cockpitMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a2e, 
            transparent: true, 
            opacity: 0.8 
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(2, 0.4, 0);
        cockpit.scale.set(1.5, 0.7, 1);
        cockpit.castShadow = true;
        fighter.add(cockpit);
        
        // Vertical stabilizers (twin tails)
        const tailGeometry = new THREE.BoxGeometry(1, 2, 0.2);
        const tailMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
        
        const leftTail = new THREE.Mesh(tailGeometry, tailMaterial);
        leftTail.position.set(-3.5, 1, 1);
        leftTail.castShadow = true;
        fighter.add(leftTail);
        
        const rightTail = new THREE.Mesh(tailGeometry, tailMaterial);
        rightTail.position.set(-3.5, 1, -1);
        rightTail.castShadow = true;
        fighter.add(rightTail);
        
        // Engine exhaust
        const exhaustGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1, 8);
        const exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust.rotation.z = Math.PI / 2;
        exhaust.position.set(-4.5, 0, 0);
        exhaust.castShadow = true;
        fighter.add(exhaust);
        
        fighter.position.set(x, y + 1, z);
        fighter.rotation.y = rotation;
        this.scene.add(fighter);
        return fighter;
    }
    
    createAirliner(x, y, z, rotation) {
        const airliner = new THREE.Group();
        
        // Main fuselage (more realistic proportions)
        const fuselageGeometry = new THREE.CylinderGeometry(1.8, 1.4, 18, 16);
        const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.position.set(0, 0, 0);
        fuselage.castShadow = true;
        airliner.add(fuselage);
        
        // Nose cone
        const noseGeometry = new THREE.ConeGeometry(1.4, 3, 12);
        const nose = new THREE.Mesh(noseGeometry, fuselageMaterial);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(10.5, 0, 0);
        nose.castShadow = true;
        airliner.add(nose);
        
        // Wings (properly connected to fuselage)
        const wingGeometry = new THREE.BoxGeometry(22, 0.6, 3.5);
        const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.set(-2, -0.5, 0); // Positioned to intersect with fuselage
        wings.castShadow = true;
        airliner.add(wings);
        
        // Wing root fairings (blend wings into fuselage)
        const fairingGeometry = new THREE.BoxGeometry(4, 1.2, 2);
        const fairing1 = new THREE.Mesh(fairingGeometry, fuselageMaterial);
        fairing1.position.set(-2, -0.2, 2.5);
        fairing1.castShadow = true;
        airliner.add(fairing1);
        
        const fairing2 = new THREE.Mesh(fairingGeometry, fuselageMaterial);
        fairing2.position.set(-2, -0.2, -2.5);
        fairing2.castShadow = true;
        airliner.add(fairing2);
        
        // Engines (under wings)
        const engineGeometry = new THREE.CylinderGeometry(0.6, 0.6, 4, 12);
        const engineMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        
        const engine1 = new THREE.Mesh(engineGeometry, engineMaterial);
        engine1.position.set(-1, -1.8, 5);
        engine1.rotation.x = Math.PI / 2;
        engine1.castShadow = true;
        airliner.add(engine1);
        
        const engine2 = new THREE.Mesh(engineGeometry, engineMaterial);
        engine2.position.set(-1, -1.8, -5);
        engine2.rotation.x = Math.PI / 2;
        engine2.castShadow = true;
        airliner.add(engine2);
        
        // Engine pylons
        const pylonGeometry = new THREE.BoxGeometry(1.5, 1, 0.3);
        const pylonMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        
        const pylon1 = new THREE.Mesh(pylonGeometry, pylonMaterial);
        pylon1.position.set(-1, -1.2, 5);
        pylon1.castShadow = true;
        airliner.add(pylon1);
        
        const pylon2 = new THREE.Mesh(pylonGeometry, pylonMaterial);
        pylon2.position.set(-1, -1.2, -5);
        pylon2.castShadow = true;
        airliner.add(pylon2);
        
        // Horizontal stabilizer
        const hStabGeometry = new THREE.BoxGeometry(8, 0.3, 2);
        const hStab = new THREE.Mesh(hStabGeometry, wingMaterial);
        hStab.position.set(-8, 0.5, 0);
        hStab.castShadow = true;
        airliner.add(hStab);
        
        // Vertical stabilizer (tail fin)
        const vStabGeometry = new THREE.BoxGeometry(2, 4, 0.4);
        const vStabMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc });
        const vStab = new THREE.Mesh(vStabGeometry, vStabMaterial);
        vStab.position.set(-8.5, 2, 0);
        vStab.castShadow = true;
        airliner.add(vStab);
        
        // Cockpit windows
        const windowGeometry = new THREE.SphereGeometry(1.2, 12, 8);
        const windowMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87ceeb, 
            transparent: true, 
            opacity: 0.7 
        });
        const cockpitWindows = new THREE.Mesh(windowGeometry, windowMaterial);
        cockpitWindows.position.set(7, 0.3, 0);
        cockpitWindows.scale.set(1.8, 0.8, 1);
        airliner.add(cockpitWindows);
        
        airliner.position.set(x, y + 2, z);
        airliner.rotation.y = rotation;
        this.scene.add(airliner);
        return airliner;
    }
    
    createCargoPlane(x, y, z, rotation) {
        const cargo = new THREE.Group();
        
        // Fuselage (wider and taller)
        const fuselageGeometry = new THREE.BoxGeometry(15, 3, 3);
        const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.castShadow = true;
        cargo.add(fuselage);
        
        // Wings (high-mounted)
        const wingGeometry = new THREE.BoxGeometry(20, 0.4, 3);
        const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.y = 2;
        wings.castShadow = true;
        cargo.add(wings);
        
        // Propeller engines with animated propellers
        const engineGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
        const engineMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        
        const propellers = [];
        
        for (let i = 0; i < 4; i++) {
            // Engine nacelle
            const engine = new THREE.Mesh(engineGeometry, engineMaterial);
            engine.position.set(0, 2, -6 + i * 4);
            engine.rotation.x = Math.PI / 2;
            engine.castShadow = true;
            cargo.add(engine);
            
            // Propeller group for animation
            const propGroup = new THREE.Group();
            const propHubGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
            const propHubMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            const propHub = new THREE.Mesh(propHubGeometry, propHubMaterial);
            propHub.rotation.z = Math.PI / 2;
            propGroup.add(propHub);
            
            // Propeller blades
            const bladeGeometry = new THREE.BoxGeometry(0.03, 1.8, 0.1);
            const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
            
            for (let j = 0; j < 3; j++) {
                const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
                blade.rotation.z = j * (2 * Math.PI / 3);
                propGroup.add(blade);
            }
            
            propGroup.position.set(0.8, 2, -6 + i * 4);
            cargo.add(propGroup);
            propellers.push(propGroup);
        }
        
        cargo.userData.propellers = propellers;
        
        cargo.position.set(x, y + 2, z);
        cargo.rotation.y = rotation;
        this.scene.add(cargo);
        return cargo;
    }
    
    createHelicopter(x, y, z, rotation) {
        const helicopter = new THREE.Group();
        
        // Main body - more realistic shape
        const bodyGeometry = new THREE.SphereGeometry(1.5, 12, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.set(1.8, 0.9, 1.2);
        body.castShadow = true;
        helicopter.add(body);
        
        // Cockpit glass
        const cockpitGeometry = new THREE.SphereGeometry(1.2, 12, 8);
        const cockpitMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87ceeb, 
            transparent: true, 
            opacity: 0.6 
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(1, 0.3, 0);
        cockpit.scale.set(1.2, 0.8, 1);
        helicopter.add(cockpit);
        
        // Tail boom - more detailed
        const tailGeometry = new THREE.CylinderGeometry(0.4, 0.2, 6, 8);
        const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.rotation.z = Math.PI / 2;
        tail.position.set(-4, 0.5, 0);
        tail.castShadow = true;
        helicopter.add(tail);
        
        // Main rotor mast
        const mastGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
        const mastMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.y = 2.2;
        helicopter.add(mast);
        
        // Main rotor hub
        const hubGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
        const hubMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const hub = new THREE.Mesh(hubGeometry, hubMaterial);
        hub.position.y = 3;
        helicopter.add(hub);
        
        // Main rotor blades (animated)
        const rotorGroup = new THREE.Group();
        const bladeGeometry = new THREE.BoxGeometry(8, 0.05, 0.25);
        const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        
        for (let i = 0; i < 2; i++) {
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.rotation.y = i * Math.PI;
            rotorGroup.add(blade);
        }
        
        rotorGroup.position.y = 3;
        helicopter.add(rotorGroup);
        helicopter.userData.mainRotor = rotorGroup; // Store reference for animation
        
        // Tail rotor
        const tailRotorGroup = new THREE.Group();
        const tailBladeGeometry = new THREE.BoxGeometry(1.5, 0.03, 0.15);
        const tailBladeMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        
        for (let i = 0; i < 4; i++) {
            const tailBlade = new THREE.Mesh(tailBladeGeometry, tailBladeMaterial);
            tailBlade.rotation.z = i * Math.PI / 2;
            tailRotorGroup.add(tailBlade);
        }
        
        tailRotorGroup.position.set(-6.5, 1, 0);
        tailRotorGroup.rotation.y = Math.PI / 2;
        helicopter.add(tailRotorGroup);
        helicopter.userData.tailRotor = tailRotorGroup; // Store reference for animation
        
        // Landing skids - more realistic
        const skidGeometry = new THREE.BoxGeometry(3.5, 0.15, 0.25);
        const skidMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        const skid1 = new THREE.Mesh(skidGeometry, skidMaterial);
        skid1.position.set(0, -1.2, 0.8);
        helicopter.add(skid1);
        
        const skid2 = new THREE.Mesh(skidGeometry, skidMaterial);
        skid2.position.set(0, -1.2, -0.8);
        helicopter.add(skid2);
        
        // Skid supports
        const supportGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
        const supportMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        for (let x of [-1, 1]) {
            for (let z of [-0.8, 0.8]) {
                const support = new THREE.Mesh(supportGeometry, supportMaterial);
                support.position.set(x * 0.8, -0.8, z);
                helicopter.add(support);
            }
        }
        
        helicopter.position.set(x, y + 2, z);
        helicopter.rotation.y = rotation;
        this.scene.add(helicopter);
        return helicopter;
    }
    
    createCharacter() {
        this.character = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169e1 }); // Royal blue shirt
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        this.character.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 12, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 }); // Skin tone
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.4;
        head.castShadow = true;
        this.character.add(head);
        
        // Hair
        const hairGeometry = new THREE.SphereGeometry(0.22, 12, 8);
        const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 }); // Brown hair
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 1.5;
        hair.scale.set(1, 0.7, 1);
        hair.castShadow = true;
        this.character.add(hair);
        
        // Left arm
        const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 }); // Skin tone
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.4, 0.8, 0);
        leftArm.castShadow = true;
        this.character.add(leftArm);
        this.character.userData.leftArm = leftArm;
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.4, 0.8, 0);
        rightArm.castShadow = true;
        this.character.add(rightArm);
        this.character.userData.rightArm = rightArm;
        
        // Left leg
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 6);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f }); // Dark pants
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.15, -0.45, 0);
        leftLeg.castShadow = true;
        this.character.add(leftLeg);
        this.character.userData.leftLeg = leftLeg;
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.15, -0.45, 0);
        rightLeg.castShadow = true;
        this.character.add(rightLeg);
        this.character.userData.rightLeg = rightLeg;
        
        // Feet
        const footGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.3);
        const footMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }); // Black shoes
        
        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.set(-0.15, -0.9, 0.1);
        leftFoot.castShadow = true;
        this.character.add(leftFoot);
        
        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        rightFoot.position.set(0.15, -0.9, 0.1);
        rightFoot.castShadow = true;
        this.character.add(rightFoot);
        
        // Position character at initial camera position
        this.character.position.copy(this.characterPosition);
        this.character.rotation.y = this.yaw;
        this.scene.add(this.character);
        
        // Set camera behind character initially
        this.updateWalkingCamera();
    }
    
    createWorldGrid() {
        // Create boundary grid lines to show world limits
        const gridMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff6b6b, 
            transparent: true, 
            opacity: 0.3 
        });
        
        // Vertical grid lines (North-South)
        for (let x = this.worldBounds.minX; x <= this.worldBounds.maxX; x += 100) {
            const points = [];
            points.push(new THREE.Vector3(x, 0, this.worldBounds.minZ));
            points.push(new THREE.Vector3(x, 0, this.worldBounds.maxZ));
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, gridMaterial);
            this.scene.add(line);
        }
        
        // Horizontal grid lines (East-West)
        for (let z = this.worldBounds.minZ; z <= this.worldBounds.maxZ; z += 100) {
            const points = [];
            points.push(new THREE.Vector3(this.worldBounds.minX, 0, z));
            points.push(new THREE.Vector3(this.worldBounds.maxX, 0, z));
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, gridMaterial);
            this.scene.add(line);
        }
        
        // Boundary walls (vertical lines to show height limits)
        const wallMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff4757, 
            transparent: true, 
            opacity: 0.4 
        });
        
        // Corner boundary markers
        const corners = [
            { x: this.worldBounds.minX, z: this.worldBounds.minZ },
            { x: this.worldBounds.maxX, z: this.worldBounds.minZ },
            { x: this.worldBounds.minX, z: this.worldBounds.maxZ },
            { x: this.worldBounds.maxX, z: this.worldBounds.maxZ }
        ];
        
        corners.forEach(corner => {
            const points = [];
            points.push(new THREE.Vector3(corner.x, 0, corner.z));
            points.push(new THREE.Vector3(corner.x, this.worldBounds.maxY, corner.z));
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, wallMaterial);
            this.scene.add(line);
        });
        
        // Perimeter boundary lines at height limit
        const perimeterMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff3838, 
            transparent: true, 
            opacity: 0.5 
        });
        
        const perimeterPoints = [
            new THREE.Vector3(this.worldBounds.minX, this.worldBounds.maxY, this.worldBounds.minZ),
            new THREE.Vector3(this.worldBounds.maxX, this.worldBounds.maxY, this.worldBounds.minZ),
            new THREE.Vector3(this.worldBounds.maxX, this.worldBounds.maxY, this.worldBounds.maxZ),
            new THREE.Vector3(this.worldBounds.minX, this.worldBounds.maxY, this.worldBounds.maxZ),
            new THREE.Vector3(this.worldBounds.minX, this.worldBounds.maxY, this.worldBounds.minZ)
        ];
        
        const perimeterGeometry = new THREE.BufferGeometry().setFromPoints(perimeterPoints);
        const perimeterLine = new THREE.Line(perimeterGeometry, perimeterMaterial);
        this.scene.add(perimeterLine);
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.controls.forward = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.controls.backward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.controls.left = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.controls.right = true;
                    break;
                case 'Space':
                    this.controls.up = true;
                    break;
                case 'ShiftLeft':
                    this.controls.down = true;
                    break;
                case 'KeyE':
                    this.handleInteraction();
                    break;
                case 'Digit1':
                    if (this.inControlTower) this.toggleAircraft(0);
                    break;
                case 'Digit2':
                    if (this.inControlTower) this.toggleAircraft(1);
                    break;
                case 'Digit3':
                    if (this.inControlTower) this.toggleAircraft(2);
                    break;
                case 'Digit4':
                    if (this.inControlTower) this.toggleAircraft(3);
                    break;
                case 'Digit5':
                    if (this.inControlTower) this.toggleAircraft(4);
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.controls.forward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.controls.backward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.controls.left = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.controls.right = false;
                    break;
                case 'Space':
                    this.controls.up = false;
                    break;
                case 'ShiftLeft':
                    this.controls.down = false;
                    break;
            }
        });
        
        // Mouse controls
        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.mouse.isLocked = document.pointerLockElement === this.renderer.domElement;
        });
        
        document.addEventListener('mousemove', (event) => {
            if (this.mouse.isLocked) {
                this.mouse.x = event.movementX;
                this.mouse.y = event.movementY;
            }
        });
    }
    
    handleInteraction() {
        if (this.isFlying) {
            // Exit aircraft
            this.exitAircraft();
        } else if (this.inControlTower) {
            // Exit control tower
            this.exitControlTower();
        } else {
            // Check if near control tower first, then aircraft
            if (this.checkControlTowerProximity()) {
                this.enterControlTower();
            } else {
                this.checkAircraftProximity();
            }
        }
    }
    
    checkAircraftProximity() {
        const playerPos = this.camera.position;
        const interactionDistance = 8;
        
        for (let aircraft of this.aircraftList) {
            const distance = playerPos.distanceTo(aircraft.position);
            if (distance < interactionDistance) {
                this.enterAircraft(aircraft);
                return;
            }
        }
    }
    
    enterAircraft(aircraft) {
        this.isFlying = true;
        this.currentAircraft = aircraft;
        this.wasInFlight = false; // Reset flight tracking
        
        // Hide character during flight
        if (this.character) {
            this.character.visible = false;
        }
        
        // Set camera to follow aircraft from behind and above
        this.updateFlightCamera();
        
        // Update UI
        this.updateFlightUI();
    }
    
    exitAircraft() {
        if (this.currentAircraft) {
            const aircraft = this.currentAircraft;
            
            // Return aircraft to ground level safely
            const groundHeight = this.getMinimumFlightHeight(aircraft.type);
            aircraft.position.y = groundHeight;
            aircraft.mesh.position.copy(aircraft.position);
            
            // Reset aircraft rotation to level
            aircraft.rotation.z = 0; // Level pitch
            this.applyAircraftRotationWithGroundClearance(aircraft);
            
            // Stop aircraft movement
            aircraft.velocity.set(0, 0, 0);
            aircraft.speed = 0;
            
            // Position character safely near the aircraft
            this.characterPosition.copy(aircraft.position);
            this.characterPosition.x += 5;
            this.characterPosition.y = 0;
            
            // Show character again
            if (this.character) {
                this.character.visible = true;
                this.character.position.copy(this.characterPosition);
            }
            
            this.isFlying = false;
            this.currentAircraft = null;
            this.wasInFlight = false; // Reset flight tracking
            
            // Reset flight controls
            this.flightControls = {
                throttle: 0,
                pitch: 0,
                roll: 0,
                yaw: 0
            };
            
            // Update UI
            this.updateWalkingUI();
        }
    }
    
    checkControlTowerProximity() {
        const distance = this.characterPosition.distanceTo(this.controlTowerPosition);
        
        // Debug: log distance when close
        if (distance < 15) {
            console.log(`Distance to control tower: ${distance.toFixed(2)} units`);
        }
        
        return distance < 10; // Within 10 units of control tower
    }
    
    enterControlTower() {
        this.inControlTower = true;
        
        // Hide character
        if (this.character) {
            this.character.visible = false;
        }
        
        // Set camera to control tower view (elevated view of airfield)
        this.camera.position.set(-40, 25, -20); // High up in the actual control tower
        this.camera.lookAt(0, 0, 0); // Look at center of airfield
        
        // Update UI
        this.updateControlTowerUI();
    }
    
    exitControlTower() {
        this.inControlTower = false;
        
        // Show character again
        if (this.character) {
            this.character.visible = true;
            this.character.position.copy(this.characterPosition);
        }
        
        // Return to walking mode
        this.updateWalkingCamera();
        this.updateWalkingUI();
    }
    
    updateControlTowerUI() {
        const infoElement = document.getElementById('info');
        if (infoElement) {
            let aircraftList = this.aircraftList.map((aircraft, index) => {
                const aircraftNumber = index + 1;
                const aircraftName = aircraft.type.charAt(0).toUpperCase() + aircraft.type.slice(1);
                
                if (aircraft.isActive && this.dispatchedAircraft.includes(aircraft)) {
                    // Aircraft is dispatched/flying
                    const phase = aircraft.automatedFlight ? aircraft.automatedFlight.phase : 'unknown';
                    const altitude = aircraft.position.y.toFixed(1);
                    return `<p style="color: #90EE90;">${aircraftNumber}. ${aircraftName} - ${phase} (Alt: ${altitude}m) - Press ${aircraftNumber} to recall</p>`;
                } else if (aircraft.automatedFlight && aircraft.automatedFlight.phase === 'returning') {
                    // Aircraft is returning
                    const altitude = aircraft.position.y.toFixed(1);
                    return `<p style="color: #FFD700;">${aircraftNumber}. ${aircraftName} - returning (Alt: ${altitude}m) - Landing...</p>`;
                } else {
                    // Aircraft is available
                    return `<p style="color: #87CEEB;">${aircraftNumber}. ${aircraftName} - Available - Press ${aircraftNumber} to dispatch</p>`;
                }
            }).join('');
            
            infoElement.innerHTML = `
                <h3>Air Traffic Control Tower</h3>
                
                <p><strong>Aircraft Status:</strong></p>
                ${aircraftList}
                
                <p><strong>Commands:</strong></p>
                <p>1-5 - Toggle Aircraft (Dispatch/Recall)</p>
                <p>E - Exit Control Tower</p>
                
                <p><strong>Legend:</strong></p>
                <p style="color: #87CEEB;">Blue - Available</p>
                <p style="color: #90EE90;">Green - Dispatched</p>
                <p style="color: #FFD700;">Yellow - Returning</p>
            `;
        }
    }
    
    toggleAircraft(aircraftIndex) {
        if (!this.inControlTower) return;
        
        // Check if this specific aircraft (by index in the full list) is already dispatched
        const aircraft = this.aircraftList[aircraftIndex];
        if (!aircraft) return;
        
        if (aircraft.isActive && this.dispatchedAircraft.includes(aircraft)) {
            // Aircraft is dispatched, so recall it
            this.recallSpecificAircraft(aircraft);
            console.log(`Recalling ${aircraft.type} (Aircraft ${aircraftIndex + 1})`);
        } else if (!aircraft.isActive) {
            // Aircraft is available, so dispatch it
            this.dispatchSpecificAircraft(aircraft);
            console.log(`Dispatching ${aircraft.type} (Aircraft ${aircraftIndex + 1})`);
        }
        // If aircraft is returning, ignore the toggle (let it finish landing)
    }
    
    dispatchSpecificAircraft(aircraft) {
        // Mark as dispatched
        this.dispatchedAircraft.push(aircraft);
        aircraft.isActive = true;
        
        // Start automated flight pattern
        this.startAutomatedFlight(aircraft);
        
        // Update UI
        this.updateControlTowerUI();
    }
    
    recallSpecificAircraft(aircraft) {
        console.log(`Recalling ${aircraft.type}...`);
        
        // Start return-to-base procedure
        aircraft.automatedFlight = {
            phase: 'returning',
            timer: 0,
            targetAltitude: this.getMinimumFlightHeight(aircraft.type),
            returnTarget: this.findNearestLandingSpot(aircraft)
        };
        
        // Update UI
        this.updateControlTowerUI();
    }
    
    dispatchAircraft(aircraftIndex) {
        if (!this.inControlTower) return;
        
        const availableAircraft = this.aircraftList.filter(aircraft => 
            !this.dispatchedAircraft.includes(aircraft) && !aircraft.isActive
        );
        
        if (aircraftIndex >= 0 && aircraftIndex < availableAircraft.length) {
            const aircraft = availableAircraft[aircraftIndex];
            
            // Mark as dispatched
            this.dispatchedAircraft.push(aircraft);
            aircraft.isActive = true;
            
            // Start automated flight pattern
            this.startAutomatedFlight(aircraft);
            
            // Update UI
            this.updateControlTowerUI();
            
            console.log(`Dispatched ${aircraft.type} for automated flight`);
        }
    }
    
    recallAircraft(aircraftIndex) {
        if (!this.inControlTower) return;
        
        if (aircraftIndex >= 0 && aircraftIndex < this.dispatchedAircraft.length) {
            const aircraft = this.dispatchedAircraft[aircraftIndex];
            
            console.log(`Recalling ${aircraft.type}...`);
            
            // Start return-to-base procedure
            aircraft.automatedFlight = {
                phase: 'returning',
                timer: 0,
                targetAltitude: this.getMinimumFlightHeight(aircraft.type),
                returnTarget: this.findNearestLandingSpot(aircraft)
            };
            
            // Update UI
            this.updateControlTowerUI();
        }
    }
    
    findNearestLandingSpot(aircraft) {
        // Helicopters always return to helipad
        if (aircraft.type === 'helicopter') {
            return {
                x: this.helipadPosition.x,
                z: this.helipadPosition.z
            };
        }
        
        // For fixed-wing aircraft, return to their designated parking spot
        const parkingSpot = this.parkingSpots.find(spot => spot.type === aircraft.type);
        if (parkingSpot) {
            return {
                x: parkingSpot.x,
                z: parkingSpot.z
            };
        }
        
        // Fallback - shouldn't happen with proper parking spots
        return { x: 0, z: 0 };
    }
    
    startAutomatedFlight(aircraft) {
        // Different takeoff procedures for helicopters vs fixed-wing
        if (aircraft.type === 'helicopter') {
            // Helicopter vertical takeoff from helipad
            aircraft.speed = 0.1;
            aircraft.position.y = this.getMinimumFlightHeight(aircraft.type);
            aircraft.rotation.y = Math.random() * Math.PI * 2;
            
            aircraft.automatedFlight = {
                phase: 'vertical_takeoff',
                timer: 0,
                targetAltitude: 15 + Math.random() * 20,
                flightPath: this.generateFlightPath()
            };
        } else {
            // Fixed-wing aircraft - start taxi to runway
            aircraft.speed = 0;
            aircraft.position.y = this.getMinimumFlightHeight(aircraft.type);
            
            // Get taxi waypoints for this aircraft type
            const waypoints = this.runwaySystem.taxiWaypoints[aircraft.type];
            
            aircraft.automatedFlight = {
                phase: 'taxi_to_runway',
                timer: 0,
                targetAltitude: 20 + Math.random() * 30,
                flightPath: this.generateFlightPath(),
                waypoints: [...waypoints], // Copy waypoints array
                currentWaypointIndex: 1,   // Start with first taxi waypoint (skip parking spot)
                taxiSpeed: 0.1
            };
        }
    }
    
    generateFlightPath() {
        // Generate a simple circular flight pattern around the airfield
        const radius = 150 + Math.random() * 100;
        const centerX = Math.random() * 200 - 100;
        const centerZ = Math.random() * 200 - 100;
        
        return {
            type: 'circle',
            centerX: centerX,
            centerZ: centerZ,
            radius: radius,
            direction: Math.random() > 0.5 ? 1 : -1 // Clockwise or counterclockwise
        };
    }
    
    updateFlightCamera() {
        if (this.currentAircraft) {
            const aircraft = this.currentAircraft;
            
            // Calculate camera position behind and above the aircraft
            // The aircraft's forward direction is determined by its Y rotation
            const yaw = aircraft.rotation.y;
            
            // Calculate backward direction (opposite of aircraft's forward direction)
            // Aircraft nose points in +X direction, so backward is -X relative to rotation
            const backwardX = -Math.cos(yaw) * 12;  // 12 units behind
            const backwardZ = Math.sin(yaw) * 12;   // 12 units behind
            const upwardY = 6;  // 6 units above
            
            // Position camera behind and above the aircraft
            this.camera.position.set(
                aircraft.position.x + backwardX,
                aircraft.position.y + upwardY,
                aircraft.position.z + backwardZ
            );
            
            // Calculate a point ahead of the aircraft for the camera to look at
            const forwardX = aircraft.position.x + Math.cos(yaw) * 5;
            const forwardZ = aircraft.position.z - Math.sin(yaw) * 5;
            const forwardY = aircraft.position.y;
            
            // Make camera look toward the point in front of the aircraft
            this.camera.lookAt(forwardX, forwardY, forwardZ);
        }
    }
    
    updateFlightUI() {
        const infoElement = document.getElementById('info');
        if (infoElement) {
            const aircraft = this.currentAircraft;
            const isHelicopter = aircraft.type === 'helicopter';
            
            infoElement.innerHTML = `
                <h3>Flight Mode - ${aircraft.type.charAt(0).toUpperCase() + aircraft.type.slice(1)}</h3>
                <p><strong>Flight Controls:</strong></p>
                <p>W - ${isHelicopter ? 'Collective Up (Rise)' : 'Pitch Up (Nose Up)'}</p>
                <p>S - ${isHelicopter ? 'Collective Down (Descend)' : 'Pitch Down (Nose Down)'}</p>
                <p>A - Turn Left</p>
                <p>D - Turn Right</p>
                <p>Space - ${isHelicopter ? 'Throttle Up' : 'Throttle Up'}</p>
                <p>Shift - ${isHelicopter ? 'Throttle Down' : 'Throttle Down'}</p>
                <p>E - Exit Aircraft</p>
                <p>Speed: ${(aircraft.speed * 100).toFixed(0)}% | Alt: ${aircraft.position.y.toFixed(1)}m</p>
                ${aircraft.type !== 'helicopter' ? `<p>Control Authority: ${(Math.min(aircraft.speed / 0.1, 1.0) * 100).toFixed(0)}%</p>` : ''}
                <p>World: ${this.worldBounds.maxX * 2}x${this.worldBounds.maxZ * 2} units</p>
            `;
        }
    }
    
    updateWalkingUI() {
        const infoElement = document.getElementById('info');
        if (infoElement) {
            // Check distance to control tower for UI feedback
            const towerDistance = this.characterPosition.distanceTo(this.controlTowerPosition);
            const nearTower = towerDistance < 15;
            
            infoElement.innerHTML = `
                <h3>Three.js Simulator</h3>
                <p><strong>Controls:</strong></p>
                <p>WASD or Arrow Keys - Move</p>
                <p>Mouse - Look around</p>
                <p>E near aircraft - Board | E near control tower - Enter ATC</p>
                ${nearTower ? `<p style="color: yellow;">Control Tower: ${towerDistance.toFixed(1)} units away</p>` : ''}
                <p>Click to lock mouse</p>
            `;
        }
    }
    
    updateMovement() {
        if (this.isFlying) {
            this.updateFlightControls();
        } else if (!this.inControlTower) {
            this.updateWalkingMovement();
        }
        
        // Update automated aircraft
        this.updateAutomatedAircraft();
    }
    
    updateAutomatedAircraft() {
        for (let aircraft of this.dispatchedAircraft) {
            if (!aircraft.automatedFlight) continue;
            
            const auto = aircraft.automatedFlight;
            auto.timer += 1;
            
            switch (auto.phase) {
                case 'taxi_to_runway':
                    // Fixed-wing aircraft taxi to runway
                    const currentWaypoint = auto.waypoints[auto.currentWaypointIndex];
                    if (currentWaypoint) {
                        // Navigate to current waypoint
                        const dx = currentWaypoint.x - aircraft.position.x;
                        const dz = currentWaypoint.z - aircraft.position.z;
                        const distanceToWaypoint = Math.sqrt(dx * dx + dz * dz);
                        
                        if (distanceToWaypoint > 3) {
                            // Turn towards waypoint
                            const targetYaw = Math.atan2(-dz, dx);
                            let yawDiff = targetYaw - aircraft.rotation.y;
                            while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
                            while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                            
                            aircraft.rotation.y += yawDiff * 0.05; // Taxi turn rate
                            aircraft.speed = auto.taxiSpeed; // Slow taxi speed
                        } else {
                            // Reached waypoint, move to next
                            auto.currentWaypointIndex++;
                            if (auto.currentWaypointIndex >= auto.waypoints.length) {
                                // Reached runway, align for takeoff
                                auto.phase = 'runway_alignment';
                                aircraft.speed = 0;
                            }
                        }
                    }
                    break;
                    
                case 'runway_alignment':
                    // Align aircraft with runway heading
                    const runwayHeading = aircraft.position.x < 0 ? 0 : Math.PI; // East or West facing
                    let alignDiff = runwayHeading - aircraft.rotation.y;
                    while (alignDiff > Math.PI) alignDiff -= Math.PI * 2;
                    while (alignDiff < -Math.PI) alignDiff += Math.PI * 2;
                    
                    if (Math.abs(alignDiff) > 0.1) {
                        aircraft.rotation.y += alignDiff * 0.1; // Align with runway
                    } else {
                        // Aligned, start takeoff roll
                        auto.phase = 'takeoff_roll';
                    }
                    break;
                    
                case 'takeoff_roll':
                    // Accelerate down runway - travel twice as long before takeoff
                    aircraft.speed = Math.min(0.8, aircraft.speed + 0.02);
                    if (aircraft.speed > 0.7) { // Increased from 0.5 to 0.7 for longer runway roll
                        // Rotate (lift off)
                        auto.phase = 'climb';
                    }
                    break;
                    
                case 'climb':
                    // Climb to cruise altitude
                    aircraft.speed = Math.min(0.8, aircraft.speed + 0.01);
                    if (aircraft.position.y < auto.targetAltitude) {
                        aircraft.position.y += 0.2;
                    }
                    
                    if (aircraft.position.y >= auto.targetAltitude) {
                        auto.phase = 'cruise';
                    }
                    break;
                    
                case 'vertical_takeoff':
                    // Helicopter vertical takeoff - climb straight up with minimal forward movement
                    aircraft.speed = 0.1; // Very low forward speed
                    if (aircraft.position.y < auto.targetAltitude) {
                        aircraft.position.y += 0.3; // Faster vertical climb than fixed-wing
                    }
                    
                    // Switch to cruise when reaching target altitude
                    if (aircraft.position.y >= auto.targetAltitude) {
                        aircraft.speed = 0.4; // Increase forward speed for cruise
                        auto.phase = 'cruise';
                    }
                    break;
                    
                case 'cruise':
                    // Follow flight path
                    const path = auto.flightPath;
                    if (path.type === 'circle') {
                        const angle = (auto.timer * 0.01 * path.direction);
                        const targetX = path.centerX + Math.cos(angle) * path.radius;
                        const targetZ = path.centerZ + Math.sin(angle) * path.radius;
                        
                        // Turn towards target
                        const dx = targetX - aircraft.position.x;
                        const dz = targetZ - aircraft.position.z;
                        const targetYaw = Math.atan2(-dz, dx);
                        
                        // Smooth yaw adjustment
                        let yawDiff = targetYaw - aircraft.rotation.y;
                        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
                        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                        
                        aircraft.rotation.y += yawDiff * 0.02;
                    }
                    
                    // Maintain cruise speed
                    aircraft.speed = 0.6;
                    break;
                    
                case 'returning':
                    if (aircraft.type === 'helicopter') {
                        // Helicopter approach - can hover and land vertically on helipad
                        const target = auto.returnTarget;
                        const distanceToTarget = Math.sqrt(
                            Math.pow(target.x - aircraft.position.x, 2) +
                            Math.pow(target.z - aircraft.position.z, 2)
                        );
                        
                        // First, navigate to position above helipad
                        if (distanceToTarget > 8) {
                            // Turn towards helipad
                            const targetDx = target.x - aircraft.position.x;
                            const targetDz = target.z - aircraft.position.z;
                            const targetYaw = Math.atan2(-targetDz, targetDx);
                            
                            let yawDiff = targetYaw - aircraft.rotation.y;
                            while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
                            while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                            
                            aircraft.rotation.y += yawDiff * 0.04;
                            aircraft.speed = 0.3;
                        } else {
                            // Hover above helipad and descend vertically
                            aircraft.speed = 0; // Stop horizontal movement when hovering
                            if (aircraft.position.y > auto.targetAltitude) {
                                aircraft.position.y -= 0.2;
                            }
                        }
                        
                        // Land when close to helipad and at ground level
                        if (distanceToTarget < 3 && aircraft.position.y <= auto.targetAltitude + 0.1) {
                            console.log(`Helicopter landing: distance=${distanceToTarget.toFixed(2)}, altitude=${aircraft.position.y.toFixed(2)}, target=${auto.targetAltitude.toFixed(2)}`);
                            this.landAircraft(aircraft);
                        }
                    } else {
                        // Fixed-wing aircraft - approach runway for landing
                        auto.phase = 'approach_runway';
                        // Set up runway approach (choose runway end based on aircraft position)
                        const runwayEnd = aircraft.position.x > 0 ? 
                            { x: 90, z: 0, heading: Math.PI } :   // Approach from east, land west
                            { x: -90, z: 0, heading: 0 };        // Approach from west, land east
                        auto.runwayApproach = runwayEnd;
                    }
                    break;
                    
                case 'approach_runway':
                    // Fixed-wing aircraft runway approach
                    const approach = auto.runwayApproach;
                    const approachDistance = Math.sqrt(
                        Math.pow(approach.x - aircraft.position.x, 2) +
                        Math.pow(approach.z - aircraft.position.z, 2)
                    );
                    
                    // Align with runway heading
                    let approachDiff = approach.heading - aircraft.rotation.y;
                    while (approachDiff > Math.PI) approachDiff -= Math.PI * 2;
                    while (approachDiff < -Math.PI) approachDiff += Math.PI * 2;
                    
                    aircraft.rotation.y += approachDiff * 0.02;
                    
                    // Approach descent - maintain glide slope
                    const targetApproachAltitude = Math.max(this.getMinimumFlightHeight(aircraft.type), approachDistance / 30);
                    if (aircraft.position.y > targetApproachAltitude) {
                        aircraft.position.y -= 0.15;
                    }
                    
                    // Approach speed
                    aircraft.speed = Math.max(0.3, Math.min(0.6, approachDistance / 100));
                    
                    // Check for touchdown - when close to runway and at ground level
                    if (approachDistance < 8 && aircraft.position.y <= this.getMinimumFlightHeight(aircraft.type) + 0.1) {
                        console.log(`${aircraft.type} landing: distance=${approachDistance.toFixed(2)}, altitude=${aircraft.position.y.toFixed(2)}, minHeight=${this.getMinimumFlightHeight(aircraft.type)}`);
                        auto.phase = 'landing_roll';
                        aircraft.position.y = this.getMinimumFlightHeight(aircraft.type); // Ensure at ground level
                    }
                    break;
                    
                case 'landing_roll':
                    // Aircraft rolling on runway, decelerating
                    aircraft.speed = Math.max(0, aircraft.speed - 0.03);
                    aircraft.position.y = this.getMinimumFlightHeight(aircraft.type);
                    
                    if (aircraft.speed <= 0.1) {
                        // Start taxi to parking
                        auto.phase = 'taxi_to_parking';
                        const waypoints = this.runwaySystem.taxiWaypoints[aircraft.type];
                        auto.waypoints = [...waypoints].reverse(); // Reverse waypoints for taxi back
                        auto.currentWaypointIndex = 1; // Skip runway, go to first taxi waypoint
                        auto.taxiSpeed = 0.1;
                    }
                    break;
                    
                case 'taxi_to_parking':
                    // Taxi from runway back to parking spot
                    const parkingWaypoint = auto.waypoints[auto.currentWaypointIndex];
                    if (parkingWaypoint) {
                        const dx = parkingWaypoint.x - aircraft.position.x;
                        const dz = parkingWaypoint.z - aircraft.position.z;
                        const distanceToWaypoint = Math.sqrt(dx * dx + dz * dz);
                        
                        if (distanceToWaypoint > 3) {
                            // Turn towards waypoint
                            const targetYaw = Math.atan2(-dz, dx);
                            let yawDiff = targetYaw - aircraft.rotation.y;
                            while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
                            while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                            
                            aircraft.rotation.y += yawDiff * 0.05;
                            aircraft.speed = auto.taxiSpeed;
                        } else {
                            // Reached waypoint
                            auto.currentWaypointIndex++;
                            if (auto.currentWaypointIndex >= auto.waypoints.length) {
                                // Reached parking spot
                                console.log(`${aircraft.type} reached parking spot, landing aircraft`);
                                this.landAircraft(aircraft);
                            }
                        }
                    }
                    break;
            }
            
            // Update aircraft position based on movement
            const forwardX = Math.cos(aircraft.rotation.y);
            const forwardZ = -Math.sin(aircraft.rotation.y);
            
            aircraft.velocity.set(
                forwardX * aircraft.speed,
                0,
                forwardZ * aircraft.speed
            );
            
            aircraft.position.add(aircraft.velocity);
            
            // Apply boundary constraints
            this.applyBoundaryConstraints(aircraft.position);
            
            // Update visual position
            aircraft.mesh.position.copy(aircraft.position);
            aircraft.mesh.rotation.set(0, aircraft.rotation.y, 0);
            
            // Animate moving parts
            this.animateAircraftParts(aircraft);
        }
    }
    
    landAircraft(aircraft) {
        console.log(`${aircraft.type} has landed and is available for dispatch`);
        
        // Remove from dispatched list
        const index = this.dispatchedAircraft.indexOf(aircraft);
        if (index > -1) {
            this.dispatchedAircraft.splice(index, 1);
        }
        
        // Reset aircraft state
        aircraft.isActive = false;
        aircraft.automatedFlight = null;
        aircraft.speed = 0;
        aircraft.velocity.set(0, 0, 0);
        aircraft.rotation.z = 0; // Level aircraft
        
        // Ensure aircraft is on ground
        aircraft.position.y = this.getMinimumFlightHeight(aircraft.type);
        
        // Update visual position
        aircraft.mesh.position.copy(aircraft.position);
        aircraft.mesh.rotation.set(0, aircraft.rotation.y, 0);
        
        // Update UI if in control tower
        if (this.inControlTower) {
            this.updateControlTowerUI();
        }
    }
    
    updateWalkingMovement() {
        // Calculate movement direction in local space
        let moveForward = 0;
        let moveRight = 0;
        let moveUp = 0;
        let isMoving = false;
        
        // Simple, intuitive controls
        if (this.controls.forward) moveForward = 1;   // W = move forward
        if (this.controls.backward) moveForward = -1; // S = move backward
        if (this.controls.right) moveRight = 1;       // D = move right
        if (this.controls.left) moveRight = -1;       // A = move left
        if (this.controls.up) moveUp = 1;             // Space = move up
        if (this.controls.down) moveUp = -1;          // Shift = move down
        
        // Apply movement only if there's input
        if (moveForward !== 0 || moveRight !== 0 || moveUp !== 0) {
            isMoving = true;
            
            // Store old position for collision detection
            const oldPosition = this.characterPosition.clone();
            
            // Normalize horizontal movement to prevent faster diagonal movement
            if (moveForward !== 0 || moveRight !== 0) {
                const horizontalLength = Math.sqrt(moveForward * moveForward + moveRight * moveRight);
                moveForward /= horizontalLength;
                moveRight /= horizontalLength;
            }
            
            // Calculate forward and right directions based on character's yaw
            const forwardX = -Math.sin(this.yaw);  // Forward X component
            const forwardZ = -Math.cos(this.yaw);  // Forward Z component
            
            // Right direction (90 degrees from forward)
            const rightX = Math.cos(this.yaw);     // Right X component
            const rightZ = -Math.sin(this.yaw);    // Right Z component
            
            // Move character position
            this.characterPosition.x += (forwardX * moveForward + rightX * moveRight) * this.moveSpeed;
            this.characterPosition.z += (forwardZ * moveForward + rightZ * moveRight) * this.moveSpeed;
            this.characterPosition.y += moveUp * this.moveSpeed;
            
            // Check hangar collision and revert if blocked
            this.checkHangarCollision(this.characterPosition, oldPosition);
            
            // Update character rotation to face movement direction
            if (moveForward !== 0 || moveRight !== 0) {
                const movementAngle = Math.atan2(forwardX * moveForward + rightX * moveRight, 
                                                forwardZ * moveForward + rightZ * moveRight);
                this.character.rotation.y = movementAngle;
            }
        }
        
        // Apply world boundary constraints
        this.applyBoundaryConstraints(this.characterPosition);
        
        // Check hill collision for character
        this.checkCharacterHillCollision(this.characterPosition);
        
        // Update character position and animate
        this.character.position.copy(this.characterPosition);
        this.animateWalking(isMoving);
        
        // Update camera to follow character
        this.updateWalkingCamera();
    }
    
    updateWalkingCamera() {
        if (this.character) {
            // Position camera behind and above the character's head
            const cameraDistance = 3;
            const cameraHeight = 2.5;
            
            // Calculate position behind character based on camera yaw
            const backwardX = Math.sin(this.yaw) * cameraDistance;
            const backwardZ = Math.cos(this.yaw) * cameraDistance;
            
            // Set camera position behind character
            this.camera.position.set(
                this.characterPosition.x + backwardX,
                this.characterPosition.y + cameraHeight,
                this.characterPosition.z + backwardZ
            );
            
            // Make camera look at a point slightly above character's head
            this.camera.lookAt(
                this.characterPosition.x,
                this.characterPosition.y + 1.5,
                this.characterPosition.z
            );
        }
    }
    
    animateWalking(isMoving) {
        if (isMoving) {
            // Update animation time
            this.walkingAnimations.animationTime += 0.2;
            
            // Calculate walking cycle
            const cycle = Math.sin(this.walkingAnimations.animationTime);
            const armCycle = Math.sin(this.walkingAnimations.animationTime + Math.PI); // Arms opposite to legs
            
            // Animate legs (alternating)
            if (this.character.userData.leftLeg) {
                this.character.userData.leftLeg.rotation.x = cycle * 0.5;
            }
            if (this.character.userData.rightLeg) {
                this.character.userData.rightLeg.rotation.x = -cycle * 0.5;
            }
            
            // Animate arms (alternating, opposite to legs)
            if (this.character.userData.leftArm) {
                this.character.userData.leftArm.rotation.x = armCycle * 0.3;
            }
            if (this.character.userData.rightArm) {
                this.character.userData.rightArm.rotation.x = -armCycle * 0.3;
            }
        } else {
            // Reset limbs to neutral position when not moving
            if (this.character.userData.leftLeg) {
                this.character.userData.leftLeg.rotation.x = 0;
            }
            if (this.character.userData.rightLeg) {
                this.character.userData.rightLeg.rotation.x = 0;
            }
            if (this.character.userData.leftArm) {
                this.character.userData.leftArm.rotation.x = 0;
            }
            if (this.character.userData.rightArm) {
                this.character.userData.rightArm.rotation.x = 0;
            }
        }
    }
    
    updateFlightControls() {
        if (!this.currentAircraft) return;
        
        const aircraft = this.currentAircraft;
        
        // Handle flight controls - different for helicopter vs fixed-wing aircraft
        if (aircraft.type === 'helicopter') {
            // Helicopter controls: W/S for vertical, A/D for yaw, Space/Shift for throttle
            if (this.controls.forward) {
                // W key - Collective up (rise vertically)
                aircraft.position.y += 0.5;
            }
            if (this.controls.backward) {
                // S key - Collective down (descend vertically)
                aircraft.position.y -= 0.5;
            }
            if (this.controls.left) aircraft.rotation.y += aircraft.turnRate;     // Yaw left
            if (this.controls.right) aircraft.rotation.y -= aircraft.turnRate;    // Yaw right
            if (this.controls.up) aircraft.speed = Math.min(aircraft.maxSpeed, aircraft.speed + aircraft.acceleration); // Throttle up
            if (this.controls.down) aircraft.speed = Math.max(0, aircraft.speed - aircraft.acceleration); // Throttle down
        } else {
            // Fixed-wing aircraft controls (require airflow for control authority)
            const minControlSpeed = 0.1; // Minimum speed needed for control effectiveness
            const controlAuthority = Math.min(aircraft.speed / minControlSpeed, 1.0); // 0-1 control effectiveness
            
            if (this.controls.forward) aircraft.rotation.z -= aircraft.turnRate * controlAuthority; // Pitch up (nose up)
            if (this.controls.backward) aircraft.rotation.z += aircraft.turnRate * controlAuthority; // Pitch down (nose down)
            if (this.controls.left) aircraft.rotation.y += aircraft.turnRate * controlAuthority;     // Yaw left (turn left)
            if (this.controls.right) aircraft.rotation.y -= aircraft.turnRate * controlAuthority;    // Yaw right (turn right)
            if (this.controls.up) aircraft.speed = Math.min(aircraft.maxSpeed, aircraft.speed + aircraft.acceleration); // Throttle up
            if (this.controls.down) aircraft.speed = Math.max(0, aircraft.speed - aircraft.acceleration); // Throttle down
        }
        
        // Clamp pitch to prevent flipping
        aircraft.rotation.z = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, aircraft.rotation.z));
        
        // Apply movement based on aircraft orientation and speed
        // Aircraft models are built with nose pointing along positive X-axis
        if (aircraft.type === 'helicopter') {
            // Helicopter movement: horizontal movement based on speed and yaw only
            const forwardX = Math.cos(aircraft.rotation.y);
            const forwardZ = -Math.sin(aircraft.rotation.y);
            
            aircraft.velocity.set(
                forwardX * aircraft.speed,
                0, // No automatic Y movement - controlled by W/S keys directly
                forwardZ * aircraft.speed
            );
        } else {
            // Fixed-wing aircraft movement (traditional)
            const forwardX = Math.cos(aircraft.rotation.y) * Math.cos(aircraft.rotation.z);
            const forwardY = Math.sin(aircraft.rotation.z);
            const forwardZ = -Math.sin(aircraft.rotation.y) * Math.cos(aircraft.rotation.z);
            
            aircraft.velocity.set(
                forwardX * aircraft.speed,
                forwardY * aircraft.speed,
                forwardZ * aircraft.speed
            );
        }
        
        // Apply gravity for non-helicopter aircraft when speed is low
        if (aircraft.type !== 'helicopter') {
            const baseGravityForce = -0.02; // Base gravity acceleration
            const minFlyingSpeed = 0.2; // Minimum speed to maintain lift
            
            if (aircraft.speed <= 0) {
                // Aircraft has no speed - fall 3x faster (stall)
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
        
        // Update aircraft position
        aircraft.position.add(aircraft.velocity);
        
        // Apply boundary constraints to aircraft
        this.applyBoundaryConstraints(aircraft.position);
        
        // Hill collision detection - prevent aircraft from passing through hills
        this.checkHillCollision(aircraft);
        
        // Hangar collision detection - prevent aircraft from passing through hangars
        this.checkHangarCollision(aircraft.position);
        
        // Track if aircraft gets airborne
        const minGroundHeight = this.getMinimumFlightHeight(aircraft.type);
        if (aircraft.position.y > minGroundHeight + 5) {
            this.wasInFlight = true; // Aircraft has been airborne
        }
        
        // Ground collision detection - prevent aircraft from going underground
        if (aircraft.position.y < minGroundHeight) {
            aircraft.position.y = minGroundHeight;
            // Reduce downward velocity when hitting ground
            if (aircraft.velocity.y < 0) {
                aircraft.velocity.y *= 0.1; // Dampen the bounce
            }
            
            // Auto-exit if aircraft was flying and hit the ground (crash landing)
            if (this.wasInFlight && aircraft.type !== 'helicopter') {
                console.log('Aircraft crashed! Auto-exiting...');
                setTimeout(() => {
                    this.exitAircraft();
                }, 500); // Small delay for dramatic effect
            }
        }
        
        // Apply rotation and check for ground clearance
        this.applyAircraftRotationWithGroundClearance(aircraft);
        aircraft.mesh.position.copy(aircraft.position);
        
        // Animate moving parts based on aircraft type and speed
        this.animateAircraftParts(aircraft);
        
        // Update camera to follow aircraft
        this.updateFlightCamera();
        
        // Update flight UI with current speed
        this.updateFlightUI();
    }
    
    applyAircraftRotationWithGroundClearance(aircraft) {
        // Calculate aircraft dimensions for ground clearance
        const aircraftLength = this.getAircraftLength(aircraft.type);
        const aircraftHeight = this.getAircraftHeight(aircraft.type);
        
        // Calculate the lowest point of the aircraft based on its pitch
        const pitchAngle = aircraft.rotation.z;
        
        // For nose-down pitch (positive pitchAngle), the front gets lower
        // For nose-up pitch (negative pitchAngle), the tail gets lower
        const frontHeight = Math.sin(pitchAngle) * (aircraftLength / 2);
        const rearHeight = -Math.sin(pitchAngle) * (aircraftLength / 2);
        
        // The lowest point of the aircraft (relative to its center)
        const lowestPoint = Math.min(frontHeight, rearHeight) - aircraftHeight / 2;
        
        // Calculate minimum Y position to prevent ground clipping
        const minGroundHeight = this.getMinimumFlightHeight(aircraft.type);
        const requiredY = minGroundHeight - lowestPoint;
        
        // Adjust aircraft position if it would clip through ground
        if (aircraft.position.y < requiredY) {
            aircraft.position.y = requiredY;
        }
        
        // Apply the rotation
        aircraft.mesh.rotation.set(0, aircraft.rotation.y, aircraft.rotation.z);
    }
    
    getAircraftLength(aircraftType) {
        // Return approximate length of each aircraft type
        switch(aircraftType) {
            case 'cessna': return 8;
            case 'fighter': return 15;
            case 'airliner': return 30;
            case 'cargo': return 25;
            case 'helicopter': return 12;
            default: return 10;
        }
    }
    
    getAircraftHeight(aircraftType) {
        // Return approximate height of each aircraft type
        switch(aircraftType) {
            case 'cessna': return 3;
            case 'fighter': return 4;
            case 'airliner': return 8;
            case 'cargo': return 7;
            case 'helicopter': return 4;
            default: return 4;
        }
    }
    
    applyBoundaryConstraints(position) {
        // Constrain X position
        if (position.x < this.worldBounds.minX) {
            position.x = this.worldBounds.minX;
        } else if (position.x > this.worldBounds.maxX) {
            position.x = this.worldBounds.maxX;
        }
        
        // Constrain Z position
        if (position.z < this.worldBounds.minZ) {
            position.z = this.worldBounds.minZ;
        } else if (position.z > this.worldBounds.maxZ) {
            position.z = this.worldBounds.maxZ;
        }
        
        // Constrain Y position
        if (position.y < this.worldBounds.minY) {
            position.y = this.worldBounds.minY;
        } else if (position.y > this.worldBounds.maxY) {
            position.y = this.worldBounds.maxY;
        }
    }
    
    checkHillCollision(aircraft) {
        for (let hill of this.hills) {
            // Calculate distance from aircraft to hill center
            const dx = aircraft.position.x - hill.x;
            const dz = aircraft.position.z - hill.z;
            const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
            
            // Check if aircraft is within hill radius
            if (horizontalDistance < hill.radius) {
                // Calculate hill height at aircraft position
                const hillTop = hill.baseY + hill.height;
                const distanceRatio = horizontalDistance / hill.radius;
                const hillHeightAtPosition = hill.baseY + hill.height * Math.sqrt(1 - distanceRatio * distanceRatio);
                
                // If aircraft is below hill surface, push it up
                if (aircraft.position.y < hillHeightAtPosition + 2) { // 2 units clearance
                    aircraft.position.y = hillHeightAtPosition + 2;
                    // Stop downward movement
                    if (aircraft.velocity.y < 0) {
                        aircraft.velocity.y = 0;
                    }
                    // Reduce speed on collision
                    aircraft.speed *= 0.8;
                }
            }
        }
    }
    
    checkCharacterHillCollision(position) {
        let maxHillHeight = 0; // Track the highest hill at this position
        
        for (let hill of this.hills) {
            // Calculate distance from character to hill center
            const dx = position.x - hill.x;
            const dz = position.z - hill.z;
            const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
            
            // Check if character is within hill radius
            if (horizontalDistance < hill.radius) {
                // Calculate hill height at character position using sphere equation
                const distanceRatio = horizontalDistance / hill.radius;
                const hillHeightAtPosition = hill.baseY + hill.height * Math.sqrt(1 - distanceRatio * distanceRatio);
                
                // Track the highest hill at this position
                maxHillHeight = Math.max(maxHillHeight, hillHeightAtPosition);
            }
        }
        
        // If character is on a hill, set their Y position to climb it
        if (maxHillHeight > position.y) {
            position.y = maxHillHeight;
        }
    }
    
    checkHangarCollision(newPosition, oldPosition) {
        for (let hangar of this.hangars) {
            // Check if new position would be inside hangar bounds
            const halfWidth = hangar.width / 2;
            const halfDepth = hangar.depth / 2;
            
            if (newPosition.x >= hangar.x - halfWidth &&
                newPosition.x <= hangar.x + halfWidth &&
                newPosition.z >= hangar.z - halfDepth &&
                newPosition.z <= hangar.z + halfDepth &&
                newPosition.y < hangar.height) {
                
                // Collision detected - prevent movement by restoring old position
                newPosition.x = oldPosition.x;
                newPosition.z = oldPosition.z;
                return true; // Collision occurred
            }
        }
        return false; // No collision
    }
    
    getMinimumFlightHeight(aircraftType) {
        // Define minimum heights based on aircraft type (ground clearance + landing gear)
        switch(aircraftType) {
            case 'cessna':
                return 1.0;  // Small aircraft, lower to ground
            case 'fighter':
                return 1.2;  // Fighter jet
            case 'airliner':
                return 2.5;  // Large commercial aircraft
            case 'cargo':
                return 2.3;  // Cargo plane
            case 'helicopter':
                return 2.0;  // Helicopter with skids
            default:
                return 1.5;
        }
    }
    
    animateAircraftParts(aircraft) {
        const mesh = aircraft.mesh;
        const speedFactor = aircraft.speed * 20; // Adjust animation speed based on aircraft speed
        
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
        
        // Animate helicopter rotors - always spin when in flight mode
        if (aircraft.type === 'helicopter') {
            // Helicopters need rotors spinning to stay airborne, even at speed 0
            const minRotorSpeed = (aircraft.isActive || (this.isFlying && this.currentAircraft === aircraft)) ? 0.3 : 0; // Always spin when dispatched or being flown
            const rotorSpeed = Math.max(minRotorSpeed, speedFactor);
            
            if (mesh.userData.mainRotor) {
                mesh.userData.mainRotor.rotation.y += rotorSpeed * 2; // Main rotor spins faster
            }
            if (mesh.userData.tailRotor) {
                mesh.userData.tailRotor.rotation.x += rotorSpeed * 3; // Tail rotor spins even faster
            }
        }
        
        // Add subtle wing flex for larger aircraft during flight
        if ((aircraft.type === 'airliner' || aircraft.type === 'cargo') && aircraft.speed > 0.3) {
            const flexAmount = Math.sin(Date.now() * 0.01) * 0.02 * aircraft.speed;
            // Could add wing flex animation here if wings were separate objects
        }
    }
    
    updateMouseLook() {
        if (this.mouse.isLocked && !this.isFlying) {
            // Update yaw (horizontal rotation) and pitch (vertical rotation)
            this.yaw -= this.mouse.x * this.mouseSensitivity;
            this.pitch -= this.mouse.y * this.mouseSensitivity;
            
            // Clamp pitch to prevent over-rotation
            this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
            
            // Apply rotations to camera
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = this.pitch;
            this.camera.rotation.z = 0;
        }
        
        // Reset mouse movement for next frame
        this.mouse.x = 0;
        this.mouse.y = 0;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateMovement();
        this.updateMouseLook();
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the simulator when the page loads
window.addEventListener('load', () => {
    try {
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js is not loaded');
        }
        console.log('Three.js Simulator initialized successfully');
        new Simulator();
    } catch (error) {
        console.error('Failed to initialize simulator:', error);
        const infoElement = document.getElementById('info');
        if (infoElement) {
            infoElement.innerHTML = `
                <h3>Error: Failed to load simulator</h3>
                <p>Error: ${error.message}</p>
                <p>Please refresh the page or check the console for details.</p>
            `;
        }
    }
}); 