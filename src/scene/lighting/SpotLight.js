/**
 A **SpotLight** defines a positional light source that originates from a single point and eminates in a given direction,
 to illuminate {{#crossLink "Mesh"}}Meshes{{/crossLink}}.

 ## Overview

 * SpotLights have a position and direction.
 * SpotLights may be defined in either **World** or **View** coordinate space. When in World-space, their positions
 are relative to the World coordinate system, and will appear to move as the {{#crossLink "Camera"}}{{/crossLink}} moves.
 When in View-space, their positions are relative to the View coordinate system, and will behave as if fixed to the viewer's
 head as the {{#crossLink "Camera"}}{{/crossLink}} moves.
 * SpotLights have {{#crossLink "SpotLight/constantAttenuation:property"}}{{/crossLink}}, {{#crossLink "SpotLight/linearAttenuation:property"}}{{/crossLink}} and
 {{#crossLink "SpotLight/quadraticAttenuation:property"}}{{/crossLink}} factors, which indicate how their intensity attenuates over distance.
 * A SpotLight can also have a {{#crossLink "Shadow"}}{{/crossLink}} component, to configure it to cast a shadow.
 * {{#crossLink "AmbientLight"}}{{/crossLink}}, {{#crossLink "DirLight"}}{{/crossLink}},
 {{#crossLink "SpotLight"}}{{/crossLink}} and {{#crossLink "PointLight"}}{{/crossLink}} instances are registered by ID
 on {{#crossLink "Scene/lights:property"}}Scene#lights{{/crossLink}} for convenient access.
 ## Examples

 TODO

 ## Usage

 In the example below we'll customize the default Scene's light sources, defining an AmbientLight and a couple of
 SpotLights, then create a Phong-shaded box mesh.

 ````javascript
 new xeokit.AmbientLight({
     color: [0.8, 0.8, 0.8],
     intensity: 0.5
 });

 new xeokit.SpotLight({
     pos: [0, 100, 100],
     dir: [0, -1, 0],
     color: [0.5, 0.7, 0.5],
     intensity: 1
     constantAttenuation: 0,
     linearAttenuation: 0,
     quadraticAttenuation: 0,
     space: "view"
 });

 new xeokit.PointLight({
     pos: [0, 100, 100],
     dir: [0, -1, 0],
     color: [0.5, 0.7, 0.5],
     intensity: 1
     constantAttenuation: 0,
     linearAttenuation: 0,
     quadraticAttenuation: 0,
     space: "view"
 });

 // Create box mesh
 new xeokit.Mesh({
    material: new xeokit.PhongMaterial({
        ambient: [0.5, 0.5, 0.5],
        diffuse: [1,0.3,0.3]
    }),
    geometry: new xeokit.BoxGeometry()
 });
 ````

 @class SpotLight
 @module xeokit
 @submodule lighting
 @constructor
 @extends Component
 @param [owner] {Component} Owner component. When destroyed, the owner will destroy this component as well. Creates this component within the default {{#crossLink "Scene"}}{{/crossLink}} when omitted.
 @param [cfg] {*} The SpotLight configuration
 @param [cfg.id] {String} Optional ID, unique among all components in the parent {{#crossLink "Scene"}}Scene{{/crossLink}}, generated automatically when omitted.
 @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this SpotLight.
 @param [cfg.pos=[ 1.0, 1.0, 1.0 ]] {Float32Array} Position, in either World or View space, depending on the value of the **space** parameter.
 @param [cfg.dir=[ 0.0, -1.0, 0.0 ]] {Float32Array} Direction in which this Spotlight is shining, in either World or View space, depending on the value of the **space** parameter.
 @param [cfg.color=[0.7, 0.7, 0.8 ]] {Float32Array} Color of this SpotLight.
 @param [cfg.intensity=1.0] {Number} Intensity of this SpotLight.
 @param [cfg.constantAttenuation=0] {Number} Constant attenuation factor.
 @param [cfg.linearAttenuation=0] {Number} Linear attenuation factor.
 @param [cfg.quadraticAttenuation=0] {Number} Quadratic attenuation factor.
 @param [cfg.space="view"] {String} The coordinate system this SpotLight is defined in - "view" or "world".
 @param [cfg.castShadow=false] {Boolean} Flag which indicates if this SpotLight casts a shadow.
 */

import {Component} from '../Component.js';
import {RenderState} from '../webgl/RenderState.js';
import {RenderBuffer} from '../webgl/Renderbuffer.js';
import {math} from '../math/math.js';
import {componentClasses} from "./../componentClasses.js";

const type = "xeokit.SpotLight";

class SpotLight extends Component {

    /**
     JavaScript class name for this Component.

     For example: "xeokit.AmbientLight", "xeokit.MetallicMaterial" etc.

     @property type
     @type String
     @final
     */
    get type() {
        return type;
    }

    init(cfg) {

        super.init(cfg);

        const self = this;

        this._shadowRenderBuf = null;
        this._shadowViewMatrix = null;
        this._shadowProjMatrix = null;
        this._shadowViewMatrixDirty = true;
        this._shadowProjMatrixDirty = true;

        this._state = new RenderState({
            type: "spot",
            pos: math.vec3([1.0, 1.0, 1.0]),
            dir: math.vec3([0.0, -1.0, 0.0]),
            color: math.vec3([0.7, 0.7, 0.8]),
            intensity: 1.0,
            attenuation: [0.0, 0.0, 0.0],
            space: cfg.space || "view",
            castShadow: false,
            shadowDirty: true,

            getShadowViewMatrix: (function () {
                const look = math.vec3();
                const up = math.vec3([0, 1, 0]);
                return function () {
                    if (self._shadowViewMatrixDirty) {
                        if (!self._shadowViewMatrix) {
                            self._shadowViewMatrix = math.identityMat4();
                        }
                        math.addVec3(self._state.pos, self._state.dir, look);
                        math.lookAtMat4v(self._state.pos, look, up, self._shadowViewMatrix);
                        self._shadowViewMatrixDirty = false;
                    }
                    return self._shadowViewMatrix;
                };
            })(),

            getShadowProjMatrix: function () {
                if (self._shadowProjMatrixDirty) { // TODO: Set when canvas resizes
                    if (!self._shadowProjMatrix) {
                        self._shadowProjMatrix = math.identityMat4();
                    }
                    const canvas = self.scene.canvas.canvas;
                    math.perspectiveMat4(60 * (Math.PI / 180.0), canvas.clientWidth / canvas.clientHeight, 0.1, 400.0, self._shadowProjMatrix);
                    self._shadowProjMatrixDirty = false;
                }
                return self._shadowProjMatrix;
            },

            getShadowRenderBuf: function () {
                if (!self._shadowRenderBuf) {
                    self._shadowRenderBuf = new RenderBuffer(self.scene.canvas.canvas, self.scene.canvas.gl);
                }
                return self._shadowRenderBuf;
            }
        });

        this.pos = cfg.pos;
        this.color = cfg.color;
        this.intensity = cfg.intensity;
        this.constantAttenuation = cfg.constantAttenuation;
        this.linearAttenuation = cfg.linearAttenuation;
        this.quadraticAttenuation = cfg.quadraticAttenuation;
        this.castShadow = cfg.castShadow;
        this.scene._lightCreated(this);
    }


    /**
     The position of this SpotLight.

     This will be either World- or View-space, depending on the value of {{#crossLink "SpotLight/space:property"}}{{/crossLink}}.

     @property pos
     @default [1.0, 1.0, 1.0]
     @type Array(Number)
     */
    set pos(value) {
        this._state.pos.set(value || [1.0, 1.0, 1.0]);
        this._shadowViewMatrixDirty = true;
        this.glRedraw();
    }

    get pos() {
        return this._state.pos;
    }

    /**
     The direction in which the light is shining.

     @property dir
     @default [1.0, 1.0, 1.0]
     @type Float32Array
     */
    set dir(value) {
        this._state.dir.set(value || [1.0, 1.0, 1.0]);
        this._shadowViewMatrixDirty = true;
        this.glRedraw();
    }

    get dir() {
        return this._state.dir;
    }

    /**
     The color of this SpotLight.

     @property color
     @default [0.7, 0.7, 0.8]
     @type Float32Array
     */
    set color(value) {
        this._state.color.set(value || [0.7, 0.7, 0.8]);
        this.glRedraw();
    }

    get color() {
        return this._state.color;
    }

    /**
     The intensity of this SpotLight.

     Fires a {{#crossLink "SpotLight/intensity:event"}}{{/crossLink}} event on change.

     @property intensity
     @default 1.0
     @type Number
     */
    set intensity(value) {
        value = value !== undefined ? value : 1.0;
        this._state.intensity = value;
        this.glRedraw();
    }

    get intensity() {
        return this._state.intensity;
    }

    /**
     The constant attenuation factor for this SpotLight.

     @property constantAttenuation
     @default 0
     @type Number
     */
    set constantAttenuation(value) {
        this._state.attenuation[0] = value || 0.0;
        this.glRedraw();
    }

    get constantAttenuation() {
        return this._state.attenuation[0];
    }

    /**
     The linear attenuation factor for this SpotLight.

     @property linearAttenuation
     @default 0
     @type Number
     */
    set linearAttenuation(value) {
        this._state.attenuation[1] = value || 0.0;
        this.glRedraw();
    }

    get linearAttenuation() {
        return this._state.attenuation[1];
    }

    /**
     The quadratic attenuation factor for this SpotLight.

     @property quadraticAttenuation
     @default 0
     @type Number
     */
    set quadraticAttenuation(value) {
        this._state.attenuation[2] = value || 0.0;
        this.glRedraw();
    }

    get quadraticAttenuation() {
        return this._state.attenuation[2];
    }

    /**
     Flag which indicates if this SpotLight casts a shadow.

     @property castShadow
     @default false
     @type Boolean
     */
    set castShadow(value) {
        value = !!value;
        if (this._state.castShadow === value) {
            return;
        }
        this._state.castShadow = value;
        this._shadowViewMatrixDirty = true;
        this.glRedraw();
        this.fire("dirty", true);
    }

    get castShadow() {
        return this._state.castShadow;
    }

    destroy() {
        super.destroy();
        this._state.destroy();
        if (this._shadowRenderBuf) {
            this._shadowRenderBuf.destroy();
        }
        this.scene._lightDestroyed(this);

    }
}

componentClasses[type] = SpotLight;

export {SpotLight};