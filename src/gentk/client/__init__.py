import json
import sys
from pypac import PACSession

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
        # respect local proxy settings
        session = PACSession()

        # get the data from the server
        response = session.get('{}:{}/data/structure/{}/segments'.format(self.url, self.port, sid))
        jdata = json.loads(response.text)

        return jdata

    def get_genes(self):
        # respect local proxy settings
        session = PACSession()

        # get the data from the server
        response = session.get('{}:{}/genes'.format(self.url, self.port))
        jdata = json.loads(response.text)

        return jdata

    def get_genes_for_segment(self, structureID, segID):
        # respect local proxy settings
        session = PACSession()

        # get the data from the server
        response = session.get('{}:{}/data/structure/{}/segment/{}/genes'.format(self.url, self.port, structureID, segID))
        jdata = json.loads(response.text)

        return jdata
