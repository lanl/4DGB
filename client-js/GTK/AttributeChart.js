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
var AttributeChartWidth = 400;
var AttributeChartHeight = 50;

class AttributeChart {
    constructor(doc, parent) {
        this.data;
        this.limitsY= [];
        this.container = doc.createElement("div");
        this.container.className = "gtkattributechart";
        this.chartdiv  = doc.createElement("div");
        this.container.appendChild(this.chartdiv);

        parent.appendChild(this.container);
    }

    loadData(state, chrom, start, end) {
        this.makeTitle(chrom, start, end);

        var request = new XMLHttpRequest();
        request.open('GET', `/bbi/${state}/0/${chrom}/${start}/${end}`, false);
        request.send(null);

        var values = "";
        if (request.readyState == 4 && (request.status == 0 || request.status == 200)) {
            values = JSON.parse(request.responseText);
        }

        // format the data for the Chartist object
        this.data = {
            "labels" : values["labels"],
            "series" : [values["series"]]
        };
    }

    getMin() {
        // TODO: check on existence of data
        return Math.min(...this.data["series"][0])
    }

    getMax() {
        // TODO: check on existence of data
        return Math.max(...this.data["series"][0])
    }

    makeChart() {
        var options = {
            showArea: true,
            showLine: true,
            showPoint: false,
            lineSmooth: true,
            width:  AttributeChartWidth, 
            height: AttributeChartHeight,
            chartPadding: {
                top: 10,
                right: 5,
                bottom: 5,
                left: 5
            },
            axisX: {
                showLabel: false,
                offset: 0
            },
            borderColor: 'rgba(0,0,0,0)'
        }

        if (this.limitsY.length == 2) {
            options["low"] = this.limitsY[0];
            options["high"] = this.limitsY[1];
        }

        // Create a new line chart object where as first parameter we pass in a selector
        // that is resolving to our chart container element. The Second parameter
        // is the actual data object.
        new Chartist.Line(this.chartdiv, this.data, options);
    }

    setYValLimits( min, max ) {
        this.limitsY.push(min);
        this.limitsY.push(max);
    }

    makeTitle(chrom, start, end) {
        // this.titlediv.innerHTML = `<table><tr><td>chrom:</td><td>${chrom}</td></tr><tr><td>position:</td><td>${start}-${end}</td></tr></table>`;
    }
}

module.exports = AttributeChart;
