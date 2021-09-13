#
# Imported by the test_gentk.py and test_gentk_production.py scripts
#

client = None

def set_client(new_client, project):
    global client
    client = new_client
    client.project = project


def test_get_contactmap():
    tests = [
                {
                    'note'  : 'Edge test: first segment is 0. Should return empty list', 
                    'cmID'  : -1,
                    'gold'  : [],
                    'index' : None
                },
                {
                    'note'  : 'correct',
                    'cmID'  : 0,
                    'gold'  : {'value': 1.22803363763796, 
                               'x': 5, 
                               'y': 8},
                    'index' : 0
                    
                },
                {
                    'note'   : 'Edge test: last segment is < 2. Should return empty list',
                    'cmID'   : 2,
                    'gold'   : [],
                    'index'  : None
                }
            ]

    for t in tests: 
        result = client.get_contactmap(t['cmID'])
        #returns a list of dictionaries 
        if t['index'] == None:
            #empty list
            assert(result['contacts'] == t['gold'])
        else:
            #comparing a fraction of the list
            assert (result['contacts'][t['index']] == t['gold'])

def test_get_structure():
    tests = [
                {
                    'note'   : 'Edge test: first segment is 0. Should return empty list', 
                    'sid'    : -1,
                    'gold'   : [],
                    'index'  : None
                },
                {
                    'note'   : 'structure 1',
                    'sid'    : 0,
                    'gold'   : {'end': [0.0, 0.0, 0.0], 
                                'length': 400000, 
                                'segid': 1, 
                                'start': [-1.0, 0.0, 0.0], 
                                'startid': 0},
                    'index'  : 0
                    
                },
                {
                    'note'   : 'structure 2',
                    'sid'    : 1,
                    'gold'   : {'end': [0.0, 0.0, 0.0], 
                                'length': 400000, 
                                'segid': 1, 
                                'start': [-1.0, 0.0, 0.0], 
                                'startid': 0},
                    'index'  : 0
                },
                {
                    'note'   : 'Edge test: last segment is < 2. Should return empty list',
                    'sid'    : 2,
                    'gold'   : [],
                    'index'  : None
                }
            ]

    for t in tests: 
        result = client.get_structure(t['sid'])
        #returns a list of dictionaries 
        if t['index'] == None:
            #empty list
            assert(result['segments'] == t['gold'])
        else:
            #comparing a fraction of the list
            assert (result['segments'][t['index']] == t['gold'])


def test_get_genes(): 
    
    result = client.get_genes()
    ogResult = '1600025M17Rik'
    assert (result['genes'][0] == ogResult) 
    assert (len(result['genes']) == 100) 

def test_get_array():
    tests = [
                {
                    'note'  : 'Edge test: first segment is 0. Should return empty dict',
                    'id'    : -1,
                    'slice' : -1,
                    'name'  : None,
                    'type'  : None,
                    'tags'  : [],
                    'values': []
                },
                {
                    'note'  : 'correct query',
                    'id'    : 0,
                    'slice' : 0,
                    'name'  : 'increasing int',
                    'type'  : 'structure',
                    'tags'  : [],
                    'values': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
                },
                {
                    'note'  : 'Edge test: last array is < 10000. Should return empty dict',
                    'id'    : 10000,
                    'slice' : 10000,
                    'name'  : None,
                    'type'  : None,
                    'tags'  : [],
                    'values': [] 
                }
            ]

    for t in tests:
        result = client.get_array(t['id'], t['slice'])
        assert (result['name'] == t['name'])
        assert (result['type'] == t['type'])
        assert (result['tags'] == t['tags'])
        assert (result['data']['values'] == t['values'])

def test_get_genes_for_segments():
    tests = [
                {
                    'note'      : 'Edge test: first segment is 1. Should return empty list',
                    'segment'   : 0,
                    'structure' : 0,
                    'gold'      : []
                },
                {
                    'note'      : 'correct query',
                    'segment'   : 8,
                    'structure' : 0,
                    'gold'      : ['Btbd35f23', 'Btbd35f24']
                },
                {
                    'note'      : 'correct list query',
                    'segment'   : "7,8,9",
                    'structure' : 0,
                    'gold'      : ['Btbd35f11', 'Btbd35f23', 'Btbd35f24']
                },
                {
                    'note'      : 'correct list query',
                    'segment'   : "7-9",
                    'structure' : 0,
                    'gold'      : ['Btbd35f11', 'Btbd35f23', 'Btbd35f24']
                },
                {
                    'note'      : 'correct list query',
                    'segment'   : "8,9,10",
                    'structure' : 0,
                    'gold'      : ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3']
                },
                {
                    'note'      : 'correct list query',
                    'segment'   : "8-10",
                    'structure' : 0,
                    'gold'      : ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3']
                },
                {
                    'note'      : 'correct list query',
                    'segment'   : "7,8,9,10",
                    'structure' : 0,
                    'gold'      : ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3']
                },
                {
                    'note'      : 'correct list query',
                    'segment'   : "7-10",
                    'structure' : 0,
                    'gold'      : ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3']
                },
                {
                    'note'      : 'correct list query',
                    'segment'   : "7,8-10",
                    'structure' : 0,
                    'gold'      : ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3']
                },
                {
                    'note'      : 'correct list query',
                    'segment'   : "7,8,9-10",
                    'structure' : 0,
                    'gold'      : ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3']
                },
                {
                    'note'      : 'correct list query',
                    'segment'   : "7 ,8, 9 -10 ",
                    'structure' : 0,
                    'gold'      : ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3']
                },
                {
                    'note'      : 'Edge test: last segment is < 10000. Should return empty list',
                    'segment'   : 10000,
                    'structure' : 0,
                    'gold'      : []
                }
            ]

    for t in tests:
        result = client.get_genes_for_segments(t["structure"], t["segment"])
        assert (result['genes'] == t["gold"])
    
def test_get_genes_for_locations():
    tests = [
                {
                    'note'      : 'correct query',
                    'segment'   : 8,
                    'structure' : 0,
                    'locations' : "2800000-3200000",
                    'gold'      : ['Btbd35f23', 'Btbd35f24']
                },
                {
                    'note'      : 'correct query',
                    'segment'   : "7,8,9",
                    'structure' : 0,
                    'locations' : "2400000-2800000,2800000-3200000,3200000-3600000",
                    'gold'      : ['Btbd35f11', 'Btbd35f23', 'Btbd35f24']
                },
                {
                    'note'      : 'correct query',
                    'segment'   : "7-9",
                    'structure' : 0,
                    'locations' : "2400000-3600000",
                    'gold'      : ['Btbd35f11', 'Btbd35f23', 'Btbd35f24']
                },
                {
                    'note'      : 'correct query',
                    'segment'   : "8,9",
                    'structure' : 0,
                    'locations' : "2800000-3200000,3200000-3600000",
                    'gold'      : ['Btbd35f11', 'Btbd35f23', 'Btbd35f24']
                },
                {
                    'note'      : 'correct query',
                    'segment'   : "8-9",
                    'structure' : 0,
                    'locations' : "2800000-3600000",
                    'gold'      : ['Btbd35f11', 'Btbd35f23', 'Btbd35f24']
                },
                {
                    'note'      : 'correct list query',
                    'segment'   : "7,8-10",
                    'structure' : 0,
                    'locations' : "2400000-2800000,2800000-4000000",
                    'gold'      : ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3']
                },
            ]

    for t in tests:
        result = client.get_genes_for_locations(t["structure"], t["locations"])
        assert (result['genes'] == t["gold"])


def test_get_segments_for_genes():
    tests = [
                {
                    'note'      : 'Edge test: first structure is 0. Should return empty list',
                    'structure' : -1,
                    'gene'      : 'Btbd35f23',
                    'gold'      : []
                },
                {
                    'note'      : 'correct structure',
                    'structure' : 0,
                    'gene'      : 'Btbd35f23',
                    'gold'      : [8]
                },
                {
                    'note'      : 'correct structure',
                    'structure' : 0,
                    'gene'      : 'Btbd35f24',
                    'gold'      : [8]
                },
                {
                    'note'      : 'Edge test: last structure is < 2. Should return empty list',
                    'structure' : 2,
                    'gene'      : 'Btbd35f24',
                    'gold'      : []
                }
            ]

    for t in tests:
        result = client.get_segments_for_genes(t["structure"], t["gene"])
        assert (result['segments'] == t["gold"]) 

def test_set_array():
    tests = [
                {
                    'metadata'  : {
                                    "name": "test set array", 
                                    "type": "structure", 
                                    "tags": [], 
                                    "datatype": "int", 
                                    "datadim": 1,
                                    "datamin": 0,
                                    "datamax": 4
                                },
                    'values'    : [0, 1, 2, 3, 4, 5],
                    'wrongvals' : [10, 11, 12, 13, 14, 15],
                    'arrayid'   : 8,
                    'structurearrayid'  : 7,
                    'sliceids'  : [0, 1]
                }
            ]

    for t in tests:
        arrayid = client.set_array(t['values'], t['metadata'])
        assert(arrayid == t['arrayid'])

        for i in t['sliceids']:
            result = client.get_array(t['arrayid'], i)
            assert (result['name'] == t['metadata']['name'])
            assert (result['type'] == t['metadata']['type'])
            assert (result['tags'] == t['metadata']['tags'])
            assert (result['data']['values'] == t['values'])
            assert (result['data']['values'] != t['wrongvals'])

    arrays = client.get_arrays('structure')
    assert(arrays['arrays'][t['structurearrayid']] == {'id': 8, 'max': None, 'min': None, 'type': 'structure', 'name': 'test set array'})

def test_get_arrays():
    tests = [
                { 
                    'id'    : 0,
                    'array' : {'id': 0, 'min': 1, 'max': 22, 'type': 'structure', 'name': 'increasing int'}
                },
                {
                    'id'    : 1,
                    'array' : {'id': 1, 'min': 1, 'max': 22, 'type': 'structure', 'name': 'decreasing int'}
                }
            ]

    arrays = client.get_arrays('structure')
    for t in tests:
        assert(arrays['arrays'][t['id']] == t['array']) 

def test_get_sampled_array():
    array = client.get_sampled_array(7, 0, 0, 200000, 100)
    assert(len(array['data']) == 100)

    array = client.get_sampled_array(7, 1, 0, 200000, 52)
    assert(len(array['data']) == 52)

def test_get_segment_ids():
    tests = [
                { 
                    'id'    : 0,
                    'ids'   : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] 
                }
            ]
    for t in tests:
        ids = client.get_segment_ids(0)
        assert(t['ids'] == ids['segmentids'])

def test_get_datset_ids():
    tests = [
                { 
                    'ids'   : [0, 1]
                }
            ]
    for t in tests:
        ids = client.get_dataset_ids()
        assert(t['ids'] == ids)
