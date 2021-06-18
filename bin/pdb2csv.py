import re

# geom   = "projects/v0.4/source/0/chrXa.pdb"
# values = "projects/v0.4/source/0/K27_Binned_D0_adjusted.csv"

geom   = "projects/v0.4/source/1/chrXi.pdb"
values = "projects/v0.4/source/1/K27_Binned_D7_adjusted.csv"

outdata = []
with open(geom, 'r') as gdata:
    for l in gdata:
        if l.startswith("ATOM"): 
            v = re.split(r'\s+', l[26:]) 
            outdata.append( [ float(v[1]), float(v[2]), float(v[3]) ] )

id = 0
with open(values, 'r') as vdata:
    for l in vdata:
        outdata[id].append( float(l.strip()) ) 
        id = id + 1

print("x,y,z,value")
for item in outdata:
    print("{},{},{},{}".format(item[0], item[1], item[2], item[3]))
