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
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL LOS ALAMOS NATIONAL SECURITY, LLC OR CONTRIBUTORS 
BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE 
GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT 
LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const ContactMapCanvas = require('./ContactMapCanvas');
const GeometryCanvas = require('./GeometryCanvas');
const { Controller } = require('./selections');

class ViewerPanel {

    constructor(project, dataset, parent ) {
        this.datasetID = dataset['id']

        var root = document.getElementById(parent);
        this.container = document.createElement("div");
        this.container.className = "gtkviewerpanel";
        root.appendChild(this.container);

        this.title = document.createElement("div");
        this.title.className = "gtktitle";
        this.title.innerHTML = dataset['name'];
        this.container.appendChild(this.title);

        var gc_elem = document.createElement("div");
        gc_elem.id = "gc_elem-" + parent;
        this.container.appendChild(gc_elem);
        this.geometrycanvas = new GeometryCanvas( project, dataset, gc_elem.id );


        // contact map 
        var cm_elem = document.createElement("div");
        cm_elem.id = "cm_elem-" + parent;
        this.container.appendChild(cm_elem);
        this.contactmapcanvas = new ContactMapCanvas( project, dataset, cm_elem.id )
    }

    /**
     * Shortcut to call `setController` on this panel's GeometryCanvas and ContactMapCanvas
     * @param {Controller} controller 
     */
    setController(controller) {
        this.contactmapcanvas.setController(controller);
        this.geometrycanvas.setController(controller);
    }

}

module.exports = ViewerPanel;
