/**
 * selections - Classes for managing Genome Selections
 * 
 * A key feature of the 4D Genome Browser is Selections: A subset of the entire gene sequence
 * selected by the user. A selection comprises one or more continous regions of base pairs
 * along the sequence, and can be represented in any of three units:
 * 
 *      - "Locations": The indices of individual base pairs making up the selection.
 *      - "Segments":  The indices of segments (sets of base pairs) making up the selection.
 *      - "Genes":     The names of genes contained within the selection
 * 
 * Locations and Segments are usually simple functions of one another since there is a constant
 * (per project) value representing how many locations there are per segment. For example, if there
 * are 1,000 base pairs in each segment, then a selection with locations 4000-6000 can be
 * represented as segments 4-6. Representation as Genes is more complicated since the definitions
 * of which genes map to which base pairs are stored server-side, so resolving the genes
 * a selection is made from requires an async fetch.
 * 
 * Of course, mapping between these units isn't always one-to-one. Segment or Gene values may
 * represent a slightly different selection than what's defined by the locatation values, as
 * segments will always be represented as whole numbers and genes are considered "selected" even if
 * only part of them is in the selected range.
 * 
 * This file/module defines a few classes and objects for dealing with selections:
 * 
 *      - UNIT: An enum describing the different unit types: LOCATION, SEGMENT, GENE.
 * 
 *      - Selection: An immutable object representing a selection. A selection can be constructed
 *                   by specifying any of the three units mentioned above. Once constructed, there
 *                   are methods to get the selection described in any of the three units.
 *
 *      - Controller: An event emitter/reciever which allows components to stay in sync with the
 *                    selections they make. For example, a Contact Map widget and Geometry widget
 *                    can both listen to the same instance of Controller so that a selection
 *                    being made on one will affect the other and vice-versa.
 *  
 */

const EventEmitter = require('events');

const debounce = require('debounce');

const Project = require('./Project');
const Client  = require('./Client');
const Util    = require('./Util');

/**********************
 * MODULE-PRIVATE STUFF
***********************/

/** Selection's constructor keeps itself private by requiring this module-private object */
const CONSTRUCTOR_PASS = { foo: "phooey!" };

/*####################################
  #
  #    UNIT ENUM
  #
  ###################################*/

/**
 * Enum specifying the different units that selections can be represented in.
 */
const UNIT = Object.freeze({
    LOCATION: 0,
    SEGMENT:  1,
    GENE:     2
});

/*####################################
  #
  #    SELECTION
  #
  ###################################*/

/**
 * Represents a selection on the gene sequence.
 * 
 * A new selection can be created from any of the static methods `fromLocations`, `fromSegments` or
 * `fromGenes` by giving them the selection defined in appropriate units. Since resolving genes
 * to locations requires a fetch, `fromGenes` is async, while the others are normal.
 * 
 * The value of a selection can be obtained in any of the three units using the methods
 * `asLocations`, `asSegments`, and `asGenes`. Since 'genes' usually requires a fetch, `asGenes`
 * is async, while the others are normal.
 */
class Selection {

    /**
     * PRIVATE CONSTRUCTOR
     * @param {Object} pass - proof that only something in this module's scope can construct this
     * @param {UNIT} unit - The unit of the `values` param
     * @param {String[]|Int[][]} values - Location/Segment ranges or Gene names
     */
    constructor(pass, unit, values) {
        if (pass !== CONSTRUCTOR_PASS)
            throw new Error("Selection's constructor is private! Please use one of the static methods.");
        if (Project.TheProject === undefined)
            throw new Error("Selections cannot be created until the global 'Project.TheProject' has been set");
        if (Client.TheClient === undefined)
            throw new Error("Selections cannot be created until the global 'Client.TheClient' has been set");

        this._project = Project.TheProject;
        this._client  = Client.TheClient;

        /** @type {UNIT} The unit this selection was initially constructed from */
        this._constructedFrom = unit;

        /** 
         * @type {Promise<String[]>} A promise representing this selection's attempt
         * at fetching gene information from the server based on its location/segment information.
         * This won't start until someone calls `asGenes` for the first time.
         **/
        this._geneFetch;
        /**
         * @type {Promise<Int[][]>} A promise representing this selection's attempt
         * at fetching location/segment information from the server based on its gene information
         */
        this._segmentFetch;

        /**
         * @type {Int[][]} Selected segments ranges. If this selection was consturcted from a
         * list of genes, this and `_locationRanges` will be undefined until `_segmentFetch` returns.
         */
        this._segmentRanges;
        /**
         * @type {Int[][]} Selected location ranges. If this selection was consturcted from a
         * list of genes, this and `_segmentRanges` will be undefined until `_segmentFetch` returns.
         */
        this._locationRanges;

        /**
         * @type {String[]} Selected genes. If this selection was constructed from locations or
         * segments, this will be undefined until `_geneFetch` returns.
         */
        this._genes;

        // Populate data depending on the unit of the provided values
        let ranges;
        switch (unit) {
            case UNIT.LOCATION:
                ranges = Util.compressRanges(values);
                this._locationRanges = ranges;
                this._segmentRanges  = this._locationRangesToSegmentRanges(ranges);
                break;

            case UNIT.SEGMENT:
                ranges = Util.compressRanges(values);
                this._locationRanges = this._segmentRangesToLocationRanges(ranges);
                this._segmentRanges  = ranges;
                break;

            case UNIT.GENE:
                this._genes = Selection._dumbDeepClone(values);;
                break;
        }

    }

    /**
     * Create a new selection based off a list of location ranges, given as an array of arrays
     * specifying the start and end of each contiguous range of selected locations.
     * 
     * example:
     * 
     *      let sel = Selection.fromLocations([ [1000,2000], [4500,5000] ])
     * 
     * @param {Int[][]} ranges 
     * @returns {Selection}
     */
    static fromLocations(ranges) {
        return new Selection(CONSTRUCTOR_PASS, UNIT.LOCATION, ranges);
    }

    /**
     * Create a new selection based off a list of segment ranges, given as an array of arrays
     * specifying the start and end of each contiguous range of selected locations.
     * 
     * example:
     * 
     *      let sel = Selection.fromRanges([ [4,5], [10,15] ])
     * 
     * @param {Int[][]} ranges 
     * @returns {Selection}
     */
    static fromSegments(ranges) {
        return new Selection(CONSTRUCTOR_PASS, UNIT.SEGMENT, ranges);
    }

    /**
     * Create a new selection based off a list of genes, given as an array of strings. This returns
     * a promise that will resolve into the actual Selection.
     * @param {String[]} genes 
     * @returns {Promise<Selection>}
     */
    static async fromGenes(genes) {
        const selection = new Selection(CONSTRUCTOR_PASS, UNIT.GENE, genes);
        await selection._fetchLocationData();
        return selection;
    }

    /**
     * Get this selection as a list of location ranges, given as an array of arrays specifying
     * the start and end of each contigious range of selected locations.
     * 
     * example:
     * 
     *      selection.asLocations(); // returns [ [1000,2000], [4500,5000] ]
     * 
     * @returns {Int[][]}
     */
    asLocations() {
        if (this._locationRanges === undefined) {
            // This should never happen unless a user is mucking around with the non-public
            // interface, because a Selection can only be in this state if it was created from
            // Genes, and the fromGenes constructor doesn't resolve until the fetch for
            // location/segment data has completed.
            throw new Error("Selection missing location data!")
        }
        return Selection._dumbDeepClone(this._locationRanges);
    }

    /**
     * Get this selection as a list of location ranges, given as an array of arrays specifying
     * the start and end of each contigious range of selected locations.
     * 
     * example:
     * 
     *      selection.asSegments(); // returns [ [4,5], [10,15] ]
     * 
     * @returns {Int[][]}
     */
    asSegments() {
        if (this._segmentRanges === undefined) {
            // This should never happen unless a user is mucking around with the non-public
            // interface, because a Selection can only be in this state if it was created from
            // Genes, and the fromGenes constructor doesn't resolve until the fetch for
            // location/segment data has completed.
            throw new Error("Selection missing segment data!")
        }
        return Selection._dumbDeepClone(this._segmentRanges);
    }

    /**
     * Get this selection as a list of selected genes, given as an array of strings. Returns a
     * promise that resolves to the actual list of genes. This will usually cause a fetch to happen
     * the first time this is called on a new selection.
     * @returns {Promise<String[]>}
     */
    async asGenes() {
        if (this._genes !== undefined)
            return Selection._dumbDeepClone(this._genes);
        
        await this._fetchGeneData();
        return Selection._dumbDeepClone(this._genes);
    }

    /**
     * Fetch gene information based on this selection's segment information and set `_genes`
     * once complete.
     */
    async _fetchGeneData() {
        
        // If a fetch is already underway, just wait for that one to finish
        // otherwise, start a new one
        if (this._geneFetch === undefined) {
            // How we get the gene data depends on the unit this selection was created with
            switch (this._constructedFrom) {
                case UNIT.LOCATION:
                    // Fetch with Client.get_genes_for_locations
                    const locationRanges = Util.rangesToRangeString(this._locationRanges);
                    this._geneFetch = new Promise( (resolve,reject) => {
                        try { this._client.get_genes_for_locations( resolve, 0, locationRanges ); }
                        catch (err) { reject(err); }
                    });
                    break;

                case UNIT.SEGMENT:
                    // Fetch with Client.get_genes_for_segments
                    const segmentRanges = Util.rangesToRangeString(this._segmentRanges);
                    this._geneFetch = new Promise( (resolve,reject) => {
                        try { this._client.get_genes_for_segments( resolve, 0, segmentRanges ); }
                        catch (err) { reject(err); }
                    });
                    break;

                case UNIT.GENE:
                    // This shouldn't happen, but whatever. We have the gene data already anyway
                    this._geneFetch = new Promise( (resolve) => resolve(this._genes) );
                    break;
            }
        }

        const res = await this._geneFetch;
        this._genes = res['genes'];
    }

    /**
     * Fetch segment information based on this selection's gene information and set
     * `_segmentRanges` and `_locationRanges` once complete.
     */
    async _fetchLocationData() {
        const geneNames = this._genes.join(',');

        this._segmentFetch = this._segmentFetch || new Promise( (resolve, reject) => {
            try { this._client.get_segments_for_genes( resolve, 0, geneNames); }
            catch (err) { reject(err); }
        });

        const res = await this._segmentFetch;
        const ranges = Util.compressRanges( Util.valuesToRanges(res['segments']) );
        this._segmentRanges = ranges;
        this._locationRanges = this._segmentRangesToLocationRanges(ranges);
    }

    _locationRangesToSegmentRanges(ranges) {
        const interval = this._project.getInterval();
        return ranges.map( ([start,end]) => {
            const span = end - start;
            const segments = [ Math.ceil(start/interval), Math.ceil(end/interval)];

            // the first part of the range is on a boundary
            if (segments[0]*interval === start) {
                if      ( span === interval ) segments[0] = segments[1]; // the location range is a single segment
                else if ( span >   interval ) segments[0]++;
            }

            return segments;
        });
    }

    _segmentRangesToLocationRanges(ranges) {
        const interval = this._project.getInterval();
        return ranges.map( ([start,end]) => [ Math.floor(start-1)*interval, Math.floor(end)*interval] );
    }

    //
    // given a segment range, return the location range that
    // encompasses it
    //
    getLocationRangeForSegmentRange( sRange ) {
        var start = (sRange[0]-1)*this.HACKInterval; 
        var end   = sRange[1]*this.HACKInterval; 

        return [start, end]
    }

    //
    // given a location range, return the segment range that
    // encompasses it
    //
    getSegmentRangeForLocationRange( lRange ) {
        var start = Math.ceil(lRange[0]/this.HACKInterval);
        var end   = Math.ceil(lRange[1]/this.HACKInterval);
        var span  = lRange[1] - lRange[0];

        var segments = [start, end];

        // the first part of the range is on a boundary
        if ( (start*this.HACKInterval == lRange[0]) ) {
            if (span == this.HACKInterval) {
                // the location range is a single segment
                segments = [end, end]
            } else if (span > this.HACKInterval) {
                segments = [start + 1, end]
            }
        }

        return segments; 
    }

    /**
     * A deep-clone for Selection data. Only works on "simple" objects. i.e. no functions, DOM
     * elements, etc.
     */
    static _dumbDeepClone(obj) {
        // Pretty silly, but it keeps us from having to import lodash just to use, like, one function
        return JSON.parse( JSON.stringify(obj) );
    }

}

/*####################################
  #
  #    CONTROLLER
  #
  ###################################*/

/**
 * An EventEmitter used to control multiple components that wish to keep their selections in-sync
 * with one-another. This will emit the event 'selectionChanged', providing an object with the
 * following fields:
 *
 * - `selection`: The new Selection
 * - `source`: The Object that triggered the change. i.e. The object that calls `updateSelection`.
 * Typically, a listener will check to see if this is the same as itself and then ignore the event.
 * - `decoration`: Any other object that a caller chooses to attach when updating the selection.
 * - `type`: The string 'selectionChanged'
 * 
 * In cases where the selection will change rapidly (like a user click-and-dragging), you may not
 * want to respond to every event. For this purpose, the controller also emits a `selectionDebounced`
 * event. This will have the exact same object as an argument as a previous `selectionChanged'
 * event, but will only trigger after a short interval if this controller's selection isn't changed
 * during that interval.
 * 
 */
class Controller extends EventEmitter {

    constructor() { super(); }

    /**
     * Update this controller's selection, triggering a 'selectionChanged' event.
     * @param {Selection|Promise<Selection>} selection - The new selection, or a promise
     * that resolves to it.
     * @param {*} source - The object that's calling this
     * @param {*} decoration - Anything else you might want the other components to know about.
     * This is passed along with the triggered event.
     */
    updateSelection(selection, source, decoration) {
        if (selection instanceof Promise) {
            // If selection is actually a promise, wait for it to resolve before
            // emitting event
            selection.then( (sel) => {
                const event = { selection: sel, source, decoration, type: 'selectionChanged' };
                this.emit('selectionChanged', event);
                this.sendDebounced(event);
            });
        }
        else {
            // Otherwise, be normal
            const event = { selection, source, decoration, type: 'selectionChanged' };
            this.emit('selectionChanged', event);
            this.sendDebounced(event);
        }
    }

    sendDebounced = debounce( (event) => this.emit('selectionDebounced', event), 500 );
                                                                              // ^^^- milliseconds
}

module.exports = { Selection, Controller, UNIT };