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
- **get_arrays(type)** Get a list of all arrays from the server. The list is made of key, value pairs (see below).
```
    Example:
    arrays = client.get_arrays()

    return value has the following structure:
    [
        {
            'id': int,
            'name': string,
            'type': string
        },
        {
            'id': int,
            'name': string,
            'type': string
        },
        ,,,
    ]
``` 
- **get_contactmap(mapID)** Get a contact map data structure.
- **get_dataset_ids()** Get the IDS for the datasets.
- **get_gene_metadata(gene)** Get metadata for a gene. 
- **get_genes()** Get the list of genes for a project.
- **get_genes_for_locations(structureID, locations)** Get genes for a list of locations.
- **get_genes_for_segment(structureID, segID)** Get a list of genes for a structure's segment.
- **get_project_interval()** Get the project interval.
- **get_sampled_array(arrayID, arraySlice, begin, end, numsamples )** Get sampled data from an array.
- **get_segment_ids(structureID)** Return a list of segment IDs for a structure. 
- **get_segments_for_gene(structureID, gene)** Get a list of structure segments that a gene intersects.
- **get_sequence_arrays()** Get a list of sequence arrays from the server. The list is made of key, value pairs (see below).
- **get_structure(structureID)** Get a structure. Return value is a list of segments. 
- **get_structure_arrays()** Get a list of structure arrays from the server. The list is made of key, value pairs (see below).
- **get_structure_unmapped_segments(structureID)** Get an array of [0,1] values that indicate the mapped/unmapped state of each segment for a structure. 
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
