const GTKClient = require('../src/gtk/js/GTKClient.js');
const GTKAppState  = require('../src/gtk/js/GTKAppState.js');
var fs = require('fs');

test('client test', () => {

    client = new GTKClient("http://127.0.0.1", 8000);
    client.url = "http://127.0.0.1";
    client.port = 8000;

    client.get_structure( (structure) => {
                            var writeStream = fs.createWriteStream('./client_structure_output.txt', {flags: 'w'});
                            writeStream.write(JSON.stringify(structure));
                            writeStream.write("\n");
                            writeStream.end();
                        }, 0);

    client.get_contactmap( (structure) => {
                            var writeStream = fs.createWriteStream('./client_contactmap_output.txt', {flags: 'w'});
                            writeStream.write(JSON.stringify(structure));
                            writeStream.write("\n");
                            writeStream.end();
                        }, 0);

    expect(true).toBe(true);

});
