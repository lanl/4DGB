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

var GTKViews = [];
var GTKCharts;
var Interval = 0;

function main( project, numviews ) {
    // globals
    Interval = project.getDatasets()["attributes"]["interval"];

    // first view
    GTKViews.push(new GTKGeometryView(project, 0));
    GTKViews[0].setSelectCallback(setSegmentSelectCallback);

    // charts
    var elem  = document.getElementById("gtkbodyrow");
    var groot = document.createElement("td");
    groot.className = "gtkbodytd";
    elem.appendChild(groot);

    GTKCharts = new GTKChartList(document, groot); 
    GTKCharts.setTitle(project.getApplicationData("gtk")["chartlist"]["title"]);

    // second view 
    GTKViews.push(new GTKGeometryView(project, 1));
    GTKViews[1].setSelectCallback(setSegmentSelectCallback);

    //for (var i=0;i<numviews;i++) {
        //GTKViews.push(new GTKGeometryView(project, i));
    //}
    // link the cameras
    GTKViews[0].controls.addEventListener( 'change', () => {
        GTKViews[1].camera.position.copy( GTKViews[0].camera.position );
        GTKViews[1].camera.rotation.copy( GTKViews[0].camera.rotation );
        GTKViews[1].render();
    });
    GTKViews[1].controls.addEventListener( 'change', () => {
        GTKViews[0].camera.position.copy( GTKViews[1].camera.position );
        GTKViews[0].camera.rotation.copy( GTKViews[1].camera.rotation );
        GTKViews[0].render();
    });

    // location
    elem = document.getElementById("seqloc");
    elem.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            var elem = document.getElementById("seqloc");
            onSetSequenceLocation(elem.value);
        }
    });
    elem = document.getElementById("locfavorite");
    elem.addEventListener("change", function(event) {
        event.preventDefault();
        var elem = document.getElementById("locfavorite");
        var seqloc = document.getElementById("seqloc");
        seqloc.value = elem.value;
        onSetSequenceLocation(elem.value);
    });

    // gene
    var elem = document.getElementById("seqgene");
    elem.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            var elem = document.getElementById("seqgene");
            onSetGene(elem.value);
        }
    });
    elem = document.getElementById("genefavorite");
    elem.addEventListener("change", function(event) {
        event.preventDefault();
        var elem = document.getElementById("genefavorite");
        var geneloc = document.getElementById("seqgene");
        geneloc.value = elem.value;
        onSetGene(elem.value);
    });

    // threshold
    var elem = document.getElementById("variablename");
    var option = document.createElement("option");
    option.text = project.getApplicationData("gtk")["chartlist"]["variable"]["name"];
    elem.add(option);
    elem.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            thingToDo();
        }
    });

    // set up favorites
    var elem = document.getElementById("genefavorite");
    var favs = project.getApplicationData("gtk")["favorites"]["genes"]; 
    for (var i=0; i< favs.length; i++) {
        option = document.createElement("option");
        option.text = favs[i]; 
        elem.add(option);
    }
    var elem = document.getElementById("locfavorite");
    favs = project.getApplicationData("gtk")["favorites"]["locations"]; 
    for (var key in favs) { 
        option = document.createElement("option");
        option.text = `${favs[key][0]}-${favs[key][1]}`; 
        elem.add(option);
    }

    var elem = document.getElementById("valthresh");
    elem.value = parseFloat(project.getApplicationData("gtk")["chartlist"]["variable"]["threshold"]);
    elem.min = parseFloat(project.getApplicationData("gtk")["chartlist"]["variable"]["min"]);
    elem.max = parseFloat(project.getApplicationData("gtk")["chartlist"]["variable"]["max"]);
    elem.step = 0.01;
    elem.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            var varName = document.getElementById("variablename").value;
            onSetValueThreshold(varName, elem.value);
        }
    });
    elem.addEventListener("change", function(event) {
        event.preventDefault();
        var varName = document.getElementById("variablename").value;
        onSetValueThreshold(varName, elem.value);
    });
}

function onSetSequenceLocation(value, createCharts=true) {
    var valStrings = value.split("-");
    var values = [parseInt(valStrings[0]), parseInt(valStrings[1])];
    for (var i = 0; i < GTKViews.length; i++) {
        var segments = GTKViews[i].model.getSegmentsForLocationRange(values);
        GTKViews[i].setSegmentStates( segments, GTKSegmentState.LIVE, GTKSegmentState.GHOST );
        GTKViews[i].render();
    }
    // other update
    document.getElementById("seqgene").value = "";

    // add charts
    if (createCharts) {
        var states = [0, 1];
        var label = "Sequence";
        GTKCharts.addPair(label, queryCallback, states, "chrX", values[0], values[1]); 
    }
}

function setSegmentSelectCallback(segment) {
    var elem = document.getElementById("seqloc");
    elem.value = `${(segment-1)*Interval}-${segment*Interval}`;
    onSetSequenceLocation(elem.value);
}

function queryCallback(element) {
    var data = element.callbackdata.split(" ");
    if (data[0] == "Gene:") {
        var elem = document.getElementById("seqgene");
        elem.value = data[1];
        onSetGene(data[1], false);
    } else if (data[0] == "Sequence") {
        var elem = document.getElementById("seqloc");
        elem.value = data[2];
        onSetSequenceLocation(data[2], false);
    }
}

function onSetGene(gene, createCharts=true) {
    // TODO: check if this is value
    // assuming that this is the same for both views
    var segments = GTKViews[0].getSegmentsForGene(gene);
    for (var i = 0; i < GTKViews.length; i++) {
        GTKViews[i].setSegmentStates( segments, GTKSegmentState.LIVE, GTKSegmentState.GHOST );
        GTKViews[i].render();
    }
    // other update
    document.getElementById("seqloc").value  = "";

    // add charts
    if (createCharts) {
        var states = [0, 1];
        var label = `Gene: ${gene}`; 
        if (segments.length == 1) {
            GTKCharts.addPair(label, queryCallback, states, "chrX", (segments[0]-1)*Interval, segments[0]*Interval );
        } else {
            GTKCharts.addPair(label, queryCallback, states, "chrX", (segments[0]-1)*Interval, segments[segments.length - 1]*Interval );
        }
    }
}

function onSetValueThreshold(varName, value)
{
    for (var i = 0; i < GTKViews.length; i++) {
        GTKViews[i].model.setValueThreshold(varName, value);
        GTKViews[i].render();
    }
    // other update
    document.getElementById("seqloc").value  = "";
    document.getElementById("seqgene").value = "";
}

function thingToDo()
{
    alert("Button code executed.");
}

//
// create the project object and load data 
//
var project = new GTKProject( GTKProjectName );
main( project, GTKNumViews );
