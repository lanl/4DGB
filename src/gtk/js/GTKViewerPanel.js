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

class GTKViewerPanel {

    constructor(project, dataset, parent ) {
        var root = document.getElementById(parent);
        this.container = document.createElement("div");
        this.container.className = "gtkviewerpanel";
        root.appendChild(this.container);

        this.title = document.createElement("div");
        this.title.className = "gtktitle";
        this.title.innerHTML = dataset['name'];
        this.container.appendChild(this.title);

        var gc_elem = document.createElement("div");
        gc_elem.id = "gc_elem-" + parent;
        this.container.appendChild(gc_elem);
        this.geometrycanvas = new GTKGeometryCanvas( project, dataset, gc_elem.id );

        // controls
        this.controls = document.createElement("table");
        this.container.appendChild(this.controls);

            // variable
        var row = this.controls.insertRow(0); 
        var name = row.insertCell(0);
        name.innerHTML = "Variable";
        this.updateArrayNames();

        var cell = row.insertCell(1);
        this.variablechoice = document.createElement("select");
        this.variablechoice.setAttribute("type", "text");
        cell.appendChild(this.variablechoice);
        this.variablechoice.addEventListener('change', (function (e) { this.onVariableSelect(e) }).bind(this));

            // colormap
        var row = this.controls.insertRow(1); 
        var name = row.insertCell(0);
        name.innerHTML = "Colormap";

        var cell = row.insertCell(1);
        this.colormapchoice = document.createElement("select");
        this.colormapchoice.setAttribute("type", "text");
        cell.appendChild(this.colormapchoice);
        this.colormapchoice.addEventListener('change', (function (e) { this.onColormapSelect(e) }).bind(this));
        this.updateColormapNames();

        // cell = row.insertCell(2);
        // this.variable = document.createElement("input");
        // this.variable.setAttribute("type", "text");
        // this.variable.value = project.getApplicationData("gtk")['controlpanel']['variable']['current']
        // cell.appendChild(this.variable);

        // contact map 
        var cm_elem = document.createElement("div");
        cm_elem.id = "cm_elem-" + parent;
        this.container.appendChild(cm_elem);
        this.contactmapcanvas = new GTKContactMapCanvas( project, dataset, cm_elem.id )

        // Update view when selection in contact map changes
        this.contactmapcanvas.onSelectionChange = (function(selection) {
            const segments = {};
            const [ [x1,x2], [y1,y2] ] = selection; // start/end coordinates for the selection on each axis

            for (let i = Math.floor(x1); i <= Math.ceil(x2); i++ ) {
                if (!segments[i])
                    segments[i] = true;
            }
            for (let i = Math.floor(y1); i <= Math.ceil(y2); i++ ) {
                if (!segments[i])
                    segments[i] = true;
            }
            const ids = Object.keys(segments).map( d => parseInt(d) );
            this.geometrycanvas.setSegmentStates( ids, GTKSegmentState.LIVE, GTKSegmentState.GHOST );
            this.geometrycanvas.render();
        }).bind(this);
    }

    updateArrayNames() {
        TheGTKClient.get_structure_arrays( (response) => {
            for (const f of response['arrays']) { 
                var option = document.createElement('option');
                option.value = f['name'];
                option.varID = f['id'];
                option.innerHTML = f['name'];
                this.variablechoice.appendChild(option)
            }
        });
    }

    updateColormapNames() {
        var colormaps = [ 'cooltowarm', 'blackbody', 'grayscale', 'rainbow' ]
        for (const c of colormaps) { 
            var option = document.createElement('option');
            option.value = c;
            option.innerHTML = c;
            this.colormapchoice.appendChild(option)
        }
    }

    //
    // get the array from the server
    //
    onVariableSelect(e) {
        var varID = e.target.options[e.target.selectedIndex].varID;
        this.setVariable( varID );
    }

    //
    // set a new colormap 
    //
    onColormapSelect(e) {
        var colormap = e.target.value;
        this.geometrycanvas.geometry.setLUT( e.target.value );
        this.setVariable( this.variablechoice.selectedIndex );
    }

    setVariable( id ) {
        TheGTKClient.get_array( (response) => {
                // TODO: check response
                this.geometrycanvas.geometry.setLUTParameters( response['data']['min'], response['data']['max'] ); 
                this.geometrycanvas.geometry.colorBy( response['name'], response['data']['values']);
                this.geometrycanvas.render();
            }, id);
    }
}

