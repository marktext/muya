const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const pkg = require('../package.json')
const commonConfig = require('./webpack.common')

const bannerPack = new webpack.BannerPlugin({
  banner: [
    `Muya Editor v${pkg.version}`,
    'https://github.com/marktext/muya',
    'Copyright (c) 2018-present, Jocs ransixi@gmail.com and all muya contributors'
  ].join('\n'),
  entryOnly: true
})

const constantPack = new webpack.DefinePlugin({
  MUYA_VERSION: JSON.stringify(pkg.version)
})

const proMode = process.env.NODE_ENV === 'production'

module.exports = {
  ...commonConfig.default,

  mode: proMode ? 'production': 'development',

  entry: './lib/index.js',

  output: {
    filename: 'muya.js',
    path: path.resolve(__dirname, '../dist')
  },

  plugins: [
    bannerPack,
    constantPack,
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ]
}