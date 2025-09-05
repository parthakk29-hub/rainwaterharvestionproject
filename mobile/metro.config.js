const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve node_modules issue
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules'),
  require('path').resolve(__dirname, '../node_modules'),
];

module.exports = config;