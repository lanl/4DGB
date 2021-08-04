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

class GTKControlPanel {

    constructor(project, parent) {
        var root = document.getElementById(parent);

        this.title = document.createElement("div");
        this.title.className = "gtktitle";
        this.title.innerHTML = "This is the title";
        root.appendChild(this.title);

        var table = document.createElement("table");
        root.appendChild(table);

        // title
        var cur_row = 0;
        var row = table.insertRow(cur_row); 
        var name = row.insertCell(0);
        name.innerHTML = "Selection";
        name.className = "gtktitlecell";
        name.colSpan = "3";
        cur_row += 1;

        // location
        row = table.insertRow(cur_row);
        name = row.insertCell(0);
        name.innerHTML = "Location";

        var cell = row.insertCell(1);
        this.locationchoice = document.createElement("select");
        this.locationchoice.setAttribute("type", "text");
        cell.appendChild(this.locationchoice);
        for (const f of project.getApplicationData("gtk")['controlpanel']['location']['favorites']) {
            var option = document.createElement('option');
            option.value = f;
            option.innerHTML = f;
            this.locationchoice.appendChild(option)
        }

        cell = row.insertCell(2);
        this.location = document.createElement("input");
        this.location.setAttribute("type", "text");
        this.location.value = project.getApplicationData("gtk")['controlpanel']['location']['current']
        cell.appendChild(this.location);
        cur_row += 1;

        // gene
        row = table.insertRow(cur_row);
        name = row.insertCell(0);
        name.innerHTML = "Gene";

        var cell = row.insertCell(1);
        this.genechoice = document.createElement("select");
        this.genechoice.setAttribute("type", "text");
        cell.appendChild(this.genechoice);
        for (const f of project.getApplicationData("gtk")['controlpanel']['gene']['favorites']) {
            var option = document.createElement('option');
            option.value = f;
            option.innerHTML = f;
            this.genechoice.appendChild(option)
        }

        cell = row.insertCell(2);
        this.gene = document.createElement("input");
        this.gene.setAttribute("type", "text");
        this.gene.value = project.getApplicationData("gtk")['controlpanel']['gene']['current']
        cell.appendChild(this.gene);
        cur_row += 1; 
    }
}
