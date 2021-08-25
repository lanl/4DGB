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

class Selection extends EventEmitter {

    static Selector = {
        GENES:      'genes',
        LOCATIONS:  'locations',
        SEGMENTS:   'segments'
    };

    constructor() {
        super();

        this.resetSelection();
        this.client = "";
        this.testID = 0;
    }

    // an id that makes testing easier
    setTestID ( test ) {
        this.testID = test;
    }

    setHACKInterval( interval ) {
        // TODO: design a better way for everything to get the interval
        this.HACKInterval = interval;
    }

    setClient( client ) {
        this.client = client;
    }

    setSelector( name ) {
        if (name in Selection.Selector) {
            this.curSelector = name;
        } else {
            throw "Invalid Selection Type: " + name;
        }
    }

    resetSelection () {
        this.locations  = "";
        this.genes      = ""; 
        this.segments   = ""; 
        this.curSelector = "";
    }

    setGenes( values ) {
        this.curSelector = Selection.Selector.GENES;
        this.genes = values;
            // emits signal
        this.updateSegments();
        // locations are updated in the segments call
        // this.updateLocations();
    }

    // complete
    setLocations( values ) {
        this.resetSelection();
        this.curSelector = Selection.Selector.LOCATIONS;
        this.locations = values;
        this.updateSegments();
            // emits signal
        this.updateGenes();
    }

    // next
    setSegments( values ) {
        this.curSelector = Selection.Selector.SEGMENTS;
        this.segments = values;
        this.updateLocations();
            // emits signal
        this.updateGenes();
    }

    //
    // update, based on which attribute is the selector
    //
    updateGenes() {
        if (this.curSelector == Selection.Selector.LOCATIONS) {
            this.genes = "";
            this.client.get_genes_for_locations( (response) => {
                                            for (var s of response['genes']) {
                                                this.genes = this.genes.concat(s, ",");
                                            }
                                            // remove the last comma
                                            this.genes = this.genes.slice(0, -1);

                                            super.emit("selectionChanged", this);
                                          }, 0, this.locations );

        } else if (this.curSelector == Selection.Selector.SEGMENTS) {
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
        if ((this.curSelector == Selection.Selector.GENES) || (this.curSelector == Selection.Selector.SEGMENTS)) {
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
        if (this.curSelector == Selection.Selector.LOCATIONS) {
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

        } else if (this.curSelector == Selection.Selector.GENES) {
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
        return this.valStringToListOfRanges( this.locations );
    }

    // from the list of ranges, construct an expanded list of elements 
    getListOfSegments() {
        return this.valStringToListOfRanges( this.segments );
    }

    //
    // expand any ranges into individual values and make one big list
    //
    // for example, "1,2-5,10" would become [1,2,3,4,5,10]
    //
    valStringToListOfValues( value ) {
        var cleaned = value.replace(/\s/g, "");
        var vsplit  = cleaned.split(",");

        var values = [];
        var step = 1;
        for (var i=0; i < vsplit.length; i++) {

            var hsplit = vsplit[i].split("-");
            if (hsplit.length == 2) {
                var start = parseInt(hsplit[0]);
                var end   = parseInt(hsplit[1]);
                var range = [...Array(end - start + 1)].map((_, i) => start + i);
                values = values.concat(range);
            } else {
                values.push(parseInt(vsplit[i]));
            }
        }

        return values;
    }

    //
    // expand a string to a list of ranges
    //
    // if a value is a single number, make that a range
    //
    // for example: "1,2-5,10" becomes [[1,1], [2,5], [10,10]]
    //
    valStringToListOfRanges( value ) {
        var cleaned = value.replace(/\s/g, "");
        var vsplit  = cleaned.split(",");

        var values = [];
        var step = 1;
        for (var i=0; i < vsplit.length; i++) {
            values.push( this.valStringToRange(vsplit[i]) );
        }

        return values;
    }

    //
    // expand a string to a list of string ranges
    //
    // if a value is a single number, make that a range
    //
    // for example: "1,2-5,10" becomes [["1-1"], ["2-5"], ["10-10"]]
    //
    valStringToListOfRanges( value ) {
        var cleaned = value.replace(/\s/g, "");
        var vsplit  = cleaned.split(",");

        var values = [];
        var step = 1;
        for (var i=0; i < vsplit.length; i++) {
            values.push( this.valStringToRange(vsplit[i]) );
        }

        return values;
    }

    //
    // convert a string to a range
    //
    // - "8"    becomes [8,8]
    // - "8-10" becomes [8,10]
    //
    valStringToRange( value ) {
        var values = []

        var hsplit = value.split("-");
        if (hsplit.length == 2) {
            values = [parseInt(hsplit[0]), parseInt(hsplit[1])];
        } else {
            values = [parseInt(value), parseInt(value)]
        }

        return values; 
    }

    //
    // convert a string to a range string
    //
    // - "8"    becomes "8-8"
    // - "8-10" remains "8-10"
    //
    valStringToRangeString( value ) {
        var values = []

        var hsplit = value.split("-");
        if (hsplit.length == 2) {
            values = value 
        } else {
            values = [value + "-" + value]
        }

        return values; 
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

    //
    // compress a list of the form [["8-8"], ["12-25"], ["20-29"]]
    // to [ 8, '12-29' ]
    //
    // from: https://stackoverflow.com/questions/42093036
    //
    compressListOfRanges( ranges ) {
        var data = getListOfRangesFromString( ranges );
        result = data.reduce(function (r, a) {
            a.map(function (b) {
                var c = b.toString().split('-')
                c[1] = c[1] || c[0];
                r.push(c.map(Number));
            });
            return r;
        }, [])
        .sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; })
        .reduce(function (r, a) {
            var last = r[r.length - 1] || [];
            if (a[0] <= last[1] + 1) {
                if (last[1] < a[1]) {
                    last[1] = a[1];
                }
                return r;
            }
            return r.concat([a]);
        }, [])
        .map(function (a) {
            return a[0] === a[1] ? a[0] : a.join('-');
        });

        return result;
    }

}

module.exports = Selection;
