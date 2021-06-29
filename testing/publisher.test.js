
const GTKPublisher = require('../src/gtk/js/GTKPublisher.js');
const GTKAppState  = require('../src/gtk/js/GTKAppState.js');

var total = 0;

function report( message ) {
    total = total + 1;
    return message;
}

test('hello world', () => {
    pub = new GTKPublisher();

    pub.addListener( "report", report );
    pub.addListener( "report", report );
    pub.addListener( "reload", report );
    pub.notify( "report", "something" );
    pub.notify( "reload", "something" );

    expect(total).toBe(3);

    appState = new GTKAppState();
    appState.addListener( "report", report );
    appState.notify( "report" );

    expect(total).toBe(4);
});
