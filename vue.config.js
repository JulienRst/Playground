module.exports = {
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.(glsl|vs|fs)$/,
          loader: 'ts-shader-loader'
        }
      ]
    }
  }
}