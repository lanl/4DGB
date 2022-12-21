import json
import sys
import requests

class client:

    def __init__(self, url, port, **kwargs):
        self.port = port
        self.url  = url
        self.project = ""
        self.projid  = ""

        self.session = requests.Session()

        if 'auth' in kwargs:
            self.session.auth = tuple(kwargs['auth'].split(':'))

    @property
    def project(self):
        return self._project

    @project.setter
    def project(self, value):
        self._project = value

    @property
    def projid(self):
        return self._projid

    @projid.setter
    def projid(self, value):
        self._projid = value

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

    def _request(self, path):
        if path[0] == '/':
            path = path[1:]
        response = self.session.get(f'{self.url}:{self.port}/{path}')

        return response.json()

    def _postrequest(self, path, payload):
        if path[0] == ('/'):
            path = path[1:]
        response = self.session.post(f'{self.url}:{self.port}/{path}', json=payload)

        return response.json()

    # updated
    def get_project_id(self):
        return self.projid 

    def get_project_interval(self):
        return self._request(f'project/{self.projid}/interval')

    def get_genes(self):
        return self._request(f'genes/{self.projid}')

    def get_gene_metadata(self, gene):
        return self._request(f'genes/meta/{self.projid}/{gene}')

    def get_genes_for_locations(self, structureID, locations):
        return self._request(f'data/structure/{self.projid}/{structureID}/locations/{locations}/genes')

    def get_genes_for_segments(self, structureID, segIDs):
        return self._request(f'data/structure/{self.projid}/{structureID}/segment/{segIDs}/genes')

    def get_segments_for_genes(self, structureID, gene):
        return self._request(f'genes/{self.projid}/{gene}/data/structure/{structureID}')

    def get_structure(self, structureID):
        return self._request(f'data/structure/{self.projid}/{structureID}/segments')

    def get_structure_unmapped_segments(self, structureID):
        return self._request(f'data/structure/{self.projid}/{structureID}/unmapped')

    def get_structure_arrays(self):
        return self.get_arrays('structure')

    def get_sequence_arrays(self):
        return self.get_arrays('sequence')

    def get_arrays(self, type):
        return self._request(f'data/{self.projid}/arrays/{type}')

    def get_segment_ids(self, structureID):
        return self._request(f'data/structure/{self.projid}/{structureID}/segmentids')

    def get_array(self, arrayID, arraySlice):
        return self._request(f'data/array/{self.projid}/{arrayID}/{arraySlice}')

    def get_contactmap(self, cmID):
        return self._request(f'data/contact-map/{self.projid}/{cmID}')

    def set_array(self, array, params):
        # send the data to the server
        data = params
        data["array"] = array
        
        response = self._postrequest('data/setarray/{self.projid}', data)
        return response["id"]

    def get_dataset_ids(self):
        return self._request('datasets/{self.projid}')

    def get_sampled_array(self, arrayID, arraySlice, begin, end, numsamples ):
        return self._request(f'data/samplearray/{self.projid}/{arrayID}/{arraySlice}/{begin}/{end}/{numsamples}')

