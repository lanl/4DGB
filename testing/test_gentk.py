import gentk

client = gentk.client.client("http://127.0.0.1", "8000")
client.project = "test.00"


def test_segments():
    gold = {'end': [0.0, 0.0, 0.0], 
            'length': 200000, 
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
    result = client.get_genes_for_segment(0,1)
    ogResult = []
    assert (result['genes'] == ogResult)
    
'''
def test_segments_for_gene():
    result = client.get_segments_for_gene(0,100)
    print(result)
    assert(False)
    ogResult = ""
    assert (result == ogResult) 
'''

 







