import {math} from '../math/math.js';
import {Component} from '../Component.js';

import {CameraFlightAnimation} from './../camera/CameraFlightAnimation.js';
import {PanController} from "./lib/controllers/PanController.js";
import {PivotController} from "./lib/controllers/PivotController.js";
import {PickController} from "./lib/controllers/PickController.js";
import {MousePanRotateDollyHandler} from "./lib/handlers/MousePanRotateDollyHandler.js";
import {KeyboardAxisViewHandler} from "./lib/handlers/KeyboardAxisViewHandler.js";
import {MousePickHandler} from "./lib/handlers/MousePickHandler.js";
import {KeyboardPanRotateDollyHandler} from "./lib/handlers/KeyboardPanRotateDollyHandler.js";
import {CameraUpdater} from "./lib/CameraUpdater.js";
import {MouseMiscHandler} from "./lib/handlers/MouseMiscHandler.js";
import {TouchPanRotateAndDollyHandler} from "./lib/handlers/TouchPanRotateAndDollyHandler.js";
import {TouchPickHandler} from "./lib/handlers/TouchPickHandler.js";

/**
 * @desc Controls a {@link Camera} with keyboard, mouse and touch input.
 *
 * * Located at {@link Viewer#cameraControl}.
 *
 * | Property | Type | Range | Default Value | Description |
 *  |:--------:|:----:|:-----:|:-------------:|:-----:|:-----------:|
 *  | {@link CameraControl#navMode} | String |  | | |
 *
 * ## Orbit Mode
 *
 * Enable orbit mode by setting {@link CameraControl#firstPerson} ````false```` (default value).
 *
 * In orbit mode, your current position will then orbit about the point that you're looking at.
 *
 * Let's enable orbit mode:
 *
 * ````javascript
 * cameraControl.firstPerson = false;
 * ````
 *
 * ## Dolly-to-Pointer
 *
 * While in orbit mode, setting {@link CameraControl#dollyToPointer} ````true```` will cause dollying to always move you
 * closer or farther from the position that the mouse is currently pointing at. This has no effect in first-person mode.
 *
 * Lets ensure that we're in orbit mode, then enable dolly-to-pointer:
 *
 * ````javascript
 * cameraControl.firstPerson = false;
 * cameraControl.dollyToPointer = true;
 * ````
 *
 * ## Pivoting Mode
 *
 * When in orbit mode, setting {@link CameraControl#pivoting} ````true```` will cause CameraControl to always pivot
 * your position and the point you're looking at, in unison, about the current *pivot position*.
 *
 * When in orbit mode, and pivoting, left-clicking with the mouse on the surface of an object will set the pivot point
 * on that surface. When using a touch device, we double-tap to set the pivot. Then the pivot point becomes that surface position.
 *
 * Lets ensure that we're in orbit mode, then enable pivoting:
 *
 * ````javascript
 * cameraControl.firstPerson = false;
 * cameraControl.pivoting = true;
 * ````
 *
 * Now, if using a mouse, we can left-click on an object, then hold the button down and drag to pivot that point. If we
 * again click and drag, but this time not clicking an object, we'll continue to pivot the point on the object surface
 * that we clicked the last time.
 *
 * ## Dolly-to-Pivot
 *
 * When in orbit mode and pivoting, setting {@link CameraControl#dollyToPivot} ````true```` will cause dollying to
 * always move your position, and the point you're looking at, in unison, towards and away from the current pivot point.
 *
 * Dolly using the mouse wheel, the keyboard (see table of inputs), or pinch gesture with touch pads.
 *
 * Let's ensure that we're in orbit mode and that pivoting is also enabled, then enable dolly-to-pivot:
 *
 * ````javascript
 * cameraControl.firstPerson = false;
 * cameraControl.pivoting = true;
 * cameraControl.dollyToPointer = false;
 * cameraControl.dollyToPivot = true;
 * ````
 *
 * ## First-Person Navigation
 *
 * Enable first-person navigation mode by setting {@link CameraControl#firstPerson} ````true````.
 *
 * In first-person mode, the camera will always rotate about your current position, and dollying will move both your
 * position and point-of-interest backwards and forwards, in unison.
 *
 * First-person mode also prevents dolly-to-pivot behaviour.
 *
 * To enable first-person mode:
 *
 * ````javascript
 * cameraControl.firstPerson = true;
 * ````
 *
 *
 *
 * ## Rotation
 *
 * The {@link CameraControl#firstPerson}
 * and {@link CameraControl#pivoting} flags determine CameraControl's rotation behaviour.
 *
 * When {@link CameraControl#firstPerson} and {@link CameraControl#pivoting} are both ````false````, {@link Camera#eye} and
 * {@link Camera#up} orbit around {@link Camera#look}.
 *
 * When  {@link CameraControl#firstPerson} is ````false```` and {@link CameraControl#pivoting} is ````true````, {@link Camera#eye} and
 * {@link Camera#up} orbit the current pivot position, which is set by clicking or double-tapping on a pickable {@link Entity}.
 *
 * ### Mouse Rotation
 *
 * Rotate with the mouse by dragging with the left button down.
 *
 * ### Mouse Pad rotation
 *
 * Rotate with the mouse pad by double-clicking then dragging. When {@link CameraControl#firstPerson} is ````false````
 * and {@link CameraControl#pivoting} is ````true````, the double-tap, if over an {@link Entity}, will set the pivot
 * point about which you'll orbit. Double-tap on empty space will continue to orbit the the last pivot point that was set.
 *
 * ### Touch Rotation
 *
 * TODO
 *
 * ## Panning
 *
 * Panning (in xeokit) moves {@link Camera#eye} and {@link Camera#look} in unison, left/right or up/down.
 *
 * ## Dollying
 *
 * Dollying moves {@link Camera#eye} and {@link Camera#look} in unison, forwards or backwards.
 *
 * The {@link CameraControl#firstPerson}, {@link CameraControl#pivoting}, {@link CameraControl#dollyToPivot}
 * and {@link CameraControl#dollyToPointer} flags determine CameraControl's dollying behaviour.
 *
 * ## Picking
 *
 * ## Fly-to
 *
 *
 *
 * @emits "hover" - pointer hovers over a new object
 * @emits "hoverSurface" - Hover continues over an object surface - fired continuously as mouse moves over an object
 * @emits "hoverOut"  - Hover has left the last object we were hovering over
 * @emits "hoverOff" - Hover continues over empty space - fired continuously as mouse moves over nothing
 * @emits "picked" - Clicked or tapped object
 * @emits "pickedSurface" -  Clicked or tapped object, with event containing surface intersection details
 * @emits "doublePicked" - Double-clicked or double-tapped object
 * @emits "doublePickedSurface" - Double-clicked or double-tapped object, with event containing surface intersection details
 * @emits "pickedNothing" - Clicked or tapped, but not on any objects
 * @emits "doublePickedNothing" - Double-clicked or double-tapped, but not on any objects
 * @emits "rightClick" - Right-click
 */
class CameraControl extends Component {

    /**
     * @private
     * @constructor
     */
    constructor(owner, cfg = {}) {

        super(owner, cfg);

        this.scene.canvas.canvas.oncontextmenu = (e) => {
            e.preventDefault();
        };

        // User-settable CameraControl configurations

        this._configs = {

            active: true,

            tapInterval: 150, // Millisecs
            doubleTapInterval: 325, // Millisecs
            tapDistanceThreshold: 4, // Pixels

            mousePanRate: 0.1,
            keyboardPanRate: .02,
            keyboardOrbitRate: .02,

            touchRotateRate: 0.3,
            touchPanRate: 0.2,
            touchZoomRate: 0.2,

            dollyRate: 10,

            planView: false,
            firstPerson: false,
            constrainVertical: false,

            doublePickFlyTo: true,
            panRightClick: true,

            pivoting: false,
            dollyToPointer: false,
            dollyToPivot: false,

            rotationInertia: 0,
            dollyInertia: 0,

            pointerEnabled: true,

            keyboardLayout: "qwerty"
        };

        // Current runtime state of the CameraControl

        this._states = {
            mouseCanvasPos: new Float32Array(2),
            mouseover: false,
            inputFromMouse: false, // TODO: Is this needed?
            mouseDownClientX: 0,
            mouseDownClientY: 0,
            mouseDownCursorX: 0,
            mouseDownCursorY: 0,
            touchStartTime: null,
            activeTouches: [],
            tapStartPos: new Float32Array(2),
            tapStartTime: -1,
            lastTapTime: -1,
        };

        // Updates for CameraUpdater to process on next Scene "tick" event

        this._updates = {
            rotateDeltaX: 0,
            rotateDeltaY: 0,
            panDeltaX: 0,
            panDeltaY: 0,
            panDeltaZ: 0,
            dollyDelta: 0
        };

        // Controllers to assist input event handlers with controlling the Camera

        const scene = this.scene;

        this._controllers = {
            cameraControl: this,
            pickController: new PickController(this, this._configs),
            pivotController: new PivotController(scene),
            panController: new PanController(this.scene),
            cameraFlight: new CameraFlightAnimation(this, {
                duration: 0.5
            })
        };

        // Input event handlers

        this._handlers = [
            new MouseMiscHandler(this.scene, this._controllers, this._configs, this._states, this._updates),
            new TouchPanRotateAndDollyHandler(this.scene, this._controllers, this._configs, this._states, this._updates),
            new MousePanRotateDollyHandler(this.scene, this._controllers, this._configs, this._states, this._updates),
            new KeyboardAxisViewHandler(this.scene, this._controllers, this._configs, this._states, this._updates),
            new MousePickHandler(this.scene, this._controllers, this._configs, this._states, this._updates),
            new TouchPickHandler(this.scene, this._controllers, this._configs, this._states, this._updates),
            new KeyboardPanRotateDollyHandler(this.scene, this._controllers, this._configs, this._states, this._updates)
        ];

        // Applies scheduled updates to the Camera on each Scene "tick" event

        this._cameraUpdater = new CameraUpdater(this.scene, this._controllers, this._configs, this._states, this._updates);

        // Set initial user configurations

        this.planView = cfg.planView;
        this.firstPerson = cfg.firstPerson;
        this.constrainVertical = cfg.constrainVertical;
        this.keyboardLayout = cfg.keyboardLayout;
        this.doublePickFlyTo = cfg.doublePickFlyTo;
        this.panRightClick = cfg.panRightClick;
        this.active = cfg.active;
        this.pivoting = cfg.pivoting;
        this.dollyToPointer = cfg.dollyToPointer;
        this.dollyToPivot = cfg.dollyToPivot;
        this.rotationInertia = cfg.rotationInertia;
        this.dollyInertia = cfg.dollyInertia;
        this.pointerEnabled = true;
        this.dollyRate = cfg.dollyRate;
    }

    /**
     * Sets the HTMl element to represent the pivot point when {@link CameraControl#pivoting} is true.
     * @param {HTMLElement} element HTML element representing the pivot point.
     */
    set pivotElement(element) {
        this._controllers.pivotController.setPivotElement(element);
    }

    /**
     *  Sets if this CameraControl is active or not.
     *
     * Default value is ````true````.
     *
     * @param {Boolean} value Set ````true```` to activate this CameraControl.
     */
    set active(value) {
        this._reset();
        this._configs.active = value !== false;
    }

    _reset() {
        for (let i = 0, len = this._handlers.length; i < len; i++) {
            const handler = this._handlers[i];
            if (handler.reset) {
                handler.reset();
            }
        }

        this._updates.panDeltaX = 0;
        this._updates.panDeltaY = 0;
        this._updates.rotateDeltaX = 0;
        this._updates.rotateDeltaY = 0;
        this._updates.dolyDelta = 0;
    }

    /**
     * Gets if this CameraControl is active or not.
     *
     * Default value is ````true````.
     *
     * @returns {Boolean} Returns ````true```` if this CameraControl is active.
     */
    get active() {
        return this._configs.active;
    }

    /**
     * Sets whether canvas pointer events are enabled.
     *
     * Default value is ````true````.
     *
     * @param {Boolean} value Set ````true```` to enable drag events.
     */
    set pointerEnabled(value) {
        this._reset();
        this._configs.pointerEnabled = !!value;
    }

    /**
     * Gets whether canvas pointer events are enabled.
     *
     * Default value is ````true````.
     *
     * @returns {Boolean} Returns ````true```` to enable drag events.
     */
    get pointerEnabled() {
        return this._configs.pointerEnabled;
    }

    /**
     * Sets whether dragging will pivot the {@link Camera} about the current 3D pivot point.
     *
     * The pivot point is indicated by {@link CameraControl#pivotPos}.
     *
     * When in pivoting mode, clicking on an {@link Entity} will set {@link CameraControl#pivotPos} to the clicked position on the surface of the Entity.
     *
     * You can configure an HTML element to show the pivot position via {@link CameraControl#pivotElement}.
     *
     * Default value is ````false````.
     *
     * @param {Boolean} value Set ````true```` to enable pivoting.
     */
    set pivoting(value) {
        this._configs.pivoting = !!value;
    }

    /**
     * Sets whether dragging will pivot the {@link Camera} about the current 3D pivot point.
     *
     * The pivot point is indicated by {@link CameraControl#pivotPos}.
     *
     * When in pivoting mode, clicking on an {@link Entity} will set {@link CameraControl#pivotPos} to the clicked position on the surface of the Entity.
     *
     * You can configure an HTML element to show the pivot position via {@link CameraControl#pivotElement}.
     *
     * Default value is ````false````.
     *
     * @returns {Boolean} Returns ````true```` to enable pivoting.
     */
    get pivoting() {
        return this._configs.pivoting;
    }

    /**
     * Sets the current World-space 3D pivot position.
     *
     * @param {Number[]} worldPos The new World-space 3D pivot position.
     */
    set pivotPos(worldPos) {
        this._controllers.pivotController.setPivotPos(worldPos);
    }

    /**
     * Gets the current World-space 3D pivot position.
     *
     * @return {Number[]} worldPos The current World-space 3D pivot position.
     */
    get pivotPos() {
        return this._controllers.pivotController.getPivotPos();
    }

    /**
     * Sets whether scrolling the mouse wheel, when the mouse is over an {@link Entity}, will zoom the {@link Camera} towards the hovered point on the Entity's surface.
     *
     * Default value is ````false````.
     *
     * @param {Boolean} value Set ````true```` to enable pan-to-pointer behaviour.
     */
    set dollyToPointer(value) {
        this._configs.dollyToPointer = !!value;
        if (this._configs.dollyToPointer) {
            this._configs.dollyToPivot = false;
        }
    }

    /**
     * Gets whether scrolling the mouse wheel, when the mouse is over an {@link Entity}, will zoom the {@link Camera} towards the hovered point on the Entity's surface.
     *
     * Default value is ````false````.
     *
     * @returns {Boolean} Returns ````true```` if pan-to-pointer behaviour is enabled.
     */
    get dollyToPointer() {
        return this._configs.dollyToPointer;
    }

    /**
     * Sets whether scrolling the mouse wheel, when mouse is over an {@link Entity}, will zoom the {@link Camera} towards the pivot point.
     *
     * Default value is ````false````.
     *
     * @param {Boolean} value Set ````true```` to enable pan-to-pivot behaviour.
     */
    set dollyToPivot(value) {
        this._configs.dollyToPivot = !!value;
        if (this._configs.dollyToPivot) {
            this._configs.dollyToPointer = false;
        }
    }

    /**
     * Gets whether scrolling the mouse wheel, when mouse is over an {@link Entity}, will zoom the {@link Camera} towards the pivot point.
     *
     * Default value is ````false````.
     *
     * @returns {Boolean} Returns ````true```` if enable pan-to-pivot behaviour is enabled.
     */
    get dollyToPivot() {
        return this._configs.dollyToPivot;
    }

    /**
     * Sets whether this CameraControl is in plan-view mode.
     *
     * When in plan-view mode, rotation is disabled.
     *
     * Default value is ````false````.
     *
     * @param {Boolean} value Set ````true```` to enable plan-view mode.
     */
    set planView(value) {
        this._configs.planView = !!value;
    }

    /**
     * Gets whether this CameraControl is in plan-view mode.
     *
     * When in plan-view mode, rotation is disabled.
     *
     * Default value is ````false````.
     *
     * @returns {Boolean} Returns ````true```` if plan-view mode is enabled.
     */
    get planView() {
        return this._configs.planView;
    }

    /**
     * Sets whether this CameraControl is in first-person mode.
     *
     * In "first person" mode (disabled by default) the look position rotates about the eye position. Otherwise,  {@link Camera#eye} rotates about {@link Camera#look}.
     *
     * Default value is ````false````.
     *
     * @param {Boolean} value Set ````true```` to enable first-person mode.
     */
    set firstPerson(value) {
        this._configs.firstPerson = !!value;
        if (this._configs.firstPerson) {
            this._controllers.pivotController.hidePivot();
            this._controllers.pivotController.endPivot();
        }
    }

    /**
     * Gets whether this CameraControl is in first-person mode.
     *
     * In "first person" mode (disabled by default) the look position rotates about the eye position. Otherwise,  {@link Camera#eye} rotates about {@link Camera#look}.
     *
     * Default value is ````false````.
     *
     * @returns {Boolean} Returns ````true```` if first-person mode is enabled.
     */
    get firstPerson() {
        return this._configs.firstPerson;
    }

    /**
     * Sets whether this CameraControl is in constrainVertical mode.
     *
     * When set ````true````, this constrains {@link Camera#eye} movement to the horizontal X-Z plane. When doing a walkthrough,
     * this is useful to allow us to look upwards or downwards as we move, while keeping us moving in the  horizontal plane.
     *
     * This only has an effect when {@link CameraControl#firstPerson} is ````true````.
     *
     * Default value is ````false````.
     *
     * @param {Boolean} value Set ````true```` to enable constrainVertical mode.
     */
    set constrainVertical(value) {
        this._configs.constrainVertical = !!value;
    }

    /**
     * Gets whether this CameraControl is in constrainVertical mode.
     *
     * When set ````true````, this constrains {@link Camera#eye} movement to the horizontal X-Z plane. When doing a walkthrough,
     * this is useful to allow us to look upwards or downwards as we move, while keeping us moving in the  horizontal plane.
     *
     * This only has an effect when {@link CameraControl#firstPerson} is ````true````.
     *
     * Default value is ````false````.
     *
     * @returns {Boolean} Returns ````true```` when in constrainVertical mode.
     */
    get constrainVertical() {
        return this._configs.constrainVertical;
    }

    /**
     * Sets whether double-picking an {@link Entity} causes the {@link Camera} to fly to its boundary.
     *
     * Default value is ````false````.
     *
     * @param {Boolean} value Set ````true```` to enable double-pick-fly-to mode.
     */
    set doublePickFlyTo(value) {
        this._configs.doublePickFlyTo = value !== false;
    }

    /**
     * Gets whether double-picking an {@link Entity} causes the {@link Camera} to fly to its boundary.
     *
     * Default value is ````false````.
     *
     * @returns {Boolean} Returns ````true```` when double-pick-fly-to mode is enabled.
     */
    get doublePickFlyTo() {
        return this._configs.doublePickFlyTo;
    }

    /**
     * Sets whether either right-clicking (true) or middle-clicking (false) pans the {@link Camera}.
     *
     * Default value is ````true````.
     *
     * @param {Boolean} value Set ````false```` to disable pan on right-click.
     */
    set panRightClick(value) {
        this._configs.panRightClick = value !== false;
    }

    /**
     * Gets whether right-clicking pans the {@link Camera}.
     *
     * Default value is ````true````.
     *
     * @returns {Boolean} Returns ````false```` when pan on right-click is disabled.
     */
    get panRightClick() {
        return this._configs.panRightClick;
    }

    /**
     * Sets a factor in range ````[0..1]```` indicating how much the camera keeps moving after you finish rotating it.
     *
     * A value of ````0.0```` causes it to immediately stop, ````0.5```` causes its movement to decay 50% on each tick,
     * while ````1.0```` causes no decay, allowing it continue moving, by the current rate of rotation.
     *
     * You may choose an inertia of zero when you want be able to precisely rotate the camera,
     * without interference from inertia. Zero inertia can also mean that less frames are rendered while
     * you are rotating the camera.
     *
     * Default value is ````0.5````.
     *
     * @param {Number} value New inertial factor.
     */
    set rotationInertia(value) {
        this._configs.rotationInertia = value === undefined ? 0.5 : value;
    }

    /**
     * Gets the rotation inertia factor.
     *
     * Default value is ````0.5````.
     *
     * @returns {Number} The inertia factor.
     */
    get rotationInertia() {
        return this._configs.rotationInertia;
    }

    /**
     * Sets the current dolly speed. This is the number of World-space coordinate units the camera moves per second while moving forwards or backwards.
     * @param {Number} dollyRate The new dolly speed.
     */
    set dollyRate(dollyRate) {
        this._configs.dollyRate = dollyRate || 10.0;
    }

    /**
     * Returns the current dolly speed.
     * @returns {Number} The current dolly speed.
     */
    get dollyRate() {
        return this._configs.dollyRate;
    }

    /**
     * Sets a factor in range ````[0..1]```` indicating how much the camera keeps moving after you finish dollying it.
     *
     * A value of ````0.0```` causes it to immediately stop, ````0.5```` causes its movement to decay 50% on each tick,
     * while ````1.0```` causes no decay, allowing it continue moving, by the current rate of pan or rotation.
     *
     * You may choose an dollyInertia of zero when you want be able to precisely position or rotate the camera,
     * without interference from inertia. Zero inertia can also mean that less frames are rendered while
     * you are positioning the camera.
     *
     * Default value is ````0.5````.
     *
     * @param {Number} value New dolly inertia factor.
     */
    set dollyInertia(value) {
        this._configs.dollyInertia = value === undefined ? 0.5 : value;
    }

    /**
     * Gets the dolly inertia factor.
     *
     * Default value is ````0.5````.
     *
     * @returns {Number} The dolly inertia factor.
     */
    get dollyInertia() {
        return this._configs.dollyInertia;
    }

    /**
     * Selects the keyboard layout.
     *
     * Options are:
     *
     * * "qwerty"
     * * "azerty"
     *
     * Default is "qwerty".
     */
    set keyboardLayout(value) {
        value = value || "qwerty";
        if (value !== "qwerty" && value !== "azerty") {
            this.error("Unsupported value for keyboardLayout - defaulting to 'qwerty'");
            value = "qwerty";
        }
        this._configs.keyboardLayout = value;
    }

    /**
     * @private
     */
    get keyboardLayout() {
        return this._configs.keyboardLayout;
    }

    destroy() {
        this._destroyHandlers();
        this._cameraUpdater.destroy();
        super.destroy();
    }

    _destroyHandlers() {
        for (let i = 0, len = this._handlers.length; i < len; i++) {
            const handler = this._handlers[i];
            if (handler.destroy) {
                handler.destroy();
            }
        }
    }
}

export {
    CameraControl
};