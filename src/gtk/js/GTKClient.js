var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest; 
var fs = require('fs');

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
    // get the structure for an ID
    //
    get_contactmap(callback, sid) {
        this.getData(   (response) => {
                            callback(JSON.parse(response));
                        },
                        this.url + ':' + this.port + '/data/contact-map/' + sid 
                    );
    }


    //
    // get the structure for an ID
    //
    get_structure(callback, sid) {
        this.getData(   (response) => {
                            callback(JSON.parse(response));
                        },
                        this.url + ':' + this.port + '/data/structure/' + sid + "/segments" );
    }

    getData(callback, url) {
        const xobj = new XMLHttpRequest();
        xobj.open('GET', url);
        xobj.onreadystatechange = function() {
            if (xobj.readyState == 4 && (xobj.status == 0 || xobj.status == 200)) {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    }

}

module.exports = GTKClient;
