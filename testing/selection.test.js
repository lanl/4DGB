
const Client    = require('../client-js/GTK/Client.js');
const Selection = require('../client-js/GTK/Selection.js');

var fs = require('fs');

var selection = new Selection();

function onSelected() {
    expect(selection.locations).toBe("3200000-3600000");
    expect(selection.segments).toBe("8,9");
    expect(selection.genes).toBe("Btbd35f11");
}

//
// run each of the calls, and produce a file on disc with the output
//
test('selection test', () => {
    // test.01
    client = new Client("http://127.0.0.1", 8000);

    selection.setClient( client );
    selection.setHACKInterval( 400000 ); 
    var curSelector = Selection.Selector.GENES;
    selection.addListener( "selectionChanged", onSelected );

    // set with locations
    curSelector = Selection.Selector.LOCATIONS;
    selection.setLocations("3200000-3600000");

});
