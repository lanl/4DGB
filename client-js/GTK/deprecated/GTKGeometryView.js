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

const Project = require('./Project');

class GeometryView {

    constructor(project, stateID) {
        this.renderRequested = false;
        this.camera;
        this.canvas;
        this.controls;
        this.scene;
        this.raycaster;
        this.renderer;
        this.variable = {};
        this.selectCallback;
        this.unmapped = [];

        this.render = (function() {
            this.renderRequested = undefined;

            if (this.resizeRendererToDisplaySize(this.renderer)) {
                const canvas = this.renderer.domElement;
                this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
                this.camera.updateProjectionMatrix();
            }

            this.renderer.render(this.scene, this.camera);
        }).bind(this);

        this.requestRenderIfNotRequested = (function() {
            if (!this.renderRequested) {
                this.renderRequested = true;
                requestAnimationFrame(this.render);
            }
        }).bind(this);

        //
        // mouse double click callback
        //
        this.dblclick = (function(event) {
            // var mouse = new THREE.Vector3( event.OffsetX, event.OffsetY );
            var mouse = new THREE.Vector2();
            mouse.x =   (event.offsetX/this.canvas.width) * 2 - 1; 
            mouse.y = - (event.offsetY/this.canvas.height) * 2 + 1; 
            this.raycaster.setFromCamera( mouse, this.camera );

            var intersects = this.raycaster.intersectObjects( this.scene.children, true );

            var found;
            for ( var i = 0; i < intersects.length; i++ ) {
                found = intersects[i].object;
                if (found.name == "bead") {
                    var makeSprite = false;
                    if (makeSprite) {
                        // make a sprite
                        var sprite = this.createSprite( found, found.userData.id, this.scene );

                        // update the bead data query 
                        if (False) {
                            var genes = this.getGenesForSegment( found.userData.id );
                            var elem = document.getElementById("curseg-genes-" + this.stateID.toString());
                            elem.innerHTML = genes;
                            document.getElementById("curseg-length-" + this.stateID.toString()).innerHTML = 
                                this.model.getSegment(found.userData.id - 1).getLength().toString(); 
                        }
                    } 

                    // highlight
                    // TODO: make ID and the index be the same
                    var highlight = false;
                    if (highlight) {
                        this.model.highlightSegment(found.userData.id);
                    }

                    // callback
                    this.selectCallback(found.userData.id)

                    // update the render
                    this.render();
                }
            }
        }).bind(this);

        //
        // end of instance variables
        //

        // set up each state from the project data
        var proj  = project.getProject();
        var dsets = project.getDatasets();
        var gdata = project.getApplicationData("gtk");
        this.state = dsets["state"][stateID];
        this.stateID = stateID;
        this.annotations = dsets["annotations"];

        // initialize the list of unmapped segments
        for ( var l=0; l<this.state["epigenetics"][0]["unmapped"].length;l++ ) {
            var start = this.state["epigenetics"][0]["unmapped"][l][0];
            var end   = this.state["epigenetics"][0]["unmapped"][l][1];
            var numelems = end - start;
            for (var i=0;i<numelems+1;i++) {
                this.unmapped.push(start + i);
            }
        }

        // create elements in the document 
        var gtkroot = document.getElementById("bodyrow");
        var groot  = document.createElement("td");
        gtkroot.appendChild(groot);

        var contdiv = document.createElement("div");
        contdiv.className = "gtkgeometrycontainer";
        groot.appendChild(contdiv);

        var title_idstring = "gtkgeometrytitle-" + this.stateID.toString();
        var titlediv = document.createElement("div");
        titlediv.className = "gtkgeometrytitle";
        titlediv.id = title_idstring;
        titlediv.innerHTML = this.state["title"];
        contdiv.appendChild(titlediv);

        var canvas_idstring = "gtkgeometry-" + this.stateID.toString();
        this.canvas = document.createElement("canvas");
        this.canvas.className = "gtkgeometrycanvas";
        this.canvas.id = canvas_idstring; 
        this.canvas.width  = gdata["canvas"]["width"];
        this.canvas.height = gdata["canvas"]["height"];
        contdiv.appendChild(this.canvas);

        // metadata table
        var mdatatable = document.createElement("table");
        contdiv.appendChild(mdatatable);

        var elements = {
            // "Current Segment Genes:": "curseg-genes-",
            // "Current Segment Length:": "curseg-length-",
            // "Num Segments:": "project-numsegments-",
            // "  ": "  ",
            "Geometry file:": "project-datasets-geometry-",
            "Epigenetics file:": "project-datasets-epigenetics-",
            "Annotations file:": "project-datasets-annotations-"
        };
        for (var key in elements) {
            var row = document.createElement("tr");
            mdatatable.appendChild(row);
            // var tdkey = document.createElement("td");
            var tdval = document.createElement("td");
            tdval.className = "gtkprojectdatafilename";
            // tdkey.innerHTML = key; 
            tdval.id = elements[key] + this.stateID.toString(); 
            // row.appendChild(tdkey);
            row.appendChild(tdval);
        }

        // renderer
        this.renderer = new THREE.WebGLRenderer({canvas: this.canvas, antialias: true});

        // picking
        this.raycaster = new THREE.Raycaster();;
        this.renderer.domElement.addEventListener('dblclick', this.dblclick, false);

        // variables
        this.variable["name"] = gdata["chartlist"]["variable"]["name"]; 
        this.variable["min"]  = gdata["chartlist"]["variable"]["min"]; 
        this.variable["max"]  = gdata["chartlist"]["variable"]["max"]; 

        // camera
        var cam = gdata["scene"]["camera"]
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

        // add lights to the scene
        var lights = gdata["scene"]["lights"];
        var curLight;
        // build and add all the lights defined in the project settings
        for (var l in Object.keys(lights)) {
            curLight = lights[l];
            if (curLight["type"] == "directional") {
                var dirLight = new THREE.DirectionalLight(parseInt(curLight["color"], 16));
                dirLight.position.set(curLight["position"][0], curLight["position"][1], curLight["position"][2] );
                dirLight.castShadow = curLight["castshadow"] ;
                this.scene.add(dirLight);
                
            } else if (curLight["type"] == "ambient") {
                var ambientLight = new THREE.AmbientLight(parseInt(curLight["color"]));
                this.scene.add(ambientLight);
            }
        }

        // load data
        this.model = new Model(gdata["model"]);
        var egeom_file = project.getProjectDir() + "/" + this.state["geometry"]["path"];
        var instance = this;
        this.model.load( egeom_file, this.scene, this );
    }

    setSegmentStates( segments, setState, unsetState ) {
        this.model.setSegmentStates(segments, setState, unsetState);
    }

    setSelectCallback (c) {
        this.selectCallback = c;
    }

    // update after data loaded
    postLoad(instance) {
        var elem = document.getElementById("project-datasets-geometry-" + instance.stateID.toString());
        elem.innerHTML = instance.state["geometry"]["path"]
        elem = document.getElementById("project-datasets-epigenetics-" + instance.stateID.toString());
        elem.innerHTML = instance.state["epigenetics"][0]["path"]
        elem = document.getElementById("project-datasets-annotations-" + instance.stateID.toString());
        elem.innerHTML = this.annotations["path"]

        // set the centroid
        instance.controls.target.set(instance.model.centroid.x, instance.model.centroid.y, instance.model.centroid.z);
        instance.controls.update();
        
        // set the colors
        instance.paintByVariable();

        // turn off the unmapped ones
        instance.model.setSegmentVisible(instance.unmapped, false);
    }

    paintByVariable() {
        this.model.setLUTParameters(this.variable["min"], this.variable["max"]);
        this.model.colorBy( this.variable["name"], this.getSegmentEpigeneticsData( this.variable["name"] ) );
    };

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


    //
    getGenesForSegment( id ) {
        var gene_string = "";

        var request = new XMLHttpRequest();
        request.open('GET', "/genes/" + id, false);
        request.send(null);

        if (request.readyState == 4 && (request.status == 0 || request.status == 200)) {
            var genes = JSON.parse(request.responseText);

            if (genes.length != 0) {
                gene_string = genes["genes"].join(", ");
            }
        }

        return gene_string
    }

    getSegmentsForGene( gene ) {
        var segments; 

        var request = new XMLHttpRequest();
        request.open('GET', "/segments/" + gene, false);
        request.send(null);

        if (request.readyState == 4 && (request.status == 0 || request.status == 200)) {
            var segments = JSON.parse(request.responseText);
        }

        // HACK
        // TODO: determine why this happens (ID larger than num segments)
        for (var s = 0; s < segments["segments"].length; s++ ) {
            if (segments["segments"][s] > this.state["geometry"]["num_segments"]) {
                // alert(segments["segments"][s]);
                segments["segments"].splice(s, 1);
            }
        }

        return segments["segments"]
    }

    getSegmentEpigeneticsData( identifier ) {
        var results = "";

        var request = new XMLHttpRequest();
        request.open('GET', "/segepi/" + identifier + "/" + this.stateID, false);
        request.send(null);

        if (request.readyState == 4 && (request.status == 0 || request.status == 200)) {
            var data = JSON.parse(request.responseText);
            results = data["data"]
        }

        return results
    }

    //
    // create a sprite attached to a particular object
    //
    createSprite( object, message, scene) 
    {
        let baseWidth = 100;
        let fontsize = 24;
        const borderSize = 2;
        const sprite = document.createElement('canvas').getContext('2d');
        const font = `${fontsize}px helvetica`;
        sprite.font = font;

        const textWidth = sprite.measureText(message).width;
        const doubleBorderSize = borderSize * 2;
        const width  = baseWidth + doubleBorderSize;
        const height = fontsize + doubleBorderSize;
        sprite.canvas.width = width;
        sprite.canvas.height = height;

        // need to set font again after re-sizing canvas
        sprite.font         = font;
        sprite.textBaseline = 'middle';
        sprite.textAlign    = 'center';
        sprite.lineWidth    = borderSize; 
        sprite.fillStyle    = "rgba(0, 0, 0, 0.0)";

        // scale to fit but don't stretch
        const scaleFactor = Math.min(1, baseWidth / textWidth);
        sprite.translate(width / 2, height / 2);
        sprite.scale(scaleFactor, 1);
        sprite.fillStyle    = "#ffffff";
        sprite.strokeStyle  = "#ffffff";
        sprite.fillText(message, 0, 0);
        sprite.strokeText(message, 0, 0);

        const texture = new THREE.CanvasTexture(sprite.canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const labelMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });

        const label = new THREE.Sprite(labelMaterial);
        label.position.set(0,0.4,0); //slightly above the bead
        label.scale.set( 1.0, 0.3, 1.0 );
        scene.getObjectById(object.id, true).add(label);
    }

}

module.exports = GeometryView;
