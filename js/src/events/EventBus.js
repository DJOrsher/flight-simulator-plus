/**
 * EventBus - Central event communication system
 * Handles ALL inter-component communication
 * Single Responsibility: Event routing and subscription management
 */

export class EventBus {
    constructor() {
        this.listeners = new Map();
        this.eventHistory = [];
        this.isEnabled = true;
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        
        this.listeners.get(eventName).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(eventName);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    /**
     * Subscribe to an event once
     * @param {string} eventName - Event name  
     * @param {Function} callback - Callback function
     */
    once(eventName, callback) {
        const unsubscribe = this.on(eventName, (...args) => {
            unsubscribe();
            callback(...args);
        });
    }

    /**
     * Emit an event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     */
    emit(eventName, data = null) {
        if (!this.isEnabled) return;

        // Record event in history for debugging
        this.eventHistory.push({
            timestamp: Date.now(),
            eventName,
            data: JSON.parse(JSON.stringify(data)) // Deep copy for history
        });

        // Keep history limited to last 1000 events
        if (this.eventHistory.length > 1000) {
            this.eventHistory.shift();
        }

        // Call all listeners
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus: Error in listener for '${eventName}':`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} eventName - Event name
     */
    off(eventName) {
        this.listeners.delete(eventName);
    }

    /**
     * Remove all listeners
     */
    clear() {
        this.listeners.clear();
        this.eventHistory = [];
    }

    /**
     * Get event history for debugging
     * @param {string} [filterEventName] - Optional filter by event name
     * @returns {Array} Event history
     */
    getEventHistory(filterEventName = null) {
        if (filterEventName) {
            return this.eventHistory.filter(event => event.eventName === filterEventName);
        }
        return [...this.eventHistory];
    }

    /**
     * Get all registered event names
     * @returns {Array} Event names
     */
    getEventNames() {
        return Array.from(this.listeners.keys());
    }

    /**
     * Get listener count for an event
     * @param {string} eventName - Event name
     * @returns {number} Listener count
     */
    getListenerCount(eventName) {
        const callbacks = this.listeners.get(eventName);
        return callbacks ? callbacks.length : 0;
    }

    /**
     * Enable/disable event emission (for testing)
     * @param {boolean} enabled - Whether to enable events
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    /**
     * Get debugging info
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            totalEvents: this.eventHistory.length,
            registeredEvents: this.getEventNames(),
            listenerCounts: Object.fromEntries(
                this.getEventNames().map(name => [name, this.getListenerCount(name)])
            ),
            recentEvents: this.eventHistory.slice(-10)
        };
    }
}

// Export singleton instance
export const eventBus = new EventBus();