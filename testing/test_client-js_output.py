import filecmp
import os.path

def test_outputs():
    gold_dir = "testing/data/gold/client-js"
    outputs = [
                "gtkclient_contactmap_test.json",
                "gtkclient_genes-for-segment_test.json",
                "gtkclient_genes_test.json",
                "gtkclient_structure_test.json"
            ]

    for o in outputs:
        assert (filcmp.cmp(o, os.path.join(gold_dir, o)))
