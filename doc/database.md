---
author:         David H. Rogers
title:          4DGB Tables
date:           Sept, 2021
aspectratio:    169
theme:          Frankfurt
toc:            false
---

## Tables 

- gtk 

| version |
|---------|
| text    |

- project 

| name | title | num_segments |
|------|-------|--------------|
| text | text  | int          |

## Tables (cont'd)

- datasets 

| ID | name | epigenetics | structure | 
|----|------|-------------|-----------|
|text| text | text        | text      | 

- structure

|structureid| segid | startid | endid | length | startx | starty | startz | 
|-----------|-------|---------|-------|--------|--------|--------|--------|
| int       | int   | int     | int   | int    | real   | real   | real   |

| endx | endy | endz | centerx | centery | centerz | 
|------|------|------|---------|---------|---------|
| real | real | real | real    | real    | real    |

## Tables (cont'd)

- array

| id  | name | type | min | max | url | 
|-----|------|------|-----|-----|-----|
| int | text | text | real| real| text|

- contact

| mapid  | x | y | value |
|--------|---|---|-------|
| int    |int|int| real  |

## Tables (cont'd)

- genes

| id (key) | start | end | length | gID | gene_type | gene_name |
|----------|-------|-----|--------|-----|-----------|-----------|
| integer  | int   | int | int    |text | text      | text      | 

