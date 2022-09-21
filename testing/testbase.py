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

def test_get_gene_metadata(): 
    result = client.get_gene_metadata('Btbd35f23')
    assert(len(result) == 6)
    assert(result['start'] == 3076875)
    assert(result['end']   == 3078817)
    assert(result['gID']   == 'gene:ENSMUSG00000100249')
