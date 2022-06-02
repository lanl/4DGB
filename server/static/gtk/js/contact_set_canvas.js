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

const SIZE = 650;
const MARGIN = { top: 25, right: 10, bottom: 10, left: 25 };
MARGIN.innerWidth  = SIZE - ( MARGIN.left + MARGIN.right  );
MARGIN.innerHeight = SIZE - ( MARGIN.top  + MARGIN.bottom );

/**
 * @class ContactSetCanvas
 * 
 * This one-off widget is very similar to the Contact Map Canvas, except that it displays a so-called
 * "Contact Set" as opposed to a Contact Map. The difference being that a "Set" doesn't have
 * any values assoicated with each contact, so every pair of coordinates is simply a binary
 * choice between "contacts" or "doesn't contact". These sets are loaded from the input_set
 * and output_set files defined in the dataset.
 * 
 * Also, since this kind of a last-minute supplementary thing, there's no interactive controls
 * or selections either.
 */
class ContactSetCanvas {

    /**
     * Create a new ContactSetCanvas, appending itself as a child to the element
     * with the specified DOM ID.
     * 
     * This will load its data from the contact set file at the specified path.
     * 
     * @param {String} path 
     * @param {String} rootElemID 
     */
    constructor(path, rootElemID) {
        const root = document.getElementById(rootElemID);

        this.path = path;

        /**
         * Div containing all widget contents.
         * Also explicitly determines the size of the widget
         */
        this.boundingDiv = d3.create('div')
            .attr('style', `
                position: relative;
                width:  ${SIZE}px;
                height: ${SIZE}px;
            `)
            .node();
        this.boundingDiv.className = "gtkcontactmapboundingdiv";
        root.appendChild(this.boundingDiv);
        
        /** 
         * A d3 selection of the SVG layer, 
         * which contains the axes*
         */
        this.baseSVG = d3.create('svg')
            .attr('width',  `${SIZE}px`)
            .attr('height', `${SIZE}px`)
            .attr('style', `
                position: absolute;
                top:    0px;
                left:   0px;
                bottom: 0px;
                right:  0px;
            `);
        this.boundingDiv.appendChild(this.baseSVG.node());

        /** A d3 selection of the canvas */
        this.canvas = d3.create('canvas')
            .attr('width',  MARGIN.innerWidth)
            .attr('height', MARGIN.innerHeight)
            .attr('style', `
                position: absolute;
                top:    ${MARGIN.top}px;
                left:   ${MARGIN.left}px;
                bottom: ${MARGIN.bottom}px;
                right:  ${MARGIN.right}px;
            `);
        this.boundingDiv.appendChild(this.canvas.node());

        this.load();
    }

    /**
     * Load data and initialize the rest of the widget
     */
    async load() {
        const text = await d3.text(this.path);
        const records = d3.tsvParseRows(text, d3.autoType);

        console.log(`Loaded ${records.length} contact records`);

        // Get boundaries of contact records
        const range = {
            minX: Number.MAX_VALUE, maxX: Number.MIN_VALUE,
            minY: Number.MAX_VALUE, maxY: Number.MIN_VALUE
        };
        for (let r of records) {
            if ( r[0] < range.minX ) range.minX = r[0];
            if ( r[0] > range.maxX ) range.maxX = r[0];
            if ( r[1] < range.minY ) range.minY = r[1];
            if ( r[1] > range.maxY ) range.maxY = r[1];
        }
        range.width = range.maxX - range.minX + 1;
        range.height = range.maxY - range.minY + 1;

        // Create scales/axes
        const x = d3.scaleLinear()
            .domain([range.minX, range.maxX])
            .range([0, MARGIN.innerWidth]);
        const y = d3.scaleLinear()
            .domain([range.minY, range.maxY])
            .range([0, MARGIN.innerHeight]);

        this.baseSVG.append('g')
            .classed('xaxis', true)
            .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)
            .call( d3.axisTop(x) );
        this.baseSVG.append('g')
            .classed('yaxis', true)
            .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)
            .call( d3.axisLeft(y) );

        // Convert data to array of booleans
        const contacts = [];
        for (let r of records) {
            const i = ( (r[1]-range.minY) * range.width ) + r[0]-range.minX;
            contacts[i] = true;
        }

        // Render image data
        const pixels = new Uint8ClampedArray( (range.width*range.height) * 4 );
        for (let i = 0; i < pixels.length; i += 4) {
            const val = contacts[i/4];
            const color_val = val ? 0 : 255;

            // Pixels are either white or red
            pixels[i] = 255; // red
            pixels[i+1] = color_val; // green
            pixels[i+2] = color_val; // blue
            pixels[i+3] = 255; // alpha
        }
        const imageData = new ImageData(pixels, range.width, range.height);

        // Draw to canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);

        const ctx = this.canvas.node().getContext('2d');
        ctx.scale( MARGIN.innerWidth/imageData.width, MARGIN.innerHeight/imageData.height );
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0);

        console.log("Done rendering")
    }
}
