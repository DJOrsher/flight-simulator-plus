/**
 * TimerManager - Centralized timing and scheduling system
 * Single Responsibility: Timer management and scheduling
 * NO business logic, NO state management, ONLY timing
 */

import { eventBus } from '../events/EventBus.js';

export class TimerManager {
    constructor() {
        this.timers = new Map();
        this.intervals = new Map();
        this.timeouts = new Map();
        this.timerIdCounter = 0;
        this.isRunning = false;
        this.lastUpdateTime = 0;
    }

    /**
     * Start the timer manager
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastUpdateTime = Date.now();
        this.updateLoop();
    }

    /**
     * Stop the timer manager
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Create a new timer
     * @param {Object} options - Timer options
     * @param {number} options.duration - Timer duration in milliseconds
     * @param {Function} [options.onProgress] - Progress callback (0-1)
     * @param {Function} [options.onComplete] - Completion callback
     * @param {boolean} [options.autoStart=true] - Auto-start timer
     * @param {string} [options.name] - Timer name for debugging
     * @returns {string} Timer ID
     */
    createTimer(options) {
        const {
            duration,
            onProgress = null,
            onComplete = null,
            autoStart = true,
            name = null
        } = options;

        const timerId = `timer_${++this.timerIdCounter}`;
        const timer = {
            id: timerId,
            name,
            duration,
            startTime: null,
            pausedTime: 0,
            isRunning: false,
            isComplete: false,
            onProgress,
            onComplete,
            currentProgress: 0
        };

        this.timers.set(timerId, timer);

        if (autoStart) {
            this.startTimer(timerId);
        }

        return timerId;
    }

    /**
     * Start a timer
     * @param {string} timerId - Timer ID
     */
    startTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer || timer.isRunning || timer.isComplete) return;

        timer.startTime = Date.now() - timer.pausedTime;
        timer.isRunning = true;

        eventBus.emit('timer.started', { timerId, name: timer.name });
    }

    /**
     * Pause a timer
     * @param {string} timerId - Timer ID
     */
    pauseTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer || !timer.isRunning) return;

        timer.pausedTime = Date.now() - timer.startTime;
        timer.isRunning = false;

        eventBus.emit('timer.paused', { timerId, name: timer.name });
    }

    /**
     * Resume a paused timer
     * @param {string} timerId - Timer ID
     */
    resumeTimer(timerId) {
        this.startTimer(timerId);
    }

    /**
     * Stop and reset a timer
     * @param {string} timerId - Timer ID
     */
    stopTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer) return;

        timer.isRunning = false;
        timer.isComplete = false;
        timer.startTime = null;
        timer.pausedTime = 0;
        timer.currentProgress = 0;

        eventBus.emit('timer.stopped', { timerId, name: timer.name });
    }

    /**
     * Remove a timer
     * @param {string} timerId - Timer ID
     */
    removeTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (timer) {
            eventBus.emit('timer.removed', { timerId, name: timer.name });
            this.timers.delete(timerId);
        }
    }

    /**
     * Get timer progress (0-1)
     * @param {string} timerId - Timer ID
     * @returns {number} Progress value 0-1
     */
    getTimerProgress(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer) return 0;
        return timer.currentProgress;
    }

    /**
     * Get timer remaining time
     * @param {string} timerId - Timer ID
     * @returns {number} Remaining time in milliseconds
     */
    getTimerRemainingTime(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer) return 0;
        
        const elapsed = timer.isRunning ? Date.now() - timer.startTime : timer.pausedTime;
        return Math.max(0, timer.duration - elapsed);
    }

    /**
     * Check if timer is running
     * @param {string} timerId - Timer ID
     * @returns {boolean} True if running
     */
    isTimerRunning(timerId) {
        const timer = this.timers.get(timerId);
        return timer ? timer.isRunning : false;
    }

    /**
     * Check if timer is complete
     * @param {string} timerId - Timer ID
     * @returns {boolean} True if complete
     */
    isTimerComplete(timerId) {
        const timer = this.timers.get(timerId);
        return timer ? timer.isComplete : false;
    }

    /**
     * Create a timeout (one-time execution)
     * @param {Function} callback - Callback function
     * @param {number} delay - Delay in milliseconds
     * @param {string} [name] - Timeout name for debugging
     * @returns {string} Timeout ID
     */
    setTimeout(callback, delay, name = null) {
        const timeoutId = `timeout_${++this.timerIdCounter}`;
        const timeout = {
            id: timeoutId,
            name,
            callback,
            executeTime: Date.now() + delay,
            isExecuted: false
        };

        this.timeouts.set(timeoutId, timeout);
        return timeoutId;
    }

    /**
     * Clear a timeout
     * @param {string} timeoutId - Timeout ID
     */
    clearTimeout(timeoutId) {
        this.timeouts.delete(timeoutId);
    }

    /**
     * Create an interval (repeated execution)
     * @param {Function} callback - Callback function
     * @param {number} interval - Interval in milliseconds
     * @param {string} [name] - Interval name for debugging
     * @returns {string} Interval ID
     */
    setInterval(callback, interval, name = null) {
        const intervalId = `interval_${++this.timerIdCounter}`;
        const intervalObj = {
            id: intervalId,
            name,
            callback,
            interval,
            lastExecuteTime: Date.now(),
            isActive: true
        };

        this.intervals.set(intervalId, intervalObj);
        return intervalId;
    }

    /**
     * Clear an interval
     * @param {string} intervalId - Interval ID
     */
    clearInterval(intervalId) {
        this.intervals.delete(intervalId);
    }

    /**
     * Update all timers (called by update loop)
     * @private
     */
    updateTimers(deltaTime) {
        const currentTime = Date.now();

        // Update timers
        for (const [timerId, timer] of this.timers) {
            if (!timer.isRunning || timer.isComplete) continue;

            const elapsed = currentTime - timer.startTime;
            const progress = Math.min(elapsed / timer.duration, 1.0);
            timer.currentProgress = progress;

            // Call progress callback
            if (timer.onProgress) {
                try {
                    timer.onProgress(progress);
                } catch (error) {
                    console.error(`TimerManager: Error in progress callback for timer ${timerId}:`, error);
                }
            }

            // Check completion
            if (progress >= 1.0) {
                timer.isComplete = true;
                timer.isRunning = false;

                // Call completion callback
                if (timer.onComplete) {
                    try {
                        timer.onComplete();
                    } catch (error) {
                        console.error(`TimerManager: Error in completion callback for timer ${timerId}:`, error);
                    }
                }

                eventBus.emit('timer.completed', { timerId, name: timer.name });
            }
        }

        // Update timeouts
        for (const [timeoutId, timeout] of this.timeouts) {
            if (timeout.isExecuted) continue;

            if (currentTime >= timeout.executeTime) {
                timeout.isExecuted = true;
                
                try {
                    timeout.callback();
                } catch (error) {
                    console.error(`TimerManager: Error in timeout callback ${timeoutId}:`, error);
                }

                this.timeouts.delete(timeoutId);
            }
        }

        // Update intervals
        for (const [intervalId, interval] of this.intervals) {
            if (!interval.isActive) continue;

            if (currentTime >= interval.lastExecuteTime + interval.interval) {
                interval.lastExecuteTime = currentTime;
                
                try {
                    interval.callback();
                } catch (error) {
                    console.error(`TimerManager: Error in interval callback ${intervalId}:`, error);
                }
            }
        }
    }

    /**
     * Main update loop
     * @private
     */
    updateLoop() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;

        this.updateTimers(deltaTime);

        // Schedule next update
        requestAnimationFrame(() => this.updateLoop());
    }

    /**
     * Get all active timers info
     * @returns {Array} Timer information
     */
    getActiveTimers() {
        const timers = [];
        for (const [timerId, timer] of this.timers) {
            if (timer.isRunning) {
                timers.push({
                    id: timerId,
                    name: timer.name,
                    progress: timer.currentProgress,
                    remaining: this.getTimerRemainingTime(timerId)
                });
            }
        }
        return timers;
    }

    /**
     * Clear all timers, timeouts, and intervals
     */
    clearAll() {
        this.timers.clear();
        this.timeouts.clear();
        this.intervals.clear();
        
        eventBus.emit('timer.allCleared');
    }

    /**
     * Get debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            isRunning: this.isRunning,
            activeTimers: this.timers.size,
            activeTimeouts: this.timeouts.size,
            activeIntervals: this.intervals.size,
            runningTimers: Array.from(this.timers.values()).filter(t => t.isRunning).length,
            completedTimers: Array.from(this.timers.values()).filter(t => t.isComplete).length
        };
    }
}

// Export singleton instance
export const timerManager = new TimerManager();