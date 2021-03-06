// webpack.js
//
// Thrown-together webpack setup
//
var express = require('express');
var path    = require('path');
var fs      = require('fs');

var webpack    = require('webpack');
var jsManifest = require('./js-client-manifest.js');

var minJsPath = '/_js';

module.exports = function (staticPath, isDebugging) {
    // TODO: 
    // var router = express.Router();

    var build = function (callback) {
        var outputPath = '/_dist';
        // All of our Vue stuff is in the story list
        var appEntry = "../front-end/public/ui/directives/spSortableListWrapper.js";

        var fullOutputPath = path.join(staticPath, outputPath);
        if (fs.existsSync(fullOutputPath) && !isDebugging) {
            // return next();
        }

        var config = {
            entry: path.join(__dirname, appEntry),
            context: path.resolve(__dirname, "../front-end"),
            output: {
                path: path.join(staticPath, outputPath)
            },
            module: {
                rules: [{
                    test: /\.vue$/,
                    loader: 'vue-loader',
                    options: {
                      loaders: {
                        // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
                        // the "scss" and "sass" values for the lang attribute to the right configs here.
                        // other preprocessors should work out of the box, no loader config like this necessary.
                        'scss': 'vue-style-loader!css-loader!sass-loader',
                        'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
                        js: 'babel-loader'
                      }
                      // other vue-loader options go here
                    }
                },
                {
                    test: /\.(png|jpg|gif)$/,
                    loader: 'file-loader',
                    options: {
                      name: '[name].[ext]?[hash]'
                    }
                },
                {
                    test: /\.svg$/,
                    loader: 'svg-inline-loader'
                }]
            },
            resolveLoader: {
                modules: [path.resolve(__dirname, '../node_modules')]
            }
        };

        callback = callback || function () {};
        webpack(config, (err, stats) => {
            if (stats.hasErrors()) {
                // console.log(stats);
                return callback(stats);
            }
            return callback(err);
        });
    }

    return {
        build: build
    };
};