import bbi
import yaml
import sys
import os
from os import path, chdir
import numpy
import re
import math

from math import nan

from flask import Flask, request, jsonify, render_template, send_file, url_for, send_from_directory
from flask_restful import Resource, Api
from sqlalchemy import create_engine
import json

#
# A Flask Server that handles queries for data in a GTK project
# by querying the project's SQLite database
#
# This can be run from the command-line to run a simple testing instance.
# In the future, it will also be possible to run this a WSGI app from a
# production server.
#

#
# initialize
# when run as a script, these can be overriden with command-line arguments
#
if 'PROJECT_HOME' in os.environ:
    PROJECT_HOME = os.environ['PROJECT_HOME']
else:
    PROJECT_HOME = path.abspath(
        path.join( path.dirname(__file__), 'static', 'project')
    )

PROJECT_FILE = path.join( PROJECT_HOME, 'project.json' )

DB_PATH = path.abspath(
    path.join( PROJECT_HOME, 'generated', 'generated-project.db')
)

app = Flask(__name__)
api = Api(app)

# If not running as the test server, we can run connect
# to the database now (for the test server, the connection
# is made at the bottom of the file after DB_PATH has had
# a chance to be overwritten by command-line arguments)
if __file__ != '__main__':
    db_connect = create_engine('sqlite:///'+DB_PATH)

# verbose or not
VERBOSE = False
# VERBOSE = True

#
# get the interval of the datasets for this project
# TODO: generalize the storage and retrieval of this data
#
def get_dataset_interval():
    interval = 0
    with open(PROJECT_FILE, 'r', encoding="utf-8" ) as pfile:
        data = json.load(pfile)

        interval = data["project"]["interval"]

    return interval

def get_dataset_ids():
    datasets = []
    with open(PROJECT_FILE, 'r', encoding="utf-8" ) as pfile:
        data = json.load(pfile)

        for d in data["datasets"]:
            datasets.append(d['id'])
    datasets.sort()

    return datasets


def get_array_metadata(arrayID):
    conn  = db_connect.connect()
    data  = []

    query = conn.execute("SELECT url FROM array WHERE id == {}".format(arrayID))
    results = query.cursor.fetchall()

    array = {
                "name"      : None, 
                "type"      : None, 
                "version"   : "0.1",
                "tags"      : [],
                "data"      : {
                    "type"  : None, 
                    "dim"   : None, 
                    "min"   : None,
                    "max"   : None,
                    "values": []
                }
            }

    if (len(results) != 0):
        fname = PROJECT_HOME + "/" + results[0][0]

        with open(fname, "r", encoding="utf-8" ) as jfile:
            array = json.load(jfile)

    return array

#
# get the array data for an ID
#
def load_array_data(arrayID, arraySlice):
    array = get_array_metadata(arrayID)

    if (array['type'] != None):
        # determine if there is data there
        info = array['data']['values'][int(arraySlice)]
        if (info['url'] != ""):
            # load the data from disk
            data = numpy.load(PROJECT_HOME + "/" + info['url'])
            values = list(map(
                lambda d: None if math.isnan(d) else d,
                data[info['id']].tolist()
            ))
            array['data']['values'] = values
        # else:
            # TODO: determine the correct behavior

    return array

#
# routes for serving static files
#
@app.route('/')
def home():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def root(path):
    return send_from_directory('static', path)

@app.route('/project/project.json')
def project():
    return send_file(PROJECT_FILE)

@app.route('/project/<path:path>')
def projectdir(path):
    return send_from_directory(PROJECT_HOME, path)

#
# return a list of the variables available
#
@app.route('/data/<projid>/arrays/<atype>')
def GetArrays(projid, atype):
    conn  = db_connect.connect()
    data  = []
    query = conn.execute("SELECT name,id,type,min,max FROM array WHERE projid == ? AND type == ? ORDER BY id", [projid, atype])
    for a in query.cursor.fetchall():
        element = { 
                    'name': a[0],
                    'id'  : a[1], 
                    'type': a[2],
                    'min' : a[3],
                    'max' : a[4]
                  }

        # min
        if a[3] != None:
            element['min'] = float(a[3])

        # max
        if a[4] != None:
            element['max'] = float(a[4])

        data.append(element)

    return jsonify({ 'arrays': data })

#
# return a list of the project IDs
#
@app.route('/datasets')
def GetDatasetIDs():
    return jsonify(get_dataset_ids())

#
# return a data array defined on the segments 
#
# Note: 'projid' added to API call, but not used
@app.route('/data/array/<projid>/<arrayID>/<arraySlice>')
def GetArray(arrayID, arraySlice):
    array = load_array_data(arrayID, arraySlice)

    return jsonify(array)

#
# set a data array
#
@app.route('/data/setarray/<projid>', methods=['POST'])
def SetArray():
    results = {}
    if (request.method == "POST"):
        # get the next IR
        conn  = db_connect.connect()
        query = conn.execute("SELECT COUNT(*) FROM array")
        results = query.cursor.fetchall()
        arrayID = results[0][0]
        fid         = '{:04d}'.format(arrayID)
        fname       = 'source/array/{}.json'.format(fid) 
        fullname    = '{}/{}'.format(PROJECT_HOME, fname)
        aname       = 'source/array/{}.npz'.format(fid) 
        arrayfname  = '{}/{}'.format(PROJECT_HOME, aname) 

        # save the file to the database
        data = request.get_json()
        conn.execute('''INSERT INTO array (projid,id,name,type,url) VALUES (?,?,?,?,?)''', [projid,arrayID, data["name"], data["type"], fname])

        with open(fullname, 'w') as jfile:
            jfile.write("{\n")
            jfile.write("\"name\"      : \"{}\",\n".format(data["name"]))
            jfile.write("\"type\"      : \"{}\",\n".format(data["type"]))
            jfile.write("\"version\"   : \"0.1\",\n")
            jfile.write("\"tags\"      : {},\n".format(data["tags"]))
            jfile.write("\"data\"      : {\n")
            jfile.write("    \"type\"  : \"{}\",\n".format(data["datatype"]))
            jfile.write("    \"dim\"   : {},\n".format(data["datadim"]))
            jfile.write("    \"values\" : [\n")
            firstTime = True;
            for d in get_dataset_ids():
                if ( firstTime ) :
                    firstTime = False
                else :
                    # finish the previous array 
                    jfile.write("        },\n")
                jfile.write("        {\n")
                jfile.write("            \"id\"  : \"arr_{}\",\n".format(d))
                jfile.write("            \"url\" : \"{}\"\n".format(aname))
            jfile.write("        }\n")
            jfile.write("    ]\n")
            jfile.write("}\n")
            jfile.write("}\n")

        # TODO:
        # for this call, we save the same array information for each dataset
        # we must provide another call to save different arrays for each dataset 
        kwargs = {} 
        for d in get_dataset_ids():
            kwargs["arr_{}".format(d)] = data["array"]

        numpy.savez_compressed(arrayfname, **kwargs) 

    results = {'id': arrayID}        
    return jsonify(results)

#
# get unmapped data for a structure
#
# using the data in the database, construct and return a list of integers that
# show which segments are 'mapped', and which are 'unmapped'. This information
# appears in the project.yaml file as a list of [begin, end] pairs, and these
# if present are expanded to a full list, one for each segment in the database
#
@app.route('/data/structure/<projid>/<identifier>/unmapped')
def UnmappedData(projid, identifier):
    if (VERBOSE):
        print("Querying UnmappedData ...")

    conn    = db_connect.connect()
    query   = conn.execute("SELECT num_segments,unmapped FROM structure_metadata WHERE projid == ? AND id == ?", [projid, identifier])
    results = query.cursor.fetchone()

    final = []
    int_list = []
    if results: 
        if (results[1] != '[]'):
            # make an int array the same size as the result array
            int_list = [0] * results[0]

            if (VERBOSE):
                print(results)
                print("unmapped: {}".format(results[1]))

            num_elements = results[0]
            # we are creating a 1-based array
            data = numpy.zeros(num_elements + 1)

            elem = results[1].replace(" ", "")
            elem = elem[1:]
            elem = elem[:-1]
            for e in elem.split("],["):
                e = e.replace("]", "")
                e = e.replace("[", "")

                nums = e.split(",")
                for i in range(int(nums[0]), int(nums[1]) + 1):
                    data[i] = 1

            # remove the 0th element
            final = numpy.delete(data, 0)

    # convert to python int array before serializing, b/c jsonify can't
    # serialize numpy ints
    cur = 0
    for v in final:
        int_list[cur] = int(v)
        cur += 1

    return jsonify({ 'unmapped': list(int_list) })


#
# return the segments of a structure
#
@app.route('/data/structure/<projid>/<identifier>/segments')
def SegmentData(projid, identifier):
    if (VERBOSE):
        print("Querying structure for segment data ...")

    conn    = db_connect.connect()
    query   = conn.execute("SELECT segid, startid, length, startx, starty, startz, endx, endy, endz FROM structure WHERE projid == ? AND structureid == ? ORDER BY segid", [projid, identifier])
    data    = []
    for b in query.cursor.fetchall():
        data.append({ 
                        'segid'  : int(b[0]),
                        'startid': int(b[1]),
                        'length' : int(b[2]),
                        'start'  : [float(b[3]), float(b[4]), float(b[5])],
                        'end'    : [float(b[6]), float(b[7]), float(b[8])],
                    })

    return jsonify({ 'segments': data })

#
# return the segments of a structure
#
@app.route('/data/structure/<projid>/<identifier>/segmentids')
def SegmentIds(identifier):
    conn    = db_connect.connect()
    query   = conn.execute("SELECT segid FROM structure WHERE projid == ? AND structureid == ? ORDER BY segid", [projid,identifier])
    data    = []
    for b in query.cursor.fetchall():
        data.append(b[0])

    query = conn.execute("SELECT interval FROM project WHERE projid == ?", [projid])

    return jsonify({ 'segmentids': data })

#
# return contact records (Hi-C data)
#
@app.route('/data/contact-map/<projid>/<identifier>')
def ContactMap(identifier):
    conn    = db_connect.connect()
    query   = conn.execute("SELECT x, y, value FROM contactmap WHERE projid == ? AND id == ?", [projid,identifier])
    data    = []
    for c in query.cursor.fetchall():
        data.append({
            'x': int(c[0]),
            'y': int(c[1]),
            'value': None if c[2] is None else float(c[2])
        })

    return jsonify({ 'contacts': data })

#
# get the project-wide interval
#
@app.route('/project/<projid>/interval')
def ProjectInterval(projid):
    conn = db_connect.connect()

    query = conn.execute("SELECT interval FROM project WHERE projid == ?", [projid])
    results = query.cursor.fetchone()

    return jsonify(results[0])

#
# get all genes in a project
#
@app.route('/genes/<projid>')
def Genes(projid):
    # return all genes
    conn = db_connect.connect()

    query = conn.execute("SELECT DISTINCT gene_name from genes WHERE projid == ? ORDER BY gene_name", [projid])
    genes = []
    for g in query.cursor.fetchall():
        genes.append(g[0])

    return jsonify({'genes': genes})

#
# get metadata for a gene 
#
@app.route('/genes/meta/<projid>/<name>')
def GetGeneMetadata(projid, name):
    # return all genes
    conn = db_connect.connect()

    query = conn.execute("SELECT start,end,length,gID,gene_type,gene_name from genes WHERE projid == ? AND gene_name = ?", [projid, name])
    results = query.cursor.fetchone()

    data = {
            "start"     : results[0],
            "end"       : results[1],
            "length"    : results[2],
            "gID"       : results[3],
            "gene_type" : results[4],
            "gene_name" : results[5]
            }

    return jsonify(data)

#
# genes for a list of segments or segment ranges
#
@app.route('/data/structure/<projid>/<structureid>/segment/<segmentids>/genes')
def GenesForSegments(projid, structureid, segmentids):
    if (VERBOSE):
        print("Querying GenesForSegment ...")

    # if the query returns nothing, we return an empty list
    genes = []

    # find all genes that intersect with the segments
    conn = db_connect.connect()
    cleaned = re.sub(r'\s', '', segmentids)
    sids = cleaned.split(',')

    for s in sids:
        match = re.match( r'^(?P<start>[0-9]+)\-(?P<end>[0-9]+)$', s )

        seg_start = 0
        seg_end   = 0
        if (match != None):
            # this is a range
                # get the start
            query   = conn.execute("SELECT startid, endid FROM structure WHERE projid == ? AND structureid = ? AND segid = ?", projid, structureid, match.group('start'))
            results = query.cursor.fetchall()
            if (len(results) != 0):
                seg_start = results[0][0]

                # get the end
            query   = conn.execute("SELECT startid, endid FROM structure WHERE projid == ? AND structureid = ? AND segid = ?", projid, structureid, match.group('end'))
            results = query.cursor.fetchall()

            if (len(results) != 0):
                seg_end = results[0][1]
        else:
            # find all genes that intersect with these segments 
            query   = conn.execute("SELECT startid, endid FROM structure WHERE projid == ? AND structureid = ? AND segid = ?", projid, structureid, s)
            results = query.cursor.fetchall()

            # query and create a list of genes 
            if (len(results) != 0):
                seg_start = results[0][0]
                seg_end   = results[0][1]

            else:
                print("WARNING: no segment found for: {}, {}".format(structureid, s))

        # find the genes for a range 
        results = getGenesForLocationRange( seg_start, seg_end )
        for g in results: 
            if (not g in genes):
                genes.append(g)

    genes.sort()
    return jsonify({'genes': genes})


#
# genes for a list of locations or location ranges
#
@app.route('/data/structure/<projid>/<structureid>/locations/<locations>/genes')
def GenesForLocations(projid, structureid, locations):
    # if the query returns nothing, we return an empty list
    genes = []

    # find all genes that intersect with the segments
    conn = db_connect.connect()
    cleaned = re.sub(r'\s', '', locations)
    locations = cleaned.split(',')

    for s in locations:
        match = re.match( r'^(?P<start>[0-9]+)\-(?P<end>[0-9]+)$', s )

        start = 0
        end   = 0
        if (match != None):
            start = match.group('start')
            end   = match.group('end')
        else:
            start = s
            end   = s

        # find the genes for a range 
        results = getGenesForLocationRange( start, end )
        for g in results: 
            if (not g in genes):
                genes.append(g)

    genes.sort()
    return jsonify({'genes': genes})
    
#
# segments for a list of genes
#
@app.route('/genes/<projid>/<names>/data/structure/<structureid>')
def SegmentsForGene(projid, names, structureid):
    # if the query returns nothing, we return an empty list
    segments = []

    # find all genes that intersect with the segments
    conn = db_connect.connect()
    snames = names.split(',')

    for s in snames:
        query = conn.execute("SELECT start, end FROM genes WHERE projid == ? AND gene_name == ?", [projid, s])
        results = query.cursor.fetchone()

        if (results != None) :
            g_start = results[0]
            g_end   = results[1]

            query = conn.execute("SELECT segid from structure WHERE projid == ? AND structureid = ? AND \
                                      ( ( startid BETWEEN ? AND ? ) OR ( endid BETWEEN ? AND ? ) OR \
                                        ( startid > ? AND endid < ? ) OR ( startid < ? AND endid > ? ) ) ORDER BY segid", 
                                      projid, structureid, g_start, g_end, g_start, g_end, g_start, g_end, g_start, g_end)
            for b in query.cursor.fetchall():
                if (b[0] not in segments) :
                    segments.append(b[0])
        else:
            print("SegmentsForGene did not find gene: ({})".format(s))

    segments.sort()
    return jsonify({'segments': segments})

#
# get a sampled array 
#
@app.route('/data/samplearray/<arrayID>/<arraySlice>/<begin>/<end>/<numsamples>')
def SampleArray(arrayID, arraySlice, begin, end, numsamples):
    array = get_array_metadata(arrayID)

    data = []
    if ( 'sequence' in array['data']['values'][int(arraySlice)] ):
        # there is a sequence array
        adata = array['data']['values'][int(arraySlice)]
        url = "{}/{}".format(PROJECT_HOME, adata['sequence']['url'])
        data = bbi.fetch(url, adata['sequence']['chrom'], int(begin), int(end), int(numsamples))
    else:
        # there is a sequence array
        array = load_array_data(arrayID, arraySlice)
        interval = get_dataset_interval()
        sid = int(int(begin)/interval)
            # add one, to include the final element we want
        eid = int(int(end)/interval) + 1
        data = array['data']['values'][sid:eid]

    return jsonify({'data': list(data)})

#
# helper function to query genes for a location range
#
def getGenesForLocationRange( start, end ):
    conn = db_connect.connect()

    # find the genes for the entire range
    query = conn.execute("SELECT gene_name from genes WHERE \
                            ( start BETWEEN ? AND ? ) OR ( end BETWEEN ? AND ? ) OR \
                            ( start < ? AND end > ? ) OR ( start == ? ) or ( end == ? ) ORDER BY gene_name", 
                            start, end, start, end, start, end, start, end)

    genes = []
    for g in query.cursor.fetchall():
        if (not g[0] in genes):
            genes.append(g[0])

    genes.sort()

    return genes


#
# activate
#
if __name__ == '__main__':
    import argparse

    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description="gtkserver.py: GTK Testing Server"
    )

    parser.add_argument('-p', '--port', default="8000", help="Server port")
    parser.add_argument('--host', default="127.0.0.1", help="Server bind address")

    parser.add_argument(
        '--project', default=PROJECT_HOME, metavar="PATH",
        help="Custom path to project directory"
    )

    args = parser.parse_args()
    PROJECT_HOME = path.abspath(args.project)

    PROJECT_FILE = path.join( PROJECT_HOME, 'project.json' )
    DB_PATH = path.abspath(
        path.join( PROJECT_HOME, 'generated', 'generated-project.db')
    )

    db_connect = create_engine('sqlite:///'+DB_PATH)

    # cd to server directory
    chdir( path.dirname(__file__) )

    app.run(host=args.host, port=args.port)

