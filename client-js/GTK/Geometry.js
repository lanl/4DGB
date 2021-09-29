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

require('three/examples/js/math/Lut');

const ArrowSegment = require('./ArrowSegment');
const CurveSegment = require('./CurveSegment');
const Client = require('./Client');

class Geometry {
    /**
     * Class Geometry
     *
     * Geometry is a representation of the geometry for a set of segments
     * The specific representation of a segment is controlled in the representation
     * object for the segments.
     *
     */

    /*
     * constructs an instance, give input parameters
     *
     * @param {dictionary} s This is a dictionary of values used to construct the Geometry
     */
    constructor( g ) {
        // scene
        this.scene;

        // geometry
        this.root       = new THREE.Group();
        this.centroid   = new THREE.Vector3(0.0, 0.0, 0.0);
        this.geometry   = "";

        // other
            // this.segments is a dictionary because:
            // 1. the indices are not zero-based (they start at 1) 
            // 2. the indices may not be consecutive over the entire set of segments
        this.segmentType = g["segment"]["glyph"]["type"];
        this.segments = {};
        this.LUT = new THREE.Lut( g["colormap"]["name"], g["colormap"]["divs"] );
        this.opacityClamp = g["colormap"]["opacity-clamp"]
    }

    // sets the state of a list of segments. Two values are needed:
    // the first is the state to set all segments in the list, and the second 
    // is the state to set all others to
    //
    // @param {list}  segments   A list of segment IDs
    // @param {state} setState   The state to set the IDs to
    // @param {state} unsetState The state to set all other IDs to 
    //
    setSegmentStates( segments, setState, unsetState ) {
        for (const [key, value] of Object.entries(this.segments)) {
            if (segments.includes(parseInt(key))) {
                this.getSegment(key).setState(setState);
            } else {
                this.getSegment(key).setState(unsetState);
            }
        }
    }

    //
    // @param {list}  segments  A list of segment IDs
    // @param {state} state     The state to set the IDs to
    // 
    setSegmentVisible( segments, state ) {
        for (const s of segments) {
            if (s in this.segments) {
                this.segments[s].visible = state;
            }
        }
    }

    // 
    // set visibility of the entire geometry 
    // 
    setVisible(v) {
        this.root.visible = v;
    }

    getNumSegments() {
        return Object.keys(this.segments).length;
    }

    getSegment(id) {
        return this.segments[id];
    }

    // loads the geometry into the scene provided
    load(geometry, scene, caller) { 
        this.scene = scene;
        this.scene.add(this.root);
        this.geometry = geometry;

        // used to compute the centroid
        var center = new THREE.Vector3(0.0, 0.0, 0.0);

        Client.TheClient.get_structure( (response) => {
            if (this.segmentType == "arrow") {
                for (var s of response["segments"]) {

                    let points = {
                        'start': new THREE.Vector3(s['start'][0], s['start'][1], s['start'][2]),
                        'end'  : new THREE.Vector3(s['end'][0], s['end'][1], s['end'][2])
                    }
                    center.add(points['end']);
                    var radius = {
                        'start': ArrowSegment.RadiusBegin, 
                        'end'  : ArrowSegment.RadiusEnd 
                    }
                    const newSeg = new ArrowSegment(s['segid'], points, radius); 
                    newSeg.addToParent(this.root);
                    this.segments[s['segid']] = newSeg;
                }
            } else if (this.segmentType == "curve") {
                var segArray = {};
                // HACK: for now, make a new data structure that can be accessed with IDs
                for (var s of response["segments"]) {
                    segArray[s["segid"]] = s;
                }

                let defPoint = {
                    'start' : [0.0, 0.0, 0.0], 
                    'end'   : [0.0, 0.0, 0.0] 
                }
                let numSegs = Object.keys(segArray).length;
                for (var i=1;i<=numSegs;i++) {
                    let pSeg = defPoint; 
                    let cSeg = segArray[i];
                    let nSeg = defPoint; 
                    if ( i == 1 ) {
                        nSeg = segArray[i+1];
                    } else if (i == numSegs) { 
                        pSeg = segArray[i-1];
                        nSeg = defPoint; 
                    } else {
                        pSeg = segArray[i-1];
                        nSeg = segArray[i+1];
                    }

                    // gather the four points required by the C/R object
                    let points = {
                        '0' : new THREE.Vector3(pSeg['start'][0], pSeg['start'][1], pSeg['start'][2]),
                        '1' : new THREE.Vector3(cSeg['start'][0], cSeg['start'][1], cSeg['start'][2]),
                        '2' : new THREE.Vector3(cSeg['end'][0],   cSeg['end'][1],   cSeg['end'][2]),
                        '3' : new THREE.Vector3(nSeg['end'][0],   nSeg['end'][1],   nSeg['end'][2]),
                    }

                    center.add(points['1'])
                    const newSeg = new CurveSegment(i, points, CurveSegment.SegmentRadius); 
                    newSeg.addToParent(this.root);
                    this.segments[i] = newSeg;
                }
            } else {
                // TODO: report error
            }

            // compute centroid
            var numSegs = this.getNumSegments(); 
            this.centroid = center.divideScalar(numSegs);
            
            if (caller != "None") {
                caller.postLoad(caller);
            }
        }, this.geometry );
    }

    //
    // the 'values' array is zero-based, and the segments is ID-based
    //
    colorBy( values ) {
        var numsegs = this.getNumSegments();
        // iterate over all the segments, and color
        // note that this should not assume that the segment IDs increase 
        // linearly - all functions should be written to iterate over the ids, 
        // not a value for the id
        for (var i = 1; i <= numsegs; i++) {
            this.segments[i].setColor(this.LUT.getColor(values[i-1]));
        }
    }

    setLUT( name ) {
        var numdivs = 512;
        this.LUT.setColorMap( name, numdivs ); 
    }

    getLUT() {
        return this.LUT;
    }

    setLUTParameters( min, max )
    {
        this.LUT.setMin(min);
        this.LUT.setMax(max);
    }
}

module.exports = Geometry;
