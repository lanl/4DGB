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
                            expect(response).toStrictEqual({"arrays":[{"id":0,"max":22,"min":1,"name":"increasing int","type":"structure"},{"id":1,"max":22,"min":1,"name":"decreasing int","type":"structure"},{"id":2,"max":320.2,"min":110.1,"name":"increasing float","type":"structure"},{"id":3,"max":320.2,"min":110.1,"name":"decreasing float","type":"structure"},{"id":5,"max":2,"min":1,"name":"two domain","type":"structure"},{"id":6,"max":3,"min":1,"name":"three domain","type":"structure"},{"id":7,"max":0.3,"min":0,"name":"sampled H3K27me3","type":"structure"}]});
                        });

    client.get_sequence_arrays( (response) => {
                            expect(response).toStrictEqual({"arrays":[{"id":4,"max":1,"min":0,"name":"H3K27me3","type":"sequence"}]});
                        });

    client.get_arrays( (response) => {
                            expect(response).toStrictEqual({"arrays":[{"id":0,"max":22,"min":1,"name":"increasing int","type":"structure"},{"id":1,"max":22,"min":1,"name":"decreasing int","type":"structure"},{"id":2,"max":320.2,"min":110.1,"name":"increasing float","type":"structure"},{"id":3,"max":320.2,"min":110.1,"name":"decreasing float","type":"structure"},{"id":5,"max":2,"min":1,"name":"two domain","type":"structure"},{"id":6,"max":3,"min":1,"name":"three domain","type":"structure"},{"id":7,"max":0.3,"min":0,"name":"sampled H3K27me3","type":"structure"}]});
                        }, 'structure');

    client.get_array( (response) => {
                            expect(response).toStrictEqual({"data":{"dim":1,"max":22,"min":1,"type":"int","values":[1,2,3,4,5,6,7,8,9,10,11]},"name":"increasing int","tags":[],"type":"structure","version":"0.1"});
                        }, 0, 0);

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

    client.get_contactmap( (response) => {
                            expect(response).toStrictEqual({"contacts":[{"value":1.22803363763796,"x":5,"y":8},{"value":1.22803363763796,"x":9,"y":4},{"value":1.22803363763796,"x":6,"y":3},{"value":1.22803363763796,"x":3,"y":8},{"value":2.46410161513775,"x":2,"y":3},{"value":2.46410161513775,"x":1,"y":10},{"value":3.46410161513775,"x":3,"y":3},{"value":2.04988805276466,"x":2,"y":8},{"value":1.22803363763796,"x":4,"y":9},{"value":0.635674490391564,"x":11,"y":3},{"value":1.46410161513775,"x":5,"y":3},{"value":2.04988805276466,"x":6,"y":8},{"value":0.635674490391564,"x":11,"y":7},{"value":2.46410161513775,"x":8,"y":1},{"value":1.46410161513775,"x":7,"y":9},{"value":2.46410161513775,"x":5,"y":6},{"value":1.22803363763796,"x":2,"y":7},{"value":1.46410161513775,"x":9,"y":11},{"value":1.46410161513775,"x":7,"y":5},{"value":2.46410161513775,"x":6,"y":7},{"value":1.22803363763796,"x":3,"y":6},{"value":2.04988805276466,"x":8,"y":10},{"value":2.46410161513775,"x":9,"y":2},{"value":2.46410161513775,"x":4,"y":5},{"value":3.46410161513775,"x":11,"y":11},{"value":3.46410161513775,"x":1,"y":1},{"value":1.22803363763796,"x":11,"y":8},{"value":1.46410161513775,"x":11,"y":9},{"value":1.46410161513775,"x":2,"y":6},{"value":1.46410161513775,"x":5,"y":7},{"value":3.46410161513775,"x":6,"y":6},{"value":0.635674490391564,"x":3,"y":7},{"value":2.04988805276466,"x":2,"y":4},{"value":1.46410161513775,"x":9,"y":3},{"value":2.04988805276466,"x":6,"y":4},{"value":1.22803363763796,"x":4,"y":1},{"value":1.46410161513775,"x":7,"y":1},{"value":2.46410161513775,"x":8,"y":9},{"value":2.46410161513775,"x":10,"y":9},{"value":2.04988805276466,"x":10,"y":8},{"value":2.46410161513775,"x":10,"y":11},{"value":2.46410161513775,"x":5,"y":4},{"value":2.46410161513775,"x":9,"y":8},{"value":2.46410161513775,"x":3,"y":4},{"value":0.635674490391564,"x":1,"y":5},{"value":3.46410161513775,"x":2,"y":2},{"value":1.22803363763796,"x":10,"y":7},{"value":3.46410161513775,"x":1,"y":9},{"value":1.46410161513775,"x":6,"y":2},{"value":1.46410161513775,"x":9,"y":7},{"value":0.464101615137754,"x":6,"y":11},{"value":1.22803363763796,"x":10,"y":3},{"value":1.22803363763796,"x":2,"y":11},{"value":0.635674490391564,"x":3,"y":11},{"value":1.22803363763796,"x":9,"y":6},{"value":1.22803363763796,"x":7,"y":10},{"value":0,"x":5,"y":11},{"value":1.22803363763796,"x":8,"y":5},{"value":1.22803363763796,"x":5,"y":2},{"value":1.01461187235458,"x":4,"y":10},{"value":2.46410161513775,"x":3,"y":2},{"value":0.635674490391564,"x":5,"y":9},{"value":2.46410161513775,"x":10,"y":1},{"value":3.46410161513775,"x":9,"y":1},{"value":1.46410161513775,"x":3,"y":9},{"value":2.46410161513775,"x":4,"y":3},{"value":0.635674490391564,"x":7,"y":3},{"value":1.46410161513775,"x":1,"y":11},{"value":1.46410161513775,"x":8,"y":4},{"value":2.46410161513775,"x":7,"y":8},{"value":2.46410161513775,"x":2,"y":9},{"value":0.464101615137754,"x":11,"y":4},{"value":1.46410161513775,"x":4,"y":8},{"value":2.46410161513775,"x":1,"y":2},{"value":1.22803363763796,"x":6,"y":9},{"value":3.46410161513775,"x":10,"y":10},{"value":1.01461187235458,"x":10,"y":6},{"value":1.22803363763796,"x":2,"y":5},{"value":2.46410161513775,"x":6,"y":5},{"value":3.46410161513775,"x":7,"y":7},{"value":1.22803363763796,"x":4,"y":7},{"value":2.04988805276466,"x":4,"y":6},{"value":2.04988805276466,"x":8,"y":2},{"value":1.22803363763796,"x":11,"y":2},{"value":1.22803363763796,"x":8,"y":11},{"value":3.46410161513775,"x":5,"y":5},{"value":2.46410161513775,"x":9,"y":10},{"value":0.464101615137754,"x":10,"y":5},{"value":1.22803363763796,"x":1,"y":4},{"value":1.46410161513775,"x":3,"y":5},{"value":2.46410161513775,"x":7,"y":6},{"value":2.04988805276466,"x":10,"y":2},{"value":0,"x":11,"y":5},{"value":1.22803363763796,"x":1,"y":6},{"value":3.46410161513775,"x":8,"y":8},{"value":1.22803363763796,"x":7,"y":4},{"value":3.46410161513775,"x":4,"y":4},{"value":1.22803363763796,"x":6,"y":1},{"value":2.46410161513775,"x":2,"y":1},{"value":1.46410161513775,"x":3,"y":1},{"value":3.46410161513775,"x":9,"y":9},{"value":0.635674490391564,"x":5,"y":1},{"value":1.22803363763796,"x":8,"y":3},{"value":1.46410161513775,"x":1,"y":7},{"value":1.01461187235458,"x":10,"y":4},{"value":2.46410161513775,"x":11,"y":10},{"value":1.22803363763796,"x":7,"y":2},{"value":0.464101615137754,"x":11,"y":6},{"value":0.464101615137754,"x":4,"y":11},{"value":0.635674490391564,"x":9,"y":5},{"value":2.04988805276466,"x":4,"y":2},{"value":0.464101615137754,"x":5,"y":10},{"value":0.635674490391564,"x":7,"y":11},{"value":2.04988805276466,"x":8,"y":6},{"value":2.46410161513775,"x":1,"y":8},{"value":1.22803363763796,"x":3,"y":10},{"value":1.46410161513775,"x":1,"y":3},{"value":2.04988805276466,"x":2,"y":10},{"value":1.01461187235458,"x":6,"y":10},{"value":2.46410161513775,"x":8,"y":7},{"value":1.46410161513775,"x":11,"y":1}]});
                        }, 0);

});
