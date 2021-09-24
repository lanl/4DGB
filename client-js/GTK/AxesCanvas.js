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

class AxesCanvas {

    static Classname    = "gtkaxescanvas";
    static ClearColor   = 0xffffff;
    static ClearAlpha   = 0.0; 

    constructor(rootElem, linkcamera, {width=100, height=100} = {}) {
        this.camera;
        this.linkCamera = linkcamera;
        this.canvas;
        this.scene;
        this.renderer;

        // create elements
        var contdiv = document.createElement("div");
        contdiv.className = AxesCanvas.Classname; 
        rootElem.appendChild(contdiv);

        this.canvas = document.createElement("canvas");
        this.canvas.width  = width; 
        this.canvas.height = height; 
        contdiv.appendChild(this.canvas);

        this.renderer = new THREE.WebGLRenderer( {canvas: this.canvas, alpha: true } );
        this.renderer.setClearColor( AxesCanvas.ClearColor, 0 );
        this.renderer.setClearAlpha( AxesCanvas.ClearAlpha );

        this.scene = new THREE.Scene();

        var origin = new THREE.Vector3( 0,0,0 );
        this.camera = new THREE.PerspectiveCamera( 50, width / height, 1, 1000 );
        this.camera.lookAt(this.scene.position);

        this.scene.add( new THREE.ArrowHelper( new THREE.Vector3( 1,0,0 ), origin, 60, 0x7F2020, 20, 10 ) );
        this.scene.add( new THREE.ArrowHelper( new THREE.Vector3( 0,1,0 ), origin, 60, 0x207F20, 20, 10 ) );
        this.scene.add( new THREE.ArrowHelper( new THREE.Vector3( 0,0,1 ), origin, 60, 0x20207F, 20, 10 ) );
    }

    render() {
        this.camera.position.copy( this.linkCamera.position );
        this.camera.position.setLength(200);
        this.camera.lookAt(this.scene.position);
        this.renderer.render( this.scene, this.camera );
    }

}

module.exports = AxesCanvas;
