# The Project

```
projectname/
    source/
        annotations.csv (optional)
    generated/          (generated during project make/release)

```

# annotations.csv

This is a csv file that the user can use to add annotations to the browser.

The format is at least four columns: `name,start,end,type`. Additional columns can be added after these four, and they are ignored by the system.


```
name,start,end,type
gene1-2,380000,420000,gene
gene2-3,760000,840000,gene
gene6,2200000,2300000,gene
gene10-11,3800000,4200000,gene
```
