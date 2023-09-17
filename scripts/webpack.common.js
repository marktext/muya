const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

const proMode = process.env.NODE_ENV === "production";

exports.default = {
  resolve: {
    alias: {
      "@muya": path.resolve(__dirname, "../lib"),
    },
    extensions: [".webpack.js", ".web.js", ".ts", ".js"],
    fallback: {
      path: false,
      zlib: require.resolve("browserify-zlib"),
      stream: require.resolve("stream-browserify"),
    },
  },

  module: {
    rules: [
      {
        test: /\.(t|j)s$/,
        use: "babel-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          proMode
            ? {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  publicPath: "/",
                },
              }
            : "style-loader",
          { loader: "css-loader", options: { importLoaders: 1 } },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [
                    "postcss-preset-env",
                    {
                      stage: 0,
                    },
                  ],
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        type: "asset",
        generator: {
          filename: "images/[name].[contenthash:8][ext]",
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name].[contenthash:8][ext]",
        },
      },
    ],
  },
  plugins: [new NodePolyfillPlugin()],
};
