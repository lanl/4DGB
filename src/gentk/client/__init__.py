import json
import sys
from pypac import PACSession

class client:

    def __init__(self, url, port):
        self.port = port
        self.url  = url

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
        # print("sid: {}".format(sid))
        response = session.get('{}:{}/data/structure/{}/segments'.format(self.url, self.port, sid))
        # print(response.text)
        jdata = json.loads(response.text)

        return jdata
