import bbi
import yaml
import sys

from math import nan

from flask import Flask, request, jsonify, render_template, url_for
from flask_restful import Resource, Api
from sqlalchemy import create_engine
from json import dumps

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

#
#
#

@app.route('/segepi/<identifier>/<state>')
def SegmentEpigeneticsData(identifier, state):
    conn = db_connect.connect()
    query = conn.execute("SELECT {} FROM segepigenetics WHERE state == ? ORDER BY id".format(identifier), state)
    data = []
    for b in query.cursor.fetchall():
        data.append(b[0])

    return jsonify({'data': data})

@app.route('/bbi/<state>/<ID>/<chrom>/<begin>/<end>')
def BBIQuery(state, ID, chrom, begin, end):
    conn = db_connect.connect()
    query = conn.execute("SELECT file FROM datafiles WHERE state == ? AND type == ? AND ID == ?", state, "epigenetics", ID)
    results = query.cursor.fetchone()
    # TODO: update so query returns the entire value
    fname = PROJECT_HOME + "/" + results[0]
    # print("BBI file queried: {}".format(fname))

    numbins = 100
    data = bbi.fetch(fname, chrom, int(begin), int(end), numbins)
    labels = [None] * numbins
    labels[0]  = begin
    labels[-1] = end

    return jsonify({'labels': labels, 'series': list(data)})

# ------------------------------------------------------------------------------------------------
# UPDATED CALLS
# ------------------------------------------------------------------------------------------------

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
# return the epigenetics data for a segment
#
@app.route('/data/epigenetics/<identifier>')
def EpigeneticsSegmentValues(identifier):
    conn  = db_connect.connect()
    query = conn.execute("SELECT segid, \"{}\" FROM epigenetics WHERE \"{}\" IS NOT Null ORDER BY segid".format(identifier, identifier))
    data  = []
    for b in query.cursor.fetchall():
        data.append({ 
                        'segment' : int(b[0]),
                        'value' : float(b[1])
                    })

    return jsonify({ 'epigenetics': data })

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
    results = query.cursor.fetchone()
    b_start = results[0]
    b_end   = results[1]

    query = conn.execute("SELECT gene_name from genes WHERE \
                              ( start BETWEEN ? AND ? ) OR ( end BETWEEN ? AND ? ) OR \
                              ( start < ? AND end > ? ) ORDER BY gene_name", 
                              b_start, b_end, b_start, b_end, b_start, b_end)
    genes = []
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
# activate
#
if __name__ == '__main__':
     app.run(host=data["host"], port=data["port"])

