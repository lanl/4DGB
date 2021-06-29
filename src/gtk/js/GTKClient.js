var fs = require('fs');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest; 

class GTKClient {
    /**
     * Class GTKClient
     *
     * A class encapsulating communication with a GTK server
     *
     */

    constructor() {
        this.url = null;
        this.port = null;
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

    get_structure(sid) {
        this.loadData((response) => {
            var data = JSON.parse(response);

            var writeStream = fs.createWriteStream('./output.txt', {flags: 'w'});
            writeStream.write(this.url + ":" + this.port + "\n");
            writeStream.write(JSON.stringify(data));
            writeStream.end();
        }, sid );
    }

    loadData(callback, sid) {
        const xobj = new XMLHttpRequest();
        // xobj.overrideMimeType("application/json");
        xobj.open('GET', this.url + ':' + this.port + '/data/structure/' + sid + "/segments");
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
