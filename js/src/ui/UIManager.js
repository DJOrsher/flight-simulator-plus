/**
 * UI Manager Module
 * Centralized management of all user interface elements
 */

import { FlightUI } from './FlightUI.js';
import { WalkingUI } from './WalkingUI.js';
import { ControlTowerUI } from './ControlTowerUI.js';

export class UIManager {
    constructor() {
        this.currentMode = 'walking';
        this.elements = {};
        
        // Initialize UI modules
        this.flightUI = new FlightUI();
        this.walkingUI = new WalkingUI();
        this.controlTowerUI = new ControlTowerUI();
        
        this.init();
    }
    
    /**
     * Initialize UI elements
     */
    init() {
        this.createInfoPanel();
        this.createControlsHelp();
        this.setupEventListeners();
        this.updateMode('walking');
    }
    
    /**
     * Create main info panel
     */
    createInfoPanel() {
        // Remove existing info element if present
        const existingInfo = document.getElementById('info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        const infoDiv = document.createElement('div');
        infoDiv.id = 'info';
        infoDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.4;
            max-width: 350px;
            z-index: 1000;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(infoDiv);
        this.elements.info = infoDiv;
    }
    
    /**
     * Create controls help panel
     */
    createControlsHelp() {
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'controls';
        controlsDiv.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 12px;
            border-radius: 6px;
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.3;
            max-width: 300px;
            z-index: 1000;
        `;
        
        document.body.appendChild(controlsDiv);
        this.elements.controls = controlsDiv;
    }
    
    /**
     * Setup event listeners for UI updates
     */
    setupEventListeners() {
        // Listen for control tower updates
        document.addEventListener('controltower-update', (event) => {
            this.controlTowerUI.updateStatus(event.detail);
        });
        
        // Listen for aircraft updates
        document.addEventListener('aircraft-update', (event) => {
            this.flightUI.updateAircraftInfo(event.detail);
        });
        
        // Listen for character updates
        document.addEventListener('character-update', (event) => {
            this.walkingUI.updatePosition(event.detail);
        });
    }
    
    /**
     * Update UI mode
     * @param {string} mode - UI mode ('walking', 'flight', 'tower')
     * @param {Object} data - Mode-specific data
     */
    updateMode(mode, data = {}) {
        this.currentMode = mode;
        
        switch (mode) {
            case 'walking':
                this.showWalkingUI(data);
                break;
            case 'flight':
                this.showFlightUI(data);
                break;
            case 'tower':
                this.showControlTowerUI(data);
                break;
            default:
                console.warn(`Unknown UI mode: ${mode}`);
        }
    }
    
    /**
     * Show walking mode UI
     * @param {Object} data - Walking data
     */
    showWalkingUI(data) {
        const info = this.walkingUI.generateWalkingInfo(data);
        const controls = this.walkingUI.generateWalkingControls();
        
        this.elements.info.innerHTML = info;
        this.elements.controls.innerHTML = controls;
    }
    
    /**
     * Show flight mode UI
     * @param {Object} data - Flight data
     */
    showFlightUI(data) {
        const info = this.flightUI.generateFlightInfo(data);
        const controls = this.flightUI.generateFlightControls(data.aircraftType);
        
        this.elements.info.innerHTML = info;
        this.elements.controls.innerHTML = controls;
    }
    
    /**
     * Show control tower UI
     * @param {Object} data - Control tower data
     */
    showControlTowerUI(data) {
        const info = this.controlTowerUI.generateTowerInfo(data);
        const controls = this.controlTowerUI.generateTowerControls();
        
        this.elements.info.innerHTML = info;
        this.elements.controls.innerHTML = controls;
    }
    
    /**
     * Update aircraft information
     * @param {Object} aircraftData - Aircraft data
     */
    updateAircraftInfo(aircraftData) {
        if (this.currentMode === 'flight') {
            this.flightUI.updateAircraftInfo(aircraftData);
            const info = this.flightUI.generateFlightInfo(aircraftData);
            this.elements.info.innerHTML = info;
        }
    }
    
    /**
     * Update character position
     * @param {Object} characterData - Character data
     */
    updateCharacterPosition(characterData) {
        if (this.currentMode === 'walking') {
            this.walkingUI.updatePosition(characterData);
            const info = this.walkingUI.generateWalkingInfo(characterData);
            this.elements.info.innerHTML = info;
        }
    }
    
    /**
     * Update control tower status
     * @param {Object} towerData - Control tower data
     */
    updateControlTowerStatus(towerData) {
        if (this.currentMode === 'tower') {
            this.controlTowerUI.updateStatus(towerData);
            const info = this.controlTowerUI.generateTowerInfo(towerData);
            this.elements.info.innerHTML = info;
        }
    }
    
    /**
     * Show notification message
     * @param {string} message - Message to show
     * @param {number} duration - Duration in ms (default: 3000)
     * @param {string} type - Message type ('info', 'success', 'warning', 'error')
     */
    showNotification(message, duration = 3000, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 25px;
            border-radius: 6px;
            font-family: 'Arial', sans-serif;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * Get notification background color based on type
     * @param {string} type - Notification type
     * @returns {string} CSS color
     */
    getNotificationColor(type) {
        const colors = {
            info: 'rgba(52, 152, 219, 0.9)',
            success: 'rgba(46, 204, 113, 0.9)',
            warning: 'rgba(241, 196, 15, 0.9)',
            error: 'rgba(231, 76, 60, 0.9)'
        };
        
        return colors[type] || colors.info;
    }
    
    /**
     * Show loading indicator
     * @param {string} message - Loading message
     */
    showLoading(message = 'Loading...') {
        const loading = document.createElement('div');
        loading.id = 'loading-indicator';
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 3000;
        `;
        
        loading.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 8px;
                text-align: center;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                "></div>
                <div style="font-size: 16px; color: #333;">${message}</div>
            </div>
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(loading);
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.remove();
        }
    }
    
    /**
     * Toggle UI visibility
     * @param {boolean} visible - Whether UI should be visible
     */
    setVisible(visible) {
        const display = visible ? 'block' : 'none';
        
        if (this.elements.info) {
            this.elements.info.style.display = display;
        }
        
        if (this.elements.controls) {
            this.elements.controls.style.display = display;
        }
    }
    
    /**
     * Get current UI mode
     * @returns {string} Current mode
     */
    getCurrentMode() {
        return this.currentMode;
    }
    
    /**
     * Dispose of UI resources
     */
    dispose() {
        // Remove UI elements
        Object.values(this.elements).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Clean up modules
        this.flightUI.dispose();
        this.walkingUI.dispose();
        this.controlTowerUI.dispose();
        
        this.elements = {};
    }
}