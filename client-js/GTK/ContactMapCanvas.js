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

const Project = require('./Project');
const Dataset = require('./Dataset');
const ContactMap = require('./ContactMap');

const EventEmitter = require('events');

/**
 * @class ContactMapCanvas
 * 
 * Widget displaying contact map data on a canvas.
 * 
 * The user can click-and-drag on the image to select a region of the contact map. If the user holds
 * down the spacebar, then they can use the scroll wheel to zoom in or out of the image and
 * click-and-drag to pan across it.
 * 
 * This class is also an EventEmitter, you can add a listener to the 'selectionChanged' event
 * to listen for changes made in the selection. This will be called with an array as an argument
 * where each element is a Segment ID to be included in the selection.
 * 
 * TODO: The format for representing selections is meant to match the format used by the
 * GeometryCanvas class, and isn't really ideal for the ContactMap. In the future, we should have
 * an actual type that can represent Selections for either in a more efficient way.
 */
class ContactMapCanvas extends EventEmitter {

    /**
     * The DOM layout of the widget looks like this:
     *      div (this.contdiv)
     *          - div (this.boundingDiv)
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
     * Create a new ContactMapCanvas, appending itself as a child to the element with
     * the specified DOM ID.
     * 
     * Once constructed, this will automatically begin fetching and loading the contact map
     * data in the background. The full widget will appear with everything enabled once loading
     * has finished.
     *
     * @param {Project} project The Project this belongs to
     * @param {Dataset} dataset The Dataset containing the contact map this will display
     * @param {String} rootElemID The DOM ID of the element this will be appended to.
     */
    constructor(project, dataset, rootElemID) {
        super();
        const self = this;

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
         * The div acting as the widget's "bounding box".
         * This is what enforces the size of the whole widget. It has an explicit width and height
         * and doesn't have it's position set to 'absolute' like most other pieces, so the contdiv
         * will expand to match this SVG's width and height.
         */
        this.boundingDiv = d3.create('div')
            .attr('style', `
                position: relative;
                width:    ${this.displayOpts.width}px;
                height:   ${this.displayOpts.height}px;
            `).node();
        this.contdiv.appendChild(this.boundingDiv);

        /**
         * A d3 selection of the large SVG container.
         * This contains the x and y axis.
         */
        this.baseSVG = d3.create('svg')
            .attr('width',  this.displayOpts["width"] )
            .attr('height', this.displayOpts["height"])
            .attr('style', `
                position: absolute;
                top:    0px;
                left:   0px;
                bottom: 0px;
                right:  0px;
            `);
        this.boundingDiv.appendChild(this.baseSVG.node());
        //this.contdiv.appendChild(this.baseSVG.node());

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
        this.boundingDiv.appendChild(this.canvas.node());
        //this.contdiv.appendChild(this.canvas.node());

        /** A d3 selection of a text label displaying help to the user */
        /**
        this.helpLabel = d3.create('span')
            .attr('style', `
                position: absolute;
                bottom: 5px;
                left: ${self.margin.left + 10}px;
            `)
            .text("Click-and-drag to select. Hold Space to zoom & pan");
        this.contdiv.appendChild(this.helpLabel.node());
        **/

        /** A d3 selection of the SVG handling brush selection */
        this.brushSVG = d3.create('svg').call(overlay)
            .classed('brushsvg', true);
        this.boundingDiv.appendChild(this.brushSVG.node());
        //this.contdiv.appendChild(this.brushSVG.node());
            
            /** A d3 selection of the SVG handling zooming/panning */
            this.zoomSVG = d3.create('svg').call(overlay)
            .classed('zoomsvg', true)
            .attr('pointer-events', 'none');
        this.boundingDiv.appendChild(this.zoomSVG.node());
       //this.contdiv.appendChild(this.zoomSVG.node());

        // Placeholders for fields that aren't initialized until after
        // the data loads

        /**
         * @type {ContactMap} The contact map data.
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
         * colormap for rendering data
         */
        this.lutNumBins   = 256;
        this.lut = new THREE.Lut( this.displayOpts["colormap"], this.lutNumBins ); 
        this.lut.min = this.displayOpts["threshold"]; 
        this.lut.max = 1.0;
            // the color value is of the form 0xCCCCCC, so we must convert it to 
            // #CCCCCC in order to use it with the canvas context 
        this.background = "#" + this.displayOpts["background"].substring(2); 

        // Load data
        ContactMap.loadNew( dataset.md_contact_mp )
            .then( (contactMap) => this._afterLoad(contactMap) );

        // Add to global list of instances
        ContactMapCanvas.instances.push( new WeakRef(this) );
    }

    /**
     * Set the selection within the canvas.
     * 
     * This takes its 'segments' parameter in the same format that GeometryCanvas does,
     * i.e. As an array of segment IDs to be included in the selection. This takes the first
     * two contiguous sets of segment IDs that it finds in the list and uses that to set the
     * brush selection.
     * 
     * Calling this function will *NOT* trigger the 'selectionChanged' event.
     * 
     * @param {Number[]} segments
     */
    setSelection(segments, event) {

        // Split an array of integers, into an array of arrays specifying the ranges of
        // continous stretches of numbers.
        function splitIntoRanges(array) {
            if (array === undefined || array.length === 0) return [];
            
            const ranges = [ [array[0],array[0]] ];
            if (array.length === 1) return ranges;

            let currentRange = 0;
            for (let i = 1; i < array.length; i++) {
                if ( segments[i] === segments[i-1]+1) { // continue this range
                    ranges[currentRange][1] = segments[i];
                }
                else { // start the next range
                    ranges[++currentRange] = [segments[i],segments[i]];
                }
            }
            return ranges;
        }

        const ranges = splitIntoRanges(segments);
        if (ranges.length === 1) {
            // If there was only one range, we set the second part of the selection equal to it
            ranges[1] = ranges[0];
        }

        let selection = null;
        if (ranges.length >= 2) {
            selection = this._scaleBrushSelection([
                [ ranges[0][0], ranges[1][0] ],
                [ ranges[0][1], ranges[1][1] ]
            ], this.xScale, this.yScale)
        }

        // Move brush
        this.brush.move( this.brushSVG, selection, new Event("setSelection") );
    }

    /**
     * Set the brush selection in this contact map to be the same as the brush selection
     * in another contact map widget. This will *NOT* trigger a 'selectionChanged' event.
     * 
     * Since there are multiple ways a selection of the same regions can be represented on the map,
     * having a contact map set the selection of another through 'selectionChanged' event and
     * setSelection method is not sufficient, since the second contact map's brush will usually
     * be a different shape than the first's (even though it marks out an equivalent region). So
     * this method exists as a hack to force the brushes of two contact maps to match.
     * 
     * @param {ContactMapCanvas} other 
     */
    _syncBrush(other) {
        const otherSelection = d3.brushSelection(other.brushSVG.node());
        this.brush.move( this.brushSVG, otherSelection, new Event("syncBrush") );
    }

    /**
     * Called automatically after contact map data has been loaded
     * @param {ContactMap} contactMap 
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
     * brush selection changes.
     * ( call so that 'this' still refers to this ContactMapCanvas instance ) 
     */
    _onBrush(event) {
        // Ignore if the brush moved as a result of panning/zooming
        // or from calling an internal method.
        if (event.sourceEvent && (
            event.sourceEvent.type === 'zoom' ||
            event.sourceEvent.type === 'setSelection' ||
            event.sourceEvent.type === 'syncBrush'
        )) return;

        // event.selection defines the coorindates (in pixels) of the corners of the
        // selection. We convert that an array of segmentIDs that are included in the selection.
        // (it's inefficient, but this is the same format that the GeometryCanvas class accepts)

        const bounds = this.contactMap.bounds;
        let extents;
        if (event.selection === null) {
            // No selection with the brush is equivalent to just selecting the whole area
            extents = [
                [ bounds.x, bounds.x+bounds.width-1  ],
                [ bounds.y, bounds.y+bounds.height-1 ]
            ]
        }
        else {
            // Otherwise, get extents from brush selection
            let [ [x1,y1],[x2,y2] ] = this._scaleBrushSelection(event.selection, this.xScale.invert, this.yScale.invert);
            // Clamp selection to boundaries
            x1 = Math.max( bounds.x,                     Math.floor(x1) );
            x2 = Math.min( bounds.x + bounds.width - 1,  Math.ceil(x2)  );
            y1 = Math.max( bounds.y,                     Math.floor(y1) );
            y2 = Math.min( bounds.y + bounds.height - 1, Math.ceil(y2)  );
            extents = [ [x1,x2], [y1,y2] ];
        }

        let segments = {}; //segments is an object/hash initially to avoid duplicates
        for (let extent of extents) {
            for (let i = extent[0]; i <= extent[1]; i++) segments[i] = true;
        }

        // change segments to array of IDs
        segments = Object.keys(segments).map( d => parseInt(d) );

        this.emit('selectionChanged', segments);
    }

    /**
     * Handler for the d3-zoom "zoom" event, called whenever the viewport
     * is zoomed or panned.
     * ( call so that 'this' still refers to this ContactMapCanvas instance )
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
     * @param {ContactMap} cm 
     * @returns {ImageData}
     */
    _renderToImageData(cm) {
        const pixels = new Uint8ClampedArray(cm.data.length * 4);

        const magnification = this.displayOpts["magnify"] || 1;

        for (let i = 0; i < pixels.length; i+= 4) {
            const val = cm.data[i/4];
            const normalized = (val - cm.minValue) / (cm.maxValue - cm.minValue) * magnification;

            if (normalized <= this.lut.min) {
                pixels[i]   = this.lutNumBins-1; 
                pixels[i+1] = this.lutNumBins-1;
                pixels[i+2] = this.lutNumBins-1; 
                pixels[i+3] = 0;
            } else {
                const color = this.lut.getColor(normalized);

                // color using the lut 
                pixels[i]   = color.r*(this.lutNumBins-1);
                pixels[i+1] = color.g*(this.lutNumBins-1);
                pixels[i+2] = color.b*(this.lutNumBins-1); 
                pixels[i+3] = this.lutNumBins-1;
            }
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
        ctx.fillStyle = this.background; 
        ctx.fillRect(0, 0, this.margin.innerWidth, this.margin.innerHeight);
        // ctx.clearRect(0, 0, this.margin.innerWidth, this.margin.innerHeight);
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

    ContactMapCanvas.instances = ContactMapCanvas.instances.filter( (d) => d.deref() !== undefined );
    for (let instance of ContactMapCanvas.instances) {
        const component = instance.deref();

        component.zoomSVG.attr('pointer-events', 'all');
    }
});

addEventListener('keyup', (event) => {
    if (event.key !== ' ' && !event.repeat) return;

    ContactMapCanvas.instances = ContactMapCanvas.instances.filter( (d) => d.deref() !== undefined );
    for (let instance of ContactMapCanvas.instances) {
        const component = instance.deref();

        component.zoomSVG.attr('pointer-events', 'none');

    }
});

module.exports = ContactMapCanvas;
