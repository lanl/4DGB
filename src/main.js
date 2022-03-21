import * as THREE from   '../node_modules/three/build/three.module.js';
import Point from './js/Point.js';
import Segment from './js/Segment.js';
import SegmentGeometry from './js/SegmentGeometry.js';
import Structure from './js/Structure.js';
import StructureGeometry from './js/StructureGeometry.js';
import Viewer from './js/Viewer.js';

let s = {
    "0" : {
        "ID" : 0,
        "start" : {
            "ID": 0,
            "point" : [-1,0,0]
        },
        "end" : {
            "ID": 1,
            "point" : [0,0,0]
        }
    },
    "1" : {
        "ID" : 1,
        "start" : {
            "ID": 1,
            "point" : [0,0,0]
        },
        "end" : {
            "ID": 2,
            "point" : [1,0,0]
        }
    },
    "2" : {
        "ID" : 2,
        "start" : {
            "ID": 2,
            "point" : [1,0,0]
        },
        "end" : {
            "ID": 3,
            "point" : [1,1,0]
        }
    },
    "3" : {
        "ID" : 3,
        "start" : {
            "ID": 3,
            "point" : [1,1,0]
        },
        "end" : {
            "ID": 4,
            "point" : [0,1,0]
        }
    },
    "4" : {
        "ID" : 4,
        "start" : {
            "ID": 4,
            "point" : [0,1,0]
        },
        "end" : {
            "ID": 5,
            "point" : [0,1,1]
        }
    },
    "5" : {
        "ID" : 5,
        "start" : {
            "ID": 5,
            "point" : [0,1,1]
        },
        "end" : {
            "ID": 6,
            "point" : [1,1,1]
        }
    }
}
let struct  = new Structure(s);
let geom    = new StructureGeometry(struct);

let vparams = {
    "renderer" : {
        "clearColor" : 0x555555 
    },
    "camera" : {
        "position": [2, 2, 2],
        "lookAt"  : [0, 0, 0]
    },
    "lights" : [ 
        {
            "type": "ambient",
            "color": 0xaaaaaa
        },
        {
            "type": "directional",
            "color": 0xffffff
        }
    ]
}
let viewer  = new Viewer(vparams);
viewer.add(geom);
viewer.render();
