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

class ScalarBarCanvas {

    static Classname        = "gtkscalarbarcanvas";
    static DefaultLUTName   = "grayscale";
    static DefaultLUTDivs   = 512; 

    constructor(rootElem, {width=80, height=100} = {}) {
        this.title;
        this.minText    = "Min";
        this.maxText    = "Max";
        this.offset     =  2;
        this.titleX     =  0;
        this.titleY     = 10;
        this.barTop     = 20;
        this.barLeft    =  1;
        this.barWidth   = 20;
        this.barHeight  = 70;
        this.minX       = this.barLeft + this.barWidth + this.offset; 
        this.minY       = this.barTop; 
        this.maxX       = this.minX; 
        this.maxY       = this.barTop + this.barHeight;
        this.fillColor   = "#000000";
        this.borderColor = "#000000";
        this.fontColor   = "#000000";
        this.numScalarBarDivs = 10;

        // LUT
        this.LUT = new THREE.Lut( ScalarBarCanvas.DefaultLUTName, ScalarBarCanvas.DefaultLUTDivs ); 
        this.LUT.setMin(0.0);
        this.LUT.setMax(1.0);

        // create elements
        var contdiv = document.createElement("div");
        contdiv.className = ScalarBarCanvas.Classname; 
        rootElem.appendChild(contdiv);

        // canvas
        this.canvas = document.createElement("canvas");
        this.canvas.width  = width; 
        this.canvas.height = height; 
        contdiv.appendChild(this.canvas);

        this.redraw();
    }

    set borderColor(c) {
        this._borderColor = c;
    }

    get borderColor() {
        return this._borderColor;
    }

    set fontColor(c) {
        this._fontColor = c;
    }

    get fontColor() {
        return this._fontColor;
    }

    set title( title ) {
        this._title = title;
        this.redraw();
    }

    get title() {
        return this._title;
    }

    setLUT(LUT) {
        this.LUT = LUT;

        this.redraw();
    }

    redraw () {
        // set value labels
        this.minText = this.LUT.minV.toFixed(2);
        this.maxText = this.LUT.maxV.toFixed(2);

        // draw labels
        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = this.fontColor; 
        ctx.fillText(this.title, this.titleX, this.titleY);
        ctx.fillText(this.minText, this.minX, this.minY);
        ctx.fillText(this.maxText, this.maxX, this.maxY);

        // draw the color bar
        var valIncr = parseFloat(Math.abs(this.LUT.maxV-this.LUT.minV)/parseFloat(this.numScalarBarDivs));
        var barIncr = parseFloat(Math.abs(this.barHeight/parseFloat(this.numScalarBarDivs)));
        for (let i = 0; i< this.numScalarBarDivs; i++) {
            var curVal = this.LUT.maxV - parseFloat(i)*valIncr;
            var curBarIncr = parseFloat(i)*barIncr;
            ctx.fillStyle = "#" + this.LUT.getColor( curVal ).getHexString(); 
            ctx.fillRect(this.barLeft, this.barTop+curBarIncr, this.barWidth, this.barHeight-curBarIncr); 
        }

        // draw an outline around the colorbar
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth   = 1;
        ctx.strokeRect(this.barLeft, this.barTop, this.barWidth, this.barHeight); 
    }

}

module.exports = ScalarBarCanvas;
