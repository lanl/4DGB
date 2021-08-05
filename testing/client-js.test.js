const GTKClient = require('../src/gtk/js/GTKClient.js');
const GTKAppState  = require('../src/gtk/js/GTKAppState.js');
var fs = require('fs');

//
// run each of the calls, and produce a file on disc with the output
//
test('client test', () => {
    // test.00
    client = new GTKClient("http://127.0.0.1", 8000);

    client.get_structure_arrays( (response) => {
                            var streamname = "gtkclient_get-structure-arrays_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.write("\n");
                            writeStream.end();
                        });

    client.get_sequence_arrays( (response) => {
                            var streamname = "gtkclient_get-sequence-arrays_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.write("\n");
                            writeStream.end();
                        });

    client.get_arrays( (response) => {
                            var streamname = "gtkclient_get-arrays_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.write("\n");
                            writeStream.end();
                        }, 'structure');

    client.get_array( (response) => {
                            var streamname = "gtkclient_array_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.write("\n");
                            writeStream.end();
                        }, 0, 0);

    client.get_contactmap( (response) => {
                            var streamname = "gtkclient_contactmap_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.write("\n");
                            writeStream.end();
                        }, 0);

    client.get_genes( (response) => {
                            var streamname = "gtkclient_genes_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.write("\n");
                            writeStream.end();
                        });

    client.get_genes_for_segment( (response) => {
                            var streamname = "gtkclient_genes-for-segment_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.write("\n");
                            writeStream.end();
                        }, 0, 8);

    client.get_segments_for_gene( (response) => {
                            var streamname = "gtkclient_segments-for-gene_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.write("\n");
                            writeStream.end();
                        }, 0, "Btbd35f23");

    client.get_structure( (response) => {
                            var streamname = "gtkclient_structure_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.write("\n");
                            writeStream.end();
                        }, 0);

    expect(true).toBe(true);

});
