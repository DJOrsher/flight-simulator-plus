# Flight Simulator Architecture Documentation

## Overview

This is a professionally designed modular flight simulator built with Three.js, featuring a comprehensive architecture with multiple game modes and sophisticated systems. The project demonstrates excellent separation of concerns and modular design patterns.

## Current Architecture Status

**⚠️ CRITICAL ISSUE**: The codebase has two different implementations:
- `main.js` - Simplified implementation using only 4 modules
- `Engine.js` - Complete modular architecture with all systems integrated

**Currently Active**: `main.js` (limited functionality)
**Should Be Active**: `Engine.js` (full functionality)

## Modular Architecture Design

### 1. Core System (`/js/src/core/`)

#### Engine.js
- **Purpose**: Main orchestration and game loop management
- **Features**: Mode switching, system coordination, resource management
- **Status**: ✅ Complete but unused

#### Scene.js  
- **Purpose**: Three.js scene setup, lighting, and environment management
- **Features**: Scene initialization, lighting systems, background setup
- **Status**: ✅ Complete but unused

#### Camera.js
- **Purpose**: Multi-mode camera system 
- **Features**: Walking camera, flight camera, control tower camera
- **Modes**: 3 distinct camera modes with smooth transitions
- **Status**: ✅ Complete but unused

#### Input.js
- **Purpose**: Centralized input handling with event system
- **Features**: Keyboard, mouse, pointer lock, event callbacks
- **Status**: ✅ Complete but unused

### 2. Aircraft System (`/js/src/aircraft/`)

#### Aircraft.js
- **Purpose**: Base aircraft class with common properties
- **Features**: Position, rotation, status, animations
- **Status**: ✅ Complete and used

#### AircraftFactory.js  
- **Purpose**: Factory pattern for creating aircraft
- **Aircraft Types**: Cessna, Fighter, Airliner, Cargo, Helicopter
- **Status**: ✅ Complete and used

#### FlightPhysics.js
- **Purpose**: Realistic flight physics engine
- **Features**: Gravity, lift, thrust, banking, landing physics
- **Status**: ✅ Complete but partially used

#### FlightControls.js
- **Purpose**: Input processing and flight control logic  
- **Features**: WASD controls, throttle, aircraft-specific handling
- **Status**: ✅ Complete and used

### 3. Character System (`/js/src/character/`)

#### Character.js
- **Purpose**: Walking character 3D model and properties
- **Features**: Body, head, limbs, walking animation, visibility
- **Status**: ✅ Complete but unused (main.js has its own implementation)

#### CharacterController.js
- **Purpose**: Movement logic, mouse look, and interactions
- **Features**: WASD movement, mouse look, aircraft proximity detection
- **Status**: ✅ Complete but unused

### 4. Control Tower System (`/js/src/control-tower/`)

#### ControlTower.js
- **Purpose**: Air traffic control management
- **Features**: Aircraft dispatch, flight monitoring, tower camera mode
- **Status**: ✅ Complete but unused

#### FlightAutomation.js  
- **Purpose**: Automated flight patterns and AI
- **Features**: Takeoff sequences, landing patterns, traffic management
- **Status**: ✅ Complete but unused

#### LandingStateMachine.js
- **Purpose**: Landing procedure automation
- **Features**: Approach patterns, runway alignment, landing phases
- **Status**: ✅ Complete but unused

#### TaxiSystem.js
- **Purpose**: Ground movement and parking management  
- **Features**: Taxi routes, parking spot assignment, ground traffic
- **Status**: ✅ Complete but unused

### 5. Environment System (`/js/src/environment/`)

#### Environment.js
- **Purpose**: Complete airfield infrastructure
- **Features**: Runways, taxiways, buildings, terrain, lighting
- **Status**: ✅ Complete but unused

#### GroundSupportVehicle.js
- **Purpose**: Ground service vehicles
- **Features**: Service trucks, fuel vehicles, baggage carts
- **Status**: ✅ Complete but unused

### 6. UI System (`/js/src/ui/`)

#### UIManager.js
- **Purpose**: Centralized UI coordination  
- **Features**: Mode switching, notifications, loading states
- **Status**: ✅ Complete but unused

#### FlightUI.js
- **Purpose**: Flight mode interface
- **Features**: Aircraft status, controls, instruments
- **Status**: ✅ Complete but unused  

#### WalkingUI.js
- **Purpose**: Walking mode interface
- **Features**: Movement controls, interaction prompts
- **Status**: ✅ Complete but unused

#### ControlTowerUI.js  
- **Purpose**: Air traffic control interface
- **Features**: Flight tracking, dispatch controls, radar view
- **Status**: ✅ Complete but unused

### 7. Utilities (`/js/src/utils/`)

#### Constants.js
- **Purpose**: Comprehensive configuration management
- **Features**: World bounds, aircraft specs, physics, colors, UI messages
- **Status**: ✅ Complete and used

#### MathUtils.js
- **Purpose**: Mathematical operations and utilities
- **Features**: Vector math, distance calculations, angle utilities
- **Status**: ✅ Complete and used

#### GeometryFactory.js
- **Purpose**: Reusable 3D geometry creation
- **Features**: Common shapes, aircraft components, building elements
- **Status**: ✅ Complete but partially used

## Game Modes

### Current (main.js)
1. **Walking Mode** - Basic character movement
2. **Flight Mode** - Simple aircraft control

### Intended (Engine.js)  
1. **Walking Mode** - Full character system with proper camera
2. **Flight Mode** - Complete flight physics and controls
3. **Control Tower Mode** - Air traffic control simulation

## Integration Status

### ✅ Properly Integrated Modules (4/19)
- Constants.js
- MathUtils.js  
- AircraftFactory.js
- FlightControls.js

### ❌ Available but Unused Modules (15/19)
- Engine.js (main orchestrator)
- Scene.js (scene management)
- Camera.js (multi-mode camera)
- Input.js (centralized input)
- Character.js (character model)
- CharacterController.js (character logic)
- All Control Tower modules (4 files)
- Environment.js (world building)
- GroundSupportVehicle.js
- All UI modules (4 files)
- GeometryFactory.js (partially used)

## Critical Issues

### 1. Architecture Disconnect
- Two parallel implementations exist
- main.js (currently used) vs Engine.js (intended)
- Massive code duplication
- User missing 80% of intended features

### 2. Incomplete Migration
- Refactoring appears 25% complete
- main.js should be ~50 lines, currently 501 lines
- Most modular components created but not integrated

### 3. Feature Disparity  
- Engine.js: 3 game modes, full automation, professional UI
- main.js: 2 basic modes, inline implementations, basic UI

## Recommended Fixes

### Immediate (High Priority)
1. **Switch to Engine.js architecture**
2. **Update index.html entry point**  
3. **Remove duplicate code from main.js**

### Secondary (Medium Priority)
1. **Test all modular integrations**
2. **Verify UI transitions work correctly**
3. **Enable control tower mode**

### Future (Low Priority)
1. **Add new aircraft types**
2. **Expand automation features**
3. **Implement multiplayer support**

## File Structure
```
js/
├── main.js                    # Current entry (simplified)
├── src/
│   ├── core/                  # Core systems (4 files)
│   ├── aircraft/              # Aircraft systems (4 files)  
│   ├── character/             # Character systems (2 files)
│   ├── control-tower/         # ATC systems (4 files)
│   ├── environment/           # World systems (2 files)
│   ├── ui/                    # Interface systems (4 files)
│   └── utils/                 # Utilities (3 files)
```

## Development Guidelines

### When Adding Features
1. **Follow modular architecture** - add to appropriate module
2. **Use Engine.js integration** - don't modify main.js
3. **Update Constants.js** for configuration changes
4. **Use GeometryFactory** for reusable 3D elements

### When Debugging
1. **Check module integration** in Engine.js first
2. **Verify Constants.js** for configuration issues
3. **Use console.log** in modular components, not main.js
4. **Test with Engine.js architecture**, not main.js

### Navigation Tips
- **Entry Point**: `js/src/core/Engine.js` (intended) vs `js/main.js` (current)
- **Configuration**: `js/src/utils/Constants.js`
- **Math Operations**: `js/src/utils/MathUtils.js`
- **Aircraft Creation**: `js/src/aircraft/AircraftFactory.js`
- **Character Logic**: `js/src/character/CharacterController.js`
- **UI Management**: `js/src/ui/UIManager.js`

---

**Last Updated**: August 2025
**Status**: Architecture analysis complete, integration pending