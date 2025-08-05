# Flight Simulator Plus

A comprehensive 3D flight simulation environment built with Three.js featuring multiple aircraft types, realistic airport operations, and immersive flight controls.

## Features

### 🌍 **Expansive Airport Environment**
- **Large airfield** with grass terrain and surrounding hills
- **Professional runway system** with proper markings and lighting
- **Dedicated parking areas** for different aircraft types:
  - General Aviation area (Cessna)
  - Military apron (Fighter jets)
  - Commercial terminal gates (Airliners)
  - Cargo freight area (Cargo planes)
  - Helicopter helipad with landing skid markings
- **Realistic buildings** including control tower and hangars
- **World boundaries** with visual grid markers

### ✈️ **Aircraft Fleet (5 Distinct Aircraft)**
1. **Cessna (General Aviation)**
   - Small civilian aircraft with spinning propeller
   - Compact parking in GA area
   
2. **Fighter Jet (Military)**
   - High-performance military aircraft
   - Sleek design with afterburner effects
   
3. **Airliner (Commercial)**
   - Large passenger aircraft with realistic proportions
   - Wide-body design for commercial operations
   
4. **Cargo Plane (Freight)**
   - Heavy freight aircraft with twin propellers
   - Large cargo bay representation
   
5. **Helicopter**
   - Rotorcraft with animated main and tail rotors
   - Vertical takeoff and landing capabilities

### 🎮 **Dual Control Modes**

#### 👤 **Walking Mode**
- **WASD/Arrow keys**: Character movement
- **Mouse**: Look around with realistic first-person view
- **E key**: Interact with aircraft and buildings
- **Third-person view**: Animated character model
- **Hill climbing**: Character can walk up terrain
- **Collision detection**: Solid barriers with hangars

#### 🛩️ **Flight Simulation Mode**
- **Aircraft-specific controls**:
  - **Fixed-wing**: W/S (pitch), A/D (yaw), Space/Shift (throttle)
  - **Helicopter**: W/S (vertical), A/D (yaw), Space/Shift (throttle)
- **Realistic physics**:
  - Gravity effects for fixed-wing aircraft
  - Speed-dependent control authority
  - Lift simulation and stall characteristics
- **Third-person camera**: View entire aircraft from behind/above
- **Collision avoidance**: Aircraft cannot pass through terrain or buildings

### 🏗️ **Air Traffic Control System**
- **Control tower access**: Enter with E key for ATC operations
- **Aircraft dispatch**: Send aircraft on automated flights
- **Recall system**: Bring aircraft back to airport
- **Toggle controls**: Number keys 1-5 dispatch/recall specific aircraft
- **Automated flight procedures**:
  - **Fixed-wing**: Taxi → Runway → Takeoff → Cruise → Return → Land → Park
  - **Helicopter**: Vertical takeoff → Cruise → Return → Hover → Land

### 🛬 **Realistic Airport Operations**
- **Proper taxi procedures**: Aircraft follow designated taxiways
- **Runway operations**: Aligned takeoffs and landings
- **Ground support**: Realistic approach patterns and glide slopes
- **Aircraft separation**: Organized parking and traffic flow
- **Professional markings**: Yellow taxi lines and parking indicators

### 🎨 **Visual Features**
- **Dynamic lighting**: Directional sunlight with shadows
- **Animated components**: Spinning propellers and rotors
- **Terrain variety**: Grass fields with realistic hill formations
- **UI overlays**: Flight information and control instructions
- **Debug information**: Speed, altitude, and control authority display

## Controls

### Walking Mode
- **W/A/S/D** or **Arrow Keys**: Move character
- **Mouse**: Look around
- **Space**: Move up
- **Shift**: Move down
- **E**: Interact (enter aircraft, access control tower)

### Flight Mode
#### Fixed-Wing Aircraft (Cessna, Fighter, Airliner, Cargo)
- **W/S**: Pitch up/down
- **A/D**: Yaw left/right
- **Space**: Increase throttle
- **Shift**: Decrease throttle
- **E**: Exit aircraft

#### Helicopter
- **W/S**: Vertical up/down
- **A/D**: Yaw left/right
- **Space**: Increase throttle
- **Shift**: Decrease throttle
- **E**: Exit aircraft

### Air Traffic Control
- **E**: Enter/exit control tower
- **1-5**: Toggle dispatch/recall for aircraft 1-5
- **Mouse**: Look around in tower

## Technical Implementation

### Built With
- **Three.js**: 3D graphics and rendering
- **JavaScript**: Core simulation logic
- **HTML5**: Web-based platform
- **CSS3**: User interface styling

### Key Systems
- **Physics simulation**: Gravity, lift, and momentum
- **Collision detection**: Terrain, buildings, and boundaries
- **State management**: Aircraft status and flight phases
- **Path finding**: Automated taxi and flight routes
- **Camera system**: Smooth transitions between view modes
- **Animation engine**: Rotating parts and character movement

### Performance Features
- **Efficient rendering**: Optimized Three.js scene management
- **Boundary constraints**: Prevents infinite world exploration
- **Memory management**: Proper cleanup of automated flights
- **Responsive controls**: Low-latency input handling

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DJOrsher/flight-simulator-plus.git
   ```

2. Navigate to the project directory:
   ```bash
   cd flight-simulator-plus
   ```

3. Open `index.html` in a modern web browser

   **Note**: Due to CORS restrictions, some browsers may require serving the files through a local server. You can use:
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```

4. Navigate to `http://localhost:8000` in your browser

## Browser Compatibility

- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

Requires a browser with WebGL support for 3D rendering.

## Controls Reference

| Action | Walking Mode | Flight Mode (Fixed-wing) | Flight Mode (Helicopter) |
|--------|--------------|-------------------------|-------------------------|
| Move Forward | W | Pitch Up | Vertical Up |
| Move Backward | S | Pitch Down | Vertical Down |
| Move Left | A | Yaw Left | Yaw Left |
| Move Right | D | Yaw Right | Yaw Right |
| Throttle Up | - | Space | Space |
| Throttle Down | - | Shift | Shift |
| Interact/Exit | E | E | E |
| Look Around | Mouse | Mouse | Mouse |

## Features Overview

### 🎯 **Simulation Realism**
- Accurate flight physics and aircraft behavior
- Realistic airport layout and procedures
- Professional air traffic control operations
- Weather and terrain interaction

### 🏆 **Achievements**
- Master all 5 aircraft types
- Complete automated flight circuits
- Explore the entire world area
- Experience both walking and flying perspectives

### 🔄 **Endless Gameplay**
- Infinite dispatch/recall cycles
- Explorable open world environment
- Multiple aircraft to master
- Realistic aviation procedures to learn

## Contributing

This project welcomes contributions! Whether you're interested in:
- Adding new aircraft types
- Implementing weather systems
- Enhancing graphics and effects
- Improving flight physics
- Expanding the world environment

Please feel free to open issues and submit pull requests.

## License

MIT License - Feel free to use this project for educational or personal purposes.

## Acknowledgments

- Three.js community for excellent 3D web graphics
- Aviation community for realistic flight behavior references
- Flight simulation enthusiasts for inspiration and feedback

---

**Ready for takeoff? Open index.html and start your aviation adventure!** ✈️🚁