import gentk

def test_segments():
    client = gentk.client.client("http://127.0.0.1", "8000")
    client.project = "test.00"

    gold = {'end': [0.0, 0.0, 0.0], 
            'length': 200000, 
            'segid': 1, 
            'start': [-1.0, 0.0, 0.0], 
            'startid': 0}
    result = client.get_structure(0)

    assert(result['segments'][0] == gold)

def test_print():
    print("Hello")
    assert(True)
