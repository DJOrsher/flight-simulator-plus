/**
 * ValidationRules - Business rule validation functions
 * Single Responsibility: Business logic validation
 * NO state management, NO event handling, ONLY rule validation
 */

import { configManager } from '../config/ConfigManager.js';
import { 
    isWithinTolerance, 
    isAtRunwayThreshold, 
    isAtRunwayEnd, 
    isOnRunway,
    isAtParkingPosition,
    isAirborne,
    isAtSafeAltitude
} from './PositionValidator.js';

/**
 * Validate taxi operation requirements
 * @param {Object} aircraft - Aircraft object
 * @param {string} direction - 'toRunway' or 'fromRunway'
 * @returns {Object} Validation result {isValid, violations, requirements}
 */
export function validateTaxiRequirements(aircraft, direction) {
    const violations = [];
    const requirements = [];
    
    // Aircraft must exist and have valid type
    if (!aircraft || !aircraft.type) {
        violations.push('invalid_aircraft');
        return { isValid: false, violations, requirements };
    }
    
    const config = configManager.getAircraftConfig(aircraft.type);
    if (!config) {
        violations.push('unknown_aircraft_type');
        return { isValid: false, violations, requirements };
    }
    
    // Helicopters don't need taxi operations
    if (aircraft.type === 'helicopter') {
        requirements.push('helicopter_no_taxi_needed');
        return { isValid: false, violations, requirements };
    }
    
    // Position requirements
    if (!aircraft.position) {
        violations.push('missing_position');
    } else {
        // For toRunway: must be at parking position
        if (direction === 'toRunway') {
            if (!isAtParkingPosition(aircraft.position, aircraft.type)) {
                violations.push('not_at_parking_position');
                requirements.push('must_be_at_parking_position');
            }
            if (isAirborne(aircraft.position, aircraft.type)) {
                violations.push('aircraft_airborne');
                requirements.push('must_be_on_ground');
            }
        }
        
        // For fromRunway: must be on or near runway
        if (direction === 'fromRunway') {
            if (!isOnRunway(aircraft.position) && !isAtRunwayEnd(aircraft.position)) {
                violations.push('not_on_runway');
                requirements.push('must_be_on_runway');
            }
        }
    }
    
    // Speed requirements
    if (aircraft.speed > config.taxiSpeed * 2) {
        violations.push('speed_too_high');
        requirements.push('must_reduce_speed');
    }
    
    // State requirements
    if (aircraft.isBeingTowed) {
        violations.push('already_being_towed');
        requirements.push('must_not_be_towed');
    }
    
    return {
        isValid: violations.length === 0,
        violations,
        requirements
    };
}

/**
 * Validate takeoff operation requirements
 * @param {Object} aircraft - Aircraft object
 * @returns {Object} Validation result {isValid, violations, requirements}
 */
export function validateTakeoffRequirements(aircraft) {
    const violations = [];
    const requirements = [];
    
    if (!aircraft || !aircraft.type) {
        violations.push('invalid_aircraft');
        return { isValid: false, violations, requirements };
    }
    
    const config = configManager.getAircraftConfig(aircraft.type);
    if (!config) {
        violations.push('unknown_aircraft_type');
        return { isValid: false, violations, requirements };
    }
    
    // Position requirements
    if (!aircraft.position) {
        violations.push('missing_position');
    } else {
        // Must be at runway threshold
        if (!isAtRunwayThreshold(aircraft.position)) {
            violations.push('not_at_runway_threshold');
            requirements.push('must_be_at_runway_threshold');
        }
        
        // Must be on ground
        if (isAirborne(aircraft.position, aircraft.type)) {
            violations.push('already_airborne');
            requirements.push('must_be_on_ground');
        }
    }
    
    // Speed requirements
    if (aircraft.speed > config.taxiSpeed) {
        violations.push('speed_too_high_for_takeoff');
        requirements.push('must_reduce_to_taxi_speed');
    }
    
    // Heading requirements
    if (aircraft.rotation && aircraft.rotation.y) {
        const runwayHeading = configManager.get('runway.heading') || 0;
        const headingDiff = Math.abs(aircraft.rotation.y - runwayHeading);
        if (headingDiff > 0.2) { // ~11 degrees tolerance
            violations.push('incorrect_heading');
            requirements.push('must_align_with_runway');
        }
    }
    
    return {
        isValid: violations.length === 0,
        violations,
        requirements
    };
}

/**
 * Validate landing operation requirements
 * @param {Object} aircraft - Aircraft object
 * @returns {Object} Validation result {isValid, violations, requirements}
 */
export function validateLandingRequirements(aircraft) {
    const violations = [];
    const requirements = [];
    
    if (!aircraft || !aircraft.type) {
        violations.push('invalid_aircraft');
        return { isValid: false, violations, requirements };
    }
    
    const config = configManager.getAircraftConfig(aircraft.type);
    if (!config) {
        violations.push('unknown_aircraft_type');
        return { isValid: false, violations, requirements };
    }
    
    // Position requirements
    if (!aircraft.position) {
        violations.push('missing_position');
    } else {
        // Must be airborne
        if (!isAirborne(aircraft.position, aircraft.type)) {
            violations.push('not_airborne');
            requirements.push('must_be_airborne');
        }
        
        // Should be at safe altitude for approach
        if (!isAtSafeAltitude(aircraft.position, 20)) {
            violations.push('altitude_too_low');
            requirements.push('must_gain_altitude');
        }
    }
    
    // Speed requirements
    const landingSpeed = config.maxSpeed * 0.6; // Typical landing speed
    if (aircraft.speed > config.maxSpeed * 0.9) {
        violations.push('speed_too_high');
        requirements.push('must_reduce_speed');
    }
    
    return {
        isValid: violations.length === 0,
        violations,
        requirements
    };
}

/**
 * Validate aircraft state transition
 * @param {string} currentState - Current operation state
 * @param {string} newState - Desired new state
 * @param {Object} aircraft - Aircraft object
 * @returns {Object} Validation result {isValid, violations}
 */
export function validateStateTransition(currentState, newState, aircraft) {
    const violations = [];
    
    // Define valid state transitions
    const validTransitions = {
        'parked': ['taxi_to_runway'],
        'taxi_to_runway': ['takeoff'],
        'takeoff': ['climb', 'cruise'],
        'climb': ['cruise'],
        'cruise': ['approach', 'pattern'],
        'pattern': ['approach', 'cruise'],
        'approach': ['landing'],
        'landing': ['taxi_to_parking'],
        'taxi_to_parking': ['parked']
    };
    
    // Check if transition is allowed
    const allowedNextStates = validTransitions[currentState] || [];
    if (!allowedNextStates.includes(newState)) {
        violations.push(`invalid_transition_${currentState}_to_${newState}`);
    }
    
    // State-specific validations
    switch (newState) {
        case 'taxi_to_runway':
            const taxiValidation = validateTaxiRequirements(aircraft, 'toRunway');
            if (!taxiValidation.isValid) {
                violations.push(...taxiValidation.violations);
            }
            break;
            
        case 'takeoff':
            const takeoffValidation = validateTakeoffRequirements(aircraft);
            if (!takeoffValidation.isValid) {
                violations.push(...takeoffValidation.violations);
            }
            break;
            
        case 'landing':
            const landingValidation = validateLandingRequirements(aircraft);
            if (!landingValidation.isValid) {
                violations.push(...landingValidation.violations);
            }
            break;
    }
    
    return {
        isValid: violations.length === 0,
        violations
    };
}

/**
 * Validate runway usage
 * @param {string} operation - 'takeoff' or 'landing'
 * @param {Object} aircraft - Aircraft requesting runway
 * @param {Array} [otherAircraft] - Other aircraft in the area
 * @returns {Object} Validation result {isValid, violations, conflicts}
 */
export function validateRunwayUsage(operation, aircraft, otherAircraft = []) {
    const violations = [];
    const conflicts = [];
    
    // Check for runway conflicts with other aircraft
    for (const other of otherAircraft) {
        if (other === aircraft) continue;
        
        // Check if other aircraft is on runway
        if (other.position && isOnRunway(other.position)) {
            conflicts.push({
                type: 'runway_occupied',
                aircraft: other,
                operation: 'unknown'
            });
        }
        
        // Check if other aircraft is in approach/departure paths
        if (other.position && isAirborne(other.position, other.type)) {
            const runway = configManager.getRunwayConfig();
            const approachDistance = runway.approachDistance || 150;
            
            // Simplified conflict detection
            if (Math.abs(other.position.x) < approachDistance &&
                Math.abs(other.position.z) < 50) {
                conflicts.push({
                    type: 'approach_conflict',
                    aircraft: other,
                    operation: 'unknown'
                });
            }
        }
    }
    
    if (conflicts.length > 0) {
        violations.push('runway_conflict');
    }
    
    return {
        isValid: violations.length === 0,
        violations,
        conflicts
    };
}

/**
 * Validate ground vehicle operation
 * @param {Object} vehicle - Ground vehicle object
 * @param {string} operation - Operation type
 * @returns {Object} Validation result {isValid, violations}
 */
export function validateGroundVehicleOperation(vehicle, operation) {
    const violations = [];
    
    if (!vehicle) {
        violations.push('invalid_vehicle');
        return { isValid: false, violations };
    }
    
    // Check vehicle availability
    if (!vehicle.isAvailable()) {
        violations.push('vehicle_not_available');
    }
    
    // Check vehicle position
    if (!vehicle.position) {
        violations.push('vehicle_missing_position');
    }
    
    // Operation-specific validations
    switch (operation) {
        case 'pushback':
            if (vehicle.type !== 'pushback_tug') {
                violations.push('wrong_vehicle_type');
            }
            break;
            
        case 'towing':
            if (!['pushback_tug', 'tow_tractor'].includes(vehicle.type)) {
                violations.push('wrong_vehicle_type');
            }
            break;
    }
    
    return {
        isValid: violations.length === 0,
        violations
    };
}

/**
 * Validate flight plan
 * @param {Object} flightPlan - Flight plan object
 * @param {string} aircraftType - Aircraft type
 * @returns {Object} Validation result {isValid, violations, warnings}
 */
export function validateFlightPlan(flightPlan, aircraftType) {
    const violations = [];
    const warnings = [];
    
    if (!flightPlan) {
        violations.push('missing_flight_plan');
        return { isValid: false, violations, warnings };
    }
    
    // Check required properties
    if (!flightPlan.phases || !Array.isArray(flightPlan.phases)) {
        violations.push('missing_phases');
    }
    
    if (flightPlan.phases && flightPlan.phases.length === 0) {
        violations.push('empty_phases');
    }
    
    // Validate each phase
    if (flightPlan.phases) {
        for (let i = 0; i < flightPlan.phases.length; i++) {
            const phase = flightPlan.phases[i];
            
            if (!phase.name) {
                violations.push(`phase_${i}_missing_name`);
            }
            
            // Check phase sequence logic
            if (i > 0) {
                const prevPhase = flightPlan.phases[i - 1];
                const transition = validateStateTransition(prevPhase.name, phase.name, { type: aircraftType });
                if (!transition.isValid) {
                    warnings.push(`questionable_transition_${i}`);
                }
            }
        }
    }
    
    return {
        isValid: violations.length === 0,
        violations,
        warnings
    };
}

/**
 * Validate operation timing
 * @param {string} operation - Operation name
 * @param {number} duration - Planned duration in milliseconds
 * @param {string} aircraftType - Aircraft type
 * @returns {Object} Validation result {isValid, violations, recommendations}
 */
export function validateOperationTiming(operation, duration, aircraftType) {
    const violations = [];
    const recommendations = [];
    
    const timingConfig = configManager.getTimingConfig(operation);
    if (!timingConfig) {
        violations.push('unknown_operation_timing');
        return { isValid: false, violations, recommendations };
    }
    
    // Check minimum/maximum durations
    if (timingConfig.minDuration && duration < timingConfig.minDuration) {
        violations.push('duration_too_short');
        recommendations.push(`minimum_duration_${timingConfig.minDuration}ms`);
    }
    
    if (timingConfig.maxDuration && duration > timingConfig.maxDuration) {
        violations.push('duration_too_long');
        recommendations.push(`maximum_duration_${timingConfig.maxDuration}ms`);
    }
    
    // Aircraft-specific timing validations
    const aircraftConfig = configManager.getAircraftConfig(aircraftType);
    if (aircraftConfig && operation === 'taxi') {
        const expectedTaxiTime = calculateExpectedTaxiTime(aircraftType);
        if (duration > expectedTaxiTime * 3) {
            warnings.push('taxi_duration_excessive');
        }
    }
    
    return {
        isValid: violations.length === 0,
        violations,
        recommendations
    };
}

/**
 * Calculate expected taxi time for aircraft type
 * @private
 */
function calculateExpectedTaxiTime(aircraftType) {
    const route = configManager.getTaxiRoute(aircraftType, 'toRunway');
    const config = configManager.getAircraftConfig(aircraftType);
    
    if (!route || !config) return 60000; // Default 1 minute
    
    // Rough calculation based on route length and taxi speed
    let totalDistance = 0;
    for (let i = 1; i < route.length; i++) {
        const dx = route[i].x - route[i-1].x;
        const dz = route[i].z - route[i-1].z;
        totalDistance += Math.sqrt(dx * dx + dz * dz);
    }
    
    const taxiSpeed = config.taxiSpeed || 3.0;
    return (totalDistance / taxiSpeed) * 1000; // Convert to milliseconds
}

/**
 * Get validation summary for operation
 * @param {string} operation - Operation name
 * @param {Object} aircraft - Aircraft object
 * @param {Object} [context] - Additional context
 * @returns {Object} Complete validation summary
 */
export function getOperationValidationSummary(operation, aircraft, context = {}) {
    const summary = {
        operation,
        aircraftId: aircraft.id || aircraft.type,
        isValid: true,
        violations: [],
        requirements: [],
        warnings: [],
        recommendations: []
    };
    
    // Run appropriate validations based on operation
    switch (operation) {
        case 'taxi':
            const taxiValidation = validateTaxiRequirements(aircraft, context.direction || 'toRunway');
            Object.assign(summary, taxiValidation);
            break;
            
        case 'takeoff':
            const takeoffValidation = validateTakeoffRequirements(aircraft);
            Object.assign(summary, takeoffValidation);
            break;
            
        case 'landing':
            const landingValidation = validateLandingRequirements(aircraft);
            Object.assign(summary, landingValidation);
            break;
    }
    
    // Add runway validation if applicable
    if (['takeoff', 'landing'].includes(operation)) {
        const runwayValidation = validateRunwayUsage(operation, aircraft, context.otherAircraft);
        if (!runwayValidation.isValid) {
            summary.isValid = false;
            summary.violations.push(...runwayValidation.violations);
        }
    }
    
    return summary;
}