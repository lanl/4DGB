const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, 'index.js'),
    output: {
        library:  'GTK',
        filename: 'gtk.min.js',
        path:     path.resolve(__dirname, 'gtk-dist')
    },
    externals: {
        'node-fetch': 'fetch'
    },
    devtool: "eval-source-map",
    plugins: [
        // THREE's OrbitControls plugin requires that 'THREE' be available globally,
        // and since we're exporting THREE globally, it feels right to just do the same
        // with d3
        new webpack.ProvidePlugin({
            THREE: 'three',
            d3: 'd3'
        })
    ]
}
