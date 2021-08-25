const Client    = require('../client-js/GTK/Client.js');
const Selection = require('../client-js/GTK/Selection.js');

var TestTypes = ["location", "segment", "gene"]
TestTypes = ["location", "segment"]

var LocationTests = [
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

var SegmentTests = [
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
                    'locations' : "2800000-4000000",
                    'segments'  : "8-10",
                    'genes'     : "Btbd35f10,Btbd35f11,Btbd35f16,Btbd35f18,Btbd35f23,Btbd35f24,Btbd35f3"
                },
                {
                    'test'      : 5,
                    'note'      : "Start of range is just before the segment boundary",
                    'locations' : "2400000-3600000",
                    'segments'  : "7-9",
                    'genes'     : "Btbd35f11,Btbd35f23,Btbd35f24"
                },
                {
                    'test'      : 6,
                    'note'      : "Begin before and end after segment boundary",
                    'locations' : "2400000-4000000",
                    'segments'  : "7-10",
                    'genes'     : "Btbd35f10,Btbd35f11,Btbd35f16,Btbd35f18,Btbd35f23,Btbd35f24,Btbd35f3"
                }
            ]

var GeneTests = [
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
                    'locations' : "2800000-3200000,3200000-3600000",
                    'segments'  : "8,9",
                    'genes'     : "Btbd35f11,Btbd35f23,Btbd35f24"
                },
                {
                    'test'      : 4,
                    'locations' : "2800000-3200000,3200000-3600000,3600000-4000000",
                    'segments'  : "8,9,10",
                    'genes'     : "Btbd35f10,Btbd35f11,Btbd35f16,Btbd35f18,Btbd35f23,Btbd35f24,Btbd35f3"
                },
                {
                    'test'      : 5,
                    'locations' : "2800000-3200000,3200000-3600000",
                    'segments'  : "8,9",
                    'genes'     : "Btbd35f11,Btbd35f23,Btbd35f24"
                },
                {
                    'test'      : 6,
                    'locations' : "2800000-3200000,3200000-3600000,3600000-4000000",
                    'segments'  : "8,9,10",
                    'genes'     : "Btbd35f10,Btbd35f11,Btbd35f16,Btbd35f18,Btbd35f23,Btbd35f24,Btbd35f3"
                }
            ]

//
// run each of the calls, and produce a file on disc with the output
//
test('selection test', () => {
    // test.01
    client = new Client("http://127.0.0.1", 8000);

    // location-setting tests
    for (const t of LocationTests) {
        var selection = new Selection();
        selection.client = client;
        selection.HACKInterval = 400000; 
        selection.marker = t['test'];

        // for each instance, create a unique callback that tests the results
        selection.addListener( "selectionChanged",  ((selection) => {
                var ID = selection.marker; 
                expect(selection.locations).toBe(LocationTests[ID]['locations']);
                expect(selection.segments).toBe(LocationTests[ID]['segments']);
                expect(selection.genes).toBe(LocationTests[ID]['genes']);
            }).bind(selection));

        selection.selectLocations( t['locations'] );
    }

    // segment-setting tests
    for (const t of SegmentTests) {
        var selection = new Selection();
        selection.client = client;
        selection.HACKInterval = 400000; 
        selection.marker = t['test'];

        // for each instance, create a unique callback that tests the results
        selection.addListener( "selectionChanged",  ((selection) => {
                var ID = selection.marker; 
                expect(selection.locations).toBe(SegmentTests[ID]['locations']);
                expect(selection.segments).toBe(SegmentTests[ID]['segments']);
                expect(selection.genes).toBe(SegmentTests[ID]['genes']);
            }).bind(selection));

        selection.selectSegments( t['segments'] );
    }

    // gene-setting tests
    for (const t of GeneTests) {
        var selection = new Selection();
        selection.client = client;
        selection.HACKInterval = 400000; 
        selection.marker = t['test'];

        // for each instance, create a unique callback that tests the results
        selection.addListener( "selectionChanged",  ((selection) => {
                var ID = selection.marker; 
                expect(selection.locations).toBe(GeneTests[ID]['locations']);
                expect(selection.segments).toBe(GeneTests[ID]['segments']);
                expect(selection.genes).toBe(GeneTests[ID]['genes']);
            }).bind(selection));

        selection.selectGenes( t['genes'] );
    }
});
