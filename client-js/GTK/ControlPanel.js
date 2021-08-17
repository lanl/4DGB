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

const Publisher         = require('./Publisher');
const Client            = require('./Client');
const GeometryCanvas    = require('./GeometryCanvas');

var HACK_numbins = 200;

class ControlPanel extends Publisher {

    // TODO: need to update states consistently across app
    static HACK_state = false;

    constructor(project, parent) {
        super();

        // misc 
        this.selector = "";

        // build UI
        var root = document.getElementById(parent);
        this.container = document.createElement("div");
        this.container.className = "gtkviewerpanel";
        root.appendChild(this.container);

        // title
        this.title = document.createElement("div");
        this.title.className = "gtktitle";
        this.title.innerHTML = "&nbsp";
        this.container.appendChild(this.title);

        // tabs
        this.tabdiv = document.createElement("div");
        this.tabdiv.className = "tab";
        root.appendChild(this.tabdiv);

        // control tab
        this.globaltab = document.createElement("button");
        this.globaltab.className = "tablinks";
        this.globaltab.innerHTML = "Global";
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

        // info 
        this.infotab = document.createElement("button");
        this.infotab.className = "tablinks";
        this.infotab.innerHTML = "Info";
        this.infotab.onclick = (function (e) { this.openTab(e, "infotab") }).bind(this);
        this.tabdiv.appendChild(this.infotab);
        this.infotabcontent = document.createElement("div");
        this.infotabcontent.className = "tabcontent";
        this.infotabcontent.id = "infotab";
        root.appendChild(this.infotabcontent);
            // table
        this.info = document.createElement("table");
        this.info.className = "gtkcontroltable";
        this.infotabcontent.appendChild(this.info);

        // settings
        this.initializeSettingsTab(root, project);

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
        this.locationentry.addEventListener('keypress', (function (e) { this.updateSelection(e, "location") }).bind(this));
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
        name.innerHTML = "Genes";
            // a list of all genes
        this.genes = [];
                // entry
        var cell = row.insertCell(1);
        this.geneentry = document.createElement("input");
        this.geneentry.type = "text";
        cell.appendChild(this.geneentry);
        this.geneentry.addEventListener('keypress', (function (e) { this.updateSelection(e, "gene") }).bind(this));
                // selection
        var cell = row.insertCell(2);
        this.genechoice = document.createElement("select");
        this.genechoice.setAttribute("type", "text");
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
        this.segmententry.addEventListener('keypress', (function (e) { this.updateSelection(e, "segment") }).bind(this));
                // selection
        var cell = row.insertCell(2);
        this.segmentchoice = document.createElement("select");
        this.segmentchoice.setAttribute("type", "text");
        cell.appendChild(this.segmentchoice);
        // HACK don't show this for now (until it does something)
        this.segmentchoice.style.visibility = "hidden";
            // end HACK
        this.segmentchoice.addEventListener('change', (function (e) { this.onSegmentSelect(e) }).bind(this));
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
        this.select.onclick = (function (e) { this.onSelect(e) }).bind(this);

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
        this.variablechoice = document.createElement("select");
        this.variablechoice.setAttribute("type", "text");
        cell.appendChild(this.variablechoice);
        this.variablechoice.addEventListener('change', (function (e) { this.onVariableSelect(e) }).bind(this));
        this.updateArrayNames();

            // colormap
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "Colormap";

        var cell = row.insertCell(1);
        this.colormapchoice = document.createElement("select");
        this.colormapchoice.setAttribute("type", "text");
        cell.appendChild(this.colormapchoice);
        this.colormapchoice.addEventListener('change', (function (e) { this.onColormapSelect(e) }).bind(this));
        this.updateColormapNames();

            // title
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.colSpan = 3;
        name.innerHTML = "Data Track";
        name.className = "gtktitlecell";

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
        this.createTrack.onclick = (function (e) { this.onCreateTrack(e) }).bind(this);

        // select the default tab
        this.globaltab.click();
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

    updateArrayNames() {
        Client.TheClient.get_structure_arrays( (response) => {
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

    onLocationSelect(e) {
        super.notify("locationChanged", e.target.value);
    }

    onGeneSelect(e) {
        super.notify("geneChanged", e.target.value);
    }

    onVariableSelect(e) {
        var varID = e.target.options[e.target.selectedIndex].varID;
        super.notify("variableChanged", varID);
    }

    onColormapSelect(e) {
        super.notify("colormapChanged", e.target.value);
    }

    onCreateTrack(e) {
        super.notify("createTrack", {   varname:    this.getCurrentVariableName(), 
                                        varid:      this.getCurrentVariableID(),
                                        numbins:    HACK_numbins, 
                                        locations:  this.getSelectedLocationsList()})
    }

    onSelect(e) {
        if (this.selector == "gene") {
            if (this.validateGenes()) {
                // bookkeeping
                this.eraseEntry(this.locationentry);
                this.eraseEntry(this.segmententry);

                var values = this.getSelectedGenesList();
                super.notify("geneChanged", values);
            }
        } else if (this.selector == "location") {
            if (this.validateLocations()) {
                // bookkeeping
                this.eraseEntry(this.geneentry);
                this.eraseEntry(this.segmententry);

                var values = this.getSelectedLocationsList();
                super.notify("locationChanged", values[0]);
            }
        } else if (this.selector == "segment") {
            if (this.validateSegments()) {
                // bookkeeping
                this.eraseEntry(this.geneentry);
                this.eraseEntry(this.locationentry);

                var expanded_values = this.valStringToListOfValues( this.segmententry.value );
                super.notify("segmentChanged", expanded_values);
            }
        }
    }

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

    updateSelection(e, type) {
        if (e.keyCode == 13) {
            this.selector = type;

            if (type == "gene") {
                this.onSelect(e);
            } else if (type == "location") {
                this.onSelect(e);
            } else if (type == "segment") {
                this.onSelect(e);
            }
        }
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

    setSelector( type ) {
        this.selector = type;
    }

    // location helper functions
    // ---------------------------------------------------------------------------------
    getSelectedLocationsList() {
        return this.getSelectedValueList( this.locationentry );
    }

    addLocation() {
        this.addValueToEntry( this.locationentry, this.getCurrentLocation(), this.getSelectedLocationsList() ); 
        this.eraseEntry(this.geneentry);
        this.eraseEntry(this.segmententry);
        this.setSelector("location");
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
        // bookkeeping
        this.eraseEntry(this.locationentry);
        this.eraseEntry(this.segmententry);

        this.addValueToEntry( this.geneentry, this.getCurrentGene(), this.getSelectedGenesList() ); 
        this.setSelector("gene");
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
        this.addValueToEntry( this.segmententry, this.getCurrentSegment(), this.getSelectedSegmentsList() ); 
        this.eraseEntry(this.locationentry);
        this.eraseEntry(this.geneentry);
        this.setSelector("segment");
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

    valStringToListOfValues( value ) {
        var cleaned = value.replace(/\s/g, "");
        var vsplit  = cleaned.split(",");

        var values = [];
        var step = 1;
        for (var i=0; i < vsplit.length; i++) {

            var hsplit = vsplit[i].split("-");
            if (hsplit.length == 2) {
                var start = parseInt(hsplit[0]);
                var end   = parseInt(hsplit[1]);
                var range = [...Array(end - start + 1)].map((_, i) => start + i);
                values = values.concat(range);
            } else {
                values.push(parseInt(vsplit[i]));
            }
        }

        return values;
    }

    initializeSettingsTab(parent, project) {
        // create the tab
        this.settingstab = document.createElement("button");
        this.settingstab.className = "tablinks";
        this.settingstab.innerHTML = "Settings";
        this.settingstab.onclick = (function (e) { this.openTab(e, "settingstab") }).bind(this);
        this.tabdiv.appendChild(this.settingstab);
        this.settingstabcontent = document.createElement("div");
        this.settingstabcontent.className = "tabcontent";
        this.settingstabcontent.id = "settingstab";
        parent.appendChild(this.settingstabcontent);

        // create the content 
        this.settings = document.createElement("table");
        this.settings.className = "gtkcontroltable";
        this.settingstabcontent.appendChild(this.settings);

        // controls
        
        // title
        var cur_row = 0;
        var row = this.settings.insertRow(cur_row); 
        cur_row += 1;
        var cell = row.insertCell(0);
        cell.colSpan = 3;
        cell.innerHTML = "GeometryCanvas";
        cell.className = "gtktitlecell";

        // unmapped  
        var row = this.settings.insertRow(cur_row); 
        cur_row += 1;
        cell = row.insertCell(0);
        cell.innerHTML = "Show Unmapped Segments";
        var checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.checked = this.HACK_state; 
        checkbox.addEventListener('change', (function (e) { this.showUnmappedSegments(e) }).bind(this));
        cell.appendChild(checkbox);
    }

    showUnmappedSegments(e) {
        if (event.currentTarget.checked != GeometryCanvas.ShowUnmappedSegments) {
            GeometryCanvas.ShowUnmappedSegments = event.currentTarget.checked;
            super.notify("render");
        }
    }

}

module.exports = ControlPanel;
