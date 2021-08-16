import json
import sys
import requests

class client:

    def __init__(self, url, port):
        self.port = port
        self.url  = url
        self.project = ""

    @property
    def project(self):
        return self._project

    @project.setter
    def project(self, value):
        self._project = value

    @property
    def url(self):
        return self._url

    @url.setter
    def url(self, value):
        self._url = value

    @property
    def port(self):
        return self._port

    @port.setter
    def port(self, value):
        self._port = value

    def get_structure(self, sid):
        response = requests.get('{}:{}/data/structure/{}/segments'.format(self.url, self.port, sid)) 
        jdata = json.loads(response.text)

        return jdata

    def get_genes(self):
        response = requests.get('{}:{}/genes'.format(self.url, self.port)) 
        jdata = json.loads(response.text)

        return jdata

    def get_genes_for_segment(self, structureID, segID):
        # get the data from the server
        response = requests.get('{}:{}/data/structure/{}/segment/{}/genes'.format(self.url, self.port, structureID, segID))
        jdata = json.loads(response.text)

        return jdata

    def get_segments_for_genes(self, structureID, gene):
        # get the data from the server
        response = requests.get('{}:{}/genes/{}/data/structure/{}'.format(self.url, self.port, gene, structureID))
        jdata = json.loads(response.text)

        return jdata

    def get_structure_arrays(self):
        return self.get_arrays('structure')

    def get_sequence_arrays(self):
        return self.get_arrays('sequence')

    def get_arrays(self, atype):
        response = requests.get('{}:{}/data/arrays/{}'.format(self.url, self.port, atype))
        jdata = json.loads(response.text)

        return jdata

    def get_array(self, arrayID, arraySlice):
        # get the data from the server
        response = requests.get('{}:{}/data/array/{}/{}'.format(self.url, self.port, arrayID, arraySlice))
        jdata = json.loads(response.text)

        return jdata

    def get_contactmap(self, cmID):
        # get the data from the server
        response = requests.get('{}:{}/data/contact-map/{}'.format(self.url, self.port, cmID))
        jdata = json.loads(response.text)

        return jdata

    def set_array(self, array, params):
        # send the data to the server
        data = params
        data["array"] = array
        response = requests.post('{}:{}/data/setarray'.format(self.url, self.port), json=data)
        jdata = json.loads(response.text)

        return jdata["id"]

    def get_sampled_array(self, arrayID, arraySlice, begin, end, numsamples ):
        # get the data from the server
        response = requests.get('{}:{}/data/samplearray/{}/{}/{}/{}/{}'.format(self.url, self.port, arrayID, arraySlice, begin, end, numsamples))
        jdata = json.loads(response.text)

        return jdata

    def get_segment_ids(self, sid ):
        response = requests.get('{}:{}/data/structure/{}/segmentids'.format(self.url, self.port, sid)) 
        jdata = json.loads(response.text)

        return jdata

    def get_dataset_ids(self):
        response = requests.get('{}:{}/datasets'.format(self.url, self.port)) 
        jdata = json.loads(response.text)

        return jdata
