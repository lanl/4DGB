const Client = require('../client-js/GTK/Client.js');
const AppState  = require('../client-js/GTK/AppState.js');
var fs = require('fs');

//
// run each of the calls, and produce a file on disc with the output
//
test('client test', () => {
    // test.00
    client = new Client("http://127.0.0.1:8000");

    client.get_structure_arrays( (response) => {
                            var streamname = "gtkclient_get-structure-arrays_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.write("\n");
                            writeStream.end();
                        });

    client.get_sequence_arrays( (response) => {
                            expect(response).toStrictEqual({"arrays":[{"id":4,"max":1,"min":0,"name":"H3K27me3","type":"sequence"}]});
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

    client.get_genes_for_segments( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f23","Btbd35f24"]});
                        }, 0, 8);

    // list of single values (7,8,9)
    client.get_genes_for_segments( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f11","Btbd35f23","Btbd35f24"]});
                        }, 0, "7,8,9");

    // single range value (7-9)
    client.get_genes_for_segments( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f11","Btbd35f23","Btbd35f24"]});
                        }, 0, "7-9");

    // combined list (7,8-10)
    client.get_genes_for_segments( (response) => {
                            expect(response).toStrictEqual({"genes": ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3']});
                        }, 0, "7,8-10");

    // list of single values (7,8,9)
    client.get_genes_for_locations( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f11","Btbd35f23","Btbd35f24"]});
                        }, 0, "2400000-2800000,2800000-3200000,3200000-3600000");

    // single range value (7-9)
    client.get_genes_for_locations( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f11","Btbd35f23","Btbd35f24"]});
                        }, 0, "2400000-3600000");

    // combined list (7,8-10)
    client.get_genes_for_locations( (response) => {
                            expect(response).toStrictEqual({"genes": ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3']});
                        }, 0, "2400000-2800000,2800000-4000000");

    client.get_genes_for_locations( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f11","Btbd35f23","Btbd35f24"]});
                        }, 0, "2400000-3600000");

    client.get_segments_for_genes( (response) => {
                            expect(response).toStrictEqual({"segments":[8]});
                        }, 0, "Btbd35f23");

    client.get_structure( (response) => {
                            var streamname = "gtkclient_structure_test.json";
                            var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
                            writeStream.write(JSON.stringify(response));
                            writeStream.write("\n");
                            writeStream.end();
                        }, 0);

    expect(false).toBe(false);

});
