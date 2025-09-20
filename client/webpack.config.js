const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map', // Прозрачные карты для Safari
  output: {
    clean: true,
    devtoolModuleFilenameTemplate: info =>
      `webpack:///${info.resourcePath}${info.loaders ? `?${info.loaders}` : ''}`,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      // Подхватываем карты из предыдущих стадий (TS/Babel)
      { 
        test: /\.[jt]s$/, 
        use: ['source-map-loader'], 
        enforce: 'pre' 
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-syntax-dynamic-import'
            ]
          }
        }
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  devServer: {
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
  },
};