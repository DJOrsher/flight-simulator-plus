/**
 * TaxiStateMachine - State machine for taxi operations
 * Single Responsibility: Taxi state transitions and validation
 */

import { eventBus } from '../events/EventBus.js';
import { stateManager } from '../state/StateManager.js';

export class TaxiStateMachine {
    constructor(aircraftId) {
        this.aircraftId = aircraftId;
        this.states = [
            'idle',
            'requesting_vehicle',
            'vehicle_dispatched', 
            'being_pushed',
            'independent_taxi',
            'complete',
            'error'
        ];
        this.currentState = 'idle';
        this.previousState = null;
    }

    /**
     * Check if transition is valid
     * @param {string} newState - Target state
     * @returns {boolean} True if transition is valid
     */
    isValidTransition(newState) {
        const validTransitions = {
            'idle': ['requesting_vehicle'],
            'requesting_vehicle': ['vehicle_dispatched', 'independent_taxi', 'error'],
            'vehicle_dispatched': ['being_pushed', 'independent_taxi', 'error'],
            'being_pushed': ['independent_taxi', 'error'],
            'independent_taxi': ['complete', 'error'],
            'complete': ['idle'],
            'error': ['idle']
        };

        const allowedStates = validTransitions[this.currentState] || [];
        return allowedStates.includes(newState);
    }

    /**
     * Transition to new state
     * @param {string} newState - Target state
     * @param {Object} [context] - Additional context data
     */
    transition(newState, context = {}) {
        if (!this.isValidTransition(newState)) {
            console.error(`TaxiStateMachine: Invalid transition from ${this.currentState} to ${newState} for aircraft ${this.aircraftId}`);
            this.transition('error', { reason: 'invalid_transition', attempted: newState });
            return;
        }

        this.previousState = this.currentState;
        this.currentState = newState;

        // Update state manager
        stateManager.setState(this.aircraftId, {
            operation: 'taxi',
            phase: this.currentState,
            timestamp: Date.now(),
            ...context
        });

        // Emit state change event
        eventBus.emit('taxi.state.changed', {
            aircraftId: this.aircraftId,
            previousState: this.previousState,
            currentState: this.currentState,
            context
        });

        console.log(`🚖 TAXI STATE: ${this.aircraftId} ${this.previousState} → ${this.currentState}`);
    }

    /**
     * Get current state
     * @returns {string} Current state
     */
    getState() {
        return this.currentState;
    }

    /**
     * Reset to idle state
     */
    reset() {
        this.transition('idle', { reason: 'reset' });
    }

    /**
     * Handle error state
     * @param {string} reason - Error reason
     * @param {Object} [details] - Error details
     */
    error(reason, details = {}) {
        this.transition('error', { reason, details });
    }

    /**
     * Check if taxi operation is complete
     * @returns {boolean} True if complete
     */
    isComplete() {
        return this.currentState === 'complete';
    }

    /**
     * Check if taxi operation has error
     * @returns {boolean} True if in error state
     */
    hasError() {
        return this.currentState === 'error';
    }

    /**
     * Get state history from state manager
     * @returns {Array} State history
     */
    getHistory() {
        return stateManager.getStateHistory(this.aircraftId);
    }
}