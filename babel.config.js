// Target browsers come from the "browserslist" field in package.json.
module.exports = (api) => {
  // Matches webpack's --mode (webpack passes it as the babel-loader "caller").
  const isDevelopment = api.caller((caller) => caller?.mode === 'development') ?? false;

  return {
    presets: [
      '@babel/preset-env',
      // JSX support. `automatic` means files don't need `import React from 'react'`.
      ['@babel/preset-react', { runtime: 'automatic', development: isDevelopment }],
    ],
  };
};
