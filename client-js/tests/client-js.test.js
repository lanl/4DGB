const Client = require('../GTK/Client.js');
var fs = require('fs');

//
// run each of the calls, and produce a file on disc with the output
//
test('client test', () => {
    // test.00
    client = new Client("http://127.0.0.1:8000");

    client.get_structure_arrays( (response) => {
                            expect(response).toStrictEqual({"arrays":[{"id":0,"max":22,"min":1,"name":"increasing int","type":"structure"},{"id":1,"max":22,"min":1,"name":"decreasing int","type":"structure"},{"id":2,"max":320.2,"min":110.1,"name":"increasing float","type":"structure"},{"id":3,"max":320.2,"min":110.1,"name":"decreasing float","type":"structure"},{"id":5,"max":2,"min":1,"name":"two domain","type":"structure"},{"id":6,"max":3,"min":1,"name":"three domain","type":"structure"},{"id":7,"max":0.3,"min":0,"name":"sampled H3K27me3","type":"structure"}]});
                        });

    client.get_sequence_arrays( (response) => {
                            expect(response).toStrictEqual({"arrays":[{"id":4,"max":1,"min":0,"name":"H3K27me3","type":"sequence"}]});
                        });

    client.get_arrays( (response) => {
                            expect(response).toStrictEqual({"arrays":[{"id":0,"max":22,"min":1,"name":"increasing int","type":"structure"},{"id":1,"max":22,"min":1,"name":"decreasing int","type":"structure"},{"id":2,"max":320.2,"min":110.1,"name":"increasing float","type":"structure"},{"id":3,"max":320.2,"min":110.1,"name":"decreasing float","type":"structure"},{"id":5,"max":2,"min":1,"name":"two domain","type":"structure"},{"id":6,"max":3,"min":1,"name":"three domain","type":"structure"},{"id":7,"max":0.3,"min":0,"name":"sampled H3K27me3","type":"structure"}]});
                        }, 'structure');

    client.get_array( (response) => {
                            expect(response).toStrictEqual({"data":{"dim":1,"max":22,"min":1,"type":"int","values":[1,2,3,4,5,6,7,8,9,10,11]},"name":"increasing int","tags":[],"type":"structure","version":"0.1"});
                        }, 0, 0);

    client.get_genes_for_segments( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f23","Btbd35f24"]});
                        }, 0, 8);

    // list of single values (7,8,9)
    client.get_genes_for_segments( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f11","Btbd35f23","Btbd35f24"]});
                        }, 0, "7,8,9");

    // single range value (7-9)
    client.get_genes_for_segments( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f11","Btbd35f23","Btbd35f24"]});
                        }, 0, "7-9");

    // combined list (7,8-10)
    client.get_genes_for_segments( (response) => {
                            expect(response).toStrictEqual({"genes": ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3','gene10-11']});
                        }, 0, "7,8-10");

    // list of single values (7,8,9)
    client.get_genes_for_locations( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f11","Btbd35f23","Btbd35f24"]});
                        }, 0, "2400000-2800000,2800000-3200000,3200000-3600000");

    // single range value (7-9)
    client.get_genes_for_locations( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f11","Btbd35f23","Btbd35f24"]});
                        }, 0, "2400000-3600000");

    // combined list (7,8-10)
    client.get_genes_for_locations( (response) => {
                            expect(response).toStrictEqual({"genes": ['Btbd35f10','Btbd35f11','Btbd35f16','Btbd35f18','Btbd35f23','Btbd35f24','Btbd35f3','gene10-11']});
                        }, 0, "2400000-2800000,2800000-4000000");

    client.get_genes_for_locations( (response) => {
                            expect(response).toStrictEqual({"genes":["Btbd35f11","Btbd35f23","Btbd35f24"]});
                        }, 0, "2400000-3600000");

    client.get_segments_for_genes( (response) => {
                            expect(response).toStrictEqual({"segments":[8]});
                        }, 0, "Btbd35f23");

    client.get_structure( (response) => {
                            expect(response).toStrictEqual({"segments":[{"end":[0,0,0],"length":400000,"segid":1,"start":[-1,0,0],"startid":0},{"end":[1,0,0],"length":400000,"segid":2,"start":[0,0,0],"startid":400000},{"end":[2,0,0],"length":400000,"segid":3,"start":[1,0,0],"startid":800000},{"end":[2,1,0],"length":400000,"segid":4,"start":[2,0,0],"startid":1200000},{"end":[2,2,0],"length":400000,"segid":5,"start":[2,1,0],"startid":1600000},{"end":[1,2,0],"length":400000,"segid":6,"start":[2,2,0],"startid":2000000},{"end":[0,2,0],"length":400000,"segid":7,"start":[1,2,0],"startid":2400000},{"end":[0,1,0],"length":400000,"segid":8,"start":[0,2,0],"startid":2800000},{"end":[0,0,0],"length":400000,"segid":9,"start":[0,1,0],"startid":3200000},{"end":[0,0,1],"length":400000,"segid":10,"start":[0,0,0],"startid":3600000},{"end":[0,0,2],"length":400000,"segid":11,"start":[0,0,1],"startid":4000000}]});
                        }, 0);

    client.get_contactmap( (response) => {
                            expect(response).toStrictEqual({"contacts":[{"value":1.22803363763796,"x":5,"y":8},{"value":1.22803363763796,"x":9,"y":4},{"value":1.22803363763796,"x":6,"y":3},{"value":1.22803363763796,"x":3,"y":8},{"value":2.46410161513775,"x":2,"y":3},{"value":2.46410161513775,"x":1,"y":10},{"value":3.46410161513775,"x":3,"y":3},{"value":2.04988805276466,"x":2,"y":8},{"value":1.22803363763796,"x":4,"y":9},{"value":0.635674490391564,"x":11,"y":3},{"value":1.46410161513775,"x":5,"y":3},{"value":2.04988805276466,"x":6,"y":8},{"value":0.635674490391564,"x":11,"y":7},{"value":2.46410161513775,"x":8,"y":1},{"value":1.46410161513775,"x":7,"y":9},{"value":2.46410161513775,"x":5,"y":6},{"value":1.22803363763796,"x":2,"y":7},{"value":1.46410161513775,"x":9,"y":11},{"value":1.46410161513775,"x":7,"y":5},{"value":2.46410161513775,"x":6,"y":7},{"value":1.22803363763796,"x":3,"y":6},{"value":2.04988805276466,"x":8,"y":10},{"value":2.46410161513775,"x":9,"y":2},{"value":2.46410161513775,"x":4,"y":5},{"value":3.46410161513775,"x":11,"y":11},{"value":3.46410161513775,"x":1,"y":1},{"value":1.22803363763796,"x":11,"y":8},{"value":1.46410161513775,"x":11,"y":9},{"value":1.46410161513775,"x":2,"y":6},{"value":1.46410161513775,"x":5,"y":7},{"value":3.46410161513775,"x":6,"y":6},{"value":0.635674490391564,"x":3,"y":7},{"value":2.04988805276466,"x":2,"y":4},{"value":1.46410161513775,"x":9,"y":3},{"value":2.04988805276466,"x":6,"y":4},{"value":1.22803363763796,"x":4,"y":1},{"value":1.46410161513775,"x":7,"y":1},{"value":2.46410161513775,"x":8,"y":9},{"value":2.46410161513775,"x":10,"y":9},{"value":2.04988805276466,"x":10,"y":8},{"value":2.46410161513775,"x":10,"y":11},{"value":2.46410161513775,"x":5,"y":4},{"value":2.46410161513775,"x":9,"y":8},{"value":2.46410161513775,"x":3,"y":4},{"value":0.635674490391564,"x":1,"y":5},{"value":3.46410161513775,"x":2,"y":2},{"value":1.22803363763796,"x":10,"y":7},{"value":3.46410161513775,"x":1,"y":9},{"value":1.46410161513775,"x":6,"y":2},{"value":1.46410161513775,"x":9,"y":7},{"value":0.464101615137754,"x":6,"y":11},{"value":1.22803363763796,"x":10,"y":3},{"value":1.22803363763796,"x":2,"y":11},{"value":0.635674490391564,"x":3,"y":11},{"value":1.22803363763796,"x":9,"y":6},{"value":1.22803363763796,"x":7,"y":10},{"value":0,"x":5,"y":11},{"value":1.22803363763796,"x":8,"y":5},{"value":1.22803363763796,"x":5,"y":2},{"value":1.01461187235458,"x":4,"y":10},{"value":2.46410161513775,"x":3,"y":2},{"value":0.635674490391564,"x":5,"y":9},{"value":2.46410161513775,"x":10,"y":1},{"value":3.46410161513775,"x":9,"y":1},{"value":1.46410161513775,"x":3,"y":9},{"value":2.46410161513775,"x":4,"y":3},{"value":0.635674490391564,"x":7,"y":3},{"value":1.46410161513775,"x":1,"y":11},{"value":1.46410161513775,"x":8,"y":4},{"value":2.46410161513775,"x":7,"y":8},{"value":2.46410161513775,"x":2,"y":9},{"value":0.464101615137754,"x":11,"y":4},{"value":1.46410161513775,"x":4,"y":8},{"value":2.46410161513775,"x":1,"y":2},{"value":1.22803363763796,"x":6,"y":9},{"value":3.46410161513775,"x":10,"y":10},{"value":1.01461187235458,"x":10,"y":6},{"value":1.22803363763796,"x":2,"y":5},{"value":2.46410161513775,"x":6,"y":5},{"value":3.46410161513775,"x":7,"y":7},{"value":1.22803363763796,"x":4,"y":7},{"value":2.04988805276466,"x":4,"y":6},{"value":2.04988805276466,"x":8,"y":2},{"value":1.22803363763796,"x":11,"y":2},{"value":1.22803363763796,"x":8,"y":11},{"value":3.46410161513775,"x":5,"y":5},{"value":2.46410161513775,"x":9,"y":10},{"value":0.464101615137754,"x":10,"y":5},{"value":1.22803363763796,"x":1,"y":4},{"value":1.46410161513775,"x":3,"y":5},{"value":2.46410161513775,"x":7,"y":6},{"value":2.04988805276466,"x":10,"y":2},{"value":0,"x":11,"y":5},{"value":1.22803363763796,"x":1,"y":6},{"value":3.46410161513775,"x":8,"y":8},{"value":1.22803363763796,"x":7,"y":4},{"value":3.46410161513775,"x":4,"y":4},{"value":1.22803363763796,"x":6,"y":1},{"value":2.46410161513775,"x":2,"y":1},{"value":1.46410161513775,"x":3,"y":1},{"value":3.46410161513775,"x":9,"y":9},{"value":0.635674490391564,"x":5,"y":1},{"value":1.22803363763796,"x":8,"y":3},{"value":1.46410161513775,"x":1,"y":7},{"value":1.01461187235458,"x":10,"y":4},{"value":2.46410161513775,"x":11,"y":10},{"value":1.22803363763796,"x":7,"y":2},{"value":0.464101615137754,"x":11,"y":6},{"value":0.464101615137754,"x":4,"y":11},{"value":0.635674490391564,"x":9,"y":5},{"value":2.04988805276466,"x":4,"y":2},{"value":0.464101615137754,"x":5,"y":10},{"value":0.635674490391564,"x":7,"y":11},{"value":2.04988805276466,"x":8,"y":6},{"value":2.46410161513775,"x":1,"y":8},{"value":1.22803363763796,"x":3,"y":10},{"value":1.46410161513775,"x":1,"y":3},{"value":2.04988805276466,"x":2,"y":10},{"value":1.01461187235458,"x":6,"y":10},{"value":2.46410161513775,"x":8,"y":7},{"value":1.46410161513775,"x":11,"y":1}]});
                        }, 0);

    client.get_genes( (response) => {
                            expect(response).toStrictEqual({"genes":["1600025M17Rik","1700003E24Rik","1700010D01Rik","1700011M02Rik","1700013H16Rik","1700018G05Rik","1700020N15Rik","1700031F05Rik","1700036O09Rik","1700084M14Rik","1700111N16Rik","1700121L16Rik","1810030O07Rik","2010106E10Rik","2010204K13Rik","2010308F09Rik","2610002M06Rik","2810403D21Rik","3010001F23Rik","3632454L22Rik","3830403N18Rik","4921511C20Rik","4930402K13Rik","4930415L06Rik","4930447F04Rik","4930453H23Rik","4930480E11Rik","4930513O06Rik","4930515L19Rik","4930555B12Rik","4930558G05Rik","4930567H17Rik","4930570D08Rik","4930595M18Rik","4931400O07Rik","4932411N23Rik","4932429P05Rik","4933400A11Rik","4933403O08Rik","4933407K13Rik","4933416I08Rik","4933428M09Rik","4933436I01Rik","5330434G04Rik","5430402E10Rik","5530601H04Rik","5730405O15Rik","5730412P04Rik","5S_rRNA","6030498E09Rik","7SK","8030474K03Rik","9530051G07Rik","A230072C01Rik","A230072E10Rik","A630012P03Rik","A730046J19Rik","AU015836","AV320801","Abcb7","Abcd1","Ace2","Acot9","Acsl4","Actrt1","Adgrg2","Adgrg4","Aff2","Agtr2","Aifm1","Akap14","Akap17b","Akap4","Alas2","Alg13","Amelx","Amer1","Ammecr1","Amot","Ap1s2","Apex2","Apln","Apoo","Apool","Ar","Araf","Arhgap36","Arhgap4","Arhgap6","Arhgef6","Arhgef9","Arl13a","Armcx1","Armcx2","Armcx3","Armcx4","Armcx5","Armcx6","Arr3","Arx","Arxes1","Arxes2","Asb11","Asb12","Asb9","Asmt","Astx1a","Astx1b","Astx1c","Astx2","Astx3","Astx4a","Astx4b","Astx4c","Astx4d","Astx5","Astx6","Atg4a","Atp11c","Atp1b4","Atp2b3","Atp6ap1","Atp6ap2","Atp7a","Atrx","Avpr2","Awat1","Awat2","B230119M05Rik","B630019K06Rik","BC061195","BC065397","Bcap31","Bclaf3","Bcor","Bcorl1","Bex1","Bex2","Bex3","Bex4","Bgn","Bhlhb9","Bmp15","Bmx","Brcc3","Brs3","Brwd3","Btbd35f1","Btbd35f10","Btbd35f11","Btbd35f12","Btbd35f13","Btbd35f14","Btbd35f15","Btbd35f16","Btbd35f17","Btbd35f18","Btbd35f19","Btbd35f2","Btbd35f20","Btbd35f21","Btbd35f22","Btbd35f23","Btbd35f24","Btbd35f25","Btbd35f26","Btbd35f27","Btbd35f28","Btbd35f29","Btbd35f3","Btbd35f4","Btbd35f5","Btbd35f6","Btbd35f7","Btbd35f8","Btbd35f9","Btg1b","Btg1c","Btk","C1galt1c1","C330007P06Rik","C430049B03Rik","CXorf58","Cacna1f","Capn6","Car5b","Cask","Ccdc120","Ccdc160","Ccdc22","Ccnb3","Cd40lg","Cd99l2","Cdk16","Cdkl5","Cdr1","Cdr1os","Cdx4","Cenpi","Cetn2","Cfap47","Cfp","Chic1","Chm","Chrdl1","Chst7","Cited1","Clcn5","Cldn2","Cldn34a","Cldn34b1","Cldn34b2","Cldn34b3","Cldn34b4","Cldn34c1","Cldn34c2","Cldn34c4","Cldn34d","Cltrn","Cmc4","Cnga2","Cnksr2","Col4a5","Col4a6","Cox7b","Cpxcr1","Cstf2","Ct55","Ctag2","Ctag2l1","Ctag2l2","Ctps2","Cul4b","Cxcr3","Cybb","Cylc1","Cypt1","Cypt14","Cypt15","Cypt2","Cypt3","Cysltr1","Dach2","Dcaf12l1","Dcaf12l2","Dcaf8l","Dcx","Ddx3x","Dgat2l6","Dgkk","Diaph2","Dipk2b","Dkc1","Dlg3","Dmd","Dmrtc1a","Dmrtc1b","Dmrtc1c1","Dmrtc1c2","Dnaaf6b","Dnase1l1","Dock11","Drp2","Drr1","Dusp21","Dusp9","Dynlt3","E330010L02Rik","E330016L19Rik","Ebp","Eda","Eda2r","Efhc2","Efnb1","Egfl6","Eif1ax","Eif2c5","Eif2s3x","Elf4","Elk1","Emd","Enox2","Eola1","Eras","Ercc6l","Erdr1","Esx1","Etd","Ezhip","F630028O10Rik","F8","F8a","F9","Fam120c","Fam122b","Fam122c","Fam199x","Fam3a","Fam47c","Fam50a","Fam90a1b","Fancb","Fate1","Fgd1","Fgf13","Fgf16","Fhl1","Firre","Flicr","Flna","Fmr1","Fmr1nb","Fnd3c2","Fndc3c1","Foxo4","Foxp3","Foxr2","Frmd7","Frmpd3","Frmpd4","Fsip2l","Fthl17a","Fthl17b","Fthl17c","Fthl17d","Fthl17e","Fthl17f","Ftsj1","Ftx","Fundc1","Fundc2","G530011O06Rik","G6pdx","Gab3","Gabra3","Gabre","Gabrq","Gata1","Gdi1","Gdpd2","Gemin8","Gja6","Gjb1","Gk","Gla","Glod5","Glra2","Glra4","Gm10058","Gm10096","Gm10147","Gm10230","Gm10344","Gm10439","Gm10486","Gm10487","Gm10488","Gm10490","Gm10491","Gm1140","Gm1141","Gm14379","Gm14459","Gm14493","Gm14505","Gm14525","Gm14549","Gm14552","Gm14553","Gm14565","Gm14569","Gm14582","Gm14632","Gm14634","Gm14635","Gm14636","Gm14643","Gm14661","Gm14662","Gm14664","Gm14684","Gm14692","Gm14696","Gm14697","Gm14698","Gm14703","Gm14705","Gm14707","Gm14715","Gm14717","Gm14718","Gm14742","Gm14743","Gm14744","Gm14762","Gm14764","Gm14773","Gm14798","Gm14808","Gm14809","Gm14812","Gm14817","Gm14819","Gm14820","Gm14827","Gm14858","Gm14862","Gm14866","Gm14902","Gm14929","Gm14936","Gm14950","Gm14951","Gm14974","Gm15008","Gm15015","Gm15017","Gm15020","Gm15023","Gm15046","Gm15063","Gm15080","Gm15085","Gm15086","Gm15091","Gm15092","Gm15093","Gm15097","Gm15099","Gm15100","Gm15104","Gm15107","Gm15114","Gm15127","Gm15128","Gm15138","Gm15155","Gm15156","Gm15169","Gm15201","Gm15202","Gm15226","Gm15228","Gm15230","Gm15232","Gm15239","Gm15241","Gm15243","Gm15245","Gm15246","Gm15247","Gm15261","Gm15262","Gm15295","Gm15298","Gm15384","Gm15482","Gm15726","Gm16189","Gm16405","Gm16430","Gm1720","Gm17267","Gm17361","Gm17412","Gm17467","Gm17469","Gm17521","Gm17522","Gm17577","Gm17584","Gm17604","Gm17693","Gm18336","Gm1993","Gm2012","Gm2030","Gm20455","Gm20489","Gm2101","Gm2117","Gm2155","Gm21616","Gm21637","Gm2165","Gm2174","Gm21876","Gm21986","Gm2200","Gm22023","Gm22090","Gm22139","Gm22248","Gm22266","Gm22332","Gm22351","Gm22359","Gm22364","Gm22430","Gm22472","Gm22522","Gm22539","Gm22590","Gm22592","Gm22650","Gm22686","Gm22783","Gm22785","Gm23000","Gm23082","Gm2309","Gm23124","Gm23199","Gm23258","Gm23277","Gm23280","Gm23320","Gm23322","Gm23325","Gm23378","Gm23404","Gm23454","Gm23557","Gm23586","Gm23613","Gm23615","Gm23628","Gm23656","Gm23705","Gm23768","Gm23786","Gm23901","Gm23958","Gm23985","Gm24038","Gm24061","Gm2411","Gm24123","Gm24147","Gm24281","Gm24460","Gm24470","Gm24491","Gm24522","Gm24535","Gm24577","Gm24595","Gm24598","Gm24622","Gm24624","Gm24627","Gm24687","Gm24718","Gm24763","Gm24809","Gm24812","Gm24831","Gm24907","Gm25006","Gm25097","Gm25107","Gm25170","Gm25202","Gm25226","Gm25421","Gm25429","Gm25481","Gm25520","Gm25552","Gm25624","Gm25651","Gm25728","Gm25770","Gm25795","Gm25812","Gm25828","Gm25895","Gm25915","Gm26000","Gm26007","Gm26020","Gm26029","Gm26099","Gm26108","Gm26111","Gm26125","Gm26131","Gm26151","Gm26174","Gm26182","Gm26276","Gm26312","Gm26314","Gm26351","Gm26368","Gm26401","Gm26406","Gm26417","Gm26437","Gm26441","Gm26487","Gm26618","Gm26652","Gm26726","Gm26952","Gm26992","Gm27000","Gm27191","Gm27192","Gm27414","Gm27510","Gm28268","Gm28269","Gm28579","Gm28730","Gm29242","Gm3669","Gm36995","Gm37564","Gm37741","Gm37956","Gm38020","Gm382","Gm38390","Gm3858","Gm3880","Gm39526","Gm4297","Gm44593","Gm45015","Gm45022","Gm45194","Gm45208","Gm4779","Gm4836","Gm50465","Gm50485","Gm50486","Gm5127","Gm5128","Gm5168","Gm5169","Gm53013","Gm5751","Gm5926","Gm5934","Gm5935","Gm5938","Gm5941","Gm5945","Gm6121","Gm614","Gm6268","Gm6377","Gm648","Gm6592","Gm6760","Gm6787","Gm6812","Gm6938","Gm7073","Gm715","Gm7437","Gm7598","Gm773","Gm7903","Gm8334","Gm8817","Gm9","Gm9112","Gnl3l","Gpc3","Gpc4","Gpkow","Gpm6b","Gpr101","Gpr119","Gpr143","Gpr165","Gpr173","Gpr174","Gpr34","Gpr50","Gpr82","Gprasp1","Gprasp2","Gria3","Gripap1","Grpr","Gspt2","Gucy2f","H2ab1","H2ab2","H2ab3","H2al1a","H2al1b","H2al1c","H2al1d","H2al1e","H2al1f","H2al1g","H2al1h","H2al1i","H2al1j","H2al1k","H2al1m","H2al1n","H2al1o","H2al3","H2ap","H2bw2","Haus7","Hccs","Hcfc1","Hdac6","Hdac8","Hdx","Heph","Hmgb3","Hmgn5","Hnrnph2","Hprt","Hs6st2","Hsd17b10","Hsf3","Htatsf1","Htr2c","Huwe1","Idh3g","Ids","Igbp1","Igsf1","Ikbkg","Il13ra1","Il13ra2","Il1rapl1","Il1rapl2","Il2rg","Ints6l","Iqsec2","Irak1","Irs4","Itgb1bp2","Itm2a","Jade3","Jpx","Kantr","Kcnd1","Kcne1l","Kctd12b","Kdm5c","Kdm6a","Kif4","Kir3dl1","Kir3dl2","Kis2","Klf8","Klhl13","Klhl15","Klhl34","Klhl4","L1cam","Lage3","Lamp2","Lancl3","Las1l","Ldoc1","Lhfpl1","Lonrf3","Lpar4","Lrch2","Luzp4","Magea1","Magea10","Magea13","Magea14","Magea2","Magea3","Magea4","Magea5","Magea6","Magea8","Magea9","Mageb1","Mageb11","Mageb16","Mageb18","Mageb2","Mageb4","Mageb5","Mageb5b","Mageb6b1","Mageb6b2","Magec2","Maged1","Maged2","Magee1","Magee2","Mageh1","Magix","Magt1","Mamld1","Maoa","Maob","Map3k15","Map7d2","Map7d3","Mbnl3","Mbtps2","Mcf2","Mcts1","Mecp2","Med12","Med14","Mid1","Mid1ip1","Mid2","Mir105","Mir106a","Mir1198","Mir1264","Mir1298","Mir188","Mir18b","Mir1906-2","Mir1912","Mir1970","Mir19b-2","Mir201","Mir20b","Mir2137","Mir221","Mir222","Mir223","Mir224","Mir3110","Mir3112","Mir3113","Mir322","Mir325","Mir3473a","Mir3475","Mir351","Mir361","Mir362","Mir3620","Mir363","Mir374b","Mir374c","Mir384","Mir421","Mir448","Mir450-1","Mir450-2","Mir450b","Mir452","Mir463","Mir465","Mir465d","Mir470","Mir471","Mir500","Mir501","Mir503","Mir504","Mir505","Mir509","Mir5116","Mir5132","Mir532","Mir542","Mir547","Mir5617","Mir6383","Mir6384","Mir652","Mir672","Mir676","Mir7091","Mir7092","Mir7093","Mir717","Mir718","Mir741","Mir742","Mir743","Mir764","Mir7646","Mir767","Mir7673","Mir878","Mir880","Mir881","Mir883a","Mir883b","Mir92-2","Mir98","Mirlet7f-2","Mmgt1","Morc4","Morf4l2","Mospd1","Mospd2","Mpp1","Msl3","Msn","Mtcp1","Mtm1","Mtmr1","Mycs","Naa10","Nap1l2","Nap1l3","Nbdy","Ndp","Ndufa1","Ndufb11","Nexmif","Nhs","Nhsl2","Nkap","Nkrf","Nlgn3","Nono","Nox1","Nr0b1","Nrk","Nsdhl","Nudt10","Nudt11","Nup62cl","Nxf2","Nxf3","Nxf7","Nxt2","Nyx","Obp1a","Obp1b","Ocrl","Ofd1","Ogt","Olfr1320","Olfr1321","Olfr1322","Olfr1323","Olfr1324","Olfr1325","Olfr1326-ps1","Ophn1","Opn1mw","Otc","Ott","Otud5","Otud6a","P2ry10","P2ry10b","P2ry4","Pabpc5","Pak3","Pbdc1","Pbsn","Pcdh11x","Pcdh19","Pcsk1n","Pcyt1b","Pdha1","Pdk3","Pdzd11","Pdzd4","Pfkfb1","Pfn5","Pgk1","Pgr15l","Pgrmc1","Phex","Phf6","Phf8","Phka1","Phka2","Piga","Pim2","Pin4","Pir","Pja1","Plac1","Platr21","Plp1","Plp2","Pls3","Plxna3","Plxnb3","Pnck","Pnma3","Pnma5","Pof1b","Pola1","Porcn","Pou3f4","Ppef1","Ppp1r3f","Pqbp1","Praf2","Pramel3","Pramex1","Prdx4","Prickle3","Prkx","Prps1","Prps2","Prr32","Prrg1","Prrg3","Psmd10","Ptchd1","Pwwp3b","Pwwp4a","Pwwp4b","Pwwp4c","Pwwp4d","Rab33a","Rab39b","Rab9","Rab9b","Radx","Rai2","Rap2c","Rbbp7","Rbm10","Rbm3","Rbm3os","Rbm41","Rbmx","Rbmx2","Renbp","Reps2","Rgn","Rhox1","Rhox10","Rhox11","Rhox12","Rhox13","Rhox2a","Rhox2b","Rhox2c","Rhox2d","Rhox2e","Rhox2f","Rhox2g","Rhox2h","Rhox3a","Rhox3a2","Rhox3c","Rhox3e","Rhox3f","Rhox3g","Rhox3h","Rhox4a","Rhox4a2","Rhox4b","Rhox4c","Rhox4d","Rhox4e","Rhox4f","Rhox4g","Rhox5","Rhox6","Rhox7a","Rhox7b","Rhox8","Rhox9","Ribc1","Ripply1","Rlim","Rnf113a1","Rnf128","Rnf138rt1","Rp2","Rpgr","Rpl10","Rpl36a","Rpl39","Rps4x","Rps6ka3","Rps6ka6","Rragb","Rs1","Rtl3","Rtl4","Rtl5","Rtl8a","Rtl8b","Rtl8c","Rtl9","S100g","SNORA63","SNORA70","Samt1","Samt1b","Samt1c","Samt1d","Samt2","Samt2b","Samt3","Samt4","Sash3","Sat1","Satl1","Scml2","Septin6","Serpina7","Sh2d1a","Sh3bgrl","Sh3kbp1","Shroom2","Shroom4","Siah1b","Slc10a3","Slc16a2","Slc25a14","Slc25a43","Slc25a5","Slc25a53","Slc35a2","Slc38a5","Slc6a14","Slc6a8","Slc7a3","Slc9a6","Slc9a7","Slitrk2","Slitrk4","Slx","Slxl1","Smarca1","Smc1a","Smim10l2a","Smim9","Smpx","Sms","Snora35","Snora69","Snord61","Snx12","Sowahd","Sox3","Spaca5","Spin2c","Spin2d","Spin2e","Spin2f","Spin2g","Spin4","Srpk3","Srpx","Srpx2","Srsx","Ssr4","Ssx9","Ssxa1","Ssxb1","Ssxb10","Ssxb2","Ssxb3","Ssxb5","Ssxb6","Ssxb8","Ssxb9","Stag2","Stard8","Stk26","Suv39h1","Syap1","Syn1","Syp","Sytl4","Sytl5","Tab3","Taf1","Taf7l","Taf9b","Tasl","Taz","Tbc1d25","Tbc1d8b","Tbl1x","Tbx22","Tceal1","Tceal3","Tceal5","Tceal6","Tceal7","Tceal8","Tceal9","Tceanc","Tcp11x2","Tenm1","Tent5d","Tesl1","Tesl2","Tex11","Tex13a","Tex13b","Tex13c1","Tex13c2","Tex13c3","Tex16","Tex28","Tfe3","Tgif2lx1","Tgif2lx2","Thoc2","Timm17b","Timm8a1","Timp1","Tktl1","Tlr13","Tlr7","Tlr8","Tm9sf5","Tmem164","Tmem185a","Tmem255a","Tmem28","Tmem29","Tmem35a","Tmem47","Tmsb15a","Tmsb15b1","Tmsb15b2","Tmsb15l","Tmsb4x","Tnmd","Trap1a","Trappc2","Trex2","Trmt2b","Tro","Trpc5","Trpc5os","Tsc22d3","Tsga8","Tsix","Tslrn1","Tspan6","Tspan7","Tspyl2","Tsr2","Tsx","Txlng","U1","U4","U6","Uba1","Ube2a","Ube2dnl1","Ube2dnl2","Ubl4a","Ubqln2","Upf3b","Uprt","Usp11","Usp26","Usp27x","Usp51","Usp9x","Utp14a","Uxt","Vbp1","Vegfd","Vgll1","Vma21","Vmn1r239-ps","Vmn2r121","Vsig1","Vsig4","Was","Wdr13","Wdr44","Wdr45","Wmp","Wnk3","Xiap","Xist","Xk","Xkrx","Xlr","Xlr3a","Xlr3b","Xlr3c","Xlr4a","Xlr4b","Xlr4c","Xlr5a","Xlr5b","Xlr5c","Xpnpep2","Yipf6","Yy2","Zbtb33","Zc3h12b","Zc4h2","Zcchc12","Zcchc13","Zcchc18","Zdhhc15","Zdhhc9","Zfp182","Zfp185","Zfp275","Zfp280c","Zfp300","Zfp36l3","Zfp449","Zfp711","Zfp92","Zfx","Zic3","Zmat1","Zmym3","Zrsr2","Zxdb","mmu-mir-1194","mmu-mir-3472","mmu-mir-465b-1","mmu-mir-465c-1","mmu-mir-6382","mmu-mir-680-2","mmu-mir-743b","mmu-mir-871","n-R5s7","ncrna_mus_musculus"]});
                        });

});
