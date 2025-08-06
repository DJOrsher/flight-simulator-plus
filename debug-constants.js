// Test Constants.js loading
import { COLORS, AIRCRAFT_SPECS, WORLD_BOUNDS } from './js/src/utils/Constants.js';

console.log('COLORS:', typeof COLORS, Object.keys(COLORS || {}));
console.log('AIRCRAFT_SPECS:', typeof AIRCRAFT_SPECS);
console.log('WORLD_BOUNDS:', typeof WORLD_BOUNDS);

export { COLORS, AIRCRAFT_SPECS, WORLD_BOUNDS };