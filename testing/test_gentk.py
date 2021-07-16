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
                    'note'    : 'edge test: first segment is 1',
                    'segment' : [0],
                    'gold'    : []
                },
                {
                    'note'    : 'correct query',
                    'segment' : [8],
                    'gold'    : ['Btbd35f23', 'Btbd35f24']
                },
                {
                    'note'    : 'edge test: last segment is < 10000',
                    'segment' : [10000],
                    'gold'    : []
                }
            ]

    for t in tests:
        result = client.get_genes_for_segment(0,t["segment"])
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

