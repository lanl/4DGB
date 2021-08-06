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

const SegmentState = require('./Segment')

/*
 *
 * Class that manages an arrow-like representation of a segment
 * 
 */
class ArrowSegment {

    // class global settings
    static Color          = new THREE.Color(0.0, 0.0, 0.0); 
    static EndpointRadius = 0.0; 
    static GeomEndpoint   = new THREE.SphereBufferGeometry( 0.1, 8, 8, );
    static GhostOpacity   = 0.5;
    static RadiusEnd      = 0.0; 
    static RadiusBegin    = 0.0; 

    constructor( ID, start, end, rBeg, rEnd ) {
        const newMat = new THREE.MeshLambertMaterial({color: ArrowSegment.Color});
        // root
        this.state = SegmentState.LIVE;
        this.root = new THREE.Group();

        // endpoint
        this.createEndpointMesh( ID, end, newMat );

        // span
        this.createSpanMesh( ID, start, end, rBeg, rEnd, newMat ); 

        // skeleton
        this.createSkeleton( ID, start, end, newMat );

        // other
        this.length = end.distanceTo(start);
        this.colors = [];
        this.attribute = {};
        this.visible = true;
    }

    setAttributeValue( varname, value ) {
        this.attribute[varname] = value;
    }

    getAttributeValue( varname ) {
        if (key in this.attribute) {
            return this.attribute[varname];
        } else {
            return undefined;
        }
    }

    setState(s) {
        var result = false;

        this.state = s;
        if (this.visible) {
            switch (s) {
                case SegmentState.LIVE:
                    // visibility
                    this.endpointMesh.visible = true;
                    this.spanMesh.visible     = true;
                    this.skeletonMesh.visible = false;   
                    // opacity
                    this.endpointMesh.material.transparent = false; 
                    this.endpointMesh.material.opacity = 1.0;
                    this.spanMesh.material.transparent = false;
                    this.spanMesh.material.opacity = 1.0;
                    result = true;
                    break;
                case SegmentState.GHOST:
                    this.state = s;
                    // visibility
                    this.endpointMesh.visible = true;
                    this.spanMesh.visible     = true;
                    this.skeletonMesh.visible = false;   
                    // opacity
                    this.endpointMesh.material.transparent = true; 
                    this.endpointMesh.material.opacity = ArrowSegment.GhostOpacity; 
                    this.spanMesh.material.transparent = true;
                    this.spanMesh.material.opacity =  ArrowSegment.GhostOpacity;
                    result = true;
                    break;
                case SegmentState.SKELETON:
                    this.state = s;
                    this.endpointMesh.visible = false;
                    this.spanMesh.visible     = false;
                    this.skeletonMesh.visible = true;   
                    result = true;
                    break;
                case SegmentState.DEAD:
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

    pushColor( c ) {
        this.colors.push(c);
        this.setColor(c);
    }

    popColor() {
        var c = this.colors.pop();
        this.setColor(c);
    }

    getLength() {
        return this.length;
    }

    setColor( c ) {
        this.endpointMesh.material.color.set(c);
        this.spanMesh.material.color.set(c);
    }

    setVisible(v) {
        this.visible = v;
        this.setVisible(this.visible);
    }

    getEndpointMesh() {
        return this.endpointMesh;
    }

    addToParent( p ) {
        p.add(this.root);
    }

    //
    // create a cylinder between two points
    //
    // online solution
    // https://stackoverflow.com/questions/15316127/three-js-line-vector-to-cylinder
    //
    // TODO: could simplify to take the id as a parameter 
    createSpanMesh( id, start, end, rBeg, rEnd, material) {
        var vec = start.clone();
        vec.sub(end);
        var height = vec.length();
        vec.normalize();
        var quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec);
        var geometry = new THREE.CylinderGeometry(rBeg, rEnd, height, 32);
        geometry.translate(0, height / 2, 0);

        var newMat = new THREE.MeshLambertMaterial({color: ArrowSegment.Color});
        newMat.copy(material);
        this.spanMesh = new THREE.Mesh(geometry, newMat);
        this.spanMesh.applyQuaternion(quaternion);
        this.spanMesh.position.set(end.x, end.y, end.z);
        this.spanMesh.name = "span";
        this.spanMesh.userData.id = id;
        this.root.add(this.spanMesh);
    }

    createEndpointMesh(ID, center, material) {
        this.endpointMesh = new THREE.Mesh(ArrowSegment.GeomEndpoint, material);
        this.endpointMesh.position.x = center.x;
        this.endpointMesh.position.y = center.y;
        this.endpointMesh.position.z = center.z;
        this.endpointMesh.updateMatrix();
        this.endpointMesh.matrixAutoUpdate = false;
        this.endpointMesh.castShadow = true;
        this.endpointMesh.receiveShadow = true;
        this.endpointMesh.name = "endpoint";
        this.endpointMesh.userData.id = ID; 
        this.root.add(this.endpointMesh);
    }

    createSkeleton( ID, start, end, newMat ) {
        const points = [];
        points.push(start, end);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        this.skeletonMesh = new THREE.Line( geometry, newMat ); 
        // initially, the skeleton is not visible
        this.skeletonMesh.visible = false;
        this.root.add( this.skeletonMesh );
    }

    setVisible(v) {
        this.root.visible = v;
        this.endpointMesh.visible = v;
        this.spanMesh.visible = v;
    }

    getVisible() {
        return this.root.visible;
    }
}

module.exports = ArrowSegment;
