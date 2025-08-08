/**
 * Input Management Module
 * Centralized input handling for keyboard and mouse
 */

export class Input {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            isLocked: false,
            buttons: {}
        };
        
        this.callbacks = {
            keydown: [],
            keyup: [],
            mousemove: [],
            mousedown: [],
            mouseup: [],
            wheel: []
        };
        
        this.init();
    }
    
    /**
     * Initialize input event listeners
     */
    init() {
        // Keyboard events
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Mouse events
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('mousedown', (event) => this.onMouseDown(event));
        document.addEventListener('mouseup', (event) => this.onMouseUp(event));
        document.addEventListener('wheel', (event) => this.onWheel(event));
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
    }
    
    /**
     * Handle keydown events
     * @param {KeyboardEvent} event
     */
    onKeyDown(event) {
        this.keys[event.code] = true;
        
        // Debug key detection (disabled to reduce spam)
        // if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        //     console.log('WASD key detected:', event.code);
        // }
        
        // Call registered callbacks
        this.callbacks.keydown.forEach(callback => callback(event, this.keys));
    }
    
    /**
     * Handle keyup events
     * @param {KeyboardEvent} event
     */
    onKeyUp(event) {
        this.keys[event.code] = false;
        
        // Call registered callbacks
        this.callbacks.keyup.forEach(callback => callback(event, this.keys));
    }
    
    /**
     * Handle mouse move events
     * @param {MouseEvent} event
     */
    onMouseMove(event) {
        if (this.mouse.isLocked) {
            this.mouse.deltaX = event.movementX;
            this.mouse.deltaY = event.movementY;
        } else {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        }
        
        // Call registered callbacks
        this.callbacks.mousemove.forEach(callback => callback(event, this.mouse));
    }
    
    /**
     * Handle mouse down events
     * @param {MouseEvent} event
     */
    onMouseDown(event) {
        this.mouse.buttons[event.button] = true;
        
        // Call registered callbacks
        this.callbacks.mousedown.forEach(callback => callback(event, this.mouse));
    }
    
    /**
     * Handle mouse up events
     * @param {MouseEvent} event
     */
    onMouseUp(event) {
        this.mouse.buttons[event.button] = false;
        
        // Call registered callbacks
        this.callbacks.mouseup.forEach(callback => callback(event, this.mouse));
    }
    
    /**
     * Handle wheel events
     * @param {WheelEvent} event
     */
    onWheel(event) {
        // Call registered callbacks
        this.callbacks.wheel.forEach(callback => callback(event));
    }
    
    /**
     * Handle pointer lock change
     */
    onPointerLockChange() {
        this.mouse.isLocked = document.pointerLockElement !== null;
    }
    
    /**
     * Register callback for specific input event
     * @param {string} eventType - Event type (keydown, keyup, mousemove, etc.)
     * @param {Function} callback - Callback function
     */
    on(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].push(callback);
        }
    }
    
    /**
     * Remove callback for specific input event
     * @param {string} eventType - Event type
     * @param {Function} callback - Callback function to remove
     */
    off(eventType, callback) {
        if (this.callbacks[eventType]) {
            const index = this.callbacks[eventType].indexOf(callback);
            if (index > -1) {
                this.callbacks[eventType].splice(index, 1);
            }
        }
    }
    
    /**
     * Check if key is currently pressed
     * @param {string} keyCode - Key code to check
     * @returns {boolean}
     */
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    
    /**
     * Check if mouse button is currently pressed
     * @param {number} button - Mouse button (0=left, 1=middle, 2=right)
     * @returns {boolean}
     */
    isMouseButtonPressed(button) {
        return !!this.mouse.buttons[button];
    }
    
    /**
     * Get current control state object for movement
     * @returns {Object} Control state
     */
    getMovementControls() {
        return {
            forward: this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp'),
            backward: this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown'),
            left: this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft'),
            right: this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight'),
            up: this.isKeyPressed('Space'),
            down: this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight'),
            interact: this.isKeyPressed('KeyE')
        };
    }
    
    /**
     * Reset mouse delta values (call after processing)
     */
    resetMouseDelta() {
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
    
    /**
     * Request pointer lock on given element
     * @param {HTMLElement} element - Element to lock pointer to
     */
    requestPointerLock(element) {
        element.requestPointerLock();
    }
    
    /**
     * Exit pointer lock
     */
    exitPointerLock() {
        document.exitPointerLock();
    }
}