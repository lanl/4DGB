const Publisher = require('../client-js/GTK/Publisher.js');
const AppState  = require('../client-js/GTK/AppState.js');

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
    pub = new Publisher();

    pub.addEventListener( "report", report );
    pub.addEventListener( "report", report );
    pub.addEventListener( "reload", reload );
    pub.notify( "report", "something" );
    pub.notify( "reload", "something" );

    expect(report_total).toBe(2);
    expect(reload_total).toBe(1);

    appState = new AppState();
    appState.addListener( "report", report );
    appState.addListener( "reload", reload );
    appState.notify( "report", "something" );
    appState.notify( "reload", "something" );

    expect(report_total).toBe(3);
    expect(reload_total).toBe(2);

    appState.addEventListener( "updated", updated );
    appState.addEventListener( "updated", updated );
    appState.range = [0, 10]

    expect(updated_total).toBe(2);
});
