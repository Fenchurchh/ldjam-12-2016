var path = require( "path" );
// check out the .babelrc. some of the following config is not working 100%
module.exports = {
    module   : {
        loaders: [
            {
                test   : /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader : 'babel-loader',
                presets: ['latest'],
            }
        ],
    },
    entry    : "./src/index.js",
    output   : {
        path      : "./build",
        publicPath: "/assets/",
        filename  : "bundle.js"
    },
    devServer: {
        inline     : true,
        contentBase: "./public/"
    },
    debug    : true,
    devtool  : 'inline-source-map',
}
