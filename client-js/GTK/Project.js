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

const Segment = require('./Segment');
const ArrowSegment = require('./ArrowSegment');
const CurveSegment = require('./CurveSegment');
const THREE = require('three');
const Client = require('./Client');

/**********************
 * MODULE-PRIVATE STUFF
***********************/

/** Project's constructor keeps itself private by requiring this module-private object */
const CONSTRUCTOR_PASS = { foo: "🤷" }; // it's 2021, an emoji won't break the code, right?

//
// class responsible for loading the GTK Project data
//
// data is requested from the server, and a JSON data string is returned
//
class Project {

    /** @type {Project} */
    static TheProject = null;
    constructor(pass, data) {
        if (pass !== CONSTRUCTOR_PASS)
            throw new Error("Project's constructor is private! Please use the static (and async) Project.getProject()");

        this.project = data;

        // set up class constants, etc.
        // TODO: make this a factory pattern, to offload constants to the classes
        var app = this.getApplicationData("gtk")
        var g   = app["geometrycanvas"]["geometry"]["segment"]["glyph"]
        if (g["type"] == "arrow") {
            ArrowSegment.RadiusBegin    = g["span"]["radius-beg"];
            ArrowSegment.RadiusEnd      = g["span"]["radius-end"];
        } else if (g["type"] == "curve") {
            // TODO: check for all of these before setting
            CurveSegment.CurveTension         = g["span"]["tension"];
            CurveSegment.SegmentRadius        = g["span"]["radius"]; 
            CurveSegment.SegmentNumpoints     = g["span"]["num-points"]; 
            CurveSegment.SegmentNumSections   = g["span"]["num-sections"]; 
        }
        // HACK set super class statics
        Segment.Color          = new THREE.Color(parseInt(g["color"]));
        Segment.EndpointRadius = g["endpoint"]["radius"]; 
        Segment.GeomEndpoint   = new THREE.SphereBufferGeometry( g["endpoint"]["radius"], 
                                                                 g["endpoint"]["segments"], 
                                                                 g["endpoint"]["segments"] );
        Segment.GhostOpacity   = g["ghost"]["opacity"];

        // Fetch additional project data from server
        // The static getProject method will wait for this
        // to resolve before it returns the project, so if you've
        // got a Project instance, you can be sure this has completed

        this._extraDataFetch = Promise.all([
            // Fetch structure arrays
            new Promise( (resolve, reject) => {
                try { Client.TheClient.get_structure_arrays( (response) => {
                    this.structure_arrays = response['arrays'];
                    resolve();
                })} catch (err) { reject(err); }
            })
        ]);
    }

    /**
     * Returns a promise that resolves into a Project instance representing the project hosted
     * on the server.
     * @returns {Promise<Project>}
     */
    static async getProject() {
        if (Client.TheClient === undefined)
            throw new Error("Project cannot be created until the global 'Client.TheClient' has been set");

        const project_data = await new Promise( (resolve, reject) => {
            try { Client.TheClient.get_project( resolve ); }
            catch (err) { reject(err); }
        });

        const proj = new Project(CONSTRUCTOR_PASS, project_data);
        await proj._extraDataFetch;

        return proj;
    }

    getInterval() {
        return this.project["project"]["interval"]
    }

    getProjectDir() {
        return this.ppath
    }

    getProject() {
        return this.project["project"]
    }

    getData() {
        return this.project["data"]
    }

    getDatasets() {
        return this.project["datasets"]
    }

    getApplicationData(app) {
        return this.project["application"][app]
    }

    // TODO: check that type is present
    getData( type, ID ) {
        var dataset = null;
        for (const d of this.project["data"][type]) {
            if (d["id"] == ID) {
                dataset = d;
            }
        }
        return dataset 
    }

    /**
     * Get a list of the specifications for each variable array to be mapped over structures.
     * Returns an array of objects where each object has fields for `id', `name', `min` and `max. 
     * You can use the id to get the data for an array with the Client's `get_array` method.
     */
    getVariables() {
        return this.structure_arrays;
    }

    /**
     * Get the specification for the variable array with the given ID. The returned object (if
     * there is one) has fields for `id`, `name`, `min` and `max`. If there is no array with
     * the given id, returns undefined.
     */
    getVariableByID(id) {
        for (let arr of this.structure_arrays) {
            if (arr['id'] == id) return arr;
        }
        return undefined;
    }
}

module.exports = Project;
