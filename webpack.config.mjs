import path from "path";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const __dirname = path.resolve();

export default (env, argv) => {
  const customMode = env.mode || argv.mode || "default";
  const webpackMode = customMode === 'pro' ? 'production' : 'development';
  return {
    mode: webpackMode,
    entry: "./app/index.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: `[name].graphic-cast-${customMode}.js`,
      sourceMapFilename: "[file].map",
    },
    devtool: "source-map",
    devServer: {
      port: 8888,
    },
    optimization: {
      splitChunks: {
        chunks: "all",
      },
    },
    resolve: {
      extensions: [".ts", ".js"],
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
                    targets: {
                      chrome: "38",
                      ie: "11",
                    },
                    useBuiltIns: "entry",
                    corejs: 3,
                  },
                ],
              ],
            },
          },
        },
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-typescript"],
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
          generator: {
            filename: "assets/[name][ext]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./index.html",
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "vendor", to: "vendor" },
          { from: "public", to: "public" },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: "graphic-cast.css",
      }),
      new webpack.DefinePlugin({
        'process.env.APP_MODE': JSON.stringify(customMode),
        'process.env.NODE_ENV': JSON.stringify(webpackMode)
      })
    ],
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  };
};

