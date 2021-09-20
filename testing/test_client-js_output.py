import filecmp
import os.path

def test_outputs():
    gold_dir = "testing/data/gold/client-js"
    outputs = [
                "gtkclient_genes_test.json",
                "gtkclient_structure_test.json"
            ]

    for o in outputs:
        assert (filecmp.cmp(o, os.path.join(gold_dir, o)))
