const path = require("path");
module.exports = {
    entry: './temp2.js',
    output: {
        path: path.resolve(__dirname),
        filename: 'temp3.js'
    },
    mode: 'development',
}