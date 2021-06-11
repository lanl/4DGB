import json
import sys

class project:

    def __init__(self, data): 
        self.data = data

    @property
    def data(self):
        return self._data

    @data.setter
    def data(self, value):
        self._data = value

    def get_datasets(self):
        return self.data["datasets"]

    def get_dataset(self, ID):
        return [item for item in self.get_datasets() if item.get('id') == ID]

