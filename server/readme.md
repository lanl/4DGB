# HTTP Query interface

## segments in a structure 
```
Query:
    \<url\>/data/structure/\<ID>\/segments 

Return:
    This returns a list of segments, with the following format:

{
  "data": [
    [segment data],
    [segment data],
    ...
    [segment data]
  ]
}

Each segment has the following structure: 

    [
        'segid'   : int,
        'start'   : [float, float, float],
        'end'     : [float, float, float],
        'length'  : int,
        'startid' : int
    ]
```

## genes on a segment
```
Query:
    \<url\>/data/structure/<ID>/segment/<segment ID>/genes

Returns:
{
  "genes": [ "gene name", "gene name", ... ]
}
```

