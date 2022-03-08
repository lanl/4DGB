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
const THREE   = require('three')

/*
 *
 * Class that manages an arrow-like representation of a segment
 * 
 */
class ArrowSegment extends Segment {

    // class global settings
    // These are set in the Project constructor when it loads
    // since they are specified in the project configuration
    static RadiusEnd      = 0.0; 
    static RadiusBegin    = 0.0; 

    constructor( ID, points, radius ) {
        super(ID, points, radius);
        const newMat = new THREE.MeshPhongMaterial({color: Segment.Color});

        // endpoint
        this.createEndpointMesh( points['end'], newMat );

        // span
        this.createSpanMesh( points['start'], points['end'], radius['start'], radius['end'], newMat ); 

        // skeleton
        this.createSkeleton( points['start'], points['end'], newMat );

        // other
        this.length = points['end'].distanceTo(points['start']);
        this.colors = [];
        this.visible = true;
    }

    //
    // create a cylinder between two points
    //
    // online solution
    // https://stackoverflow.com/questions/15316127/three-js-line-vector-to-cylinder
    //
    // TODO: could simplify to take the id as a parameter 
    createSpanMesh( start, end, rBeg, rEnd, material) {
        var vec = start.clone();
        vec.sub(end);
        var height = vec.length();
        vec.normalize();
        var quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec);
        var geometry = new THREE.CylinderGeometry(rBeg, rEnd, height, 32);
        geometry.translate(0, height / 2, 0);

        var newMat = new THREE.MeshPhongMaterial({color: ArrowSegment.Color});
        newMat.copy(material);
        this.spanMesh = new THREE.Mesh(geometry, newMat);
        this.spanMesh.applyQuaternion(quaternion);
        this.spanMesh.position.set(end.x, end.y, end.z);
        this.spanMesh.name = "span";
        this.spanMesh.userData.id = this.ID;
        this.root.add(this.spanMesh);
    }

    createSkeleton( start, end, newMat ) {
        const points = [];
        points.push(start, end);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        this.skeletonMesh = new THREE.Line( geometry, newMat ); 
        // initially, the skeleton is not visible
        this.skeletonMesh.visible = false;
        this.root.add( this.skeletonMesh );
    }

}

module.exports = ArrowSegment;
