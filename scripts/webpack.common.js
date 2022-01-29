const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

const proMode = process.env.NODE_ENV === 'production'

exports.default = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../lib')
    },
    fallback: {
      path: false,
      zlib: require.resolve('browserify-zlib'),
      stream: require.resolve('stream-browserify')
    }
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          proMode
            ? {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  publicPath: '/'
                }
              }
            : 'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  [
                    'postcss-preset-env',
                    {
                      stage: 0
                    }
                  ]
                ]
              }
            }
          }
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
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        type: 'asset',
        generator: {
          filename: 'images/[name].[contenthash:8][ext]'
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        type: 'asset/resource',
        generator: {
          filename: 'media/[name].[contenthash:8][ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash:8][ext]'
        }
      }
    ]
  },
  plugins: [
    new NodePolyfillPlugin(),
    new ESLintPlugin({
      formatter: require('eslint-friendly-formatter')
    })
  ]
}
