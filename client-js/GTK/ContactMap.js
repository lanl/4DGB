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
 * @class ContactMap
 * 
 * Represents the data for contact map. The ContactMapCanvas class will instantiate one of these
 * and render it to a canvas.
 */
class ContactMap {

    /**
     * Load a contact map from the given list of contact records.
     * 
     * Please don't call this directly, instead call the static loadNew function
     * which will fetch the data for you and give a Promise resolving into one of these instances.
     * @param {Object[]} records 
     */
    constructor(records) {

        // first pass over data: determine x/y bounds

        const range = {
            minX: Number.MAX_VALUE, maxX: Number.MIN_VALUE,
            minY: Number.MAX_VALUE, maxY: Number.MIN_VALUE
        };
        for (let r of records) {
            if ( r.x < range.minX ) range.minX = r.x;
            if ( r.x > range.maxX ) range.maxX = r.x;
            if ( r.y < range.minY ) range.minY = r.y;
            if ( r.y > range.maxY ) range.maxY = r.y;
        }

        /**
         * The boundaries of the x/y coodinates of the data. Represented as a rectangle
         * with width, height and the coordinates of the upper-left corner.
         */
        this.bounds = {
            x: range.minX,
            y: range.minY,
            width: range.maxX - range.minX + 1,
            height: range.maxY - range.minY + 1
        }

        // second pass: fill in data

        /**
         * Matrix of values for contact map. Represented as a one-dimensional Float32Array
         * in row-major order.
         */
        this.data = new Float32Array(this.bounds.width * this.bounds.height);

        /**
         * The minimum value of all the contact records
         */
        this.minValue = Number.MAX_VALUE;

        /**
         * The maximum value of all the contact records
         */
        this.maxValue = Number.MIN_VALUE;

        for (let r of records) {
            const val = isNaN(r.value) ? 0 : r.value;
            const i = ( (r.y-this.bounds.y) * this.bounds.width ) + r.x-this.bounds.x;
            this.data[i] = val;

            if (val < this.minValue) this.minValue = val;
            if (val > this.maxValue) this.maxValue = val;
        }
    }

    /**
     * Fetch the data for the contact map with the given id in the project and load a new
     * instance of ContactMap from it. Returns a promise that resolves into the new
     * instance.
     * @param {String} id
     * @returns {Promise<ContactMap>} 
     */
    static async loadNew(id) {
        return fetch(`/data/contact-map/${encodeURIComponent(id)}`)
            .then( (res) => {
                if (!res.ok)
                    throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
                return res.json();
            })
            .then( (data) => {
                return new ContactMap(data['contacts']);
            });
    }
}

module.exports = ContactMap;
