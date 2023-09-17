const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const pkg = require("../package.json");
const commonConfig = require("./webpack.common");

const bannerPack = new webpack.BannerPlugin({
  banner: [
    `Muya Editor v${pkg.version}`,
    "https://github.com/marktext/muya",
    "Copyright (c) 2018-present, Jocs ransixi@gmail.com and all muya contributors",
  ].join("\n"),
  entryOnly: true,
});

const constantPack = new webpack.DefinePlugin({
  MUYA_VERSION: JSON.stringify(pkg.version),
});

const proMode = process.env.NODE_ENV === "production";

module.exports = {
  ...commonConfig.default,

  mode: proMode ? "production" : "development",

  context: path.resolve(__dirname, "../lib"),

  entry: {
    "en": {
      import: "./locales/en.ts",
      filename: "./locales/en.js",
    },
    "ja": {
      import: "./locales/ja.ts",
      filename: "./locales/ja.js",
    },
    "zh": {
      import: "./locales/zh.ts",
      filename: "./locales/zh.js",
    },
    "markdownToHtml": {
      import: "./jsonState/markdownToHtml.ts",
      filename: "./jsonState/markdownToHtml.js",
    },
    "ui": {
      import: "./ui/index.ts",
      filename: "./ui/index.js",
    },
    "muya": "./index.ts",
  },

  output: {
    filename: "[name].js",
    library: {
      name: "[name]",
      type: "umd",
      export: "default",
    },
    path: path.resolve(__dirname, "../dist/"),
    clean: true,
  },

  plugins: [
    bannerPack,
    constantPack,
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
  ],
};
