const fetch = require('node-fetch');

/**
 * Class Client
 *
 * A class encapsulating communication with a GTK server
 *
 */
class Client {

    /** @type Client */
    static TheClient = null;

    constructor( host, options ) {
        this.host = host;

        if (options && options.auth) {
            this.auth = `Basic ${Buffer.from(options.auth).toString("base64")}`
        }
    }

    set data(d) {
        this._data = d;
    }

    get data() {
        return this._data;
    }

    _fetch(path, callback) {
        const url = this.host !== undefined ? new URL(path, this.host) : path;
        const options = this.auth ? {
            headers: {
                'Authorization': this.auth
            }
        } : undefined;

        fetch(url, options)
            .then(response => response.json())
            .then(data => callback(data));
    }

    get_project(callback) {
        this._fetch('/project/project.json', callback);
    }

    //
    // get the project interval 
    //
    get_project_interval(callback) {
        this._fetch('/project/interval', callback)
    }

    //
    // get the genes for the current project 
    //
    get_genes(callback) {
        this._fetch('/genes', callback);
    }

    //
    // get metadata for a gene
    //
    get_gene_metadata(callback, gene) {
        this._fetch(`/gene/${gene}`, callback)
    }

    //
    // get the genes for a list of segments 
    //
    get_genes_for_locations(callback, structureID, locations) {
        this._fetch(`/data/structure/${structureID}/locations/${locations}/genes`, callback)
    }

    //
    // get the genes for a list of segments 
    //
    get_genes_for_segments(callback, structureID, segIDs) {
        this._fetch(`/data/structure/${structureID}/segment/${segIDs}/genes`, callback);
    }

    //
    // get segments ids  
    //
    get_segment_ids(callback, structureID) {
        this._fetch(`data/structure/${structureID}/segmentids`, callback)
    }

    //
    // get segments for a list of genes 
    //
    get_segments_for_genes(callback, structureID, genes) {
        this._fetch(`/genes/${genes}/data/structure/${structureID}`, callback);
    }

    //
    // get the contactmap for an id 
    //
    get_contactmap(callback, cmID) {
        this._fetch(`/data/contact-map/${cmID}`, callback);
    }


    //
    // get the structure for an ID
    //
    get_structure(callback, structureID) {
        this._fetch(`/data/structure/${structureID}/segments`, callback);
    }

    //
    // get an array 
    //
    get_array(callback, arrayID, arraySlice) {
        this._fetch(`/data/array/${arrayID}/${arraySlice}`, callback);
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
        this._fetch(`/data/arrays/${type}`, callback);
    }

    //
    // get dataset ids 
    //
    get_dataset_ids(callback) {
        this._fetch(`/datasets`, callback);
    }

    //
    //
    //
    get_sampled_array(callback, arrayID, arraySlice, begin, end, numsamples) {
        this._fetch(`/data/samplearray/${arrayID}/${arraySlice}/${begin}/${end}/${numsamples}`, callback);
    }

}

module.exports = Client;
