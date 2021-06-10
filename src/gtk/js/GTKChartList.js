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

class GTKChartList {
    constructor(doc, parent) {
        // container
        this.container = doc.createElement("div"); 
        this.container.className = "gtkchartlist";
        // title
        this.title = doc.createElement("div");
        this.title.className = "gtkchartlisttitle";
        this.container.appendChild(this.title);
        // charts
        this.charts = doc.createElement("div");
        this.charts.className = "gtkchartlistcharts";
        this.container.appendChild(this.charts);

        parent.appendChild(this.container);
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
        var chart = new GTKAttributeChart(document, this.charts);
        chart.loadData(state, chrom, start, end);
    }

    addPair(label, callback, states, chrom, start, end) {
        // pair container
        var pair = document.createElement("div");
        pair.className = "gtkchartlistpaircontainer";
        this.charts.insertBefore(pair, this.charts.firstChild);
        pair.innerHTML = `${label} Position: ${start}-${end}`;
        pair.callbackdata = pair.innerHTML;
        var min =  1000000.0;
        var max = -1000000.0;
        var charts = [];
        for (var i=0;i < states.length; i++) {
            charts.push(new GTKAttributeChart(document, pair)); 
            charts[i].loadData(states[i], chrom, start, end);
            var curMin = charts[i].getMin();
            var curMax = charts[i].getMax();
            if (curMin < min) {
                min = curMin; 
            }
            if (curMax > max) {
                max = curMax; 
            }
        }
        for (var i=0;i < states.length; i++) {
            charts[i].setYValLimits( min, max );
            charts[i].makeChart();
        }

        pair.addEventListener("click", function(){callback(this);} );
        pair.addEventListener("contextmenu", function(ev) { ev.preventDefault(); alert('success!'); return false; }, false);
    }
}
