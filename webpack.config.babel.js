/* eslint no-console: 0 */

const childProcess = require('child_process');
const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const projectName = 'Fraktal';

const version = childProcess.execSync('git describe --always --tags --match=v* --long', { encoding: 'utf-8' }).replace('-', '.');
console.log('Version of this build:', version);

const SRC_DIR = path.resolve(__dirname, 'src');
const BUILD_DIR = path.resolve(__dirname, 'build');

const context = SRC_DIR;

const devConfig = {
  bail: false,
  devtool: 'eval',

  devServer: {
    hot: true,
  },
};

const devPlugins = [
  new webpack.HotModuleReplacementPlugin(),
];

const prodConfig = {
  devtool: 'source-map',
};

const prodPlugins = [
];

module.exports = {
  context,

  entry: {
    index: ['react-hot-loader/patch', path.resolve(SRC_DIR, 'index')],
    worker: path.resolve(SRC_DIR, 'worker'),
  },

  output: {
    path: BUILD_DIR,
    filename: '[name].js',
    globalObject: 'this', // Workaround for a bug in Webpack https://github.com/webpack/webpack/issues/6642
  },

  resolve: {
    extensions: [
      '.local.js', '.local.jsx',
      '.js', '.jsx',
    ],

    modules: [
      SRC_DIR,
      'node_modules',
    ],
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        enforce: 'pre',
        exclude: /node_modules/,
        loader: 'eslint-loader',
      },

      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              ['react-css-modules', {
                context: 'src',
              }],
            ],
          },
        },
      },

      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
            },
          },
        ],
      },
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      'PROJECT_NAME': JSON.stringify(projectName),
      'VERSION': JSON.stringify(version),
    }),
    new webpack.EnvironmentPlugin({ 'NODE_ENV': 'development' }),
    new HtmlWebpackPlugin({ title: projectName }),
    ...(process.env.NODE_ENV === 'production'
      ? prodPlugins
      : devPlugins
    ),
  ],

  ...(process.env.NODE_ENV === 'production'
    ? prodConfig
    : devConfig
  ),

};
