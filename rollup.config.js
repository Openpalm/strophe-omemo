import babel from 'rollup-plugin-babel';

export default {
  entry: 'js/strophe.omemo.js',
  dest: 'build/strophe.omemo.min.js',
  format: 'iife',
  sourceMap: 'inline',
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
  ],
};

