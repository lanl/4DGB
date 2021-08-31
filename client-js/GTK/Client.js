const fetch = require('node-fetch');

/**
 * Class Client
 *
 * A class encapsulating communication with a GTK server
 *
 */
class Client {

    static TheClient = null;

    constructor( host ) {
        this.host = host;
    }

    set data(d) {
        this._data = d;
    }

    get data() {
        return this._data;
    }

    _fetch(path, callback) {
        const url = this.host !== undefined ? new URL(path, this.host) : path; 
        fetch(url)
            .then(response => response.json())
            .then(data => callback(data));
    }

    //
    // get the project interval 
    //
    get_project_interval(callback) {
        fetch( this.url + ':' + this.port + '/project/interval' )
            .then(response => response.json())
            .then(data => callback(data))
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
        fetch( this.url + ':' + this.port + '/gene/' + gene )
            .then(response => response.json())
            .then(data => callback(data))
    }

    //
    // get the genes for a list of segments 
    //
    get_genes_for_locations(callback, sid, locations) {
        fetch( this.url + ':' + this.port + '/data/structure/' + sid + '/locations/' + locations + '/genes' )
            .then(response => response.json())
            .then(data => callback(data))
    }

    //
    // get the genes for a list of segments 
    //
    get_genes_for_segments(callback, sid, segids) {
        this._fetch(`/data/structure/${sid}/segment/${segids}/genes`, callback);
    }

    //
    // get segments for a list of genes 
    //
    get_segments_for_genes(callback, sid, genes) {
        this._fetch(`/genes/${genes}/data/structure/${sid}`, callback);
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
    get_structure(callback, sid) {
        this._fetch(`/data/structure/${sid}/segments`, callback);
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
