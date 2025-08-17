/**
 * ConfigManager - Centralized configuration management
 * Single Responsibility: Configuration storage and retrieval
 * NO business logic, NO calculations, ONLY configuration management
 */

export class ConfigManager {
    constructor() {
        this.config = {
            // Aircraft specifications
            aircraft: {
                cessna: {
                    maxSpeed: 50,
                    acceleration: 2,
                    turnRate: 0.05,
                    minFlightHeight: 1,
                    length: 8,
                    height: 3,
                    taxiSpeed: 3.0,
                    turnRadius: 5
                },
                fighter: {
                    maxSpeed: 80,
                    acceleration: 4,
                    turnRate: 0.08,
                    minFlightHeight: 1,
                    length: 12,
                    height: 4,
                    taxiSpeed: 4.0,
                    turnRadius: 8
                },
                airliner: {
                    maxSpeed: 60,
                    acceleration: 1.5,
                    turnRate: 0.03,
                    minFlightHeight: 1,
                    length: 30,
                    height: 8,
                    taxiSpeed: 2.5,
                    turnRadius: 15
                },
                cargo: {
                    maxSpeed: 45,
                    acceleration: 1,
                    turnRate: 0.02,
                    minFlightHeight: 1,
                    length: 25,
                    height: 10,
                    taxiSpeed: 2.0,
                    turnRadius: 12
                },
                helicopter: {
                    maxSpeed: 40,
                    acceleration: 3,
                    turnRate: 0.1,
                    minFlightHeight: 1,
                    length: 10,
                    height: 4,
                    taxiSpeed: 1.5,
                    turnRadius: 3
                }
            },

            // Runway system
            runway: {
                length: 180,
                width: 20,
                startPosition: { x: -90, y: 1, z: 0 },
                endPosition: { x: 90, y: 1, z: 0 },
                heading: 0,
                approachDistance: 150,
                approachHeight: 30
            },

            // Parking positions
            parking: {
                cessna: { x: -20, z: 25, heading: 0 },
                fighter: { x: 20, z: 25, heading: Math.PI / 4 },
                airliner: { x: 0, z: 40, heading: 0 },
                cargo: { x: 40, z: 25, heading: -Math.PI / 4 },
                helicopter: { x: -80, z: -30, heading: 0 }
            },

            // Taxi routes
            taxiRoutes: {
                cessna: {
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
                }
            },

            // Operation timing
            timing: {
                taxi: {
                    timeout: 120000, // 2 minutes
                    waypointTolerance: 3.0,
                    turnRate: 0.3
                },
                takeoff: {
                    rotationProgress: 0.6,
                    climbProgress: 0.4,
                    accelerationTime: 8000,
                    climbTime: 6000
                },
                landing: {
                    approachTime: 12000,
                    touchdownTime: 3000,
                    rolloutTime: 5000
                },
                ground: {
                    pushbackTime: 15000,
                    vehicleSpeed: 2.0
                }
            },

            // Validation tolerances
            validation: {
                positionTolerance: 3.0,
                altitudeTolerance: 2.0,
                headingTolerance: 0.1,
                speedTolerance: 1.0
            },

            // Debug settings
            debug: {
                enableLogging: true,
                logLevel: 'info', // 'error', 'warn', 'info', 'debug'
                maxLogHistory: 1000,
                enableStateHistory: true,
                enablePerformanceMonitoring: false
            }
        };
    }

    /**
     * Get configuration value by path
     * @param {string} path - Dot-separated path (e.g., 'aircraft.cessna.maxSpeed')
     * @returns {*} Configuration value
     */
    get(path) {
        const parts = path.split('.');
        let current = this.config;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Set configuration value by path
     * @param {string} path - Dot-separated path
     * @param {*} value - Value to set
     */
    set(path, value) {
        const parts = path.split('.');
        const lastPart = parts.pop();
        let current = this.config;

        // Navigate to parent object
        for (const part of parts) {
            if (!(part in current)) {
                current[part] = {};
            }
            current = current[part];
        }

        current[lastPart] = value;
    }

    /**
     * Get aircraft configuration
     * @param {string} aircraftType - Aircraft type
     * @returns {Object} Aircraft configuration
     */
    getAircraftConfig(aircraftType) {
        return this.get(`aircraft.${aircraftType}`) || {};
    }

    /**
     * Get parking position for aircraft type
     * @param {string} aircraftType - Aircraft type
     * @returns {Object} Parking position
     */
    getParkingPosition(aircraftType) {
        return this.get(`parking.${aircraftType}`) || { x: 0, z: 0, heading: 0 };
    }

    /**
     * Get taxi route for aircraft type and direction
     * @param {string} aircraftType - Aircraft type
     * @param {string} direction - 'toRunway' or 'fromRunway'
     * @returns {Array} Taxi route waypoints
     */
    getTaxiRoute(aircraftType, direction) {
        return this.get(`taxiRoutes.${aircraftType}.${direction}`) || [];
    }

    /**
     * Get runway configuration
     * @returns {Object} Runway configuration
     */
    getRunwayConfig() {
        return this.get('runway');
    }

    /**
     * Get timing configuration for operation
     * @param {string} operation - Operation name
     * @returns {Object} Timing configuration
     */
    getTimingConfig(operation) {
        return this.get(`timing.${operation}`) || {};
    }

    /**
     * Get validation tolerances
     * @returns {Object} Validation configuration
     */
    getValidationConfig() {
        return this.get('validation');
    }

    /**
     * Get debug configuration
     * @returns {Object} Debug configuration
     */
    getDebugConfig() {
        return this.get('debug');
    }

    /**
     * Update aircraft configuration
     * @param {string} aircraftType - Aircraft type
     * @param {Object} updates - Configuration updates
     */
    updateAircraftConfig(aircraftType, updates) {
        const current = this.getAircraftConfig(aircraftType);
        this.set(`aircraft.${aircraftType}`, { ...current, ...updates });
    }

    /**
     * Add new aircraft type configuration
     * @param {string} aircraftType - Aircraft type
     * @param {Object} config - Complete aircraft configuration
     */
    addAircraftType(aircraftType, config) {
        this.set(`aircraft.${aircraftType}`, config);
    }

    /**
     * Remove aircraft type configuration
     * @param {string} aircraftType - Aircraft type
     */
    removeAircraftType(aircraftType) {
        delete this.config.aircraft[aircraftType];
        delete this.config.parking[aircraftType];
        delete this.config.taxiRoutes[aircraftType];
    }

    /**
     * Get all configured aircraft types
     * @returns {Array} Aircraft type names
     */
    getAircraftTypes() {
        return Object.keys(this.config.aircraft);
    }

    /**
     * Validate configuration structure
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];
        const warnings = [];

        // Check required sections
        const requiredSections = ['aircraft', 'runway', 'parking', 'timing', 'validation'];
        for (const section of requiredSections) {
            if (!this.config[section]) {
                errors.push(`Missing required configuration section: ${section}`);
            }
        }

        // Check aircraft configurations
        for (const [type, config] of Object.entries(this.config.aircraft)) {
            const required = ['maxSpeed', 'acceleration', 'turnRate', 'minFlightHeight'];
            for (const prop of required) {
                if (!(prop in config)) {
                    errors.push(`Aircraft ${type} missing required property: ${prop}`);
                }
            }

            // Check if parking position exists
            if (!this.config.parking[type]) {
                warnings.push(`No parking position defined for aircraft type: ${type}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Reset to default configuration
     */
    reset() {
        this.config = this.getDefaultConfig();
    }

    /**
     * Load configuration from object
     * @param {Object} newConfig - Configuration object
     */
    load(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Export current configuration
     * @returns {Object} Current configuration
     */
    export() {
        return JSON.parse(JSON.stringify(this.config));
    }

    /**
     * Get default configuration
     * @private
     */
    getDefaultConfig() {
        // Return the default config defined in constructor
        return JSON.parse(JSON.stringify(this.config));
    }
}

// Export singleton instance
export const configManager = new ConfigManager();