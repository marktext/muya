const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const commonConfig = require('./scripts/webpack.common')

module.exports = {
  ...commonConfig.default,
  mode: 'development',
  entry: './src/index.js',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Development',
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
}