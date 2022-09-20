import json
import sys

class project:

    def __init__(self, data): 
        self.data = data

    @property
    def name(self):
        return self._name

    @name.setter
    def data(self, value):
        self._name = value

    @property
    def id(self):
        return self._id

    @id.setter
    def data(self, value):
        self._id = value

    @property
    def description(self):
        return self._description

    @description.setter
    def data(self, value):
        self._description = value

    @property
    def interval(self):
        return self._interval

    @interval.setter
    def data(self, value):
        self._interval = value

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

