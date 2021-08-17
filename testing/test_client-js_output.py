import filecmp
import os.path

def test_outputs():
    gold_dir = "testing/data/gold/client-js"
    outputs = [
                "gtkclient_array_test.json",
                "gtkclient_contactmap_test.json",
                "gtkclient_genes-for-segments_test.json",
                "gtkclient_genes_test.json",
                "gtkclient_get-arrays_test.json",
                "gtkclient_get-sequence-arrays_test.json",
                "gtkclient_get-structure-arrays_test.json",
                "gtkclient_segments-for-genes_test.json",
                "gtkclient_structure_test.json"
            ]

    for o in outputs:
        assert (filecmp.cmp(o, os.path.join(gold_dir, o)))
