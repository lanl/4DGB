/*
Copyright (c) 2021, Triad National Security, LLC. All rights reserved.
  
Redistribution and use in source and binary forms, with or
without modification, are permitted provided that the following conditions
are met:

    1. Redistributions of source code must retain the above copyright notice, 
       this list of conditions and the following disclaimer.

    2. Redistributions in binary form must reproduce the above copyright
       notice, this list of conditions and the following disclaimer in the
       documentation and/or other materials provided with the distribution.

    3. Neither the name of Los Alamos National Security, LLC, Los Alamos
       National Laboratory, LANL, the U.S. Government, nor the names of its
       contributors may be used to endorse or promote products derived from 
       this software without specific prior written permission.
    
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL LOS ALAMOS NATIONAL SECURITY, LLC OR CONTRIBUTORS 
BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE 
GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT 
LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const EventEmitter = require('events');
const Client = require('./Client');
const Util = require('./Util');

class Selection extends EventEmitter {

    static Selector = {
        NONE:       'none',
        GENES:      'genes',
        LOCATIONS:  'locations',
        SEGMENTS:   'segments'
    };
    static SelectorValues = ['none', 'genes', 'locations', 'segments'];

    constructor() {
        super();

        this._locations     = "";
        this._genes         = ""; 
        this._segments      = ""; 
        this._selector      = Selection.Selector.NONE; 
        this._client        = "";
        this._marker        = 0;
        this._HACKInterval  = 0;
    }

    // ----------------------------------------
    // set and get methods
    // ----------------------------------------
    set genes(value) {
        this._genes = value;
    }

    get genes() {
        return this._genes;
    }

    set locations(value) {
        this._locations = value;
    }

    get locations() {
        return this._locations;
    }

    set segments(value) {
        this._segments = value;
    }

    get segments() {
        return this._segments;
    }

    set marker( value ) {
        this._marker = value;
    }

    get marker() {
        return this._marker;
    }

    // TODO: design a better way for everything to get the interval
    set HACKInterval(value) {
        this._HACKInterval = value;
    }

    // TODO: design a better way for everything to get the interval
    get HACKInterval() {
        return this._HACKInterval;
    }

    set client(value) {
        this._client = value;
    }

    get client() {
        return this._client;
    }

    set selector(value) {
        if (Selection.SelectorValues.includes(value)) {
            this._selector = value;
        } else {
            throw "Invalid Selection Type: " + value;
        }
    }

    get selector() {
        return this._selector;
    }
    // ----------------------------------------
    // set and get methods
    // ----------------------------------------


    resetSelection () {
        this.locations  = "";
        this.genes      = ""; 
        this.segments   = ""; 
        this.selector   = Selection.Selector.NONE; 
    }

    selectGenes( values ) {
        // initialize
        this.resetSelection();

        this.selector = Selection.Selector.GENES;
        this.genes = values;
            // emits signal
        this.updateSegments();
        // locations are updated in the segments call
        // this.updateLocations();
    }

    selectLocations( values ) {
        // initialize
        this.resetSelection();

        this.selector = Selection.Selector.LOCATIONS;
        this.locations = values;
        this.updateSegments();
            // emits signal
        this.updateGenes();
    }

    selectSegments( values ) {
        // initialize
        this.resetSelection();

        this.selector = Selection.Selector.SEGMENTS;
        this.segments = values;
        this.updateLocations();
            // emits signal
        this.updateGenes();
    }

    //
    // update, based on which attribute is the selector
    //
    updateGenes() {
        if (this.selector == Selection.Selector.LOCATIONS) {
            this.genes = "";
            this.client.get_genes_for_locations( (response) => {
                                            for (var s of response['genes']) {
                                                this.genes = this.genes.concat(s, ",");
                                            }
                                            // remove the last comma
                                            this.genes = this.genes.slice(0, -1);

                                            super.emit("selectionChanged", this);
                                          }, 0, this.locations );

        } else if (this.selector == Selection.Selector.SEGMENTS) {
            this.genes = "";
            this.client.get_genes_for_segments( (response) => {
                                            for (var s of response['genes']) {
                                                this.genes = this.genes.concat(s, ",");
                                            }
                                            // remove the last comma
                                            this.genes = this.genes.slice(0, -1);

                                            super.emit("selectionChanged", this);
                                          }, 0, this.segments );
        } else {
            // do nothing, because this type is the selector
            // TODO: determine if this is an error
        }
    }

    //
    // update, based on which attribute is the selector
    //
    updateLocations() {
        if ((this.selector == Selection.Selector.GENES) || (this.selector == Selection.Selector.SEGMENTS)) {
            var segments = this.getListOfSegments();
            this.locations = "";
            for (var i=0; i < segments.length; i++) {
                var range = this.getLocationRangeForSegmentRange( segments[i] );
                this.locations = this.locations.concat( range[0].toString(), "-", range[1].toString(), "," );
            }
            // remove the last comma
            this.locations = this.locations.slice(0, -1);
            
        } else {
            // do nothing, because this type is the selector
            // TODO: determine if this is an error
        }
    }

    //
    // update, based on which attribute is the selector
    //
    updateSegments() {
        if (this.selector == Selection.Selector.LOCATIONS) {
            var locations = this.getListOfLocations();

            this.segments = ""; 
            for (var i=0; i < locations.length; i++) {
                var range = this.getSegmentRangeForLocationRange( locations[i] );
                if (range[0] == range[1]) {
                    // the range is a single value
                    this.segments = this.segments.concat( range[0].toString(), "," );
                } else {
                    // it is a range, so add a range
                    this.segments = this.segments.concat( range[0].toString(), "-", range[1].toString(), "," );
                }
            }
            // remove the last comma
            this.segments = this.segments.slice(0, -1);

        } else if (this.selector == Selection.Selector.GENES) {
            this.segments = ""; 
            this.client.get_segments_for_genes( (response) => {
                                            // var unique = Array.from(new Set(response['segments']));
                                            // for (var s of unique) { 
                                            for (var s of response['segments']) { 
                                                this.segments = this.segments.concat(s, ",");
                                            }
                                            // remove the last comma
                                            this.segments = this.segments.slice(0, -1);
                                            this.updateLocations();

                                            super.emit("selectionChanged", this);
                                          }, 0, this.genes );

        } else {
            // do nothing, because this type is the selector
            // TODO: determine if this is an error
        }
    }

    // parse the gene string to get a list of values 
    getListOfGenes() {
        var cleaned = this.genes.replace(/\s/g, "");
        var vsplit  = cleaned.split(",");

        // TODO: error check

        return vsplit; 
    }

    // from the list of ranges, construct an expanded list of elements 
    getListOfLocations() {
        return Util.rangeStringToRanges( this.locations );
    }

    // from the list of ranges, construct an expanded list of elements 
    getListOfSegments() {
        return Util.rangeStringToRanges( this.segments );
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

}

module.exports = Selection;
