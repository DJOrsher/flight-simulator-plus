/**
 * Flight UI Module
 * Handles flight mode user interface
 */

export class FlightUI {
    constructor() {
        this.aircraftData = {};
    }
    
    /**
     * Update aircraft information
     * @param {Object} data - Aircraft data
     */
    updateAircraftInfo(data) {
        this.aircraftData = { ...data };
    }
    
    /**
     * Generate flight information display
     * @param {Object} data - Flight data
     * @returns {string} HTML content
     */
    generateFlightInfo(data = {}) {
        const aircraft = data.aircraft || this.aircraftData;
        const aircraftType = data.aircraftType || aircraft.type || 'Unknown';
        const position = data.position || aircraft.position || { x: 0, y: 0, z: 0 };
        const speed = data.speed || aircraft.speed || 0;
        const altitude = Math.round(position.y);
        const groundSpeed = Math.round(speed * 100); // Convert to more readable units
        
        return `
            <h3>🛩️ Flight Mode - ${this.formatAircraftType(aircraftType)}</h3>
            <div style="margin-top: 10px;">
                <div><strong>Altitude:</strong> ${altitude} ft</div>
                <div><strong>Ground Speed:</strong> ${groundSpeed} kt</div>
                <div><strong>Position:</strong> ${Math.round(position.x)}, ${Math.round(position.z)}</div>
                <div style="margin-top: 8px;">
                    <strong>Aircraft Status:</strong> 
                    <span style="color: #4CAF50;">Airborne</span>
                </div>
            </div>
            
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #444;">
                <div style="font-size: 12px; opacity: 0.8;">
                    Flight Controls: ${this.getFlightControlStatus(aircraftType)}
                </div>
            </div>
        `;
    }
    
    /**
     * Generate flight controls help
     * @param {string} aircraftType - Type of aircraft
     * @returns {string} HTML content
     */
    generateFlightControls(aircraftType = 'cessna') {
        const isHelicopter = aircraftType === 'helicopter';
        
        if (isHelicopter) {
            return `
                <h4>🚁 Helicopter Controls</h4>
                <div>
                    <div><strong>W/S:</strong> Vertical Up/Down</div>
                    <div><strong>A/D:</strong> Yaw Left/Right</div>
                    <div><strong>Space:</strong> Increase Throttle</div>
                    <div><strong>Shift:</strong> Decrease Throttle</div>
                    <div><strong>E:</strong> Exit Aircraft</div>
                </div>
                <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">
                    Mouse: Look around
                </div>
            `;
        } else {
            return `
                <h4>✈️ Aircraft Controls</h4>
                <div>
                    <div><strong>W/S:</strong> Pitch Up/Down</div>
                    <div><strong>A/D:</strong> Yaw Left/Right</div>
                    <div><strong>Space:</strong> Increase Throttle</div>
                    <div><strong>Shift:</strong> Decrease Throttle</div>
                    <div><strong>E:</strong> Exit Aircraft</div>
                </div>
                <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">
                    Mouse: Look around
                </div>
            `;
        }
    }
    
    /**
     * Format aircraft type for display
     * @param {string} type - Aircraft type
     * @returns {string} Formatted name
     */
    formatAircraftType(type) {
        const typeNames = {
            cessna: 'Cessna 172',
            fighter: 'Fighter Jet',
            airliner: 'Commercial Airliner',
            cargo: 'Cargo Aircraft',
            helicopter: 'Helicopter'
        };
        
        return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }
    
    /**
     * Get flight control status text
     * @param {string} aircraftType - Aircraft type
     * @returns {string} Status text
     */
    getFlightControlStatus(aircraftType) {
        const isHelicopter = aircraftType === 'helicopter';
        
        if (isHelicopter) {
            return 'Rotorcraft - Vertical flight capable';
        }
        
        const statusTexts = {
            cessna: 'Light aircraft - Stable flight characteristics',
            fighter: 'Military - High performance',
            airliner: 'Commercial - Heavy transport',
            cargo: 'Freight - Twin engine transport'
        };
        
        return statusTexts[aircraftType] || 'Fixed-wing aircraft';
    }
    
    /**
     * Generate flight instruments display
     * @param {Object} data - Flight data
     * @returns {string} HTML content
     */
    generateFlightInstruments(data = {}) {
        const aircraft = data.aircraft || this.aircraftData;
        const attitude = data.attitude || { pitch: 0, roll: 0, yaw: 0 };
        const throttle = data.throttle || 0;
        
        return `
            <div style="display: flex; gap: 15px; margin-top: 10px;">
                <div style="flex: 1;">
                    <div style="font-size: 12px; margin-bottom: 5px;">Attitude</div>
                    <div style="background: #333; padding: 8px; border-radius: 4px; font-size: 11px;">
                        <div>Pitch: ${Math.round(attitude.pitch * 180 / Math.PI)}°</div>
                        <div>Roll: ${Math.round(attitude.roll * 180 / Math.PI)}°</div>
                        <div>Heading: ${Math.round(attitude.yaw * 180 / Math.PI)}°</div>
                    </div>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 12px; margin-bottom: 5px;">Engine</div>
                    <div style="background: #333; padding: 8px; border-radius: 4px; font-size: 11px;">
                        <div>Throttle: ${Math.round(throttle * 100)}%</div>
                        <div style="width: 100%; height: 8px; background: #555; border-radius: 4px; margin-top: 4px;">
                            <div style="width: ${throttle * 100}%; height: 100%; background: #4CAF50; border-radius: 4px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate warning messages
     * @param {Object} data - Flight data
     * @returns {string} HTML content
     */
    generateWarnings(data = {}) {
        const warnings = [];
        const aircraft = data.aircraft || this.aircraftData;
        const position = data.position || aircraft.position || { x: 0, y: 0, z: 0 };
        const speed = data.speed || aircraft.speed || 0;
        
        // Check for various warning conditions
        if (position.y < 5) {
            warnings.push('⚠️ LOW ALTITUDE');
        }
        
        if (speed < 0.1 && position.y > 10) {
            warnings.push('⚠️ STALL WARNING');
        }
        
        if (Math.abs(position.x) > 450 || Math.abs(position.z) > 450) {
            warnings.push('⚠️ APPROACHING BOUNDARY');
        }
        
        if (warnings.length === 0) {
            return '';
        }
        
        return `
            <div style="margin-top: 10px; padding: 8px; background: rgba(255, 193, 7, 0.2); border-left: 4px solid #FFC107; border-radius: 4px;">
                ${warnings.map(warning => `<div style="color: #FFC107; font-weight: bold; font-size: 12px;">${warning}</div>`).join('')}
            </div>
        `;
    }
    
    /**
     * Generate complete flight UI
     * @param {Object} data - Complete flight data
     * @returns {string} Complete HTML content
     */
    generateCompleteFlightUI(data = {}) {
        return `
            ${this.generateFlightInfo(data)}
            ${this.generateFlightInstruments(data)}
            ${this.generateWarnings(data)}
        `;
    }
    
    /**
     * Update real-time flight data
     * @param {Object} realtimeData - Real-time data
     */
    updateRealtimeData(realtimeData) {
        // Update the info panel if in flight mode
        const infoElement = document.getElementById('info');
        if (infoElement && realtimeData) {
            infoElement.innerHTML = this.generateCompleteFlightUI(realtimeData);
        }
    }
    
    /**
     * Dispose of flight UI resources
     */
    dispose() {
        this.aircraftData = {};
    }
}