const GTKClient = require('../src/gtk/js/GTKClient.js');
const GTKAppState  = require('../src/gtk/js/GTKAppState.js');

test('client test', () => {
    client = new GTKClient();
    client.url  = "http://127.0.0.1";
    client.port = 8000;

    client.get_structure(0);

    expect(true).toBe(true);
});
