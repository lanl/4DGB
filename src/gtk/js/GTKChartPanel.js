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


var GTKChartPanelCurID = 0;

class GTKChartPanel {
    constructor(parentID) {
        // container
        this.container = document.createElement("div"); 
        this.container.className = "gtkchartpanel";

        // title
        this.title = document.createElement("div");
        this.title.className = "gtkchartpaneltitle";
        this.container.appendChild(this.title);
        this.setTitle("Tracks")

        // charts
        this.charts = document.createElement("div");
        this.charts.className = "gtkchartpanelcharts";
        this.container.appendChild(this.charts);

        var parent = document.getElementById(parentID);
        parent.appendChild(this.container);
    }

    receive(e) {
        var something = e;
    }

    clear() {
        while (this.charts.firstChild) {
            this.charts.removeChild(this.charts.firstChild);
        }
    }

    setTitle(title) {
        this.title.innerHTML = title;
    }

    setDims(w, h) {
        this.container.style.width = w;
        this.container.style.height = h;
    }

    add(state, chrom, start, end) {
        var chart = new GTKTrackChart(document, this.charts);
        chart.loadData(state, chrom, start, end);
    }

    generateCurIDName () {
        GTKChartPanelCurID += 1;
        return "gtkchartpanelpaircontainer_" + GTKChartPanelCurID;
    }

    addTracks(label, callback, datasets, chrom, start, end) {
        // pair container
        var pair = document.createElement("div");
        pair.className = "gtkchartpanelpaircontainer";
        pair.id = this.generateCurIDName(); 
        this.charts.insertBefore(pair, this.charts.firstChild);
        pair.innerHTML = `${label} Position: ${start}-${end}`;
        pair.callbackdata = pair.innerHTML;
        var min =  1000000.0;
        var max = -1000000.0;
        var charts = [];

        // make a set of dummy values
        var numbins = 10;
        var incr    = Math.trunc((end-start)/numbins);
        var labels  = [];
        var values  = [];
        for (var i = 0; i < numbins; i++) {
            labels.push(start + i*incr);
            values.push(start + i*incr);
        }
        min = start;
        max = end;

        // create a chart for each dataset
        for (var i=0;i < datasets.length; i++) {
            charts.push(new GTKTrackChart(pair.id)); 
            charts[i].setYValLimits( min, max );
            charts[i].make( labels, values );
        }

        pair.addEventListener("click", function(){callback(this);} );
        pair.addEventListener("contextmenu", function(ev) { ev.preventDefault(); alert('success!'); return false; }, false);
    }
}
