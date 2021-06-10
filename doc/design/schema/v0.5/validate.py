import jsonschema
import json

with open("schema.json", "r") as sfile:
    schema = json.load(sfile)


with open("project.json", "r") as pfile:
    pdata = json.load(pfile) 

jsonschema.validate( pdata, schema )

