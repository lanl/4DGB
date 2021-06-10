# Data Model

## Project

Overall, the dataset is focused on an *annotated genome*, which is a sequence of base pairs and a set of annotation data. The specification is as follows:

```
project
    name
    notes
data
    sequence
        sequence
        sequence-annotations
            zero or more sets of sequence annotations
    time-based data
        epigenetics
            zero or more sets of epigenetics data for a specific sequence and state
        geometry
            zero or more collections of geometry data for a specific state, which consists of:
                a geometry file (.pdb file)
                a contact map (.dat file), used as input to LAMMPS to create the geometry
```

- annotated sequence  
    - A sequence. This is an externally curated dataset that changes slowly over time, as new refinements are added. In our project, a sequence is defined by:
        - a single fasta data file, at a specific version
    - Annotations on the sequence, which is a single collection of annotations. A single annotation is defined as a collection of information associated with a single contiguous set of base pairs. This set of annotations is defined in our project by:
        - one or more gff3 files
        - possible additional annotations in a text-only `.csv` file (see example below)
- Slice (1 to n per project)
    - Epigenetics Tracks
        - One or more epigenetics dataset
            - bigwig files
    - Geometry
        - One or more geometry files
            - pdb file
            - points to one contact map (input to LAMMPS sim)
        - One or more contact maps (at least one for each pdb file)
            - dat files

## Sequence Annotations file format
This is a text-based `.csv` file that includes at least three columns, and others that are ignored by this specification.

```
annotation-start 1-based ID of base pair at the start of the annotation
annotation-end   1-based ID of base pair at the start of the annotation
annotation-type  the type of the annotation
annotation       the text information of the annotation


annotation-start,annotation-end,annotation-type,annotation
100000,200000,note,This is a note about the sequence
```

This is also a valid annotation file, with two fields that this specification would ignore `[date-created, author]`:

```
annotation-start,annotation-end,date-created,author,annotation-type,annotation
100000,200000,2021-01-25-10:00:00MST,dhr,note,This is an annotation that is entirely text
```

# Questions
- where do HiC datasets go?

