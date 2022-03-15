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
            "point" : [0,0,0]
        }
    }
}
let struct = new Structure(s);

alert("Made a structure");

let viewer = new Viewer(0);
alert("Made a viewer");
