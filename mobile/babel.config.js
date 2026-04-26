// SDK 55 setup: stock NativeWind preset (now compatible because we have
// react-native-worklets installed for Reanimated 4). babel-preset-expo
// auto-includes the reanimated worklets plugin.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
