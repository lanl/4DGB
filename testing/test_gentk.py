import gentk

client = gentk.client.client("http://127.0.0.1", "8000")
client.project = "test.00"


def test_segments():
    gold = {'end': [0.0, 0.0, 0.0], 
            'length': 400000, 
            'segid': 1, 
            'start': [-1.0, 0.0, 0.0], 
            'startid': 0}
    result = client.get_structure(0)
    assert(result['segments'][0] == gold)


def test_genes(): 
    
    result = client.get_genes()
    ogResult = '1700011M02Rik'
    assert (result['genes'][0] == ogResult) 


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
    #test1
    result = client.get_segments_for_gene(0, 'Btbd35f23')
    ogResult = 8
    assert (result['segments'][0] == ogResult) 

    #test2
    result2 = client.get_segments_for_gene(0, 'Btbd35f24')
    ogResult2 = 8
    assert (result2['segments'][0] == ogResult2) 

def test_get_segment_array():
    gold = {'array': [{'segment': 1, 'value': 0.1}, {'segment': 2, 'value': 0.2}, {'segment': 3, 'value': 0.3}, {'segment': 4, 'value': 0.4}, {'segment': 5, 'value': 0.5}, {'segment': 6, 'value': 0.6}, {'segment': 7, 'value': 0.7}, {'segment': 8, 'value': 0.8}, {'segment': 9, 'value': 0.9}, {'segment': 10, 'value': 0.1}, {'segment': 11, 'value': 0.11}], 'type': 'epigenetics'}

    assert(client.get_segment_array('epigenetics', 0) == gold)

