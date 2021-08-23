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
        this.locations  = [];
        this.genes      = [];
        this.segments   = [];
        this.curSelector = "";
    }

    setGenes( values ) {
        this.curSelector = Selection.Selector.GENES;
        this.genes = values;
        this.updateLocations();
        this.updateSegments();

        super.emit("selectionChanged", this);
    }

    setLocations( values ) {
        this.curSelector = Selection.Selector.LOCATIONS;
        this.locations = values;
        this.updateGenes();
        this.updateSegments();

        super.emit("selectionChanged", this);
    }

    setSegments( values ) {
        this.curSelector = Selection.Selector.SEGMENTS;
        this.segments = values;
        this.updateGenes();
        this.updateLocations();

        super.emit("selectionChanged", this);
    }


    updateGenes() {
        if (this.curSelector == Selection.Selector.LOCATIONS) {
            this.genes = "locations";
            var vlist = this.getListOfLocations();

            for (const v of vlist) {
            }

        } else if (this.curSelector == Selection.Selector.SEGMENTS) {
            this.genes = "segments";
        } else {
            // do nothing, because this type is the selector
            // TODO: determine if this is an error
        }
    }

    updateLocations() {
        if (this.curSelector == Selection.Selector.GENES) {
            this.locations = "genes";
        } else if (this.curSelector == Selection.Selector.SEGMENTS) {
            this.locations = "segments";
        } else {
            // do nothing, because this type is the selector
            // TODO: determine if this is an error
        }
    }

    updateSegments() {
        if (this.curSelector == Selection.Selector.LOCATIONS) {
            this.segments = "locations";
        } else if (this.curSelector == Selection.Selector.GENES) {
            this.segments = "genes";
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
        return this.valStringToListOfValues( this.segments );
    }

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

    valStringToListOfRanges( value ) {
        var cleaned = value.replace(/\s/g, "");
        var vsplit  = cleaned.split(",");

        var values = [];
        var step = 1;
        for (var i=0; i < vsplit.length; i++) {

            var hsplit = vsplit[i].split("-");
            if (hsplit.length == 2) {
                var start = parseInt(hsplit[0]);
                var end   = parseInt(hsplit[1]);
                values = values.concat(start + ", " + end)
            } else {
                var cur = parseInt(vsplit[i]);
                values.push(cur + ", " + cur)
            }
        }

        return values;
    }

}

module.exports = Selection;
