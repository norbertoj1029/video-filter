const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const injectManifestVersion = require('./webpack/inject-manifest-version');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background.js',
    content: './src/content.js',
    'popup/popup': './src/popup/popup.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src',
          globOptions: {
            ignore: ['**/*.js'] // Don't copy JS files as they'll be bundled
          },
          transform: injectManifestVersion
        }
      ]
    })
  ]
}; 