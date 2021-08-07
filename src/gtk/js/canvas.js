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

var geometry;
var controls;
var TheDatasetID = 0;

function setVariable( id ) {
    TheGTKClient.get_array( (response) => {
            // TODO: check response
            geometry.geometry.setLUTParameters( response['data']['min'], response['data']['max'] ); 
            geometry.geometry.colorBy( response['data']['values']);
            geometry.render();
        }, id, TheDatasetID); 
}

function loadNewCamera() {
    var cJSON  = geometry.camera.toJSON();
    var loader = new THREE.ObjectLoader();
    var camera = loader.parse( cJSON );
}

function variableChanged(e) {
    setVariable(e);
}

function colormapChanged(e) {
    geometry.geometry.setLUT(e);
    geometry.render();
    setVariable(controls.getCurrentVariableID());
}

function main( project ) {
    var dset = project.getDatasets(); 
    var dataset  = new GTKDataset(dset[TheDatasetID]);

    // control panel
    controls = new GTKControlPanel( project, "controlpanel" );
    geometry = new GTKGeometryCanvas( project, dataset, "leftpanel" );

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
