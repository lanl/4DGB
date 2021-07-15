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
 * Widget displaying contact map data on a canvas.
 * 
 * The user can click-and-drag on the image to select a region of the contact map. If the user holds
 * down the spacebar, then they can use the scroll wheel to zoom in or out of the image and
 * click-and-drag to pan across it.
 * 
 * You can listen to changes in the selection made on the map by assigning a function to
 * the onSelectionChange property.
 */
class GTKContactMapCanvas {

    /**
     * The DOM layout of the widget looks like this:
     *      div (this.contdiv)
     *          - svg (this.baseSVG)
     *              - g (xaxis)
     *              - g (yaxis)
     *          - canvas
     *          - svg (this.brushSVG)
     *          - svg (this.zoomSVG)
     * 
     * Click-and-drag selection, and zooming/panning are implemented using D3's brush and zoom
     * tools respectively. However, brush and zoom aren't normally designed to work together, so
     * a work-around is used:
     * 
     * The SVG element which handles zooming is overlayed on top of the SVG that handles brushing,
     * but has it's 'pointer-events' attribute set to 'none'. So, by default, mouse events go
     * through the zoomSVG and are recieved by the brushSVG, meaning that clicking and dragging over
     * the canvas will create a selection with the brush. When this script is loaded, it adds
     * 'keyup' and 'keydown' event listeners to the whole window which will listen for a particular
     * key (in this case, the spacebar) and toggle the 'pointer-events' attribute on the zoomSVG
     * of all active instances of this class to 'all'. So, while the spacebar is held down, mouse
     * events are recieved by the zoomSVG and now clicking and dragging over the canvas will pan
     * the viewport, while scrolling with zoom in or out.
     * 
    */

    /**
     * An array of (weak references to) all of the instances of this class.
     * Used to globally toggle zoom controls (which are controlled by a global
     * event listener)
     */
    static instances = [];

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
         * Display options for the canvas (as defined in the project configuration)
         */
        this.displayOpts = project.getApplicationData("gtk")["contactmapcanvas"];

        /**
         * Margins separating the canvas from the edges of the widget
         * (the axes are placed in these margins)
         */
        this.margin = { top: 25, right: 25, bottom: 25, left: 25 };
        this.margin.innerWidth  = this.displayOpts["width"]  - ( this.margin.left + this.margin.right  );
        this.margin.innerHeight = this.displayOpts["height"] - ( this.margin.top  + this.margin.bottom );

        /**
         * A d3 selection of the large SVG container.
         * This contains the x and y axis, but most importantly, it is what enforces the
         * size of the whole widget. It has an explicit width and height and doesn't have
         * it's position set to 'absolute' like most other pieces, so the contdiv
         * will expand to match this SVG's width and height.
         */
        this.baseSVG = d3.create('svg')
            .attr('width',  this.displayOpts["width"] )
            .attr('height', this.displayOpts["height"]);
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

        /** A d3 selection of a text label displaying help to the user */
        this.helpLabel = d3.create('span')
            .attr('style', `
                position: absolute;
                bottom: 5px;
                left: ${self.margin.left + 10}px;
            `)
            .text("Click-and-drag to select. Hold Space to zoom & pan");
        this.contdiv.appendChild(this.helpLabel.node());

        /** A d3 selection of the SVG handling brush selection */
        this.brushSVG = d3.create('svg').call(overlay)
            .classed('brushsvg', true);
            this.contdiv.appendChild(this.brushSVG.node());
            
            /** A d3 selection of the SVG handling zooming/panning */
            this.zoomSVG = d3.create('svg').call(overlay)
            .classed('zoomsvg', true)
            .attr('pointer-events', 'none');
        this.contdiv.appendChild(this.zoomSVG.node());

        // Placeholders for fields that aren't initialized until after
        // the data loads

        /**
         * @type {GTKContactMap} The contact map data.
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.contactMap = null;

        /**
         * @type {ImageData} The contact map rendered to ImageData (one pixel per bin)
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.imageData = null;

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
         * A d3 scale mapping (fractional) bin numbers to pixels on the canvas along the x-axis.
         * This scale doesn't take into account zooming or panning, and always represents the
         * scale used when fully zoomed-out.
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.xScaleOriginal = null;

        /**
         * A d3 scale mapping (fractional) bin numbers to pixels on the canvas along the y-axis.
         * This scale doesn't take into account zooming or panning, and always represents the
         * scale used when fully zoomed-out.
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.yScaleOriginal = null;

        /**
         * A d3-brush function used to handle click-and-drag selection
         */
        this.brush = null;

        /**
         * A d3-zoom function used to handle zooming and panning
         */
        this.zoom = null;

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

        // Add to global list of instances
        GTKContactMapCanvas.instances.push( new WeakRef(this) );
    }

    /**
     * Called automatically after contact map data has been loaded
     * @param {GTKContactMap} contactMap 
     */
    _afterLoad(contactMap) {
        this.contactMap = contactMap;

        // Render image
        this.imageData = this._renderToImageData(contactMap);

        const rect = contactMap.bounds;
        const margin = this.margin;

        // Initialize scales
        this.xScaleOriginal = d3.scaleLinear()
            .domain([ rect.x, rect.x + rect.width    ])
            .range ([ 0,      this.margin.innerWidth ]);
        this.yScaleOriginal = d3.scaleLinear()
            .domain([ rect.y, rect.y + rect.height    ])
            .range ([ 0,      this.margin.innerHeight ]);

        this.xScale = this.xScaleOriginal.copy();
        this.yScale = this.yScaleOriginal.copy();

        // Create and add axes
        this.baseSVG.append('g')
            .classed('xaxis', true)
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .call( d3.axisTop(this.xScale) );
        this.baseSVG.append('g')
            .classed('yaxis', true)
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .call( d3.axisLeft(this.yScale) );

        const MAX_ZOOM = 10;

        // Add brush
        this.brush = d3.brush()
            // the brush extents are sized to fit the entire contact map even when
            // zoomed in all the way. That way, brushes can be moved outside of the viewport
            // when zooming and panning
            .extent([
                [ -margin.innerWidth * (MAX_ZOOM-1), -margin.innerHeight * (MAX_ZOOM-1) ],
                [ margin.innerWidth * MAX_ZOOM,      margin.innerHeight * MAX_ZOOM ]
            ])
            .on( 'brush end', (e) => { this._onBrush(e) } );
        this.brushSVG.call(this.brush);

        // Add zoom
        this.zoom = d3.zoom()
            .scaleExtent([1, MAX_ZOOM])
            .translateExtent([ [0,0], [margin.innerWidth, margin.innerHeight] ])
            .on( 'zoom', (e) => { this._onZoom(e) } );
        this.zoomSVG.call(this.zoom);

        this._redrawCanvas();
    }

    /**
     * Handler for the d3-brush "brush" event, called whenever the
     * selection changes.
     * ( call so that 'this' still refers to this GTKContactMapCanvas instance ) 
     */
    _onBrush(event) {
        // If there isn't a handler set, then just forget it
        if (this.onSelectionChange === undefined) return;

        // Ignore if the brush moved as a result of panning or zooming
        if (event.sourceEvent && event.sourceEvent.type === 'zoom') return;

        // event.selection defines the coorindates (in pixels) of the corners of the
        // selection. We convert that to the extents of the selection along each axis
        // (in bin numbers)

        const selection = event.selection;
        let selected;

        if (selection === null) {
            // No selection with the brush is equivalent to just selecting the whole area
            selected = [ this.xScaleOriginal.domain(), this.yScaleOriginal.domain() ]
        }
        else {
            const coords = this._scaleBrushSelection(selection, this.xScale.invert, this.yScale.invert);
            selected = [
                [ coords[0][0], coords[1][0] ],
                [ coords[0][1], coords[1][1] ]
            ];
        }

        // Clamp selection to boundaries
        const rect = this.contactMap.bounds;
        selected[0][0] = Math.max( rect.x,                   selected[0][0] );
        selected[0][1] = Math.min( rect.x + rect.width - 1,  selected[0][1] )
        selected[1][0] = Math.max( rect.y,                   selected[1][0] );
        selected[1][1] = Math.min( rect.y + rect.height - 1, selected[1][1] )

        //console.log(`Selection: (X: ${selected[0][0]} - ${selected[0][1]} ) (Y: ${selected[1][0]} - ${selected[1][1]} )`)

        this.onSelectionChange(selected);
    }

    /**
     * Handler for the d3-zoom "zoom" event, called whenever the viewport
     * is zoomed or panned.
     * ( call so that 'this' still refers to this GTKContactMapCanvas instance )
     */
    _onZoom(event) {
        const trans = event.transform;

        // Get brush selection
        let selection = d3.brushSelection( this.brushSVG.node() );
        if (selection !== null) {
            selection = this._scaleBrushSelection(selection, this.xScale.invert, this.yScale.invert);
        }

        // Transform scales
        this.xScale = trans.rescaleX(this.xScaleOriginal);
        this.yScale = trans.rescaleY(this.yScaleOriginal);

        // Move brush to new position after transformation
        if (selection !== null) {
            selection = this._scaleBrushSelection(selection, this.xScale, this.yScale);
            this.brush.move( this.brushSVG, selection, event );
        }

        // Redraw axes
        this.baseSVG.select('.xaxis').call( d3.axisTop(this.xScale) );
        this.baseSVG.select('.yaxis').call( d3.axisLeft(this.yScale) );

        this._redrawCanvas();
    }

    /**
     * Render a contact map to ImageData
     * @param {GTKContactMap} cm 
     * @returns {ImageData}
     */
    _renderToImageData(cm) {
        const pixels = new Uint8ClampedArray(cm.data.length * 4);

        const magnification = this.displayOpts["magnify"] || 1;

        for (let i = 0; i < pixels.length; i+= 4) {
            const val = cm.data[i/4];

            const normalized = (val - cm.minValue) / (cm.maxValue - cm.minValue) * magnification;

            // color scale from white to red
            pixels[i]   = 255;                // red
            pixels[i+1] = (1-normalized)*255; // green
            pixels[i+2] = pixels[i+1];        // blue (same as green)
            pixels[i+3] = 255;                // alpha
        }

        return new ImageData(pixels, cm.bounds.width, cm.bounds.height);
    }

    /**
     * Repaint the contact map onto the canvas.
     * Should call this any time the viewport is zoomed or panned
     */
    _redrawCanvas() {
        const img = this.imageData;
        if (img === null) return;

        const tempCanvas = document.createElement("canvas")
        tempCanvas.width  = img.width;
        tempCanvas.height = img.height;
        tempCanvas.getContext('2d').putImageData(img, 0, 0);

        const ctx = this.canvas.node().getContext('2d');
        ctx.clearRect(0, 0, this.margin.innerWidth, this.margin.innerHeight);
        ctx.save();

        const trans = d3.zoomTransform(this.zoomSVG.node());
        ctx.translate(trans.x, trans.y);
        ctx.scale(trans.k, trans.k);

        ctx.scale( this.margin.innerWidth/img.width, this.margin.innerHeight/img.height );

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0);

        ctx.restore();
    }

    /**
     * Given a selection from a d3 brush, return a selection scaled according
     * to the given scales for x/y axes.
     */
    _scaleBrushSelection(selection, xScale, yScale) {
        return selection.map( ([x,y]) => [ xScale(x), yScale(y) ] );
    }

}

// Add a global key event listener which will toggle the
// 'pointer-events' attribute on the zoomSVG of all instances
addEventListener('keydown', (event) => {
    if (event.key !== ' ' && !event.repeat) return;

    GTKContactMapCanvas.instances = GTKContactMapCanvas.instances.filter( (d) => d.deref() !== undefined );
    for (let instance of GTKContactMapCanvas.instances) {
        const component = instance.deref();

        component.zoomSVG.attr('pointer-events', 'all');
    }
});

addEventListener('keyup', (event) => {
    if (event.key !== ' ' && !event.repeat) return;

    GTKContactMapCanvas.instances = GTKContactMapCanvas.instances.filter( (d) => d.deref() !== undefined );
    for (let instance of GTKContactMapCanvas.instances) {
        const component = instance.deref();

        component.zoomSVG.attr('pointer-events', 'none');

    }
});
