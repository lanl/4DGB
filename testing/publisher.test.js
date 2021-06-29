const GTKPublisher = require('../src/gtk/js/GTKPublisher.js');
const GTKAppState  = require('../src/gtk/js/GTKAppState.js');

var report_total    = 0;
var reload_total    = 0;
var updated_total   = 0;

function report( message ) {
    report_total = report_total + 1;
    return message;
}

function reload( message ) {
    reload_total = reload_total + 1;
    return message;
}

function updated( message ) {
    updated_total = updated_total + 1;
    return message;
}

test('publish test', () => {
    pub = new GTKPublisher();

    pub.addListener( "report", report );
    pub.addListener( "report", report );
    pub.addListener( "reload", reload );
    pub.notify( "report", "something" );
    pub.notify( "reload", "something" );

    expect(report_total).toBe(2);
    expect(reload_total).toBe(1);

    appState = new GTKAppState();
    appState.addListener( "report", report );
    appState.addListener( "reload", reload );
    appState.notify( "report", "something" );
    appState.notify( "reload", "something" );

    expect(report_total).toBe(3);
    expect(reload_total).toBe(2);

    appState.addListener( "updated", updated );
    appState.addListener( "updated", updated );
    appState.range = [0, 10]

    expect(updated_total).toBe(2);
});
