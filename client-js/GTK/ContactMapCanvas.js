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

const Component = require('./Component');
const Project = require('./Project');
const Dataset = require('./Dataset');
const ContactMap = require('./ContactMap');
const Util = require('./Util');
const ScalarBarCanvas = require('./ScalarBarCanvas');

const { Selection } = require('./selections');

const MAX_ZOOM = 10;

/**
 * @class ContactMapCanvas
 * 
 * Widget displaying contact map data on a canvas.
 * 
 * The user can click-and-drag on the image to select regions of the contact map. If the user holds
 * down the spacebar, then they can use the scroll wheel to zoom in or out of the image and
 * click-and-drag to pan across it.
 */
class ContactMapCanvas extends Component {

    /**
     * The DOM layout of the widget looks like this:
     *      div (this.contdiv)
     *          - div (this.boundingDiv)
        *          - svg (this.baseSVG)
        *              - g (xaxis)
        *              - g (yaxis)
        *          - canvas
        *          - button (clear brushes)
        *          - svg (this.brushSVG)
        *              - g (brushgroup) (multiple of these)
        *          - svg (this.zoomSVG)
     * 
     * Click-and-drag selection, and zooming/panning are implemented using D3's brush and zoom
     * tools respectively. However, d3-brush doesn't allow for multiple selected regions and doesn't
     * normally work alongside d3-zoom. So a few hacks are used:
     * 
     * For multiple brush selections: We use a variation of a solution devised by Ludwig Schubert
     * here ( https://github.com/ludwigschubert/d3-brush-multiple ). In essence, we create multiple
     * SVG groups with one for each brush. When a selection is made in one, we turn off pointer
     * events in its .overlay object. This makes it so that its brush can still be moved, but
     * clicking outside the brush area will fall through to the next brush layer and create a new
     * brush, instead of overriding the old brush. The _onBrushEnd function (tied to the brushes'
     * 'end' event) handles selectively turning pointer events on or off and ensures that there is
     * always a free brush layer to create a new selection.
     *
     * For zooming and panning: The SVG element which handles zooming is overlayed on top of the SVG
     * that handles brushing, but has it's 'pointer-events' attribute set to 'none'. So, by default,
     * mouse events go through the zoomSVG and are recieved by the brushSVG, meaning that clicking
     * and dragging over the canvas will create a selection with the brushes. When this script is
     * loaded, it adds 'keyup' and 'keydown' event listeners to the whole window which will listen
     * for a particular key (in this case, the spacebar) and toggle the 'pointer-events' attribute
     * on the zoomSVG of all active instances of this class to 'all'. So, while the spacebar is held
     * down, mouse events are recieved by the zoomSVG and now clicking and dragging over the canvas
     * will pan the viewport, while scrolling with zoom in or out.
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
        this.contdiv.className = "gtkcontactmapcontainer";
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
        this.margin = { top: 25, right: 25, bottom: 30, left: 30 };
        this.margin.innerWidth  = this.displayOpts["width"]  - ( this.margin.left + this.margin.right  );
        this.margin.innerHeight = this.displayOpts["height"] - ( this.margin.top  + this.margin.bottom );

        /**
         * the brush extents are sized to fit the entire contact map even when
         * zoomed in all the way. That way, brushes can be moved outside of the viewport
         * when zooming and panning
         */
        this.brushExtents = [
            [ -this.margin.innerWidth * (MAX_ZOOM-1), -this.margin.innerHeight * (MAX_ZOOM-1) ],
            [ this.margin.innerWidth * MAX_ZOOM,      this.margin.innerHeight * MAX_ZOOM ]
        ];

        /**
         * The div acting as the widget's "bounding box".
         * This is what enforces the size of the whole widget. It has an explicit width and height
         * and doesn't have it's position set to 'absolute' like most other pieces, so the contdiv
         * will expand to match this div's width and height.
         */
        this.boundingDiv = d3.create('div')
            .attr('style', `
                position: relative;
                width:    ${this.displayOpts.width}px;
                height:   ${this.displayOpts.height}px;
            `).node();
        this.boundingDiv.className = "gtkcontactmapboundingdiv";
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

        // Sets CSS attributes on a selection to make it work
        // as an overlay that fits within the margins
        const overlay = (g) => g
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
            
        /** A d3 selection of the SVG handling zooming/panning */
        this.zoomSVG = d3.create('svg').call(overlay)
            .classed('zoomsvg', true)
            .attr('pointer-events', 'none');
        this.boundingDiv.appendChild(this.zoomSVG.node());

        // Placeholders for fields that aren't initialized until after
        // the data loads

        /**
         * @type {ContactMap} The contact map data.
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.contactMap = null;

        /**
         * @type {ImageData} The contact map rendered to ImageData (one pixel per segment)
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.imageData = null;

        /**
         * A d3 scale mapping (fractional) segment numbers to pixels on the canvas along the x-axis.
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.xScale = null;
        /**
         * A d3 scale mapping (fractional) segment numbers to pixels on the canvas along the y-axis.
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.yScale = null;

        /**
         * A d3 scale mapping (fractional) segment numbers to pixels on the canvas along the x-axis.
         * This scale doesn't take into account zooming or panning, and always represents the
         * scale used when fully zoomed-out.
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.xScaleOriginal = null;

        /**
         * A d3 scale mapping (fractional) segment numbers to pixels on the canvas along the y-axis.
         * This scale doesn't take into account zooming or panning, and always represents the
         * scale used when fully zoomed-out.
         * This is null when first constructed, but will be set once data has finished loading
         */
        this.yScaleOriginal = null;

        /**
         * Array of d3-brush instances controlling the different selection brushes
         */
        this.brushes = [];

        /**
         * A d3-zoom function used to handle zooming and panning
         */
        this.zoom = null;

        /**
         * Whether or not the Contact Map has finished loading
         */
        this.loaded = false;

        /**
         * colormap for rendering data
         */
        this.lutNumBins   = 256;
        this.lut = new THREE.Lut( this.displayOpts["colormap"], this.lutNumBins ); 
        this.lut.setMin(this.displayOpts["threshold"]);
        this.lut.setMax(1.0);
            // the color value is of the form 0xCCCCCC, so we must convert it to 
            // #CCCCCC in order to use it with the canvas context 
        this.background = "#" + this.displayOpts["background"].substring(2); 

        // Load data
        ContactMap.loadNew( dataset.md_contact_mp ).then( (contactMap) => {
            /***********************************************************************
             * This chunk is called after the contact map data has finished loading
            *************************************************************************/
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

            // Add the first brush
            this._addBrush();

            // Add zoom
            this.zoom = d3.zoom()
                .scaleExtent([1, MAX_ZOOM])
                .translateExtent([ [0,0], [margin.innerWidth, margin.innerHeight] ])
                .on( 'zoom', (e) => { this._onZoom(e) } );
            this.zoomSVG.call(this.zoom);

            this._redrawCanvas();

            this.loaded = true;

            // If our controller has a selection made on it, apply it now
            if (this.controller.selection) {
                this.onSelectionChanged(this.controller.selection, {})
            }

        });

        // Add to global list of instances
        ContactMapCanvas.instances.push( new WeakRef(this) );

        // Add some other elements
        this.metadata = document.createElement("div");
        this.metadata.className = "gtkcontactmappanel";
        this.metadata.width = 150;
        this.metadata.height = 150;
        this.contdiv.appendChild(this.metadata);

        // set metadata text
        this._updateMetaHTML(project, dataset);

        // add a scalar bar
        this.scalarBarCanvas = new ScalarBarCanvas(this.metadata);
        this.scalarBarCanvas.setLUT(this.lut);
        this.scalarBarCanvas.title = "";
        this.scalarBarCanvas.left  = "0px";
        this.scalarBarCanvas.top   = "160px";

        /** A d3 selection of a button to clear all of the selection brushes */
        this.clearButton = d3.create('button')
            .attr('style', `
                position: relative;
                bottom: -280px;
                left: ${self.margin.left}px
            `)
            .text("Clear selection")
            .on('click', () => this._clearBrushes() );
        this.boundingDiv.appendChild(this.clearButton.node());
    }

    set metatext(t) {
        this.metadata.innerHTML = t;
    }

    /**
     * Called in response to 'selectionChanged' events. Moves the brushes
     */
    onSelectionChanged(selection, options) {
        const { source, decoration } = options;

        // If we haven't finished loading, ignore this (we'll set the selection ourselves
        // when we're done loading)
        if (!this.loaded) return;

        // Ignore an event that was generated by this very same Contact Map
        if (source === this) return;

        if (decoration && decoration.brushes) {
            // If the event has a set of brush coordinates with it (because it came from
            // another contact map), we can just use those
            this._redrawBrushes( decoration.brushes );
        }
        else {
            // Otherwise, we determine our brush coordinates based off the selected segments
            const brushCoords = selection.asSegments()
                // split into pairs of ranges (it's ok if we leave one alone at the end)
                .reduce( (acc, range) => {
                    const last = acc[acc.length-1];
                    if (last.length === 2) acc.push([range])
                    else last.push(range)
                    return acc;
                }, [[]])
                // convert to brush coordintes
                .map( this._segmentRangesToBrushCoords );
    
            this._redrawBrushes( brushCoords );
        }
    }

    /**
     * Add a new brush layer to the Contact Map. The new SVG 'g' object will be
     * placed before all the others and have a 'brushid' attribute to identify
     * its corresponding brush as an index in this.brushes.
     */
    _addBrush() {
        const brushID = this.brushes.length;
        const brush = d3.brush()
            .extent(this.brushExtents)
            .on( 'brush', (e) => { this._onBrush(e, brushID);    })
            .on( 'end',   (e) => { this._onBrushEnd(e, brushID); });
        
        this.brushSVG.insert('g', ':first-child')
            .classed('brushgroup', true)
            .attr('brushid', brushID)
            .call(brush);

        this.brushes.push(brush);
    }

    /**
     * Called whenever a brush has finished moving. Sets the 'pointer-events'
     * attribute on the associated brush overlay, and ensures there is at least
     * one free brush layer.
     * ( call so that 'this' still refers to this ContactMapCanvas instance ) 
     */
    _onBrushEnd(event, brushID) {
        const brushGroup = this.brushSVG.select(`[brushid="${brushID}"]`);

        if (event.selection === null) {
            // If the brush was just cleared, we can allow this layer to
            // replace the brush again
            brushGroup.select('.overlay').attr('pointer-events', 'all');
            return;
        }

        // Otherwise, there is a selection on the brush that was just moved
        // so we disable the ability to replace the brush on this layer
        brushGroup.select('.overlay').attr('pointer-events', 'none');

        // if every active brush has a selection, then we need to
        // add a new brush layer
        const brushGroups = this.brushSVG.selectAll('.brushgroup').nodes()
        if (brushGroups.every( d3.brushSelection ) ) {
            this._addBrush();
        }
    }

    /**
     * Handler for the d3-brush "brush" event, called whenever a
     * brush selection changes.
     * ( call so that 'this' still refers to this ContactMapCanvas instance ) 
     */
    _onBrush(event) {
        // If there's no selection controller, then no one cares about our new selection
        if (this.controller === undefined) return;

        // Ignore if the brush moved as a result of a function we called
        if (event.sourceEvent && (
            event.sourceEvent.type === 'zoom' ||
            event.sourceEvent.type === 'selectionChanged' ||
            event.sourceEvent.type === 'redraw'
        )) return;

        const brushCoords = this._getBrushCoords();

        const segmentRanges = Util.compressRanges(
            brushCoords.reduce( (acc, sel) =>
                acc.concat( sel ? this._brushCoordsToSegmentRanges(sel) : [] )
            , [] )
        );

        // Update selection (and give brush coordinates along with it)
        const selection = Selection.fromSegments(segmentRanges);
        this.controller.updateSelection(selection, this, { brushes: brushCoords });
    }

    /**
     * Clear all of the brush selections. This will fire an update to the Selection Controller
     * equivalent to selecting the entire area.
     */
    _clearBrushes() {
        // Clear brushes
        this._redrawBrushes( [] );

        // If there's no selection controller, don't bother
        if (this.controller === undefined) return;

        // Get a selection of the entire area
        const bounds = this.contactMap.bounds;
        const selection = Selection.fromSegments([
            [ bounds.x, bounds.x2 ],
            [ bounds.y, bounds.y2 ]
        ]);

        this.controller.updateSelection(selection, this, { brushes: [] });
    }

    /**
     * Handler for the d3-zoom "zoom" event, called whenever the viewport
     * is zoomed or panned.
     * ( call so that 'this' still refers to this ContactMapCanvas instance )
     */
    _onZoom(event) {
        const trans = event.transform;

        const preZoomSelections = this._getBrushCoords();

        // Transform scales
        this.xScale = trans.rescaleX(this.xScaleOriginal);
        this.yScale = trans.rescaleY(this.yScaleOriginal);

        // Redraw axes
        this.baseSVG.select('.xaxis').call( d3.axisTop(this.xScale) );
        this.baseSVG.select('.yaxis').call( d3.axisLeft(this.yScale) );

        this._redrawBrushes( preZoomSelections );
        this._redrawCanvas();
    }

    /**
     * Given an array of brush coordinate pairs (as returned by this._getBrushCoords, for example),
     * move the brushes in the contact map to match the appropriate selections. This will 
     * automatically add new brushes or clear extra ones if needed.
     * 
     * The units for the provided brush coordinates *MUST* be in terms of segment number *NOT*
     * in pixels.
     * 
     * NOTE: This won't delete excess brush layers, only clear their selections.
     */
    _redrawBrushes(coords) {

        const diff = coords.length - this.brushes.length;
        // If there are more selections than we have brushes, add some new brushes
        for (let x = diff; x > 0; x--) this._addBrush();
        // If we have more brushes than there are selections, append some null selections
        for (let x = -diff; x > 0; x--) coords.push(null);

        const scaled = coords.map( (s) => this._scaleBrushCoords(s, this.xScale, this.yScale) );

        for (let i in scaled) {
            const brush = this.brushes[i];
            const group = this.brushSVG.select(`[brushid="${i}"]`);

            brush.move(group, scaled[i], new Event('redraw'));
        }

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

            // color using the lut 
            const color = this.lut.getColor(normalized);
            pixels[i]   = color.r*(255);
            pixels[i+1] = color.g*(255);
            pixels[i+2] = color.b*(255);
            pixels[i+3] = 255; 
            if (normalized <= this.lut.minV) {
                pixels[i+3] = 0;
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
     * Convert a pair of brush coordinates to a pair of segment ranges. The units for the
     * brush coordinates *MUST* be in segment numbers, *NOT* pixels.
     * @param {Int[][]} coords - Brush coordinates given as the coordinates of the two
     * corners of the selection e.g. [ [x1,y1], [x2,y2] ]
     * @returns {Int[][]} - Segment ranges given as the start and end along each axis
     * e.g. [ [x1,x2], [y1,y2] ]
     */
    _brushCoordsToSegmentRanges(coords) {
        const bounds = this.contactMap.bounds;
        let [ [x1,y1], [x2,y2] ] = coords;
        // Clamp selection to boundaries
        x1 = Math.max( bounds.x,  Math.floor(x1) );
        x2 = Math.min( bounds.x2, Math.ceil(x2)  );
        y1 = Math.max( bounds.y,  Math.floor(y1) );
        y2 = Math.min( bounds.y2, Math.ceil(y2)  );
        return [ [x1,x2], [y1,y2] ];

    }

    /**
     * Convert a pair of (or one or zero) segment ranges to an appropriate pair of brush
     * coordinates. The units for the brush coordinates will be in segment numbers *NOT* pixels.
     * @param {Int[][]} ranges - Segment ranges given as the start and end along each axis
     * e.g. [ [x1,x2], [y1,y2] ]
     * @returns {Int[][]} - Brush coordinates given as the coordinates of the two
     * corners of the selection e.g. [ [x1,y1], [x2,y2] ]
     */
    _segmentRangesToBrushCoords(ranges) {
        if (ranges.length === 0) return null;
        const [ x1, x2 ] = ranges[0];
        const [ y1, y2 ] = ranges.length > 1 ? ranges[1] : ranges[0];
        return [ [x1,y1], [x2,y2] ];
    }

    /**
     * Get an array of the coordinate paris for every brush selection. The coordinate pairs
     * will be in the same order as their corresponding brushes in this.brushes, so they can
     * be matched by index.
     */
    _getBrushCoords() {
        return this.brushSVG.selectAll('.brushgroup').nodes()
            .sort( (a,b) => a.getAttribute('brushid') - b.getAttribute('brushid') )
            .map(d3.brushSelection)
            .map( (s) => this._scaleBrushCoords(s, this.xScale.invert, this.yScale.invert)
        );
    }

    /**
     * Given a selection from a d3 brush, return a selection scaled according
     * to the given scales for x/y axes.
     */
    _scaleBrushCoords(selection, xScale, yScale) {
        if (selection === null) return null;
        return selection.map( ([x,y]) => [ xScale(x), yScale(y) ] );
    }

    /**
     * get an html text string that displays metadata information 
     * TODO: make this more robust (requires project data to be present)
     */
    _updateMetaHTML(project, dataset) {
        var d_structure = project.getData("structure", dataset["structure"]); 
        var t_file      = d_structure["url"].split("/");
        var t_structure = t_file[t_file.length - 1];
        var t_interval  = project.getInterval();
        this.metatext   = `
            <small>
            <p><b>${dataset["name"]}</b></p>
            <p>&nbsp</p>
            <p><b>&nbsp&nbsp structure</b></p>
            <p>&nbsp&nbsp &nbsp&nbsp&nbsp ${t_structure}</p>
            <p>&nbsp</p>
            <p><b>&nbsp&nbsp resolution</b></p>
            <p>&nbsp&nbsp &nbsp&nbsp&nbsp ${t_interval} beads</p>
            <p>&nbsp</p>
            <p><b>&nbsp&nbsp hic tolerance</b></p>
            <p>&nbsp&nbsp &nbsp&nbsp&nbsp ${d_structure["hic_comparison_tolerance"]["computed"]}</p>
            </small>
        `;
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
