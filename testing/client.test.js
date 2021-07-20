const GTKClient = require('../src/gtk/js/GTKClient.js');
const GTKAppState  = require('../src/gtk/js/GTKAppState.js');
var fs = require('fs');

test('client test', () => {

    // test.00
    client = new GTKClient("http://127.0.0.1", 8000);

    // test.01
    // client = new GTKClient("http://127.0.0.1", 8001);

    streamname = './client_output.txt'
    var writeStream = fs.createWriteStream(streamname, {flags: 'w'});
    writeStream.write("Client output\n\n");
    writeStream.end();

    if (true) {
        client.get_genes( (response) => {
                                var writeStream = fs.createWriteStream(streamname, {flags: 'a'});
                                writeStream.write("call: genes\n");
                                writeStream.write(JSON.stringify(response));
                                writeStream.write("\n");
                                writeStream.end();
                            });
    }

    if (true) {
        client.get_genes_for_segment( (response) => {
                                var writeStream = fs.createWriteStream(streamname, {flags: 'a'});
                                writeStream.write("call: genes for segment\n");
                                writeStream.write(JSON.stringify(response));
                                writeStream.write("\n");
                                writeStream.end();
                            }, 0, 100);
    }

    if (true) {
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
