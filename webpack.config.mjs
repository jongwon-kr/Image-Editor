import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const __dirname = path.resolve();

export default {
  mode: "development",
  entry: "./app/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].graphic-cast.js",
    sourceMapFilename: "[file].map",
  },
  devtool: "source-map",
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
  resolve: {
    extensions: [".js"],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: { ie: "11" },
                  useBuiltIns: "entry",
                  corejs: 3,
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.svg$/,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "vendor", to: "vendor" }, // 기존 vendor 폴더 복사
        { from: "public", to: "public" }, // public 폴더를 dist/public으로 복사
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "graphic-cast.css",
    }),
  ],
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};