// Selection requires a static Client and Project be set before
// its constructed
const Client        = require('../client-js/GTK/Client');
const Project       = require('../client-js/GTK/Project');
const Util          = require('../client-js/GTK/Util');
const { Selection } = require('../client-js/GTK/selections');

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

/**
 * Convert a suite of tests to a form consumable by test.concurrent.each
 */
const convert_test = ({test, locations, segments, genes, note}) => [
    note || `Test #${test}`,
    Util.compressRanges( Util.rangeStringToRanges(locations) ),
    Util.compressRanges( Util.rangeStringToRanges(segments)  ),
    genes.split(',')
];

beforeAll( async () => {
    // This should be run against the 'test.01' project!
    Client.TheClient   = new Client("http://127.0.0.1:8000");
    Project.TheProject = await Project.getProject();
});

// Location Tests
test.concurrent.each( LocationTests.map(convert_test) )(
    'Select by Location: %s', 
    async (_, locations, segments, genes) => {
        const selection = Selection.fromLocations(locations);

        expect( selection.asLocations()    ).toEqual( locations );
        expect( selection.asSegments()     ).toEqual( segments  );
        expect( await selection.asGenes()  ).toEqual( genes     );
    }
);


// Segment Tests
test.concurrent.each( SegmentTests.map(convert_test) )(
    'Select by Segment: %s', 
    async (_, locations, segments, genes) => {
        const selection = Selection.fromSegments(segments);

        expect( selection.asLocations()    ).toEqual( locations );
        expect( selection.asSegments()     ).toEqual( segments  );
        expect( await selection.asGenes()  ).toEqual( genes     );
    }
);

// Gene Tests
test.concurrent.each( GeneTests.map(convert_test) )(
    'Select by Genes: %s', 
    async (_, locations, segments, genes) => {
        const selection = await Selection.fromGenes(genes);

        expect( selection.asLocations()    ).toEqual( locations );
        expect( selection.asSegments()     ).toEqual( segments  );
        expect( await selection.asGenes()  ).toEqual( genes     );
    }
);
