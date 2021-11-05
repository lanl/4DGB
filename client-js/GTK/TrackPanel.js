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

const TrackChart = require('./TrackChart');
const Component  = require('./Component');
const Project    = require('./Project');
const Client     = require('./Client');

class TrackPanel extends Component {

    static CurID = 0;

    constructor(parentID, topDataset, bottomDataset) {
        super();
        // container
        this.container = document.createElement("div"); 
        this.container.className = "gtktrackpanel";

        this.topDataset = topDataset;
        this.bottomDataset = bottomDataset;

        // title
        this.title = document.createElement("div");
        this.title.className = "gtktrackpaneltitle";
        this.container.appendChild(this.title);
        this.setTitle("Tracks")
        this.topTitle = this.topDataset.name;
        this.bottomTitle = this.bottomDataset.name;
        this.titles = [this.topTitle, this.bottomTitle];

        // charts
        this.charts = document.createElement("div");
        this.charts.className = "gtktrackpanelcharts";
        this.container.appendChild(this.charts);

        var parent = document.getElementById(parentID);
        parent.appendChild(this.container);
    }

    setTrackTitles( top, bottom ) {
        this.topTitle = top;
        this.bottomTitle = bottom;
    }

    setTitle(title) {
        this.title.innerHTML = title;
    }

    setDims(w, h) {
        this.container.style.width = w;
        this.container.style.height = h;
    }

    onTracksChanged(tracks, options) {
        if (!options.debounced) return;

        // Clear current tracks
        while (this.charts.firstChild) {
            this.charts.removeChild(this.charts.firstChild);
        }

        // Populate tracks
        for (let track of tracks) {
            const {variable, locationRange} = track;
            const [start, end] = locationRange;
            const varname = Project.TheProject.getVariableByID(variable).name;
            const title = `${varname}: (${start} - ${end})`;

            // Create container for chart pair
            const cont = document.createElement('div');
            cont.className = 'gtktrackpanelpaircontainer';
            cont.innerText = title;
            this.charts.insertBefore(cont, this.charts.firstChild);

            // Function to fetch data and create chart
            const make_chart = (index) => new Promise( (resolve, reject) => {
                Client.TheClient.get_sampled_array( (response) => { try {
                    const data = response['data'];
    
                    // Create chart labels
                    const labels = [];
                    const incr = Math.max( (end-start)/data.length, 1);
                    for (let i = start; i < end; i += incr)
                        labels.push[i];
    
                    // Build chart
                    const chart = new TrackChart( this.titles[index] );
                    cont.appendChild(chart.element);
                    chart.make(labels, data);

                    resolve();

                } catch (e) { reject(e); }
                }, variable, index, locationRange[0], locationRange[1], 200);
            });

            // Create charts
            make_chart(0).then( () => make_chart(1) );
        }
    }

    //
    // generate a unique ID name
    //
    generateCurIDName () {
        TrackPanel.CurID += 1;
        return "gtktrackpanelpaircontainer_" + TrackPanel.CurID;
    }

    //
    // push a new container on the top of the stack
    //
    pushContainer(label, callback) {
        var pair = document.createElement("div");
        pair.className = "gtktrackpanelpaircontainer";
        pair.id = this.generateCurIDName(); 
        pair.innerHTML = label; 
        pair.addEventListener("click", function(){callback(this);} );
        pair.addEventListener("contextmenu", function(ev) { ev.preventDefault(); alert('success!'); return false; }, false);

        this.charts.insertBefore(pair, this.charts.firstChild);
    }

    //
    // add track data to the current container
    //
    addTrackToCurrentContainer(labels, values, title, position) { 
        var track = new TrackChart(title);
        if ((this.charts.firstChild.childElementCount > 0) && (position == 0)) {
            // insert before
            this.charts.firstChild.insertBefore(track.element, this.charts.firstChild.lastChild)
        } else {
            // append the item
            this.charts.firstChild.appendChild(track.element)
        }

        // charts[i].setYValLimits( min, max );
        track.make( labels, values );
    }
}

module.exports = TrackPanel;
