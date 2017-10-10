const path = require('path');

const HotModuleReplacementPlugin = require('webpack').HotModuleReplacementPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');

const SRC_DIR = path.resolve(__dirname, 'src');
const BUILD_DIR = path.resolve(__dirname, 'build');

module.exports = {

  entry: [
    'react-hot-loader/patch',
    path.resolve(SRC_DIR, 'index'),
  ],

  output: {
    path: BUILD_DIR,
    filename: 'bundle.js',
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
        loader: 'babel-loader',
      },

    ],
  },

  plugins: [
    new HtmlWebpackPlugin(),
    new HotModuleReplacementPlugin(),
  ],

  devServer: {
    hot: true,
  },

};
