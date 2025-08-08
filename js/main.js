/**
 * Flight Simulator Entry Point
 * Uses the complete modular Engine architecture
 */

// Import the main Engine
import { Engine } from './src/core/Engine.js';

// Global engine instance
let engine = null;

/**
 * Initialize the Flight Simulator using the complete Engine architecture
 */
async function initializeSimulator() {
    try {
        console.log('Initializing Flight Simulator with modular Engine architecture...');
        
        // Verify Three.js is loaded
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js is not loaded');
        }
        
        // Create and initialize the engine
        engine = new Engine();
        await engine.init();
        
        console.log('✅ Flight Simulator initialized successfully!');
        console.log('📋 Available modes: Walking, Flight, Control Tower');
        console.log('🎮 Use WASD to move, E to interact, Click to lock mouse');
        
        // Start the engine
        engine.start();
        
    } catch (error) {
        console.error('❌ Failed to initialize Flight Simulator:', error);
        
        // Show error in the UI
        const infoElement = document.getElementById('info');
        if (infoElement) {
            infoElement.innerHTML = `
                <h3 class="error">Engine Initialization Failed</h3>
                <p>Error: ${error.message}</p>
                <p><strong>Possible solutions:</strong></p>
                <ul>
                    <li>Ensure all module files are present</li>
                    <li>Check browser console for specific errors</li>
                    <li>Verify Three.js is loaded correctly</li>
                    <li>Try refreshing the page</li>
                </ul>
                <p class="warning">The modular engine could not start properly.</p>
            `;
        }
    }
}

/**
 * Handle window resize events
 */
function handleWindowResize() {
    if (engine) {
        engine.handleResize();
    }
}

/**
 * Clean up resources when page unloads
 */
function handlePageUnload() {
    if (engine) {
        console.log('Cleaning up engine resources...');
        engine.dispose();
    }
}

// Event listeners
window.addEventListener('load', initializeSimulator);
window.addEventListener('resize', handleWindowResize);
window.addEventListener('beforeunload', handlePageUnload);

// Expose engine to global scope for debugging
window.flightSimulatorEngine = () => engine;

console.log('🚀 Flight Simulator main.js loaded - waiting for page load...');