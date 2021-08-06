// to be removed when node.js is included
if (typeof process === 'object') {
    var fetch = require('node-fetch');
}

class GTKClient {
    /**
     * Class GTKClient
     *
     * A class encapsulating communication with a GTK server
     *
     */

    constructor( url, port ) {
        this.url = url;
        this.port = port;
    }

    set data(d) {
        this._data = d;
    }

    get data() {
        return this._data;
    }

    set port(p) {
        this._port = p;
    }

    get port() {
        return this._port;
    }

    set url(u) {
        this._url = u;
    }

    get url() {
        return this._url;
    }

    //
    // get the genes for the current project 
    //
    get_genes(callback) {
        fetch( this.url + ':' + this.port + '/genes' )
            .then(response => response.json())
            .then(data => callback(data))
    }

    //
    // get the genes for a segment 
    //
    get_genes_for_segment(callback, sid, segid) {
        fetch( this.url + ':' + this.port + '/data/structure/' + sid + '/segment/' + segid + '/genes' )
            .then(response => response.json())
            .then(data => callback(data))
    }

    //
    // get segments for a gene 
    //
    get_segments_for_gene(callback, sid, gene) {
        fetch( this.url + ':' + this.port + '/gene/' + gene + '/data/structure/' + sid )
            .then(response => response.json())
            .then(data => callback(data))
    }

    //
    // get the contactmap for an id 
    //
    get_contactmap(callback, cmID) {
        fetch( this.url + ':' + this.port + '/data/contact-map/' + cmID )
            .then(response => response.json())
            .then(data => callback(data))
    }


    //
    // get the structure for an ID
    //
    get_structure(callback, sid) {
        fetch( this.url + ':' + this.port + '/data/structure/' + sid + "/segments" )
            .then(response => response.json())
            .then(data => callback(data))
    }

    //
    // get an array 
    //
    get_array(callback, arrayID, arraySlice) {
        fetch( this.url + ':' + this.port + '/data/array/' + arrayID + '/' + arraySlice)
            .then(response => response.json())
            .then(data => callback(data))
    }

    //
    // get all structure arrays
    //
    get_structure_arrays(callback) {
        this.get_arrays(callback, 'structure')
    }

    //
    // get all sequence arrays
    //
    get_sequence_arrays(callback) {
        this.get_arrays(callback, 'sequence')
    }

    //
    // get all arrays
    //
    get_arrays(callback, type) {
        fetch( this.url + ':' + this.port + '/data/arrays/' + type )
            .then(response => response.json())
            .then(data => callback(data))
    }

    //
    // get dataset ids 
    //
    get_dataset_ids(callback) {
        fetch( this.url + ':' + this.port + '/datasets' )
            .then(response => response.json())
            .then(data => callback(data))
    }

    //
    //
    //
//  get_sampled_array(arrayID, arraySlice, begin, end, numsamples) {
//      fetch( this.url + ':' + this.port + '/data/samplearray/' + arrayID + '/' arraySlice + '/' + begin + '/' + end + '/' + numsamples)
//          .then(response => response.json())
//          .then(data => callback(data))
//  }

}

// to be removed when node.js is included
if (typeof process === 'object') {
    module.exports = GTKClient;
}
