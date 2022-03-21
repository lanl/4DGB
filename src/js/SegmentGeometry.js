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

import * as THREE from   '../node_modules/three/build/three.module.js';

class SegmentGeometry extends THREE.Group {

    static State = {
        LIVE: "live",
        GHOST: "ghost",
        SKELETON: "skeleton",
        DEAD: "dead"
    }

    static Color          = new THREE.Color(1.0, 0.5, 0.5); 
    static Material       = new THREE.MeshPhongMaterial({color: SegmentGeometry.Color});
    static EndpointRadius = 0.1; 
    static GeomEndpoint   = new THREE.SphereGeometry( SegmentGeometry.EndpointRadius, 8, 8 );
    static GhostOpacity   = 0.2;

    /*
     * s segment
     */
    constructor( s ) { 
        super();

        this._ID = s.ID;
        this._length = this.computeLength(s.start, s.end); 
        this._endpointMesh;
        this._spanMesh;
        this._skeletonMesh;
        this._state = SegmentGeometry.State.LIVE;

        this.createEndpointMesh( s.end, SegmentGeometry.Material );
        this.createSpanMesh( s.start, s.end, SegmentGeometry.Material );
    }

    // -------------------------------------------------------------------
    // BEGIN: get and set methods
    // -------------------------------------------------------------------
    set state(value) {
        this._state = value;
    }

    get state() {
        return this._state;
    }

    set endpointMesh(value) {
        this._endpointMesh = value;
    }

    get endpointMesh() {
        return this._endpointMesh
    }

    set spanMesh(value) {
        this._spanMesh = value;
    }

    get spanMesh() {
        return this._spanMesh;
    }

    set skeletonMesh(value) {
        this._skeletonMesh = value;
    }

    get skeletonMesh() {
        return this._skeletonMesh;
    }

    set id(value) {
        this._id = value;
    }

    get id() {
        return this._id
    }

    set length(value) {
        this._length = value;
    }

    get length() {
        return this._length
    }
    // -------------------------------------------------------------------
    // END: get and set methods
    // -------------------------------------------------------------------
    

    //
    // create a spherical endpoint
    //
    createEndpointMesh(center, material) {
        this.endpointMesh = new THREE.Mesh(SegmentGeometry.GeomEndpoint, material);
        this.endpointMesh.position.x = center.x;
        this.endpointMesh.position.y = center.y;
        this.endpointMesh.position.z = center.z;
        this.endpointMesh.updateMatrix();
        this.endpointMesh.matrixAutoUpdate = false;
        // this.endpointMesh.castShadow = true;
        // this.endpointMesh.receiveShadow = true;
        this.endpointMesh.name = "endpoint";
        this.endpointMesh.userData.id = this.ID; 
        this.add(this.endpointMesh);
    }

    //
    // create a line between points
    //
    createSpanMesh( start, end, newMat ) {
        const points = [];
        points.push(start, end);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        this.spanMesh = new THREE.Line( geometry, newMat ); 
        // initially, the skeleton is not visible
        this.add( this.spanMesh );
    }

    //
    //
    //
    computeLength( start, end ) {
        let vstart = new THREE.Vector3(start[0], start[1], start[2]);
        return vstart.distanceTo(new THREE.Vector3(end[0], end[1], end[2]));
    }

    //
    // set the state of the geometry
    //
    setState(s) {
        var result = false;

        this.state = s;
        if (this.visible) {
            switch (s) {
                case SegmentGeometry.State.LIVE:
                    // visibility
                    this.endpointMesh.visible = true;
                    this.spanMesh.visible     = true;
                    this.skeletonMesh.visible = false;   
                    // opacity
                    this.endpointMesh.material.transparent = false; 
                    this.endpointMesh.material.opacity = 1.0;
                    this.spanMesh.material.transparent = false;
                    this.spanMesh.material.opacity = 1.0;
                    // shadow
                    // this.endpointMesh.castShadow    = true;
                    // this.endpointMesh.receiveShadow = true;
                    // this.spanMesh.castShadow        = true;
                    // this.spanMesh.receiveShadow     = true;
                    result = true;
                    break;
                case SegmentGeometry.State.GHOST:
                    this.state = s;
                    // visibility
                    this.endpointMesh.visible = true;
                    this.spanMesh.visible     = true;
                    this.skeletonMesh.visible = false;   
                    // opacity
                    this.endpointMesh.material.transparent = true; 
                    this.endpointMesh.material.opacity = SegmentGeometry.GhostOpacity; 
                    this.spanMesh.material.transparent = true;
                    this.spanMesh.material.opacity =  SegmentGeometry.GhostOpacity;
                    // shadow
                    // this.endpointMesh.castShadow    = false;
                    // this.endpointMesh.receiveShadow = false;
                    // this.spanMesh.castShadow        = false;
                    // this.spanMesh.receiveShadow     = false;
                    result = true;
                    break;
                case SegmentGeometry.State.SKELETON:
                    this.state = s;
                    this.endpointMesh.visible = false;
                    this.spanMesh.visible     = false;
                    this.skeletonMesh.visible = true;   
                    result = true;
                    break;
                case SegmentGeometry.State.DEAD:
                    this.state = s;
                    this.endpointMesh.visible = false;
                    this.spanMesh.visible     = false;
                    this.skeletonMesh.visible = false;   
                    result = true;
                    break;
                default:
                    // report an error
            } 
        } else {
            // visibility
            this.endpointMesh.visible = false;
            this.spanMesh.visible     = false;
            this.skeletonMesh.visible = false;   
            result = true;
        }
        return result;
    }

    setColor( c ) {
        this.endpointMesh.material.color.set(c);
        this.spanMesh.material.color.set(c);
    }

}

export default SegmentGeometry;
