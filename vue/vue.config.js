const path = require('path');

function resolve(dir) {

  return path.join(__dirname, dir)

}

module.exports = {

  // 基本路径

  publicPath: './',

  // 输出文件目录

  outputDir: 'dist',
  devServer: {
    proxy: {
      "^/swagger/": {
        target: "http://10.0.31.16:10092",
        logLevel: "debug",
      },
    },
  },
  pages: {

    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html',
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    }

  },

  lintOnSave: false,

  configureWebpack: {

    externals: {

    }

  },

  chainWebpack: (config) => {

    //修改文件引入自定义路径

    config.resolve.alias

      .set('@', resolve('src'))

      .set('~assets', resolve('src/assets'))

    // .set('ide',resolve('src/ide'))

  }

}