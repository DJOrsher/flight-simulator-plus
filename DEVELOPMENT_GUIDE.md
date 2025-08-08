# Development Guide - Flight Simulator

## Quick Navigation

### 🚀 Getting Started
- **Entry Point**: `js/main.js` (84 lines) - Simple Engine initialization
- **Main Engine**: `js/src/core/Engine.js` (515 lines) - Complete orchestration
- **Configuration**: `js/src/utils/Constants.js` - All settings and magic numbers
- **Math Utilities**: `js/src/utils/MathUtils.js` - Vector calculations, utilities

### 🏗️ Architecture Overview
```
js/main.js → Engine.js → All Modular Systems
```

## File Organization

### Core Systems (`js/src/core/`)
| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `Engine.js` | Main orchestrator, game loop | 515 | ✅ Active |
| `Scene.js` | Three.js scene setup | ~150 | ✅ Active |
| `Camera.js` | Multi-mode camera system | ~200 | ✅ Active |
| `Input.js` | Centralized input handling | ~200 | ✅ Active |

### Aircraft Systems (`js/src/aircraft/`)
| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `Aircraft.js` | Base aircraft class | ~200 | ✅ Active |
| `AircraftFactory.js` | Creates 5 aircraft types | ~300 | ✅ Active |
| `FlightPhysics.js` | Realistic flight physics | ~400 | ✅ Active |
| `FlightControls.js` | Input → aircraft control | ~250 | ✅ Active |

### Character Systems (`js/src/character/`)
| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `Character.js` | 3D character model | ~200 | ✅ Active |
| `CharacterController.js` | Movement, interactions | ~200 | ✅ Active |

### Control Tower (`js/src/control-tower/`)
| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `ControlTower.js` | Air traffic control | ~300 | ✅ Active |
| `FlightAutomation.js` | Automated flight AI | ~400 | ✅ Active |
| `LandingStateMachine.js` | Landing procedures | ~200 | ✅ Active |
| `TaxiSystem.js` | Ground movement | ~150 | ✅ Active |

### Environment (`js/src/environment/`)
| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `Environment.js` | Complete airfield | ~500 | ✅ Active |
| `GroundSupportVehicle.js` | Service vehicles | ~150 | ✅ Active |

### UI Systems (`js/src/ui/`)
| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `UIManager.js` | UI coordination | ~200 | ✅ Active |
| `FlightUI.js` | Flight mode interface | ~150 | ✅ Active |
| `WalkingUI.js` | Walking mode interface | ~100 | ✅ Active |
| `ControlTowerUI.js` | ATC interface | ~200 | ✅ Active |

### Utilities (`js/src/utils/`)
| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `Constants.js` | All configuration | 184 | ✅ Active |
| `MathUtils.js` | Math operations | 160 | ✅ Active |
| `GeometryFactory.js` | Reusable 3D shapes | ~200 | ✅ Active |

## Development Workflows

### 🐛 Debugging Issues
1. **Check Console**: Open F12 → Console for error messages
2. **Engine Status**: Use `window.flightSimulatorEngine()` in console
3. **Module Loading**: Errors usually appear during initialization
4. **Configuration**: Check `Constants.js` for values

### ➕ Adding New Features
1. **Find Appropriate Module**: Use file organization above
2. **Check Constants**: Add configuration in `Constants.js`
3. **Use Utilities**: Leverage `MathUtils.js` and `GeometryFactory.js`
4. **Update Engine**: Add integration in `Engine.js` if needed

### ✈️ Adding New Aircraft
1. **Define Specs**: Add to `AIRCRAFT_SPECS` in `Constants.js`
2. **Update Factory**: Add creation logic in `AircraftFactory.js`
3. **Add 3D Model**: Use `GeometryFactory` for components
4. **Test Integration**: Verify in all game modes

### 🎮 Adding New Game Mode
1. **Update Engine**: Add mode to `Engine.js`
2. **Create UI**: Add UI module in `ui/`
3. **Add Camera Mode**: Update `Camera.js`
4. **Update Constants**: Add mode-specific settings

## Common Development Tasks

### Adding Aircraft Type
```javascript
// 1. Add to Constants.js
export const AIRCRAFT_SPECS = {
    // ... existing
    newType: {
        maxSpeed: 1.0,
        acceleration: 0.02,
        // ... other properties
    }
};

// 2. Add to AircraftFactory.js
case 'newType':
    return this.createNewType(x, y, z, rotation);

// 3. Implement creation method
createNewType(x, y, z, rotation) {
    // Implementation
}
```

### Adding UI Element
```javascript
// 1. Update appropriate UI module (FlightUI.js, etc.)
// 2. Use UIManager for coordination
// 3. Update constants for text/messages
```

### Modifying Physics
```javascript
// 1. Update FlightPhysics.js for flight behavior
// 2. Update PHYSICS constants in Constants.js
// 3. Test with different aircraft types
```

## Key Code Patterns

### Module Structure
```javascript
/**
 * Module Description
 * Purpose and responsibilities
 */

import { CONSTANTS } from '../utils/Constants.js';
import * as Utils from '../utils/MathUtils.js';

export class ModuleName {
    constructor(dependencies) {
        // Initialize
    }
    
    init() {
        // Setup
    }
    
    update(deltaTime) {
        // Game loop logic
    }
    
    dispose() {
        // Cleanup
    }
}
```

### Adding to Engine
```javascript
// In Engine.js constructor:
this.newSystem = null;

// In Engine.js init():
this.newSystem = new NewSystem(dependencies);
await this.newSystem.init();

// In Engine.js update():
this.newSystem.update(deltaTime);

// In Engine.js dispose():
if (this.newSystem) this.newSystem.dispose();
```

## Testing Guidelines

### Before Committing
1. **Load Test**: Refresh page, check console
2. **Mode Test**: Try all 3 game modes
3. **Aircraft Test**: Test different aircraft types
4. **UI Test**: Check all interface elements
5. **Performance**: Monitor FPS and memory

### Common Issues
- **Module Import Errors**: Check file paths
- **THREE.js Issues**: Verify Three.js is loaded
- **Constants Missing**: Add to `Constants.js`
- **Math Errors**: Use `MathUtils.js` functions

## Performance Guidelines

### Best Practices
1. **Use Object Pooling**: For frequently created objects
2. **Dispose Resources**: Call dispose() methods
3. **Limit Updates**: Use deltaTime for smooth animations
4. **Optimize Geometry**: Reuse via `GeometryFactory`

### Monitoring
- **FPS**: Should maintain 60fps
- **Memory**: Check for memory leaks
- **CPU**: Profile update loops

## Debugging Commands

### Console Commands
```javascript
// Get engine instance
const engine = window.flightSimulatorEngine();

// Check current mode
engine.currentMode

// Get character position
engine.characterController.getPosition()

// List aircraft
engine.aircraftList

// Check UI state
engine.uiManager.getCurrentMode()
```

## File Dependencies Map

```
main.js
└── Engine.js
    ├── Scene.js
    ├── Camera.js
    ├── Input.js
    ├── Character.js
    │   └── CharacterController.js
    ├── AircraftFactory.js
    │   ├── Aircraft.js
    │   └── FlightPhysics.js
    ├── Environment.js
    ├── ControlTower.js
    │   ├── FlightAutomation.js
    │   ├── LandingStateMachine.js
    │   └── TaxiSystem.js
    ├── UIManager.js
    │   ├── FlightUI.js
    │   ├── WalkingUI.js
    │   └── ControlTowerUI.js
    ├── Constants.js
    ├── MathUtils.js
    └── GeometryFactory.js
```

## Version History
- **v1.x**: Original monolithic main.js implementation
- **v2.0.0**: Complete modular Engine architecture activated

---

**Quick Start**: Open `js/src/core/Engine.js` to understand the system orchestration, then explore specific modules based on what you need to modify.