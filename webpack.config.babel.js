const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const SRC_DIR = path.resolve(__dirname, 'src');
const BUILD_DIR = path.resolve(__dirname, 'build');

const context = SRC_DIR;

const devConfig = {
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
              ["react-css-modules", {
                context: 'src'
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
    new webpack.EnvironmentPlugin({ 'NODE_ENV': 'development' }),
    new HtmlWebpackPlugin({ title: 'Fraktal' }),
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
