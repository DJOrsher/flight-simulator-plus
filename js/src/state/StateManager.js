/**
 * StateManager - Single source of truth for aircraft state
 * Single Responsibility: State storage and change notification
 * NO business logic, NO calculations, ONLY state management
 */

import { eventBus } from '../events/EventBus.js';

export class StateManager {
    constructor() {
        this.aircraftStates = new Map();
        this.stateHistory = new Map();
        this.maxHistoryPerAircraft = 100;
    }

    /**
     * Set aircraft state
     * @param {string} aircraftId - Aircraft identifier
     * @param {Object} newState - New state object
     */
    setState(aircraftId, newState) {
        const oldState = this.aircraftStates.get(aircraftId) || null;
        const timestamp = Date.now();
        
        // Store new state
        this.aircraftStates.set(aircraftId, {
            ...newState,
            timestamp,
            aircraftId
        });

        // Record state change in history
        this.recordStateChange(aircraftId, oldState, newState, timestamp);

        // Emit state change event
        eventBus.emit('aircraft.state.changed', {
            aircraftId,
            oldState,
            newState,
            timestamp
        });
    }

    /**
     * Get current aircraft state
     * @param {string} aircraftId - Aircraft identifier
     * @returns {Object|null} Current state or null
     */
    getState(aircraftId) {
        return this.aircraftStates.get(aircraftId) || null;
    }

    /**
     * Get all aircraft states
     * @returns {Map} All aircraft states
     */
    getAllStates() {
        return new Map(this.aircraftStates);
    }

    /**
     * Update specific state property
     * @param {string} aircraftId - Aircraft identifier
     * @param {string} property - Property name
     * @param {*} value - Property value
     */
    updateProperty(aircraftId, property, value) {
        const currentState = this.getState(aircraftId) || {};
        this.setState(aircraftId, {
            ...currentState,
            [property]: value
        });
    }

    /**
     * Remove aircraft from state management
     * @param {string} aircraftId - Aircraft identifier
     */
    removeAircraft(aircraftId) {
        const oldState = this.aircraftStates.get(aircraftId);
        
        this.aircraftStates.delete(aircraftId);
        this.stateHistory.delete(aircraftId);

        eventBus.emit('aircraft.removed', {
            aircraftId,
            lastState: oldState
        });
    }

    /**
     * Check if aircraft exists in state
     * @param {string} aircraftId - Aircraft identifier
     * @returns {boolean} True if aircraft exists
     */
    hasAircraft(aircraftId) {
        return this.aircraftStates.has(aircraftId);
    }

    /**
     * Get aircraft IDs by current operation
     * @param {string} operation - Operation name (e.g., 'taxi', 'takeoff')
     * @returns {Array} Aircraft IDs
     */
    getAircraftByOperation(operation) {
        const aircraftIds = [];
        for (const [aircraftId, state] of this.aircraftStates) {
            if (state.operation === operation) {
                aircraftIds.push(aircraftId);
            }
        }
        return aircraftIds;
    }

    /**
     * Get aircraft IDs by state property
     * @param {string} property - Property name
     * @param {*} value - Property value
     * @returns {Array} Aircraft IDs
     */
    getAircraftByProperty(property, value) {
        const aircraftIds = [];
        for (const [aircraftId, state] of this.aircraftStates) {
            if (state[property] === value) {
                aircraftIds.push(aircraftId);
            }
        }
        return aircraftIds;
    }

    /**
     * Get state history for aircraft
     * @param {string} aircraftId - Aircraft identifier
     * @param {number} [limit] - Maximum number of history entries
     * @returns {Array} State history
     */
    getStateHistory(aircraftId, limit = null) {
        const history = this.stateHistory.get(aircraftId) || [];
        if (limit) {
            return history.slice(-limit);
        }
        return [...history];
    }

    /**
     * Get last state change for aircraft
     * @param {string} aircraftId - Aircraft identifier
     * @returns {Object|null} Last state change
     */
    getLastStateChange(aircraftId) {
        const history = this.stateHistory.get(aircraftId) || [];
        return history.length > 0 ? history[history.length - 1] : null;
    }

    /**
     * Clear all states (for testing/reset)
     */
    clearAll() {
        const aircraftIds = Array.from(this.aircraftStates.keys());
        
        this.aircraftStates.clear();
        this.stateHistory.clear();

        eventBus.emit('state.cleared', { aircraftIds });
    }

    /**
     * Record state change in history
     * @private
     */
    recordStateChange(aircraftId, oldState, newState, timestamp) {
        if (!this.stateHistory.has(aircraftId)) {
            this.stateHistory.set(aircraftId, []);
        }

        const history = this.stateHistory.get(aircraftId);
        history.push({
            timestamp,
            oldState: oldState ? JSON.parse(JSON.stringify(oldState)) : null,
            newState: JSON.parse(JSON.stringify(newState))
        });

        // Limit history size
        if (history.length > this.maxHistoryPerAircraft) {
            history.shift();
        }
    }

    /**
     * Get debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            aircraftCount: this.aircraftStates.size,
            aircraftIds: Array.from(this.aircraftStates.keys()),
            totalHistoryEntries: Array.from(this.stateHistory.values())
                .reduce((total, history) => total + history.length, 0),
            statesByOperation: this.getStatesByOperation()
        };
    }

    /**
     * Get states grouped by operation
     * @private
     */
    getStatesByOperation() {
        const operations = {};
        for (const [aircraftId, state] of this.aircraftStates) {
            const operation = state.operation || 'unknown';
            if (!operations[operation]) {
                operations[operation] = [];
            }
            operations[operation].push(aircraftId);
        }
        return operations;
    }

    /**
     * Validate state structure (for development)
     * @param {Object} state - State to validate
     * @returns {boolean} True if valid
     */
    validateState(state) {
        if (!state || typeof state !== 'object') {
            return false;
        }

        // Basic required properties
        const required = ['operation', 'phase'];
        for (const prop of required) {
            if (!(prop in state)) {
                console.warn(`StateManager: Missing required property '${prop}' in state`);
                return false;
            }
        }

        return true;
    }
}

// Export singleton instance
export const stateManager = new StateManager();