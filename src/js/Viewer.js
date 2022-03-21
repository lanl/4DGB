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
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js'

//
// A viewer has a scene and a way to render it to the screen
//
class Viewer {

    constructor( parameters ) { 
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
        this._camera.position.x = parameters["camera"]["position"][0];
        this._camera.position.y = parameters["camera"]["position"][1];
        this._camera.position.z = parameters["camera"]["position"][2];
        this._camera.lookAt(parameters["camera"]["lookAt"]);
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setClearColor(parameters["renderer"]["clearColor"])

        // ambient
        for (let i = 0, len = parameters["lights"].length; i < len; i++) {
            let l = parameters["lights"][i];
            if (l["type"] == "ambient") {
                this.addAmbientLight(l);
            } else if (l["type"] == "directional") {
                this.addDirectionalLight(l)
            }
        }

        this._controls = new OrbitControls(this._camera, this.renderer.domElement);
        this._controls.addEventListener('change', this.render.bind(this));

        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );
    }

    addAmbientLight( l ) {
        this.add(new THREE.AmbientLight(l["color"]));
    }

    addDirectionalLight( l ) {
        this.add(new THREE.DirectionalLight(l["color"], 0.5));
    }

    add( o ) {
        this._scene.add(o);
    }

    render() {
        this.renderer.render(this._scene, this._camera);;
    }

    // -------------------------------------------------------------------
    // BEGIN: get and set methods
    // -------------------------------------------------------------------
    get renderer() {
        return this._renderer;
    }

    set renderer( r ) {
        this._renderer = r;
    }
}

export default Viewer;
