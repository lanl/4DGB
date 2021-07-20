const GTKClient = require('../src/gtk/js/GTKClient.js');
const GTKAppState  = require('../src/gtk/js/GTKAppState.js');
var fs = require('fs');

test('client test', () => {

    // test.00
    client = new GTKClient("http://127.0.0.1", 8000);

    var streamname = "gtkclient_genes_test.json";
    client.get_genes( (response) => {
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.end();
                        });

    var streamname = "gtkclient_genes-for-segment_test.json";
    client.get_genes_for_segment( (response) => {
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.end();
                        }, 0, 100);

    if (false) {
        client.get_structure( (response) => {
                                var writeStream = fs.createWriteStream(streamname, {flags: 'a'});
                                writeStream.write("call: structure\n");
                                writeStream.write(JSON.stringify(response));
                                writeStream.write("\n");
                                writeStream.end();
                            }, 0);
    }

    if (false) {
        client.get_contactmap( (response) => {
                                var writeStream = fs.createWriteStream(streamname, {flags: 'a'});
                                writeStream.write("call: contactmap\n");
                                writeStream.write(JSON.stringify(response));
                                writeStream.write("\n");
                                writeStream.end();
                            }, 0);
    }

    expect(true).toBe(true);

});
