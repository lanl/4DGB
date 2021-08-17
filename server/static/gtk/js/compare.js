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

function getSegmentsForLocationRange( idRange ) {
    var start = Math.ceil(idRange[0]/TheInterval);
    var end   = Math.ceil(idRange[1]/TheInterval);
    var size  = parseInt(end - start);
    var segments = [];

    if (size == 0) {
        // begin and end are the same, and we need at least one
        segments[0] = start;
    } else {
        // special case: endpoint was on a segment boundary
        for (var i=0; i < size+1; i++) {
            segments[i] = start + i;
        }
    }
    return segments;
}

function addTrackCallback() {
    alert("track clicked")
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

    for (var i = 0; i < data.locations.length; i++) {
        var lrange = data.locations[i].split("-").map(Number);

        // create a title for the track
        var title =  "Var: " + data.varname + " Range: (" + lrange[0] + ", " + lrange[1] + ")"
        TheTrackPanel.pushContainer( title, addTrackCallback );

        for (let i = 0; i < TheNumPanels; i++) {
            GTK.Client.TheClient.get_sampled_array( (response) => {
                    var numlabels = response["data"].length;
                    var labels = generateTrackLabels( lrange[0], lrange[1], numlabels); 
                    TheTrackPanel.addTrack( labels, response["data"]);
                    var data = response["data"];
                }, data.varid, i, lrange[0], lrange[1], data.numbins); 
        }
    }
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
            ThePanels[0].geometrycanvas.geometry.setLUTParameters( response['data']['min'], response['data']['max'] ); 
            ThePanels[0].geometrycanvas.geometry.colorBy( response['data']['values']);
            ThePanels[0].geometrycanvas.render();
        }, id, 0); 
    GTK.Client.TheClient.get_array( (response) => {
            ThePanels[1].geometrycanvas.geometry.setLUTParameters( response['data']['min'], response['data']['max'] ); 
            ThePanels[1].geometrycanvas.geometry.colorBy( response['data']['values']);
            ThePanels[1].geometrycanvas.render();
        }, id, 1); 
}
function segmentChanged(e) {
    var segments = e.map(i=>Number(i)); 
    for (let i = 0; i < TheNumPanels; i++) {
        ThePanels[i].geometrycanvas.geometry.setSegmentStates( segments, SegmentState.LIVE, SegmentState.GHOST );
        ThePanels[i].geometrycanvas.render();
    }
}

function locationChanged(e) {
    // split the string and convert to ints
    var lrange = e.split("-").map(Number);
    var segments = getSegmentsForLocationRange( lrange );
    for (let i = 0; i < TheNumPanels; i++) {
        ThePanels[i].geometrycanvas.geometry.setSegmentStates( segments, SegmentState.LIVE, SegmentState.GHOST );
        ThePanels[i].geometrycanvas.render();
    }
}

function geneChanged(e) {
    for (let i = 0; i < TheNumPanels; i++) {
        GTK.Client.TheClient.get_segments_for_genes( (response) => {
                ThePanels[i].geometrycanvas.geometry.setSegmentStates( response["segments"], SegmentState.LIVE, SegmentState.GHOST );
                ThePanels[i].geometrycanvas.render();
            }, i, e); 
    }
}

function variableChanged(e) {
    setVariable(e);
}

function colormapChanged(e) {
    ThePanels[0].geometrycanvas.geometry.setLUT(e);
    ThePanels[1].geometrycanvas.geometry.setLUT(e);
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


    // connections
        // camera
    linkCameras(ThePanels[0].geometrycanvas, ThePanels[1].geometrycanvas);
        // events
    TheControls.addListener( "locationChanged",        locationChanged );
    TheControls.addListener( "geneChanged",            geneChanged );
    TheControls.addListener( "segmentChanged",         segmentChanged );
    TheControls.addListener( "variableChanged",        variableChanged );
    TheControls.addListener( "colormapChanged",        colormapChanged );
    TheControls.addListener( "createTrack",            createTrack );
    TheControls.addListener( "render",                 renderAllPanels );
    TheControls.addListener( "backgroundColorChanged", updateBackgroundColor );
}

//
// create the project object and load data 
//
GTK.Project.TheProject = new GTK.Project( GTKProjectName );
GTK.Client.TheClient  = new GTK.Client( "http://" + window.location.hostname, window.location.port);
var view;

main( GTK.Project.TheProject );
