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

const Publisher = require('./Publisher');
const Client = require('./Client');

class ControlPanel extends Publisher {

    constructor(project, parent) {
        super();

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
        this.settingstab = document.createElement("button");
        this.settingstab.className = "tablinks";
        this.settingstab.innerHTML = "Settings";
        this.settingstab.onclick = (function (e) { this.openTab(e, "settingstab") }).bind(this);
        this.tabdiv.appendChild(this.settingstab);
        this.settingstabcontent = document.createElement("div");
        this.settingstabcontent.className = "tabcontent";
        this.settingstabcontent.id = "settingstab";
        root.appendChild(this.settingstabcontent);
            // table
        this.settings = document.createElement("table");
        this.settings.className = "gtkcontroltable";
        this.settingstabcontent.appendChild(this.settings);

            // global controls
        var cur_row = 0;
            // title
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.colSpan = 2;
        name.innerHTML = "Selection";
        name.className = "gtktitlecell";

            // location
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "Location";

        var cell = row.insertCell(1);
        this.locationchoice = document.createElement("select");
        this.locationchoice.setAttribute("type", "text");
        cell.appendChild(this.locationchoice);
        this.locationchoice.addEventListener('change', (function (e) { this.onLocationSelect(e) }).bind(this));
        this.updateLocationNames(project);
        
            // location
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "Gene";

        var cell = row.insertCell(1);
        this.genechoice = document.createElement("select");
        this.genechoice.setAttribute("type", "text");
        cell.appendChild(this.genechoice);
        this.genechoice.addEventListener('change', (function (e) { this.onGeneSelect(e) }).bind(this));
        this.updateGeneNames(project);

            // title
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.colSpan = 2;
        name.innerHTML = "Coloring";
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
        name.colSpan = 2;
        name.innerHTML = "Data Track";
        name.className = "gtktitlecell";

        // create detail button
        var row = this.controls.insertRow(cur_row); 
        cur_row += 1;
        var name = row.insertCell(0);
        name.innerHTML = "Create a data track";

        var cell = row.insertCell(1);
        this.createTrack = document.createElement("button");
        this.createTrack.innerHTML = "Create";
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
            this.genechoice.appendChild(option)
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
        super.notify("createTrack", this.getCurrentVariableName())
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
}

module.exports = ControlPanel;
