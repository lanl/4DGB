const Client    = require('../client-js/GTK/Client.js');
const Selection = require('../client-js/GTK/Selection.js');
var fs = require('fs');

//
// run each of the calls, and produce a file on disc with the output
//
test('selection test', () => {
    // test.01
    client = new Client("http://127.0.0.1", 8001);

    var selection = new Selection();
    selection.setClient( client );
    var curSelector = Selection.Selector.GENES;

    // set with genes
    selection.setGenes("Ddx3x, Eif2s3x,Kdm5c");
    expect(selection.genes).toBe("Ddx3x, Eif2s3x,Kdm5c");
    var genes = selection.getListOfGenes();
    expect(genes).toStrictEqual(["Ddx3x", "Eif2s3x", "Kdm5c"]);
    expect(selection.locations).toBe(curSelector);
    expect(selection.segments).toBe(curSelector);

    // set with locations
    curSelector = Selection.Selector.LOCATIONS;
    selection.setLocations("1,2-10,12");
    expect(selection.locations).toBe("1,2-10,12");
    var locations = selection.getListOfLocations();
    expect(locations).toStrictEqual([1,2,3,4,5,6,7,8,9,10,12]);
    expect(selection.genes).toBe(curSelector);
    expect(selection.segments).toBe(curSelector);

    // set with segments
    curSelector = Selection.Selector.SEGMENTS;
    selection.setSegments("1,2-10,12");
    expect(selection.segments).toBe("1,2-10,12");
    var segments = selection.getListOfSegments();
    expect(segments).toStrictEqual([1,2,3,4,5,6,7,8,9,10,12]);
    expect(selection.genes).toBe(curSelector);
    expect(selection.locations).toBe(curSelector);

});
