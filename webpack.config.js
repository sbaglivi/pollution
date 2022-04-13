const path = require("path");
module.exports = {
    // entry: './temp2.js',
    entry: './map_input.js', // need to start with ./ if in current directory. Without it thinks it's a module and search node modules
    output: {
        path: path.resolve(__dirname, 'assets', 'js'),
        // filename: 'temp3.js'
        filename: 'map_output.js'
    },
    mode: 'development',
}