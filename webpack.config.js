const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  entry: [
    './main.js'
  ],
  output: {
    path: __dirname,
    filename: './public/bundle.js'
  }
}
