/**
 * Game Constants and Configuration
 * Contains all magic numbers and configuration values used throughout the simulator
 */

export const WORLD_BOUNDS = {
    minX: -500,
    maxX: 500,
    minZ: -500,
    maxZ: 500,
    minY: 0,
    maxY: 200  // Height limit for aircraft
};

export const MOVEMENT = {
    MOVE_SPEED: 0.2,
    MOUSE_SENSITIVITY: 0.002
};

export const CAMERA = {
    FOV: 75,
    NEAR: 0.1,
    FAR: 1000,
    WALKING_DISTANCE: 3,
    WALKING_HEIGHT: 2.5,
    FLIGHT_DISTANCE: 12,
    FLIGHT_HEIGHT: 6
};

export const AIRCRAFT_SPECS = {
    cessna: {
        maxSpeed: 0.8,
        acceleration: 0.02,
        turnRate: 0.02,
        minFlightHeight: 1.0,
        length: 8,
        height: 3
    },
    fighter: {
        maxSpeed: 1.5,
        acceleration: 0.04,
        turnRate: 0.03,
        minFlightHeight: 1.2,
        length: 15,
        height: 4
    },
    airliner: {
        maxSpeed: 1.2,
        acceleration: 0.01,
        turnRate: 0.01,
        minFlightHeight: 2.5,
        length: 30,
        height: 8
    },
    cargo: {
        maxSpeed: 1.0,
        acceleration: 0.015,
        turnRate: 0.015,
        minFlightHeight: 2.3,
        length: 25,
        height: 7
    },
    helicopter: {
        maxSpeed: 0.6,
        acceleration: 0.03,
        turnRate: 0.04,
        minFlightHeight: 2.0,
        length: 12,
        height: 4
    }
};

export const PARKING_SPOTS = [
    { x: -90, z: 45, type: 'cessna' },     // General Aviation area
    { x: -50, z: 60, type: 'fighter' },    // Military apron
    { x: 50, z: 60, type: 'airliner' },    // Commercial terminal gates
    { x: 90, z: 45, type: 'cargo' },       // Cargo apron
    { x: 60, z: -30, type: 'helicopter' }  // Helipad
];

export const RUNWAY_SYSTEM = {
    // Main runway (East-West)
    mainRunway: {
        takeoffPosition: { x: -90, z: 0, heading: 0 },      // West end, facing east
        landingPosition: { x: 90, z: 0, heading: Math.PI }, // East end, facing west
        centerline: { startX: -90, endX: 90, z: 0 }
    },
    // Taxi waypoints for each aircraft type
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

export const CONTROL_TOWER = {
    position: { x: -40, y: 0, z: -20 },
    viewPosition: { x: -40, y: 25, z: -20 },
    proximityDistance: 10
};

export const HELIPAD = {
    position: { x: 60, y: 0, z: -30 },
    radius: 12
};

export const PHYSICS = {
    GRAVITY: -0.02,
    MIN_FLYING_SPEED: 0.2,
    MIN_CONTROL_SPEED: 0.1,
    CRASH_DETECTION_HEIGHT: 5,
    VERTICAL_TAKEOFF_SPEED: 0.3,
    APPROACH_DESCENT_RATE: 0.15,
    LANDING_DECELERATION: 0.03,
    TAXI_SPEED: 0.1
};

export const COLORS = {
    SKY_BLUE: 0x87CEEB,
    GRASS_GREEN: 0x4a7c59,
    RUNWAY_GRAY: 0x404040,
    TAXIWAY_GRAY: 0x505050,
    WHITE: 0xffffff,
    YELLOW: 0xffff00,
    RED: 0xff0000,
    BLUE: 0x0066cc,
    BROWN: 0x8b4513,
    CONCRETE: 0x888888
};

export const ANIMATION = {
    WALKING_SPEED: 0.2,
    PROPELLER_SPEED_FACTOR: 20,
    ROTOR_MIN_SPEED: 0.3,
    ROTOR_MAIN_MULTIPLIER: 2,
    ROTOR_TAIL_MULTIPLIER: 3
};

export const FLIGHT_AUTOMATION = {
    TIMER_INCREMENT: 1,
    TAXI_TURN_RATE: 0.05,
    RUNWAY_ALIGN_RATE: 0.1,
    TAKEOFF_ACCELERATION: 0.02,
    TAKEOFF_SPEED_THRESHOLD: 0.7,
    CLIMB_RATE: 0.2,
    CRUISE_SPEED: 0.6,
    CIRCLE_SPEED: 0.01,
    APPROACH_TURN_RATE: 0.02,
    WAYPOINT_THRESHOLD: 3
};

export const UI_MESSAGES = {
    FLIGHT_MODE_TITLE: 'Flight Mode',
    CONTROL_TOWER_TITLE: 'Air Traffic Control Tower',
    SIMULATOR_TITLE: 'Three.js Simulator',
    CONTROLS_HEADER: 'Controls:',
    FLIGHT_CONTROLS_HEADER: 'Flight Controls:',
    COMMANDS_HEADER: 'Commands:',
    AIRCRAFT_STATUS_HEADER: 'Aircraft Status:',
    LEGEND_HEADER: 'Legend:'
};

export const INTERACTION_DISTANCES = {
    AIRCRAFT: 8,
    CONTROL_TOWER: 10,
    HANGAR_COLLISION: 15
};