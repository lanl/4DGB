#
# Imported by the test_gentk.py and test_gentk_production.py scripts
#

client = None

def set_client(new_client, project, projid):
    global client
    client = new_client
    client.project = project
    client.projid  = projid


def test_get_project_interval():
    result = client.get_project_interval()
    assert(result == 400000)

def test_get_genes(): 
    result = client.get_genes()
    assert(len(result['genes']) == 1331)
