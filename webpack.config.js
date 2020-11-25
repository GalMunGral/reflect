const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.js",
  module: {
    // noParse: /babel/,
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js",
  },
  devtool: "eval-cheap-source-map",
  plugins: [new HtmlWebpackPlugin()],
};
