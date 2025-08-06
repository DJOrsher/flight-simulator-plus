/**
 * Aircraft Factory
 * Creates different types of aircraft with their 3D models
 */

import { Aircraft } from './Aircraft.js';
import { COLORS } from '../utils/Constants.js';
import * as GeometryFactory from '../utils/GeometryFactory.js';

export class AircraftFactory {
    
    /**
     * Create an aircraft of the specified type
     * @param {string} type - Aircraft type ('cessna', 'fighter', 'airliner', 'cargo', 'helicopter')
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @param {number} rotation - Y rotation in radians
     * @returns {Aircraft} Created aircraft instance
     */
    static create(type, x, y, z, rotation = 0) {
        const aircraft = new Aircraft(type, { x, y, z }, { x: 0, y: rotation, z: 0 });
        
        // Create the 3D model based on type
        switch (type) {
            case 'cessna':
                aircraft.mesh = this.createCessna(x, y, z, rotation);
                break;
            case 'fighter':
                aircraft.mesh = this.createFighterJet(x, y, z, rotation);
                break;
            case 'airliner':
                aircraft.mesh = this.createAirliner(x, y, z, rotation);
                break;
            case 'cargo':
                aircraft.mesh = this.createCargoPlane(x, y, z, rotation);
                break;
            case 'helicopter':
                aircraft.mesh = this.createHelicopter(x, y, z, rotation);
                break;
            default:
                throw new Error(`Unknown aircraft type: ${type}`);
        }
        
        return aircraft;
    }

    /**
     * Create a Cessna-style small aircraft
     */
    static createCessna(x, y, z, rotation) {
        const cessna = new THREE.Group();
        
        // Main fuselage
        const fuselageGeometry = GeometryFactory.createCylinder(0.6, 0.3, 6, 12);
        const fuselageMaterial = GeometryFactory.createMaterial(COLORS.WHITE);
        const fuselage = GeometryFactory.createMesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.position.set(0, 0.3, 0);
        cessna.add(fuselage);
        
        // Cockpit/windscreen
        const cockpitGeometry = GeometryFactory.createSphere(0.4, 8, 6);
        const cockpitMaterial = GeometryFactory.createTransparentMaterial(COLORS.SKY_BLUE, 0.7);
        const cockpit = GeometryFactory.createMesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(1.5, 0.6, 0);
        cockpit.scale.set(1.2, 0.8, 1);
        cessna.add(cockpit);
        
        // Main wings
        const wingGeometry = GeometryFactory.createBox(8, 0.15, 1.5);
        const wingMaterial = GeometryFactory.createMaterial(COLORS.WHITE);
        const wings = GeometryFactory.createMesh(wingGeometry, wingMaterial);
        wings.position.set(0.5, 0.4, 0);
        cessna.add(wings);
        
        // Wing struts
        const strutGeometry = GeometryFactory.createCylinder(0.03, 0.03, 1, 6);
        const strutMaterial = GeometryFactory.createMaterial(0x808080);
        
        for (let side of [-1, 1]) {
            const strut = GeometryFactory.createMesh(strutGeometry, strutMaterial);
            strut.position.set(0, -0.1, side * 2);
            strut.rotation.x = Math.PI / 6;
            cessna.add(strut);
        }
        
        // Propeller
        const propGroup = GeometryFactory.createPropeller(0.1, 0.3, 2.5, 2);
        propGroup.position.set(3.2, 0.3, 0);
        cessna.add(propGroup);
        cessna.userData.propeller = propGroup;
        
        // Horizontal stabilizer
        const hStabGeometry = GeometryFactory.createBox(2.5, 0.1, 0.8);
        const hStab = GeometryFactory.createMesh(hStabGeometry, wingMaterial);
        hStab.position.set(-2.8, 0.3, 0);
        cessna.add(hStab);
        
        // Vertical stabilizer
        const vStabGeometry = GeometryFactory.createBox(1.5, 1.5, 0.1);
        const vStabMaterial = GeometryFactory.createMaterial(COLORS.RED);
        const vStab = GeometryFactory.createMesh(vStabGeometry, vStabMaterial);
        vStab.position.set(-2.8, 1, 0);
        cessna.add(vStab);
        
        // Landing gear
        this.addLandingGear(cessna);
        
        cessna.position.set(x, y + 1, z);
        cessna.rotation.y = rotation;
        return cessna;
    }

    /**
     * Create a fighter jet
     */
    static createFighterJet(x, y, z, rotation) {
        const fighter = new THREE.Group();
        
        // Main fuselage
        const fuselageGeometry = GeometryFactory.createCylinder(0.6, 0.3, 8, 12);
        const fuselageMaterial = GeometryFactory.createMaterial(0x708090);
        const fuselage = GeometryFactory.createMesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        fighter.add(fuselage);
        
        // Nose cone
        const noseGeometry = GeometryFactory.createCone(0.3, 2, 8);
        const nose = GeometryFactory.createMesh(noseGeometry, fuselageMaterial);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(5, 0, 0);
        fighter.add(nose);
        
        // Delta wings
        const wingGeometry = GeometryFactory.createBox(6, 0.2, 2);
        const wings = GeometryFactory.createMesh(wingGeometry, fuselageMaterial);
        wings.position.set(-1, -0.1, 0);
        fighter.add(wings);
        
        // Wing tips (swept design)
        const tipGeometry = GeometryFactory.createBox(2, 0.2, 0.8);
        const leftTip = GeometryFactory.createMesh(tipGeometry, fuselageMaterial);
        leftTip.position.set(-3, -0.1, 2.5);
        leftTip.rotation.y = Math.PI / 6;
        fighter.add(leftTip);
        
        const rightTip = GeometryFactory.createMesh(tipGeometry, fuselageMaterial);
        rightTip.position.set(-3, -0.1, -2.5);
        rightTip.rotation.y = -Math.PI / 6;
        fighter.add(rightTip);
        
        // Cockpit canopy
        const cockpitGeometry = GeometryFactory.createSphere(0.5, 12, 8);
        const cockpitMaterial = GeometryFactory.createTransparentMaterial(0x1a1a2e, 0.8);
        const cockpit = GeometryFactory.createMesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(2, 0.4, 0);
        cockpit.scale.set(1.5, 0.7, 1);
        fighter.add(cockpit);
        
        // Twin tails
        const tailGeometry = GeometryFactory.createBox(1, 2, 0.2);
        const leftTail = GeometryFactory.createMesh(tailGeometry, fuselageMaterial);
        leftTail.position.set(-3.5, 1, 1);
        fighter.add(leftTail);
        
        const rightTail = GeometryFactory.createMesh(tailGeometry, fuselageMaterial);
        rightTail.position.set(-3.5, 1, -1);
        fighter.add(rightTail);
        
        // Engine exhaust
        const exhaustGeometry = GeometryFactory.createCylinder(0.2, 0.3, 1, 8);
        const exhaustMaterial = GeometryFactory.createMaterial(0x333333);
        const exhaust = GeometryFactory.createMesh(exhaustGeometry, exhaustMaterial);
        exhaust.rotation.z = Math.PI / 2;
        exhaust.position.set(-4.5, 0, 0);
        fighter.add(exhaust);
        
        fighter.position.set(x, y + 1, z);
        fighter.rotation.y = rotation;
        return fighter;
    }

    /**
     * Create a commercial airliner
     */
    static createAirliner(x, y, z, rotation) {
        const airliner = new THREE.Group();
        
        // Main fuselage
        const fuselageGeometry = GeometryFactory.createCylinder(1.8, 1.4, 18, 16);
        const fuselageMaterial = GeometryFactory.createMaterial(COLORS.WHITE);
        const fuselage = GeometryFactory.createMesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        airliner.add(fuselage);
        
        // Nose cone
        const noseGeometry = GeometryFactory.createCone(1.4, 3, 12);
        const nose = GeometryFactory.createMesh(noseGeometry, fuselageMaterial);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(10.5, 0, 0);
        airliner.add(nose);
        
        // Wings
        const wingGeometry = GeometryFactory.createBox(22, 0.6, 3.5);
        const wingMaterial = GeometryFactory.createMaterial(0xf0f0f0);
        const wings = GeometryFactory.createMesh(wingGeometry, wingMaterial);
        wings.position.set(-2, -0.5, 0);
        airliner.add(wings);
        
        // Wing root fairings
        const fairingGeometry = GeometryFactory.createBox(4, 1.2, 2);
        const fairing1 = GeometryFactory.createMesh(fairingGeometry, fuselageMaterial);
        fairing1.position.set(-2, -0.2, 2.5);
        airliner.add(fairing1);
        
        const fairing2 = GeometryFactory.createMesh(fairingGeometry, fuselageMaterial);
        fairing2.position.set(-2, -0.2, -2.5);
        airliner.add(fairing2);
        
        // Engines
        this.addAirlinerEngines(airliner);
        
        // Horizontal stabilizer
        const hStabGeometry = GeometryFactory.createBox(8, 0.3, 2);
        const hStab = GeometryFactory.createMesh(hStabGeometry, wingMaterial);
        hStab.position.set(-8, 0.5, 0);
        airliner.add(hStab);
        
        // Vertical stabilizer
        const vStabGeometry = GeometryFactory.createBox(2, 4, 0.4);
        const vStabMaterial = GeometryFactory.createMaterial(COLORS.BLUE);
        const vStab = GeometryFactory.createMesh(vStabGeometry, vStabMaterial);
        vStab.position.set(-8.5, 2, 0);
        airliner.add(vStab);
        
        // Cockpit windows
        const windowGeometry = GeometryFactory.createSphere(1.2, 12, 8);
        const windowMaterial = GeometryFactory.createTransparentMaterial(COLORS.SKY_BLUE, 0.7);
        const cockpitWindows = GeometryFactory.createMesh(windowGeometry, windowMaterial);
        cockpitWindows.position.set(7, 0.3, 0);
        cockpitWindows.scale.set(1.8, 0.8, 1);
        airliner.add(cockpitWindows);
        
        airliner.position.set(x, y + 2, z);
        airliner.rotation.y = rotation;
        return airliner;
    }

    /**
     * Create a cargo plane
     */
    static createCargoPlane(x, y, z, rotation) {
        const cargo = new THREE.Group();
        
        // Fuselage (wider and taller)
        const fuselageGeometry = GeometryFactory.createBox(15, 3, 3);
        const fuselageMaterial = GeometryFactory.createMaterial(COLORS.BROWN);
        const fuselage = GeometryFactory.createMesh(fuselageGeometry, fuselageMaterial);
        cargo.add(fuselage);
        
        // Wings (high-mounted)
        const wingGeometry = GeometryFactory.createBox(20, 0.4, 3);
        const wings = GeometryFactory.createMesh(wingGeometry, fuselageMaterial);
        wings.position.y = 2;
        cargo.add(wings);
        
        // Propeller engines
        const propellers = [];
        for (let i = 0; i < 4; i++) {
            const engineGeometry = GeometryFactory.createCylinder(0.4, 0.4, 1.5, 8);
            const engineMaterial = GeometryFactory.createMaterial(0x2f4f4f);
            const engine = GeometryFactory.createMesh(engineGeometry, engineMaterial);
            engine.position.set(0, 2, -6 + i * 4);
            engine.rotation.x = Math.PI / 2;
            cargo.add(engine);
            
            const propGroup = GeometryFactory.createPropeller(0.08, 0.2, 1.8, 3);
            propGroup.position.set(0.8, 2, -6 + i * 4);
            cargo.add(propGroup);
            propellers.push(propGroup);
        }
        
        cargo.userData.propellers = propellers;
        
        cargo.position.set(x, y + 2, z);
        cargo.rotation.y = rotation;
        return cargo;
    }

    /**
     * Create a helicopter
     */
    static createHelicopter(x, y, z, rotation) {
        const helicopter = new THREE.Group();
        
        // Main body
        const bodyGeometry = GeometryFactory.createSphere(1.5, 12, 8);
        const bodyMaterial = GeometryFactory.createMaterial(0xff4500);
        const body = GeometryFactory.createMesh(bodyGeometry, bodyMaterial);
        body.scale.set(1.8, 0.9, 1.2);
        helicopter.add(body);
        
        // Cockpit glass
        const cockpitGeometry = GeometryFactory.createSphere(1.2, 12, 8);
        const cockpitMaterial = GeometryFactory.createTransparentMaterial(COLORS.SKY_BLUE, 0.6);
        const cockpit = GeometryFactory.createMesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(1, 0.3, 0);
        cockpit.scale.set(1.2, 0.8, 1);
        helicopter.add(cockpit);
        
        // Tail boom
        const tailGeometry = GeometryFactory.createCylinder(0.4, 0.2, 6, 8);
        const tailMaterial = GeometryFactory.createMaterial(0xff4500);
        const tail = GeometryFactory.createMesh(tailGeometry, tailMaterial);
        tail.rotation.z = Math.PI / 2;
        tail.position.set(-4, 0.5, 0);
        helicopter.add(tail);
        
        // Main rotor system
        this.addHelicopterRotors(helicopter);
        
        // Landing skids
        this.addHelicopterSkids(helicopter);
        
        helicopter.position.set(x, y + 2, z);
        helicopter.rotation.y = rotation;
        return helicopter;
    }

    /**
     * Add landing gear to small aircraft
     */
    static addLandingGear(aircraft) {
        const gearGeometry = GeometryFactory.createCylinder(0.15, 0.15, 0.1, 8);
        const gearMaterial = GeometryFactory.createMaterial(0x1a1a1a);
        const strutMaterial = GeometryFactory.createMaterial(0x808080);
        
        // Main gear
        for (let side of [-1, 1]) {
            const wheel = GeometryFactory.createMesh(gearGeometry, gearMaterial);
            wheel.position.set(0.5, -0.5, side * 1.2);
            wheel.rotation.x = Math.PI / 2;
            aircraft.add(wheel);
            
            const strutGearGeometry = GeometryFactory.createCylinder(0.03, 0.03, 0.6, 6);
            const gearStrut = GeometryFactory.createMesh(strutGearGeometry, strutMaterial);
            gearStrut.position.set(0.5, -0.15, side * 1.2);
            aircraft.add(gearStrut);
        }
        
        // Nose gear
        const noseWheel = GeometryFactory.createMesh(gearGeometry, gearMaterial);
        noseWheel.position.set(2.5, -0.4, 0);
        noseWheel.rotation.x = Math.PI / 2;
        noseWheel.scale.set(0.8, 0.8, 0.8);
        aircraft.add(noseWheel);
    }

    /**
     * Add engines to airliner
     */
    static addAirlinerEngines(airliner) {
        const engineGeometry = GeometryFactory.createCylinder(0.6, 0.6, 4, 12);
        const engineMaterial = GeometryFactory.createMaterial(0x696969);
        
        const engine1 = GeometryFactory.createMesh(engineGeometry, engineMaterial);
        engine1.position.set(-1, -1.8, 5);
        engine1.rotation.x = Math.PI / 2;
        airliner.add(engine1);
        
        const engine2 = GeometryFactory.createMesh(engineGeometry, engineMaterial);
        engine2.position.set(-1, -1.8, -5);
        engine2.rotation.x = Math.PI / 2;
        airliner.add(engine2);
        
        // Engine pylons
        const pylonGeometry = GeometryFactory.createBox(1.5, 1, 0.3);
        const pylonMaterial = GeometryFactory.createMaterial(0xcccccc);
        
        const pylon1 = GeometryFactory.createMesh(pylonGeometry, pylonMaterial);
        pylon1.position.set(-1, -1.2, 5);
        airliner.add(pylon1);
        
        const pylon2 = GeometryFactory.createMesh(pylonGeometry, pylonMaterial);
        pylon2.position.set(-1, -1.2, -5);
        airliner.add(pylon2);
    }

    /**
     * Add rotor system to helicopter
     */
    static addHelicopterRotors(helicopter) {
        // Main rotor mast
        const mastGeometry = GeometryFactory.createCylinder(0.08, 0.08, 1.5, 8);
        const mastMaterial = GeometryFactory.createMaterial(0x333333);
        const mast = GeometryFactory.createMesh(mastGeometry, mastMaterial);
        mast.position.y = 2.2;
        helicopter.add(mast);
        
        // Main rotor hub
        const hubGeometry = GeometryFactory.createCylinder(0.15, 0.15, 0.3, 8);
        const hub = GeometryFactory.createMesh(hubGeometry, mastMaterial);
        hub.position.y = 3;
        helicopter.add(hub);
        
        // Main rotor blades
        const rotorGroup = new THREE.Group();
        const bladeGeometry = GeometryFactory.createBox(8, 0.05, 0.25);
        const bladeMaterial = GeometryFactory.createMaterial(0x2f4f4f);
        
        for (let i = 0; i < 2; i++) {
            const blade = GeometryFactory.createMesh(bladeGeometry, bladeMaterial);
            blade.rotation.y = i * Math.PI;
            rotorGroup.add(blade);
        }
        
        rotorGroup.position.y = 3;
        helicopter.add(rotorGroup);
        helicopter.userData.mainRotor = rotorGroup;
        
        // Tail rotor
        const tailRotorGroup = new THREE.Group();
        const tailBladeGeometry = GeometryFactory.createBox(1.5, 0.03, 0.15);
        
        for (let i = 0; i < 4; i++) {
            const tailBlade = GeometryFactory.createMesh(tailBladeGeometry, bladeMaterial);
            tailBlade.rotation.z = i * Math.PI / 2;
            tailRotorGroup.add(tailBlade);
        }
        
        tailRotorGroup.position.set(-6.5, 1, 0);
        tailRotorGroup.rotation.y = Math.PI / 2;
        helicopter.add(tailRotorGroup);
        helicopter.userData.tailRotor = tailRotorGroup;
    }

    /**
     * Add landing skids to helicopter
     */
    static addHelicopterSkids(helicopter) {
        const skidGeometry = GeometryFactory.createBox(3.5, 0.15, 0.25);
        const skidMaterial = GeometryFactory.createMaterial(0x333333);
        
        const skid1 = GeometryFactory.createMesh(skidGeometry, skidMaterial);
        skid1.position.set(0, -1.2, 0.8);
        helicopter.add(skid1);
        
        const skid2 = GeometryFactory.createMesh(skidGeometry, skidMaterial);
        skid2.position.set(0, -1.2, -0.8);
        helicopter.add(skid2);
        
        // Skid supports
        const supportGeometry = GeometryFactory.createCylinder(0.03, 0.03, 0.8, 6);
        const supportMaterial = GeometryFactory.createMaterial(0x333333);
        
        for (let x of [-1, 1]) {
            for (let z of [-0.8, 0.8]) {
                const support = GeometryFactory.createMesh(supportGeometry, supportMaterial);
                support.position.set(x * 0.8, -0.8, z);
                helicopter.add(support);
            }
        }
    }
}