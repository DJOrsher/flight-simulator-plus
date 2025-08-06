/**
 * Walking UI Module
 * Handles walking mode user interface
 */

export class WalkingUI {
    constructor() {
        this.characterData = {};
        this.nearbyObjects = [];
    }
    
    /**
     * Update character position data
     * @param {Object} data - Character data
     */
    updatePosition(data) {
        this.characterData = { ...data };
    }
    
    /**
     * Update nearby objects
     * @param {Array} objects - Array of nearby interactive objects
     */
    updateNearbyObjects(objects) {
        this.nearbyObjects = objects || [];
    }
    
    /**
     * Generate walking information display
     * @param {Object} data - Walking data
     * @returns {string} HTML content
     */
    generateWalkingInfo(data = {}) {
        const character = data.character || this.characterData;
        const position = data.position || character.position || { x: 0, y: 0, z: 5 };
        const nearbyCount = this.nearbyObjects.length;
        
        return `
            <h3>🚶 Walking Mode</h3>
            <div style="margin-top: 10px;">
                <div><strong>Position:</strong> ${Math.round(position.x)}, ${Math.round(position.z)}</div>
                <div><strong>Ground Level:</strong> ${Math.round(position.y)} ft</div>
                <div><strong>Nearby Objects:</strong> ${nearbyCount}</div>
            </div>
            
            ${this.generateNearbyObjectsInfo()}
            ${this.generateEnvironmentInfo(position)}
            
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #444;">
                <div style="font-size: 12px; opacity: 0.8;">
                    Move around to explore the airfield and interact with aircraft
                </div>
            </div>
        `;
    }
    
    /**
     * Generate walking controls help
     * @returns {string} HTML content
     */
    generateWalkingControls() {
        return `
            <h4>🎮 Walking Controls</h4>
            <div>
                <div><strong>WASD:</strong> Move Character</div>
                <div><strong>Arrow Keys:</strong> Alternative Movement</div>
                <div><strong>Mouse:</strong> Look Around</div>
                <div><strong>E:</strong> Interact with Aircraft/Buildings</div>
            </div>
            <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">
                Click to enable mouse look
            </div>
        `;
    }
    
    /**
     * Generate nearby objects information
     * @returns {string} HTML content
     */
    generateNearbyObjectsInfo() {
        if (this.nearbyObjects.length === 0) {
            return '';
        }
        
        const objectsList = this.nearbyObjects.map(obj => {
            const distance = Math.round(obj.distance || 0);
            const type = this.formatObjectType(obj.type);
            const interaction = obj.canInteract ? '✅ Press E' : '🔍 Explore';
            
            return `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 6px; margin: 4px 0; border-radius: 4px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span><strong>${type}</strong></span>
                        <span>${distance}m</span>
                    </div>
                    <div style="font-size: 11px; opacity: 0.8;">${interaction}</div>
                </div>
            `;
        }).join('');
        
        return `
            <div style="margin-top: 10px;">
                <div style="font-size: 13px; margin-bottom: 5px;"><strong>Nearby:</strong></div>
                ${objectsList}
            </div>
        `;
    }
    
    /**
     * Generate environment information
     * @param {Object} position - Character position
     * @returns {string} HTML content
     */
    generateEnvironmentInfo(position) {
        const location = this.determineLocation(position);
        const weather = this.getWeatherInfo();
        
        return `
            <div style="margin-top: 10px; padding: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px;">
                <div style="font-size: 12px;">
                    <div><strong>Location:</strong> ${location}</div>
                    <div><strong>Weather:</strong> ${weather}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Determine current location based on position
     * @param {Object} position - Character position
     * @returns {string} Location name
     */
    determineLocation(position) {
        const x = position.x;
        const z = position.z;
        
        // Check if near runway
        if (Math.abs(x) < 100 && Math.abs(z) < 8) {
            return 'Main Runway';
        }
        
        // Check if near taxiway
        if (Math.abs(x) < 90 && Math.abs(z - 15) < 5) {
            return 'Taxiway';
        }
        
        // Check parking areas
        if (x < -20 && z > 15) {
            return 'General Aviation Parking';
        }
        if (x > 20 && z > 15) {
            return 'Military Apron';
        }
        if (Math.abs(x) < 20 && z > 30) {
            return 'Commercial Gates';
        }
        
        // Check helicopter area
        if (x < -60 && z < -20) {
            return 'Helicopter Landing Pad';
        }
        
        // Check control tower area
        if (Math.abs(x + 40) < 10 && Math.abs(z + 20) < 10) {
            return 'Control Tower';
        }
        
        // Check hangars
        if (z > 50) {
            return 'Hangar Area';
        }
        
        // Default
        return 'Airfield';
    }
    
    /**
     * Get weather information
     * @returns {string} Weather description
     */
    getWeatherInfo() {
        // Simple weather simulation
        const conditions = ['Clear Skies', 'Partly Cloudy', 'Light Winds'];
        const temp = 72; // Fixed temperature for now
        const wind = Math.round(Math.random() * 10 + 5);
        
        return `${conditions[0]}, ${temp}°F, Wind ${wind}kt`;
    }
    
    /**
     * Format object type for display
     * @param {string} type - Object type
     * @returns {string} Formatted name
     */
    formatObjectType(type) {
        const typeNames = {
            cessna: '🛩️ Cessna 172',
            fighter: '✈️ Fighter Jet',
            airliner: '🛫 Airliner',
            cargo: '📦 Cargo Plane',
            helicopter: '🚁 Helicopter',
            control_tower: '🏢 Control Tower',
            hangar: '🏗️ Hangar',
            building: '🏢 Building'
        };
        
        return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }
    
    /**
     * Generate interaction prompt
     * @param {Object} object - Interactive object
     * @returns {string} HTML content
     */
    generateInteractionPrompt(object) {
        if (!object) return '';
        
        const objectName = this.formatObjectType(object.type);
        const action = this.getInteractionAction(object.type);
        
        return `
            <div style="
                position: fixed;
                bottom: 50%;
                left: 50%;
                transform: translate(-50%, 50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                text-align: center;
                z-index: 1500;
                border: 2px solid #4CAF50;
            ">
                <div style="font-size: 16px; margin-bottom: 5px;">${objectName}</div>
                <div style="font-size: 14px; opacity: 0.9;">Press <strong>E</strong> to ${action}</div>
            </div>
        `;
    }
    
    /**
     * Get interaction action text
     * @param {string} type - Object type
     * @returns {string} Action text
     */
    getInteractionAction(type) {
        const actions = {
            cessna: 'fly Cessna',
            fighter: 'fly Fighter Jet',
            airliner: 'fly Airliner',
            cargo: 'fly Cargo Plane',
            helicopter: 'fly Helicopter',
            control_tower: 'enter Control Tower',
            hangar: 'explore Hangar',
            building: 'enter Building'
        };
        
        return actions[type] || 'interact';
    }
    
    /**
     * Generate complete walking UI
     * @param {Object} data - Complete walking data
     * @returns {string} Complete HTML content
     */
    generateCompleteWalkingUI(data = {}) {
        return this.generateWalkingInfo(data);
    }
    
    /**
     * Show interaction prompt overlay
     * @param {Object} object - Interactive object
     */
    showInteractionPrompt(object) {
        // Remove existing prompt
        this.hideInteractionPrompt();
        
        const prompt = document.createElement('div');
        prompt.id = 'interaction-prompt';
        prompt.innerHTML = this.generateInteractionPrompt(object);
        document.body.appendChild(prompt);
    }
    
    /**
     * Hide interaction prompt overlay
     */
    hideInteractionPrompt() {
        const prompt = document.getElementById('interaction-prompt');
        if (prompt) {
            prompt.remove();
        }
    }
    
    /**
     * Update real-time walking data
     * @param {Object} realtimeData - Real-time data
     */
    updateRealtimeData(realtimeData) {
        this.updatePosition(realtimeData);
        
        // Update the info panel if in walking mode
        const infoElement = document.getElementById('info');
        if (infoElement && realtimeData) {
            infoElement.innerHTML = this.generateCompleteWalkingUI(realtimeData);
        }
    }
    
    /**
     * Dispose of walking UI resources
     */
    dispose() {
        this.characterData = {};
        this.nearbyObjects = [];
        this.hideInteractionPrompt();
    }
}