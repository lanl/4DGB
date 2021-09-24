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

const ArrowSegment = require('./ArrowSegment');
const SegmentState = require('./Segment');

class Model {
    /**
     * Class Model
     *
     * Model is a representation of the geometry for a set of segments
     * The specific representation of a segment is controlled in the representation
     * object for the segments.
     *
     */

    /*
     * constructs an instance, give input parameters
     *
     * @param {dictionary} s This is a dictionary of values used to construct the Model
     */
    constructor( s ) {
        // scene
        this.scene;

        // geometry
        this.root       = new THREE.Group();
        this.centroid   = new THREE.Vector3(0.0, 0.0, 0.0);
        this.geometry   = "";
        this.varname    = "";
        this.varThreshold = {}; 
        this.interval   = parseInt(s["attributes"]["interval"]);

        // TODO: these should be eliminated
        var g = s["segment"]["glyph"]
        ArrowSegment.EndpointRadius = g["endpoint"]["radius"]; 
        ArrowSegment.GeomEndpoint   = new THREE.SphereBufferGeometry( g["endpoint"]["radius"], 
                                                                        g["endpoint"]["segments"], 
                                                                        g["endpoint"]["segments"] );
        ArrowSegment.GhostOpacity   = g["ghost"]["opacity"];
        ArrowSegment.RadiusBegin    = g["span"]["radius-beg"];
        ArrowSegment.RadiusEnd      = g["span"]["radius-end"];

        // colors
        this.colorHL = new THREE.Color(parseInt(s["colormap"]["highlight-color"])); 

        // other
        this.segments = [];
        this.LUT = new THREE.Lut( s["colormap"]["name"], s["colormap"]["divs"] );
        this.opacityClamp = s["colormap"]["opacity-clamp"]
    }

    // sets the state of a list of segments. Two values are needed:
    // the first is the state to set all segments in the list, and the second 
    // is the state to set all others to
    //
    // @param {list}  segments   A list of segment IDs
    // @param {state} setState   The state to set the IDs to
    // @param {state} unsetState The state to set all other IDs to 
    //
    // NOTE: segments coming in are 1-indexed, and as we
    // iterate through, we are comparing to a 0-indexed array 
    //
    // in addition, we are not showing the first segment (simply
    // because of the decision of "where is the previous point")
    // that comes up ... will fix
    //
    // the result is the length is off by one, which we compensate for
    //
    setSegmentStates( segments, setState, unsetState ) {
        // compensating for not having the first segment
        var len = this.segments.length + 1;
        for (var i = 0; i < this.segments.length; i++) {
            // compensate for the off-by-one between array
            // and segment ID, AND the first point not being
            // in the array
            if (segments.includes(i+2)) {
                this.segments[i].setState(setState);
            } else {
                this.segments[i].setState(unsetState);
            }
        }
    }

    setSegmentVisible( segments, mapped ) {
        // compensating for not having the first segment
        var len = this.segments.length + 1;
        for (var i = 0; i < this.segments.length; i++) {
            // compensate for the off-by-one between array
            // and segment ID, AND the first point not being
            // in the array
            if (segments.includes(i+2)) {
                this.segments[i].setVisible(mapped);
            }
        }
    }

    setSegmentVisible(segment, v) {
        if (segment > 1) {
            var seg = this.segments[segment - 2];
            seg.setVisible(v);
        }
    }

    //
    // input is an array of two ints
    //
    getSegmentsForLocationRange( IDs ) {
        var start = Math.ceil(IDs[0]/this.interval);
        var end   = Math.ceil(IDs[1]/this.interval);
        var size  = parseInt(end - start); 
        var segments = [];
        if (size == 0) {
            // begin and end are the same, and we need at least one
            segments.append(start);
        } else {
            // special case: endpoint was on a segment boundary
            if (start*this.interval == IDs[0]) {
                for (var i=1; i < size+1; i++) {
                    segments[i] = start + i;
                }
            } else {
                for (var i=0; i < size+1; i++) {
                    segments[i] = start + i;
                }
            }
        }
        return segments;
    }

    setValueThreshold(varname, threshold) {
        this.varThreshold[varname] = threshold;
        this.updateSegmentValueThreshold();
    }

    updateSegmentValueThreshold() {
        var numSegments = this.segments.length; 
        var live = [];
        for (var i = 0; i < numSegments; i++) {
            var curval = this.segments[i].getAttributeValue(this.varname);
            if ((curval != null) && (curval >= this.varThreshold[this.varname])) {
                live.push(i);
            }
        }

        this.setSegmentStates( live, SegmentState.LIVE, SegmentState.GHOST );
    }

    setVisible(v) {
        this.root.visible = v;
    }

    getNumSegments() {
        return this.segments.length;
    }

    getSegment(id) {
        return this.segments[id];
    }

    setLUTParameters( min, max )
    {
        this.LUT.setMin(min);
        this.LUT.setMax(max);
    }

    colorBy( varname, values ) {
        this.varname = varname;
        for (var i = 0; i < this.segments.length; i++) {
            this.segments[i].setAttributeValue( this.varname, values[i] ); 
            this.segments[i].setColor(this.LUT.getColor(values[i]));
        }
    }

    //
    // highlight
    //
    highlightSegment( id ) {
        this.segments[id].pushColor( this.colorHL );
    }

    // loads the geometry into the scene provided
    load(geometry, scene, caller) { 
        this.scene = scene;
        this.scene.add(this.root);
        this.geometry = geometry;

        // load data
        var x = 0.0;
        var y = 0.0;
        var z = 0.0;
        var points = [];
        this.loadData((response) => {
            let lines = response.split("\n");

            lines.forEach((element) => {

                // parse each line, knowing what the format of a PDB file is 
                if (element.startsWith("ATOM")) {
                    let idData = element.split(/[ ]+/);
                    // strip off the first part of the string, so we can parse it with spaces
                    let elementData = element.substring(27);
                    // create a point here
                    let aData = elementData.split(/[ ]+/);
                    // These indices are brittle - based on the above split
                    let centerPoint = new THREE.Vector3(aData[1], aData[2], aData[3]);
                    x = x + parseFloat(aData[1]);
                    y = y + parseFloat(aData[2]);
                    z = z + parseFloat(aData[3]);

                    // keep track of these
                    points.push(centerPoint);
                }
            })

            // compute centroid
            this.makeSegments(points, this.spanRadiusBeg, this.spanRadiusEnd);
            this.centroid.set( x/this.segments.length, y/this.segments.length, z/this.segments.length );
            
            caller.postLoad(caller);
            caller.render();
        });
    }

    //
    // callback after load
    //
    loadData(callback) {
        const xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', this.geometry, true);
        xobj.onreadystatechange = function() {
            if (xobj.readyState == 4 && (xobj.status == 0 || xobj.status == 200)) {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    }

    //
    // create 3D geometry between all points in an array
    //
    makeSegments( points, rBeg, rEnd ) {
        var numSegments = points.length; 

        // remember to make the first segment - it is a special case
        // TODO: make sure the IDs are correct
        for (var i = 1; i < numSegments; i++) {
            const newSeg = new ArrowSegment(i+1, points[i-1], points[i], ArrowSegment.RadiusBegin, ArrowSegment.RadiusEnd); 
            newSeg.addToParent(this.root);
            this.segments.push(newSeg);
        }
    }

}

module.exports = Model;
