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

require('three/examples/js/controls/OrbitControls')

const Project = require('./Project');
const Geometry = require('./Geometry');
const AxesCanvas = require('./AxesCanvas');
const ScalarBarCanvas = require('./ScalarBarCanvas');
const Segment = require('./Segment');
const Util = require('./Util');
const { Selection, Controller } = require('./selections');

class GeometryCanvas {

    // class global settings
    static ShowUnmappedSegments = false;

    constructor(project, dataset, rootElemID) {
        this.renderRequested = false;
        this.camera;
        this.canvas;
        this.controls;
        this.scene;
        this.renderer;
        this.unmapped = [];
        this.loaded = false;
        this.setDataset(dataset);

        /**
         * @type {Controller} Selection controller used to sync selections with other components.
        */
        this.controller;

        this.render = (function() {
            this.renderRequested = undefined;

            // TODO: improve granularity of control for this
            this.showUnmappedSegments( GeometryCanvas.ShowUnmappedSegments );

            if (this.resizeRendererToDisplaySize(this.renderer)) {
                const canvas = this.renderer.domElement;
                this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
                this.camera.updateProjectionMatrix();
            }

            this.renderer.render(this.scene, this.camera);
            this.axesCanvas.render();
        }).bind(this);

        this.requestRenderIfNotRequested = (function() {
            if (!this.renderRequested) {
                this.renderRequested = true;
                requestAnimationFrame(this.render);
            }
        }).bind(this);

        //
        // end of instance variables
        //

        // set up each state from the project data
        // var proj  = project.getProject();
        var adata = project.getApplicationData("gtk");
        var gdata = adata["geometrycanvas"] 

        // create elements in the document 
        var gtkroot = document.getElementById(rootElemID);
        // var groot  = document.createElement("td");
        // gtkroot.appendChild(groot);

        var contdiv = document.createElement("div");
        contdiv.className = "gtkviewcontainer";
        gtkroot.appendChild(contdiv);

        var canvas_idstring = "gtkgeometry-" + this.dataset.id.toString();
        this.canvas = document.createElement("canvas");
        this.canvas.className = "gtkgeometrycanvas";
        this.canvas.id = canvas_idstring; 
        this.canvas.width  = gdata["width"];
        this.canvas.height = gdata["height"];
        contdiv.appendChild(this.canvas);

        // renderer
        this.renderer = new THREE.WebGLRenderer({canvas: this.canvas, antialias: true});

        // camera
        var cam = gdata["scene"]["camera"];
        this.camera= new THREE.PerspectiveCamera(cam["fov"], cam["aspect"], cam["near"], cam["far"]);
        this.camera.position.x = cam["position"][0];
        this.camera.position.y = cam["position"][1];
        this.camera.position.z = cam["position"][2];
        this.camera.aspect = this.canvas.width/this.canvas.height;
        this.camera.updateProjectionMatrix();

        // controls
        // this.controls = new THREE.TrackballControls(this.camera, this.canvas);
        this.controls = new THREE.OrbitControls(this.camera, this.canvas);
        this.controls.target.set(cam["center"][0], cam["center"][1], cam["center"][2]);
        this.controls.update();
        this.controls.addEventListener('change', this.requestRenderIfNotRequested);
        window.addEventListener('resize', this.requestRenderIfNotRequested);

        // new scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(parseInt(gdata["scene"]["background"])); 

        // axes
        // this.axes = new THREE.AxesHelper( 1 );
        // this.scene.add(this.axes);

        // add lights to the scene
        var lights = gdata["scene"]["lights"];
        var curLight;
        // build and add all the lights defined in the project settings
        for (var l in Object.keys(lights)) {
            curLight = lights[l];
            if (curLight["type"] == "directional") {
                var light = new THREE.DirectionalLight(curLight["color"], curLight["intensity"]);
                light.position.set(curLight["position"][0], curLight["position"][1], curLight["position"][2] );
                light.castShadow = curLight["castshadow"] ;
                this.scene.add(light);
                
            } else if (curLight["type"] == "point") {
                var light = new THREE.PointLight(curLight["color"], curLight["intensity"], curLight["distance"], curLight["decay"]);
                light.position.set(curLight["position"][0], curLight["position"][1], curLight["position"][2] );
                this.scene.add(light);

            } else if (curLight["type"] == "ambient") {
                var light = new THREE.AmbientLight(curLight["color"], curLight["intensity"]);
                this.scene.add(light);
            } else {
                // report ignored light type, but this is not an error 
                console.log("Unknown light type in project: " + curLight["type"])
            }
        }

        // axes
        this.axesCanvas = new AxesCanvas(contdiv, this.camera);

        // load data
        this.geometry = new Geometry(gdata["geometry"]);
        this.geometry.load( this.dataset.id, this.scene, this );

        // scalar bar
        this.scalarBarCanvas = new ScalarBarCanvas(contdiv);
            // share the geometry's LUT
        this.scalarBarCanvas.setLUT(this.geometry.LUT);
    }

    /**
     * Set a new selection controller for the Geometry Canvas.
     * This will cause the displayed segments to react to 'selectionChanged' events
     * from the controller.
     * @param {Controller} controller 
     */
    setController(controller) {
        this.controller = controller;
        this.controller.addListener('selectionChanged', ({selection}) => {
            const segmentIDs = Util.rangesToValues( selection.asSegments() );
            this.setSegmentStates(segmentIDs, Segment.State.LIVE, Segment.State.GHOST);
            this.render();
        });
    }

    showAxes( state ) {
        this.showAxes.visible = state;
    }

    showCentroid( state ) {
        this.centroidMarker.visible = state;
    }

    // color must be of the form #000000
    setBackgroundColor( color ) {
        this.scene.background.set(color)
    }

    setSegmentStates( segments, setState, unsetState ) {
        this.geometry.setSegmentStates(segments, setState, unsetState);
    }

    // update after data loaded
    postLoad(instance) {
        // set the centroid
        instance.controls.target.set(instance.geometry.centroid.x, instance.geometry.centroid.y, instance.geometry.centroid.z);
        instance.controls.update();

        // create geometry for the centroid
        var cGeom = new THREE.SphereBufferGeometry( 0.5, 8, 8, );
        var cMaterial = new THREE.MeshPhongMaterial();
        this.centroidMarker = new THREE.Mesh(cGeom, cMaterial);
        this.centroidMarker.position.x = instance.geometry.centroid.x;
        this.centroidMarker.position.y = instance.geometry.centroid.y;
        this.centroidMarker.position.z = instance.geometry.centroid.z;
        this.scene.add(this.centroidMarker);
        this.showCentroid(false);
        
        // set the colors
        // instance.paintByVariable();
         
        // turn off the unmapped ones
        instance.showUnmappedSegments( instance.ShowUnmappedSegments );
        // instance.geometry.setSegmentVisible(instance.unmapped, false);

        this.loaded = true;
    }

    // render on changes
    resizeRendererToDisplaySize(renderer) {
        // const canvas = this.renderer.domElement;
        const width  = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const resize = this.canvas.width !== width || this.canvas.height !== height;

        if (resize) {
            this.renderer.setSize(width, height, false);
        }

        return resize;
    }

    initializeUnmappedSegments() {
        var dset = Project.TheProject.getData("hic", this.dataset.hic);
        
        if ("unmapped-segments" in dset) {
            var umList = dset["unmapped-segments"];
            for ( var l=0; l<umList.length;l++ ) {
                var start = umList[l][0];
                var end   = umList[l][1];
                var numelems = end - start;
                for (var i=0;i<numelems+1;i++) {
                    this.unmapped.push(start + i);
                }
            }
        }
    }

    reset() {
        // no-op for now
    }

    showUnmappedSegments( state ) {
        this.geometry.setSegmentVisible(this.unmapped, state);
    }

    setDataset(d) {
        this.reset();
        this.dataset = d;
        this.initializeUnmappedSegments();
        if (this.loaded) {
            this.showUnmappedSegments(this.ShowUnmappedSegments);
        }
    }

    setLUT (lut) {
        this.geometry.setLUT(lut);
    }

    setLUTParameters (varname, min, max) {
        this.geometry.setLUTParameters(min, max);
        this.scalarBarCanvas.title = varname;
    }

}

module.exports = GeometryCanvas;
