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

var left;
var right;
var controls;
var leftDatasetID = 0;
var rightDatasetID = 1;

function linkCameras(a, b) {
    // link the cameras
    a.controls.addEventListener( 'change', () => {
        b.camera.copy( a.camera, true );
        b.controls.target = a.controls.target;
        b.render();
    });
    b.controls.addEventListener( 'change', () => {
        a.camera.copy( b.camera, true );
        a.controls.target = b.controls.target;
        a.render();
    });
}

function setVariable( id ) {
    TheGTKClient.get_array( (response) => {
            left.geometry.setLUTParameters( response['data']['min'], response['data']['max'] ); 
            left.geometry.colorBy( response['data']['values']);
            left.render();
        }, id, leftDatasetID); 
    TheGTKClient.get_array( (response) => {
            right.geometry.setLUTParameters( response['data']['min'], response['data']['max'] ); 
            right.geometry.colorBy( response['data']['values']);
            right.render();
        }, id, rightDatasetID); 
}

function loadNewCamera() {
    var cJSON  = left.camera.toJSON();
    var loader = new THREE.ObjectLoader();
    var camera = loader.parse( cJSON );
}

function variableChanged(e) {
    setVariable(e);
}

function colormapChanged(e) {
    left.geometry.setLUT(e);
    right.geometry.setLUT(e);
    setVariable(controls.getCurrentVariableID());
}

function main( project ) {
    var dset = project.getDatasets(); 

    // control panel
    controls = new GTKControlPanel( project, "controlpanel" );
    var leftdataset  = new GTKDataset(dset[leftDatasetID]);
    var rightdataset = new GTKDataset(dset[rightDatasetID]);
    left  = new GTKGeometryCanvas( project, leftdataset, "leftpanel" );
    right = new GTKGeometryCanvas( project, rightdataset, "rightpanel" );

    linkCameras(left, right);

    controls.addEventListener( "variableChanged", variableChanged ); 
    controls.addEventListener( "colormapChanged", colormapChanged ); 
}

//
// create the project object and load data 
//
TheGTKProject = new GTKProject( GTKProjectName );
TheGTKClient  = new GTKClient( "http://" + window.location.hostname, window.location.port);
var view;

main( TheGTKProject );
