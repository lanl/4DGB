/**
 * Utility Functions
 * 
 * Usually related to shuffling around the different ways selection values can be represented.
 */

/**
 * Given a string specifying ranges of values, return
 * a list of all the individual values included in those ranges.
 * 
 * example:
 *      "1,2-5,10" => [1,2,3,4,5,10]
 * 
 * @param {String} str
 * @returns {Int[]}
 */
function rangeStringToValues( str ) {
    return rangesToValues( rangeStringToRanges(str) );
}

/**
 * Given a string specifying ranges of values, return
 * those same ranges but as an array of arrays
 * 
 * example:
 *     "1,2-5,10" => [ [1-1], [2-5], [10-10] ]
 * 
 * @param {String} str
 * @returns {Int[][]}
 */
function rangeStringToRanges( str ) {
    const vsplit = str.replace(/\s+/g, "").split(",");
    const ranges = [];
    for (let rangeStr of vsplit) {
        const ends = rangeStr.split("-");
        if (ends.length === 2)
            ranges.push([ parseInt(ends[0]), parseInt(ends[1]) ]);
        else
            ranges.push([ parseInt(ends), parseInt(ends)]);
    }

    return ranges;
}

/**
 * Given a list of values, return a string representing those values as a list of ranges.
 * 
 * example:
 *  [1,2,3,4,5,10] => "1,2-5,10"
 * 
 * 
 * @param {Int[]} values
 * @returns {String}
 */
function valuesToRangeString( values ) {
    const ranges = valuesToRanges( values.slice().sort( (a,b) => a - b ) );
    return rangesToRangeString(ranges);
}

/**
 * Given a *sorted* array of integers, return an array of arrays with the continous ranges
 * that make it up.
 * 
 * example:
 *      [1,2,3,4,5,10] => [ [1,1], [2-5], [10-10] ]
 * 
 * @param {Int[]} values 
 * @returns {Int[][]}
 */
function valuesToRanges(values) {
    if (values === undefined || values.length === 0) return [];
    
    const ranges = [ [values[0],values[0]] ];
    if (values.length === 1) return ranges;

    let currentRange = 0;
    for (let i = 1; i < values.length; i++) {
        if ( values[i] === values[i-1]+1) { // continue this range
            ranges[currentRange][1] = values[i];
        }
        else { // start the next range
            ranges[++currentRange] = [values[i],values[i]];
        }
    }
    return ranges;
}

/**
 * Given an array of arrays specifying ranges of values, return an array of all the values
 * included in those ranges
 * 
 * example:
 *    [ [1,1], [2-5], [10-10] ] => [1,2,3,4,5,10]
 * 
 * @param {Int[][]} ranges
 * @returns {Int[]}
 */
function rangesToValues(ranges) {
    let values = {}; //values is an object/hash initially to avoid duplicates
    for (let range of ranges) {
        for (let i = range[0]; i <= range[1]; i++) values[i] = true;
    }

    return Object.keys(values).map( d => parseInt(d) ).sort((a,b) => a - b);
}

/**
 * Given an array of arrays specifying ranges of values, return a string representing those values
 * as a list of ranges.
 * 
 * example:
 *     [ [1-1], [2-5], [10-10] ] => "1,2-5,10"
 * 
 * @param {Int[][]} ranges 
 * @returns {String}
 */
function rangesToRangeString(ranges) {
    const rangeStrs = [];
    for (let range of ranges) {
        if (range[0] === range[1])
            rangeStrs.push(String(range[0]));
        else
            rangeStrs.push(`${range[0]}-${range[1]}`);
    }

    return rangeStrs.join(",");
}

/**
 * Given an array of arrays specifying ranges of values, compress those ranges so that none
 * overlap.
 * 
 * example:
 *  [ [8,8], [12, 25], [20,29] ] => [ [8,8], [12-29] ]
 * 
 * from: https://stackoverflow.com/questions/42093036
**/
compressRanges = (ranges) => ranges.slice()
    .sort( (a,b) => a[0]-b[0] || a[1]-b[1] ) // Sort by range start
    .reduce( (acc, d) => {                   // fold into new range list
        const last = acc[acc.length-1] || [];
        if (d[0] <= last[1]+1) {
            if (last[1] < d[1]) last[1] = d[1];
            return acc;
        }
        return acc.concat([d]);
    }, []);

module.exports = { 
    rangeStringToValues, rangeStringToRanges,
    valuesToRanges, valuesToRangeString,
    rangesToValues, rangesToRangeString,
    compressRanges
}
