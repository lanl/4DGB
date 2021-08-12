import bbi
import yaml
import sys
from os import path, chdir
import numpy

from math import nan

from flask import Flask, request, jsonify, render_template, url_for
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
#
PROJECT_HOME = path.abspath(
    path.join( path.dirname(__file__), 'static', 'project')
)
PROJECT_FILE = path.join( PROJECT_HOME, 'project.json' )

DB_PATH = path.abspath(
    path.join( PROJECT_HOME, 'generated', 'generated-project.db')
)

app = Flask(__name__)
api = Api(app)

db_connect = None

def get_dataset_ids():
    datasets = []
    with open(PROJECT_FILE, 'r') as pfile:
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

        with open(fname, "r") as jfile:
            array = json.load(jfile)

    return array

#
# return a list of the variables available
#
@app.route('/data/arrays/<atype>')
def GetArrays(atype):
    conn  = db_connect.connect()
    data  = []
    query = conn.execute("SELECT name,id,type,min,max FROM array WHERE type == \'{}\' ORDER BY id".format(atype))
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
@app.route('/data/array/<arrayID>/<arraySlice>')
def GetArray(arrayID, arraySlice):
    array = get_array_metadata(arrayID)

    if (array['data']['values'][int(arraySlice)]['url'] != ""):
        values = numpy.load(PROJECT_HOME + "/" + array['data']['values'][int(arraySlice)]['url'])
        array['data']['values'] = values[array['data']['values'][int(arraySlice)]['id']].tolist() 

    return jsonify(array)

#
# set a data array
#
@app.route('/data/setarray', methods=['POST'])
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
        conn.execute('''INSERT INTO array (id,name,type,url) VALUES (?,?,?,?)''', [arrayID, data["name"], data["type"], fname])

        with open(fullname, 'w') as jfile:
            jfile.write("{\n")
            jfile.write("\"name\"      : \"{}\",\n".format(data["name"]))
            jfile.write("\"type\"      : \"{}\",\n".format(data["type"]))
            jfile.write("\"version\"   : \"0.1\",\n")
            jfile.write("\"tags\"      : {},\n".format(data["tags"]))
            jfile.write("\"data\"      : {\n")
            jfile.write("    \"type\"  : \"{}\",\n".format(data["datatype"]))
            jfile.write("    \"dim\"   : {},\n".format(data["datadim"]))
            jfile.write("    \"url\"   : \"{}\"".format(aname))
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
# return the segments of a structure
#
@app.route('/data/structure/<identifier>/segments')
def SegmentData(identifier):
    conn    = db_connect.connect()
    query   = conn.execute("SELECT segid, startid, length, startx, starty, startz, endx, endy, endz FROM structure WHERE structureid == {} ORDER BY segid".format(identifier))
    data    = []
    lengths = []
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
@app.route('/data/structure/<identifier>/segmentids')
def SegmentIds(identifier):
    conn    = db_connect.connect()
    query   = conn.execute("SELECT segid FROM structure WHERE structureid == {} ORDER BY segid".format(identifier))
    data    = []
    for b in query.cursor.fetchall():
        data.append(b[0])

    return jsonify({ 'segmentids': data })

#
# return contact records (Hi-C data)
#
@app.route('/data/contact-map/<identifier>')
def ContactMap(identifier):
    conn    = db_connect.connect()
    query   = conn.execute("SELECT x, y, value FROM contact WHERE mapid == ?", [identifier])
    data    = []
    for c in query.cursor.fetchall():
        data.append({
            'x': int(c[0]),
            'y': int(c[1]),
            'value': None if c[2] is None else float(c[2])
        })

    return jsonify({ 'contacts': data })

#
# get all genes in a project
#
@app.route('/genes')
def Genes():
    # return all genes
    conn = db_connect.connect()

    query = conn.execute("SELECT DISTINCT gene_name from genes ORDER BY gene_name")
    genes = []
    for g in query.cursor.fetchall():
        genes.append(g[0])

    return jsonify({'genes': genes})

#
# genes for a segment 
#
@app.route('/data/structure/<structureid>/segment/<segmentid>/genes')
def GenesForSegment(structureid, segmentid):
    # find all genes that intersect with this segment
    conn = db_connect.connect()
    query   = conn.execute("SELECT startid, endid FROM structure WHERE structureid = ? AND segid = ?", structureid, segmentid)
    results = query.cursor.fetchall()

    # if the result returns nothing, we return an empty genes list
    genes = []

    # query and create a list of genes 
    if (len(results) != 0):
        seg_start = results[0][0]
        seg_end   = results[0][1]

        query = conn.execute("SELECT gene_name from genes WHERE \
                                ( start BETWEEN ? AND ? ) OR ( end BETWEEN ? AND ? ) OR \
                                ( start < ? AND end > ? ) ORDER BY gene_name", 
                                seg_start, seg_end, seg_start, seg_end, seg_start, seg_end)

        for g in query.cursor.fetchall():
            genes.append(g[0])

    return jsonify({'genes': genes})
    
#
# segments for a gene
#
@app.route('/gene/<name>/data/structure/<structureid>')
def SegmentsForGene(name, structureid):
    # find all genes that intersect with this segment
    conn = db_connect.connect()
    query = conn.execute("SELECT start, end FROM genes WHERE gene_name == ?", name)
    results = query.cursor.fetchone()

    # if the query returns nothing, we return an empty list
    segments = []

    if (results != None) :
        g_start = results[0]
        g_end   = results[1]

        query = conn.execute("SELECT segid from structure WHERE structureid = ? AND \
                                  ( ( startid BETWEEN ? AND ? ) OR ( endid BETWEEN ? AND ? ) OR \
                                    ( startid > ? AND endid < ? ) OR ( startid < ? AND endid > ? ) ) ORDER BY segid", 
                                  structureid, g_start, g_end, g_start, g_end, g_start, g_end, g_start, g_end)
        for b in query.cursor.fetchall():
            segments.append(b[0])
    else:
        print("SegmentsForGene did not find gene: ({})".format(name))

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
        data = [0, 1, 2, 3, 4, 5, 6]

    return jsonify({'data': list(data)})


#
# activate
#
if __name__ == '__main__':
    import argparse

    # Add routes for serving static files
    @app.route('/')
    def home():
        return app.send_static_file('index.html')

    @app.route('/<path:path>')
    def root(path):
        return app.send_static_file(path)

    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description="gtkserver.py: GTK Testing Server"
    )

    parser.add_argument('-p', '--port', default="8000", help="Server port")
    parser.add_argument('--host', default="127.0.0.1", help="Server bind address")

    parser.add_argument(
        '-d', '--database', default=DB_PATH, metavar="PATH",
        help="Custom path to project database"
    )

    parser.add_argument(
        '--project', default=PROJECT_HOME, metavar="PATH",
        help="Custom path to project directory"
    )

    args = parser.parse_args()

    DB_PATH      = path.abspath(args.database)
    PROJECT_HOME = path.abspath(args.project)

    # cd to server directory
    chdir( path.dirname(__file__) )

    db_connect = create_engine('sqlite:///'+DB_PATH)

    app.run(host=args.host, port=args.port)

