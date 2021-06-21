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
 * Component displaying contact map data on a canvas.
 */
class GTKContactMapCanvas {

    /**
     * Create a new GTKContactMapCanvas, appending itself as a child to the element with
     * the specified DOM ID.
     * @param {GTKProject} project The GTKProject this belongs to
     * @param {GTKDataset} dataset The GTKDataset containing the contact map this will display
     * @param {String} rootElemID The DOM ID of the element this will be appended to.
     */
    constructor(project, dataset, rootElemID) {

        // Build content div
        let gtkroot  = document.getElementById(rootElemID);
        this.contdiv = document.createElement("div");
        this.contdiv.className = "gtkviewcontainer";
        gtkroot.appendChild(this.contdiv);

        let adata = project.getApplicationData("gtk");
        let gdata = adata["geometrycanvas"];
        
        // Create and add canvas
        this.canvas = document.createElement("canvas");
        this.canvas.className = "gtkgeometrycanvas";
        this.canvas.width  = gdata["width"];
        this.canvas.height = gdata["height"];
        this.contdiv.appendChild(this.canvas);

        GTKContactMap.loadNew( dataset.md_contact_mp )
            .then( (contactMap) => this.renderToImageData(contactMap) )
            .then( (imageData)  => this.renderToCanvas(imageData)     );
    }

    /**
     * Render a contact map to ImageData
     * @param {GTKContactMap} cm 
     * @returns {ImageData}
     */
    renderToImageData(cm) {
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
    renderToCanvas(img) {

        const tempCanvas = document.createElement("canvas")
        tempCanvas.width  = img.width;
        tempCanvas.height = img.height;
        tempCanvas.getContext('2d').putImageData(img, 0, 0);

        const ctx = this.canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.scale( this.canvas.width/img.width, this.canvas.height/img.height );
        ctx.drawImage(tempCanvas, 0, 0);
    }

}