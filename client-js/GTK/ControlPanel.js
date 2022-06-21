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

const Component         = require('./Component');
const Util              = require('./Util');

const { Selection, UNIT } = require('./selections');
const Dataset = require('./Dataset');
class ControlPanel extends Component {

    constructor(project, parent) {
        super();

        // build UI
        var root = document.getElementById(parent);
        // this.container = document.createElement("div");
        // this.container.className = "gtkviewerpanel";
        // root.appendChild(this.container);

        // title
        // this.title = document.createElement("div");
        // this.title.className = "gtktitle";
        // this.title.innerHTML = "&nbsp";
        // this.container.appendChild(this.title);

        // tabs
        this.tabdiv = document.createElement("div");
        this.tabdiv.className = "tab";
        root.appendChild(this.tabdiv);

        // control tab
        this.globaltab = document.createElement("button");
        this.globaltab.className = "tablinks";
        this.globaltab.innerHTML = "Controls";
        this.globaltab.onclick = (function (e) { this.openTab(e, "globaltab") }).bind(this);
        this.tabdiv.appendChild(this.globaltab);
        this.globaltabcontent = document.createElement("div");
        this.globaltabcontent.className = "tabcontent";
        this.globaltabcontent.id = "globaltab";
        root.appendChild(this.globaltabcontent);
            // table
        this.controls = document.createElement("table");
        this.controls.className = "gtkcontroltable";
        this.globaltabcontent.appendChild(this.controls);

        /** 
         * @type {UNIT} Represents the unit of the text box that the user last
         * edited. This used to pick which unit to use when the "Select" button is pressed.
         **/
        this.lastUpdated;

            // global controls
        var cur_row = 0;
            // title
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.colSpan = 3;
        name.innerHTML = "Selection";
        name.className = "gtktitlecell";

            // location
                // title  
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "Location";
                // entry
        var cell = row.insertCell(1);
        this.locationentry = document.createElement("input");
        this.locationentry.type = "text";
        cell.appendChild(this.locationentry);
        this.locationentry.addEventListener( 'keypress', ((e) => { this.triggerSelection(e, UNIT.LOCATION) }).bind(this) );
        this.locationentry.addEventListener( 'oninput', () => { this.lastUpdated = UNIT.LOCATION } );
                // selection
        var cell = row.insertCell(2);
        this.locationchoice = document.createElement("select");
        this.locationchoice.setAttribute("type", "text");
        cell.appendChild(this.locationchoice);
        this.locationchoice.addEventListener('change', (function (e) { this.addLocation(e) }).bind(this));
        this.updateLocationNames(project);
        
            // gene
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "Annotation";
            // a list of all genes
        this.genes = [];
                // entry
        var cell = row.insertCell(1);
        this.geneentry = document.createElement("input");
        this.geneentry.type = "text";
        cell.appendChild(this.geneentry);
        this.geneentry.addEventListener( 'keypress', ((e) => { this.triggerSelection(e, UNIT.GENE) }).bind(this) );
        this.geneentry.addEventListener( 'oninput', () => { this.lastUpdated = UNIT.GENE } );
                // selection
        var cell = row.insertCell(2);
        this.genechoice = document.createElement("select");
        this.genechoice.setAttribute("type", "text");
        // this.genechoice.className = "gtkcontrolpanelselect";
        cell.appendChild(this.genechoice);
        this.genechoice.addEventListener('change', (function (e) { this.addGene(e) }).bind(this));
        this.updateGeneNames(project);

            // segment
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "Segments";
                // entry
        var cell = row.insertCell(1);
        this.segmententry = document.createElement("input");
        this.segmententry.type = "text";
        cell.appendChild(this.segmententry);
        this.segmententry.addEventListener( 'keypress', ((e) => { this.triggerSelection(e, UNIT.SEGMENT) }).bind(this) );
        this.segmententry.addEventListener( 'oninput', () => { this.lastUpdated = UNIT.SEGMENT } );
                // selection
        var cell = row.insertCell(2);
//      this.segmentchoice = document.createElement("select");
//      this.segmentchoice.setAttribute("type", "text");
//      cell.appendChild(this.segmentchoice);
//      // HACK don't show this for now (until it does something)
//      this.segmentchoice.style.visibility = "hidden";
//          // end HACK
//      this.segmentchoice.addEventListener('change', (function (e) { this.onSegmentSelect(e) }).bind(this));
        // this.updateSegments(project);
            // selection 
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "";
            // button
        var cell = row.insertCell(1);
        this.select = document.createElement("button");
        this.select.innerHTML = "Select";
        cell.appendChild(this.select);
        this.select.onclick = (function (e) { this.triggerSelection(e, this.lastUpdated) }).bind(this);

            // title
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.colSpan = 3;
        name.innerHTML = "Data";
        name.className = "gtktitlecell";

            // variable
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "Variable";

        var cell = row.insertCell(1);
        cell.colSpan = 2;
        this.variablechoice = document.createElement("select");
        this.variablechoice.setAttribute("type", "text");
        // this.variablechoice.className = "gtkcontrolpanelselect";
        cell.appendChild(this.variablechoice);
        this.updateArrayNames(project);
        this.variablechoice.value = this.controller.settings.variable;
        this.variablechoice.addEventListener('change', (e) => {
            this.controller.updateVariable(this.variablechoice.value, this);
        });

            // colormap
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "Colormap";

        var cell = row.insertCell(1);
        this.colormapchoice = document.createElement("select");
        this.colormapchoice.setAttribute("type", "text");
        cell.appendChild(this.colormapchoice);
        this.updateColormapNames();
        this.colormapchoice.value = this.controller.settings.colormap;
        this.colormapchoice.addEventListener('change', (e) => {
            this.controller.updateColormap(this.colormapchoice.value, this);
        });

            // title
        if (false) {
            var row = this.controls.insertRow(cur_row); 
            cur_row += 1;
            var name = row.insertCell(0);
            name.colSpan = 3;
            name.innerHTML = "Data Track";
            name.className = "gtktitlecell";
        }
        // track creation button 
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "";
            // button
        var cell = row.insertCell(1);
        this.createTrack = document.createElement("button");
        this.createTrack.innerHTML = "Create Data Tracks";
        cell.appendChild(this.createTrack);
        this.createTrack.onclick = () => { this.controller.addNewTrack() }

        // track clear button 
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "";
            // button
        var cell = row.insertCell(1);
        this.clearTracks = document.createElement("button");
        this.clearTracks.innerHTML = "Clear All Tracks";
        cell.appendChild(this.clearTracks);
        this.clearTracks.onclick = () => { this.controller.clearTracks() }


        // global settings (moved to front tab for simplicity)
            // title
        var cur_panel = this.controls; 
        var row = cur_panel.insertRow(cur_row); 
        cur_row += 1;
        var cell = row.insertCell(0);
        cell.colSpan = 3;
        cell.innerHTML = "Settings";
        cell.className = "gtktitlecell";

        // unmapped  
        var row = cur_panel.insertRow(cur_row); 
        cur_row += 1;
        cell = row.insertCell(0);
        cell.colSpan = 2;
        cell.innerHTML = "Show Unmapped Segments";

        cell = row.insertCell(1);
        this.unmappedCheckbox = document.createElement("input");
        this.unmappedCheckbox.setAttribute("type", "checkbox");
        this.unmappedCheckbox.checked = this.controller.settings.showUnmappedSegments; 
        this.unmappedCheckbox.addEventListener('change', (e) => {
            this.controller.updateShowUnmappedSegments(this.unmappedCheckbox.checked, this);
        });
        cell.appendChild(this.unmappedCheckbox);

        // background
        var row = cur_panel.insertRow(cur_row); 
        cur_row += 1;
        cell = row.insertCell(0);
        cell.colSpan = 2;
        cell.innerHTML = "Background";

        cell = row.insertCell(1);
        this.bgColorInput = document.createElement("input");
        this.bgColorInput.id = "controlpanel-settings-background";
        this.bgColorInput.setAttribute("type", "color");
        this.bgColorInput.value = this.controller.settings.backgroundColor;
        this.bgColorInput.addEventListener('change', (e) => {
            this.controller.updateBackgroundColor(this.bgColorInput.value, this);
        });
        cell.appendChild(this.bgColorInput);

        // contact map threshold slider
        row = cur_panel.insertRow(cur_row);
        cur_row += 1;
        cell = row.insertCell();
        cell.colSpan = 2;
        cell.innerText = "Contact Map Threshold"
        cell = row.insertCell();
        cell.colSpan = 1;
        this.thresholdSlider = document.createElement('input');
        this.thresholdSlider.id = "controlpanel-settings-threshold";
        this.thresholdSlider.setAttribute("type", "range");
        this.thresholdSlider.setAttribute("min", "0.001");
        this.thresholdSlider.setAttribute("max", "0.1");
        this.thresholdSlider.setAttribute("step", "0.001");
        this.thresholdSlider.addEventListener('input', (e) => {
            // The slider ranges from 0.001 to 0.1, but moving it all the way to the max just sets
            // the threshold to 1.0
            const value = this.thresholdSlider.value >= 0.1 ? 1.0 : this.thresholdSlider.value;
            this.controller.updateContactThreshold(value, this);
        });
        cell.appendChild(this.thresholdSlider);

        // reset camera button
        row = cur_panel.insertRow(cur_row);
        cur_row += 1;
        cell = row.insertCell(0);
        cell.colSpan = 3;
        this.resetCamera = document.createElement('button');
        this.resetCamera.innerText = "Reset Camera";
        this.resetCamera.onclick = () => {
            this.controller.updateCenterPosition(null);
            this.controller.updateCameraPosition(
                project.getApplicationData('gtk')['geometrycanvas']['scene']['camera']['position']
            );
        };
        cell.appendChild(this.resetCamera);

        // clear settings button
        row = cur_panel.insertRow(cur_row);
        cur_row +=1;
        cell = row.insertCell(0);
        cell.colSpan = 3;
        this.clearSettings = document.createElement('button');
        this.clearSettings.innerText = "Clear Settings";
        this.clearSettings.onclick = () => {
            // Clear settings from browser's local storage
            const params = new URLSearchParams(window.location.search);
            if (params.has('gtkproject')) {
                const store = window.localStorage;
                const key = `settings_${params.get('gtkproject')}`;
                store.removeItem(key);

                // Refresh page
                window.location.reload();
            }
        }
        cell.appendChild(this.clearSettings);

        // intermediate data section
        // (only included if the project datasets have that data)
        const datasets = project.getDatasets().map( (d) => new Dataset(d) )
        if ( datasets.every( (d)=> d.input_set_url ) ) {
            // title
            var row = cur_panel.insertRow(cur_row);
            cur_row += 1;
            var cell = row.insertCell(0);
            cell.colSpan = 3;
            cell.innerHTML = "Intermediate Data"
            cell.className = "gtktitlecell";

            for (let i in datasets) {
                const dataset = datasets[i];
                const title = dataset.name || dataset.id;
                var row = cur_panel.insertRow(cur_row);
                cur_row += 1;
                cell = row.insertCell(0);
                cell.colSpan = 1;
                cell.innerText = `${title}:`;

                // Input
                cell = row.insertCell();
                cell.colSpan = 2;
                const input_link = document.createElement('a');
                input_link.innerText = "Input/Output Contact Records";
                input_link.href = `/contact_set.html?d=${i}`;
                cell.appendChild(input_link);
            }
        }

        // create the links section
            // title
        var row = cur_panel.insertRow(cur_row); 
        cur_row += 1;
        var cell = row.insertCell(0);
        cell.colSpan = 3;
        cell.innerHTML = "Links";
        cell.className = "gtktitlecell";

            // links
        var row = cur_panel.insertRow(cur_row); 
        cur_row += 1;
        cell = row.insertCell(0);
        cell.colSpan = 2;
        cell.innerHTML = "4D Genome Browser Docs";
            // button
        var cell = row.insertCell(1);
        this.openDocs = document.createElement("button");
        this.openDocs.innerHTML = "4DGB Documentation";
        cell.appendChild(this.openDocs);
        this.openDocs.onclick = (function (e) { this.onOpenDocumentation(e) }).bind(this);

            // links
        var row = cur_panel.insertRow(cur_row); 
        cur_row += 1;
        cell = row.insertCell(0);
        cell.colSpan = 2;
        cell.innerHTML = "About 4D Genome Browser";
            // button
        var cell = row.insertCell(1);
        this.aboutDocs = document.createElement("button");
        this.aboutDocs.innerHTML = "About 4DGB";
        cell.appendChild(this.aboutDocs);
        this.aboutDocs.onclick = (function (e) { this.onAboutDocumentation(e) }).bind(this);

        // select the default tab
        this.globaltab.click();

    }

    //
    // returns a color of the form #000000
    //
    getBackgroundColor() {
        var elem = document.getElementById("controlpanel-settings-background");
        return elem.value; 
    }

    getCurrentLocation() {
        return this.locationchoice.options[this.locationchoice.selectedIndex].value;
    }

    getCurrentGene() {
        return this.genechoice.options[this.genechoice.selectedIndex].value;
    }

    getCurrentVariableID() {
        return this.variablechoice.options[this.variablechoice.selectedIndex].varID;
    }

    getCurrentVariableName() {
        return this.variablechoice.options[this.variablechoice.selectedIndex].value;
    }

    getCurrentColormapName() {
        return this.colormapchoice.options[this.colormapchoice.selectedIndex].value;
    }

    updateArrayNames(project) {
        for (let f of project.getVariables()) {
            var option = document.createElement('option');
            option.value = f['id'];
            option.innerText = f['name'];
            this.variablechoice.appendChild(option)
        }
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

    updateGeneNames(project) {
        for (const f of project.getApplicationData("gtk")['controlpanel']['gene']['favorites']) {
            var option = document.createElement('option');
            option.value = f;
            option.innerHTML = f;
            this.genechoice.appendChild(option);
                // keep a list of all the genes
            this.genes.push(f);
        }
    }

    updateLocationNames(project) {
        for (const f of project.getApplicationData("gtk")['controlpanel']['location']['favorites']) {
            var option = document.createElement('option');
            option.value = f;
            option.innerHTML = f;
            this.locationchoice.appendChild(option)
        }
    }

    /**
     * Called by an event listener on either the "Select" button or one of the three
     * text boxes for defining a selection. Triggers an update to the Selection Controller
     * @param {Event} e source event
     * @param {UNIT} unit Unit to use to create the selection
     */
    triggerSelection(e, unit) {
        // If this was from a keypress (meaning it came from one of the text boxes)
        // but the key *wasn't* <Enter>, then ignore this.
        if (e.type === 'keypress') {
            this.lastUpdated = unit;
            if (e.keyCode !== 13 /*enter key*/) return;
        }

        switch (unit) {
            // update selection based off selected unit type
            case UNIT.LOCATION:
                if (this.validateLocations()) {
                    const locations = Util.rangeStringToRanges( this.locationentry.value );
                    this.controller.updateSelection( Selection.fromLocations(locations), this );
                }
                break;

            case UNIT.SEGMENT:
                if (this.validateSegments()) {
                    const segments = Util.rangeStringToRanges( this.segmententry.value );
                    this.controller.updateSelection( Selection.fromSegments(segments), this );
                }
                break;

            case UNIT.GENE:
                if (this.validateGenes()) {
                    const genes = this.geneentry.value.replace(/\s+/g, '').split(",");
                    this.controller.updateSelection( Selection.fromGenes(genes), this );
                }
                break;
        }
    }

    /**
     * Called in response to the 'selectionChanged' event on the selection controller
     */
    onSelectionChanged(selection, options) {
        this.locationentry.value = Util.rangesToRangeString( selection.asLocations() );
        this.segmententry.value  = Util.rangesToRangeString( selection.asSegments()  );

        // To prevent excess fetch calls, we don't retrieve the genes until the selection
        // has stabilized (debounced)
        if (options.debounced) {
            selection.asGenes().then( (genes) => {
                // If the selection changed again by the time this resolves, forget it
                if (this.controller.selection !== selection) return;
                this.geneentry.value = genes.join(',') 
            });
        }
    }

    onVariableChanged(value, options) {
        if (options.source === this) return; // ignore an event that came from this Control Panel
        this.variablechoice.value = value;
    }

    onColormapChanged(value, options) {
        if (options.source === this) return; // ignore an event that came from this Control Panel
        this.colormapchoice.value = value;
    }

    onShowUnmappedSegmentsChanged(value, options) {
        if (options.source === this) return; // ignore an event that came from this Control Panel
        this.unmappedCheckbox.checked = value;
    }

    onBackgroundColorChanged(value, options) {
        if (options.source === this) return; // ignore an event that came from this Control Panel
        this.bgColorInput.value = value;
    }

    /**
     * 
     * @param {*} e 
     * @param {*} tabname 
     */

    openTab(e, tabname) {
        // Declare all variables
        var i, tabcontent, tablinks;

        // Get all elements with class="tabcontent" and hide them
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }

        // Get all elements with class="tablinks" and remove the class "active"
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }

        // Show the current tab, and add an "active" class to the button that opened the tab
        var tab = document.getElementById(tabname);
        tab.style.display = "block";
        e.currentTarget.className += " active";
    }

    // general entry helper functions
    // ---------------------------------------------------------------------------------
    getSelectedValueList( entry ) {
        var values = entry.value;
        var valuelist = [] 
        if (values != "") {
            var eachValue = values.split(",");
            for ( var i = 0; i < eachValue.length; i++ ) { 
                valuelist.push(eachValue[i])
            }
        }

        return valuelist;
    }

    addValueToEntry( entry, newvalue, valuelist ) {
        if (valuelist.length > 0) {
            if ( ! valuelist.includes(newvalue)) {
                entry.value = entry.value + "," + newvalue;
            }
        } else {
            entry.value = newvalue;
        }
    }

    eraseEntry( entry ) {
        entry.value = "";
    }

    // location helper functions
    // ---------------------------------------------------------------------------------
    getSelectedLocationsList() {
        return this.getSelectedValueList( this.locationentry );
    }

    addLocation() {
        this.eraseEntry(this.geneentry);
        this.eraseEntry(this.segmententry);
        if (this.lastUpdated != UNIT.LOCATION) {
            this.eraseEntry(this.locationentry);
            this.lastUpdated = UNIT.LOCATION;
        }

        this.addValueToEntry( this.locationentry, this.getCurrentLocation(), this.getSelectedLocationsList() ); 
    }

    validateLocations() {
        var vlist = this.getSelectedLocationsList(); 
        var success = true;
        for ( var i = 0; i < vlist.length; i++ ) { 
            if ( false ) {
                alert("Invalid gene: " + glist[i])
                success = false;
                break;
            }
        }

        return success; 
    }

    // gene helper functions
    // ---------------------------------------------------------------------------------
    getSelectedGenesList() {
        return this.getSelectedValueList( this.geneentry );
    }

    addGene(e) {
        this.eraseEntry(this.locationentry);
        this.eraseEntry(this.segmententry);
        if (this.lastUpdated != UNIT.GENE) {
            this.eraseEntry(this.geneentry);
            this.lastUpdated = UNIT.GENE;
        }

        this.addValueToEntry( this.geneentry, this.getCurrentGene(), this.getSelectedGenesList() ); 
    }

    validateGenes() {
        var glist = this.getSelectedGenesList(); 
        var success = true;
        for ( var i = 0; i < glist.length; i++ ) { 
            if ( ! this.genes.includes(glist[i]) ) {
                alert("Invalid gene: " + glist[i])
                success = false;
                break;
            }
        }

        return success; 
    }

    // segment helper functions
    // ---------------------------------------------------------------------------------
    getSelectedSegmentsList() {
        return this.getSelectedValueList( this.segmententry );
    }

    addSegment(e) {
        this.eraseEntry(this.locationentry);
        this.eraseEntry(this.geneentry);
        if (this.lastUpdated != UNIT.SEGMENT) {
            this.eraseEntry(this.segmententry);
            this.lastUpdated = UNIT.SEGMENT;
        }

        this.addValueToEntry( this.segmententry, this.getCurrentSegment(), this.getSelectedSegmentsList() ); 
    }

    validateSegments() {
        var glist = this.getSelectedSegmentsList(); 
        var success = true;
        for ( var i = 0; i < glist.length; i++ ) { 
            if ( false ) { 
                alert("Invalid gene: " + glist[i])
                success = false;
                break;
            }
        }

        return success; 
    }

    onOpenDocumentation(e) {
        window.open("v0.9.0.pdf", '_blank').focus();
    }

    onAboutDocumentation(e) {
        window.open("https://github.com/lanl/4DGB/wiki/About-v0.9", '_blank').focus();
    }

}

module.exports = ControlPanel;
