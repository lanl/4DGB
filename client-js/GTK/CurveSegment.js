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

const Segment = require('./Segment')

/*
 *
 * Class that manages a catmull-rom spline curve for a segment
 * 
 */
class CurveSegment extends Segment {

    constructor( ID, points, radius ) {
        super();
        const newMat = new THREE.MeshPhongMaterial({color: Segment.Color});

        // endpoint
        this.createEndpointMesh( points['2'], newMat );

        // span
        this.createSpanMesh( points, radius, newMat ); 

        // skeleton
        this.createSkeleton( points, newMat );

        // other
        this.length = points['1'].distanceTo(points['2']);
        this.visible = true;
    }

    //
    // create a catmull-rom curve 
    //
    createSpanMesh( points, radius, material) {
        var type        = "catmullrom";
        var closed      = false;
        var tension     = 1.0; 
        var numpoints   = 23;

        // copy the material
        var newMaterial = new THREE.LineBasicMaterial( {
	                color: Segment.Color,
	                linewidth: 5
        });

        // make the geometry
        var curve    = new THREE.CatmullRomCurve3( [ points['0'], points['1'], points['2'], points['3'] ], closed, type, tension ); 
        var cmPoints = curve.getPoints(numpoints);
        var p = this.findMidsection( cmPoints, points['1'], points['2'] );
        var buffGeom = new THREE.BufferGeometry().setFromPoints(p);
        this.spanMesh = new THREE.Line( buffGeom, newMaterial );

        this.root.add(this.spanMesh);
    }

    findMidsection( cmPoints, start, end ) { 
        var left = 0;
        var right = 0;
        var lDist = 1000000;
        var rDist = 1000000;
        for (var i=0;i<cmPoints.length; i++) {
            var lCurDist = cmPoints[i].distanceTo(start);
            var rCurDist = cmPoints[i].distanceTo(end);

            if (lCurDist < lDist) {
                lDist = lCurDist;
                left = i;
            }
            if (rCurDist < rDist) {
                rDist = rCurDist;
                right = i;
            }
        }

        if (left < right) {
            var results = [];
            results.push(start);
            for (var i=left;i<=right;i++) {
                results.push(cmPoints[i]);
            }
            results.push(end);
            return results;
        } else {
            return cmPoints;
        }
    }

    createSkeleton( points, newMat ) {
        const newPoints = [];
        newPoints.push(points['1'], points['2']);
        const geometry = new THREE.BufferGeometry().setFromPoints(newPoints);
        this.skeletonMesh = new THREE.Line( geometry, newMat ); 

        // initially, the skeleton is not visible
        this.skeletonMesh.visible = false;
        // this.root.add( this.skeletonMesh );
    }

}

module.exports = CurveSegment;
