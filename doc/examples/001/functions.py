
## -------------------- JSON visulization ftns --------------------- ##

## Write ftn to iterate over rows of json data
def parse_json(jdata):
    """
    Given json data in jdata, parse the rows in the json extracting the segid, start, end, and startid.
    """
    return [(s['segid'], s['start'], s['end'], s['startid']) for s in jdata['segments']]
