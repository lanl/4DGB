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
var ThePanels = [];
var TheNumPanels = 2;
var TheControls;
var TheTrackPanel;
var TheInterval;

// general function for updating
// TODO: refine granularity of updates, etc.
function renderAllPanels () {
    for (let i = 0; i < TheNumPanels; i++) {
        ThePanels[i].geometrycanvas.render();
    }
}

function updateBackgroundColor () {
    for (let i = 0; i < TheNumPanels; i++) {
        ThePanels[i].geometrycanvas.setBackgroundColor(TheControls.getBackgroundColor());
        ThePanels[i].geometrycanvas.render();
    }
}

function addTrackCallback() {
    // alert("track clicked")
}

//
// generate the labels for track data
//
function generateTrackLabels (start, end, numbins) {
    var labels = [];
    var incr   = Math.trunc((end-start)/numbins);
    for (var i = 0; i < numbins; i++) { 
        labels.push(start + i*incr); 
    }
    return labels;
}

//
// create a track using the data provided
//
function createTrack ( data ) {

    // for (var i = 0; i < data.locations.length; i++) {
    // HACK currently create tracks for the first range only
    for (var i = 0; i < 1; i++) {
        var lrange = data.locations[i].split("-").map(Number);

        // create a title for the track
        var title =  "Var: " + data.varname + " Range: (" + lrange[0] + ", " + lrange[1] + ")"
        TheTrackPanel.pushContainer( title, addTrackCallback );

        var title = [TheTrackPanel.topTitle, TheTrackPanel.bottomTitle]
        var position = [0, 1]
        for (let i = 0; i < TheNumPanels; i++) {
            GTK.Client.TheClient.get_sampled_array( (response) => {
                    var numlabels = response["data"].length;
                    var labels = generateTrackLabels( lrange[0], lrange[1], numlabels); 
                    TheTrackPanel.addTrackToCurrentContainer( labels, response["data"], title[i], position[i]);
                    var data = response["data"];
                }, data.varid, i, lrange[0], lrange[1], data.numbins); 
        }
    }
}

//
// clear all the data tracks 
//
function clearTracks ( ) {
    TheTrackPanel.clear();
}

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
    GTK.Client.TheClient.get_array( (response) => {
            ThePanels[0].geometrycanvas.setLUTParameters( TheControls.getCurrentVariableName(), response['data']['min'], response['data']['max'] ); 
            ThePanels[0].geometrycanvas.geometry.colorBy( response['data']['values']);
            ThePanels[0].geometrycanvas.render();
        }, id, 0); 
    GTK.Client.TheClient.get_array( (response) => {
            ThePanels[1].geometrycanvas.setLUTParameters( TheControls.getCurrentVariableName(), response['data']['min'], response['data']['max'] ); 
            ThePanels[1].geometrycanvas.geometry.colorBy( response['data']['values']);
            ThePanels[1].geometrycanvas.render();
        }, id, 1); 
}

function variableChanged(e) {
    setVariable(e);
}

function colormapChanged(e) {
    ThePanels[0].geometrycanvas.setLUT(e);
    ThePanels[1].geometrycanvas.setLUT(e);
    setVariable(TheControls.getCurrentVariableID());
}

function main( project ) {

    var dset = project.getDatasets(); 
    TheInterval = project.getInterval();

    // testing the range function
    if (false) {
        var segs = [];
            // [1]
        segs.push(getSegmentsForLocationRange( [1, TheInterval] ));
            // [1,2]
        segs.push(getSegmentsForLocationRange( [1, TheInterval + 100] ));
            // [1]
        segs.push(getSegmentsForLocationRange( [TheInterval, TheInterval] ));
            // [1,2]
        segs.push(getSegmentsForLocationRange( [TheInterval, 2*TheInterval] ));
            // [1,2]
        segs.push(getSegmentsForLocationRange( [100, 2*TheInterval] ));
            // [1,2,3]
        segs.push(getSegmentsForLocationRange( [100, 2*TheInterval + 100] ));
    }

    // control panel
    TheControls = new GTK.ControlPanel( project, "controlpanel" );

    // views
    var dataset = new GTK.Dataset(dset[0]);
    ThePanels.push(new GTK.ViewerPanel( project, dataset, "leftpanel" ));

    var dataset = new GTK.Dataset(dset[1]);
    ThePanels.push(new GTK.ViewerPanel( project, dataset, "rightpanel" ));

    // attribute charts
    TheTrackPanel = new GTK.TrackPanel( "trackpanel" );
    TheTrackPanel.setTrackTitles( dset[0]["name"], dset[1]["name"] );


    // connections
        // camera
    linkCameras(ThePanels[0].geometrycanvas, ThePanels[1].geometrycanvas);
        // contact maps
    //linkContactMaps(ThePanels[0], ThePanels[1]);
    //linkContactMapControls(TheControls, ThePanels[0].contactmapcanvas);
    //linkContactMapControls(TheControls, ThePanels[1].contactmapcanvas);
        // selection controller
    TheControls.setController(TheController);
    ThePanels[0].setController(TheController);
    ThePanels[1].setController(TheController);
        // events
    TheControls.addListener( "variableChanged",        variableChanged );
    TheControls.addListener( "colormapChanged",        colormapChanged );
    TheControls.addListener( "createTrack",            createTrack );
    TheControls.addListener( "clearTracks",            clearTracks );
    TheControls.addListener( "render",                 renderAllPanels );
    TheControls.addListener( "backgroundColorChanged", updateBackgroundColor );
}

//
// create the project object and load data 
//
GTK.Project.TheProject = new GTK.Project( GTKProjectName );
GTK.Client.TheClient  = new GTK.Client();
const TheController   = new GTK.Selections.Controller();
var view;

main( GTK.Project.TheProject );
