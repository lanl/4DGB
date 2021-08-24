const Client    = require('../client-js/GTK/Client.js');
const Selection = require('../client-js/GTK/Selection.js');

var AllTests = [
                {
                    'test'      : 0,
                    'locations' : "2800000-3200000",
                    'segments'  : "8",
                    'genes'     : "Btbd35f23,Btbd35f24"
                },
                {
                    'test'      : 1,
                    'locations' : "3200000-3600000",
                    'segments'  : "9",
                    'genes'     : "Btbd35f11"
                },
                {
                    'test'      : 2,
                    'locations' : "2800000-3200000,3200000-3600000",
                    'segments'  : "8,9",
                    'genes'     : "Btbd35f11,Btbd35f23,Btbd35f24"
                },
                {
                    'test'      : 3,
                    'locations' : "2800000-3600000",
                    'segments'  : "8-9",
                    'genes'     : "Btbd35f11,Btbd35f23,Btbd35f24"
                },
                {
                    'test'      : 4,
                    'note'      : "End of range is just past the segment boundary",
                    'locations' : "2800000-3700000",
                    'segments'  : "8-10",
                    'genes'     : "Btbd35f10,Btbd35f11,Btbd35f18,Btbd35f23,Btbd35f24"
                },
                {
                    'test'      : 5,
                    'note'      : "Start of range is just before the segment boundary",
                    'locations' : "2700000-3600000",
                    'segments'  : "7-9",
                    'genes'     : "Btbd35f11,Btbd35f23,Btbd35f24"
                },
                {
                    'test'      : 6,
                    'note'      : "Begin before and end after segment boundary",
                    'locations' : "2700000-3700000",
                    'segments'  : "7-10",
                    'genes'     : "Btbd35f10,Btbd35f11,Btbd35f18,Btbd35f23,Btbd35f24"
                }
            ]

//
// run each of the calls, and produce a file on disc with the output
//
test('selection test', () => {
    // test.01
    client = new Client("http://127.0.0.1", 8000);

    for (const t of AllTests) {
        var selection = new Selection();
        selection.setClient( client );
        selection.setHACKInterval( 400000 ); 
        selection.setTestID( t['test'] );

        // for each instance, create a unique callback that tests the results
        selection.addListener( "selectionChanged",  ((selection) => {
                var ID = selection.testID; 
                expect(selection.locations).toBe(AllTests[ID]['locations']);
                expect(selection.segments).toBe(AllTests[ID]['segments']);
                expect(selection.genes).toBe(AllTests[ID]['genes']);
            }).bind(selection));

        selection.setLocations( t['locations'] );
    }

});
