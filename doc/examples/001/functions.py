import pandas as pd, numpy as np, glob, json, sys
from pypac import PACSession


## -------------------- JSON visulization ftns --------------------- ##
## Write ftn to get json data
def get_structure(url,port,eid,verbose=False):
    """Given a url and port, return the segment identified by eid from 4D genome project"""
    
    # respect local proxy settings
    session = PACSession()
    
    if verbose:
        print("eid: {}".format(eid))
    
    response = session.get('{}:{}/data/structure/{}/segments'.format(url, port, eid))
    
    if verbose:
        print(response.text)
        
    return json.loads(response.text)

## Write ftn to iterate over rows of json data
def parse_json(jdata):
    """
    Given json data in jdata, parse the rows in the json extracting the segid, start, end, and startid.
    """
    return [(s['segid'], s['start'], s['end'], s['startid']) for s in jdata['segments']]
