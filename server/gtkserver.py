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

app = Flask(__name__)
api = Api(app)

#
# get project information by projectID
#
def get_project_info(projectID):
    PROJECT_HOME = path.abspath(
        path.join( path.dirname(__file__), 'static', projectID, 'project')
    )

    PROJECT_FILE = path.join( PROJECT_HOME, 'project.json' )

    DB_PATH = path.abspath(
        path.join( PROJECT_HOME, 'generated', 'generated-project.db')
    )

    return {"projectHome": PROJECT_HOME, "projectFile": PROJECT_FILE, "dbPath": DB_PATH}

#
# get the interval of the datasets for this project
# TODO: generalize the storage and retrieval of this data
#
def get_dataset_interval(projectID):

    interval = 0
    with open(get_project_info(projectID)['projectFile'], 'r', encoding="utf-8" ) as pfile:
        data = json.load(pfile)

        interval = data["project"]["interval"]

    return interval

def get_dataset_ids(projectID):
    datasets = []
    with open(get_project_info(projectID)['projectFile'], 'r', encoding="utf-8" ) as pfile:
        data = json.load(pfile)

        for d in data["datasets"]:
            datasets.append(d['id'])
    datasets.sort()

    return datasets


def get_array_metadata(arrayID, projectID):
    projectInfo = get_project_info(projectID)
    db_connect = create_engine('sqlite:///'+projectInfo['dbPath'])
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
        fname = projectInfo['projectHome'] + "/" + results[0][0]

        with open(fname, "r", encoding="utf-8" ) as jfile:
            array = json.load(jfile)

    return array

#
# get the array data for an ID
#
def load_array_data(arrayID, arraySlice, projectID):
    array = get_array_metadata(arrayID, projectID)

    if (array['type'] != None):
        # determine if there is data there
        info = array['data']['values'][int(arraySlice)]
        if (info['url'] != ""):
            # load the data from disk
            data = numpy.load(get_project_info(projectID)['projectHome'] + "/" + info['url'])
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
    return 'API server on!'

@app.route('/<path:path>')
def root(path):
    return send_from_directory('static', path)

@app.route('/project/project.json')
def project():
    projectID = request.headers.get('projectID')
    return send_file(get_project_info(projectID)['projectFile'])

@app.route('/project/<path:path>')
def projectdir(path):
    projectID = request.headers.get('projectID')
    
    return send_from_directory(get_project_info(projectID)['projectHome'], path)

#
# return a list of the variables available
#
@app.route('/data/arrays/<atype>')
def GetArrays(atype):
    projectID = request.headers.get('projectID')

    db_connect = create_engine('sqlite:///'+get_project_info(projectID)['dbPath'])
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
    projectID = request.headers.get('projectID')

    return jsonify(get_dataset_ids(projectID))

#
# return a data array defined on the segments 
#
@app.route('/data/array/<arrayID>/<arraySlice>')
def GetArray(arrayID, arraySlice):
    projectID = request.headers.get('projectID')
    array = load_array_data(arrayID, arraySlice, projectID)

    return jsonify(array)

#
# set a data array
#
@app.route('/data/setarray', methods=['POST'])
def SetArray():
    results = {}
    if (request.method == "POST"):
        # get the next IR
        projectID = request.headers.get('projectID')
        projectInfo = get_project_info(projectID)

        db_connect = create_engine('sqlite:///'+projectInfo['dbPath'])
        conn  = db_connect.connect()
        query = conn.execute("SELECT COUNT(*) FROM array")
        results = query.cursor.fetchall()
        arrayID = results[0][0]
        fid         = '{:04d}'.format(arrayID)
        fname       = 'source/array/{}.json'.format(fid) 
        fullname    = '{}/{}'.format(projectInfo['projectHome'], fname)
        aname       = 'source/array/{}.npz'.format(fid) 
        arrayfname  = '{}/{}'.format(projectInfo['projectHome'], aname) 

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
            jfile.write("    \"values\" : [\n")
            firstTime = True;
            for d in get_dataset_ids(projectID):
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
        for d in get_dataset_ids(projectID):
            kwargs["arr_{}".format(d)] = data["array"]

        numpy.savez_compressed(arrayfname, **kwargs) 

    results = {'id': arrayID}        
    return jsonify(results)

#
# return the segments of a structure
#
@app.route('/data/structure/<identifier>/unmapped')
def UnmappedData(identifier):
    projectID = request.headers.get('projectID')

    db_connect = create_engine('sqlite:///'+get_project_info(projectID)['dbPath'])
    conn    = db_connect.connect()
    query   = conn.execute("SELECT num_segments,unmapped FROM structure_metadata WHERE id == {}".format(identifier))
    results = query.cursor.fetchone()

    print("results: {}".format(results))
    if (results[1] != []) :
        print("YES")
    else:
        print("NO")

    num_elements = results[0]
    # we are creating a 1-based array
    data = numpy.zeros(num_elements + 1)

    # get rid of white space
    elem = results[1].replace(" ", "")
    # get rid of first and last brackets
    elem = elem[1:]
    elem = elem[:-1]
    # if there are elements here, expand them
    if len(elem) > 0:
        for e in elem.split("],["):
            e = e.replace("]", "")
            e = e.replace("[", "")

            nums = e.split(",")
            for i in range(int(nums[0]), int(nums[1]) + 1):
                data[i] = 1

    # remove the 0th element
    final = numpy.delete(data, 0)

    return jsonify({ 'unmapped': list(final) })


#
# return the segments of a structure
#
@app.route('/data/structure/<identifier>/segments')
def SegmentData(identifier):
    projectID = request.headers.get('projectID')

    db_connect = create_engine('sqlite:///'+get_project_info(projectID)['dbPath'])
    conn    = db_connect.connect()
    query   = conn.execute("SELECT segid, startid, endid, length, startx, starty, startz, endx, endy, endz FROM structure WHERE structureid == {} ORDER BY segid".format(identifier))
    data    = []
    lengths = []
    for b in query.cursor.fetchall():
        data.append({ 
                        'segid'  : int(b[0]),
                        'startid': int(b[1]),
                        'endid'  : int(b[2]),
                        'length' : int(b[3]),
                        'start'  : [float(b[4]), float(b[5]), float(b[6])],
                        'end'    : [float(b[7]), float(b[8]), float(b[9])],
                    })

    return jsonify({ 'segments': data })

#
# return the segments of a structure
#
@app.route('/data/structure/<identifier>/segmentids')
def SegmentIds(identifier):
    projectID = request.headers.get('projectID')

    db_connect = create_engine('sqlite:///'+get_project_info(projectID)['dbPath'])
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
    projectID = request.headers.get('projectID')

    db_connect = create_engine('sqlite:///'+get_project_info(projectID)['dbPath'])
    conn    = db_connect.connect()
    query   = conn.execute("SELECT x, y, value FROM contactmap WHERE id == ?", [identifier])
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
@app.route('/project/interval')
def ProjectInterval():
    projectID = request.headers.get('projectID')

    return jsonify(get_dataset_interval(projectID))

#
# get all genes in a project
#
@app.route('/genes')
def Genes():
    # return all genes
    projectID = request.headers.get('projectID')

    db_connect = create_engine('sqlite:///'+get_project_info(projectID)['dbPath'])
    conn = db_connect.connect()

    query = conn.execute("SELECT DISTINCT gene_name from genes ORDER BY gene_name")
    genes = []
    for g in query.cursor.fetchall():
        genes.append(g[0])

    return jsonify({'genes': genes})

#
# get metadata for a gene 
#
@app.route('/gene/<name>')
def GetGeneMetadata(name):
    # return all genes
    projectID = request.headers.get('projectID')

    db_connect = create_engine('sqlite:///'+get_project_info(projectID)['dbPath'])
    conn = db_connect.connect()

    query = conn.execute("SELECT start,end,length,gene_type,gene_name from genes WHERE gene_name = ?", name)
    results = query.cursor.fetchone()

    # initialize
    data = {
            "start"     : None, 
            "end"       : None,
            "length"    : None,
            "gene_type" : None,
            "gene_name" : None
            }

    # get data if it exists
    if (results != None) :
        data = {
                "start"     : results[0],
                "end"       : results[1],
                "length"    : results[2],
                "gene_type" : results[3],
                "gene_name" : results[4]
                }


    return jsonify(data)

#
# genes for a list of segments or segment ranges
#
@app.route('/data/structure/<structureid>/segment/<segmentids>/genes')
def GenesForSegments(structureid, segmentids):
    # if the query returns nothing, we return an empty list
    genes = []

    # find all genes that intersect with the segments
    projectID = request.headers.get('projectID')

    db_connect = create_engine('sqlite:///'+get_project_info(projectID)['dbPath'])
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
            query   = conn.execute("SELECT startid, endid FROM structure WHERE structureid = ? AND segid = ?", structureid, match.group('start'))
            results = query.cursor.fetchall()
            if (len(results) != 0):
                seg_start = results[0][0]

                # get the end
            query   = conn.execute("SELECT startid, endid FROM structure WHERE structureid = ? AND segid = ?", structureid, match.group('end'))
            results = query.cursor.fetchall()

            if (len(results) != 0):
                seg_end = results[0][1]
        else:
            # find all genes that intersect with these segments 
            query   = conn.execute("SELECT startid, endid FROM structure WHERE structureid = ? AND segid = ?", structureid, s)
            results = query.cursor.fetchall()

            # query and create a list of genes 
            if (len(results) != 0):
                seg_start = results[0][0]
                seg_end   = results[0][1]

            else:
                print("ERROR! no segment found for: {}, {}".format(structureid, s))

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
@app.route('/data/structure/<structureid>/locations/<locations>/genes')
def GenesForLocations(structureid, locations):
    # if the query returns nothing, we return an empty list
    genes = []

    # find all genes that intersect with the segments
    projectID = request.headers.get('projectID')

    db_connect = create_engine('sqlite:///'+get_project_info(projectID)['dbPath'])
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
@app.route('/genes/<names>/data/structure/<structureid>')
def SegmentsForGene(names, structureid):
    # if the query returns nothing, we return an empty list
    segments = []

    # find all genes that intersect with the segments
    projectID = request.headers.get('projectID')

    db_connect = create_engine('sqlite:///'+get_project_info(projectID)['dbPath'])
    conn = db_connect.connect()
    snames = names.split(',')

    for s in snames:
        query = conn.execute("SELECT start, end FROM genes WHERE gene_name == ?", s)
        results = query.cursor.fetchone()

        if (results != None) :
            g_start = results[0]
            g_end   = results[1]
            # print("start: {}".format(g_start))
            # print("end: {}".format(g_end))

            query = conn.execute("SELECT segid from structure WHERE structureid = ? AND \
                                      ( ( startid BETWEEN ? AND ? ) OR ( endid BETWEEN ? AND ? ) OR \
                                        ( startid < ? AND endid > ? ) ) ORDER BY segid", 
                                      structureid, g_start, g_end, g_start, g_end, g_start, g_end)
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
    projectID = request.headers.get('projectID')
    array = get_array_metadata(arrayID, projectID)

    data = []
    if ( 'sequence' in array['data']['values'][int(arraySlice)] ):
        # there is a sequence array
        
        adata = array['data']['values'][int(arraySlice)]
        url = "{}/{}".format(get_project_info(projectID)['projectHome'], adata['sequence']['url'])
        data = bbi.fetch(url, adata['sequence']['chrom'], int(begin), int(end), int(numsamples))
    else:
        # there is a sequence array
        array = load_array_data(arrayID, arraySlice, projectID)
        interval = get_dataset_interval(projectID)
        sid = int(int(begin)/interval)
            # add one, to include the final element we want
        eid = int(int(end)/interval) + 1
        data = array['data']['values'][sid:eid]

    return jsonify({'data': list(data)})

#
# helper function to query genes for a location range
#
def getGenesForLocationRange( start, end ):
    projectID = request.headers.get('projectID')

    db_connect = create_engine('sqlite:///'+get_project_info(projectID)['dbPath'])
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

    args = parser.parse_args()

    app.run(host=args.host, port=args.port, debug=False)

