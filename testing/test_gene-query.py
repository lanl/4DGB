import gentk
import math

Test = "test.00"
Url  = "http://127.0.0.1"
Port = "8000"

# do a test on the release data
if False:
    Test = "release.2021-09-15"
    Url  = "http://127.0.0.1"
    Port = "8015"


client = gentk.client.client(Url, Port)
client.project = Test

def test_gene_query():
    interval = client.get_project_interval() 
    structureid = 0
    range_increment = 10
    genes = {}

    if Test == "test.00":
        genes = {
                    'Btbd35f23' : {
                        'start'     : 3076875,
                        'end'       : 3078817,
                        'length'    : 1942,
                        'gID'       : 'gene:ENSMUSG00000100249',
                        'gene_name' : 'Btbd35f23',
                        'gene_type' : 'protein_coding'
                    },
                    'Btbd35f24' : {
                        'start'     : 3148912,
                        'end'       : 3150852,
                        'length'    : 1940,
                        'gID'       : 'gene:ENSMUSG00000096426',
                        'gene_name' : 'Btbd35f24',
                        'gene_type' : 'protein_coding'
                    }
                }
    else:
        genes = {
                    'Foxr2': {
                        'start'     : 151901782,
                        'end'       : 151915857,
                        'length'    : 14075,
                        'gID'       : 'gene:ENSMUSG00000071665',
                        'gene_name' : 'Foxr2',
                        'gene_type' : 'protein_coding'
                    },
                    'Mageh1' : {
                        'start'     : 151819162,
                        'end'       : 151820571,
                        'length'    : 1409,
                        'gID'       : 'gene:ENSMUSG00000047238',
                        'gene_name' : 'Mageh1',
                        'gene_type' : 'protein_coding'
                    },
                    'Rragb' : {
                        'start'     : 151922977,
                        'end'       : 151954939,
                        'length'    : 31962,
                        'gID'       : 'gene:ENSMUSG00000041658',
                        'gene_name' : 'Rragb',
                        'gene_type' : 'protein_coding'
                    }
                }

    # test all genes 
    for gene in genes:
        result = client.get_gene_metadata(gene)
        assert(result == genes[gene]) 

        # range equals start/end
        result = client.get_genes_for_locations(0, "{}-{}".format(genes[gene]['start'], genes[gene]['end'])) 
        assert(result['genes'] == [gene]) 

        # range within gene 
        result = client.get_genes_for_locations(0, "{}-{}".format(genes[gene]['start']+range_increment, genes[gene]['end']-range_increment)) 
        assert(result['genes'] == [gene]) 

        # range is bigger
        result = client.get_genes_for_locations(0, "{}-{}".format(genes[gene]['start']-range_increment, genes[gene]['end']+range_increment)) 
        assert(result['genes'] == [gene]) 

        # range is partial, from start
        start = genes[gene]['start'] + range_increment
        midpoint = genes[gene]['start'] + int(genes[gene]['length']/2)
        result = client.get_genes_for_locations(0, "{}-{}".format(start, midpoint))
        assert(result['genes'] == [gene]) 

        # range is partial, from start
        end = genes[gene]['end'] + range_increment
        result = client.get_genes_for_locations(0, "{}-{}".format(midpoint, end))
        assert(result['genes'] == [gene]) 

        # check the segment
        segment = math.ceil(int(genes[gene]['start'])/interval) 
        result = client.get_genes_for_segments(0, "{}".format(segment))
        assert(result['genes'] == list(genes.keys()))
        assert(gene in result['genes'])
        for g in result['genes']:
            seg_for_gene = client.get_segments_for_genes(structureid, g)
            assert(seg_for_gene['segments'] == [segment])
