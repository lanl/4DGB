This is a python toolkit for the 4D Genome Browser project. It includes a client, algorithms and datastructures for accessing a **4DGenomeBrowser** database.


## Creating an instance of a client
The main way to interact with the database is to create a client, then make calls through the client to the database hosted at the server. The server is defined by its url and port. 

```
    import gentk

    # provide the URL and port when creating an instance
    client = gentk.client.client("http://127.0.0.1", "8000")

    # set the project
    client.project = "test.00"
```

## API
- **set_array(array, metadata)** Set a new array on the server. Returns the id of the new array (integer)

```
    Example:
    metadata = {
                    "name": "test array", 
                    "type": "structure", 
                    "datatype": "int", 
                    "datadim": 1
                 }
   id = client.set_array([0, 1, 2, 3, 4], metadata)
```
- **get_array(arrayID)** Get an array from the server. Returns a json object.
```
    Example:

    result = client.get_array(id)

    return value has the following structure:
    {
        'name' : string,
        'type' : string,
        'version' : string (version of the array format)
        'data' {
            'type': string,
            'dim' : int,
            'values' : python data array
        }
    }

```
- **get_contactmap(mapID)** Get a contact map data structure.
- **get_genes()** Get the list of genes for a project.
- **get_genes_for_segment(structureID, segID)** Get a list of genes for a structure's segment.
- **get_segments_for_gene(structureID, gene)** Get a list of structure segments that a gene intersects.
- **get_structure(structureID)** Get a structure. Return value is a list of segments. 
```
    Example:

    structure = client.get_structure(id)

    return value has the following structure, which is a list of segments:
    [
        {
            'end'       : list of three floats,
            'length'    : int; length of segment,
            'segid'     : int,
            'start'     : list of three floats,
            'startid'   : int; start ID in the sequence
        },
        ...
    ]
```

Copyright (c) 2021 Los Alamos National Laboratory
