// NativeWind v4 + Expo SDK 51 + Reanimated 3.10.
// We can't use `nativewind/babel` directly because react-native-css-interop@0.2.3
// unconditionally requires `react-native-worklets/plugin` (only needed by Reanimated 4+).
// Inline css-interop's two required pieces and add the reanimated plugin manually.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      require.resolve('react-native-css-interop/dist/babel-plugin'),
      [
        '@babel/plugin-transform-react-jsx',
        { runtime: 'automatic', importSource: 'react-native-css-interop' },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
