const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  entry: [
    './main.js'
  ],
  output: {
    path: __dirname,
    filename: './public/bundle.js'
  },
  resolve: {
    alias: {
      three$: 'three/build/three.min.js',
      'three/.*$': 'three',
       // don't need to register alias for every module
    },
    // ...
  },
  plugins: [
    new webpack.ProvidePlugin({
      THREE: 'three',
      // ...
    }),
    // ...
],
}
