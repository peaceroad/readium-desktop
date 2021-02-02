const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require("terser-webpack-plugin");

var fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const preprocessorDirectives = require("./webpack.config-preprocessor-directives");

const aliases = {
    "readium-desktop": path.resolve(__dirname, "src"),

    "@r2-utils-js": "r2-utils-js/dist/es6-es2015/src",
    "@r2-lcp-js": "r2-lcp-js/dist/es6-es2015/src",
    "@r2-opds-js": "r2-opds-js/dist/es6-es2015/src",
    "@r2-shared-js": "r2-shared-js/dist/es6-es2015/src",
    "@r2-streamer-js": "r2-streamer-js/dist/es6-es2015/src",
    "@r2-navigator-js": "r2-navigator-js/dist/es6-es2015/src",
};

////// ================================
////// EXTERNALS
// Some modules cannot be bundled by Webpack
// for example those that make internal use of NodeJS require() in special ways
// in order to resolve asset paths, etc.
// In DEBUG / DEV mode, we just external-ize as much as possible (any non-TypeScript / non-local code),
// to minimize bundle size / bundler computations / compile times.

// const nodeExternals = require("webpack-node-externals");
const nodeExternals = require("./nodeExternals");

const _enableHot = false;

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";
console.log(`PDF nodeEnv: ${nodeEnv}`);

// https://github.com/edrlab/thorium-reader/issues/1097#issuecomment-643406149
const useLegacyTypeScriptLoader = process.env.USE_LEGACY_TYPESCRIPT_LOADER
    ? true
    : false;
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
ForkTsCheckerWebpackPlugin.prototype[require("util").inspect.custom] = (_depth, _options) => { return "ForkTsCheckerWebpackPlugin" };
const checkTypeScriptSkip =
    nodeEnv !== "production" ?
    (process.env.SKIP_CHECK_TYPESCRIPT === "1" ? true : false)
    : false
    ;

let externals = {
    bindings: "bindings",
    leveldown: "leveldown",
    fsevents: "fsevents",
    conf: "conf",
    sqlite3: "sqlite3",
};
if (nodeEnv !== "production") {
    // // externals = Object.assign(externals, {
    // //         "electron-config": "electron-config",
    // //     }
    // // );
    // const { dependencies } = require("./package.json");
    // const depsKeysArray = Object.keys(dependencies || {});
    // const depsKeysObj = {};
    // depsKeysArray.forEach((depsKey) => { depsKeysObj[depsKey] = depsKey });
    // externals = Object.assign(externals, depsKeysObj);
    // delete externals["pouchdb-core"];

    if (process.env.WEBPACK === "bundle-external") {
        externals = [
            nodeExternals({
                processName: "PDF",
                alias: aliases,
                // whitelist: ["pouchdb-core"],
            }),
        ];
    } else {
        externals.devtron = "devtron";
    }
}

console.log("WEBPACK externals (PDF):");
console.log(JSON.stringify(externals, null, "  "));
////// EXTERNALS
////// ================================

const cssLoaderConfig = [
    {
        loader: MiniCssExtractPlugin.loader,
        options: {
            // publicPath: "./styling", // preprocessorDirectives.rendererReaderBaseUrl,
            // hmr: _enableHot,
            // reloadAll: true,
            esModule: false,
        },
    },
    {
        loader: "css-loader",
        options: {
            importLoaders: 1,
            modules: true,
            esModule: false,
        },
    },
    "postcss-loader",
];

let config = Object.assign(
    {},
    {
        entry: "./src/renderer/reader/pdf/webview/index_pdf.ts",
        name: "renderer pdf webview index",
        output: {
            filename: "index_pdf.js",
            path: path.join(__dirname, "dist"),
            // https://github.com/webpack/webpack/issues/1114
            libraryTarget: "commonjs2",
        },
        target: "electron-renderer",

        mode: "production", // nodeEnv,

        externals: externals,

        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
            alias: aliases,
        },
        stats: {
            // warningsFilter: /export .* was not found in/,
        },
        module: {
            rules: [
                {
                    test: /\.(jsx?|tsx?)$/,
                    use: [
                        {
                            loader: path.resolve(
                                "./scripts/webpack-loader-scope-checker.js"
                            ),
                            options: {
                                forbid: "library",
                            },
                        },
                    ],
                },
                {
                    exclude: /node_modules/,
                    test: /\.tsx?$/,
                    loader: useLegacyTypeScriptLoader
                        ? "awesome-typescript-loader"
                        : "ts-loader",
                    options: {
                        transpileOnly: true, // checkTypeScriptSkip
                    },
                },
            ],
        },

        // devServer: {
        //     contentBase: __dirname,
        //     hot: _enableHot,
        //     watchContentBase: true,
        //     watchOptions: {
        //         ignored: [
        //             /dist/,
        //             /docs/,
        //             /scripts/,
        //             /test/,
        //             /node_modules/,
        //             /external-assets/,
        //         ],
        //     },
        // },
        plugins: [
            new BundleAnalyzerPlugin({
                analyzerMode: "disabled",
                defaultSizes: "stat", // "parsed"
                openAnalyzer: false,
                generateStatsFile: true,
                statsFilename: "stats_renderer-pdf.json",
                statsOptions: null,

                excludeAssets: null,
            }),
            preprocessorDirectives.definePlugin,
        ],
    }
);

if (!checkTypeScriptSkip) {
    config.plugins.push(new ForkTsCheckerWebpackPlugin({
        // measureCompilationTime: true,
    }));
}

if (nodeEnv !== "production") {

    // const port = parseInt(preprocessorDirectives.portPdfWebview, 10);
    // console.log("PDF PORT: " + port);

    // // Renderer config for DEV environment
    // config = Object.assign({}, config, {
    //     // Enable sourcemaps for debugging webpack's output.
    //     devtool: "inline-source-map",

    //     devServer: {
    //         contentBase: __dirname,
    //         headers: {
    //             "Access-Control-Allow-Origin": "*",
    //         },
    //         hot: _enableHot,
    //         watchContentBase: true,
    //         watchOptions: {
    //             ignored: [
    //                 /dist/,
    //                 /docs/,
    //                 /scripts/,
    //                 /test/,
    //                 /node_modules/,
    //                 /external-assets/,
    //             ],
    //         },
    //         port,
    //     },
    // });

    // config.output.pathinfo = true;

    // config.output.publicPath = preprocessorDirectives.rendererPdfWebviewBaseUrl;
    // if (_enableHot) {
    //     config.plugins.push(new webpack.HotModuleReplacementPlugin());
    // }
    // if (_enableHot) {
    //     cssLoaderConfig.unshift("css-hot-loader");
    // }
    config.module.rules.push({
        test: /\.css$/,
        use: cssLoaderConfig,
    });
} else {

    config.optimization =
    {
        ...(config.optimization || {}),
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                exclude: /MathJax/,
                terserOptions: {
                    compress: false,
                    mangle: false,
                    output: {
                        comments: false,
                    },
                },
            }),
        ],
    };
    // {
    //     minimize: false,
    // };

    config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^devtron$/ })
    );
    config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^react-axe$/ })
    );

    // Minify and uglify in production environment
    //config.plugins.push(new UglifyJsPlugin());
    config.module.rules.push({
        test: /\.css$/,
        use: cssLoaderConfig,
    });
}

module.exports = config;
