import gentk

client = gentk.client.client("http://127.0.0.1", "8000")
client.project = "test.00"

def test_contactmap():
    result = client.get_contactmap(0)
    gold = {'value': 1.22803363763796, 'x': 5, 'y': 8}
    assert (result['contacts'][0] == gold) 

def test_structure():
    tests = [
                {
                    'note'      : 'Edge test: first segment is 0. Should return empty list', 
                    'sid'       : -1,
                    'gold'      : [],
                    'index'     : None
                },
                {
                    'note'      : 'structure 1',
                    'sid'       : 0,
                    'gold'      : {'end': [0.0, 0.0, 0.0], 
                                   'length': 400000, 
                                   'segid': 1, 
                                   'start': [-1.0, 0.0, 0.0], 
                                   'startid': 0},
                    'index'     : 0
                    
                },
                {
                    'note'      : 'structure 2',
                    'sid'       : 1,
                    'gold'      : {'end': [0.0, 0.0, 0.0], 
                                   'length': 400000, 
                                   'segid': 1, 
                                   'start': [-1.0, 0.0, 0.0], 
                                   'startid': 0},
                    'index'     : 0
                },
                {
                    'note'      : 'Edge test: last segment is < 2. Should return empty list',
                    'sid'       : 2,
                    'gold'      : [],
                    'index'     : None
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


def test_genes(): 
    
    result = client.get_genes()
    ogResult = '1700011M02Rik'
    assert (result['genes'][0] == ogResult) 

def test_array():
    tests = [
                {
                    'note'  : 'Edge test: first segment is 0. Should return empty dict',
                    'id'    : -1,
                    'name'  : None,
                    'type'  : None,
                    'tags'  : [],
                    'values': []
                },
                {
                    'note'  : 'correct query',
                    'id'    : 0,
                    'name'  : "compartment",
                    'type'  : 'structure',
                    'tags'  : [],
                    'values': [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]
                },
                {
                    'note'  : 'Edge test: last array is < 10000. Should return empty dict',
                    'id'    : 10000,
                    'name'  : None,
                    'type'  : None,
                    'tags'  : [],
                    'values': [] 
                }
            ]

    for t in tests:
        result = client.get_array(t['id'])
        assert (result['name'] == t['name'])
        assert (result['type'] == t['type'])
        assert (result['tags'] == t['tags'])
        assert (result['data']['values'] == t['values'])

def test_genes_for_segment():
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
                    'note'      : 'Edge test: last segment is < 10000. Should return empty list',
                    'segment'   : 10000,
                    'structure' : 0,
                    'gold'      : []
                }
            ]

    for t in tests:
        result = client.get_genes_for_segment(t["structure"], t["segment"])
        assert (result['genes'] == t["gold"])
    


def test_segments_for_gene():
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
        result = client.get_segments_for_gene(t["structure"], t["gene"])
        assert (result['segments'] == t["gold"]) 
