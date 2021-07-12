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

/**
 * @class GTKContactMapCanvas
 * 
 * Component displaying contact map data on a canvas. The user can click-and-drag to select regions
 * of the data using d3-brush.
 * 
 * This creates a div inside the root element specified in the constructor. Inside that div is a
 * canvas which displays the contact map, and multiple layers of SVG elements which handle mouse
 * events for selections or contain things like the axes on the side of the map.
 * 
 * You can listen to changes in the selection made on the map by assigning a function to
 * the onSelectionChange property.
 */
class GTKContactMapCanvas {

    /**
     * Create a new GTKContactMapCanvas, appending itself as a child to the element with
     * the specified DOM ID.
     * 
     * Once constructed, this will automatically begin fetching and loading the contact map
     * data in the background. The full widget will appear with everything enabled once loading
     * has finished.
     *
     * @param {GTKProject} project The GTKProject this belongs to
     * @param {GTKDataset} dataset The GTKDataset containing the contact map this will display
     * @param {String} rootElemID The DOM ID of the element this will be appended to.
     */
    constructor(project, dataset, rootElemID) {
        const self = this;

        // Build content div
        /** Div containing all the contents of the contact map widget */
        this.contdiv = document.createElement("div");
        this.contdiv.className = "gtkviewcontainer";
        const gtkroot  = document.getElementById(rootElemID);
        gtkroot.appendChild(this.contdiv);

        // Dimensions
        /**
         * Margins separating the canvas from the edges of the widget
         * (the axes are placed in these margins) 
         */
        this.margin = { top: 25, right: 10, bottom: 10, left: 25 };
        const geom = project.getApplicationData("gtk")["geometrycanvas"];
        this.margin.innerWidth  = geom["width"]  - ( this.margin.left + this.margin.right  );
        this.margin.innerHeight = geom["height"] - ( this.margin.top  + this.margin.bottom );

        /**
         * A d3 selection of the large SVG container.
         * This contains the x and y axis, but most importantly, it is what enforces the
         * size of the whole widget. It has an explicit width and height and doesn't have
         * it's position set to 'absolute' like most of other pieces, so the contdiv
         * will expand to match this SVG's width and height. 
         */
        this.baseSVG = d3.create('svg')
            .attr('width',  geom["width"] )
            .attr('height', geom["height"]);
        this.contdiv.appendChild(this.baseSVG.node());

        // Sets CSS attributes on a selection to make it work
        // as an overlay that fits within the margins
        const overlay = g => g
            .attr('width',  self.margin.innerWidth )
            .attr('height', self.margin.innerHeight)
            .attr('style', `
                position: absolute;
                top:    ${self.margin.top}px;
                left:   ${self.margin.left}px;
                bottom: ${self.margin.bottom}px;
                right:  ${self.margin.right}px;
            `);

        /** A d3 selection of the canvas*/
        this.canvas = d3.create('canvas').call(overlay);
        this.contdiv.appendChild(this.canvas.node());

        /**
         * A d3 selection of the overlay SVG.
         * This is overlayed on top of the canvas and implements the d3-brush for selection
         * (although the brush won't be added until after has been loded)
         */
        this.overlaySVG = d3.create('svg').call(overlay)
        this.contdiv.appendChild(this.overlaySVG.node());

        // Placeholders for fields that aren't initialized until after
        // the data loads

        /**
         * @type {GTKContactMap} The contact map data.
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.contactMap = null;
        /**
         * A d3 scale mapping (fractional) bin numbers to pixels on the canvas along the x-axis.
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.xScale = null;
        /**
         * A d3 scale mapping (fractional) bin numbers to pixels on the canvas along the y-axis.
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.yScale = null;

        /**
         * Another class can set this property to enable a listener for when the selection changes.
         * This will be called as the selection changes with an array of arrays as an argument
         * formatted like so:
         * 
         *      [ [ x1, x2 ], [ y1, y2] ]
         * 
         * Where:
         * 
         *      x1 is the start of the selected range along the x-axis
         *      x2 is the end of the selected range along the x-axis
         *      y1 is the start of the selected range along the y-axis
         *      y2 is the end of the selected range along the y-axis
         * 
         * These values are in terms of bin-number, although they may not be whole numbers
         * for cases where the user has drawn a selection over just a part of a bin.
         */
        this.onSelectionChange = null;

        // Load data
        GTKContactMap.loadNew( dataset.md_contact_mp )
            .then( (contactMap) => this._afterLoad(contactMap) );
    }

    /**
     * Called automatically after contact map data has been loaded
     * @param {GTKContactMap} contactMap 
     */
    _afterLoad(contactMap) {
        this.contactMap = contactMap;

        // Render canvas
        this._renderToImageData(contactMap).then( (img) => this._renderToCanvas(img) );

        // Initialize scales
        const rect = contactMap.bounds;
        const margin = this.margin;
        this.xScale = d3.scaleLinear()
            .domain([ rect.x, rect.x + rect.width    ])
            .range ([ 0,      this.margin.innerWidth ]);
        this.yScale = d3.scaleLinear()
            .domain([ rect.y, rect.y + rect.height    ])
            .range ([ 0,      this.margin.innerHeight ]);

        // Create and add axes
        this.baseSVG.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .call( d3.axisTop(this.xScale) );
        this.baseSVG.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .call( d3.axisLeft(this.yScale) );

        // Add brush
        const brush = d3.brush()
            .on( 'brush end', (e) => { this._onBrush(e) } );
        this.overlaySVG.call(brush);
    }

    /**
     * Handler for the d3-brush "brush" event, called whenever the
     * selection changes.
     * ( call so that 'this' still refers to this GTKContactMapCanvas instance ) 
     */
    _onBrush(event) {
        // If there isn't a handler set, then just forget it
        if (this.onSelectionChange === undefined) return;

        // event.selection defines the coorindates (in pixels) of the corners of the
        // selection. We convert that to the extents of the selection along each axis
        // (in bin numbers)

        let selected;

        if (event.selection === null) {
            // No selection with the brush is equivalent to just selecting the whole area
            selected = [ this.xScale.domain(), this.yScale.domain() ]
        }
        else {
            const coords = event.selection.map( ([x,y]) => [ this.xScale.invert(x), this.yScale.invert(y) ]);
            selected = [
                [ coords[0][0], coords[1][0] ],
                [ coords[0][1], coords[1][1] ] 
            ];
        }

        this.onSelectionChange(selected);
    }

    /**
     * Render a contact map to ImageData
     * @param {GTKContactMap} cm 
     * @returns {Promise<ImageData>}
     */
    async _renderToImageData(cm) {
        const pixels = new Uint8ClampedArray(cm.data.length * 4);

        for (let i = 0; i < pixels.length; i+= 4) {
            const val = cm.data[i/4];

            const normalized = (val - cm.minValue) / (cm.maxValue - cm.minValue);

            // color scale from white to red
            pixels[i]   = 255;                // red
            pixels[i+1] = (1-normalized)*255; // green
            pixels[i+2] = pixels[i+1];        // blue (same as green)
            pixels[i+3] = 255;                // alpha
        }

        return new ImageData(pixels, cm.bounds.width, cm.bounds.height);
    }

    /**
     * Render some ImageData to the canvas
     * @param {ImageData} img
     */
    _renderToCanvas(img) {

        const tempCanvas = document.createElement("canvas")
        tempCanvas.width  = img.width;
        tempCanvas.height = img.height;
        tempCanvas.getContext('2d').putImageData(img, 0, 0);

        const ctx = this.canvas.node().getContext('2d');

        ctx.scale( this.margin.innerWidth/img.width, this.margin.innerHeight/img.height );

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0);
    }

}