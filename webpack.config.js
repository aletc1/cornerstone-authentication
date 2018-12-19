var path = require("path");
var webpack = require("webpack");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var PATHS = {
    entryPoint: path.resolve(__dirname, 'src/index.tsx'),
    bundles: path.resolve(__dirname, 'lib'),
};

module.exports = (env) => {
    return config = {
        // These are the entry point of our library. We tell webpack to use
        // the name we assign later, when creating the bundle. We also use
        // the name to filter the second entry point for applying code
        // minification via UglifyJS
        entry: {
            'cornerstone-authentication.min': [PATHS.entryPoint]
        },
        // The output defines how and where we want the bundles. The special
        // value `[name]` in `filename` tell Webpack to use the name we defined above.
        output: {
            path: PATHS.bundles,
            filename: '[name].js',
            libraryTarget: 'commonjs2',
            library: 'CornerstoneAuthentication',
        },
        // Add resolve for `tsx` and `ts` files, otherwise Webpack would
        // only look for common JavaScript file extension (.js)
        resolve: {
            extensions: ['.ts', '.tsx', '.js'],
            alias: {
                'react': path.resolve(__dirname, './node_modules/react'),
                '@cornerstone/communications': path.resolve(__dirname, './node_modules/@cornerstone/communications'),
                'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
                'reflect-metadata': path.resolve(__dirname, './node_modules/reflect-metadata')
            }
        },
        // Activate source maps for the bundles in order to preserve the original
        // source when the user debugs the application
        devtool: 'source-map',
        plugins: [
            //new BundleAnalyzerPlugin()
        ],
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /(node_modules|bower_components|typings)/,
                    use: [{
                        loader: 'awesome-typescript-loader'
                    }]
                }
            ]
        },
        externals: {
            // Don't bundle react or react-dom      
            react: {
                commonjs: "react",
                commonjs2: "react",
                amd: "React",
                root: "React"
            },
            "react-dom": {
                commonjs: "react-dom",
                commonjs2: "react-dom",
                amd: "ReactDOM",
                root: "ReactDOM"
            },
            "@cornerstone/communications": {
                commonjs: "@cornerstone/communications",
                commonjs2: "@cornerstone/communications",
                amd: "CornerstoneCommunications",
                root: "CornerstoneCommunications"
            },
            "reflect-metadata": {
                commonjs: "reflect-metadata",
                commonjs2: "reflect-metadata",
                amd: "ReflectMetadata",
                root: "ReflectMetadata"
            }
        }
    };
};