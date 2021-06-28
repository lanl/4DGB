import gentk

def test_client():
    client = gentk.client.client("http://127.0.0.1", "8000")
    client.project = "test.00"

    print(client.get_structure(0))

