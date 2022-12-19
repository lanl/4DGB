#
# Imported by the test_gentk.py and test_gentk_production.py scripts
#

import math

client = None

def set_client(new_client, project, projid):
    global client
    client = new_client
    client.project = project
    client.projid  = projid

def test_get_project_id():
    result = client.get_project_id()
    assert(result == 'test00projid')

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

def test_get_gene_locations(): 
    result = client.get_genes_for_locations(0, "3076875-3078817")
    assert(result['genes'] == ["Btbd35f23"])

def test_get_gene_segments(): 
    interval = client.get_project_interval()
    segment  = math.ceil(int(3076875)/interval)
    result = client.get_genes_for_segments(0, f'{segment}') 
    assert(result['genes'] == ['Btbd35f23', 'Btbd35f24'])

def test_get_segments_for_genes(): 
    interval = client.get_project_interval()
    segment  = math.ceil(int(3076875)/interval)
    gene = 'Btbd35f24'
    result = client.get_segments_for_genes(0, gene) 
    assert(result['segments'] == [segment])

def test_get_structure():
    result = client.get_genes_for_locations(0, "3076875-3078817")
    assert(result['genes'] == ["Btbd35f23"])
