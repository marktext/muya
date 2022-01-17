const path = require('path')
const Dotenv = require('dotenv-webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const commonConfig = require('../scripts/webpack.common')

module.exports = {
  ...commonConfig.default,

  mode: 'development',

  entry: './example/index.js',

  devtool: 'inline-source-map',

  devServer: {
    // contentBase
    static: {
      directory: path.join(__dirname, 'dist/')
    },
    port: 3000,
    // publicPath
    devMiddleware: {
      publicPath: 'https://localhost:3000/'
    }
  },

  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({
      template: './example/index.html'
    })
  ],

  output: {
    filename: '[name].bundle.js'
  }
}
