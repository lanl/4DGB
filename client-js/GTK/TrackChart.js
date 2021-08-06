class TrackChart {

    static Width = 400;
    static Height = 50;

    constructor(parentID) {
        this.data;
        this.limitsY= [];

        // layout
        this.container = document.createElement("div");
        this.container.className = "gtkattributechart";
        this.chartdiv  = document.createElement("div");
        this.container.appendChild(this.chartdiv);
        var parent = document.getElementById(parentID);
        parent.appendChild(this.container);
    }


    getMin() {
        // TODO: check on existence of data
        return Math.min(...this.data["series"][0])
    }

    getMax() {
        // TODO: check on existence of data
        return Math.max(...this.data["series"][0])
    }

    make(labels, values) {
        this.data = {
            labels : labels,
            series : [values]
        }
        var options = {
            showArea: true,
            showLine: true,
            showPoint: false,
            lineSmooth: true,
            fullwidth: true,
            width:  TrackChart.Width, 
            height: TrackChart.Height,
            chartPadding: {
                top: 10,
                right: 5,
                bottom: 5,
                left: 5
            },
            axisX: {
                showLabel: true,
                showGrid: false,
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
