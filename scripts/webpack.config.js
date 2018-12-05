const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const postcssPresetEnv = require('postcss-preset-env')
const pkg = require('../package.json')

const bannerPack = new webpack.BannerPlugin({
  banner: [
    `Muya Editor v${pkg.version}`,
    'https://github.com/marktext/muya',
    'Copyright (c) 2018, Jocs ransixi@gmail.com'
  ].join('\n'),
  entryOnly: true
})
const constantPack = new webpack.DefinePlugin({
  MUYA_VERSION: JSON.stringify(pkg.version)
})

const proMode = process.env.NODE_ENV === 'production'

module.exports = {
  mode: proMode ? 'production': 'development',
  entry: './lib/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '../dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-friendly-formatter')
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          proMode ? MiniCssExtractPlugin.loader : 'style-loader',
          { loader: 'css-loader', options: { importLoader: 1 } },
          { loader: 'postcss-loader', options: {
            ident: 'postcss',
            plugins: () => [
              postcssPresetEnv({
                stage: 0
              })
            ]
          } }
        ]
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-sprite-loader',
            options: {
              extract: true,
              publicPath: '/static/'
            }
          },
          'svgo-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'imgs/[name]--[folder].[ext]'
          }
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'media/[name]--[folder].[ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name]--[folder].[ext]'
          }
        }
      }
    ]
  },
  plugins: [
    bannerPack,
    constantPack,
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ]
}