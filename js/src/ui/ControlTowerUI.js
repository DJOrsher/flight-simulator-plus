/**
 * Control Tower UI Module
 * Handles control tower mode user interface
 */

export class ControlTowerUI {
    constructor() {
        this.towerData = {};
        this.dispatchedAircraft = [];
    }
    
    /**
     * Update control tower status
     * @param {Object} data - Tower data
     */
    updateStatus(data) {
        this.towerData = { ...data };
        this.dispatchedAircraft = data.dispatched || [];
    }
    
    /**
     * Generate control tower information display
     * @param {Object} data - Tower data
     * @returns {string} HTML content
     */
    generateTowerInfo(data = {}) {
        const tower = data.tower || this.towerData;
        const isActive = data.isActive || tower.isActive || false;
        const dispatchedCount = data.dispatchedCount || tower.dispatchedCount || 0;
        const totalAircraft = data.totalAircraft || tower.totalAircraft || 0;
        
        if (!isActive) {
            return `
                <h3>🏢 Control Tower</h3>
                <div style="margin-top: 10px;">
                    <div style="color: #888;">Tower not active</div>
                    <div style="font-size: 12px; margin-top: 8px;">
                        Press E near the control tower to enter ATC mode
                    </div>
                </div>
            `;
        }
        
        return `
            <h3>🏢 Air Traffic Control</h3>
            <div style="margin-top: 10px;">
                <div><strong>Active Flights:</strong> ${dispatchedCount}/${totalAircraft}</div>
                <div><strong>ATC Status:</strong> <span style="color: #4CAF50;">Online</span></div>
            </div>
            
            ${this.generateAircraftStatus()}
            ${this.generateWeatherInfo()}
            
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #444;">
                <div style="font-size: 12px; opacity: 0.8;">
                    Use number keys 1-${totalAircraft} to dispatch/recall aircraft
                </div>
            </div>
        `;
    }
    
    /**
     * Generate control tower controls help
     * @returns {string} HTML content
     */
    generateTowerControls() {
        return `
            <h4>🎛️ ATC Controls</h4>
            <div>
                <div><strong>1-9:</strong> Dispatch/Recall Aircraft</div>
                <div><strong>Mouse:</strong> Look Around Tower</div>
                <div><strong>E:</strong> Exit Control Tower</div>
            </div>
            <div style="margin-top: 8px;">
                <div style="font-size: 11px; opacity: 0.7;">
                    Monitor aircraft status and manage air traffic
                </div>
            </div>
        `;
    }
    
    /**
     * Generate aircraft status display
     * @returns {string} HTML content
     */
    generateAircraftStatus() {
        if (this.dispatchedAircraft.length === 0) {
            return `
                <div style="margin-top: 10px; padding: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px;">
                    <div style="font-size: 12px; text-align: center; opacity: 0.8;">
                        No active flights
                    </div>
                </div>
            `;
        }
        
        const aircraftList = this.dispatchedAircraft.map(aircraft => {
            const statusColor = this.getPhaseColor(aircraft.phase);
            const progressBar = this.generateProgressBar(aircraft.progress);
            
            return `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; margin: 4px 0; border-radius: 4px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span><strong>Flight ${aircraft.index}</strong> - ${this.formatAircraftType(aircraft.type)}</span>
                        <span style="color: ${statusColor};">${this.formatPhase(aircraft.phase)}</span>
                    </div>
                    ${progressBar}
                </div>
            `;
        }).join('');
        
        return `
            <div style="margin-top: 10px;">
                <div style="font-size: 13px; margin-bottom: 5px;"><strong>Active Flights:</strong></div>
                ${aircraftList}
            </div>
        `;
    }
    
    /**
     * Generate weather information for ATC
     * @returns {string} HTML content
     */
    generateWeatherInfo() {
        // Simulate weather data for ATC
        const weather = {
            ceiling: 3000,
            visibility: 10,
            wind: { direction: 270, speed: 8 },
            altimeter: 30.12,
            temperature: 72
        };
        
        return `
            <div style="margin-top: 10px; padding: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px;">
                <div style="font-size: 12px;">
                    <div><strong>METAR:</strong></div>
                    <div style="margin-top: 4px; font-family: monospace; font-size: 10px;">
                        Wind: ${weather.wind.direction}° @ ${weather.wind.speed}kt<br>
                        Vis: ${weather.visibility}SM<br>
                        Ceiling: ${weather.ceiling}ft<br>
                        Altimeter: ${weather.altimeter}"
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate progress bar for flight phase
     * @param {number} progress - Progress percentage (0-100)
     * @returns {string} HTML content
     */
    generateProgressBar(progress) {
        const progressPercent = Math.max(0, Math.min(100, progress));
        
        return `
            <div style="width: 100%; height: 6px; background: #333; border-radius: 3px; margin-top: 4px;">
                <div style="
                    width: ${progressPercent}%; 
                    height: 100%; 
                    background: linear-gradient(90deg, #4CAF50, #8BC34A); 
                    border-radius: 3px;
                    transition: width 0.3s ease;
                "></div>
            </div>
        `;
    }
    
    /**
     * Get color for flight phase
     * @param {string} phase - Flight phase
     * @returns {string} CSS color
     */
    getPhaseColor(phase) {
        const phaseColors = {
            taxi: '#FFC107',
            takeoff: '#FF9800',
            climb: '#2196F3',
            cruise: '#4CAF50',
            pattern: '#9C27B0',
            approach: '#FF5722',
            final: '#F44336',
            landing: '#795548',
            taxi_back: '#607D8B',
            vertical_takeoff: '#FF9800',
            forward_flight: '#4CAF50',
            patrol: '#2196F3',
            return: '#9C27B0',
            hover: '#FFC107',
            complete: '#4CAF50'
        };
        
        return phaseColors[phase] || '#888';
    }
    
    /**
     * Format flight phase for display
     * @param {string} phase - Flight phase
     * @returns {string} Formatted phase name
     */
    formatPhase(phase) {
        const phaseNames = {
            taxi: 'Taxiing',
            takeoff: 'Taking Off',
            climb: 'Climbing',
            cruise: 'Cruising',
            pattern: 'Traffic Pattern',
            approach: 'Approach',
            final: 'Final Approach',
            landing: 'Landing',
            taxi_back: 'Taxi to Park',
            vertical_takeoff: 'Vertical Takeoff',
            forward_flight: 'Forward Flight',
            patrol: 'Patrol',
            return: 'Returning',
            hover: 'Hovering',
            complete: 'Complete'
        };
        
        return phaseNames[phase] || phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Format aircraft type for display
     * @param {string} type - Aircraft type
     * @returns {string} Formatted name
     */
    formatAircraftType(type) {
        const typeNames = {
            cessna: 'Cessna',
            fighter: 'Fighter',
            airliner: 'Airliner',
            cargo: 'Cargo',
            helicopter: 'Helicopter'
        };
        
        return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }
    
    /**
     * Generate runway status information
     * @returns {string} HTML content
     */
    generateRunwayStatus() {
        const runways = [
            { name: '09/27', status: 'Open', traffic: 'Light' },
            { name: 'Taxiway A', status: 'Open', traffic: 'None' }
        ];
        
        const runwayList = runways.map(runway => `
            <div style="display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px;">
                <span>${runway.name}</span>
                <span style="color: ${runway.status === 'Open' ? '#4CAF50' : '#F44336'};">
                    ${runway.status}
                </span>
            </div>
        `).join('');
        
        return `
            <div style="margin-top: 8px;">
                <div style="font-size: 12px; margin-bottom: 4px;"><strong>Runway Status:</strong></div>
                ${runwayList}
            </div>
        `;
    }
    
    /**
     * Generate emergency procedures display
     * @returns {string} HTML content
     */
    generateEmergencyInfo() {
        return `
            <div style="margin-top: 8px; padding: 6px; background: rgba(255, 193, 7, 0.2); border-left: 3px solid #FFC107; border-radius: 3px;">
                <div style="font-size: 11px; color: #FFC107;">
                    <strong>Emergency:</strong> Hold 0 for immediate recall
                </div>
            </div>
        `;
    }
    
    /**
     * Generate complete control tower UI
     * @param {Object} data - Complete tower data
     * @returns {string} Complete HTML content
     */
    generateCompleteTowerUI(data = {}) {
        return `
            ${this.generateTowerInfo(data)}
            ${this.generateRunwayStatus()}
        `;
    }
    
    /**
     * Show dispatch confirmation
     * @param {Object} aircraft - Aircraft being dispatched
     */
    showDispatchConfirmation(aircraft) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(76, 175, 80, 0.95);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        notification.textContent = `✈️ ${aircraft.type.toUpperCase()} DISPATCHED`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }
    
    /**
     * Show recall confirmation
     * @param {Object} aircraft - Aircraft being recalled
     */
    showRecallConfirmation(aircraft) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 152, 0, 0.95);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        notification.textContent = `📡 ${aircraft.type.toUpperCase()} RECALLED`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }
    
    /**
     * Update real-time tower data
     * @param {Object} realtimeData - Real-time data
     */
    updateRealtimeData(realtimeData) {
        this.updateStatus(realtimeData);
        
        // Update the info panel if in tower mode
        const infoElement = document.getElementById('info');
        if (infoElement && realtimeData) {
            infoElement.innerHTML = this.generateCompleteTowerUI(realtimeData);
        }
    }
    
    /**
     * Dispose of control tower UI resources
     */
    dispose() {
        this.towerData = {};
        this.dispatchedAircraft = [];
    }
}