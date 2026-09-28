// Adds vendor prefixes (e.g. -webkit-) based on "browserslist" in package.json.
module.exports = {
  plugins: [require('autoprefixer')],
};
