
const path = require('path');

module.exports = {
    entry: './index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    loader: {},
    plugin: {},
    mode: 'development', /** 模式: development | production */
}