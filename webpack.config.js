const fs = require('fs');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

const SRC_DIR = path.resolve(__dirname, 'src');
const ASSETS_DIR = path.resolve(__dirname, 'assets');

// Only files ending in `.build.js` or `.build.css` become output files.
// Everything else in /src is a helper that can be imported by them.
const BUILD_FILE = /\.build\.(js|css)$/;

/**
 * Walks /src and returns every file path matching BUILD_FILE.
 */
function findBuildFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findBuildFiles(fullPath);
    return BUILD_FILE.test(entry.name) ? [fullPath] : [];
  });
}

/**
 * Turns the list of build files into webpack entries.
 * `src/any/folder/foo.build.js`  -> `assets/foo.min.js`
 * `src/any/folder/foo.build.css` -> `assets/foo.min.css`
 */
function createEntries() {
  const entries = {};
  const sources = {};

  for (const file of findBuildFiles(SRC_DIR)) {
    const ext = path.extname(file);
    const name = path.basename(file).replace(BUILD_FILE, '');
    const key = `${name}${ext}`;

    if (sources[key]) {
      throw new Error(
        `Two build files would both produce assets/${name}.min${ext}:\n` +
          `  ${path.relative(__dirname, sources[key])}\n` +
          `  ${path.relative(__dirname, file)}\n` +
          'Rename one of them.'
      );
    }
    sources[key] = file;

    // A .js and .css with the same name share one entry, giving foo.min.js + foo.min.css.
    entries[name] = [...(entries[name] || []), file];
  }

  return entries;
}

module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production';
  const entry = createEntries();

  if (Object.keys(entry).length === 0) {
    console.warn('No *.build.js or *.build.css files found in /src. Nothing to build.');
  }

  return {
    mode: isProduction ? 'production' : 'development',
    entry,
    stats: 'minimal',
    // Shopify can't serve .map files from /assets, so dev maps are inlined and production has none.
    devtool: isProduction ? false : 'inline-source-map',
    output: {
      path: ASSETS_DIR,
      filename: '[name].min.js',
      // Never wipe /assets: it also holds all of Horizon's own files.
      clean: false,
    },
    resolve: {
      alias: { '@': SRC_DIR },
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            // Keep url(...) as written so Shopify asset URLs keep working.
            { loader: 'css-loader', options: { url: false } },
            'postcss-loader',
          ],
        },
      ],
    },
    plugins: [
      // Drops the empty .min.js webpack would otherwise create for CSS-only entries.
      new RemoveEmptyScriptsPlugin(),
      new MiniCssExtractPlugin({ filename: '[name].min.css' }),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: { format: { comments: false } },
        }),
        new CssMinimizerPlugin(),
      ],
      // One self-contained file per entry, no shared chunk files in /assets.
      splitChunks: false,
    },
    performance: { hints: false },
  };
};
