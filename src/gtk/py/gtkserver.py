import bbi
import yaml
import sys
import numpy

from math import nan

from flask import Flask, request, jsonify, render_template, url_for
from flask_restful import Resource, Api
from sqlalchemy import create_engine
# from json import dumps
import json

data = {}
if len(sys.argv) == 2:
    with open(sys.argv[1], 'r') as settings:
        data = yaml.load(settings, Loader=yaml.FullLoader)
else:
    print("ERROR: must include settings file")
    exit(0)

#
# print out the settings
#
print("Settings:")
for key in data:
    print("{}: {}".format(key, data[key]))
print("")

#
# initialize
#
PROJECT_HOME = data["project_home"] 
db_connect = create_engine(data["db_connect"])
app = Flask(__name__)
api = Api(app)

# ------------------------------------------------------------------------------------------------
# CALLS TO BE DEPRICATED (I THINK)
# ------------------------------------------------------------------------------------------------

@app.route('/segepi/<identifier>/<state>')
def SegmentEpigeneticsData(identifier, state):
    conn = db_connect.connect()
    query = conn.execute("SELECT {} FROM segepigenetics WHERE state == ? ORDER BY id".format(identifier), state)
    data = []
    for b in query.cursor.fetchall():
        data.append(b[0])

    return jsonify({'data': data})


# ------------------------------------------------------------------------------------------------
# UPDATED CALLS
# ------------------------------------------------------------------------------------------------

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
                    "url"   : "",
                    "values": []
                }
            }

    if (len(results) != 0):
        fname = PROJECT_HOME + "/" + results[0][0]

        with open(fname, "r") as jfile:
            array = json.load(jfile)

    return array

#
# default index path
#
@app.route('/')
def home():
    return app.send_static_file('index.html')

#
# default path
#
@app.route('/<path:path>')
def root(path):
    return app.send_static_file(path)

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
# return a data array defined on the segments 
#
@app.route('/data/array/<arrayID>/<arraySlice>')
def GetArray(arrayID, arraySlice):
    array = get_array_metadata(arrayID)

    sliceID = "arr_{}".format(arraySlice)
    if (array['data']['url'] != ""):
        values = numpy.load(PROJECT_HOME + "/" + array["data"]["url"])
        array["data"]["values"] = values[sliceID].tolist() 

    return array

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

        numpy.savez_compressed(arrayfname, data=data["array"])

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
    g_start = results[0]
    g_end   = results[1]

    # print("gene   : {}".format(name))
    # print("  start: {}".format(g_start))
    # print("  end  : {}".format(g_end))

    #
    # query-based solution
    #
    query = conn.execute("SELECT segid from structure WHERE structureid = ? AND \
                              ( ( startid BETWEEN ? AND ? ) OR ( endid BETWEEN ? AND ? ) OR \
                                ( startid > ? AND endid < ? ) OR ( startid < ? AND endid > ? ) ) ORDER BY segid", 
                              structureid, g_start, g_end, g_start, g_end, g_start, g_end, g_start, g_end)
    segments = []
    for b in query.cursor.fetchall():
        segments.append(b[0])

    return jsonify({'segments': segments})

#
# sample an array
#
@app.route('/data/samplearray/<arrayID>/<begin>/<end>/<numsamples>')
def SampleArray(arrayID, begin, end, numsamples):
    array = get_array_metadata(arrayID)

    if ( array['type'] == 'sequence' ): 
        data = bbi.fetch(PROJECT_HOME + "/" + array['data']['url'], array['data']['chrom'], int(begin), int(end), int(numsamples))
        # labels = [None] * numsamples
        # labels[0]  = begin
        # labels[-1] = end

    return jsonify({'data': list(data)})


#
# activate
#
if __name__ == '__main__':
     app.run(host=data["host"], port=data["port"])

