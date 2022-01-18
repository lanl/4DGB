const EventEmitter = require('events');

const Controller = require('./Controller');
const {Selection} = require('./selections');

/**
 * Component is a base class holding any common functionality or APIs between the various widgets
 * used in applications.
 * 
 * This class will probably expand over time, but for now it mostly just defines methods for
 * interacting with a Controller instance.
 */
class Component extends EventEmitter {

    /**
     * Component base constructor.
     */
    constructor() {
        super();

        /** @type {Controller} The controller  */
        this.controller;

        // Components start with a "default" controller that only they are a part of.
        this.setController( new Controller() );

    }

    /**
     * Set a new Controller for this component. If this component is already registered
     * to a controller, it will be de-registered from the old one.
     * 
     * Calling this no parameters will de-register the old controller without registering a new one,
     * leaving this component controller-less.
     * @param {Controller?} controller 
     */
    setController(controller) {
        if (this.controller)
            this.controller._unregisterComponent(this);

        if (controller)
            controller._registerComponent(this);
    
        this.controller = controller;
    }

    /**********************
     * Default Settings Handlers
     * (which do nothing)
    ***********************/

    /**
     * @typedef {Object} EventOptions Options object that the Controller passes along with every event
     * @property {Component} source The Component that triggered the event
     * @property {boolean} debounced If this is the delayed ("debounced") call for this event
     * @property {*} decoration Additional data attached to this event by the source Component
     * @property {String} type The name of the event
     */

    /**
     * Called in response to a selectionChanged event in the Controller
     * @param {Selection} selection 
     * @param {EventOptions} options
     */
    onSelectionChanged(selection, options) {}

    /**
     * Called in response to a tracksChanged event in the Controller
     * @param {TrackSpec[]} tracks 
     * @param {EventOptions} options 
     */
    onTracksChanged(tracks, options) {}

    /**
     * Called in response to a variableChanged event in the Controller
     * @param {VariableSetting} value
     * @param {EventOptions} options 
     */
    onVariableChanged(value, options) {}

    /**
     * Called in response to a colormapChanged event in the Controller
     * @param {ColormapSetting} value
     * @param {EventOptions} options 
     */
     onColormapChanged(value, options) {}

     /**
     * Called in response to a showUnmappedSegmentsChanged event in the Controller
     * @param {UnmappedSetting} value
     * @param {EventOptions} options 
     */
    onShowUnmappedSegmentsChanged(value, options) {}

    /**
     * Called in response to a backgroundColorChanged event in the Controller
     * @param {BackgroundSetting} value
     * @param {EventOptions} options 
     */
    onBackgroundColorChanged(value, options) {}

     /**
      * Called in response to a cameraPositionChanged event in the Controller
      * @param {CameraSetting} value 
      * @param {EventOptions} options 
      */
    onCameraPositionChanged(value, options) {}

    /**
     * Called in response to a centerPositionChanged event in the Controller
     * @param {CenterPosition} value 
     * @param {EventOptions} options 
     */
    onCenterPositionChanged(value, options) {}

}

module.exports = Component;
