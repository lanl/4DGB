const GTKClient = require('../src/gtk/js/GTKClient.js');
const GTKAppState  = require('../src/gtk/js/GTKAppState.js');
var fs = require('fs');

test('client test', () => {

    // test.00
    client = new GTKClient("http://127.0.0.1", 8000);

    client.get_genes( (response) => {
                            var streamname = "gtkclient_genes_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.end();
                        });

    client.get_genes_for_segment( (response) => {
                            var streamname = "gtkclient_genes-for-segment_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.end();
                        }, 0, 100);

    client.get_structure( (response) => {
                            var streamname = "gtkclient_structure_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'a'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.end();
                        }, 0);

    client.get_contactmap( (response) => {
                            var streamname = "gtkclient_contactmap_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'a'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.end();
                        }, 0);

    expect(true).toBe(true);

});
