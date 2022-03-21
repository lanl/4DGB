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
import SegmentGeometry from './SegmentGeometry.js'

class StructureGeometry extends THREE.Group {

    /*
     */
    constructor( s ) { 
        super();

        this._structure = s;
        this._segments = {};
        this._segAveLength = 0.0;
        this._segTotalLength = 0.0;
        for (const [key, sdata] of Object.entries(s.segments)) { 
            this.segments[sdata["ID"]] = new SegmentGeometry(sdata);
            this.add(this._segments[sdata["ID"]]);
            this.SegTotalLength = this.segTotalLength + this.segments[sdata["ID"]];
        }
        this.segAveLength = this.segTotalLength/this.segments.length;
    }

    // -------------------------------------------------------------------
    // BEGIN: get and set methods
    // -------------------------------------------------------------------
    get segments() {
        return this._segments;
    }

    get segTotalLength() {
        return this._segTotalLength;
    }

    set segTotalLength( l ) {
        this._segTotalLength = l;
    }

    get segAveLength() {
        return this._segAveLength;
    }

    set segAveLength( l ) {
        this._segAveLength = l;
    }
}

export default StructureGeometry;
