# Flight Control System Refactoring Plan

## Current Problems
- Tight coupling between FlightAutomation, TaxiSystem, and Aircraft
- Duplicate state management across multiple classes
- Scattered business logic making debugging difficult
- Hard-coded values and timing throughout codebase
- No single source of truth for aircraft state

## Architecture Principles

### 1. Single Responsibility Principle
Each class/module handles ONE specific concern:
- **StateManager**: Aircraft state tracking ONLY
- **EventBus**: Event communication ONLY  
- **PositionCalculator**: Position/movement math ONLY
- **ConfigManager**: Configuration values ONLY
- **OperationControllers**: Orchestration of specific operations ONLY

### 2. Strict Decoupling
- No direct dependencies between operation controllers
- All communication through EventBus
- Shared data only through StateManager
- No cross-references between Aircraft/TaxiSystem/FlightAutomation

### 3. No Logic Duplication
- Position validation: ONE place (PositionValidator)
- Timing logic: ONE place (TimerManager) 
- Route calculation: ONE place (RouteCalculator)
- State transitions: ONE place per operation type

## New Architecture

```
Core Infrastructure:
├── EventBus (events/EventBus.js)
├── StateManager (state/StateManager.js)
├── ConfigManager (config/ConfigManager.js)
└── TimerManager (timing/TimerManager.js)

Utilities (Pure Functions):
├── PositionValidator (utils/PositionValidator.js)
├── RouteCalculator (utils/RouteCalculator.js)
├── MovementCalculator (utils/MovementCalculator.js)
└── ValidationRules (utils/ValidationRules.js)

Operation Controllers:
├── TaxiController (operations/TaxiController.js)
├── TakeoffController (operations/TakeoffController.js)
├── LandingController (operations/LandingController.js)
└── GroundOpsController (operations/GroundOpsController.js)

State Machines:
├── TaxiStateMachine (state-machines/TaxiStateMachine.js)
├── TakeoffStateMachine (state-machines/TakeoffStateMachine.js)
└── LandingStateMachine (state-machines/LandingStateMachine.js)

Debug/Monitoring:
├── OperationLogger (debug/OperationLogger.js)
├── StateInspector (debug/StateInspector.js)
└── PerformanceMonitor (debug/PerformanceMonitor.js)
```

## Responsibility Matrix

| Component | Responsibilities | NOT Responsible For |
|-----------|------------------|-------------------|
| **StateManager** | - Store current aircraft states<br>- Emit state change events<br>- Validate state transitions | - Business logic<br>- Position calculations<br>- Timing |
| **EventBus** | - Route events between components<br>- Maintain subscriber lists | - Event validation<br>- State storage<br>- Business logic |
| **TaxiController** | - Orchestrate taxi operations<br>- Handle taxi-specific business rules | - Position math<br>- Route calculation<br>- State storage |
| **PositionValidator** | - Validate positions against rules<br>- Distance calculations | - State management<br>- Event handling<br>- Timing |
| **RouteCalculator** | - Calculate waypoint routes<br>- Optimize paths | - State tracking<br>- Event emission<br>- Validation |

## Implementation Plan

### Phase 1: Core Infrastructure
1. **EventBus** - Central event system
2. **StateManager** - Single state source
3. **ConfigManager** - All configuration values
4. **TimerManager** - All timing logic

### Phase 2: Pure Utility Functions
1. **PositionValidator** - All position/distance logic
2. **RouteCalculator** - All route calculation
3. **MovementCalculator** - All movement math
4. **ValidationRules** - All business rules

### Phase 3: State Machines
1. **TaxiStateMachine** - Taxi state logic only
2. **TakeoffStateMachine** - Takeoff state logic only
3. **LandingStateMachine** - Landing state logic only

### Phase 4: Operation Controllers
1. **TaxiController** - Taxi orchestration
2. **TakeoffController** - Takeoff orchestration  
3. **LandingController** - Landing orchestration
4. **GroundOpsController** - Ground vehicle coordination

### Phase 5: Debug & Monitoring
1. **OperationLogger** - Structured logging
2. **StateInspector** - State debugging tools
3. **PerformanceMonitor** - Operation metrics

### Phase 6: Integration & Testing
1. Replace existing FlightAutomation with new controllers
2. Migrate TaxiSystem to new architecture
3. Update Aircraft class to use StateManager
4. Add comprehensive tests

## Data Flow

```
1. User Action → EventBus.emit('operation.requested')
2. OperationController.onOperationRequested()
3. Controller → StateManager.setState()
4. StateManager → EventBus.emit('state.changed')
5. StateMachine.onStateChanged() → validate transition
6. StateMachine → OperationController.executePhase()
7. Controller uses Utils (PositionValidator, RouteCalculator, etc.)
8. Controller → StateManager.setState() (next phase)
9. Repeat until operation complete
```

## Testing Strategy

### Unit Tests
- Each utility function tested in isolation
- State machines tested with mock events
- Controllers tested with mock dependencies

### Integration Tests  
- Full operation flows (taxi, takeoff, landing)
- Multi-aircraft scenarios
- Error conditions and recovery

### Debug Tools
- Real-time state inspection
- Operation replay from logs
- Performance bottleneck identification

## Migration Steps

1. **Create new architecture alongside existing code**
2. **Implement Phase 1-2 (Infrastructure + Utils)**
3. **Test with one aircraft type (Cessna)**
4. **Implement Phase 3-4 (State Machines + Controllers)**
5. **Replace existing system incrementally**
6. **Add debugging tools**
7. **Remove old code**

## Success Criteria

- [ ] No duplicate logic across components
- [ ] Each concern handled in exactly one place
- [ ] Components can be tested in isolation
- [ ] Easy to trace operations through logs
- [ ] Simple to add new aircraft types/operations
- [ ] Clear error messages and debugging info
- [ ] No circular dependencies
- [ ] Configuration externalized from code