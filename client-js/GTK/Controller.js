
const EventEmitter = require('events');
const debounce = require('debounce');

const Project = require('./Project');
const Component = require('./Component');
const { Selection, UNIT } = require('./selections');
const UTIL = require('./Util');

/**
 * A Controller maintains settings and state between one or more Components (that is, instances
 * of the Component class). Every Component relies on a Controller for its settings. By default,
 * each Component has its own, internal Controller instance. However, you can create your own
 * Controller instance and register multiple Components to it, which will allow the Components to
 * keep their settings and state synced.
 * 
 * In addition to settings (color map, camera position, displayed tracks, etc.), the controller
 * maintains a common Selection between components, so selecting a part of the genome in one
 * component will update the display in another. For example, the GeometryCanvas, ContactMapCanvas
 * and ControlPanel are all Components. When they are registered to the same Controller, then
 * click-and-dragging a selection in the Contact Map will update the displayed segments in the
 * Geometry view and the selection read-out in the ControlPanel. Changing display settings in the
 * ControlPanel will cause the associated Geometry views to update.
 * 
 * The Controller has methods to set each of the individual settings or the selection. When one of
 * these is called, the Controller will update its internal state and then call associated handlers
 * in each of the registered Components. It will also emit events for each change, although code
 * within Components should rely on the handler methods, instead of listening for the events.
 * 
 * In addition to the value for the new setting, events or handler calls are called
 * with an additional `options` object with extra information in the following fields:
 * 
 * - `source`: The Component instance that triggered the change
 * - `debounced`: If this is the delayed "debounced" call for this event (see below)
 * - `decoration`: Any additional data that a Component has chosen to pass along with this event
 * - `type`: The name of the event
 * 
 * Every event or handler call from a Controller has a "debounced" variant. If a setting (or 
 * the selection) is changed, and then not changed again for a short time, the event will be
 * triggered again but with the `debounced` option set to true. Some Components may change settings
 * very rapidly (like when click-and-dragging on a ContactMap), while some Components may have
 * expensive responses to events (like needing to fetch from the server). In these cases, Components
 * can just respond to the debounced events by checking the `debounced` field of the options object.
 * 
 * The Controller will also emit an event, 'anyChanged', which will fire when any setting is 
 * changed, with the same value and options as the regular event.
 *
 */
class Controller extends EventEmitter {

    /**********************
     * TYPEDEFS
    ***********************/

    /**
     * @typedef {Number?} VariableSetting Index for currently selected variable array. That is,
     * the array of values that can be mapped onto slice of the genome
     * 
     * @typedef {String?} ColormapSetting Color map name. Valid names come from THREE.js's LUT object.
     * Last I checked, that's `rainbow`, `cooltowarm`, `blackbody` and `grayscale`
     * 
     * @typedef {Boolean} UnmappedSetting Whether or not to display unmapped segments in the geometry view
     * 
     * @typedef {String} BackgroundSetting Background color for the geometry view. A string in `#FFFFFF' format
     * 
     * @typedef {Number[]} Vector3Setting Array of [x,y,z] values representing a THREE.js vector3
     * (like for the camera position of center-of-rotation position)
     * 
     * @typedef {Number} ThresholdSetting Value between 0 and 1 representing the cutoff point for
     * the maximum value used when coloring the contact maps.
    **/

    /**
     * @typedef {Object} TrackSpec Specification for a data track chart
     * @property {VariableSetting} variable Variable ID
     * @property {Number[]} locationRange Range of locations like: [ start, end ]
     */

    /**********************
     * CONSTRUCTOR
    ***********************/

    /**
     * Create a Controller with settings for the given GTK Project
     * (if no project is specified, the global Project.TheProject will be used)
     * @param {Project?} project 
     */
    constructor(project) {
        super();

        /** @type {Project} the associated project */
        this.project = project || Project.TheProject;

        if (!this.project)
            throw new Error("Can't instantiate a Controller without a Project!");

        /** @type {Selection} the current selection */
        this.selection = null;

        /** @type {TrackSpec[]} Currently displayed tracks */
        this.tracks = [];

        /** @type {Component[]} Registered Components*/
        this.components = [];

        /** Mapping of event names to debounced functions for each one */
        this._debouncers = {
            any: this._makeDebouncer('anyChanged', 'onAnyChanged')
        };

        const arrays = this.project.getVariables();

        /** Current settings */
        this.settings = {
            /** @type {VariableSetting} */
            variable: (arrays.length ? arrays[0].id : null),
            /** @type {ColormapSetting} */
            colormap: 'rainbow',
            /** @type {UnmappedSetting} */
            showUnmappedSegments: false,
            /** @type {BackgroundSetting} */
            backgroundColor: '#FFFFFF',
            /** @type {Vector3Setting} */
            cameraPos: this.project.getApplicationData('gtk')['geometrycanvas']['scene']['camera']['position'],
            /** @type {vector3Setting?} */
            centerPos: null, // A null value indicates that the center-of-rotation should be
                            // a structure's centroid
            /** @type {ThresholdSetting} */
            contactThreshold: 1
        }
    }

    /**********************
     * PUBLIC METHODS
    ***********************/

    /**
     * Trigger an update to Selection on this Controller and Components connected to it.
     * @param {Selection|Promise<Selection>} selection The new selection, or a promise that resolves to it
     * @param {Component} source The component initiating the change. (If you're calling this method
     * from a Component, then make this `this`). 
     * @param {*} decoration Any additional data to pass along to other Components
     */
    updateSelection = async (selection, source, decoration) => {
        // If selection is actually a promise, then wait for it resolve first
        if (selection instanceof Promise)
            selection = await selection;

        this.selection = selection;
        this._triggerEvent('selectionChanged', 'onSelectionChanged', false, selection, {decoration, source});
    }

    /**
     * Trigger an update to the `variable` setting on this Controller and Components connected to it.
     * @param {VariableSetting} value The new setting value
     * @param {Component} source The component initiating the change. (If you're calling this method
     * from a Component, then make this `this`). 
     * @param {*} decoration Any additional data to pass along to other Components
     */
    updateVariable = (value, source, decoration) => {
        this.settings.variable = value;
        this._triggerEvent('variableChanged', 'onVariableChanged', false, value, {decoration, source});
    }

    /**
     * Trigger an update to the `colormap` setting on this Controller and Components connected to it.
     * @param {ColormapSetting} value The new setting value
     * @param {Component} source The component initiating the change. (If you're calling this method
     * from a Component, then make this `this`). 
     * @param {*} decoration Any additional data to pass along to other Components
     */
    updateColormap = (value, source, decoration) => {
        this.settings.colormap = value;
        this._triggerEvent('colormapChanged', 'onColormapChanged', false, value, {decoration, source});
    }

    /**
     * Trigger an update to the `showUnmappedSegments` setting on this Controller and Components connected to it.
     * @param {UnmappedSetting} value The new setting value
     * @param {Component} source The component initiating the change. (If you're calling this method
     * from a Component, then make this `this`). 
     * @param {*} decoration Any additional data to pass along to other Components
     */
    updateShowUnmappedSegments = (value, source, decoration) => {
        this.settings.showUnmappedSegments = value;
        this._triggerEvent('showUnmappedSegmentsChanged', 'onShowUnmappedSegmentsChanged', false, value, {decoration, source});
    }

    /**
     * Trigger an update to the `backgroundColor` setting on this Controller and Components connected to it.
     * @param {BackgroundSetting} value The new setting value
     * @param {Component} source The component initiating the change. (If you're calling this method
     * from a Component, then make this `this`). 
     * @param {*} decoration Any additional data to pass along to other Components
     */
    updateBackgroundColor = (value, source, decoration) => {
        this.settings.backgroundColor = value;
        this._triggerEvent('backgroundColorChanged', 'onBackgroundColorChanged', false, value, {decoration, source});
    }

     /**
     * Trigger an update to the `cameraPosition` setting on this Controller and Components connected to it.
     * @param {Vector3Setting} value The new setting value
     * @param {Component} source The component initiating the change. (If you're calling this method
     * from a Component, then make this `this`). 
     * @param {*} decoration Any additional data to pass along to other Components
     */
    updateCameraPosition = (value, source, decoration) => {
        this.settings.cameraPos = value;
        this._triggerEvent('cameraPositionChanged', 'onCameraPositionChanged', false, value, {decoration, source});
    }

    /**
     * Trigger an update to the 'centerPosition' setting on this Controller and the Components connected to it.
     * @param {Vector3Setting} value The new setting value
     * @param {Component} source The component initiating the change. (If you're calling this method
     * from a Component, then make this `this`). 
     * @param {*} decoration Any additional data to pass along to other Components
     */
    updateCenterPosition = (value, source, decoration) => {
        this.settings.centerPos = value;
        this._triggerEvent('centerPositionChanged', 'onCenterPositionChanged', false, value, {decoration, source});
    }

    /**
     * Trigger an update to the 'contactThreshold' setting on this Controller and the Components connected to it.
     * @param {ThresholdSetting} value The new setting value 
     * @param {Component} source The component initiating the change. (If you're calling this method
     * from a component, then make this `this`). 
     * @param {*} decoration Any additional data to pass along to other Components
     */
    updateContactThreshold = (value, source, decoration) => {
        this.settings.contactThreshold = value;
        this._triggerEvent('contactThresholdChnaged', 'onContactThresholdChanged', false, value, {decoration, source});
    }

    /**
     * Add a new track based on the current selection and variable. Will trigger the tracksChanged
     * event / handlers
     * @param {Component} source The component initiating the change. (If you're calling this method
     * from a Component, then make this `this`). 
     * @param {*} decoration Any additional data to pass along to other Components
     */
    async addNewTrack(source, decoration) {
        const locRanges = this.selection.asLocations();
        
        // Add a track for every range
        for (let range of locRanges) {
            // Skip a range of just one value
            if (range[0] === range[1]) continue;

            this.tracks.push({
                locationRange: range,
                variable:     this.settings.variable
            });
        }

        this._triggerEvent('tracksChanged', 'onTracksChanged', false, this.tracks, {decoration, source});
    }

    /**
     * Clear all of the variable tracks
     * @param {Component} source The component initiating the change. (If you're calling this method
     * from a Component, then make this `this`). 
     * @param {*} decoration Any additional data to pass along to other Components
     */
    clearTracks(source, decoration) {
        this.tracks = [];
        this._triggerEvent('tracksChanged', 'onTracksChanged', false, this.tracks, {decoration, source});
    }

    /**
     * Serialize this Controller's settings to a base64url-encoded JSON string. You can restore these
     * settings into a new Controller with the `deserialize` method.
     * @returns 
     */
    serialize() {
        const s = this.settings;
        return UTIL.objToBase64url({
            selection: this.selection === null ? null : this.selection.asPlainObject(),
            settings: {
                variable:  s.variable,
                colormap:  s.colormap,
                cameraPos: s.cameraPos,
                centerPos: s.centerPos,
                showUnmappedSegments: s.showUnmappedSegments,
                backgroundColor:      s.backgroundColor,
                contactThreshold:     s.contactThreshold
            },
            tracks:    this.tracks,
        });
    }

    /**
     * Restore settings from a base64url-encoded JSON string, as returned by the `serialize` method.
     * This will set all of the settings and the selection to that of the previously-serialized
     * Controller, triggering events and hdndlers for each one.
     * @param {String} str 
     */
    deserialize(str) {
        const from = UTIL.base64urlToObj(str);

        if (from.selection)
            this.selection = Selection.fromPlainObject(from.selection);

        this.settings = from.settings;

        // Update tracks
        this.tracks = from.tracks;

        this.triggerAll();
    }

    /**
     * Trigger all event handlers with the current state of the Controller
     */
    triggerAll() {
        this.updateSelection(this.selection);

        this.updateVariable( this.settings.variable );
        this.updateColormap( this.settings.colormap );
        this.updateCameraPosition( this.settings.cameraPos );
        this.updateCenterPosition( this.settings.centerPos );
        this.updateShowUnmappedSegments( this.settings.showUnmappedSegments );
        this.updateBackgroundColor( this.settings.backgroundColor );

        this._triggerEvent('tracksChanged', 'onTracksChanged', false, this.tracks, {});
    }

    /**********************
     * PRIVATE METHODS
    ***********************/

    /**
     * Register a new component.
     * You typically don't want to call this directly. Instead, use a Components 'setController'
     * method.
     * @param {Component} component 
     * @returns 
     */
     _registerComponent(component) {
        // Don't re-register an already registered component
        if (this.components.includes(component)) return;

        this.components.push(component);
    }

    /**
     * Remove a component.
     * You typically don't want to call this directly. Instead, use a Components 'setController'
     * method (with a null value, if you don't want to set a new controller for the component).
     * @param {Component} component 
     */
    _unregisterComponent(component) {
        this.components = this.components.filter( (c) => c !== component );
    }

    /**
     * Emit an event and trigger associated handlers on all registered components.
     * @param {String} name event name
     * @param {String} handlerName name of handler method on Components
     * @param {Boolean} debounced Whether or not this is the result of event debouncing. If this is
     * false, then the debouncer for this event name will be started/reset.
     * @param {*} value Value of the new setting/selection
     * @param {Object} options event options
     */
    _triggerEvent(name, handlerName, debounced, value, options) {
        // Add name to options
        const opts = { ...options, type: name, debounced }

        // Emit event
        this.emit(name, value, opts);
        this.emit('anyChanged', value, opts);

        // Call handler for every component that has a handler method
        this.components
            .filter ( (c) => typeof c[handlerName] === 'function' )
            .forEach( (c) => {
                c[handlerName](value, opts); 
            });

        // If this isn't from a debounced event, then start a debouncer for this event
        if (!debounced) {
            // Create a new debouncer function if we haven't made one for this event yet
            if (!this._debouncers[name]) {
                this._debouncers[name] = this._makeDebouncer(name, handlerName);
            }
            // Start/reset debouncer
            this._debouncers[name](value, options);
            this._debouncers.any(value, options);
        }

    }

    /**
     * Make a debounced function that, when it triggers, will call triggerEvent with
     * the specified event name and handler name.
     */
    _makeDebouncer(name, handlerName) {
        return debounce( (value, options) => {
            this._triggerEvent(name, handlerName, true, value, options); 
        }, 500);
        // ^^^ (that's 500 milliseconds)
    }
}

module.exports = Controller;
