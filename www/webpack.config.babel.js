/* eslint no-console: 0 */

const childProcess = require('child_process');
const path = require('path');

const webpack = require('webpack');
const ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const projectName = 'Fraktal';

const version = childProcess.execSync('git describe --always --tags --match=v* --long', { encoding: 'utf-8' }).replace('-', '.');
console.log('Version of this build:', version);

const SRC_DIR = path.resolve(__dirname, 'src');
const BUILD_DIR = path.resolve(__dirname, 'build');

const context = SRC_DIR;

const devConfig = {
  mode: 'development',
  bail: false,
  devtool: 'eval',

  devServer: {
    hot: true,
  },
};

const devPlugins = [
  new webpack.HotModuleReplacementPlugin(),
  new ForkTsCheckerPlugin({
    typescript: {
      configFile: path.resolve(__dirname, 'tsconfig.json'),
      disgnosticOptions: {
        semantic: true,
        syntactic: true,
      }
    }
  }),
];

const prodConfig = {
  mode: 'production',
  devtool: 'source-map',
};

const prodPlugins = [
];

module.exports = {
  context,

  entry: {
    index: ['react-hot-loader/patch', path.resolve(SRC_DIR, 'bootstrap')],
  },

  output: {
    path: BUILD_DIR,
    filename: '[name]-[hash].js',
    globalObject: 'this', // Workaround for a bug in Webpack https://github.com/webpack/webpack/issues/6642
  },

  resolve: {
    extensions: [
      '.local.ts', '.local.tsx', '.local.js', '.local.jsx',
      process.env.NODE_ENV === 'production'
        ? '.prod.tsx'
        : '.dev.tsx',
      process.env.NODE_ENV === 'production'
        ? '.prod.ts'
        : '.dev.ts',
      '.ts', '.tsx', '.js', '.jsx',
      '.wasm',
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
        exclude: [/node_modules/, /fraktal\/pkg/],
        loader: 'eslint-loader',
      },

      {
        test: /\.(ts|js)x?$/,
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
        test: /\.(ts|js)x?$/,
        use: ['source-map-loader'],
        enforce: 'pre',
      },

      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
              }
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
